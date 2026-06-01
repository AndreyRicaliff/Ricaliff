# 02 — Prisma: ORM Type-Safe

## O que é

Prisma tem três peças distintas: **schema** (fonte de verdade do banco), **migrations** (versionamento de schema) e **Client** (query builder type-safe gerado). Confundir as três é a causa de 90% dos problemas com Prisma.

**Schema** define modelos, relações e configurações do banco:

```prisma
model Recording {
  id        String   @id @default(cuid())
  title     String
  createdAt DateTime @default(now())
  sessions  MeetSession[]
}

model MeetSession {
  id          String    @id @default(cuid())
  recordingId String
  recording   Recording @relation(fields: [recordingId], references: [id], onDelete: Cascade)
}
```

**`prisma generate`** lê o schema e gera o Prisma Client — código TypeScript com tipos derivados do schema. Tem que rodar após qualquer mudança no schema.

**`prisma migrate dev`** cria um arquivo SQL de migration com o diff entre o schema atual e o estado do banco. Aplica a migration. Em produção: `prisma migrate deploy` (aplica sem interação).

**`include` vs `select`:**

```typescript
// include — carrega a relação inteira. Conveniente, mas perigoso
const recording = await prisma.recording.findUnique({
  where: { id },
  include: { sessions: true }  // carrega TODOS os campos de todos os sessions
})

// select — especifica exatamente o que você precisa
const recording = await prisma.recording.findUnique({
  where: { id },
  select: {
    id: true,
    title: true,
    sessions: {
      select: { id: true, startedAt: true }  // só o necessário
    }
  }
})
```

**Nunca use `include` sem pensar:** em produção com tabelas grandes, `include` pode trazer 10MB de dados quando você precisava de 1KB. `select` específico é sempre melhor para performance e segurança (não vaza campos que não devem ser expostos).

**Connection pool:** Prisma usa um pool de conexões via Prisma Accelerate ou conexão direta. Em serverless (Vercel/Edge Functions), cada instância cria conexão nova — sem pool, o banco recebe 1000 conexões simultâneas e morre. Solução: Prisma Accelerate ou pgBouncer.

Para projetos AG com servidor dedicado (Meet Hub, Oficina, Varejo), o pool padrão do Prisma é suficiente. Configurar via `connection_limit` na connection string se necessário.

**Transactions:**

```typescript
// Multiple writes que devem ser atômicas
const [recording, session] = await prisma.$transaction([
  prisma.recording.create({ data: { title } }),
  prisma.meetSession.create({ data: { recordingId: '...' } })
])

// Transaction interativa (para lógica condicional)
await prisma.$transaction(async (tx) => {
  const existing = await tx.recording.findFirst({ where: { title } })
  if (existing) throw new Error('Duplicate title')
  return tx.recording.create({ data: { title } })
})
```

**Prisma vs Drizzle vs raw SQL:**

| Critério | Prisma | Drizzle | Raw SQL |
|---|---|---|---|
| Type-safety | Excelente (gerada do schema) | Boa (definida no código) | Manual |
| DX | Excelente | Boa | Difícil |
| Performance | Boa (overhead de abstração) | Melhor (mais próximo do SQL) | Máxima |
| Migrations | CLI própria | CLI própria | Manual |
| Quando usar | Padrão AG | Performance crítica medida | Query complexa específica |

**Quando ORM atrapalha:** queries com `WITH` recursivo, window functions complexas, `EXPLAIN ANALYZE` que mostra plano ruim gerado. Nesses casos, `prisma.$queryRaw` com SQL explícito dentro do Prisma Client.

**Armadilha comum de júnior:** chamar `prisma.model.findMany()` sem `select` em endpoint de lista que pode retornar milhares de registros. Em tabelas com colunas grandes (textos, blobs), isso é problema de memória e latência.

---

## Por que cai em entrevista

ORM é ferramenta cotidiana — entrevistadores verificam se você sabe as armadilhas. Variações:

- "Qual a diferença entre `include` e `select` no Prisma?"
- "Como você faria uma operação atômica com Prisma?"
- "O que acontece com o connection pool em serverless?"
- "Quando você usaria SQL raw em vez do ORM?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Endpoint de lista | `select` específico | Nunca trazer mais que o necessário |
| Endpoint de detalhe com relações | `select` com nested include | Controle sobre volume de dados |
| Criar registro + criar relacionado | `$transaction` | Atômico — ou cria tudo ou nada |
| Query com window function | `$queryRaw` | ORM não expressa bem |
| Schema novo | `prisma migrate dev` | Cria migration versionada |
| Produção | `prisma migrate deploy` | Aplica sem criar nova migration |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver o schema do Meet Hub
cat ~/projetos/meet-hub/apps/api/prisma/schema.prisma

# Ver migrations existentes
ls ~/projetos/meet-hub/apps/api/prisma/migrations/ 2>/dev/null

# Procurar usos de include sem select
grep -rn "include:" ~/projetos/meet-hub/apps/api/src/ | grep -v "select:"
```

Para o schema encontrado, identificar:
1. Relações `1:N` e `N:M` — estão com `onDelete` explícito?
2. Campos que são grandes (longText, JSON) — estão aparecendo em queries de lista?
3. Há algum `findMany` sem `take` (sem paginação)?

```bash
# Encontrar findMany sem paginação
grep -rn "findMany" ~/projetos/meet-hub/apps/api/src/ | grep -v "take:\|skip:"
```

```markdown
## 2026-06-XX — [perf] auditoria de queries Prisma no Meet Hub

**Problemas encontrados:**
1. `recording.findMany()` sem `select` — retorna coluna `transcript` (longtext) em toda listagem
2. Relação `MeetSession → Transcript` sem `onDelete` — orphan records em caso de delete
3. 1 `findMany` sem `take` — se banco crescer, vai trazer tudo

**Decisões:**
- Adicionar `select` explícito em todos os `findMany` de listagem
- Adicionar `onDelete: Cascade` na relação Session→Transcript
- Adicionar `take: 50` padrão com paginação via cursor ou skip/take

**Como explicar em entrevista (30s):**
> "Auditei as queries Prisma do Meet Hub e encontrei um findMany de gravações sem select — em produção traria o campo transcript de cada gravação, que pode ter centenas de KB. Adicionei select explícito com só os campos necessários para a listagem. Também encontrei findMany sem paginação — com 10 mil gravações isso seria catastrófico. Adicionei take padrão de 50 com cursor-based pagination."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre `include` e `select` no Prisma?"
>
> **R (30s):**
> "`include` carrega a relação inteira junto com o modelo pai — todos os campos, todos os registros relacionados que existirem. É conveniente para desenvolvimento, mas perigoso em produção: se um `Recording` tem 500 `MeetSession`s e cada session tem um campo de transcrição, você acabou de trazer centenas de MB sem querer. `select` especifica exatamente quais campos você precisa, inclusive nos modelos relacionados. Em listagens, sempre `select` com os campos mínimos necessários. `include` só em endpoints de detalhe quando você genuinamente precisa da relação completa, e mesmo assim considerar `select` nested."

> **P:** "Como você garantiria atomicidade em múltiplas escritas com Prisma?"
>
> **R (30s):**
> "`prisma.$transaction`. Para writes independentes que devem todos ter sucesso ou todos falhar, passo um array: `prisma.$transaction([create1, create2])`. Para lógica condicional — onde eu preciso ler antes de escrever — uso a forma com callback: `prisma.$transaction(async tx => { ... })`. O `tx` é um client especial que garante que todas as operações rodam na mesma transação de banco. Se qualquer `throw` ocorrer dentro do callback, o Prisma faz rollback automático."

---

## Checkpoint

- [ ] Sei explicar a diferença entre `include` e `select` e quando usar cada
- [ ] Sei usar `$transaction` nas duas formas (array e callback)
- [ ] Li o schema.prisma do Meet Hub e identifiquei ao menos 1 melhoria
- [ ] Encontrei algum `findMany` sem paginação ou sem `select`
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Prisma ORM dominado`.

---

## Recursos

- Prisma Docs — [CRUD](https://www.prisma.io/docs/orm/prisma-client/queries/crud)
- Prisma Docs — [Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- Prisma Docs — [Select Fields](https://www.prisma.io/docs/orm/prisma-client/queries/select-fields)
- `~/projetos/meet-hub/apps/api/prisma/schema.prisma` — caso de estudo real
