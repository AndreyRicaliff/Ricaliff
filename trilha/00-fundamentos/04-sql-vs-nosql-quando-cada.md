# 04 — SQL vs NoSQL: Quando Usar Cada

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — o que é um banco, o modelo
> relacional, como ACID é implementado por baixo, o B-tree e o teorema CAP), §Estruturação (a
> taxonomia de bancos e a matriz de trade-off) e §Metodologia (como escolher e quando
> denormalizar) — além da prática, P/R e checkpoint. Teoria por extenso: resumo não forma.

## O que é

**Bancos relacionais (SQL)** organizam dados em tabelas com schema fixo; relações entre tabelas são formalizadas por foreign keys. A garantia de consistência é o **ACID**: **A**tomicity (tudo ou nada), **C**onsistency (invariantes mantidas), **I**solation (transações não se veem no meio), **D**urability (commit sobrevive a crash).

```sql
-- relação explícita: sale_items sabe de qual product e store vem
SELECT s.name, p.description, SUM(si.quantity)
FROM sale_items si
JOIN products p ON p.id = si.product_id
JOIN stores   s ON s.id = si.store_id
GROUP BY s.name, p.description
```

**Bancos NoSQL** agrupam abordagens diferentes: documentos (MongoDB, Firestore), key-value (Redis), colunar (Cassandra), grafo (Neo4j). A maioria segue **BASE**: **B**asically **A**vailable, **S**oft state, **E**ventually consistent. Trocam garantias de consistência por escalabilidade horizontal.

---

## § BASE — o fundamento

**O que é um banco de dados, no fundo.** Dois componentes: **armazenamento durável** (os dados sobrevivem a um desligamento) e uma **engine de consulta** (uma linguagem/API pra ler e escrever eficientemente). A parte difícil não é guardar — é guardar de forma que (a) você **ache** o dado rápido entre milhões de registros, (b) escritas **concorrentes** não se corrompam, e (c) uma queda de energia **no meio** de uma escrita não deixe o dado pela metade. É isso que um SGBD resolve e um arquivo `.json` não.

**O modelo relacional (Codd, 1970).** Antes dos bancos relacionais, dados viviam em estruturas hierárquicas rígidas, e a consulta dependia de *como* estava guardado. Edgar Codd, na IBM, propôs o **modelo relacional**: dados como **relações** (tabelas) de **tuplas** (linhas), com uma **álgebra relacional** (seleção, projeção, junção) por cima. A ideia revolucionária: **separar o que você quer do como buscar**. Você declara `SELECT … WHERE …` (o *quê*); o *query planner* do banco decide o *como* (qual índice, qual ordem de JOIN). **Normalização** é o processo de organizar tabelas pra cada fato viver em um lugar só (sem duplicação) — o que elimina anomalias de update (mudar um dado em 5 lugares e esquecer um). SQL é a linguagem que materializou a álgebra de Codd.

**ACID, e como o banco realmente entrega cada letra.** Não é slogan — cada letra é um mecanismo:

- **Atomicity (atomicidade):** uma transação (`BEGIN … COMMIT`) é tudo-ou-nada. Se falha no meio, **rollback** desfaz tudo. Implementado pelo **WAL (Write-Ahead Log)**: antes de tocar os dados, o banco escreve num log sequencial o que *vai* fazer. Se cair no meio, na recuperação ele relê o log e ou completa (redo) ou desfaz (undo). O log é a fonte da verdade.
- **Consistency (consistência):** a transação leva o banco de um estado válido a outro — foreign keys, `CHECK`, `UNIQUE`, `NOT NULL` são invariantes que o banco recusa violar. (Nota: o "C" do ACID é sobre *invariantes declaradas*, não o "consistency" do CAP, que é outra coisa — fonte eterna de confusão.)
- **Isolation (isolamento):** transações concorrentes não devem ver o meio uma da outra. O Postgres implementa isso com **MVCC (Multi-Version Concurrency Control)**: cada transação enxerga um *snapshot* consistente; escritas criam **novas versões** de linha em vez de sobrescrever, e leitores nunca bloqueiam escritores. Os **níveis de isolamento** (Read Committed → Repeatable Read → Serializable) trocam performance por garantia contra anomalias (dirty read, non-repeatable read, phantom).
- **Durability (durabilidade):** depois do `COMMIT`, o dado sobrevive a crash — porque o WAL foi *fsync*ado no disco antes de confirmar o commit.

**Por que a busca é rápida: o índice B-tree.** Sem índice, achar `WHERE email = 'x'` é varrer a tabela inteira — O(n). Um índice **B-tree** (a estrutura default de quase todo banco relacional) mantém as chaves **ordenadas** numa árvore balanceada, larga e rasa (cada nó tem centenas de filhos, poucos níveis de altura). Buscar vira O(log n): poucos saltos de nó pra chegar na chave. É a mesma ideia do `git bisect` (módulo 06) e da busca binária — descarta metade do espaço a cada passo. O custo do índice: toda escrita precisa manter a árvore ordenada (por isso índice demais deixa o INSERT lento). Saber isso explica por que "faltou índice" é a causa #1 de query lenta.

**O teorema CAP — por que NoSQL abre mão de consistência.** Eric Brewer: num sistema **distribuído** (dados em vários nós), quando há uma **partição de rede** (P — nós que não se falam, e partição *vai* acontecer), você tem que escolher entre **Consistência** (C — todo mundo lê o dado mais recente) e **Disponibilidade** (A — todo request recebe resposta). Não dá pra ter as duas durante a partição. Bancos relacionais num nó não têm esse dilema; sistemas distribuídos massivos (Cassandra, DynamoDB) escolhem **AP** — respondem sempre, mas podem servir um dado levemente velho, e **convergem depois** (eventual consistency). **BASE** é o nome desse regime: *Basically Available, Soft state, Eventually consistent* — o oposto filosófico do ACID. NoSQL não é "banco pior"; é **um trade-off diferente** pra um problema (escala horizontal) que o modelo relacional resolve mal.

**As famílias NoSQL, e o problema que cada uma ataca.** "NoSQL" é guarda-chuva pra modelos que abandonam a tabela relacional: **documento** (MongoDB/Firestore — um JSON aninhado por registro, ótimo quando o dado é lido junto e não tem muitas relações), **key-value** (Redis — um dicionário gigante em memória, ótimo pra cache/sessão/fila), **colunar** (Cassandra — escrita massiva distribuída, séries temporais), **grafo** (Neo4j — quando as *relações* são o dado: quem segue quem, caminhos). Cada um nasceu de um gargalo específico que SQL atendia mal em escala.

**Por que "na dúvida, Postgres" não é preguiça.** Um Postgres num servidor decente aguenta a carga da esmagadora maioria das empresas — e ainda absorve casos "NoSQL" sem sair de casa: `jsonb` (documentos semi-estruturados **com** índice e query SQL), `ltree` (hierarquias), `pg_trgm` (busca textual), extensões pra série temporal e particionamento. A complexidade **operacional** de um cluster NoSQL (sharding, resolução de conflito, backup distribuído) é real e cara. NoSQL se justifica quando você tem um problema específico que SQL resolve mal — não como default.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
BANCOS DE DADOS
├── RELACIONAL (SQL)  ── ACID, schema, JOIN, transação ── Postgres, MySQL, SQLite
│     garante: consistência forte, integridade referencial
│     paga com: escala horizontal difícil (sharding complexo)
└── NÃO-RELACIONAL (NoSQL) ── BASE, schema flexível, escala horizontal
      ├── documento   → MongoDB, Firestore   (JSON aninhado; poucas relações)
      ├── key-value   → Redis                (cache, sessão, fila; em memória)
      ├── colunar     → Cassandra            (escrita massiva, séries temporais)
      └── grafo       → Neo4j                (a relação É o dado: rede social, rotas)
```

**A matriz de decisão** (o que ganha em cada eixo):

| Cenário | Postgres ganha | NoSQL ganha |
|---|---|---|
| Dados com relações entre entidades | **sim** — FK, JOIN, integridade | não — JOIN caro ou inexistente |
| Transações multi-tabela | **sim** — ACID nativo | não — eventual consistency |
| Schema estável e definido | **sim** — schema é documentação viva | não — schema-less é a vantagem aqui |
| Consultas analíticas complexas | **sim** — SQL é poderoso e otimizado | não — vira aggregation pipeline gambiarrado |
| Escala horizontal massiva (>10M req/s) | difícil — sharding complexo | **sim** — Cassandra/DynamoDB nascem horizontais |
| Dados hierárquicos sem relações | possível (`jsonb`) | **sim** — documento nativo é mais natural |
| Cache / sessão / fila | não — overhead de ACID à toa | **sim** — Redis é a resposta certa |
| Grafo de relações (seguidores, rotas) | possível mas difícil (CTE recursivo) | **sim** — Neo4j resolve em 1 query |

**Postgres resolvendo o que seria tentação de NoSQL:** `jsonb` (documento + SQL), `ltree` (hierarquia), `pg_trgm` (busca textual), TimescaleDB (série temporal), `pg_partman` (particionamento).

**Por que a AG/hub escolheu Postgres (via Supabase):** relações reais (usuário → empresa → pesquisa → resposta); transações (atualizar N tabelas atomicamente); **RLS (Row Level Security)** do Postgres resolve multi-tenant com ~0 código extra; equipe já domina SQL; Supabase é Postgres gerenciado com auth, storage e realtime por cima — sem custo operacional de cluster.

**Regra de bolso:** na dúvida, Postgres. NoSQL quando você tem um problema que SQL resolve mal — não como ponto de partida.

---

## § METODOLOGIA — o passo-a-passo replicável

**Escolher o banco pra um sistema novo:**

1. **Os dados têm relações que importam?** (uma venda tem itens, que têm produtos, que têm loja) Sim → relacional é o default forte. As relações são fracas/ausentes e o dado é lido sempre junto? → documento é candidato.
2. **Preciso de transação multi-entidade?** (gravar `sale` + `sale_items` **junto ou nada**) Sim → ACID → relacional. Tolera parcial/eventual? → NoSQL é opção.
3. **A consistência é invariante de negócio?** (saldo, estoque, permissão) Sim → consistência forte (relacional). Tolera leitura defasada por segundos? (feed, contador de likes, analytics) → eventual consistency serve.
4. **A escala exige distribuição massiva HOJE?** Provavelmente não (a maioria dos apps não). Se sim e for o gargalo real → colunar/KV distribuído.
5. **É cache/sessão/fila?** → Redis, sem pensar duas vezes (não é "o banco principal", é uma camada).
6. **Ficou na dúvida?** Postgres. Estende com `jsonb`/`ltree` se aparecer um trecho semi-estruturado.

**Quando denormalizar (mesmo em SQL):** normalizado é o default (cada fato num lugar). Denormalize **só** quando um JOIN medido virou gargalo comprovado e a leitura é muito mais frequente que a escrita — aceitando o custo de manter a cópia em sincronia. Denormalizar por "achismo de performance" é otimização prematura.

**Anti-padrões:**
- **MongoDB pra dado altamente relacional** — você reimplementa JOIN na aplicação (lookups manuais) e perde integridade referencial. A relação existe; o banco só deixou de te ajudar.
- **Redis como banco primário** — é em memória e volátil por natureza; ótimo pra cache, péssimo como fonte da verdade de dado que não pode sumir.
- **Escolher NoSQL "pra escalar"** sem ter o problema de escala — você paga complexidade operacional hoje por um gargalo que talvez nunca chegue.
- **Transação faltando onde o negócio exige atomicidade** — gravar `sale` e `sale_items` em dois passos sem transação: se o segundo falha, sobra uma venda sem itens (dado corrompido silencioso).
- **Confundir o "C" do ACID com o "C" do CAP** — são coisas diferentes; misturar leva a decisão errada.

---

## Passo-a-passo aplicado (faça agora, ~35min)

O **CLIENTE OFICINA** é o caso mais claro de "por que Postgres e não Mongo": lojas, produtos, vendas, itens de venda — relações reais + transações.

1. **Explore o schema:**
   ```bash
   find ~/projetos/cliente-oficina-backend -name "*.prisma" -o -name "*.sql" | head -10
   grep -rn "model \|CREATE TABLE" ~/projetos/cliente-oficina-backend/ --include="*.prisma" --include="*.sql" | head -30
   ```
2. **Mapeie as relações:** quantas tabelas? Quais têm FK entre si? Qual a relação `sale_items` ↔ `products` ↔ `stores`?
3. **Escreva o argumento** (treina defender decisão técnica) em `~/projetos/estudos/rascunhos/oficina-argumento-postgres.md`, 3 parágrafos: (1) o que o sistema faz; (2) por que as relações tornam SQL necessário; (3) o que quebraria em MongoDB — eventual consistency numa venda com múltiplos itens.
4. **Verifique onde a transação é necessária:**
   ```bash
   grep -rn "transaction\|\$transaction\|BEGIN\|COMMIT" ~/projetos/cliente-oficina-backend/src/ --include="*.ts" | head -20
   ```
   Se falta transação onde `sale` + `sale_items` são gravados juntos, é bug — anote.
5. **Registre no `DECISIONS.md`:** contexto (sync ERP-externo → banco próprio), alternativa (Mongo), decisão (Postgres/Supabase), por quê (ACID na venda, JOIN é a query principal), consequência (avaliar particionamento se cruzar ~50M linhas/tabela).

---

## Por que cai em entrevista

É pergunta de design de sistema — avalia se você pensa antes de escolher tecnologia. Variações:

- "Por que Postgres em vez de MongoDB pra esse sistema?"
- "O que é ACID? E BASE?"
- "Quando você denormalizaria um banco relacional?"
- "Como modelar dados hierárquicos em SQL?"
- "Por que Redis não substitui um banco relacional?"
- "O que é eventual consistency e quando é aceitável?"

> **P:** "Por que você usaria Postgres ao invés de MongoDB para um sistema de vendas com múltiplas lojas?"
>
> **R (30s):**
> "Porque uma venda é uma transação: ou o sale e todos os sale_items são gravados juntos, ou nenhum é. MongoDB no modo básico não garante isso entre documentos. Com Postgres tenho ACID nativo — se algo falha no meio, o banco faz rollback automático. Além disso, as queries do negócio são todas relacionais: total vendido por loja, produtos mais vendidos, comparativo entre filiais. Com Mongo eu estaria escrevendo aggregation pipelines complexas para fazer o que um JOIN resolve em 3 linhas de SQL."

> **P:** "O que é eventual consistency e quando ela é aceitável?"
>
> **R (30s):**
> "Eventual consistency significa que, após uma escrita, os dados podem ficar desatualizados por um tempo antes de propagar por todos os nós do cluster — mas eventualmente convergem. É aceitável quando o negócio tolera leitura levemente defasada: feed de redes sociais, contador de curtidas, dashboard de analytics com delay de segundos. Não é aceitável quando a consistência é invariante do negócio: saldo bancário, estoque, permissões de acesso. No PULSAR-RH, por exemplo, uma pesquisa marcada como publicada precisa aparecer imediatamente para todos os respondentes — eventual consistency quebraria a UX."

> **P:** "Como o banco garante que uma transação é 'tudo ou nada' mesmo se cair a energia no meio?"
>
> **R (30s):**
> "Pelo Write-Ahead Log. Antes de tocar os dados de verdade, o banco escreve num log sequencial o que vai fazer, e só confirma o commit depois de garantir que esse log foi para o disco (fsync). Se cair a energia no meio, na recuperação ele relê o WAL: transações confirmadas que não chegaram aos dados são refeitas (redo), transações incompletas são desfeitas (undo). É o WAL que entrega a atomicidade e a durabilidade do ACID — o log é a fonte da verdade, não os arquivos de dados."

## Checkpoint

- [ ] Explico o que um banco resolve que um arquivo não (busca rápida, concorrência, crash no meio)
- [ ] Explico ACID com o mecanismo real de cada letra (WAL, invariantes, MVCC, fsync)
- [ ] Explico o teorema CAP e por que NoSQL distribuído escolhe AP (eventual consistency)
- [ ] Sei quando `jsonb`/Postgres resolve o que seria tentação de Mongo
- [ ] Escrevi o argumento de 3 parágrafos justificando Postgres no CLIENTE OFICINA
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — SQL vs NoSQL dominado`.

---

## Recursos

- **Designing Data-Intensive Applications** (Martin Kleppmann) — cap. 2 "Data Models and Query Languages" (relacional × documento × grafo) e cap. 7 "Transactions" (ACID, níveis de isolamento, MVCC)
- **PostgreSQL Docs** — capítulo "Transaction Isolation" (o "I" do ACID e os níveis) e "Write-Ahead Logging (WAL)"
- **E. F. Codd** — "A Relational Model of Data for Large Shared Data Banks" (1970) — o artigo fundador do modelo relacional
- **Eric Brewer** — "CAP Twelve Years Later: How the 'Rules' Have Changed" (a formulação madura do teorema CAP)
- **MongoDB Docs** — "Data Modeling Introduction" (quando o modelo de documento cabe)
- `~/projetos/PULSAR-RH` — referência real de RLS + multi-tenant em Postgres
