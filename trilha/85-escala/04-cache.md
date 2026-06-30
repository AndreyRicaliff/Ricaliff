# 04 — Cache

## O que é

Cache é uma cópia de dados num lugar mais rápido/mais perto, pra não pagar de novo o custo de buscar na fonte original. É a alavanca de escala com melhor relação esforço/retorno: bem feito, tira 80-95% da carga do banco. A graça toda está em duas perguntas difíceis: **o que vale a pena cachear** e **quando o cache fica desatualizado**.

> "There are only two hard things in Computer Science: cache invalidation and naming things." — Phil Karlton. Não é piada; invalidação é o problema central deste módulo.

---

### As camadas de cache (de mais perto do usuário pra mais longe)

```text
1. Browser cache      → no dispositivo do usuário. 0 viagem de rede.
2. CDN (edge)         → POP perto do usuário. Estáticos, imagens, assets. ~10-50ms
3. App / in-memory    → Redis ou cache local do processo. Dados de domínio. ~0,5ms
4. DB query cache     → o próprio banco guarda planos/páginas. último recurso
```

Quanto mais perto do usuário o hit acontece, mais barato. Um asset servido da CDN nunca toca seu servidor. Um dado servido do Redis nunca toca o banco.

---

### Hit ratio — a métrica que define se valeu a pena

```text
hit ratio = hits / (hits + misses)

90% de hit ratio em 1.000 RPS:
  900 RPS servidos da memória (~0,5ms)
  100 RPS chegam ao banco       → você reduziu a carga do banco em 10x

Subir de 90% → 99% NÃO é "9% melhor": o banco vai de 100 RPS pra 10 RPS,
mais 10x de alívio. Os últimos pontos de hit ratio valem ouro.
```

Cache só compensa quando o dado é lido **muito** mais do que escrito (read-heavy). Cachear dado que muda a cada leitura é desperdício.

---

### Cache-aside vs write-through

**Cache-aside (lazy loading)** — o padrão mais comum. A aplicação gerencia o cache.

```ts
async function getReport(id: string): Promise<Report> {
  const key = `report:${id}`
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)        // hit

  const report = await db.report.findUnique({ where: { id } }) // miss → fonte
  if (!report) throw new Error(`report ${id} not found`)

  await redis.setex(key, 300, JSON.stringify(report))           // TTL 5min
  return report
}
```

```text
Leitura:  cache → miss? busca no banco, popula cache, retorna
Escrita:  grava no banco → INVALIDA (deleta) a chave do cache
          próxima leitura: miss → repopula com dado fresco
Prós: só cacheia o que é pedido; banco é source of truth
Contras: 1ª leitura após miss paga o custo cheio (cold); risco de race
```

**Write-through** — toda escrita atualiza cache e banco juntos.

```text
Escrita:  grava no cache → cache propaga pro banco (síncrono) → confirma
Leitura:  sempre hit (dado já está no cache ao ser escrito)
Prós: cache sempre consistente com a última escrita; leitura nunca paga miss
Contras: toda escrita é mais lenta; cacheia coisa que talvez ninguém leia
```

**Em entrevista:** "Cache-aside é o default: simples, banco é a verdade, cacheio sob demanda. Write-through quando preciso que a leitura nunca pague miss e tolero escrita mais lenta. Para dados muito read-heavy e que mudam raramente, cache-aside com TTL resolve quase tudo."

---

### TTL — a invalidação preguiçosa

**TTL (time to live)** é dar prazo de validade à entrada: depois de N segundos, ela expira sozinha e a próxima leitura repopula.

```text
TTL curto (10s):  dado quase sempre fresco, mas mais misses → mais carga no banco
TTL longo (1h):   pouquíssima carga no banco, mas dado pode ficar stale 1h
```

TTL é o jeito mais simples de invalidação: você aceita uma janela de dado desatualizado (**stale**) em troca de não precisar rastrear cada mudança. Para o que exige frescor imediato (saldo, estoque), invalide explicitamente na escrita (deletar a chave) em vez de só confiar no TTL.

---

### Os dois desastres clássicos

**Thundering herd / cache stampede.** Uma chave popular expira. Mil requests batem no miss **ao mesmo tempo**, e todas vão ao banco buscar a mesma coisa de uma vez → o banco leva uma martelada e cai.

```text
TTL expira em t=0
t=0: 1.000 requests, todas miss, todas disparam a MESMA query ao banco
→ pico de 1.000 QPS instantâneo no que deveria ser 1 query
```

Mitigações:
```text
- Lock / single-flight: só 1 request recalcula; as outras esperam o resultado.
- Stale-while-revalidate: serve o dado velho enquanto 1 worker recalcula em background.
- TTL com jitter: TTL = 300s ± aleatório, pra chaves não expirarem todas juntas.
```

**Cache penetration / dado inexistente.** Requests pedem chaves que não existem (id inválido). Cada uma dá miss e vai ao banco achar nada — o cache não protege. Mitigação: cachear o "não existe" (valor nulo) com TTL curto.

---

### Regra de ouro

```text
1. Meça antes: cache resolve problema de read-heavy, não de tudo.
2. Defina invalidação ANTES de cachear: TTL? delete na escrita? os dois?
3. Aceite staleness onde puder; invalide explícito onde não puder.
4. Proteja a expiração de chave quente (jitter / single-flight).
Cache não é "ligar e esquecer" — é uma fonte permanente de bug de consistência.
```
