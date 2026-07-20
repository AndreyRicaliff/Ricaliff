# 02 — Retry, Backoff e Circuit Breaker

## O que é

Rede falha por design: timeout, reset de conexão, 429 de rate limit, 503 de deploy do outro lado. Retry é o mecanismo que transforma falha transiente em sucesso — e, mal feito, é o mecanismo que transforma um soluço em outage. A tríade: **retry** (tentar de novo), **backoff exponencial com jitter** (esperar cada vez mais, e fora de sincronia com os outros clientes), **circuit breaker** (parar de tentar quando o outro lado está morto).

**Retry só em erro transiente.** Classificar ANTES de repetir é o que separa engenharia de força bruta:

| Erro | Transiente? | Ação |
|---|---|---|
| timeout, ECONNRESET, 502/503/504 | sim | retry com backoff |
| 429 (rate limit) | sim | retry respeitando `Retry-After` se vier |
| 400/422 (payload inválido) | **não** | retry repete o erro pra sempre — falhar e alertar |
| 401/403 (credencial) | **não** | retry vira brute-force contra a própria API — falhar fechado |

**Backoff exponencial com jitter.** `delay = min(teto, base * 2^tentativa)` resolve metade; a outra metade é o rebanho: se 500 clientes falham juntos, retries sincronizados batem juntos de novo (*thundering herd*). Jitter aleatoriza: *full jitter* = `random(0, delay)`. O estudo clássico da AWS (Marc Brooker, "Exponential Backoff and Jitter", 2015) mostra que full jitter reduz drasticamente o trabalho total sob contenção. Caso real: no outage do DynamoDB (set/2015), a tempestade de retries dos storage servers sobrecarregou o serviço de metadata e atrasou a própria recuperação.

**Circuit breaker.** Retry protege VOCÊ da falha transiente; breaker protege O OUTRO (e seu budget) da falha persistente. Três estados: *closed* (fluxo normal, contando falhas), *open* (N falhas seguidas → rejeita na hora, sem tentar), *half-open* (após cooldown, 1 request de sonda passa; sucesso fecha, falha reabre). Popularizado por Michael Nygard (*Release It!*) e pelo Hystrix da Netflix.

### Implementação real: o sync ERP da AG

O pipeline que puxa dados do ERP-externo pro Supabase (Cliente Varejo, CLIENTE OFICINA) pagina a API e leva 429 com frequência. Desenho em produção: backoff exponencial por página, teto de tentativas, e lockfile (módulo 07) garantindo execução única — retry + execução dupla é receita de rate-limit eterno.

```ts
async function fetchComRetry(url: string, tentativas = 5): Promise<Response> {
  for (let i = 0; i < tentativas; i++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (res.ok) return res;
    const transiente = res.status === 429 || res.status >= 500;
    if (!transiente || i === tentativas - 1) {
      throw new Error(`ERP-externo ${res.status} em ${url} (tentativa ${i + 1})`);
    }
    const base = Math.min(30_000, 500 * 2 ** i);
    await new Promise(r => setTimeout(r, Math.random() * base)); // full jitter
  }
  throw new Error('unreachable');
}
```

Raciocínio de sênior embutido: o `throw` no erro não-transiente é deliberado. A hipótese "é transiente" foi refutada pelo status — a resposta certa é falhar com contexto, não insistir mascarando bug de payload e queimando quota.

## Por que cai em entrevista

É A pergunta de resiliência em system design: "e se a API externa cair?". Quem responde só "coloco retry" cai na armadilha; o entrevistador quer ouvir classificação de erro, jitter e quando PARAR. Citar thundering herd e breaker mostra que você pensa no sistema inteiro, não só no seu request.

> **P:** "Sua integração com um ERP começou a tomar 429. O que você faz?"
>
> **R (30s):** "Primeiro classifico: 429 é transiente, então cabe retry — mas com backoff exponencial e jitter, senão meus retries sincronizados viram parte do problema. Respeito o Retry-After quando vem. No sync que mantenho, somei duas proteções: teto de tentativas com erro contextualizado no estouro, e lock de processo garantindo execução única — parte dos 429 vinha de dois syncs em paralelo. E se a API ficar fora por horas, breaker: depois de N falhas seguidas paro e alerto, em vez de martelar um serviço morto."

## Checkpoint

- [ ] Classifico qualquer status HTTP em transiente/permanente e justifico a ação
- [ ] Implementei backoff exponencial com full jitter e explico por que jitter existe
- [ ] Desenho os 3 estados do circuit breaker e o papel do half-open
- [ ] Explico thundering herd citando o caso DynamoDB 2015
- [ ] Provoquei um 429/500 de propósito e vi meu retry se comportar (módulo 08)

## Recursos

- [Exponential Backoff and Jitter — AWS Architecture Blog (Marc Brooker)](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [CircuitBreaker — Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- *Release It!* (Michael Nygard) — capítulos de stability patterns
- Postmortem "Summary of the Amazon DynamoDB Service Disruption" (set/2015) — no site da AWS
