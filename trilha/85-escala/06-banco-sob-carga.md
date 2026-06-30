# 06 — Banco sob carga

## O que é

Numa esmagadora maioria dos sistemas, **o gargalo é o banco**. App stateless você escala adicionando máquinas (módulo 03); o banco não — ele tem estado, consistência, transações. Quando o tráfego cresce, o app aguenta e o Postgres começa a engasgar. Este módulo é sobre os mecanismos que tiram carga do banco e adiam (ou evitam) o momento em que ele vira o teto.

---

### Read replicas — escalar leitura

A maioria das aplicações é **read-heavy**: muito mais leitura que escrita (ex.: 95% SELECT, 5% INSERT/UPDATE). A jogada: um nó **primary** (escreve) replica os dados pra vários nós **replica** (só leem). Você manda as leituras pras réplicas.

```text
                ┌──────────┐  escrita
   escritas →   │ PRIMARY  │ ───────────┐ replicação (streaming)
                └──────────┘            ▼
                         ┌─────────┐ ┌─────────┐ ┌─────────┐
   leituras ───────────▶ │ replica1│ │ replica2│ │ replica3│
                         └─────────┘ └─────────┘ └─────────┘
1 primary aguentava 1.000 QPS; +3 réplicas → ~4.000 QPS de leitura
```

**A nuance: replication lag (atraso de replicação).** A réplica recebe a mudança alguns ms (às vezes mais) depois do primary. Então logo após uma escrita, ler de uma réplica pode devolver o **dado antigo**.

```text
t=0  user grava perfil no PRIMARY
t=1  user recarrega → lê de uma RÉPLICA que ainda não recebeu → vê dado velho
Mitigação: "read-your-own-writes" → ler do primary logo após escrever;
           réplicas pro resto (relatórios, listagens, dashboards)
```

**Em entrevista:** "Read replica escala leitura porque a maioria da carga é leitura. O preço é consistência eventual: existe replication lag, então uma leitura logo após uma escrita pode ver dado velho. Resolvo lendo do primary nos fluxos que exigem ler a própria escrita, e mando o resto pras réplicas."

---

### Connection pooling — por que o pool importa

Abrir uma conexão com o Postgres é **caro** (handshake, autenticação, alocação de processo no servidor — ~1-5ms cada e memória por conexão). Pior: o Postgres aguenta um número **limitado** de conexões simultâneas (default ~100). Se cada request abre a sua, 1.000 RPS = caos.

```text
Sem pool: cada request abre+fecha conexão → custo de abertura toda vez
          + estoura o limite do Postgres → "too many connections", app cai

Com pool: um conjunto fixo de conexões já abertas é REUTILIZADO
          request pega uma emprestada → usa → devolve ao pool
```

```text
Conta: app aguenta 1.000 requests "em voo", mas Postgres só 100 conexões
→ pool de ~20-50 conexões reusadas serve as 1.000 requests
  (cada query usa a conexão por poucos ms e devolve — Lei de Little de novo)
Ferramentas: PgBouncer, ou o pooler do Supabase, ou o pool do ORM (Prisma)
```

Sem pool, o banco cai por exaustão de conexão muito antes de cair por carga de CPU. É um dos erros mais comuns em produção.

---

### Índices sob carga

Índice transforma busca de **O(n)** (varrer a tabela inteira — *full scan*) em **O(log n)** (árvore B-tree). A diferença explode com o volume:

```text
Tabela com 10.000.000 linhas, query WHERE email = '...'
  Sem índice: full scan → lê ~10M linhas → ~segundos
  Com índice: B-tree → ~23 saltos (log2 de 10M) → ~ms
A ~mesma query, 1.000x mais rápida. Sob carga, é a diferença entre vivo e morto.
```

```sql
-- Sem isto, todo login faz full scan na tabela de usuários
CREATE INDEX idx_users_email ON users (email);

-- Índice composto: ordem importa (filtra por tenant, depois ordena por data)
CREATE INDEX idx_orders_tenant_date ON orders (tenant_id, created_at DESC);
```

Custo do índice: **escrita fica mais lenta** (todo INSERT/UPDATE atualiza os índices) e ocupa disco. Indexe o que você filtra/ordena de verdade — não tudo.

---

### O N+1 em escala

O **problema N+1** é fazer 1 query pra buscar uma lista e depois +1 query por item. Local, com 10 itens, ninguém percebe. Em produção, com 500 itens e 200 RPS, derruba o banco.

```ts
// N+1: 1 query da lista + 1 query por pedido = 1 + N queries
const orders = await db.order.findMany()              // 1 query
for (const o of orders) {
  o.customer = await db.customer.findUnique({ where: { id: o.customerId } }) // +N
}
// 500 pedidos = 501 queries numa request. A 200 RPS = ~100.000 QPS. Morte.

// Corrigido: 1 (ou 2) queries com join / IN
const orders = await db.order.findMany({ include: { customer: true } })
// ou: buscar todos os customers de uma vez com WHERE id IN (...)
```

```text
501 queries → 2 queries. ~250x menos carga no banco pela MESMA tela.
É o bug de escala mais comum que vem de ORM usado sem cuidado.
```

---

### Sharding / particionamento — a intuição

Quando uma tabela fica grande demais pra um nó (bilhões de linhas, escrita além do que um primary aguenta), você **particiona**: divide os dados em pedaços.

```text
Particionamento (numa instância): quebra a tabela por chave/intervalo
  ex.: orders_2024, orders_2025, orders_2026 (por data) — query toca só a partição certa

Sharding (entre instâncias): cada shard é um banco separado com um SUBCONJUNTO
  ex.: shard pela hash do tenant_id → tenants A-M no shard 1, N-Z no shard 2
  cada shard aguenta sua fatia de escrita → escala escrita horizontalmente
```

O custo: queries que cruzam shards (ex.: "soma de tudo") ficam difíceis, e re-shardar é doloroso. Por isso sharding é **último recurso** — você esgota réplicas, cache, pooling e índices antes. A maioria dos sistemas nunca precisa.

---

### Ordem de ataque quando o banco satura

```text
1. Achar a query culpada (EXPLAIN ANALYZE, slow query log) — meça primeiro
2. Índice no que filtra/ordena
3. Matar N+1 (join / IN no lugar de loop de query)
4. Connection pooling (se ainda não tem)
5. Cache de leitura na frente (módulo 04) — tira read do banco
6. Read replicas — escala leitura
7. Sharding/particionamento — só quando escrita de um nó não basta
```

**Em entrevista:** "Quando falam em escalar, eu assumo que o gargalo é o banco até prova em contrário. Antes de pensar em sharding, eu meço a query lenta, indexo, mato N+1, ponho pool e cache, e só então réplicas. Sharding é o último recurso porque complica toda query que cruza shard."
