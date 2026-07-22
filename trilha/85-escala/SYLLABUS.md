# Syllabus — Manuseio de cargas & escala

> **Disciplina:** o lado numérico e operacional da escala — medir a carga, projetar quanta vem, e provar que o sistema aguenta.
> **Carga horária alvo: 40h** — aulas 3h · bibliografia 16h · labs 13h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Fazer a conta de guardanapo "1M usuários/dia → ~RPS de pico → ~N servidores" em voz alta, com as premissas e o fator de pico declarados.
2. Explicar por que p95/p99 conta mais que a média, e dizer qual das quatro golden signals está gritando num incidente.
3. Atacar "o banco é o gargalo" na ordem certa — índice, N+1, pool, réplica, sharding — justificando cada passo antes do próximo.
4. Fazer um teste de carga que encontra o ponto de saturação, e desenhar o load shedding que degrada em vez de derrubar.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 metricas-de-carga | Google SRE Book — cap. "Monitoring Distributed Systems" (Four Golden Signals) + *Designing Data-Intensive Applications* (Kleppmann) cap. 1 (§ percentis p95/p99 > média) [SRE gratuito em sre.google] | 2.5h |
| 02 capacity-planning | *System Design Interview* (Alex Xu, vol.1) — cap. "Back-of-the-envelope Estimation" (números por ordem de grandeza, projeção usuários→QPS, headroom) | 2h |
| 03 vertical-vs-horizontal | Kleppmann — cap. 1 (abordagens de escala) + Xu vol.1 "Scale From Zero To Millions Of Users" (statelessness como pré-requisito do scale-out) | 2h |
| 04 cache | Xu vol.1 "Scale From Zero To Millions Of Users" (camadas browser/CDN/app, cache-aside vs write-through, TTL, thundering herd, hit ratio) | 2h |
| 05 async-e-filas | Google SRE Book — cap. "Handling Overload" + cap. "Addressing Cascading Failures" (backpressure, retry amplificado, load shedding) [gratuito em sre.google] | 2.5h |
| 06 banco-sob-carga | Kleppmann — cap. 5 "Replication" (read replicas, lag) + cap. 6 "Partitioning" (sharding, connection pooling em escala) | 3h |
| 07 saber-que-esta-aguentando | k6 docs — *Get started* + *Test types* (smoke/load/stress/spike) + Google SRE Book cap. "Service Level Objectives" (SLI/SLO/error budget) [gratuito em sre.google] | 2h |

Regra de leitura: **com o repositório aberto** — cada número e mecanismo que aparecer, ache o correspondente real (fila Bull do Meet Hub, pooler do Supabase no PULSAR-RH/Pulsar Finance, rate limit 429 do ERP-externo no CLIENTE OFICINA/Cliente Varejo). Teoria sem a conta do seu caso não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `load-test-harness` (6h):** serviço HTTP com um endpoint de trabalho variável (CPU-bound configurável) + script **k6** que sobe carga em degraus (rampa de VUs) e coleta throughput, p50/p95/p99 e taxa de erro.
*Pronto quando:* o relatório mostra a curva de latência por nível de carga e aponta o degrau em que o p99 dispara e o throughput para de crescer — o ponto de saturação — com as premissas do teste no README.

**Lab 2 — `capacity-calc` (3h):** lib/CLI pura em TS: `plan({ usuariosDia, reqPorUsuario, fatorPico, rpsPorServidor, headroom })` devolve QPS médio, QPS de pico e número de servidores com folga.
*Pronto quando:* suíte de teste cobre os casos de borda (fator de pico alto, headroom 0 vs 30%), e o README refaz à mão a conta "1M/dia → pico → servidores" batendo com a saída.

**Lab 3 — `overload-shed` (4h):** serviço que sob carga aplica **load shedding** — rejeita com 429 acima de N requisições in-flight — em vez de aceitar tudo e cair.
*Pronto quando:* apontar o Lab 1 nele e demonstrar (log lado a lado) que acima do limite ele degrada com 429 e mantém p99 estável para o tráfego aceito, em vez de estourar a latência de todos.

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps próprios)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — plano de capacidade de um sistema real (ex.: Meet Hub 6 bots): conta de guardanapo + teste de carga + o gargalo identificado com evidência

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, o conteúdo não. SRE Book é gratuito em sre.google.*
