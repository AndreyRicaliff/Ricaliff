# 07 — Além do REST

## O que é

REST domina, mas não é o único jeito de duas máquinas conversarem. GraphQL, webhooks e gRPC resolvem dores específicas que REST atende mal. Saber **quando** cada um ganha é o que diferencia quem decide arquitetura de quem só segue tutorial.

## GraphQL — over/under-fetching

REST tem endpoints fixos com payload fixo. Daí dois problemas:

- **Over-fetching:** `/users/42` devolve 30 campos, você queria 2. Banda e parsing desperdiçados.
- **Under-fetching (N+1 requests):** pra montar uma tela você chama `/users/42`, depois `/users/42/posts`, depois `/posts/9/comments`... 3+ round-trips.

GraphQL inverte: **o cliente declara exatamente o que quer** numa query única, e o servidor devolve esse shape.

```text
query {
  user(id: 42) {
    name
    posts(last: 3) { title comments { text } }
  }
}
```

```json
{ "data": { "user": { "name": "Ana",
  "posts": [{ "title": "...", "comments": [{ "text": "..." }] }] } } }
```

Um endpoint (`POST /graphql`), zero over/under-fetching, schema tipado e introspectável. **Custos:** cache HTTP fica difícil (tudo é POST na mesma URL), uma query mal feita pode ser pesadíssima (precisa de limite de profundidade/custo), e o problema N+1 muda de lugar (vira resolver — exige *dataloader* pra batch no banco).

## Webhooks — inversão de controle

REST é *pull*: você pergunta, a API responde. Mas e quando o evento nasce **no servidor** (pagamento aprovado, build terminou)? Ficar em *polling* (`GET /status` a cada 5s) é desperdício e tem latência.

Webhook inverte: **o servidor te chama** quando o evento acontece. Você registra uma URL; o provedor faz um `POST` nela com o payload do evento.

```text
sem webhook (polling):   você → GET /status → "pending"  (repete... repete...)
com webhook (push):      evento ocorre → provedor → POST https://voce.com/hook
```

```http
POST /webhooks/stripe HTTP/1.1
Stripe-Signature: t=1735...,v1=8f3a...
Content-Type: application/json

{"type":"payment.succeeded","data":{"id":"pi_42","amount":9900}}
```

Regras de ouro ao **receber** webhook: (1) **verifique a assinatura** (HMAC no header) — qualquer um pode dar POST na sua URL; (2) responda `2xx` **rápido** e processe async (o provedor tem timeout e re-tenta); (3) seja **idempotente** — re-entregas acontecem, dedup pelo id do evento.

## gRPC / protobuf em um parágrafo

gRPC é RPC binário sobre HTTP/2 da Google: você define o contrato (serviços e mensagens) num arquivo `.proto`, e um gerador cria client e server tipados em várias linguagens. As mensagens viajam em **Protocol Buffers** — formato binário compacto e rápido de serializar (bem menor que JSON, sem parsing de texto). Ganha em **comunicação serviço-a-serviço interna** (alta vazão, baixa latência, streaming bidirecional via HTTP/2), perde em ser ilegível por humano e mal suportado direto no browser (precisa de proxy/gRPC-Web). É o "REST do backend interno".

## Quando escolher cada um

```text
REST     → CRUD sobre recursos, API pública, precisa de cache HTTP,
           consumidores diversos. O default — não erra.
GraphQL  → cliente rico (mobile/SPA) com necessidades de dados variadas,
           muitas telas montando shapes diferentes, quer evitar N+1 de rede.
Webhook  → eventos assíncronos nascidos no servidor (pagamento, CI, mensagem)
           — complementa qualquer uma das outras, não substitui.
gRPC     → microsserviços internos, alta performance, streaming,
           contrato forte entre times. Não pra browser direto.
```

**Em entrevista:** "REST é o default pra recursos e cache. GraphQL deixa o cliente pedir exatamente os campos numa query só, matando over e under-fetching — ao custo de cache HTTP difícil e queries potencialmente caras. Webhook inverte o controle: em vez de eu fazer polling, o servidor me dá POST quando o evento ocorre (verifico assinatura e trato idempotente). gRPC é RPC binário com protobuf sobre HTTP/2, ótimo entre microsserviços internos pela vazão, ruim pra browser."
