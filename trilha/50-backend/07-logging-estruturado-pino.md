# 07 — Logging Estruturado com Pino

## O que é

Log não é `console.log` — é dado estruturado que pode ser consultado, filtrado e correlacionado. A diferença prática: com log de string, você só pode fazer `grep`. Com log JSON estruturado, você pode fazer queries: "todos os erros do usuário X nas últimas 2 horas", "requests que levaram mais de 500ms hoje".

**Por que JSON e não string:**

```typescript
// String — útil para humano, inútil para ferramenta
console.log(`Error processing recording ${id}: ${error.message}`)
// grep funciona, mas não dá para filtrar por campo, agregar, ou correlacionar

// JSON estruturado — útil para ferramenta, legível para humano com pino-pretty
logger.error({ recordingId: id, error }, 'Error processing recording')
// Pode filtrar: .level == "error" AND .recordingId == "abc"
```

**Níveis de log (do mais ao menos verboso):**

```
trace  — debug muito granular (dentro de loops, chamadas internas) — só em dev
debug  — fluxo interno (parâmetros de funções, estados intermediários) — nunca em prod
info   — eventos normais de negócio (gravação criada, job concluído)
warn   — situação anormal mas não erro (retry tentado, fallback usado)
error  — erro que afetou uma operação (request falhou, job rejeitado)
fatal  — erro que afetou o processo inteiro (banco inacessível, OOM) — geralmente precede exit
```

**Pino — setup:**

```typescript
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Em desenvolvimento: pretty print
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined  // em produção: JSON puro para stdout
})
```

**Correlation ID / Request ID:** cada request recebe um ID único. Todos os logs desse request incluem o ID — você consegue rastrear toda a vida de um request pelo ID.

```typescript
import { randomUUID } from 'crypto'

// Middleware que adiciona requestId ao logger
function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string ?? randomUUID()
  req.log = logger.child({ requestId })  // child logger herda campos
  req.log.info({ method: req.method, path: req.path }, 'Request received')
  next()
}

// Em qualquer serviço chamado pela rota
async function processRecording(id: string, log: Logger) {
  log.info({ recordingId: id }, 'Processing started')
  // Todos os logs têm requestId herdado do child
}
```

**O que logar:**
- `info`: criação/atualização de recursos, jobs concluídos, autenticações
- `warn`: retry de operação, fallback utilizado, rate limit atingido
- `error`: exceção capturada, request a API terceira falhou, job falhou

**O que NUNCA logar (LGPD + segurança):**
- Tokens, passwords, secrets (mesmo que "mascarados")
- CPF, email, telefone em logs de debug/trace
- Conteúdo de transcrições (dado sensível de áudio de reunião)
- Request body completo de endpoints que recebem dados pessoais

```typescript
// ERRADO — token vaza em log
logger.info({ headers: req.headers }, 'Request received')

// CORRETO — só o necessário
logger.info({ method: req.method, path: req.path, requestId }, 'Request received')
```

**pino vs winston:**
- **Pino:** mais rápido (async, menos overhead), JSON por padrão, API simples
- **Winston:** mais configurável, mais antigo, maior ecossistema de transports
- Para projetos AG: Pino. A diferença de velocidade importa em alto volume de logs — e a API é mais simples.

**Armadilha comum de júnior:** usar `console.log` em todo lugar porque "funciona". Funciona até você precisar debugar um problema em produção às 2h da manhã e não conseguir correlacionar qual request causou o erro.

---

## Por que cai em entrevista

Logging aparece em entrevistas de backend como teste de maturidade de produção. Variações:

- "Como você debugaria um problema em produção sem acesso ao debugger?"
- "O que você logaria em um endpoint de API?"
- "O que você NUNCA colocaria em um log?"
- "O que é correlation ID e por que ajuda?"

---

## Trade-offs

| Decisão | Escolha | Por quê |
|---|---|---|
| Biblioteca | Pino | Mais rápido, JSON padrão, API simples |
| Nível em produção | `info` | trace/debug geram muito volume |
| Formato em produção | JSON puro | Ferramentas de log esperam JSON |
| Formato em desenvolvimento | pino-pretty | Legível para humano |
| Dados pessoais | Nunca logar | LGPD — pode ser auditado |
| Correlation | requestId por middleware | Rastreabilidade sem overhead |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver uso de console.log nos projetos AG
grep -rn "console.log\|console.error\|console.warn" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null | wc -l

# Ver se Pino já está instalado
grep "pino" ~/projetos/meet-hub/apps/api/package.json 2>/dev/null

# Listar as ocorrências de console.log
grep -rn "console\.log" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null | head -10
```

Substituir 5 `console.log` por log estruturado com Pino:

```typescript
// Antes
console.log(`Processing recording ${id}`)
console.error(`Failed to transcribe ${id}: ${error}`)

// Depois
logger.info({ recordingId: id }, 'Processing recording')
logger.error({ recordingId: id, error }, 'Failed to transcribe recording')
```

```markdown
## 2026-06-XX — [ops] substituir console.log por pino no Meet Hub api

**Problema:** 12 console.log espalhados — nenhum com requestId, nenhum estruturado, impossível correlacionar em produção.
**Solução:**
1. Instalar pino + pino-pretty
2. Criar logger singleton em src/lib/logger.ts
3. Adicionar requestId middleware
4. Substituir console.log por logger.info/error com campos estruturados
**Campos padrão por contexto:**
- HTTP: { requestId, method, path, statusCode, duration }
- Job: { jobId, recordingId, duration }
- Error: { error: err.message, stack: err.stack, context }
**O que não logar:** headers de auth, body de endpoints com dados pessoais.
**Como explicar em entrevista (30s):**
> "O Meet Hub tinha console.log espalhado — em produção, não dava para correlacionar qual request causou um erro. Migrei para Pino com requestId por middleware: cada request ganha um UUID, todos os logs desse request incluem o ID. Quando um erro aparece em produção, filtro pelo requestId e vejo todo o fluxo em ordem. Também defini o que nunca logar: tokens, emails, conteúdo de transcrição."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você debugaria um problema em produção sem acesso ao debugger?"
>
> **R (30s):**
> "Pela estrutura de logs. Se os logs forem estruturados com correlation ID, filtro pelo requestId do request problemático e vejo toda a sequência: quando chegou, quais serviços foram chamados, onde o erro ocorreu, com quais dados. Sem estrutura, fico com `grep` em texto livre — funciona para erros óbvios, inútil para problemas de estado. Por isso Pino com requestId é infraestrutura, não opcional. Na prática: o cliente reporta que a gravação X não foi transcrita, pego o requestId dos logs de criação da gravação X, filtro todos os logs com esse ID, e vejo exatamente onde o job falhou."

> **P:** "O que você nunca colocaria em um log?"
>
> **R (30s):**
> "Dados pessoais (email, CPF, telefone) em logs de debug ou info — LGPD exige finalidade, e log não é finalidade de tratamento de dado pessoal. Tokens de autenticação — header Authorization ou cookie de sessão. Passwords, mesmo que em tentativa de login. Conteúdo de áudio ou transcrição. Em geral: qualquer coisa que, se o log vazar para o lugar errado, cause problema de segurança ou compliance. O risco específico: logs costumam ser exportados para ferramentas de observabilidade — Datadog, Grafana — que podem ter segurança diferente do banco principal."

---

## Checkpoint

- [ ] Sei explicar a diferença entre log de string e log JSON estruturado
- [ ] Sei os 6 níveis de log e quando usar cada
- [ ] Implementei requestId middleware em pelo menos 1 projeto AG
- [ ] Substituí pelo menos 5 `console.log` por pino estruturado
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Logging Estruturado dominado`.

---

## Recursos

- Pino Docs — [Getting Started](https://getpino.io/#/)
- npm — [pino-pretty](https://www.npmjs.com/package/pino-pretty) (dev only)
- LGPD — [Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm) — §11 sobre logs e finalidade
