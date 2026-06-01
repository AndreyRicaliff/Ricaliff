# 03 — N+1 e como evitar

## O que é

N+1 é quando você faz 1 query para buscar N registros e depois N queries adicionais para buscar dados relacionados de cada um. O resultado é N+1 queries no banco quando poderia ser 1 (ou 2 no máximo).

**Exemplo clássico — sem Prisma:**

```ts
// 1 query para buscar as pesquisas
const surveys = await db.query('SELECT * FROM surveys WHERE company_id = $1', [companyId])

// N queries — 1 para cada pesquisa
for (const survey of surveys) {
  const questions = await db.query(
    'SELECT * FROM questions WHERE survey_id = $1',
    [survey.id]
  )
  survey.questions = questions.rows
}
// Com 50 pesquisas: 51 queries. Com 500: 501 queries.
```

**Exemplo com Prisma — N+1 implícito:**

```ts
// Parece inofensivo, mas lazy-load não existe no Prisma
const surveys = await prisma.survey.findMany({ where: { companyId } })

for (const survey of surveys) {
  // Prisma não faz lazy load — isso vai quebrar ou forçar uma query por iteração
  // dependendo de como o acesso está estruturado
  const count = await prisma.question.count({ where: { surveyId: survey.id } })
}
```

**Como detectar:**

```ts
// Ativar log de queries no Prisma (development)
const prisma = new PrismaClient({
  log: ['query'],
})
// Assistir o console: se você vê o mesmo padrão de query se repetindo N vezes, é N+1
```

No Supabase: ativar "Log queries" no painel ou usar `pg_stat_statements`.

---

## Como resolver

**Opção 1 — `include` no Prisma (eager loading):**

```ts
// 2 queries totais (1 para surveys, 1 para questions via IN)
const surveys = await prisma.survey.findMany({
  where: { companyId },
  include: {
    questions: {
      orderBy: { order: 'asc' },
    },
  },
})
// surveys[0].questions já está populado — sem loop adicional
```

**Opção 2 — `select` específico (mais eficiente que include):**

```ts
const surveys = await prisma.survey.findMany({
  where: { companyId },
  select: {
    id: true,
    title: true,
    _count: { select: { questions: true } },  // COUNT agregado, sem buscar cada question
  },
})
```

**Opção 3 — query única com JOIN (SQL puro quando Prisma não alcança):**

```sql
SELECT
    s.id,
    s.title,
    COUNT(q.id) AS question_count,
    COUNT(sr.id) AS response_count
FROM surveys s
LEFT JOIN questions q ON q.survey_id = s.id
LEFT JOIN survey_responses sr ON sr.survey_id = s.id
WHERE s.company_id = $1
GROUP BY s.id, s.title;
```

**Opção 4 — `IN` query manual (quando o loop é inevitável):**

```ts
const surveys = await prisma.survey.findMany({ where: { companyId } })
const surveyIds = surveys.map(s => s.id)

// 1 query para todos os IDs — não N queries
const questions = await prisma.question.findMany({
  where: { surveyId: { in: surveyIds } },
})

// Agrupa em memória
const questionsBySurvey = questions.reduce((acc, q) => {
  acc[q.surveyId] ??= []
  acc[q.surveyId].push(q)
  return acc
}, {} as Record<string, typeof questions>)
```

---

## Quando N+1 é aceitável (lazy load proposital)

N+1 não é sempre errado. É aceitável quando:

- O loop roda em background (não em path de request do usuário).
- A relação raramente é acessada (otimização prematura).
- O volume de N é pequeno e garantidamente limitado (N < 10, garantido por domínio).
- Você está priorizando clareza em código de setup/seed.

A regra: N+1 em request HTTP que serve usuário real = problema. N+1 em script batch overnight = avaliar pelo volume.

---

## Por que cai em entrevista

- "Como você identificaria um N+1 no seu código?"
- "O que é eager loading vs lazy loading?"
- "Você tem uma lista de 100 usuários e precisa do nome do departamento de cada um. Como faz?"
- "Mostra como você resolveria esse código" (mostram loop com query dentro).

---

## Trade-offs

| Solução | Vantagem | Desvantagem |
|---|---|---|
| `include` Prisma | código limpo, automático | retorna todos os campos do relacionado; pode trazer dados demais |
| `select` com `_count` | dado mínimo, 1 query | não dá acesso aos registros individuais |
| JOIN SQL puro | máximo controle | mais verboso, quebra type-safety Prisma |
| `IN` manual + reduce | flexível, reutilizável | mais código; lógica de agrupamento na aplicação |

---

## Exercício aplicado (projeto AG real)

No PULSAR-RH, o endpoint que lista pesquisas com o número de respostas é candidato clássico a N+1.

**Passo 1 — localizar o endpoint:**

```bash
grep -rn "survey\|pesquisa" ~/projetos/PULSAR-RH/src/ --include="*.ts" | grep -i "findMany\|getAll\|list"
```

**Passo 2 — ativar log de queries temporariamente:**

```ts
// Em src/lib/prisma.ts ou onde o client é instanciado
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query'] : [],
})
```

**Passo 3 — chamar o endpoint e contar as queries no terminal:**

Se aparecer `SELECT ... FROM questions WHERE survey_id = 'uuid'` repetido, é N+1.

**Passo 4 — corrigir com `_count`:**

```ts
// Antes (N+1):
const surveys = await prisma.survey.findMany({ where: { companyId } })
for (const s of surveys) {
  s.responseCount = await prisma.surveyResponse.count({ where: { surveyId: s.id } })
}

// Depois (2 queries no máximo):
const surveys = await prisma.survey.findMany({
  where: { companyId },
  select: {
    id: true,
    title: true,
    status: true,
    createdAt: true,
    _count: {
      select: { surveyResponses: true, questions: true },
    },
  },
})
```

**Registrar em `PULSAR-RH/DECISIONS.md`:**

```markdown
## 2026-06-XX — [perf] eliminar N+1 no endpoint de listagem de pesquisas

**Problema:** loop com prisma.surveyResponse.count por survey — N queries por request.
**Solução:** _count no select do findMany — 1 query com subquery de COUNT.
**Resultado:** endpoint caiu de N+1 para 1 query independente do volume de pesquisas.
**Como explicar em entrevista (30s):**
> "Tinha N+1 na listagem de pesquisas — contagem de respostas por pesquisa virava N queries.
> Resolvi com _count no select do Prisma: o ORM gera uma subquery de COUNT embutida,
> e o resultado chega numa query só."
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Você tem uma listagem de posts com o número de comentários de cada um. Como implementa sem N+1?"

**R (30s):**
"Com Prisma, uso `_count` no `select` — o ORM gera um `COUNT` embutido na mesma query. Se precisar dos comentários em si, uso `include: { comments: true }` e o Prisma faz 2 queries: uma para posts, uma para todos os comentários via `IN` nos IDs. Nunca faço loop com `count` ou `findMany` dentro — isso vira N+1. Se a query for mais complexa, escrevo SQL com `LEFT JOIN` e `COUNT(c.id)` agrupado por post. A decisão entre `include` e SQL puro depende de quantas colunas preciso e se preciso de filtros no relacionado."

**P:** "Como você detectaria N+1 em produção?"

**R (30s):**
"Com Prisma eu ativo `log: ['query']` no desenvolvimento e assisto o padrão de queries. Se vejo o mesmo SELECT com parâmetro diferente se repetindo N vezes, é N+1. Em produção, uso `pg_stat_statements` para ver as queries mais frequentes — N+1 aparece como a mesma query com muitas execuções em curto período. No Supabase, o painel de performance mostra queries lentas e contagem de execuções."

---

## Checkpoint

- [ ] Consigo identificar N+1 num bloco de código sem precisar rodar
- [ ] Sei usar `include` vs `select` com `_count` no Prisma e quando escolher cada um
- [ ] Entendo quando N+1 é aceitável (background, volume fixo pequeno)
- [ ] Encontrei e corrigi pelo menos 1 N+1 real num projeto AG
- [ ] Sei usar `pg_stat_statements` ou log do Prisma para detectar N+1

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — N+1 dominado`.

---

## Recursos

- Prisma docs — [Select fields](https://www.prisma.io/docs/concepts/components/prisma-client/select-fields)
- Prisma docs — [Relation queries](https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries)
- Postgres docs — [pg_stat_statements](https://www.postgresql.org/docs/current/pgstatstatements.html)
