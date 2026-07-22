# Syllabus — Backend

> **Disciplina:** um serviço Node que não cai sozinho — pipeline, fila, idempotência, shutdown limpo.
> **Carga horária alvo: 45h** — aulas 3h · bibliografia 17h · labs 15h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar o event loop e por que uma operação síncrona bloqueia o servidor inteiro — e estruturar middlewares/rotas em cima disso.
2. Processar trabalho assíncrono em fila (job, retry, dead-letter) sem travar o request, e proteger o endpoint com rate limit.
3. Tornar uma operação idempotente com Idempotency-Key e desligar o processo sem perder job em voo (SIGTERM/graceful shutdown).
4. Validar toda entrada no boundary com schema e emitir log estruturado que dá pra diagnosticar incidente sem reproduzir.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 express-estrutura-middlewares | Express — guia oficial "Using middleware" + "Writing middleware" + "Routing"; Node.js docs — "The Node.js Event Loop, Timers, and process.nextTick" | 2.5h |
| 02 prisma-typesafe-orm | Prisma docs — "Prisma Client: CRUD" + "Relation queries" (e o custo do N+1 / `include`) | 2h |
| 03 queues-bull-redis | BullMQ docs — "Guide: Queues, Workers, Jobs" (retry, backoff, dead-letter); Redis docs — "Lists" (a estrutura por baixo) | 2h |
| 04 idempotencia-em-apis | Stripe docs — "Idempotent requests"; Amazon Builders' Library — "Making retries safe with idempotent APIs" | 2h |
| 05 rate-limit-e-throttle | MDN — "429 Too Many Requests" + `Retry-After`; `express-rate-limit` docs; Redis docs — padrão token bucket com `INCR`/`EXPIRE` | 2h |
| 06 graceful-shutdown-sigterm | Node.js docs — "Process: Signal Events" (SIGTERM/SIGINT, `server.close`); Kubernetes docs — "Pod Lifecycle: Termination" (janela de graça, drain) | 2h |
| 07 logging-estruturado-pino | Pino docs — "Getting Started" + níveis e redaction; Node.js docs — "Stream" (writable + backpressure para transporte de log); 12factor.net — "Logs" | 2h |
| 08 validation-zod-em-boundary | Zod docs — "Basic usage" + "Schemas / parsing vs safeParse"; *Designing Data-Intensive Applications* (Kleppmann) — cap. 4 "Encoding and Evolution" (schemas, compat. backward/forward) | 2.5h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) num backend AG (edge functions, sync-erp). Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `mini-express` (5h):** reimplementar um pipeline mínimo de middlewares (`req`/`res`, `next()`, middleware de erro de 4 args, casamento de rota) em `node:http` puro — sem Express.
*Pronto quando:* a cadeia roda na ordem registrada, o middleware de erro captura throw síncrono **e** rejeição async, o roteamento resolve params, tudo com suíte vitest passando.

**Lab 2 — `idempotent-endpoint` (5h):** endpoint Express que aceita header `Idempotency-Key`, persiste o resultado (SQLite) e devolve a resposta em cache no replay, executando o efeito uma única vez.
*Pronto quando:* a mesma chave replayada retorna resposta idêntica e o efeito ocorre 1×; dois requests duplicados concorrentes (`Promise.all`) não duplicam o efeito; provado por teste.

**Lab 3 — `graceful-worker` (5h):** worker de fila (BullMQ ou fila em memória) que, ao receber SIGTERM, termina o job em voo antes de sair e para de pegar novos, com log pino estruturado.
*Pronto quando:* SIGTERM drena o job atual, nenhum job novo é iniciado após o sinal, e todo log é JSON válido com um id de correlação por job.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Hussein Nasser** | "node event loop", "message queue", "graceful shutdown", "connection pooling" | módulos 01, 03, 06 |
| **Rocketseat** *(PT-BR)* | "node.js do zero", "express", "prisma orm" | módulos 01, 02 — base em português |
| **Fabio Akita** *(PT-BR)* | "concorrência e paralelismo", "filas e mensageria" | módulo 03 — fundamentos profundos |
| **freeCodeCamp.org** | "node.js full course", "backend api", "pino logging" | módulos 01, 02, 07 |

Ordem sugerida: base aplicada em PT-BR (Rocketseat) pra montar o serviço, depois Hussein Nasser DEPOIS do módulo pra entender por que ele não cai. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos backends AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, as obras não.*
