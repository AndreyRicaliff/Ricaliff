# 02 — Filas: Quando e Como Usar

## O que é

Fila é um buffer assíncrono entre um **producer** (quem gera trabalho) e um **consumer** (quem executa). Em vez de executar a operação na mesma request HTTP que a iniciou, você enfileira um job e retorna resposta imediatamente — o trabalho acontece em background.

O Meet Hub usa exatamente isso: `bot → captura vídeo → insere job na fila Bull → worker processa transcrição → salva no banco`. Se a transcrição fosse síncrona, a request HTTP do bot ficaria aberta por minutos esperando o Gemini responder.

---

### Por que fila — os 4 motivos reais

**1. Desacoplar producer de consumer (duração)**
```
Sem fila: POST /end-meeting → aguarda transcrição (3 min) → responde 200
Com fila: POST /end-meeting → insere job → responde 200 em 50ms → worker transcreve
```
O usuário não espera operação cara. A experiência melhora.

**2. Retry automático sem código extra**
```
Sem fila: transcrição falha → 500 para o usuário → dado perdido
Com fila: transcrição falha → job volta para a fila → retry em 30s → até N tentativas
```
Bull faz retry com backoff exponencial configurável. Sem código de retry manual.

**3. Throttle — respeitar rate limit de serviço externo**
```
ERP-externo: 350 requests/dia (Cliente Varejo)
Sem fila: 350 requests disparados em 1 segundo → 349 erros 429
Com fila: 1 job por segundo → 350 jobs em ~6 minutos → todos processados
```

**4. Absorver picos de tráfego**
```
Sem fila: 1000 usuários fazem upload simultâneo → banco sob stress → timeout
Com fila: 1000 jobs enfileirados → 10 workers → processados em ~100s → sem stress
```

---

### Bull: a implementação no Meet Hub

Bull é a biblioteca de filas para Node.js baseada em Redis. O Meet Hub já usa.

```ts
// Definição do producer (onde o job é criado):
import Queue from 'bull'

const transcriptionQueue = new Queue('transcription', {
  redis: { host: 'localhost', port: 6379 }
})

// Quando a reunião termina:
async function enqueueTranscription(recordingId: string, filePath: string) {
  await transcriptionQueue.add(
    { recordingId, filePath },
    {
      attempts: 3,              // tentar até 3 vezes
      backoff: {
        type: 'exponential',
        delay: 5000,            // 5s, 25s, 125s entre tentativas
      },
      removeOnComplete: true,   // remover job quando concluído com sucesso
      removeOnFail: false,      // manter job falho para análise
    }
  )
}

// Definição do consumer (worker que processa):
transcriptionQueue.process(
  3,  // concorrência: 3 jobs simultâneos
  async (job) => {
    const { recordingId, filePath } = job.data

    await job.progress(10)  // atualizar progresso para monitoramento
    const transcript = await transcribeWithGemini(filePath)

    await job.progress(80)
    await prisma.recording.update({
      where: { id: recordingId },
      data: { transcript, status: 'completed' }
    })

    await job.progress(100)
    return { recordingId, charCount: transcript.length }
  }
)

// Lidar com erros:
transcriptionQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message)
  // Alertar se atingiu tentativas máximas — vai para DLQ (failed queue do Bull)
})
```

---

### At-most-once vs At-least-once vs Exactly-once

Este é o conceito que separa candidatos em entrevista de system design.

**At-most-once (no máximo uma vez):**
```
Producer → Queue → Consumer (confirma recebimento ANTES de processar)
Se consumer cai durante processamento: job é perdido — não reprocessado
Use quando: duplicar é pior que perder (ex.: SMS de cobrança — melhor não cobrar que cobrar 2x)
```

**At-least-once (pelo menos uma vez):** — o padrão de Bull e a maioria das filas
```
Producer → Queue → Consumer (confirma recebimento DEPOIS de processar com sucesso)
Se consumer cai durante processamento: job é reprocessado (pode rodar 2+ vezes)
Use quando: perder é inaceitável e duplicar pode ser tratado com idempotência
```

**Exactly-once (exatamente uma vez):**
```
Na teoria: processamento garantido uma e exatamente uma vez
Na prática: não existe em sistemas distribuídos reais
```

> "Exactly-once delivery é um mito. O que existe é at-least-once delivery com idempotência no consumer." — toda pessoa que já trabalhou com filas distribuídas

**A consequência prática:** se você usa at-least-once (Bull, SQS, Kafka com retry), seu consumer PRECISA ser idempotente — pode receber o mesmo job duas vezes e o resultado deve ser o mesmo.

```ts
// Consumer idempotente para transcrição:
async function processTranscription(job: Job) {
  const { recordingId } = job.data

  // Verificar se já foi processado antes (idempotência)
  const existing = await prisma.recording.findUnique({
    where: { id: recordingId },
    select: { status: true }
  })

  if (existing?.status === 'completed') {
    return { skipped: true, reason: 'already processed' }
  }

  // Processar normalmente...
}
```

---

### Dead Letter Queue (DLQ)

Quando um job falha todas as tentativas configuradas, ele vai para a **DLQ** (no Bull: a "failed" queue). Sem DLQ, jobs que sempre falham são perdidos silenciosamente.

```ts
// Monitorar a DLQ do Bull:
const failedJobs = await transcriptionQueue.getFailed()
console.log(`DLQ size: ${failedJobs.length}`)

// Visualizar e reintentar job específico:
for (const job of failedJobs) {
  console.log({
    id: job.id,
    data: job.data,
    failedReason: job.failedReason,
    attemptsMade: job.attemptsMade,
  })

  // Após fix do bug, retentar:
  await job.retry()
}

// Bull Board: UI para monitorar filas em tempo real
// npm install @bull-board/express @bull-board/api
```

**Alertar quando DLQ cresce:** um job na DLQ indica problema sistemático — bug no consumer, serviço externo indisponível, dado inválido. Configurar alerta quando `failed` queue tiver mais de N jobs.

---

### Visibility Timeout

Conceito importante para filas gerenciadas (AWS SQS, Google Cloud Tasks):

```
Consumer pega job → Visibility Timeout começa (ex: 30s)
Durante esses 30s: o job fica "invisível" para outros consumers
Consumer termina em 20s → confirma → job deletado da fila
Consumer cai em 15s → timeout expira → job fica visível novamente → outro consumer pega

Implicação: o job pode ser reprocessado se o consumer demorar mais que o visibility timeout
Configurar visibility timeout > tempo máximo de processamento esperado
```

No Bull, isso é o `lockDuration` — padrão 30s, configurável.

---

## Por que cai em entrevista

"Por que você usaria uma fila aqui?" é pergunta de system design frequente. Entrevistadores querem ouvir: desacoplo producer de consumer, retry grátis, absorvo pico, resposta síncrona imediata. Quem responde só "para ser assíncrono" não convence.

Latência de referência:
- Bull job enqueue: ~1ms (Redis write)
- Bull job process (latência até consumer pegar): ~10ms em idle
- SQS standard: até 1s de latência
- Kafka (streaming): ~10ms end-to-end p99

---

## Trade-offs

| Abordagem | Vantagem | Custo |
|---|---|---|
| Processamento síncrono | Simples, sem infra extra | Timeout HTTP; sem retry; escala acoplada |
| Bull + Redis | Fácil, bom DX, UI disponível | Redis como dep; só Node; sem durabilidade de mensagem se Redis cair sem persistência |
| AWS SQS | Gerenciado, durável, escala automática | Latência maior; custo por request |
| Kafka | Retenção de mensagens, replay, streaming | Overhead operacional alto; overkill para AG atual |
| Postgres como fila (SKIP LOCKED) | Zero infra extra | Mais lento; sem retry nativo; polução do banco |

Para a AG: Bull + Redis é a escolha correta. Kafka seria over-engineering. Postgres como fila seria gambiarra.

---

## Exercício aplicado (projeto AG real)

```bash
# Documentar a arquitetura de fila do Meet Hub

cd ~/projetos/meet-hub

# 1. Encontrar configuração das filas Bull
grep -rn "new Queue\|Bull\|bull" apps/api/src/ apps/bot/ \
  --include="*.ts" --include="*.js" | grep -v "//\|node_modules"

# 2. Listar os tipos de jobs
grep -rn "\.add(\|\.process(" apps/api/src/ apps/bot/ \
  --include="*.ts" --include="*.js" | grep -v "node_modules"

# 3. Verificar configurações de retry
grep -rn "attempts\|backoff\|delay\|removeOnFail" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"

# 4. Verificar se workers são idempotentes
# Buscar por verificação de status antes de processar
grep -rn "status.*completed\|already.*processed\|idempotent" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"

# 5. Verificar monitoramento da DLQ
grep -rn "getFailed\|on.*failed\|DLQ\|dead.letter" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] documentação filas Meet Hub

**Filas identificadas:**
| Nome | Producer | Consumer | Concorrência | Retry |
|---|---|---|---|---|
| [listar após grep] | | | | |

**Jobs idempotentes?** [sim/não — listar verificações encontradas]

**DLQ monitorada?** [sim/não]

**Visibility timeout configurado:** [valor ou "não encontrado"]

**Diagrama do fluxo:**
bot captura vídeo
       ↓
POST /api/meetings/end
       ↓
transcriptionQueue.add({ recordingId, filePath })
       ↓ (imediato — 200 OK retorna aqui)
Redis armazena job
       ↓
Worker pega job (concorrência: N)
       ↓
Gemini transcribe (tempo: ~30s–3min por reunião)
       ↓
prisma.recording.update({ transcript, status: 'completed' })
       ↓ (em caso de falha)
Retry com backoff: 5s → 25s → 125s
       ↓ (após N falhas)
DLQ (failed queue) → alerta

**Lacunas identificadas:**
- [listar o que falta: idempotência, DLQ monitoring, etc.]
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que você usaria uma fila para processar transcrições em vez de fazer de forma síncrona?"
>
> **R (30s):**
> "Três motivos. Primeiro, transcrição leva minutos — não posso deixar a request HTTP aberta esperando. Com fila, respondo imediato e processo em background. Segundo, se a API do Gemini estiver instável, o job fica na fila e é reprocessado automaticamente com backoff — sem código de retry manual. Terceiro, posso controlar concorrência: se tenho 6 bots gravando ao mesmo tempo, processo 3 transcrições em paralelo e os outros 3 jobs esperam — evito sobrecarregar a API de transcrição e o banco."

> **P:** "O que é exactly-once delivery? Você consegue garantir isso?"
>
> **R (30s):**
> "Exactly-once em sistemas distribuídos é impossível na prática. O que você pode ter é at-least-once — o job pode ser entregue mais de uma vez — combinado com consumer idempotente. No Meet Hub, antes de processar uma transcrição, o worker verifica se `recording.status === 'completed'`. Se sim, ignora o job. Então mesmo que o job seja entregue duas vezes, o resultado é o mesmo: a transcrição existe uma única vez no banco."

---

## Checkpoint

- [ ] Consigo explicar os 4 motivos para usar fila (desacoplamento, retry, throttle, pico) sem consultar
- [ ] Sei a diferença entre at-most-once, at-least-once e exactly-once e por que exactly-once não existe
- [ ] Documentei a arquitetura de filas do Meet Hub com o diagrama de fluxo
- [ ] Sei o que é DLQ e como monitorar no Bull
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Bull documentation](https://github.com/OptimalBits/bull) — configuração e API completa
- [Bull Board](https://github.com/felixmosh/bull-board) — UI para monitorar filas
- [AWS SQS — Message lifecycle](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-lifecycle.html) — boa explicação de visibility timeout
- Martin Kleppmann — *Designing Data-Intensive Applications* (cap. 11 — Streaming) — a referência em "exactly-once é mito"
