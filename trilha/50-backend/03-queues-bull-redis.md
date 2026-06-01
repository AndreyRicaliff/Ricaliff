# 03 — Filas com Bull e Redis

## O que é

Uma fila desacopla o recebimento de trabalho da execução. Em vez de fazer tudo na requisição HTTP (que tem timeout, bloqueia a resposta, perde o trabalho se o processo reinicia), você enfileira um job e responde imediatamente. Um worker processa o job em background.

**Por que fila e não apenas `setTimeout` ou Promise?**
- **Durabilidade:** job no Redis sobrevive a reinicializações do processo. Promise na memória não.
- **Retry automático:** job que falha pode ser reprocessado com backoff exponencial. Promise rejeitada some.
- **Throttle:** controlar quantos jobs rodam em paralelo. Promises disparam todas ao mesmo tempo.
- **Monitoramento:** ver jobs em fila, em processamento, falhados, concluídos.

**Bull/BullMQ job lifecycle:**

```
waiting → active → completed
                ↘ failed → (retry) → waiting
                         ↘ (max retries) → dead letter
```

```typescript
import { Queue, Worker } from 'bullmq'

// Produtor — adiciona job à fila
const transcriptionQueue = new Queue('transcription', {
  connection: { host: 'localhost', port: 6379 }
})

await transcriptionQueue.add('process', { recordingId: '123' }, {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 }
})

// Worker — processa job
const worker = new Worker('transcription', async (job) => {
  const { recordingId } = job.data
  await processRecording(recordingId)
}, { connection: { host: 'localhost', port: 6379 } })

worker.on('failed', (job, error) => {
  logger.error({ jobId: job?.id, error }, 'transcription job failed')
})
```

**Retry strategies:**

```typescript
// Exponential backoff — 2s, 4s, 8s entre retries
{ attempts: 3, backoff: { type: 'exponential', delay: 2000 } }

// Fixed delay — sempre 5s
{ attempts: 5, backoff: { type: 'fixed', delay: 5000 } }

// Sem retry — falhou, morreu
{ attempts: 1 }
```

**Dead letter queue:** jobs que esgotaram todos os attempts ficam no estado `failed` com o erro. Não se perdem — podem ser inspecionados, re-enfileirados manualmente ou alertados.

**Idempotência em jobs:** se um job for processado duas vezes (retry após crash no meio), o resultado deve ser o mesmo. `UPSERT` em vez de `INSERT`, verificar se já foi processado antes de fazer efeito colateral.

**CPU-bound vs IO-bound:**

| Tipo | Exemplo no Meet Hub | Implicação |
|---|---|---|
| IO-bound | Download de arquivo, envio de email, webhook | Concorrência alta (10–50) — passa o tempo esperando I/O |
| CPU-bound | Transcrição com Whisper, encoding de vídeo | Concorrência baixa (1–2) — passa o tempo usando CPU |

```typescript
// Controlar concorrência por worker
const worker = new Worker('transcription', processor, {
  connection,
  concurrency: 2  // max 2 jobs simultâneos neste worker
})
```

**Armadilha comum de júnior:** não fechar o worker gracefully ao parar o processo. Jobs em processamento são marcados como `stalled` e reprocessados — duplicata se o handler não for idempotente.

---

## Por que cai em entrevista

Filas aparecem em qualquer entrevista de backend com requisito de processamento assíncrono. Variações:

- "Como você processaria 1000 emails sem bloquear a API?"
- "O que acontece se o worker cair no meio de um job?"
- "Qual a diferença entre retry com backoff exponencial e fixo?"
- "O que é idempotência e por que importa em jobs?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Email em resposta a ação do usuário | Fila com retry 3x | API responde imediatamente, email garantido |
| Transcrição de áudio (1–2 min por arquivo) | Fila com concurrency 2 | CPU-bound, não escala com muitos paralelos |
| Webhook de terceiro | Fila com retry exponencial | Terceiro pode estar lento temporariamente |
| Job que não pode duplicar | Idempotency key + UPSERT no handler | Retry seguro |
| Urgente (sub-segundo) | Sem fila — processamento síncrono | Fila adiciona latência |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver as filas do Meet Hub api
find ~/projetos/meet-hub/apps/api/src -name "*queue*" -o -name "*worker*" -o -name "*bull*" 2>/dev/null

# Ver configuração de retry e concorrência
grep -rn "attempts\|backoff\|concurrency" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null
```

Para cada fila/worker encontrado, classificar:
1. CPU-bound ou IO-bound? (transcrição = CPU-bound; envio de webhook = IO-bound)
2. Tem retry configurado? Com qual strategy?
3. O handler é idempotente? (roda 2x produz o mesmo resultado?)
4. Tem close() chamado no graceful shutdown?

```markdown
## 2026-06-XX — [arch] auditoria das filas do Meet Hub

**Filas encontradas:**
- transcription: CPU-bound (Whisper) — concorrência 1 ou 2
- notification: IO-bound (email/webhook) — pode ter concorrência maior

**Findings:**
- Fila de transcrição sem concorrência configurada — usa default, pode sobrecarregar CPU com múltiplos jobs
- Handler de transcrição não verifica se já foi processado — retry duplicaria o processamento

**Decisões:**
- Adicionar `concurrency: 2` no worker de transcrição
- Adicionar check: `if (recording.status === 'transcribed') return` no início do handler

**Como explicar em entrevista (30s):**
> "No Meet Hub usamos BullMQ para a fila de transcrição. A transcrição é CPU-bound, então limitei a concorrência a 2 workers. Adicionei idempotência verificando o status da gravação no início do handler — se já foi transcrita, o worker retorna sem fazer nada, então retry não duplica. Configurei backoff exponencial de 2s para 3 tentativas porque o Whisper pode falhar por limite de memória temporário."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que acontece se o worker cair no meio de um job?"
>
> **R (30s):**
> "Bull marca o job como `stalled` após um timeout configurável. Quando um novo worker assume ou o mesmo reinicia, o job volta para `waiting` e é reprocessado. Por isso idempotência no handler é obrigatória — se o job rodar duas vezes, o resultado tem que ser o mesmo. Na prática: verificar se o efeito colateral já aconteceu antes de fazê-lo. No Meet Hub, o worker de transcrição checa se o campo `status` da gravação já é `'transcribed'` antes de chamar o Whisper — se sim, retorna imediatamente sem trabalho duplicado."

> **P:** "Quando você escolheria backoff exponencial em vez de delay fixo?"
>
> **R (30s):**
> "Exponencial para falhas que podem ser temporárias e causadas por sobrecarga — API de terceiro, serviço externo sobrecarregado. Retry imediato ou com delay fixo curto vai piorar a situação — você e outros clientes bombardeando o serviço já sobrecarregado. Exponencial dá espaço para o problema se resolver: 2s, 4s, 8s, 16s. Delay fixo faz sentido quando o problema tem uma causa conhecida e um tempo de recuperação previsível — 'o banco reinicia e fica disponível em 30s', por exemplo."

---

## Checkpoint

- [ ] Sei explicar o ciclo de vida de um job (waiting → active → completed/failed)
- [ ] Sei a diferença entre job CPU-bound e IO-bound e a implicação para concorrência
- [ ] Li as filas do Meet Hub e classifiquei por tipo de carga
- [ ] Sei explicar idempotência em contexto de retry
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Filas Bull/Redis dominado`.

---

## Recursos

- BullMQ Docs — [Retrying Failing Jobs](https://docs.bullmq.io/guide/retrying-failing-jobs)
- BullMQ Docs — [Concurrency](https://docs.bullmq.io/guide/workers/concurrency)
- `~/projetos/meet-hub/apps/api/src/` — implementação real de workers
- Redis Docs — [RPUSH / LPOP](https://redis.io/commands/rpush/) (para entender o primitivo que Bull usa)
