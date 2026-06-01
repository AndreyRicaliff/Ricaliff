# 06 — Particionamento e retenção

## O que é

Particionamento divide uma tabela grande em partes menores (partições) que o Postgres gerencia automaticamente. Para o usuário, a tabela parece uma só — queries, índices e RLS funcionam normalmente. Por baixo, cada partição é um arquivo físico separado.

```sql
-- Tabela pai (não armazena dados diretamente)
CREATE TABLE sale_items (
    id          uuid        NOT NULL DEFAULT gen_random_uuid(),
    store_id    uuid        NOT NULL,
    sale_date   date        NOT NULL,
    product_id  uuid        NOT NULL,
    quantity    int         NOT NULL,
    unit_price  numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
) PARTITION BY RANGE (sale_date);

-- Partições mensais
CREATE TABLE sale_items_2024_01
  PARTITION OF sale_items
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE sale_items_2024_02
  PARTITION OF sale_items
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

**Tipos de particionamento:**

| Tipo | Quando usar | Exemplo |
|---|---|---|
| RANGE | dados com faixa contínua ordenada (datas, IDs sequenciais) | `sale_date`, `created_at` |
| LIST | conjunto discreto de valores | `region`, `status`, `country_code` |
| HASH | distribuição uniforme sem semântica natural | sharding por `user_id` quando não tem range |

---

## Por que particionar

**Partition pruning** — quando a query filtra pela coluna de particionamento, o Postgres descarta partições inteiras sem ler. `WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01'` lê só a partição de janeiro — 1 arquivo em vez de 100.

**DROP PARTITION em vez de DELETE** — para retenção LGPD de 180 dias, `DELETE FROM sale_items WHERE sale_date < now() - interval '180 days'` precisa varrer a tabela, locks custosos, transaction longa. `DROP TABLE sale_items_2023_11` é instantâneo — o Postgres apenas descarta o arquivo da partição.

**Índices menores** — índice em partição de 1 mês é muito menor que índice na tabela inteira — cabe em memória, mais rápido.

---

## Quando vale particionar

Regras práticas:
- Tabela acima de 10-100M linhas (o threshold depende do hardware).
- Existe um padrão claro de acesso por faixa (quase sempre datas).
- Retenção periódica é necessária (LGPD, compliance).
- Índices da tabela não cabem mais em `shared_buffers`.

**Quando não vale:**
- Tabela pequena — overhead de gerenciar partições supera o ganho.
- Queries sempre varrem múltiplas partições sem filtro seletivo — sem partition pruning, o planner une tudo de qualquer forma.
- Schema muda frequentemente — `ALTER TABLE` em tabela particionada é mais trabalhoso.

---

## Retenção LGPD 180 dias

Para `sale_items` do CLIENTE OFICINA, a retenção de 180 dias é obrigação legal (dado de transação com CPF/dados pessoais). A abordagem com particionamento mensal:

```sql
-- Checar qual partição representa dados com > 180 dias
-- Com partições mensais, a cada mês você descarta a partição mais antiga

-- Procedimento de limpeza (rodar mensalmente via cron ou pg_cron)
DROP TABLE IF EXISTS sale_items_2023_11;  -- mês que passou dos 180 dias

-- Criar partição do próximo mês antes de precisar dela
CREATE TABLE sale_items_2024_07
  PARTITION OF sale_items
  FOR VALUES FROM ('2024-07-01') TO ('2024-08-01');
```

**Alternativa sem particionamento (tabela menor < 10M linhas):**

```sql
-- DELETE em lotes para não travar a tabela toda
DO $$
DECLARE
  deleted int;
BEGIN
  LOOP
    DELETE FROM sale_items
    WHERE id IN (
      SELECT id FROM sale_items
      WHERE sale_date < now() - interval '180 days'
      LIMIT 1000
    );
    GET DIAGNOSTICS deleted = ROW_COUNT;
    EXIT WHEN deleted = 0;
    PERFORM pg_sleep(0.1);  -- pausa para não monopolizar I/O
  END LOOP;
END $$;
```

---

## Por que cai em entrevista

- "Como você implementaria retenção de 180 dias em tabela grande?"
- "O que é partition pruning?"
- "Por que DROP PARTITION é mais eficiente que DELETE com WHERE?"
- "Quando você NÃO particionaria uma tabela?"

---

## Trade-offs

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| Particionamento range (data) | DROP instantâneo, pruning automático, índices menores | overhead de DDL; queries sem filtro de data perdem pruning |
| DELETE periódico em lote | mais simples, sem mudança de schema | lento para tabelas grandes; locks; VACUUM necessário depois |
| Tabela de arquivo (mover para outra tabela) | dado preservado se necessário | operação custosa; 2 tabelas para manter |

---

## Exercício aplicado (projeto AG real)

CLIENTE OFICINA: planejar particionamento de `sale_items` (~6 lojas, sync a cada 5min, retenção 180d).

**Estimativa de volume:**

```sql
-- No banco atual, checar volume real
SELECT
    COUNT(*) AS total_rows,
    MIN(sale_date) AS oldest,
    MAX(sale_date) AS newest,
    COUNT(DISTINCT store_id) AS stores,
    pg_size_pretty(pg_total_relation_size('sale_items')) AS table_size
FROM sale_items;
```

**Decisão de arquitetura — perguntas a responder antes de implementar:**

1. Qual o volume atual de `sale_items`? (se < 5M, particionamento pode ser prematuro)
2. As queries de relatório sempre filtram por `sale_date`? (partition pruning só funciona se sim)
3. Tem `FOREIGN KEY` apontando para `sale_items`? (FKs em tabelas particionadas têm limitações)

**Plano de particionamento para OFICINA (assumindo volume justifica):**

```sql
-- Passo 1: criar a nova tabela particionada
CREATE TABLE sale_items_partitioned (
    LIKE sale_items INCLUDING ALL
) PARTITION BY RANGE (sale_date);

-- Passo 2: criar partições para os últimos 180 dias + próximos 2 meses
-- (script para gerar dinamicamente)
DO $$
DECLARE
  m date := DATE_TRUNC('month', now() - interval '6 months');
BEGIN
  WHILE m <= DATE_TRUNC('month', now() + interval '2 months') LOOP
    EXECUTE format(
      'CREATE TABLE sale_items_%s PARTITION OF sale_items_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      TO_CHAR(m, 'YYYY_MM'),
      m,
      m + interval '1 month'
    );
    m := m + interval '1 month';
  END LOOP;
END $$;

-- Passo 3: migrar dados (fora de janela de manutenção)
INSERT INTO sale_items_partitioned SELECT * FROM sale_items;

-- Passo 4: rename atômico (com lock mínimo)
ALTER TABLE sale_items RENAME TO sale_items_old;
ALTER TABLE sale_items_partitioned RENAME TO sale_items;
```

**Registrar em `cliente-oficina-backend/DECISIONS.md`:**

```markdown
## 2026-06-XX — [arch] plano de particionamento sale_items

**Contexto:** tabela cresce ~2k linhas/dia (estimativa), retenção LGPD 180d obrigatória.
**Trigger para implementar:** quando tabela atingir 5M linhas ou DELETE periódico > 30s.
**Plano:** PARTITION BY RANGE (sale_date), partições mensais, DROP mensal da partição mais antiga.
**Alerta:** verificar FKs antes — sale_items é referenciada por alguma tabela?
**Como explicar em entrevista (30s):**
> "Para retenção LGPD com tabela crescente, prefiro particionamento mensal por data.
> Quando o mês passa dos 180 dias, DROP TABLE na partição é instantâneo — sem
> DELETE lento, sem VACUUM custoso. E as queries de relatório que filtram por data
> ganham partition pruning automático."
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Você tem uma tabela de transações que cresce 2 mil linhas por dia e precisa reter só os últimos 180 dias por LGPD. Como você implementaria?"

**R (30s):**
"Se o volume já justifica (acima de 5-10 milhões de linhas), particionamento por range em sale_date, com partições mensais. A cada mês, `DROP TABLE sale_items_YYYY_MM` descarta o mês mais antigo instantaneamente — sem DELETE de 200 mil linhas, sem lock, sem VACUUM posterior. Se o volume ainda é pequeno, faço DELETE em lote com LIMIT para não travar: deleto 1000 linhas por vez com um loop e sleep mínimo entre cada batch. Em qualquer caso, tenho um job agendado que roda mensalmente."

**P:** "O que é partition pruning e quando ele NÃO acontece?"

**R (30s):**
"Partition pruning é o Postgres descartando partições inteiras quando a query filtra pela coluna de particionamento. Se tenho 24 partições mensais e filtro por `WHERE sale_date >= '2024-01-01' AND sale_date < '2024-02-01'`, o planner lê só 1 partição. Pruning não acontece quando: o filtro usa uma função na coluna (`WHERE DATE_TRUNC('month', sale_date) = '2024-01-01'` — Postgres não sabe qual partição olhar); quando a query não filtra pela coluna de particionamento (Seq Scan em todas as partições); ou quando o valor é parâmetro bind e o plano foi gerado sem o valor (plan caching)."

---

## Checkpoint

- [ ] Sei criar tabela particionada por RANGE com partições mensais
- [ ] Entendo por que DROP PARTITION é mais eficiente que DELETE em lote
- [ ] Sei o que é partition pruning e quando ele falha
- [ ] Calculei o volume atual de `sale_items` do OFICINA e avaliei se particionamento é necessário
- [ ] Registrei o plano de particionamento com o gatilho de volume para implementar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Particionamento e retenção dominados`.

---

## Recursos

- Postgres docs — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Postgres docs — [Partition Pruning](https://www.postgresql.org/docs/current/ddl-partitioning.html#DDL-PARTITION-PRUNING)
- Supabase docs — [pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron) (agendar DROP de partição)
