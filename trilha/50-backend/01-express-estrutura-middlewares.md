# 01 — Express: Estrutura e Middlewares

## O que é

Express é um framework minimalista: ele não impõe estrutura, apenas fornece um pipeline. Entender esse pipeline é o que separa código que funciona de código que escala.

**O pipeline de middlewares:** toda requisição percorre uma sequência de funções `(req, res, next)` em ordem. Cada função pode encerrar a requisição (chamar `res.send()`) ou passar para a próxima (chamar `next()`). **A ordem de registro é a ordem de execução.**

```typescript
// Middleware é qualquer função (req, res, next) => void
app.use(express.json())          // 1. parse body
app.use(requestLogger)           // 2. loga request
app.use(authenticate)            // 3. verifica token
app.use('/api', apiRouter)       // 4. rota
app.use(errorHandler)            // 5. captura erros — DEVE ser o último
```

**Por que ordem importa:** se você registrar `authenticate` depois das rotas, as rotas rodam sem autenticação. Se `errorHandler` não for o último, erros das rotas não chegam nele.

**Error middleware** tem assinatura diferente — 4 parâmetros:

```typescript
// Express detecta que é error handler pela aridade (4 params)
function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
}
app.use(errorHandler)  // último middleware
```

**Async errors — o problema:** Express não captura erros em handlers assíncronos por padrão. `throw` dentro de `async` não chega no `errorHandler`.

```typescript
// QUEBRA — erro não chega no errorHandler
app.get('/recordings', async (req, res) => {
  const data = await db.query()  // se jogar erro, processo cai sem resposta
  res.json(data)
})

// FIX 1: express-async-errors (monkey-patch global, simples)
require('express-async-errors')  // importar antes de registrar rotas
// Agora throw em async handlers chega no errorHandler

// FIX 2: wrapper manual
const asyncHandler = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(fn(req, res, next)).catch(next)

app.get('/recordings', asyncHandler(async (req, res) => {
  const data = await db.query()
  res.json(data)
}))
```

**Separação de responsabilidades:** tudo em uma rota é o padrão de júnior que não escala.

```
routes/       — apenas registra path + método → delega para controller
controllers/  — recebe req, valida, chama service, formata resposta
services/     — lógica de negócio, sem conhecimento de HTTP
repositories/ — acesso ao banco (opcional se Prisma já é a camada)
```

```typescript
// router — só rota
recordingsRouter.get('/', recordingsController.list)

// controller — só HTTP
async function list(req: Request, res: Response) {
  const recordings = await recordingsService.findAll()
  res.json(recordings)
}

// service — só negócio
async function findAll() {
  return prisma.recording.findMany({ select: { id: true, title: true } })
}
```

**Por que Express continua sendo o padrão AG:** simples, bem documentado, sem magia. Fastify tem mais throughput bruto, mas a diferença importa só em benchmarks — para APIs AG o gargalo é I/O (banco, fila), não o framework.

**Armadilha comum de júnior:** registrar `express.json()` depois das rotas. Body chega `undefined` e a busca pelo bug leva horas.

---

## Por que cai em entrevista

Express é onipresente em vagas Node.js. O entrevistador quer saber se você entende o pipeline, não se sabe configurar. Variações:

- "Como você estruturaria um projeto Express médio?"
- "O que é middleware de erro e como funciona?"
- "Por que `throw` numa rota async não chega no seu errorHandler?"
- "Qual a diferença entre `app.use` e `app.get`?"

---

## Trade-offs

| Decisão | Escolha AG | Por quê |
|---|---|---|
| Framework | Express | Simples, sem magia, ecossistema enorme |
| Async errors | express-async-errors | Uma linha, resolve global |
| Estrutura | routes/controllers/services | Separação clara sem over-engineering |
| Validação | Zod no controller | Antes da lógica de negócio |
| Auth middleware | `app.use` antes das rotas protegidas | Garante cobertura |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver a estrutura do Meet Hub api
find ~/projetos/meet-hub/apps/api/src -type f -name "*.ts" | head -30

# Ver os middlewares registrados (app.ts ou server.ts ou index.ts)
find ~/projetos/meet-hub/apps/api/src -name "app.ts" -o -name "server.ts" -o -name "index.ts" | head -5
```

Para o arquivo principal do Meet Hub api, identificar:
1. Qual a ordem dos middlewares? (json parse, auth, rotas, errorHandler)
2. O errorHandler é o último? Se não, erros chegam a ele?
3. As rotas async usam express-async-errors ou wrapper manual?

```bash
# Verificar se express-async-errors está instalado
grep "express-async-errors" ~/projetos/meet-hub/apps/api/package.json 2>/dev/null

# Procurar handlers async sem tratamento de erro
grep -rn "async (req" ~/projetos/meet-hub/apps/api/src/ | grep -v "asyncHandler\|async-errors"
```

```markdown
## 2026-06-XX — [arch] auditoria do pipeline Express no Meet Hub api

**Middleware stack encontrada:**
1. express.json()
2. cors
3. rotas (api router)
4. errorHandler

**Problemas:**
- 2 rotas async sem express-async-errors — erro em produção derrubaria sem resposta
- Auth middleware aplicado por rota, não globalmente — risco de esquecer em rota nova

**Decisões:**
- Adicionar express-async-errors antes de qualquer rota
- Mover auth para `app.use('/api', authenticate, apiRouter)` — cobre tudo

**Como explicar em entrevista (30s):**
> "Auditei o pipeline do Express no Meet Hub. Encontrei handlers async sem captura de erro — se qualquer query no banco jogasse exceção, a requisição ficaria pendurada sem resposta. Instalei express-async-errors que faz monkey-patch global nos handlers e redireciona throws para o errorHandler. Também centralizei o middleware de auth para cobrir todas as rotas da API em vez de aplicar rota por rota."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que `throw` dentro de uma rota `async` não chega no seu `errorHandler`?"
>
> **R (30s):**
> "Porque Express foi criado antes de async/await existir. Ele não envolve handlers em try/catch — chama a função, recebe a Promise de volta e não escuta rejeições. Quando um `throw` ocorre num handler async, vai para uma Promise rejeitada que Express não observa. O processo recebe `unhandledRejection`. A solução é `express-async-errors` — uma linha que faz monkey-patch nos métodos de rota e envolve cada handler em `.catch(next)`. Agora qualquer erro em handler async é passado para o `next` e chega no `errorHandler`."

> **P:** "Como você estruturaria um projeto Express para uma equipe de 3 devs?"
>
> **R (30s):**
> "Routes, controllers, services — três camadas. Route só registra path e método, delega para controller. Controller cuida de HTTP: extrai params, valida com Zod, formata resposta, chama service. Service tem lógica de negócio e não sabe que HTTP existe. Essa separação significa que posso testar o service sem subir o servidor, e o controller sem mockar o banco. Um middleware global de erro no final captura tudo. Auth middleware registrado no nível do app antes das rotas protegidas — nunca por rota individual, porque alguém vai esquecer."

---

## Checkpoint

- [ ] Sei explicar o pipeline de middlewares e por que ordem importa
- [ ] Sei por que async errors precisam de tratamento especial no Express
- [ ] Li o arquivo principal do Meet Hub api e mapeei a ordem dos middlewares
- [ ] Identifiquei se há handlers async sem cobertura de erro
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Express Middlewares dominado`.

---

## Recursos

- Express Docs — [Writing Middleware](https://expressjs.com/en/guide/writing-middleware.html)
- Express Docs — [Error Handling](https://expressjs.com/en/guide/error-handling.html)
- npm — [express-async-errors](https://www.npmjs.com/package/express-async-errors)
- `~/projetos/meet-hub/apps/api/src/` — caso de estudo real
