# 03 — Monolito vs Microsserviço

## O que é

Monolito é uma aplicação que empacota toda a lógica num único processo deployável. Microsserviço divide essa lógica em processos independentes que se comunicam via rede. A divisão parece óbvia quando você só lê sobre microsserviços — na prática, microsserviços trocam problemas de código por problemas de infraestrutura, e esses problemas são mais caros.

```
Monolito:
┌──────────────────────────────────┐
│   API + Auth + Queue + Storage   │  1 processo, 1 deploy, 1 log stream
│   função chama função            │  erro de uma parte é erro do todo
└──────────────────────────────────┘

Microsserviço:
┌──────┐  HTTP/gRPC  ┌──────────┐  HTTP  ┌─────────┐
│ API  │ ──────────→ │  Auth    │ ─────→ │ Storage │  3 deploys
└──────┘             └──────────┘        └─────────┘  3 logs
                                                       latência de rede em cada chamada
                                                       falha parcial (serviço A up, B down)
```

O Meet Hub é um monorepo com `apps/api`, `apps/web`, `apps/bot` — mas **api**, **bot** e **web** se comunicam localmente via docker-compose, não via rede pública. Isso é monolito modular, não microsserviço.

---

## Por que cai em entrevista

É a pergunta de raciocínio mais comum para dev que já trabalhou em projetos "reais".

- "Você escolheria monolito ou microsserviço para esse sistema? Por quê?"
- "Quais os problemas de microsserviços que as pessoas subestimam?"
- "Quando faz sentido quebrar um monolito?"
- "O que é monolito modular? Qual a diferença para microsserviço?"
- "Como você lidaria com falha parcial em microsserviços?"

---

## Trade-offs (quando usar X vs Y)

| Critério | Monolito ganha | Microsserviço ganha |
|---|---|---|
| Deploy | 1 pipeline, 1 artefato | Deploy independente por serviço (compensa com 10+ devs) |
| Debugging | Stack trace completo, 1 log stream | Rastrear request atravessa 3+ serviços (precisa tracing distribuído) |
| Latência interna | Chamada de função (ns) | Chamada de rede (ms — 100× mais lento) |
| Consistência de dados | Transação ACID dentro do mesmo banco | Precisa de saga pattern ou eventual consistency |
| Escala independente | Escala tudo junto | Só o serviço caro escala — compensa em serviços com CPU/memória muito diferente |
| Tamanho do time | 1-10 pessoas: monolito quase sempre | 50+ pessoas: microsserviço permite times independentes |
| Operação | 1 servidor, 1 serviço de log | Load balancer, service mesh, circuit breaker, tracing distribuído |

**Regra de bolso:** você precisa medir antes de quebrar. Os motivos válidos para microsserviço são três: (1) partes do sistema precisam escalar de forma radicalmente diferente; (2) times independentes com deploys que não podem bloquear uns aos outros; (3) partes em linguagens ou runtimes diferentes por necessidade técnica real. "É mais moderno" não é motivo.

---

## Exercício aplicado (projeto AG real)

O Meet Hub tem `apps/api`, `apps/bot` e `apps/web` em monorepo. Existe uma decisão implícita de não quebrar isso em microsserviços. Vamos justificar essa decisão de forma defensável.

### Passo a passo

1. **Entender a comunicação atual entre apps:**
   ```bash
   grep -rn "http://\|fetch\|axios" ~/projetos/meet-hub/apps/api/src/ --include="*.ts" | head -10
   ```
   Anote: a API se comunica com o bot via docker (socket), não via HTTP entre serviços independentes.

2. **Contar quantas pessoas trabalham no projeto:**
   ```bash
   git -C ~/projetos/meet-hub log --format="%an" | sort -u
   ```
   Se for 1 pessoa, microsserviços independentes multiplicariam a carga operacional por N sem ganho nenhum.

3. **Identificar o que ficaria em serviços separados se fosse microsserviço:**
   - `api` → API service
   - `bot` → Bot service
   - `web` → Static hosting (já é separado)
   - `queue` + `redis` → Job service?
   Pense: cada um desses teria pipeline de CI/CD próprio, log próprio, saúde própria para monitorar. Vale para 1 dev?

4. **Formule a justificativa por escrito** (treine para entrevista):
   O bot precisa de docker socket e tmpfs — isso é detalhe de infra que ficaria horrível de expor via API HTTP. Como serviço separado, precisaria de autenticação entre serviços, circuit breaker, retry. Como apps no mesmo docker-compose, é uma chamada de função via queue.

5. **Registrar em `~/projetos/meet-hub/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Manter monorepo monolítico vs. separar em microsserviços

   **Problema:** decidir se api/bot/web deveriam ser serviços independentes deployáveis.
   **Opções consideradas:**
   - Monorepo com docker-compose — 1 deploy, comunicação local, log centralizado
   - Microsserviços independentes — deploys separados, mas 3× mais operação para 1 dev
   **Decisão:** monorepo monolítico.
   **Por quê:** único dev, escala ainda não foi medida como problema, bot e api se comunicam via queue (Redis) que é interna — separar adicionaria latência de rede sem ganho. Microsserviço faz sentido quando times independentes precisam deployar sem bloquear uns aos outros — não é o caso.
   **Sinal para reavaliar:** quando o bot precisar escalar para 20+ instâncias independentes da API, ou quando um segundo dev entrar com responsabilidade exclusiva sobre o bot.
   **Como explicar em entrevista (30s):**
   > "O Meet Hub é monorepo com API, bot e web no mesmo docker-compose. Poderia ter separado em microsserviços, mas decidi não fazer porque sou o único dev e não medi nenhum gargalo que justificasse. Microsserviços têm custo operacional real: 3 deploys, 3 logs, latência de rede entre partes. Para uma aplicação com 1 dev, esse custo compra nada."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Você escolheria monolito ou microsserviço para o Meet Hub? Justifique."
>
> **R (30s):**
> "Monolito. Os motivos válidos para microsserviço são: partes que escalam de forma radicalmente diferente, times independentes que precisam deployar sem bloquear uns aos outros, ou necessidades técnicas incompatíveis. O Meet Hub tem 1 dev, e o bot se comunica com a API via queue Redis que é interna. Separar em microsserviços adicionaria 3 pipelines de CI/CD, rastreamento distribuído e latência de rede entre partes que hoje conversam localmente. Vou reavaliar quando o bot precisar escalar para dezenas de instâncias independentes — aí o caso começa a aparecer."

> **P:** "Quais os problemas de microsserviços que as pessoas subestimam?"
>
> **R (30s):**
> "Consistência de dados e debugging. Num monolito, uma transação garante atomicidade. Em microsserviços, se o Serviço A gravou mas o Serviço B falhou, você tem dado inconsistente — precisa de saga pattern ou eventual consistency, que são complexidades sérias. Em debugging: um erro que cruzou 4 serviços precisa de tracing distribuído para rastrear. Sem isso, você fica procurando bug em 4 logs diferentes. Esses dois problemas juntos custam mais do que a maioria das equipes estima antes de adotar."

---

## Checkpoint

- [ ] Consigo listar 3 motivos válidos para microsserviço e 3 custos que as pessoas ignoram
- [ ] Formulei a justificativa do monolito Meet Hub em menos de 30 segundos
- [ ] Entendo o que é "monolito modular" e a diferença para microsserviço
- [ ] Sei o que é "eventual consistency" e quando ela aparece em microsserviços
- [ ] Recitei as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Monolito vs. Microsserviço dominado`.

---

## Recursos

- Martin Fowler — [Microservices](https://martinfowler.com/articles/microservices.html) (o original — leia até a metade)
- Martin Fowler — [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) (curto, direto ao ponto)
- Sam Newman — *Building Microservices* (cap. 1 e 2 suficientes para entrevista júnior)
- Código real: `~/projetos/meet-hub/docker-compose.yml` — monolito modular em docker-compose
- Código real: `~/projetos/cliente-oficina-backend/src/` — script único de sync, sem nenhuma necessidade de separar
