# 04 — Padrões de Comunicação

## O que é

Sistemas distribuídos precisam trocar dados. A forma como eles trocam é a escolha de comunicação — e cada padrão tem modelo mental diferente, garantias diferentes e falhas diferentes. Escolher errado não quebra imediatamente: cobra o custo meses depois quando você tenta escalar, debugar ou garantir que o dado não se perdeu.

```
REST (Request-Response síncrono)
  Cliente ──── POST /recordings ────→ Servidor
  Cliente ←─── 201 { id: "..." } ──── Servidor
  Cliente espera. Se servidor cair: erro imediato.

Webhook (Push assíncrono)
  Servidor externo ──── POST /webhook/evento ────→ Seu servidor
  Ninguém espera resposta — é fire-and-forget do lado de quem envia.
  ERP-externo faz isso no Cliente Varejo.

Queue (Desacoplado assíncrono)
  Produtor ──→ [ Redis/Bull ] ──→ Worker processa quando puder
  Produtor não sabe quando será processado. Worker pode morrer e recomeçar.
  Meet Hub usa isso: rota cria job, worker processa bot.

SSE (Server-Sent Events — push unidirecional)
  Cliente abre conexão HTTP longa.
  Servidor empurra eventos quando quiser.
  Cliente não envia dados por SSE — só recebe.
  Meet Hub usa isso para atualizar status em tempo real no front.

WebSocket (Bidirecional)
  Conexão persistente, ambos enviam e recebem.
  Complexidade maior: precisa gerenciar estado de conexão, reconexão, heartbeat.
  Vale para chat, jogo, colaboração em tempo real.

gRPC (RPC tipado com Protobuf)
  Chamada de função remota com contrato binário.
  Mais eficiente que REST/JSON. Mais complexo de configurar.
  Vale quando latência é crítica e times definem contrato explícito.
```

---

## Por que cai em entrevista

Mostra se você pensa em sistemas ou só em endpoints.

- "Como você implementaria notificações em tempo real?"
- "Qual a diferença entre SSE e WebSocket? Quando cada um?"
- "O que é idempotência e por que ela importa em webhooks?"
- "Por que usar queue em vez de chamar o serviço diretamente?"
- "Como você garantiria que um webhook não processe o mesmo evento duas vezes?"
- "REST vs gRPC — quando você escolheria cada um?"

---

## Trade-offs (quando usar X vs Y)

| Padrão | Modelo | Quando usar | Quando não usar |
|---|---|---|---|
| REST | Síncrono, request/response | CRUD, APIs públicas, comunicação simples entre sistemas | Operações longas (cliente fica esperando), alta frequência de eventos |
| gRPC | Síncrono, contrato tipado | Comunicação interna entre serviços com baixa latência; streaming bidirecional | APIs públicas (binário é difícil de debugar), equipes sem disciplina de contrato |
| Webhook | Assíncrono push, sem estado | Notificações de eventos externos (pagamento, integração SaaS) | Quando precisa garantia de entrega ou ordem dos eventos |
| Queue | Assíncrono desacoplado | Trabalhos demorados, spike de carga, retry automático | Operação que o usuário precisa da resposta imediata |
| SSE | Push unidirecional | Status em tempo real, feeds, progresso de jobs | Comunicação bidirecional (use WebSocket), alta frequência de mensagens |
| WebSocket | Bidirecional persistente | Chat, jogos, colaboração ao vivo | Feeds simples de status (SSE é suficiente e mais simples) |

**Idempotência:** uma operação é idempotente quando executá-la N vezes tem o mesmo resultado que executar 1 vez. Em webhooks e queues, isso é fundamental — o sistema pode reenviar o evento. Se seu handler não for idempotente, você processa o mesmo pagamento duas vezes.

```ts
// Não idempotente: cria um novo registro sempre
async function handlePaymentWebhook(payload: PaymentEvent) {
  await db.payments.insert({ orderId: payload.orderId, amount: payload.amount })
}

// Idempotente: usa o ID do evento como chave única
async function handlePaymentWebhook(payload: PaymentEvent) {
  await db.payments.upsert({
    where: { externalId: payload.eventId },  // já processou? ignora
    create: { externalId: payload.eventId, orderId: payload.orderId, amount: payload.amount },
    update: {}
  })
}
```

---

## Exercício aplicado (projeto AG real)

Classifique os padrões de comunicação de cada projeto AG e identifique onde idempotência é necessária.

### Passo a passo

1. **Meet Hub — verificar SSE:**
   ```bash
   grep -rn "text/event-stream\|res.write\|event:" ~/projetos/meet-hub/apps/api/src/ --include="*.ts" | head -10
   ```
   Confirme que o SSE está em `services/sse.ts` e as rotas que o usam. SSE é push unidirecional — o front recebe atualização de status sem polling.

2. **Meet Hub — verificar Queue:**
   ```bash
   grep -rn "botQueue\|\.process\|\.add(" ~/projetos/meet-hub/apps/api/src/ --include="*.ts" | head -10
   ```
   Confirme que `botQueue.add()` é o produtor (rota) e `botQueue.process()` é o worker. Por que Queue aqui em vez de chamar direto? Porque gravar reunião leva minutos — o cliente não pode esperar HTTP aberto por 10 minutos.

3. **Cliente Varejo — verificar webhook ERP-externo:**
   ```bash
   ls ~/projetos/cliente-varejo/ && grep -rn "webhook\|POST.*erp-externo\|erp-externo.*POST" ~/projetos/cliente-varejo/ 2>/dev/null | head -10
   ```
   Entenda como a ERP-externo notifica seu sistema. Existe handler de idempotência? Se não, o mesmo evento pode ser processado duas vezes.

4. **CLIENTE OFICINA — classificar o padrão:**
   ```bash
   cat ~/projetos/cliente-oficina-backend/src/server.ts 2>/dev/null | head -30
   ```
   O OFICINA não é event-driven — é um cron job que polling o Firebird em intervalo fixo. Isso é pull periódico, não webhook nem queue. É válido para sync de dados legados onde o sistema de origem não tem API.

5. **Monte a tabela de classificação** (escreva no papel):

   | Projeto | Comunicação | Padrão | Idempotência necessária? |
   |---|---|---|---|
   | Meet Hub API → Front | SSE | Push unidirecional | Não (eventos são status, não transações) |
   | Meet Hub API → Bot | Queue (Bull/Redis) | Assíncrono desacoplado | Sim (job pode ser reprocessado) |
   | Meet Hub Front → API | REST | Síncrono | Depende do endpoint |
   | Cliente Varejo ← ERP-externo | Webhook | Push assíncrono | Sim (evento pode ser reenviado) |
   | CLIENTE OFICINA → Supabase | REST polling (cron) | Pull periódico | Sim (upsert por ID) |

6. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Escolha de SSE vs WebSocket para status em tempo real

   **Problema:** front precisa receber atualizações de status de gravação sem polling.
   **Opções:**
   - WebSocket: bidirecional, mais complexo, gerencia estado de conexão
   - SSE: unidirecional (servidor → cliente), HTTP nativo, reconexão automática do browser
   **Decisão:** SSE.
   **Por quê:** o front só precisa receber status — nunca envia dados pelo canal de tempo real. SSE é simples, HTTP-nativo e tem reconexão automática. WebSocket seria overkill.
   **Como explicar em entrevista (30s):**
   > "Usei SSE em vez de WebSocket porque o fluxo é unidirecional: servidor empurra status de gravação pro front. WebSocket faz sentido quando ambos os lados enviam mensagens em tempo real. Para notificação de progresso, SSE é mais simples e tem reconexão automática nativa do browser."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você usaria SSE em vez de WebSocket?"
>
> **R (30s):**
> "SSE é HTTP unidirecional — servidor empurra eventos para o cliente, mas o cliente não envia dados pelo mesmo canal. WebSocket é bidirecional: os dois lados enviam mensagens sobre a mesma conexão.
>
> Escolho SSE quando o fluxo é só de servidor para cliente: progresso de job, notificações, feed de status. O Meet Hub usa SSE para atualizar o front sobre o andamento da gravação — perfeito pra isso. Escolho WebSocket para chat ou colaboração em tempo real, onde o cliente também precisa enviar dados pelo canal persistente."

> **P:** "O que é idempotência e por que ela importa em webhooks?"
>
> **R (30s):**
> "Idempotência é a propriedade de que executar a operação N vezes tem o mesmo resultado que executar 1 vez. Em webhooks, o sistema que envia pode reenviar o evento se não receber confirmação — a Stripe, por exemplo, tenta até 3 vezes. Se o meu handler não for idempotente, eu processo o mesmo pagamento duas vezes. A solução padrão é guardar o ID do evento e checar antes de processar: se já existe, ignora. Isso é upsert por chave externa, não insert cego."

---

## Checkpoint

- [ ] Consigo classificar o padrão de comunicação de cada projeto AG sem consultar
- [ ] Sei quando escolher SSE vs WebSocket com justificativa concreta
- [ ] Implementei (ou sei implementar) handler idempotente com upsert por externalId
- [ ] Entendo por que o Meet Hub usa Queue em vez de chamar bot diretamente
- [ ] Recitei as respostas de entrevista em menos de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Padrões de Comunicação dominado`.

---

## Recursos

- MDN — [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- Martin Fowler — [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- Bull docs — [Queue patterns](https://docs.bullmq.io/guide/patterns)
- Código real: `~/projetos/meet-hub/apps/api/src/services/sse.ts` — implementação real de SSE
- Código real: `~/projetos/meet-hub/apps/api/src/services/queue.ts` — Bull queue em uso real
