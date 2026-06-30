# 05 — Consumir API Direito

## O que é

`fetch(url).then(r => r.json())` funciona no happy path e te trai em produção: ignora status de erro, trava pra sempre se a rede pendurar, derruba na primeira falha transitória e leva ban por estourar rate limit. Consumir direito é blindar cada uma dessas frestas.

## fetch não rejeita em erro HTTP

A pegadinha número 1: `fetch` **só** rejeita a promise em falha de **rede**. Um `404` ou `500` resolve normalmente com `res.ok === false`. Você precisa checar.

```ts
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.text()
    throw new HttpError(res.status, body)
  }
  return res.json() as Promise<T>
}

class HttpError extends Error {
  constructor(public status: number, public body: string) {
    super(`HTTP ${status}: ${body}`)
  }
}
```

## Timeout com AbortController

Sem timeout, uma API lenta segura sua requisição (e um worker) indefinidamente. `AbortController` é o cancelamento nativo do fetch.

```ts
async function fetchTimeout(url: string, ms = 5000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    clearTimeout(timer)        // sempre limpa — sucesso ou erro
  }
}
```

Abortar dispara um `AbortError` no `await fetch` — trate como falha retentável.

## Retry com exponential backoff + jitter

Falhas transitórias (`429`, `500`, `502`, `503`, rede) merecem nova tentativa — mas **espaçada e aleatorizada**. Backoff exponencial evita martelar; o **jitter** (ruído aleatório) evita que mil clientes que falharam juntos retentem no mesmo milissegundo (*thundering herd*).

```ts
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
const RETRYABLE = new Set([429, 500, 502, 503, 504])

async function withRetry<T>(fn: () => Promise<T>, max = 4): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 0
      const retryable = status === 0 || RETRYABLE.has(status)
      if (!retryable || attempt >= max) throw err

      const base = 2 ** attempt * 300            // 300, 600, 1200, 2400ms
      const jitter = Math.random() * base        // full jitter
      await sleep(base + jitter)
    }
  }
}
```

**Nunca** retente `400`, `401`, `403`, `404`, `422` — o erro é seu, repetir só queima cota.

## Respeitar 429 e Retry-After

Quando a API responde `429 Too Many Requests`, ela frequentemente diz **quando** voltar no header `Retry-After` (segundos ou data HTTP). Respeite — é a diferença entre throttle e ban.

```ts
function retryAfterMs(res: Response): number | null {
  const h = res.headers.get('Retry-After')
  if (!h) return null
  const secs = Number(h)
  if (!Number.isNaN(secs)) return secs * 1000          // "120"
  const date = Date.parse(h)                            // "Wed, 21 Oct 2026 07:28:00 GMT"
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

async function getRespectingLimit(url: string): Promise<Response> {
  const res = await fetch(url)
  if (res.status !== 429) return res
  const wait = retryAfterMs(res) ?? 1000
  await sleep(wait)
  return fetch(url)
}
```

## Paralelizar com Promise.all (e o cuidado)

Requisições **independentes** devem rodar em paralelo — sequencial é desperdício de latência.

```ts
// RUIM: 3 round-trips em série
const user = await getJSON(`/users/${id}`)
const posts = await getJSON(`/users/${id}/posts`)
const stats = await getJSON(`/users/${id}/stats`)

// BOM: 3 em paralelo, espera o mais lento
const [user, posts, stats] = await Promise.all([
  getJSON(`/users/${id}`),
  getJSON(`/users/${id}/posts`),
  getJSON(`/users/${id}/stats`),
])
```

Dois cuidados: (1) `Promise.all` **falha tudo** se uma rejeitar — use `Promise.allSettled` quando uma falha não deve cancelar as demais; (2) não dispare 10.000 fetches de uma vez (esgota sockets e estoura rate limit) — limite a concorrência com um pool/batches.

**Em entrevista:** "fetch só rejeita em erro de rede, então checo `res.ok`; ponho timeout com AbortController; retento só erros transitórios (429/5xx/rede) com backoff exponencial + jitter pra evitar thundering herd; respeito `Retry-After` no 429; e paralelizo chamadas independentes com Promise.all, usando allSettled quando uma falha não pode derrubar as outras."
