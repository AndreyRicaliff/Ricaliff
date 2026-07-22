# Syllabus — Robustez e Confiabilidade

> **Disciplina:** como sistemas ficam de pé quando as dependências não estão.
> **Carga horária alvo: 46h** — aulas 3h · bibliografia 18h · labs 15h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Projetar o modo de falha de qualquer operação (fail-open/closed, retry ou não, prazo, fallback) ANTES de codar.
2. Implementar retry com backoff+jitter, circuit breaker, timeout em cascata e idempotência — e explicar quando cada um é errado.
3. Diagnosticar um incidente de produção por logs estruturados/percentis sem reproduzir localmente.
4. Provar robustez exercitando a falha (chaos), não declarando o try/catch.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 error-handling | *Release It!* (Nygard, 2ª ed) — cap. "Stability Antipatterns" | 2h |
| 02 retry-backoff-breaker | Amazon Builders' Library — "Timeouts, retries, and backoff with jitter" + *Release It!* cap. "Stability Patterns" (Circuit Breaker) | 2.5h |
| 03 idempotência | *Designing Data-Intensive Applications* (Kleppmann) — cap. 8 "The Trouble with Distributed Systems" (§ garantias de entrega) + Stripe docs "Idempotent requests" | 2.5h |
| 04 timeouts | Amazon Builders' Library — "Avoiding fallback in distributed systems" + MDN `AbortController`/`AbortSignal.timeout` (na prática, com código) | 1.5h |
| 05 degradação | Google SRE Book — cap. "Handling Overload" + cap. "Addressing Cascading Failures" | 2.5h |
| 06 observabilidade | Google SRE Book — cap. "Monitoring Distributed Systems" + "The RED Method" (Tom Wilkie) | 2h |
| 07 concorrência | Kleppmann — cap. 7 "Transactions" (isolamento + locks; releitura com foco em `FOR UPDATE`) | 3h |
| 08 teste de falha | principlesofchaos.org + *Chaos Engineering* (Rosenthal/Jones) — caps. introdutórios | 1.5h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) num app AG. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `resilient-fetch` (5h):** lib pura em TS: `resilientFetch(url, {retries, backoff, jitter, timeout, breaker})`.
Sem dependências. Suíte vitest cobrindo: backoff cresce exponencial com jitter, breaker abre após N falhas e half-open após cooldown, timeout aborta de verdade (AbortController), erro 4xx NÃO faz retry.
*Pronto quando:* 100% dos comportamentos acima têm teste passando + README com o diagrama de estados do breaker.

**Lab 2 — `chaos-proxy` (6h):** proxy HTTP local (node http puro) que senta entre um cliente e qualquer API e injeta falha por config: latência fixa/aleatória, erro 5xx a cada N, resposta truncada, conexão pendurada.
*Pronto quando:* apontar o Lab 1 pro proxy e demonstrar (log lado a lado) cada padrão de resiliência reagindo à falha certa.

**Lab 3 — `once-worker` (4h):** processador de fila idempotente: recebe jobs duplicados de propósito (at-least-once simulado com re-entrega), grava efeito exatamente uma vez via claim com UNIQUE (SQLite).
*Pronto quando:* disparar o mesmo lote 3× em `Promise.all` e o estado final ser idêntico a 1×, provado por teste.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
