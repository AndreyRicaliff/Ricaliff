# 05 — Assíncrono e filas

## O que é

Nem todo trabalho precisa acontecer **dentro** do request. Gerar um relatório de 30s, enviar e-mail, transcodificar vídeo, sincronizar com ERP — se você faz isso no request, o usuário fica travado esperando e seu servidor fica com uma conexão presa pelo tempo todo. A solução é **processamento assíncrono**: o request só **enfileira** o trabalho e responde na hora; um **worker** separado executa depois. A peça que conecta os dois é a **fila de mensagens (message queue)**.

---

### Por que não fazer trabalho pesado no request

```text
Síncrono (ruim para trabalho pesado):
  POST /relatorio → [gera por 30s] → responde
  - usuário espera 30s olhando spinner
  - 1 conexão/thread presa por 30s. 100 relatórios juntos = 100 slots travados
  - se cair no meio, perdeu tudo, sem retry
  - timeout do navegador/proxy (geralmente ~30-60s) mata a request

Assíncrono (certo):
  POST /relatorio → enfileira job → responde 202 "aceito, processando" (50ms)
  worker pega o job da fila → gera → grava resultado / notifica
  - usuário liberado na hora; consulta o status depois (polling/websocket)
  - request volta a aguentar alta vazão
```

Regra: **se o trabalho é lento, variável, ou pode ser refeito, tire do caminho do request.**

---

### Producer / consumer e workers

```text
┌──────────┐   enfileira   ┌─────────┐   consome   ┌──────────┐
│ Producer │ ────────────▶ │  Queue  │ ──────────▶ │ Consumer │
│  (API)   │   mensagem    │ (Redis/ │   mensagem  │ (worker) │
└──────────┘               │  SQS..) │             └──────────┘
                           └─────────┘
```

- **Producer (produtor):** quem cria o trabalho (sua API ao receber o request).
- **Queue (fila):** buffer durável que guarda as mensagens até alguém processar. Redis/BullMQ, RabbitMQ, AWS SQS, Kafka.
- **Consumer/worker:** processo separado que tira mensagens da fila e executa.

Escala bonita: **mais carga? mais workers.** A fila desacopla a velocidade de chegada da velocidade de processamento. Pico de 1.000 jobs/min com workers que fazem 100/min cada → suba 10 workers. A fila absorve a rajada; os workers drenam no ritmo deles.

---

### At-least-once e a obrigação de idempotência

Quase toda fila entrega **at-least-once** (pelo menos uma vez): se o worker processa mas cai antes de confirmar (ack), a mensagem volta pra fila e é processada **de novo**. "Exactly-once" é praticamente um mito em sistemas distribuídos.

Consequência: **o consumer tem que ser idempotente** — processar a mesma mensagem 2x dá o mesmo resultado que processar 1x.

```ts
// NÃO idempotente: reprocessar cobra o cliente duas vezes
async function onPaymentJob(job: { orderId: string; amount: number }) {
  await chargeCard(job.amount)              // ⚠ roda de novo no retry → cobra 2x
  await db.order.update({ where: { id: job.orderId }, data: { paid: true } })
}

// Idempotente: chave única protege contra reprocessamento
async function onPaymentJob(job: { orderId: string; amount: number }) {
  const already = await db.payment.findUnique({ where: { orderId: job.orderId } })
  if (already) return                       // já processado → no-op
  await chargeCard(job.amount)
  await db.payment.create({ data: { orderId: job.orderId, amount: job.amount } })
}
```

**Em entrevista:** "Filas entregam at-least-once, então o consumer pode ver a mesma mensagem duas vezes — por retry ou por falha após processar e antes do ack. Por isso todo consumer precisa ser idempotente: uso uma chave única (id do pedido) pra detectar 'já fiz isso' e virar no-op. Foi assim que fiz o sync incremental do Cliente Oficina sem duplicar registro."

---

### Retry e dead-letter queue (DLQ)

Quando um job falha (API externa fora, erro transitório), você **tenta de novo** — mas com cuidado:

```text
Retry com backoff exponencial: espera 1s, 2s, 4s, 8s... entre tentativas
  (evita martelar um serviço que já está sofrendo)
+ jitter (aleatório) pra não sincronizar todos os retries no mesmo instante

Após N tentativas falhando → manda pra DEAD-LETTER QUEUE (DLQ):
  uma fila separada de "jobs que não deram certo".
  Em vez de retry infinito (que entope a fila), você isola, alerta
  e investiga manualmente. A DLQ é a sua caixa de "deu ruim, olha isso".
```

Sem DLQ, um job venenoso (que sempre falha) fica em loop eterno consumindo workers e nunca sai da fila.

---

### Backpressure — quando a fila enche

**Backpressure (contrapressão)** é o que fazer quando os produtores geram trabalho mais rápido do que os consumidores conseguem drenar. A fila cresce sem parar → memória estoura, latência dos jobs dispara.

```text
Chegam 1.000 jobs/min, workers processam 600/min → fila cresce 400/min, infinito
```

Respostas:
```text
- Escalar consumers (mais workers) — a primeira reação
- Limitar o producer (rate limit): rejeitar/atrasar quem produz demais
- Bounded queue: fila com tamanho máximo; cheia → rejeita novos (429) ou descarta
- Load shedding: em sobrecarga, derrubar trabalho de baixa prioridade de propósito
```

A ideia central: **um sistema saudável sob sobrecarga degrada de forma controlada**, não estoura silenciosamente. A fila te dá o sinal (profundidade da fila crescendo) pra reagir.

---

### Resumo

| Conceito | Para quê |
|---|---|
| Fila de mensagens | Desacoplar chegada de processamento; absorver picos |
| Worker / consumer | Processar trabalho pesado fora do request; escala = mais workers |
| Idempotência | Sobreviver ao at-least-once sem efeito duplicado |
| Retry + backoff | Tratar falha transitória sem martelar |
| Dead-letter queue | Isolar job venenoso pra não travar a fila |
| Backpressure | Degradar controlado quando produz mais do que consome |

Conexão real: o Meet Hub usa fila (Bull) pra bot → gravação → transcrição → storage. O request só enfileira; o worker faz o trabalho lento. É exatamente este módulo na prática.
