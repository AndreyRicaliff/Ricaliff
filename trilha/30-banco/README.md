# 30 — Banco de Dados

## Foco
PostgreSQL além do CRUD. A diferença entre um dev que "usa banco" e um que "entende banco" é saber ler um query plan, saber quando um índice atrapalha em vez de ajudar e saber que isolation level usar para não ter dado fantasma em produção. Para o Ricalfiff, que tem PULSAR-RH com RLS multi-tenant e OFICINA com sync incremental de 180 dias de retenção, essa trilha transforma problemas reais já resolvidos em conhecimento defensável.

## Por que cai em entrevista
- "Como você evitaria N+1 nesse caso?" — querem eager loading ou query única, não loop
- "O que é uma transaction e quando você usaria?" — querem isolation level, não só BEGIN/COMMIT
- "Como você implementaria multi-tenancy seguro?" — RLS é a resposta certa aqui
- "Essa query está lenta. Como você investigaria?" — EXPLAIN ANALYZE fecha a pergunta
- "Como você trata retenção de dados para LGPD?"

## Pré-requisitos
- `00-fundamentos`: lógica básica, estrutura de dados
- Ter operado qualquer banco relacional antes — SQL básico não é ensinado aqui

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-indices-quando-e-quais.md` | B-tree, índice composto, índice parcial, quando índice é prejudicial | PULSAR-RH | 🔴 |
| 02 | `02-explain-analyze-query-plan.md` | Ler seq scan vs index scan, custo estimado vs real, onde a query dói | CLIENTE OFICINA | 🔴 |
| 03 | `03-n-plus-1-e-como-evitar.md` | Identificar N+1 no log, resolver com join ou eager load no Prisma | PULSAR-RH | 🔴 |
| 04 | `04-transactions-isolation-levels.md` | READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE, dirty read, phantom read | CLIENTE OFICINA | 🔴 |
| 05 | `05-rls-row-level-security.md` | Criar policy, testar como role diferente, multi-tenant no Supabase | PULSAR-RH | 🔴 |
| 06 | `06-particionamento-e-retencao.md` | Partition by range, DELETE em lote, política de retenção 180d para LGPD | CLIENTE OFICINA | 🟡 |
| 07 | `07-migrations-versionadas.md` | Prisma migrate, convenção de nome, rollback seguro, nunca DROP sem plano | Meet Hub | 🟡 |
| 08 | `08-backup-e-recovery.md` | pg_dump, ponto de restauração, teste de restore — o que importa em produção | AG Hub | 🟢 |

## Como aprender essa trilha
- `01`, `02` e `03` primeiro — são a base para todos os outros
- Para cada módulo: rodar as queries no banco de desenvolvimento do PULSAR-RH ou OFICINA
- Sinal de fixação: consegue ler um EXPLAIN ANALYZE e apontar onde está o gargalo sem ajuda
- `05-rls` é o mais diferenciador para entrevistas com stack Supabase — priorizar
- `08-backup` pode ficar por último, mas não pular — falta de backup é demissão

## Conexão com decisões reais
- **PULSAR-RH RLS multi-tenant:** cada empresa vê só seus dados via policy — é o caso de estudo perfeito para `05`; entrevistador pergunta "como você isolaria dados de clientes diferentes no mesmo banco?" e a resposta está aqui
- **CLIENTE OFICINA retenção 180d:** `sale_items` com DELETE periódico e particionamento por data é o exercício concreto de `06` — já está em produção, só falta nomear
- **Meet Hub Prisma:** cada migration aplicada na mão virou aprendizado de `07` — formalizar esse conhecimento fecha o módulo
