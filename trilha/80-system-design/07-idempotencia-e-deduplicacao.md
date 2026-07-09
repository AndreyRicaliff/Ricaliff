# 07 — Idempotência e Deduplicação

## O que é

**Idempotência** é a propriedade de uma operação que, executada múltiplas vezes com os mesmos parâmetros, produz o mesmo resultado que executada uma única vez. Em sistemas distribuídos com at-least-once delivery, uma operação será executada mais de uma vez eventualmente — idempotência é o que garante que isso não cause duplicação de dados ou efeitos colaterais.

O CLIENTE OFICINA é o caso de estudo perfeito: o sync incremental reprocessa uma janela de 2 dias para garantir que nada seja perdido. Isso significa que os mesmos registros são enviados múltiplas vezes. Sem idempotência, cada execução duplicaria os dados no banco.

---

### O problema sem idempotência

```
Sync job roda às 02:00:
- Envia registros ID 1, 2, 3 do Firebird para Supabase
- INSERT: registros criados
- ✓

Algo falha, job roda de novo às 02:05:
- Envia os mesmos registros ID 1, 2, 3
- INSERT: registros duplicados
- ✗ — agora tem ID 1 duas vezes no banco
```

E no caso de fila (Bull/SQS):
```
Job de pagamento enfileirado:
- Worker 1 pega o job e começa a processar
- Worker 1 cai no meio do processamento
- Visibility timeout expira → job volta para a fila
- Worker 2 pega o job → processa de novo
- Pagamento cobrado duas vezes no cartão do cliente
- ✗
```

---

### A solução: UPSERT por ID único

O mecanismo mais simples e mais correto:

```sql
-- Em vez de INSERT que falha em duplicata:
INSERT INTO orders (id, customer_id, amount, status)
VALUES ($1, $2, $3, $4);
-- Se rodar 2× com mesmo ID: erro de constraint unique

-- UPSERT: insere se não existe, atualiza se existe
INSERT INTO orders (id, customer_id, amount, status)
VALUES ($1, $2, $3, $4)
ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  status = EXCLUDED.status,
  updated_at = NOW();
-- Se rodar 2× com mesmo ID: sem erro, dados atualizados = idempotente
```

Em Prisma:
```ts
// upsert: createOrUpdate semântico
await prisma.order.upsert({
  where: { externalId: record.id },  // chave única do sistema externo
  create: {
    externalId: record.id,
    customerId: record.customerId,
    amount: record.amount,
    status: record.status,
  },
  update: {
    amount: record.amount,     // atualiza se mudou no sistema de origem
    status: record.status,
    updatedAt: new Date(),
  },
})
```

**Como o CLIENTE OFICINA faz:** cada registro do Firebird tem um ID único. O sync usa `upsert` com `externalId` como chave. Reprocessar a janela de 2 dias não duplica — atualiza o que mudou e ignora o que já está igual.

---

### Idempotency Key em endpoints HTTP

Para endpoints que precisam ser seguros para retry do cliente:

```
POST /api/payments — sem idempotência:
  - Cliente envia request
  - Rede falha após o servidor processar mas antes de responder
  - Cliente faz retry
  - Pagamento cobrado duas vezes

POST /api/payments — com idempotency key:
  - Cliente gera chave única (UUID v4) para essa operação
  - Inclui no header: Idempotency-Key: <uuid>
  - Servidor verifica: essa chave já foi processada?
    - Não: processa e salva o resultado associado à chave
    - Sim: retorna o resultado salvo sem reprocessar
  - Cliente pode fazer retry com a mesma chave com segurança
```

```ts
// Implementação em Express:
async function idempotentPaymentHandler(req: Request, res: Response) {
  const idempotencyKey = req.headers['idempotency-key'] as string

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header required' })
  }

  // Verificar se já foi processado (janela de dedup: 24h)
  const existing = await redis.get(`idem:payment:${idempotencyKey}`)
  if (existing) {
    return res.status(200).json(JSON.parse(existing))  // resposta cacheada
  }

  // Processar o pagamento
  const result = await processPayment(req.body)

  // Salvar resultado com TTL de 24h
  await redis.setex(
    `idem:payment:${idempotencyKey}`,
    86400,
    JSON.stringify(result)
  )

  return res.status(201).json(result)
}
```

APIs de pagamento como Stripe e Adyen exigem `Idempotency-Key` em toda criação de payment intent. Não é opcional — sem ela, retry do cliente causa dupla cobrança.

---

### Dedup Window: o trade-off de tempo

A idempotency key fica armazenada por quanto tempo?

```
Janela muito curta (1 minuto):
- Request falha, cliente faz retry em 2 minutos
- Chave expirou → operação executada novamente
- Deduplicação falhou

Janela muito longa (1 ano):
- Consome memória/storage
- Para operações não-críticas, overhead desnecessário

Padrão da indústria:
- Stripe: 24h para idempotency keys
- AWS SQS: visibility timeout de minutos a horas
- Stripe Webhooks: reenvio por até 3 dias
- CLIENTE OFICINA: janela de 2 dias no sync incremental
```

Para a AG: 24h para operações financeiras ou com efeitos externos (email, webhook). 1h para operações de dados puramente internos.

---

### Exactly-once é at-least-once + deduplicação

O conceito do módulo 02 revisitado:

```
Exactly-once delivery = impossível em sistemas distribuídos
At-least-once + idempotência no consumer = resultado equivalente a exactly-once

O Kafka, por exemplo, tem "exactly-once semantics" (EOS) que na prática é:
- at-least-once delivery garantido
- Producer + consumer transação atômica para marcar processamento
- Resultado: sem duplicata visível para a aplicação
- Mas há overhead significativo de performance
```

Para Bull na AG: at-least-once (padrão) + consumer idempotente com upsert = resultado correto sem overhead de EOS.

---

### Como o Cliente Varejo deveria fazer

O sync ERP-externo → Supabase (Cliente Varejo) tem o mesmo problema que o OFICINA. A ERP-externo tem rate limit de 350 requests/dia — não dá para refazer tudo do zero. Precisa de:

```
1. Controle de última execução (timestamp do último sync bem-sucedido)
2. Pull incremental: só dados novos/alterados desde o último sync
3. UPSERT por ID do produto/pedido no Supabase
4. Lockfile para evitar execuções concorrentes

-- Na tabela Supabase:
CREATE TABLE erp_products (
  id              BIGINT PRIMARY KEY,  -- ID do produto no ERP-externo
  name            TEXT,
  price           DECIMAL,
  stock           INTEGER,
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  erp_id          BIGINT UNIQUE NOT NULL  -- chave de dedup
);

-- Sync:
INSERT INTO erp_products (erp_id, name, price, stock)
VALUES ($1, $2, $3, $4)
ON CONFLICT (erp_id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  synced_at = NOW();
```

---

## Por que cai em entrevista

Idempotência aparece em toda entrevista de backend pleno quando o entrevistador pergunta "e se a request falhar no meio?" ou "e se o job for processado duas vezes?". Candidatos que não têm resposta clara demonstram inexperiência com sistemas distribuídos reais.

---

## Trade-offs

| Abordagem | Quando usar | Custo |
|---|---|---|
| UPSERT por ID único | Sync de dados, insert idempotente | Requer ID determinístico na fonte |
| Idempotency key header | Endpoints com efeito externo (pagamento, email) | Storage para a janela de dedup |
| Check antes de processar | Jobs de fila que não têm UPSERT natural | Race condition possível (usar lock) |
| Kafka EOS | Streaming com exactly-once crítico | Overhead de performance, complexidade |
| Dedup no producer (não reenviar) | At-most-once desejado | Risco de perder mensagem |

---

## Exercício aplicado (projeto AG real)

```bash
# Verificar idempotência no CLIENTE OFICINA e no Meet Hub

# 1. OFICINA: verificar implementação do upsert
cd ~/projetos/cliente-oficina-backend
grep -rn "upsert\|ON CONFLICT\|onConflict\|createOrUpdate" \
  src/ --include="*.ts" --include="*.sql" | grep -v "node_modules"

# 2. OFICINA: verificar lockfile de sync concorrente
grep -rn "lock\|lockfile\|isRunning\|mutex" \
  src/ --include="*.ts" | grep -v "node_modules"

# 3. Meet Hub: workers são idempotentes?
cd ~/projetos/meet-hub
grep -rn "status.*completed\|already.*process\|idempotent\|upsert" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"

# 4. Identificar endpoints no Meet Hub que precisam de idempotency key
grep -rn "\.post\(\|\.put\(\|\.patch\(" \
  apps/api/src/ --include="*.ts" | \
  grep -v "node_modules\|healthcheck\|login" | head -15
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] idempotência AG

**CLIENTE OFICINA — sync incremental:**
- UPSERT implementado: [sim/não — resultado do grep]
- Lockfile implementado: [sim/não — resultado do grep]
- Janela de reprocessamento: 2 dias (conforme memória do projeto)
- Status: [funcionando/tem lacuna]

**Meet Hub — workers:**
- Worker de transcrição é idempotente: [sim/não]
  - Se não: [descrever o risco e o fix]
  - Fix: adicionar verificação `if recording.status === 'completed': return`

**Endpoints que precisam de idempotency key:**
- POST /api/payments (se existir): sim, obrigatório
- POST /api/meetings/end: verificar — pode ser reprocessado?
- [listar outros]

**Implementação planejada:**
Para o endpoint [X], implementar idempotency key com:
- Janela: 24h
- Storage: Redis com TTL
- Header: Idempotency-Key (UUID v4 gerado pelo cliente)
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você garante que um job de pagamento não seja cobrado duas vezes se o worker cair durante o processamento?"
>
> **R (30s):**
> "Usando idempotency key. O producer gera um UUID para a operação e inclui no job payload. O worker, antes de cobrar, verifica no Redis se essa chave já foi processada. Se sim: retorna o resultado salvo sem cobrar de novo. Se não: cobra, salva o resultado com a chave no Redis com TTL de 24h. Se o worker cair durante o processamento (depois de cobrar, antes de salvar no Redis), o pior caso é cobrar de novo — por isso salvar no Redis deve vir logo após a cobrança, antes de qualquer outra operação. Stripe usa esse padrão nativamente com o cabeçalho `Idempotency-Key`."

> **P:** "O que é UPSERT e quando você usaria?"
>
> **R (30s):**
> "UPSERT é uma operação atômica que insere o registro se não existe ou atualiza se existe, baseado em uma chave de conflito. Uso sempre em sync de dados de sistemas externos: se o mesmo registro chegar duas vezes, o resultado é idêntico — sem duplicação, sem erro. No CLIENTE OFICINA, o sync reprocessa uma janela de 2 dias para garantir que nenhum dado seja perdido. Sem UPSERT, cada reexecução duplicaria registros. Com UPSERT por `external_id`, a segunda execução apenas atualiza o que mudou."

---

## Checkpoint

- [ ] Consigo explicar o problema de at-least-once delivery sem idempotência com exemplo concreto
- [ ] Sei implementar UPSERT em Prisma e em SQL puro (ON CONFLICT DO UPDATE)
- [ ] Sei implementar idempotency key em endpoint Express com Redis
- [ ] Verifiquei se os workers do Meet Hub são idempotentes e documentei o resultado
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Stripe — Idempotent requests](https://stripe.com/docs/api/idempotent_requests) — o padrão de referência
- [PostgreSQL — INSERT ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT) — sintaxe completa do UPSERT
- [Prisma — upsert](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert)
- [AWS — Exactly-once processing](https://aws.amazon.com/builders-library/avoiding-insurmountable-queue-backlogs/) — como a AWS lida com o problema internamente
