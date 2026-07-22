# Syllabus — System Design

> **Disciplina:** conduzir um design em voz alta — cache, fila, replicação, consistência, escala — com trade-off explícito em cada decisão.
> **Carga horária alvo: 50h** — aulas 4h · bibliografia 24h · labs 12h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Conduzir um whiteboard de 20 minutos sobre um problema aberto ("projete X para 1M de usuários") sem travar, declarando premissas antes de desenhar.
2. Escolher a estratégia de cache (aside/write-through), o ponto onde entra fila, e o modo de replicação — e dizer o custo de cada escolha, não só o benefício.
3. Situar CAP num sistema concreto: por que "CA" é mito em distribuído e onde cada banco cai (CP vs AP).
4. Projetar idempotência e deduplicação de forma que retry e re-entrega não corrompam o estado.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 cache-estrategias | *System Design Interview* (Alex Xu, vol.1) — cap. "Scale From Zero To Millions Of Users" (tier de cache, CDN, cache-aside) | 3h |
| 02 filas-quando-e-como | *Designing Data-Intensive Applications* (Kleppmann) — cap. 11 "Stream Processing" (message brokers, entrega) + Xu vol.1 — cap. "Design A Notification System" | 3h |
| 03 replicacao-leader-follower | Kleppmann — cap. 5 "Replication" (single-leader, lag de replicação, leitura de replica, failover) | 3.5h |
| 04 cap-theorem-na-pratica | Kleppmann — cap. 9 "Consistency and Consensus" (§ linearizabilidade + discussão do CAP) | 3h |
| 05 load-balancing | Xu vol.1 — cap. "Scale From Zero To Millions Of Users" (load balancer, web tier sem estado) + Google SRE Book — cap. "Load Balancing at the Frontend" [gratuito em sre.google] | 2.5h |
| 06 escalabilidade-horizontal-vs-vertical | Kleppmann — cap. 6 "Partitioning" (sharding, rebalanceamento) + Xu vol.1 (statelessness como pré-requisito do horizontal) | 3h |
| 07 idempotencia-e-deduplicacao | Kleppmann — cap. 11 (exactly-once, deduplicação) + Stripe docs — *Idempotent requests* (idempotency key na prática) | 3h |
| 08 design-de-sistema-exemplo | Xu vol.1 — cap. "A Framework For System Design Interviews" (os 4 passos) + cap. "Design A URL Shortener" (design completo ponta a ponta) | 3h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, ache onde ele já existe na prática (fila do Meet Hub, sync idempotente do CLIENTE OFICINA, RLS multi-tenant do PULSAR-RH). Ler sem mapear no que você já construiu não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `cache-aside-demo` (5h):** cache-aside em TS sobre um "banco" lento simulado (SQLite + `delay` artificial de 200ms). Camada de cache em memória com TTL e invalidação por chave.
*Pronto quando:* teste comprova hit ratio subindo em leituras repetidas, TTL expirando devolve ao banco, invalidação por escrita força o próximo read a bater no banco — e o README mede latência com e sem cache.

**Lab 2 — `design-doc` (4h):** documento de design do zero para um encurtador de URL: requisitos (funcionais e não), estimativa back-of-the-envelope (QPS de leitura/escrita, storage/ano), contrato de API, schema, diagrama de componentes e a seção de trade-offs (hash vs contador, SQL vs KV).
*Pronto quando:* `DESIGN.md` público cobre as 6 seções, a estimativa tem as premissas declaradas, e cada decisão tem a alternativa rejeitada com o motivo.

**Lab 3 — `dedup-queue` (3h):** fila em memória que recebe mensagens **duplicadas de propósito** (at-least-once simulado) e processa o efeito exatamente uma vez via idempotency key (Set ou UNIQUE em SQLite).
*Pronto quando:* enviar o mesmo lote 3× resulta no mesmo estado final que 1×, provado por teste, e o consumidor loga "duplicata ignorada" para as reentregas.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps próprios)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — conduzir e documentar o design de um sistema real (ex.: Meet Hub do zero: gravação → transcrição → armazenamento → busca) com trade-off por decisão

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, os livros não. SRE Book é gratuito em sre.google.*
