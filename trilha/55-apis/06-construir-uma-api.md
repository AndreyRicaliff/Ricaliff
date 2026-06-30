# 06 — Construir uma API

## O que é

Do outro lado do fetch. Uma API HTTP bem construída tem quatro camadas claras: **rota** (qual recurso/método), **handler** (a lógica), **middleware** (o que roda antes/depois de todo handler) e **tratamento de erro centralizado**. Misturar tudo num arquivo é o padrão de júnior que não escala. Exemplo em Express, mas o modelo é universal.

## Rota, handler, middleware

A requisição percorre um **pipeline** de funções `(req, res, next)` na ordem de registro. Cada uma encerra (`res.send`) ou passa adiante (`next`).

```ts
import express from 'express'
const app = express()

app.use(express.json())          // 1. parseia body JSON
app.use(requestLogger)           // 2. loga toda request
app.use('/v1/users', usersRouter) // 3. rotas do recurso
app.use(errorHandler)            // 4. captura erros — SEMPRE por último
```

Middleware é reuso de comportamento transversal (log, auth, CORS). **Ordem = execução**: se `authenticate` vier depois das rotas, elas rodam sem auth.

## Validação na boundary

Input do mundo externo é **hostil até prova em contrário**. Valide na entrada (boundary) com schema; depois disso o dado é confiável e você não revalida em camada interna. Zod é o padrão.

```ts
import { z } from 'zod'

const createUser = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
})

function validate(schema: z.ZodSchema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new ApiError(422, 'validation_failed', result.error.issues))
    }
    req.body = result.data    // dado tipado e limpo daqui pra frente
    next()
  }
}
```

## Status codes corretos no handler

O handler **diz a verdade** pelo status. Criou? `201` + `Location`. Deletou sem retorno? `204`. Não achou? `404`.

```ts
const usersRouter = express.Router()

usersRouter.post('/', validate(createUser), asyncHandler(async (req, res) => {
  const user = await db.users.create(req.body)
  res.status(201).location(`/v1/users/${user.id}`).json(user)
}))

usersRouter.get('/:id', asyncHandler(async (req, res) => {
  const user = await db.users.find(req.params.id)
  if (!user) throw new ApiError(404, 'not_found', 'user does not exist')
  res.status(200).json(user)
}))

usersRouter.delete('/:id', asyncHandler(async (req, res) => {
  await db.users.delete(req.params.id)
  res.status(204).end()        // sem body
}))
```

## Tratamento de erro centralizado

Um lugar só decide como erro vira resposta — handlers só fazem `throw`. Em Express, error middleware tem **4 parâmetros** (é como o framework o reconhece) e fica por último.

```ts
class ApiError extends Error {
  constructor(public status: number, public code: string, public detail?: unknown) {
    super(code)
  }
}

function errorHandler(err, req, res, next) {
  const status = err instanceof ApiError ? err.status : 500
  const code = err instanceof ApiError ? err.code : 'internal_error'
  if (status >= 500) console.error(err)            // loga só o que é bug do servidor
  res.status(status).json({ error: { code, detail: err.detail, request_id: req.id } })
}
```

Como Express **não** captura `throw` em handler `async`, envolva com um wrapper que encaminha a rejeição pro `next`:

```ts
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
```

## CORS — o que é

CORS (*Cross-Origin Resource Sharing*) é uma **proteção do browser**, não do servidor. Por padrão, JavaScript numa página `app.com` **não pode** ler a resposta de `api.outro.com` (origem diferente = protocolo+host+porta diferentes). O servidor precisa **autorizar explicitamente** via headers, senão o browser bloqueia a leitura.

```ts
import cors from 'cors'
app.use(cors({
  origin: ['https://app.empresa.com'],   // quem pode chamar (NÃO use "*" com credenciais)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,                      // permite cookies/Authorization
}))
```

Pontos-chave: (1) CORS só existe **no browser** — `curl`/server-to-server ignora; (2) requisições "não simples" disparam um **preflight** `OPTIONS` automático que o servidor precisa responder; (3) `Access-Control-Allow-Origin: *` **não** combina com `credentials: true`.

**Em entrevista:** "Construo a API em camadas: middlewares (json, log, auth, CORS) em ordem, rotas por recurso, validação com Zod na boundary, status code correto no handler (201+Location ao criar, 204 ao deletar, 404 quando não acha), e um error handler central de 4 parâmetros que traduz exceções num envelope de erro. CORS é proteção do browser: o servidor declara quais origens podem ler a resposta."
