# 04 — Timeouts e Cancelamento

## O que é

Todo `await` de rede é uma promessa que pode **nunca resolver**. A rede não te avisa que travou — ela simplesmente fica pendurada. Sem timeout explícito, uma chamada lenta a um ERP externo não vira erro: vira um request que ocupa uma conexão, uma thread do pool, um slot de concorrência, para sempre. Some o suficiente disso e o serviço inteiro para — não porque quebrou, mas porque está todo mundo esperando. É o modo de falha mais traiçoeiro: nada dá erro, tudo só fica lento até morrer.

A regra é dura: **nenhuma operação de I/O sem prazo**. `fetch`, query de banco, chamada a fila, leitura de arquivo em rede — cada uma precisa de um limite de tempo além do qual você desiste e decide o que fazer. "O default do sistema operacional resolve" é ilusão: o TCP keepalive padrão do Linux é de **duas horas**. Duas horas segurando um recurso porque ninguém definiu prazo.

**Timeout em cascata — a armadilha que quase todo mundo erra.** Se o handler A tem timeout de 5s e chama B (timeout 5s) que chama C (timeout 5s), o orçamento total não é 5s — é 15s no pior caso, e A já desistiu enquanto B e C ainda trabalham à toa. O certo é **orçamento decrescente**: A passa a B "você tem 4s"; B passa a C "você tem 3s". O total tem que ser MENOR que a soma das partes, não maior. Cada camada recebe o tempo restante, não um prazo fixo.

### Passo-a-passo: AbortController em fetch

O `AbortController` é o mecanismo nativo de cancelamento do JS. Ele produz um `signal` que, quando abortado, rejeita o `fetch` na hora e — crucial — sinaliza pro servidor via cancelamento da conexão:

```ts
async function fetchComPrazo(url: string, ms: number) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { signal: ac.signal });
  } finally {
    clearTimeout(timer);   // sempre limpa — senão vaza timer e handle
  }
}
```

O `finally` não é opcional: sem ele, o timer continua vivo mesmo quando o fetch resolve rápido, segurando o event loop e acumulando handles. Cancelamento e limpeza são a mesma responsabilidade.

**No sync ERP da AG** (Cliente Varejo), o `AbortController` faz dupla função: corta a chamada que passou do orçamento E aborta a varredura inteira quando a Edge Function está prestes a ser morta pelo runtime (`waitUntil` com deadline). Sem isso, a última página ficaria pendurada e o processo morreria no meio de um upsert.

### O que fazer no estouro

Timeout não é o fim — é uma decisão. Ao estourar, você escolhe: **retry** (se for transiente e idempotente — módulos 02 e 03), **fallback** (dado em cache, valor degradado — módulo 05), ou **falha explícita** (erro com contexto: "ERP não respondeu em 4s", não "erro interno"). O que você nunca faz é engolir em silêncio. Um timeout silencioso é um bug esperando virar incidente às 3h.

## Por que cai em entrevista

É o teste de quem já viu produção travar. "Por que um serviço fica lento e cai sem dar erro?" separa quem sabe que timeout ausente é a causa raiz mais comum de degradação em cascata. E "timeout em cascata" é pergunta de nível pleno — quase todo júnior põe o mesmo prazo em cada camada e não percebe que somou.

> **P:** "Um endpoint seu ficou 'pendurado' em produção sob carga. Sem erro nos logs. O que houve e como você previne?"
>
> **R (30s):** "Provavelmente uma chamada de rede sem timeout — o banco ou uma API externa parou de responder e cada request ficou esperando, ocupando conexão do pool até esgotar. Não dá erro porque tecnicamente ninguém falhou, só ninguém respondeu. Previno com timeout explícito em todo I/O via AbortController, e com orçamento decrescente em cascata: cada camada recebe o tempo restante, não um prazo fixo, senão o total fica maior que a soma. No estouro, decido entre retry, fallback ou erro com contexto — nunca silêncio."

## Checkpoint

- [ ] Explico por que I/O sem timeout trava o serviço sem gerar erro
- [ ] Implementei `fetchComPrazo` com AbortController + limpeza no `finally`
- [ ] Sei desenhar orçamento de tempo decrescente numa cadeia A→B→C
- [ ] Defendo as 3 saídas de um timeout (retry / fallback / erro explícito)
- [ ] Sei o valor default perigoso (TCP keepalive de 2h) e por que não confiar nele

## Recursos

- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [MDN — AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) — açúcar nativo pro padrão acima
- "Timeouts, retries and backoff with jitter" — Amazon Builders' Library
- [Postgres — statement_timeout](https://www.postgresql.org/docs/current/runtime-config-client.html) — prazo no lado do banco
