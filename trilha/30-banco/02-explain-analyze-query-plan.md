# 02 — EXPLAIN ANALYZE e query plan

## O que é

`EXPLAIN` mostra o plano de execução que o Postgres escolheu para uma query — sem executar. `EXPLAIN ANALYZE` executa de verdade e compara estimativa com realidade. É a ferramenta principal para entender por que uma query está lenta.

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT u.id, u.email, COUNT(sr.id) AS response_count
FROM users u
LEFT JOIN survey_responses sr ON sr.employee_id = u.id
WHERE u.company_id = 'abc123'
GROUP BY u.id, u.email
ORDER BY response_count DESC;
```

**Anatomia do output:**

```
Gather  (cost=1234.50..5678.90 rows=42 width=44) (actual time=12.3..45.6 rows=38 loops=1)
  ->  Hash Join  (cost=...) (actual time=... rows=... loops=1)
        Hash Cond: (sr.employee_id = u.id)
        ->  Seq Scan on survey_responses sr  (cost=0.00..820.00 rows=... width=8)
              Filter: (company_id = 'abc123')
              Rows Removed by Filter: 9842
        ->  Hash  (cost=...)
              ->  Index Scan using idx_users_company on users u  (cost=...)
                    Index Cond: (company_id = 'abc123')
Planning Time: 0.8 ms
Execution Time: 45.6 ms
```

**O que ler em cada nó:**

| Campo | Significa |
|---|---|
| `cost=X..Y` | custo estimado (unidades arbitrárias do planner): X = startup, Y = total |
| `rows=N` (no `cost=`) | estimativa do planner |
| `rows=N` (no `actual`) | linhas reais retornadas |
| `loops=N` | quantas vezes esse nó executou (relevante em Nested Loop) |
| `Rows Removed by Filter` | linhas lidas mas descartadas — sinal de índice faltando |
| `Buffers: hit=X read=Y` | X = cache (bom); Y = disco (caro) |

---

## Tipos de scan e o que significam

**Seq Scan** — lê a tabela toda, linha por linha.
- Bom: tabelas pequenas, retorno de grande parte das linhas.
- Ruim: tabela grande com filtro que seleciona < 10% das linhas.

**Index Scan** — usa B-tree para localizar blocos, depois busca heap.
- Bom: filtros seletivos, retorno pequeno.
- Custo: random I/O no heap (pior que sequential).

**Index Only Scan** — responde sem acessar o heap, só lendo o índice.
- Acontece quando todas as colunas do SELECT estão no índice.
- Ótimo: evita o random I/O completamente.

**Bitmap Heap Scan** — primeiro varre o índice inteiro, monta um bitmap das páginas, depois lê o heap sequencialmente.
- Meio-termo entre Seq Scan e Index Scan.
- Ocorre quando o retorno é médio (não grande o suficiente para Seq, não pequeno o suficiente para Index).

**Nested Loop** — para cada linha do outer, busca no inner. Barato se inner tem índice e é pequeno. Explode se inner é grande.

**Hash Join** — constrói hash table do menor conjunto, proba o maior. Bom para grandes tabelas sem índice no join.

**Merge Join** — junta dois conjuntos já ordenados. Eficiente se ambos têm índice na coluna de join.

---

## Por que cai em entrevista

- "Essa query está lenta. O que você faz?"
- "O que é Seq Scan? Quando ele é adequado?"
- "Qual a diferença entre cost estimado e actual?"
- "O que significa `Rows Removed by Filter: 50000`?"
- "Como você sabe se o problema é falta de índice ou estatísticas desatualizadas?"

---

## Trade-offs

| Situação | Diagnóstico provável | Ação |
|---|---|---|
| `actual rows` muito diferente de `rows` estimado | estatísticas velhas | `ANALYZE tabela;` ou `VACUUM ANALYZE;` |
| `Seq Scan` com `Rows Removed by Filter` alto | índice faltando na coluna de filtro | criar índice |
| `Buffers: read=X` alto, `hit=X` baixo | dado não está em cache — I/O de disco | `shared_buffers` no postgres.conf ou query mais seletiva |
| `Nested Loop` com `loops=10000` | join sem índice ou join desnecessário | adicionar índice na coluna do inner, ou reescrever com CTE |
| `Index Scan` mesmo com índice mas custo alto | índice fragmentado ou estatísticas velhas | `REINDEX CONCURRENTLY nome_indice;` + `ANALYZE;` |
| `Hash Join` derramando para disco (`Batches > 1`) | `work_mem` insuficiente | `SET work_mem = '64MB';` na sessão para testar |

---

## Exercício aplicado (projeto AG real)

No CLIENTE OFICINA, a sync a cada 5min insere em `sale_items`. O relatório de vendas por loja e período é a query mais consultada.

**Passo 1 — localizar a query no código:**

```bash
grep -rn "sale_items" ~/projetos/cliente-oficina-backend/src/ --include="*.ts" | grep -i "select\|find"
```

**Passo 2 — rodar com EXPLAIN ANALYZE no Supabase SQL Editor:**

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
    sl.name AS store_name,
    DATE_TRUNC('month', si.sale_date) AS month,
    SUM(si.total_amount) AS revenue,
    COUNT(si.id) AS sale_count
FROM sale_items si
JOIN store_locations sl ON sl.id = si.store_id
WHERE si.sale_date >= NOW() - INTERVAL '180 days'
  AND si.store_id = ANY(ARRAY['<loja1>', '<loja2>'])
GROUP BY sl.name, month
ORDER BY month DESC, revenue DESC;
```

**Passo 3 — interpretar o plano:**

Procure por:
1. Seq Scan em `sale_items` com `Rows Removed by Filter` alto → índice em `(store_id, sale_date)`.
2. `actual rows` vs estimado discrepante em mais de 10x → `ANALYZE sale_items;`.
3. `Buffers: read` alto → query está indo ao disco; avaliar se `shared_buffers` está adequado.

**Passo 4 — criar índice e comparar:**

```sql
-- Índice composto para a query de relatório
CREATE INDEX CONCURRENTLY idx_sale_items_store_date
ON sale_items (store_id, sale_date DESC);

-- Rodar EXPLAIN ANALYZE de novo e comparar o campo "cost=" e "Execution Time"
```

**Registrar em `cliente-oficina-backend/DECISIONS.md`:**

```markdown
## 2026-06-XX — [perf] EXPLAIN ANALYZE na query de relatório de vendas

**Achado:** Seq Scan em sale_items (180d), 400k linhas removidas por filtro.
**Ação:** índice composto (store_id, sale_date DESC).
**Resultado:** Execution Time caiu de Xms para Yms (medir e preencher).
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Uma query está demorando 8 segundos em produção. Como você investiga?"

**R (30s):**
"Primeiro rodo `EXPLAIN (ANALYZE, BUFFERS)` na query. Leio de baixo para cima — os nós folha são os mais importantes. Procuro por três sinais: Seq Scan em tabela grande com `Rows Removed by Filter` alto (índice faltando), diferença grande entre estimativa e `actual rows` (estatísticas velhas — `ANALYZE`), e `Buffers: read` alto com `hit` baixo (dado não cacheado, pressão de I/O). Se o planner tem boas estatísticas mas ainda escolheu Seq Scan, verifico se o índice existe e se a query usa a coluna na ordem certa do índice composto."

**P:** "Qual a diferença entre Index Scan e Bitmap Heap Scan?"

**R (30s):**
"Index Scan vai ao heap para cada linha encontrada no índice — ótimo para retorno pequeno, mas é random I/O. Bitmap Heap Scan primeiro varre o índice inteiro, monta um bitmap das páginas do heap, depois lê o heap em ordem — troca random I/O por sequential I/O. O Postgres escolhe Bitmap quando o retorno estimado é médio. Se eu vejo Bitmap onde esperava Index Scan, geralmente significa que a query está retornando mais linhas do que parece — ou o índice não é seletivo o suficiente."

---

## Checkpoint

- [ ] Sei ler um output de EXPLAIN ANALYZE identificando o nó mais caro
- [ ] Entendo a diferença entre custo estimado e actual time/rows
- [ ] Sei distinguir Seq Scan, Index Scan e Bitmap Heap Scan e quando cada um é adequado
- [ ] Rodei EXPLAIN ANALYZE em pelo menos 1 query real de projeto AG
- [ ] Identifico `Rows Removed by Filter` como sinal de índice faltando

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — EXPLAIN ANALYZE dominado`.

---

## Recursos

- Postgres docs — [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)
- explain.dalibo.com — visualizador gráfico de planos (colar o JSON do EXPLAIN)
- pganalyze.com/docs — análise de slow queries no Postgres
