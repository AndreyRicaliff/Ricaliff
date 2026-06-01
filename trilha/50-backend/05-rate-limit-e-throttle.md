# 05 — Rate Limit e Throttle

## O que é

Rate limit controla quantas operações podem ocorrer em uma janela de tempo. Throttle adia operações que excedem o limite em vez de recusá-las. São conceitos relacionados mas diferentes: rate limit rejeita, throttle enfileira.

**Algoritmos comuns:**

**Fixed Window:** conta requests em janelas fixas (0-60s, 60-120s). Problema: burst no final de uma janela + início da próxima dobra o limite efetivo.

**Sliding Window:** janela que desliza com o tempo — conta requests nos últimos 60s do momento atual. Mais justo, mais complexo de implementar. Redis com sorted sets resolve.

**Token Bucket:** bucket começa cheio (N tokens). Cada request consome 1 token. Tokens são repostos a uma taxa constante. Permite burst controlado — se o bucket está cheio, pode fazer N requests instantâneos. É o algoritmo mais comum em APIs de produção.

```typescript
// Rate limit inbound (proteção da sua API)
import rateLimit from 'express-rate-limit'

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 100,              // máximo 100 requests por IP
  standardHeaders: true, // retorna X-RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests', retryAfter: 60 }
})

app.use('/api', apiLimiter)
```

**Per-IP vs per-user vs per-account:**

| Granularidade | Quando usar | Problema |
|---|---|---|
| Por IP | Proteção contra abuso não autenticado | IP compartilhado (NAT) penaliza múltiplos usuários |
| Por user ID | Após autenticação | Requer sessão |
| Por account/tenant | SaaS multi-tenant | Tier diferente por plano |

**Rate limit OUTBOUND — quando você é o cliente:**

Esse é o caso do Cliente Varejo. A ERP-externo tem um limite de requests que a integração deve respeitar.

```typescript
// Opção 1: p-limit — controla concorrência máxima
import pLimit from 'p-limit'
const limit = pLimit(5)  // máximo 5 requests simultâneos

const results = await Promise.all(
  products.map(product => limit(() => fetchFromERP-externo(product.id)))
)

// Opção 2: fila Bull com rate limiter
const queue = new Queue('erp-externo-sync', { connection })
await queue.add('sync', data, {
  rateLimiter: {
    max: 10,       // máximo 10 jobs
    duration: 1000 // por segundo
  }
})

// Opção 3: delay manual entre requests (simples, sem biblioteca)
for (const product of products) {
  await syncProduct(product)
  await new Promise(resolve => setTimeout(resolve, 100))  // 100ms entre requests
}
```

**Circuit breaker básico:** se a API terceira está falhando consistentemente, parar de tentar por um período em vez de inundar com requests que vão falhar.

```typescript
let failures = 0
const THRESHOLD = 5
const TIMEOUT = 30_000  // 30s

async function callERP-externo(id: string) {
  if (failures >= THRESHOLD) {
    throw new Error('Circuit open — ERP-externo unavailable')
  }
  try {
    const result = await fetch(`${ERP-EXTERNO_URL}/products/${id}`)
    failures = 0  // reset em sucesso
    return result
  } catch (err) {
    failures++
    setTimeout(() => failures = 0, TIMEOUT)  // reset após timeout
    throw err
  }
}
```

**O caso real Cliente Varejo:** a integração ERP-externo→Supabase travava porque enviava requests sem throttle. A ERP-externo tem limite de requisições por segundo — quando a integração dispara 100 requests simultâneos, a ERP-externo rejeita a maioria com 429. Com `p-limit(5)` ou fila com rate limiter, 5 requests por vez, a integração respeita o limite.

**Armadilha comum de júnior:** configurar rate limit por IP sem considerar ambientes com NAT. Todos os usuários da mesma empresa atrás de um NAT aparecem como o mesmo IP — se o limite for 100 req/min por IP, uma empresa com 20 usuários tem efetivamente 5 req/min por usuário. Usar autenticação para rate limit por user ID.

---

## Por que cai em entrevista

Rate limit aparece em entrevistas de backend como teste de experiência com APIs reais. Variações:

- "Como você protegeria sua API contra abuso?"
- "Como você integraria com uma API terceira que tem rate limit?"
- "Qual a diferença entre token bucket e sliding window?"
- "O que é um circuit breaker?"

---

## Trade-offs

| Cenário | Algoritmo | Por quê |
|---|---|---|
| API pública sem auth | Fixed window por IP | Simples, bom suficiente |
| API autenticada | Sliding window por user | Mais justo, sem burst na virada de janela |
| API que permite burst ocasional | Token bucket | Usuário pode acumular tokens e usar de uma vez |
| Integração com API terceira | p-limit ou fila com rate limiter | Respeita limite de saída |
| API terceira com falhas frequentes | Circuit breaker | Para de tentar durante outage |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver se o Meet Hub tem rate limit configurado
grep -rn "rate-limit\|rateLimit\|express-rate-limit" ~/projetos/meet-hub/apps/api/ 2>/dev/null

# Ver como o Varejo está configurado (se existir código)
find ~/projetos/cliente-varejo -name "*.ts" -o -name "*.js" 2>/dev/null | head -10
grep -rn "erp-externo\|p-limit\|rate" ~/projetos/cliente-varejo/ 2>/dev/null | head -20
```

Desenhar o rate limit para o sync do Cliente Varejo:

```
Cenário: sync de 500 produtos do ERP-externo
Limite ERP-externo: 10 req/s (assumindo — verificar documentação real)

Opção A — p-limit:
  - Processar no máximo 8 produtos simultâneos
  - Sem fila persistente

Opção B — Bull com rate limiter:
  - Fila persistente (sobrevive a reinicializações)
  - max: 10, duration: 1000
  - Jobs com retry em caso de 429

Decisão: Opção B — dados de negócio não podem ser perdidos
```

```markdown
## 2026-06-XX — [arch] rate limit para integração Varejo→ERP-externo

**Contexto:** integração enviava requests sem throttle → ERP-externo retornava 429 → sincronização travava.
**Limite ERP-externo:** [verificar na documentação] req/s.
**Solução:** fila Bull com rate limiter configurado.
**Motivo:** fila persiste jobs entre reinicializações, retry em 429, monitoramento de jobs falhados.
**Implementação:**
- Queue 'erp-externo-sync' com `rateLimiter: { max: 8, duration: 1000 }`
- Cada produto = 1 job
- Em 429: retry com backoff exponencial 5s
**Como explicar em entrevista (30s):**
> "A integração com ERP-externo travava porque disparávamos todos os requests de uma vez. A ERP-externo tem rate limit e retornava 429. Implementei uma fila Bull com rate limiter: máximo 8 requisições por segundo. Jobs que recebem 429 fazem retry com backoff exponencial. A fila persiste em Redis, então se o processo reiniciar, os jobs que não foram processados voltam automaticamente."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você integraria com uma API terceira que tem rate limit de 10 req/s?"
>
> **R (30s):**
> "Depende do volume e da criticidade. Para volume pequeno, `p-limit(8)` — 8 requests simultâneos, razoavelmente abaixo do limite para ter margem. Para volume grande onde não posso perder dados, fila Bull com `rateLimiter: { max: 8, duration: 1000 }` — a fila persiste em Redis, jobs que recebem 429 fazem retry automático, posso monitorar jobs falhados. O circuit breaker adiciona a camada final: se a API está fora do ar, paro de tentar por 30s em vez de inundar com requests que vão falhar. Vi esse problema no Cliente Varejo — sem throttle, a integração recebia 429 constantemente e travava."

> **P:** "Qual a diferença entre rate limit e throttle?"
>
> **R (30s):**
> "Rate limit rejeita a operação que excede o limite — retorna 429. Throttle adia — enfileira e processa quando há capacidade. Na prática: rate limit inbound na minha API protege contra abuso, retorna erro para o cliente. Throttle outbound nas minhas chamadas a APIs terceiras garante que eu respeito o limite delas sem perder as operações — coloco em fila e processo na velocidade certa. Fila Bull com `rateLimiter` é throttle: o job não é rejeitado, fica na fila e é processado quando o token estiver disponível."

---

## Checkpoint

- [ ] Sei explicar a diferença entre token bucket e fixed window
- [ ] Sei implementar rate limit inbound com express-rate-limit
- [ ] Entendi por que a integração Varejo→ERP-externo travava e sei a solução
- [ ] Sei a diferença entre rate limit (rejeita) e throttle (adia)
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Rate Limit & Throttle dominado`.

---

## Recursos

- npm — [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- npm — [p-limit](https://www.npmjs.com/package/p-limit)
- BullMQ Docs — [Rate Limiting](https://docs.bullmq.io/guide/rate-limiting)
- Cloudflare Blog — [Rate Limiting](https://blog.cloudflare.com/counting-things-a-lot-of-different-things/) (explicação de algoritmos)
