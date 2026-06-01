# 04 — SQL vs NoSQL: Quando Usar Cada

## O que é

**Bancos relacionais (SQL)** organizam dados em tabelas com schema fixo. Relações entre tabelas são formalizadas por foreign keys. A garantia de consistência é o ACID: **A**tomicity (ou tudo ou nada), **C**onsistency (invariantes mantidas), **I**solation (transações não se veem), **D**urability (commit persiste mesmo com crash).

```sql
-- relação explícita: sale_items sabe de qual product e store vem
SELECT s.name, p.description, SUM(si.quantity)
FROM sale_items si
JOIN products p ON p.id = si.product_id
JOIN stores s ON s.id = si.store_id
GROUP BY s.name, p.description
```

**Bancos NoSQL** agrupam diferentes abordagens: documentos (MongoDB, Firestore), key-value (Redis), colunar (Cassandra), grafo (Neo4j). A maioria segue **BASE**: **B**asically **A**vailable, **S**oft state, **E**ventually consistent. Trocam garantias de consistência por escalabilidade horizontal.

```js
// MongoDB: dado hierárquico em documento único, sem JOIN
{
  _id: "order_123",
  customer: { name: "João", email: "joao@..." },
  items: [
    { product: "Moto X", qty: 1, price: 5000 },
    { product: "Capacete", qty: 2, price: 300 }
  ]
}
```

---

## Por que cai em entrevista

É pergunta de design de sistema — avalia se você pensa antes de escolher tecnologia. Variações reais:

- "Por que você escolheria Postgres ao invés de MongoDB para esse sistema?"
- "O que é ACID? E BASE?"
- "Quando você denormalizaria um banco relacional?"
- "Como você modelaria dados hierárquicos em SQL?"
- "Por que Redis não substitui um banco relacional?"
- "O que é eventual consistency e quando ela é aceitável?"

---

## Trade-offs (quando usar X vs Y)

| Cenário | Postgres ganha | NoSQL ganha |
|---|---|---|
| Dados com relações entre entidades | sim — FK, JOIN, integridade referencial | não — JOIN é caro ou inexistente |
| Transações multi-tabela | sim — ACID nativo | não — eventual consistency |
| Schema estável e bem definido | sim — schema como documentação viva | não — schema-less é vantagem aqui |
| Consultas analíticas complexas | sim — SQL é poderoso e otimizado | não — queries complexas são gambiarras |
| Escala horizontal massiva (> 10M req/s) | difícil — sharding é complexo | sim — Cassandra/DynamoDB nascem horizontais |
| Dados hierárquicos/aninhados sem relações | possível (jsonb) | sim — documento nativo é mais natural |
| Cache / sessão / filas | não — overhead de ACID desnecessário | sim — Redis é a resposta certa aqui |
| Grafo de relações sociais (seguidores, amigos) | possível mas difícil | sim — Neo4j resolve em 1 query o que SQL faz em CTE recursivo |

### Quando Postgres resolve tudo que você precisa

- `jsonb` para dados semi-estruturados sem perder SQL
- `ltree` para hierarquias
- `pg_trgm` para busca textual
- `TimescaleDB` (extensão) para séries temporais
- `pg_partman` para particionamento

**Regra de bolso:** se você não tem certeza, use Postgres. Escala bem o suficiente para a maioria das startups/empresas brasileiras. A complexidade operacional de NoSQL é real e cara. NoSQL faz sentido quando você tem um problema específico que SQL resolve mal — não como default.

### Por que a AG escolheu Postgres

- Relações reais entre entidades (usuário → empresa → pesquisa → resposta)
- Precisamos de transações (atualizar múltiplas tabelas de forma atômica)
- RLS (Row Level Security) do Postgres/Supabase resolve multi-tenant com 0 código extra
- Equipe já domina SQL
- Supabase é Postgres gerenciado com auth, storage e realtime por cima — sem custo extra de operação

---

## Exercício aplicado (projeto AG real)

O CLIENTE OFICINA é o caso mais claro de "por que Postgres e não Mongo". Tem 6 lojas, produtos, vendas, itens de venda — relações reais + transações.

### Passo a passo

1. **Explorar o schema do cliente-oficina-backend:**
   ```bash
   find ~/projetos/cliente-oficina-backend -name "*.prisma" -o -name "schema.prisma" | head -5
   ```
   ```bash
   find ~/projetos/cliente-oficina-backend -name "*.sql" | head -10
   ```
   ```bash
   grep -rn "model \|table \|CREATE TABLE" \
     ~/projetos/cliente-oficina-backend/ --include="*.prisma" --include="*.sql" | head -30
   ```

2. **Identificar as relações entre entidades:**
   - Quantas tabelas existem?
   - Quais têm foreign keys entre si?
   - Qual a relação entre `sale_items`, `products` e `stores`?

3. **Escrever o argumento escrito** (treina explicar decisão técnica):

   Abrir um arquivo temporário `~/projetos/estudos/rascunhos/oficina-argumento-postgres.md` e escrever em 3 parágrafos:
   - Parágrafo 1: o que o sistema faz (negócio)
   - Parágrafo 2: por que as relações entre entidades tornam SQL necessário
   - Parágrafo 3: o que quebraria se fosse MongoDB (eventual consistency numa transação de venda com múltiplos itens)

4. **Verificar o sync de 5 minutos — onde a transação é necessária:**
   ```bash
   grep -rn "transaction\|\$transaction\|BEGIN\|COMMIT" \
     ~/projetos/cliente-oficina-backend/src/ --include="*.ts" | head -20
   ```
   Se não tiver transação explícita onde deveria ter, isso é um bug para anotar.

5. **Registrar no `DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arch] Postgres vs MongoDB para CLIENTE OFICINA

   **Contexto:** sistema de sync Firebird→banco próprio, 6 lojas, dados de venda com itens.
   **Alternativas consideradas:** MongoDB (schema-less, mais simples de começar)
   **Decisão:** Postgres via Supabase.
   **Por quê:**
   - Transação de venda (sale + sale_items) é ACID ou é bug: se metade dos itens falhar,
     o sale não pode existir parcialmente.
   - JOIN entre stores, products, sale_items é a query principal do negócio — Mongo
     exigiria denormalizar tudo ou fazer lookup manual.
   - Supabase já estava em uso no ecossistema AG — zero custo extra de operação.
   **Consequência:** se o volume de vendas cruzar ~50M linhas por tabela, avaliar particionamento.
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que você usaria Postgres ao invés de MongoDB para um sistema de vendas com múltiplas lojas?"
>
> **R (30s):**
> "Porque uma venda é uma transação: ou o sale e todos os sale_items são gravados juntos, ou nenhum é. MongoDB no modo básico não garante isso entre documentos. Com Postgres tenho ACID nativo — se algo falha no meio, o banco faz rollback automático. Além disso, as queries do negócio são todas relacionais: total vendido por loja, produtos mais vendidos, comparativo entre filiais. Com Mongo eu estaria escrevendo aggregation pipelines complexas para fazer o que um JOIN resolve em 3 linhas de SQL."

> **P:** "O que é eventual consistency e quando ela é aceitável?"
>
> **R (30s):**
> "Eventual consistency significa que, após uma escrita, os dados podem ficar desatualizados por um tempo antes de propagar por todos os nós do cluster — mas eventualmente convergem. É aceitável quando o negócio tolera leitura levemente defasada: feed de redes sociais, contador de curtidas, dashboard de analytics com delay de segundos. Não é aceitável quando a consistência é invariante do negócio: saldo bancário, estoque, permissões de acesso. No PULSAR-RH, por exemplo, uma pesquisa marcada como publicada precisa aparecer imediatamente para todos os respondentes — eventual consistency quebraria a UX."

---

## Checkpoint

- [ ] Consigo explicar ACID com um exemplo concreto de cada letra
- [ ] Sei quando Postgres com `jsonb` resolve o que seria tentação de usar Mongo
- [ ] Escrevi o argumento de 3 parágrafos justificando Postgres no CLIENTE OFICINA
- [ ] Sei explicar eventual consistency com um caso onde é e onde não é aceitável
- [ ] Recitei ambas as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — SQL vs NoSQL dominado`.

---

## Recursos

- PostgreSQL Docs — [ACID](https://www.postgresql.org/docs/current/transaction-iso.html)
- MongoDB Docs — [When to Use MongoDB](https://www.mongodb.com/docs/manual/core/data-modeling-introduction/)
- Martin Fowler — [NoSQL Distilled](https://martinfowler.com/books/nosql.html) (o livro, mas o blog tem resumos)
- `~/projetos/PULSAR-RH` — referência real de RLS + multi-tenant em Postgres
