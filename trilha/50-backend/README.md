# 50 — Backend

## Foco
Node.js em produção de verdade: estrutura de Express que escala sem virar bagunça, Prisma como ORM type-safe, filas para trabalho assíncrono que não pode perder, e os padrões que separam uma API que aguenta re-tentativas de uma que duplica dados. Para o Ricalfiff, que tem Meet Hub rodando Express+Prisma+Bull em Docker e o PULSAR-RH com Edge Functions, essa trilha formaliza o que já funciona e preenche os buracos que ainda causam bug em produção.

## Por que cai em entrevista
- "Como você estruturaria um servidor Express para um projeto médio?" — querem layers, não tudo na route
- "Como você garantiria que um job assíncrono não rodaria duas vezes?" — idempotência
- "O que acontece quando o processo recebe SIGTERM?" — graceful shutdown é diferenciador
- "Como você validaria input em uma API?" — querem boundary + Zod, não if/else manual
- "Como você lidaria com rate limit de uma API terceira?" — Cliente Varejo é o exemplo real

## Pré-requisitos
- `00-fundamentos`: event loop, promises, async/await — sem isso Express é magia negra
- `20-arquitetura/02-camadas`: saber onde colocar cada responsabilidade antes de escrever rota
- `30-banco/07-migrations`: Prisma sem entender migration é armadilha em produção

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-express-estrutura-middlewares.md` | Router, middleware de erro, separação routes/controllers/services, ordem importa | Meet Hub | 🔴 |
| 02 | `02-prisma-typesafe-orm.md` | Schema, relations, transactions, select específico (nunca findMany sem select), type inference | Meet Hub | 🔴 |
| 03 | `03-queues-bull-redis.md` | Job, worker, retry, dead-letter, backoff exponencial, concorrência controlada | Meet Hub | 🔴 |
| 04 | `04-idempotencia-em-apis.md` | Idempotency-Key header, upsert seguro, deduplicação de job, retry sem efeito colateral | CLIENTE OFICINA | 🔴 |
| 05 | `05-rate-limit-e-throttle.md` | Token bucket, sliding window, fila com delay, circuit breaker básico | Cliente Varejo | 🟡 |
| 06 | `06-graceful-shutdown-sigterm.md` | SIGTERM handler, drenar conexões, fechar Bull, fechar Prisma, `process.exit(0)` | Meet Hub | 🟡 |
| 07 | `07-logging-estruturado-pino.md` | JSON logs, correlation ID, níveis, o que logar (e o que nunca logar) | PULSAR-RH | 🟡 |
| 08 | `08-validation-zod-em-boundary.md` | Schema Zod no request body, tipos inferidos automaticamente, erro legível pro cliente | PULSAR-RH | 🟡 |

## Como aprender essa trilha
- `01` → `02` → `04` em sequência — são a espinha dorsal
- `03` pode ser estudado paralelo a `02` — Bull e Prisma andam juntos no Meet Hub
- Sinal de fixação em `04`: consegue explicar o que acontece se o mesmo webhook chegar duas vezes
- `05` tem caso real no Cliente Varejo — estudar com o código da integração ERP-externo aberto
- `06` e `07` são curtos mas pesam em entrevista de empresa que tem produto em produção

## Conexão com decisões reais
- **Meet Hub Express+Prisma+Bull:** toda a trilha tem exemplo concreto nesse projeto — `01`, `02`, `03`, `06` estão implementados; estudar é formalizar o que já existe
- **Cliente Varejo rate limit:** a integração com ERP-externo que travava por excesso de requisições é o caso de estudo exato de `05` — entrevistador pergunta "você já enfrentou rate limit em produção?"
- **CLIENTE OFICINA idempotência:** sync incremental que roda 5 em 5 minutos sem duplicar registros é `04` aplicado — já funciona, só falta a linguagem técnica pra defender
