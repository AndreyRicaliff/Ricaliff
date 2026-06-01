# 01 — Índices: quando e quais

## O que é

Índice é uma estrutura de dados separada que o Postgres mantém em paralelo à tabela. Ele permite localizar linhas sem varrer o table completo (Seq Scan). O custo é escrita mais lenta e espaço em disco.

**Tipos principais:**

| Tipo | Estrutura interna | Quando usar |
|---|---|---|
| **B-tree** | árvore balanceada | padrão; `=`, `<`, `>`, `BETWEEN`, `LIKE 'abc%'` |
| **Hash** | tabela hash | só `=`; raramente melhor que B-tree em Postgres moderno |
| **GIN** | árvore invertida | arrays, JSONB, full-text search (`@>`, `@@`) |
| **BRIN** | faixas por bloco físico | tabelas gigantes com correlação natural de inserção (séries de tempo, logs por data) |

```sql
-- B-tree (default — palavra-chave USING opcional)
CREATE INDEX idx_employees_company_id ON employees (company_id);

-- GIN para JSONB
CREATE INDEX idx_metadata_gin ON events USING GIN (metadata);

-- BRIN para tabela de logs imensa (requer correlação física: linhas mais novas físicamente no fim)
CREATE INDEX idx_logs_created_at_brin ON access_logs USING BRIN (created_at);

-- Índice parcial: só indexa o subconjunto relevante
CREATE INDEX idx_surveys_pending ON surveys (company_id) WHERE status = 'pending';

-- Índice composto: ordem importa (veja abaixo)
CREATE INDEX idx_responses_company_created ON survey_responses (company_id, created_at DESC);
```

**Índice composto — regra de ordem:**
O índice `(company_id, created_at)` serve queries com:
- `WHERE company_id = 123`
- `WHERE company_id = 123 AND created_at > '2024-01-01'`
- `ORDER BY company_id, created_at`

Não serve `WHERE created_at > '2024-01-01'` sozinho — a segunda coluna só é usada se a primeira foi filtrada.

---

## Por que cai em entrevista

Entrevistadores usam índices como proxy para "você entende como banco funciona de verdade". Variações comuns:

- "Quando você criaria um índice? Quando não criaria?"
- "Por que índice numa coluna `boolean` é pior do que sem índice?"
- "Explica a diferença entre B-tree e GIN."
- "Você tem um índice composto `(a, b)`. Quando ele é usado? Quando não é?"
- "O que é um índice parcial? Quando vale a pena?"

---

## Trade-offs

| Cenário | Use índice | Não use índice |
|---|---|---|
| Coluna usada em `WHERE`, `JOIN ON`, `ORDER BY` frequentemente | sim | |
| Coluna de baixa cardinalidade (`boolean`, `status` com 3 valores) | só se parcial | índice full é pior — planner prefere Seq Scan porque retorna 30-50% das linhas |
| Tabela pequena (< 1000 linhas) | | Seq Scan é mais barato |
| Coluna de escrita intensiva (logs, eventos) | com cuidado | cada INSERT/UPDATE mantém o índice |
| JSONB com consultas por chave específica | GIN | B-tree não funciona aqui |
| Tabela de série temporal com bilhões de linhas | BRIN | B-tree fica enorme e não se paga |

**Por que índice em coluna de baixa cardinalidade é veneno:**
Se `active boolean` tem 70% `true`, um índice B-tree retorna 70% das linhas para `WHERE active = true`. O Postgres sabe disso via estatísticas (`pg_statistic`) e opta por Seq Scan — varrer tudo é mais barato do que usar o índice (custo de random I/O do heap > custo de sequential scan). O índice fica parado consumindo espaço e escrita sem ser usado.

**Índice parcial** resolve: `CREATE INDEX idx_users_active ON users (id) WHERE active = false` — indexa só a minoria, custo justificado.

---

## Exercício aplicado (projeto AG real)

PULSAR-RH tem tabela `survey_responses` com colunas `company_id`, `survey_id`, `created_at`, `employee_id`. O dashboard de resultados filtra por `company_id` e ordena por `created_at DESC`.

**Passo 1 — checar índices existentes:**

```sql
-- Rodar no Supabase SQL Editor (projeto PULSAR-RH)
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'survey_responses'
ORDER BY indexname;
```

**Passo 2 — rodar EXPLAIN ANALYZE na query do dashboard:**

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT *
FROM survey_responses
WHERE company_id = '<uuid-real>'
ORDER BY created_at DESC
LIMIT 50;
```

**Passo 3 — se estiver com Seq Scan, criar o índice certo:**

```sql
-- Índice composto: company_id primeiro (filtro), created_at segundo (ordenação)
CREATE INDEX CONCURRENTLY idx_survey_responses_company_created
ON survey_responses (company_id, created_at DESC);
```

`CONCURRENTLY` cria o índice sem travar escrita na tabela — obrigatório em produção.

**Passo 4 — rodar EXPLAIN ANALYZE de novo e comparar custo.**

**Registrar a decisão em `PULSAR-RH/DECISIONS.md`:**

```markdown
## 2026-06-XX — [perf] índice composto em survey_responses

**Problema:** dashboard de resultados com Seq Scan em company_id + order by created_at.
**Opções consideradas:**
- Índice em company_id isolado — serve o WHERE mas força sort extra
- Índice composto (company_id, created_at DESC) — server WHERE + ORDER BY num passo só
**Decisão:** composto com DESC para espelhar o ORDER BY da query principal.
**Consequências:** INSERT em survey_responses ~5% mais lento — aceitável dado volume de leitura.
**Como explicar em entrevista (30s):**
> "Tinha Seq Scan no dashboard principal. Criei índice composto com company_id primeiro
> (filtro multi-tenant) e created_at DESC segundo (ordem do resultado). O planner passou
> a usar Index Scan e o custo caiu de 8000 para 120 unidades no EXPLAIN."
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Quando você NÃO criaria um índice?"

**R (30s):**
"Três casos onde índice atrapalha. Primeiro: coluna de baixa cardinalidade, tipo boolean ou status — se o filtro retorna 30% das linhas, Seq Scan é mais barato que random I/O do índice; nesse caso prefiro índice parcial na minoria. Segundo: tabela pequena — o planner vai ignorar o índice de qualquer forma. Terceiro: coluna com escrita muito intensa, tipo tabela de eventos — todo INSERT mantém o índice, e se ninguém lê por ali o custo é puro overhead."

**P:** "Você tem índice composto `(a, b)`. Quando o Postgres usa ele?"

**R (30s):**
"Quando a query filtra por `a` — com ou sem `b`. Se filtrar só por `b`, o índice não é usado porque B-tree ordena pelo campo mais à esquerda primeiro. A regra é: o índice serve a partir da esquerda, então a coluna mais seletiva e mais usada em `WHERE` vai na primeira posição. Se tiver `ORDER BY b` junto com `WHERE a = x`, coloco `b` em segundo e o planner evita o sort extra."

---

## Checkpoint

- [ ] Sei distinguir quando usar B-tree, GIN e BRIN sem consultar
- [ ] Consigo explicar por que índice em coluna boolean é contraproducente
- [ ] Entendo a regra da coluna mais à esquerda em índice composto
- [ ] Rodei `EXPLAIN ANALYZE` numa query real do PULSAR-RH e li o output
- [ ] Consigo criar índice parcial e explicar quando ele substitui o full index

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Índices Postgres dominados`.

---

## Recursos

- Postgres docs — [Indexes](https://www.postgresql.org/docs/current/indexes.html)
- Postgres docs — [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- use-the-index-luke.com — referência prática de B-tree em SQL
- Supabase — [Database Indexes](https://supabase.com/docs/guides/database/postgres/indexes)
