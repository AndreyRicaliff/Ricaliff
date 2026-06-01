# 04 — Transactions e isolation levels

## O que é

**Transaction** é um conjunto de operações que o banco trata como uma unidade: ou tudo acontece, ou nada acontece. O Postgres garante as propriedades **ACID**:

| Propriedade | Significa |
|---|---|
| **Atomicity** | tudo ou nada — rollback automático se qualquer operação falhar |
| **Consistency** | o banco nunca fica em estado inválido (constraints, FKs, CHECKs sempre respeitadas) |
| **Isolation** | transactions concorrentes não se interferem (até onde o isolation level garante) |
| **Durability** | após COMMIT, os dados sobrevivem a crash (WAL garante isso) |

```sql
BEGIN;

INSERT INTO surveys (id, company_id, title)
VALUES (gen_random_uuid(), 'company-uuid', 'Pesquisa NR-1 2024');

INSERT INTO questions (id, survey_id, text, order_num)
VALUES
  (gen_random_uuid(), currval('surveys_id_seq'), 'Você sente pressão excessiva?', 1),
  (gen_random_uuid(), currval('surveys_id_seq'), 'Seu líder te apoia?', 2);

-- Se qualquer INSERT falhar, o BEGIN garante rollback automático de ambos
COMMIT;
```

---

## Isolation levels e anomalias

O Postgres tem quatro isolation levels. Cada um bloqueia um conjunto diferente de anomalias:

| Anomalia | Read Committed | Repeatable Read | Serializable |
|---|---|---|---|
| Dirty read | bloqueado | bloqueado | bloqueado |
| Non-repeatable read | possível | bloqueado | bloqueado |
| Phantom read | possível | bloqueado* | bloqueado |
| Write skew | possível | possível | bloqueado |

*Postgres usa MVCC — Repeatable Read já evita phantom na maioria dos casos.

**Dirty read** — ler dados que outra transaction ainda não commitou. Postgres nunca permite isso (nem no Read Committed). Só existe em bancos com isolation menor.

**Non-repeatable read** — você lê um valor, outra transaction commita uma mudança nele, você lê de novo na mesma transaction e o valor mudou.

```
T1: SELECT balance FROM accounts WHERE id = 1  → 1000
T2: UPDATE accounts SET balance = 500 WHERE id = 1; COMMIT;
T1: SELECT balance FROM accounts WHERE id = 1  → 500  ← diferente!
```

**Phantom read** — você busca um conjunto de linhas com um filtro, outra transaction insere uma linha que satisfaz o filtro, você busca de novo e aparece uma linha a mais.

```
T1: SELECT * FROM orders WHERE amount > 100  → 3 linhas
T2: INSERT INTO orders (amount) VALUES (200); COMMIT;
T1: SELECT * FROM orders WHERE amount > 100  → 4 linhas  ← linha fantasma
```

**Write skew** — anomalia mais sutil. Duas transactions leem o mesmo dado, tomam decisões baseadas nele, e ambas escrevem violando uma invariante que só é detectável olhando as duas escritas juntas.

```
-- Regra: deve haver pelo menos 1 médico de plantão
-- T1: SELECT COUNT(*) FROM doctors WHERE on_call = true → 2; UPDATE SET on_call=false WHERE id=1
-- T2: SELECT COUNT(*) FROM doctors WHERE on_call = true → 2; UPDATE SET on_call=false WHERE id=2
-- Resultado: 0 médicos de plantão — cada um achou que o outro ficaria
```

---

## Isolation levels no Postgres

**READ COMMITTED (padrão)**
- Cada statement vê snapshot diferente — snapshot do momento do statement.
- Uso: operações independentes, maioria dos casos.

**REPEATABLE READ**
- Toda a transaction vê o snapshot do momento do BEGIN.
- Usa quando você precisa que múltiplas leituras na mesma transaction sejam consistentes.
- Se outra transaction commitar uma escrita conflitante, o Postgres lança erro e força retry.

**SERIALIZABLE**
- Garante que o resultado é equivalente a alguma execução serial das transactions.
- Detecta write skew. Custo maior — mais retries, mais overhead.
- Usar em operações financeiras, inventory management, qualquer coisa com invariante entre registros.

```sql
-- Definir isolation level antes de qualquer statement da transaction
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT balance FROM accounts WHERE id = 1;
-- ... lógica ...
UPDATE accounts SET balance = balance - 100 WHERE id = 1;
COMMIT;
```

---

## Deadlock

Acontece quando T1 espera T2 liberar um lock, e T2 espera T1 liberar outro lock — ciclo de dependência.

```
T1: UPDATE accounts SET balance = balance - 100 WHERE id = 1  -- trava id=1
T2: UPDATE accounts SET balance = balance - 100 WHERE id = 2  -- trava id=2
T1: UPDATE accounts SET balance = balance + 100 WHERE id = 2  -- espera T2 liberar id=2
T2: UPDATE accounts SET balance = balance + 100 WHERE id = 1  -- espera T1 liberar id=1
-- DEADLOCK: Postgres mata um dos dois, retorna error 40P01
```

**Como evitar:** sempre adquirir locks na mesma ordem. Se toda transaction sempre processa id menor antes do maior, o deadlock acima nunca acontece.

---

## Por que cai em entrevista

- "O que é ACID? Qual letra você acha mais importante?"
- "Qual o isolation level padrão do Postgres?"
- "O que é dirty read? O Postgres permite?"
- "Quando você usaria SERIALIZABLE?"
- "O que causa um deadlock e como você evitaria?"

---

## Trade-offs

| Isolation level | Performance | Anomalias bloqueadas | Quando usar |
|---|---|---|---|
| READ COMMITTED | melhor | dirty read | default — maioria dos casos |
| REPEATABLE READ | médio | + non-repeatable, phantom | relatórios multi-statement, leitura consistente |
| SERIALIZABLE | pior | tudo | financeiro, inventory, invariantes cross-row |

Subir isolation level = mais retries automáticos necessários. No Postgres, SERIALIZABLE usa SSI (Serializable Snapshot Isolation) — mais eficiente que locking, mas ainda tem overhead.

---

## Exercício aplicado (projeto AG real)

No PULSAR-RH, criar uma pesquisa com perguntas precisa ser atômico: se as perguntas falharem (por validação, FK violada, limite excedido), a pesquisa não pode existir sem perguntas.

**Implementação com Prisma (transaction interativa):**

```ts
async function createSurveyWithQuestions(
  companyId: string,
  title: string,
  questions: Array<{ text: string; orderNum: number }>
) {
  // prisma.$transaction garante atomicidade — rollback automático se qualquer operação falhar
  return prisma.$transaction(async (tx) => {
    const survey = await tx.survey.create({
      data: {
        companyId,
        title,
        status: 'draft',
      },
    })

    if (questions.length === 0) {
      throw new Error('Survey must have at least one question')
      // Isso causa rollback do survey.create acima
    }

    await tx.question.createMany({
      data: questions.map((q) => ({
        surveyId: survey.id,
        text: q.text,
        orderNum: q.orderNum,
      })),
    })

    return survey
  })
}
```

**Caso com isolation level explícito — relatório multi-step:**

```ts
// Quando o relatório precisa de múltiplas queries com snapshot consistente
return prisma.$transaction(
  async (tx) => {
    const responses = await tx.surveyResponse.findMany({ where: { surveyId } })
    const employees = await tx.employee.findMany({ where: { companyId } })
    // responses e employees são do mesmo snapshot — ninguém pode inserir dados entre as duas leituras
    return buildReport(responses, employees)
  },
  { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
)
```

**Registrar em `PULSAR-RH/DECISIONS.md`:**

```markdown
## 2026-06-XX — [reliability] transaction em createSurveyWithQuestions

**Problema:** sem transaction, se createMany de questions falhar, survey fica órfã no banco.
**Solução:** prisma.$transaction interativa — rollback automático garante atomicidade.
**Nota:** isolation level padrão (Read Committed) é suficiente aqui — sem leitura multi-statement que precise de snapshot estável.
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "O que é uma transaction e quando você usaria? Qual o isolation level padrão do Postgres?"

**R (30s):**
"Transaction agrupa operações em unidade atômica: tudo commita junto ou tudo faz rollback. Uso sempre que duas ou mais escritas precisam ser consistentes entre si — criar pesquisa com perguntas, debitar de uma conta e creditar em outra. O padrão do Postgres é Read Committed: cada statement vê um snapshot fresco, então você pode ter non-repeatable reads dentro da mesma transaction. Para relatórios multi-statement que precisam de consistência, subo para Repeatable Read. Para invariantes entre registros concorrentes, Serializable — mas com custo de mais retries."

**P:** "O que é write skew? Como você evita?"

**R (30s):**
"Write skew acontece quando duas transactions leem o mesmo dado, cada uma acha que a invariante está OK, e ambas escrevem baseadas nessa leitura — mas a combinação das duas escritas viola a invariante. O exemplo clássico é duas threads removendo o último item em estoque. Read Committed e Repeatable Read não bloqueiam — só Serializable detecta o ciclo de dependência e aborta uma das transactions. Alternativa sem Serializable: usar `SELECT ... FOR UPDATE` para adquirir lock explícito na leitura, forçando serialização manual."

---

## Checkpoint

- [ ] Consigo explicar ACID com exemplo concreto para cada letra
- [ ] Sei a diferença entre dirty read, non-repeatable read, phantom e write skew
- [ ] Sei qual isolation level o Postgres usa por padrão e por que
- [ ] Implementei pelo menos 1 transaction real com Prisma num projeto AG
- [ ] Consigo explicar o que causa deadlock e como a ordem de lock evita

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Transactions e Isolation Levels dominados`.

---

## Recursos

- Postgres docs — [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- Prisma docs — [Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)
- Martin Kleppmann — *Designing Data-Intensive Applications*, cap. 7 (transações — referência obrigatória)
