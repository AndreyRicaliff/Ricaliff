# 85 — Manuseio de cargas & escala

## Foco

Como sistemas aguentam carga: medir o que importa, **projetar** quanta carga vem (capacity planning), e os mecanismos que fazem o sistema crescer sem cair — escala horizontal, cache, filas, banco sob carga e observabilidade. Para o Ricaliff, que já tem as peças soltas na prática (fila Bull no Meet Hub, sync idempotente no Oficina, RLS multi-tenant no Pulsar), esta trilha dá o **vocabulário e as contas** pra raciocinar sobre escala de forma quantitativa — e defender as decisões com número, não com achismo.

A trilha `80-system-design` ensina o framework de raciocínio de whiteboard; esta é o **lado numérico e operacional** dele: as métricas, a conta de guardanapo, e o que monitorar em produção.

## Por que cai em entrevista

- "1 milhão de usuários por dia, quantos QPS no pico?" — querem ver a conta de guardanapo
- "Por que p99 importa mais que a média?" — diferenciador de quem entende latência
- "Escala vertical ou horizontal? Qual o pré-requisito do horizontal?" — statelessness
- "Como você sabe que o sistema está aguentando?" — observabilidade, SLI/SLO/SLA
- "O banco é o gargalo. O que você faz?" — índice, N+1, pool, cache, réplica, sharding (nessa ordem)

## Pré-requisitos

- `30-banco`: índices, replicação, transações — metade da escala é banco
- `50-backend`: filas e idempotência aparecem em todo desenho de escala
- `80-system-design`: o framework de raciocínio; esta trilha é o lado quantitativo dele
- `70-devops`: container é a unidade de escala horizontal

## Módulos

| # | Módulo | Foco |
|---|---|---|
| 01 | `01-metricas-de-carga.md` | Vazão/throughput, latência, percentis (p50/p95/p99 > média), saturação, latency numbers em ordens de grandeza |
| 02 | `02-capacity-planning.md` | Projeção: usuários→QPS de pico, back-of-the-envelope, headroom, "quantos servidores", quando estoura |
| 03 | `03-vertical-vs-horizontal.md` | Scale up vs scale out, load balancer, statelessness como pré-requisito, sticky sessions, teto do vertical |
| 04 | `04-cache.md` | Camadas (browser/CDN/app/DB), cache-aside vs write-through, TTL, invalidação, thundering herd, hit ratio |
| 05 | `05-async-e-filas.md` | Trabalho pesado fora do request, message queue, producer/consumer/workers, idempotência, backpressure, retry, DLQ |
| 06 | `06-banco-sob-carga.md` | Read replicas, connection pooling, índices, N+1 em escala, sharding/particionamento, o banco é o gargalo |
| 07 | `07-saber-que-esta-aguentando.md` | Observabilidade (métricas/logs/traces), SLI/SLO/SLA, error budget, alertas, load testing (k6/ab) |

## Como aprender essa trilha

- Comece por `01` e `02` — são a base quantitativa; sem métrica e projeção, o resto é teoria
- `04` (cache) e `05` (filas) têm o maior retorno imediato e você já usou os dois na prática
- `06` é o coração: na maioria dos sistemas o gargalo é o banco — domine a ordem de ataque
- Sinal de fixação: consegue fazer a conta "1M usuários/dia → ~1.000 RPS no pico → ~10 servidores" em voz alta, com as premissas declaradas, sem travar

## Conexão com decisões reais

- **Meet Hub fila Bull (plano 6 bots, Hetzner):** `05` e `02` na prática — processamento assíncrono e a conta de quando o vertical do DigitalOcean para de compensar
- **Cliente Oficina sync incremental idempotente:** `05` — at-least-once + chave única pra reprocessar a janela de 2 dias sem duplicar
- **Pulsar-RH / ag-painel no Supabase:** `06` — read replicas e connection pooling (o pooler do Supabase) são exatamente os mecanismos de banco sob carga
- **Varejo / Oficina rate limit 429 das APIs ERP:** `05` (backoff + retry) e `07` (observar profundidade da fila) são o que torna a ingestão resiliente
