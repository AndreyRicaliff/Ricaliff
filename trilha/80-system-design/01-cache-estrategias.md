# 01 — Cache: Estratégias e Trade-offs

## O que é

Cache é uma camada de armazenamento mais rápida que a fonte de dados original, usada para evitar operações custosas repetidas. A velocidade importa: memória RAM serve dados em ~100ns; disco SSD em ~100µs (1000x mais lento); Postgres rodando uma query com join em tabela grande: ~10ms–100ms (100.000x mais lento que RAM).

O problema que cache resolve: quando o mesmo dado é requisitado repetidamente e calcular/buscar esse dado é caro, você armazena o resultado e serve da memória.

**Regra de ouro antes de qualquer cache:** meça primeiro. Cache sem medição é otimização prematura — adiciona complexidade, bugs de consistência e custo de infraestrutura sem garantia de ganho.

---

### As 4 estratégias principais

#### Cache-aside (Lazy Loading)

A mais comum. A aplicação controla o cache.

```
Fluxo de leitura:
1. App pede dado ao cache
2. Cache miss? → busca no banco → escreve no cache → retorna
3. Cache hit? → retorna direto do cache

Fluxo de escrita:
1. App escreve no banco
2. App invalida (ou deleta) a entrada do cache
3. Próxima leitura: cache miss → popula cache com dado novo
```

```ts
async function getEmployeeReport(employeeId: string): Promise<Report> {
  const cacheKey = `report:${employeeId}`

  // 1. Tentar cache primeiro
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)

  // 2. Cache miss: buscar do banco
  const report = await prisma.report.findUnique({
    where: { employeeId },
    include: { indicators: true }
  })
  if (!report) throw new Error('Report not found')

  // 3. Armazenar no cache com TTL de 5 minutos
  await redis.setex(cacheKey, 300, JSON.stringify(report))

  return report
}
```

**Vantagem:** só cacheia o que é realmente requisitado. Banco continua como source of truth.
**Custo:** primeira requisição após miss ou expiração paga o custo completo (cold start). Race condition possível em alta concorrência.

---

#### Write-through

O cache é atualizado **junto com o banco** em toda escrita.

```
Fluxo de escrita:
1. App escreve no cache
2. Cache propaga para o banco (síncrono)
3. Retorna sucesso só quando ambos confirmam

Fluxo de leitura:
1. App lê do cache — sempre hit (se o dado existe)
2. Cache miss só para dados nunca escritos
```

**Vantagem:** cache sempre consistente com o banco. Leitura sempre rápida.
**Custo:** escrita tem latência de ambas as operações. Pode popular o cache com dados que nunca serão lidos.

---

#### Write-behind (Write-back)

A escrita vai só para o cache; o banco é atualizado de forma assíncrona depois.

```
Fluxo de escrita:
1. App escreve no cache — confirmação imediata (rápido)
2. Cache enfileira escrita no banco assincronamente

Fluxo de leitura:
1. App lê do cache — sempre atual
```

**Vantagem:** escrita ultra-rápida. Agrupa múltiplas escritas (batch).
**Custo:** risco de perda de dados se cache cair antes de sync com banco. Complexidade alta.

---

#### Refresh-ahead

O cache antecipa expiração — recarrega o dado antes do TTL expirar.

```
Fluxo:
1. Dado no cache com TTL de 60s
2. Em ~50s (threshold configurável), cache recarrega o dado em background
3. Usuário nunca vê cache miss — o dado é renovado enquanto ainda está válido
```

**Vantagem:** elimina o cold start. Latência sempre baixa.
**Custo:** pode recarregar dados que não serão mais requisitados. Implementação complexa.

---

### TTL vs LRU: políticas de expiração

**TTL (Time To Live):** dado expira após N segundos independente de acesso.

```ts
await redis.setex('key', 300, value)  // expira em 5 minutos
```

Usar quando: dado tem "frescor" necessário (preço, estoque, relatório calculado recentemente).

**LRU (Least Recently Used):** quando o cache enche, remove o item usado menos recentemente.

```
# Configurar Redis com maxmemory-policy:
maxmemory 256mb
maxmemory-policy allkeys-lru
```

Usar quando: você não sabe exatamente quais chaves serão populares — LRU mantém o "working set" natural.

**Combinação prática:** TTL por chave + LRU como fallback quando memória enche. É o padrão.

---

### Invalidação: a coisa mais difícil em CS

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton

O problema: como saber que o dado no cache está desatualizado?

```ts
// Estratégia 1: TTL — aceitar que o dado pode estar stale por X segundos
// Simples. Para relatórios calculados no PULSAR-RH, 5 min stale é aceitável.

// Estratégia 2: Invalidação explícita na escrita
async function updateEmployee(id: string, data: EmployeeData) {
  await prisma.employee.update({ where: { id }, data })
  await redis.del(`employee:${id}`)        // invalida chave específica
  await redis.del(`report:${id}`)          // invalida relatório relacionado
  await redis.del('dashboard:summary')     // invalida agregação
}
// Problema: precisa saber TODAS as chaves que dependem do dado modificado
// À medida que o sistema cresce, essa lista cresce e fica difícil de manter

// Estratégia 3: Cache tags / namespaces
// Chaves associadas a um namespace; ao invalidar o namespace, todas as chaves caem
// Redis não tem nativo — precisaria de lua script ou lib como ioredis-cache-manager
```

**Stale-while-revalidate:** serve o dado stale imediatamente e revalida em background.

```ts
// Pattern manual em Node:
async function getWithStaleWhileRevalidate(key: string, fetchFn: () => Promise<unknown>, ttl: number) {
  const cached = await redis.get(key)
  const staleKey = `stale:${key}`

  if (cached) {
    // Verificar se está prestes a expirar
    const ttlRemaining = await redis.ttl(key)
    if (ttlRemaining < ttl * 0.1) {
      // Menos de 10% do TTL restante: revalidar em background
      fetchFn().then(fresh => redis.setex(key, ttl, JSON.stringify(fresh)))
    }
    return JSON.parse(cached)
  }

  // Miss: buscar e cachear
  const fresh = await fetchFn()
  await redis.setex(key, ttl, JSON.stringify(fresh))
  return fresh
}
```

---

### Redis vs in-memory (Node)

| Critério | Redis | In-memory (Map/LRU-cache) |
|---|---|---|
| Compartilhado entre instâncias | Sim | Não (cada processo tem seu cache) |
| Sobrevive a restart | Sim (com persistência) | Não |
| Latência | ~1ms (rede local) | ~0.01ms (memória do processo) |
| Custo | Infra extra | Zero |
| Quando usar | Múltiplas instâncias, dados grandes | Processo único, dados pequenos e imutáveis |

Para Meet Hub com 6 bots futuros: Redis é obrigatório (já está no stack). Para PULSAR-RH com instância única: in-memory funciona para caches pequenos (lookup tables, configs).

---

## Por que cai em entrevista

Cache aparece em toda pergunta de system design: "como você escalaria?" → cache. "E se o banco não aguentar o tráfego?" → cache. A maioria dos candidatos sabe o conceito mas não sabe as 4 estratégias nem quando invalidar.

Latência de referência para usar em entrevista:
- L1 cache CPU: 1ns
- RAM: 100ns
- Redis (rede local): ~0.5ms
- PostgreSQL query simples: ~1ms
- PostgreSQL query com join e full scan: ~10ms–1s

---

## Trade-offs

| Estratégia | Leitura | Escrita | Consistência | Complexidade |
|---|---|---|---|---|
| Cache-aside | Rápida (hit) / Lenta (miss) | Sem overhead | Eventual (TTL) | Baixa |
| Write-through | Sempre rápida | Mais lenta (dupla) | Forte | Média |
| Write-behind | Sempre rápida | Ultra-rápida | Eventual (lag) | Alta |
| Refresh-ahead | Sempre rápida | Sem overhead | Quasi-forte | Alta |

---

## Exercício aplicado (projeto AG real)

```bash
# Identificar onde cache ajudaria no PULSAR-RH dashboard

cd ~/projetos/PULSAR-RH

# 1. Encontrar queries de dashboard/relatório (provavelmente as mais pesadas)
grep -rn "findMany\|aggregate\|groupBy\|count\|_sum\|_avg" \
  apps/api/src/ --include="*.ts" | grep -v "//\|node_modules" | head -20

# 2. Verificar se Redis já está no stack
cat apps/api/package.json | grep -i "redis\|ioredis\|bull"

# 3. Medir latência das queries de dashboard sem cache
# Adicionar console.time temporariamente:
# console.time('dashboard-query')
# await prisma... (a query)
# console.timeEnd('dashboard-query')

# 4. Verificar frequência de acesso vs frequência de atualização
# Se o dashboard é visto 100x por hora mas os dados mudam 1x por hora:
# Cache com TTL de 10min = 100 queries → ~10 queries (90% cache hit)
```

```markdown
## DECISIONS.md — 2026-06-XX — [perf] cache analysis PULSAR-RH dashboard

**Queries identificadas como candidatas a cache:**
- [listar queries de dashboard + latência medida]

**Estratégia escolhida:** Cache-aside com TTL
**Justificativa:**
- Dashboard é lido com muito mais frequência que atualizado
- Dado stale por 5 minutos é aceitável (relatórios de RH não são real-time)
- Estratégia simples; não exige mudança na lógica de escrita

**Chaves de cache:**
- `dashboard:${clientId}:summary` → TTL 5min
- `report:${employeeId}:kpis` → TTL 5min
- Invalidar em UPDATE de indicadores do funcionário

**Estimativa de ganho:**
- Antes: 100 requests/hora × 50ms/query = 5s de query time
- Depois: ~10 cache misses × 50ms + ~90 hits × 0.5ms = 0.5s + 0.045s ≈ 0.55s
- Redução de ~89% em carga no banco para leituras de dashboard

**Consequências:** dado pode estar stale por até 5 min.
Aceitável para contexto de People Analytics (não é trading em tempo real).
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você usaria cache? Qual estratégia e por quê?"
>
> **R (30s):**
> "Cache quando: o mesmo dado é lido com muito mais frequência do que é escrito, e o custo de calcular/buscar é significativo. A estratégia depende do requisito de consistência. Para um dashboard de RH que atualiza a cada hora mas é visualizado 100 vezes — cache-aside com TTL de 5 minutos. Para carrinho de compras que precisa sempre estar atual — write-through. O que eu nunca faço é cachear sem medir — adiciono `console.time` na query, verifico se ela está no hot path, e só então adiciono cache."

> **P:** "Por que invalidação de cache é difícil? Me dá um exemplo concreto."
>
> **R (30s):**
> "Porque um dado pode ser derivado de múltiplas fontes. Exemplo: cachei `dashboard:cliente-X` que inclui contagem de funcionários. Se alguém adiciona um funcionário, preciso invalidar esse cache — mas também o `report:total-headcount` e o `analytics:growth-rate` que dependem do mesmo dado. À medida que o sistema cresce, a lista de chaves a invalidar cresce e fica impossível de manter manualmente. Solução: TTL como fallback garantido, e prefixos de namespace para invalidação em grupo."

---

## Checkpoint

- [ ] Consigo explicar as 4 estratégias de cache e quando usar cada uma sem consultar
- [ ] Sei a diferença de latência entre RAM, Redis e PostgreSQL (ordem de magnitude)
- [ ] Identifiquei pelo menos 2 queries candidatas a cache no PULSAR-RH
- [ ] Documentei a estimativa de ganho com números (antes/depois de cache)
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Redis documentation — Cache patterns](https://redis.io/docs/manual/patterns/)
- [AWS — Caching strategies](https://docs.aws.amazon.com/whitepapers/latest/database-caching-strategies-using-redis/caching-patterns.html)
- [ioredis](https://github.com/redis/ioredis) — cliente Redis para Node.js usado na AG
- Martin Fowler — [Cache pattern](https://martinfowler.com/bliki/TwoHardThings.html) — contexto da frase sobre invalidação
