# 08 — Validação com Zod em Boundary

## O que é

Validação tem um lugar certo: **a fronteira do sistema** — onde dados externos entram. HTTP request body, query params, variáveis de ambiente, resposta de API terceira. Fora da fronteira, você tem tipos TypeScript que o compilador garante — duplicar validação é ruído.

**Boundary = ponto onde dado não-confiável entra:**
```
HTTP request body  ← validar aqui
Query params       ← validar aqui
process.env        ← validar no startup
Resposta de API externa ← validar ao receber
---
Chamada de função interna ← TS garante — NÃO validar
Estado de componente     ← TS garante — NÃO validar
```

**Por que Zod em vez de if/else manual:**

```typescript
// Manual — verboso, sem tipo derivado, inconsistente entre rotas
if (!body.title || typeof body.title !== 'string') {
  return res.status(400).json({ error: 'title is required' })
}
if (!body.duration || typeof body.duration !== 'number') { ... }

// Zod — schema declara formato, tipo TypeScript gerado automaticamente
const CreateRecordingSchema = z.object({
  title: z.string().min(1).max(200),
  duration: z.number().positive(),
  participantIds: z.array(z.string().uuid()).min(1),
})

type CreateRecordingInput = z.infer<typeof CreateRecordingSchema>
// TypeScript infere o tipo — não precisa declarar manualmente
```

**`parse` vs `safeParse`:**

```typescript
// parse — lança exceção se inválido
const data = CreateRecordingSchema.parse(req.body)
// Usar com express-async-errors — ZodError sobe para o errorHandler

// safeParse — retorna { success, data } ou { success: false, error }
const result = CreateRecordingSchema.safeParse(req.body)
if (!result.success) {
  return res.status(400).json({
    error: 'Validation failed',
    issues: result.error.issues.map(i => ({ path: i.path, message: i.message }))
  })
}
const data = result.data  // tipado corretamente
```

**Validação de env vars no startup — não no meio do código:**

```typescript
// src/config.ts — executado no startup, processo para se faltar variável
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
})

export const config = EnvSchema.parse(process.env)
// Se faltar variável: ZodError no startup com mensagem clara
// Nunca: process.env.DATABASE_URL no meio de services
```

**Erro user-friendly:** o erro padrão do Zod tem `path` (qual campo falhou) e `message` (o que estava errado). Formatar antes de retornar ao cliente:

```typescript
function formatZodError(error: ZodError) {
  return error.issues.map(issue => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))
}

// Retorna algo como:
// [{ field: "title", message: "String must contain at least 1 character(s)" }]
// [{ field: "participantIds.0", message: "Invalid uuid" }]
```

**Validação de query params:**

```typescript
const ListRecordingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),  // coerce: string "2" → number 2
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
})

app.get('/recordings', (req, res) => {
  const query = ListRecordingsQuerySchema.parse(req.query)
  // query.page e query.limit são number — TypeScript sabe disso
})
```

**Armadilha comum de júnior:** validar dentro de funções de serviço ou repositório. Se a validação é na camada errada, erros chegam ao banco em vez de retornar 400 para o cliente. Toda validação de input HTTP deve estar no controller, antes de chamar o service.

---

## Por que cai em entrevista

Validação e type safety aparecem juntos em entrevistas de backend TypeScript. Variações:

- "Como você validaria o body de um POST?"
- "Qual a diferença entre validação em runtime e type checking do TypeScript?"
- "Como você validaria variáveis de ambiente?"
- "O que é type inference e como Zod usa isso?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Request body | `z.object(...)` + `safeParse` | Error handling explícito |
| Query params | `z.object(...)` com `coerce` | Query params chegam como string |
| Env vars | `z.object(...).parse(process.env)` no startup | Falha rápido, mensagem clara |
| Resposta de API externa | `safeParse` + fallback | API pode mudar sem avisar |
| Dados internos tipados | Sem validação | TypeScript já garante |
| Schema compartilhado front+back | Exportar schema do monorepo | Uma fonte de verdade |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver endpoints do Meet Hub que recebem body
grep -rn "req.body" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null | head -20

# Ver se Zod está instalado
grep '"zod"' ~/projetos/meet-hub/apps/api/package.json 2>/dev/null

# Ver se env vars são validadas no startup
grep -rn "process.env" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null | grep -v "config\|env.ts" | head -10
```

Escolher 1 endpoint que recebe body e adicionar ou melhorar a validação Zod:

```typescript
// Exemplo para o endpoint de criação de sessão (adaptar para estrutura real do Meet Hub)
import { z } from 'zod'

const CreateSessionSchema = z.object({
  meetingUrl: z.string().url('URL de reunião inválida'),
  title: z.string().min(1, 'Título é obrigatório').max(200),
  scheduledAt: z.coerce.date().optional(),
})

type CreateSessionInput = z.infer<typeof CreateSessionSchema>

// No controller
async function createSession(req: Request, res: Response) {
  const result = CreateSessionSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid input',
      issues: result.error.issues.map(i => ({
        field: i.path.join('.'),
        message: i.message,
      }))
    })
  }
  const session = await sessionService.create(result.data)
  res.status(201).json(session)
}
```

```markdown
## 2026-06-XX — [quality] adicionar validação Zod em endpoints do Meet Hub

**Problema:** endpoint POST /sessions aceitava qualquer body. URL de reunião inválida chegava ao banco sem validação.
**Solução:** CreateSessionSchema com z.string().url() para meetingUrl, z.string().min(1) para title.
**Erro retornado:** 400 com array de issues formatados por campo.
**Tipo inferido automaticamente:** `z.infer<typeof CreateSessionSchema>` — sem duplicar tipo manual.
**Como explicar em entrevista (30s):**
> "Adicionei Zod no boundary do endpoint de criação de sessão. O schema declara o formato esperado e infere o tipo TypeScript automaticamente — sem duplicar. Uso safeParse para ter controle explícito do erro e retornar 400 com os campos problemáticos formatados para o cliente. A validação fica no controller, antes de chamar o service — o service recebe dado já validado e assume que está correto."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre type checking do TypeScript e validação em runtime?"
>
> **R (30s):**
> "TypeScript verifica tipos em tempo de compilação — garante que o código está correto do ponto de vista estático. Mas TypeScript some em produção: é JavaScript. Quando dados externos chegam — HTTP body, variável de ambiente, resposta de API — o TypeScript não consegue verificar em runtime. Se o cliente manda `{ title: 123 }` quando esperamos `string`, TypeScript não detecta porque o dado veio de fora do sistema compilado. Zod faz a validação em runtime: parse o dado externo contra o schema, retorna tipo correto se válido, erro claro se inválido. Os dois são complementares — TypeScript garante o interior do código, Zod garante a fronteira."

> **P:** "Por que validar variáveis de ambiente no startup e não onde são usadas?"
>
> **R (30s):**
> "Fail fast: se falta `DATABASE_URL`, quero saber imediatamente ao subir o processo, não quando a primeira request tentar conectar ao banco 5 minutos depois. Com Zod no startup: `EnvSchema.parse(process.env)` — se qualquer variável faltar ou tiver formato errado, o processo encerra com mensagem clara. Sem isso: `undefined` é passado silenciosamente para a connection string, erro de conexão aparece tarde, mensagem é confusa. Além disso, `process.env.DATABASE_URL` espalhado em 10 arquivos é `string | undefined` em todo lugar — com validação no startup e export de `config`, é `string` garantido."

---

## Checkpoint

- [ ] Sei a diferença entre `parse` e `safeParse` e quando usar cada
- [ ] Sei usar `z.infer` para derivar tipos sem duplicar
- [ ] Adicionei ou melhorei validação Zod em pelo menos 1 endpoint do Meet Hub
- [ ] Implementei validação de env vars com Zod no startup de 1 projeto AG
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Validação Zod dominado`.

---

## Recursos

- Zod Docs — [Getting Started](https://zod.dev/)
- Zod Docs — [Error Handling](https://zod.dev/ERROR_HANDLING)
- `~/projetos/meet-hub/apps/api/src/` — endpoints reais para exercício
- `~/.claude/CLAUDE.md` §NODE.JS — regra "validar env vars no startup"
