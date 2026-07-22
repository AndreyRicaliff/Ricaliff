# Syllabus — Banco de Dados (Postgres/Supabase)

> **Disciplina:** fazer o Postgres responder rápido, com integridade e sem vazar linha de um cliente para outro — provado no plano de execução, não na fé.
> **Carga horária alvo: 50h** — aulas 4h · bibliografia 22h · labs 16h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Ler um `EXPLAIN ANALYZE` e decidir qual índice (e em que ordem de colunas) transforma um seq scan em index scan.
2. Escolher o nível de isolamento certo para uma operação e explicar qual anomalia cada nível ainda permite.
3. Desenhar uma policy RLS fail-closed e provar com um usuário sem role que ela devolve zero linha.
4. Aplicar uma migration versionada e restaurar o banco a um ponto no tempo antes de um erro.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 indices-quando-e-quais | use-the-index-luke.com — "Anatomy of an SQL Index" e "The Where Clause" + Postgres docs cap. "Indexes" (Index Types, Multicolumn Indexes) | 3h |
| 02 explain-analyze-query-plan | Postgres docs — "Using EXPLAIN" (cap. Performance Tips) + use-the-index-luke.com apêndice "Execution Plans" (PostgreSQL) | 3h |
| 03 n-plus-1-e-como-evitar | use-the-index-luke.com — cap. "Nested Loops" (joins) + Postgres docs "Controlling the Planner with Explicit JOIN Clauses" | 2.5h |
| 04 transactions-isolation-levels | *Designing Data-Intensive Applications* (Kleppmann) — cap. 7 "Transactions" + Postgres docs cap. "Transaction Isolation" (13.2) | 4h |
| 05 rls-row-level-security | Supabase docs — "Row Level Security" (guia + policies por operação) + Postgres docs "Row Security Policies" (5.9) | 3h |
| 06 particionamento-e-retencao | Postgres docs — "Table Partitioning" (5.11), com foco em partição por RANGE de data e attach/detach | 2.5h |
| 07 migrations-versionadas | Supabase docs — "Local development & CLI" e "Database Migrations" (fluxo `db diff` / `migration new` / `db push`) | 2h |
| 08 backup-e-recovery | Postgres docs — cap. "Backup and Restore" + "Continuous Archiving and Point-in-Time Recovery (PITR)" | 2h |

Regra de leitura: **com um banco AG real ou uma cópia dele** — cada conceito, rode o `EXPLAIN` correspondente e olhe o plano. Ler sobre índice sem ver o plano mudar não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `index-lab` (6h):** script que semeia uma tabela com ~1M linhas (dados sintéticos), roda um conjunto de queries e captura `EXPLAIN ANALYZE` antes e depois de cada índice. Demonstra: seq scan → index scan, por que a ordem das colunas num índice composto muda o plano, e um índice que o planner *ignora* (baixa seletividade).
*Pronto quando:* um README mostra, lado a lado, o plano e o tempo de cada query nos dois estados, com uma frase explicando por que o planner escolheu cada caminho.

**Lab 2 — `mvcc-playground` (5h):** roteiro com duas sessões `psql` simultâneas que reproduzem, de propósito, cada anomalia de concorrência (non-repeatable read, phantom, lost update) e mostram quais desaparecem ao subir de READ COMMITTED para REPEATABLE READ e SERIALIZABLE.
*Pronto quando:* cada anomalia tem um par de scripts numerados (sessão A / sessão B) e uma tabela final "isolamento × anomalia observada" batendo com o cap. 13.2 dos docs.

**Lab 3 — `rls-isolation` (5h):** schema mínimo com uma tabela multi-tenant e duas policies (uma fail-open ingênua `USING(true)`, uma fail-closed correta). Um teste autentica como Tenant A, Tenant B e um usuário sem tenant.
*Pronto quando:* o teste prova que a policy correta devolve só as linhas do próprio tenant e zero para o usuário sem role, enquanto a ingênua vaza — tudo em asserts automatizados.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta num banco AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — um schema com migrations versionadas, índices justificados por plano e RLS testada fail-closed

*Bibliografia sem link direto: procurar pelo título — versões do Postgres mudam de URL, os capítulos não.*
