# 04 — Idempotência em APIs

## O que é

Uma operação é **idempotente** quando pode ser executada múltiplas vezes e produz o mesmo resultado que executar uma vez. Uma operação é **segura** quando não causa efeitos colaterais.

```
GET   — seguro + idempotente (lê, não muda nada)
PUT   — idempotente (substituição completa — mesmo resultado se repetir)
DELETE — idempotente (deletar o que já foi deletado = mesmo resultado: não existe)
POST  — NÃO é idempotente por padrão (criar recurso duplica se repetir)
PATCH — geralmente NÃO é idempotente (depende da operação)
```

**Por que isso importa em produção:** redes falham. Clients reenviam requests. Workers reprocessam jobs. Se sua operação não é idempotente, retry = duplicata = bug em produção.

**Idempotency Key pattern:** client gera uma chave única por operação (UUID). Servidor armazena a chave e o resultado. Se a mesma chave chegar novamente, retorna o resultado anterior sem reprocessar.

```typescript
// Client — gera key antes de enviar
const idempotencyKey = crypto.randomUUID()
await fetch('/api/payments', {
  method: 'POST',
  headers: { 'Idempotency-Key': idempotencyKey },
  body: JSON.stringify({ amount: 100 })
})

// Server — verifica se já processou
async function createPayment(req: Request, res: Response) {
  const key = req.headers['idempotency-key'] as string
  if (!key) return res.status(400).json({ error: 'Idempotency-Key required' })

  const cached = await redis.get(`idem:${key}`)
  if (cached) return res.json(JSON.parse(cached))  // retorna resultado anterior

  const result = await processPayment(req.body)
  await redis.setex(`idem:${key}`, 86400, JSON.stringify(result))  // TTL 24h
  res.json(result)
}
```

**Deduplicação por hash:** quando não há controle do client, deduplicar pelo conteúdo da operação.

```typescript
// Hash dos dados da operação como chave de deduplicação
const hash = crypto.createHash('sha256')
  .update(JSON.stringify({ recordingId, action }))
  .digest('hex')

const already = await prisma.processedEvent.findUnique({ where: { hash } })
if (already) return  // já processado

await prisma.$transaction([
  processEvent(data),
  prisma.processedEvent.create({ data: { hash, processedAt: new Date() } })
])
```

**UPSERT — INSERT...ON CONFLICT:**

```typescript
// Em vez de INSERT que falha se registro existe
await prisma.recording.upsert({
  where: { externalId: data.id },
  update: { title: data.title, updatedAt: new Date() },
  create: { externalId: data.id, title: data.title }
})

// SQL equivalente
// INSERT INTO recordings (external_id, title) VALUES ($1, $2)
// ON CONFLICT (external_id) DO UPDATE SET title = $2
```

**CLIENTE OFICINA é o caso real:** o sync roda a cada 5 minutos buscando os mesmos dados do Firebird. A camada de idempotência (upsert por ID externo) garante que o mesmo produto sincronizado 288 vezes por dia não gera 288 registros duplicados no Supabase.

**Armadilha comum de júnior:** testar só o happy path. Idempotência só importa quando algo dá errado — retry, timeout, double-click. Testar mandando a mesma operação duas vezes e verificar que o resultado é idêntico (não duplicado) é o teste que valida o padrão.

---

## Por que cai em entrevista

Idempotência é diferenciador de pleno/sênior em entrevistas de backend. Variações:

- "O que acontece se o mesmo webhook chegar duas vezes?"
- "Como você garantiria que uma operação de pagamento não duplica?"
- "O que é idempotency key?"
- "Qual a diferença entre idempotente e seguro?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Pagamento (POST) | Idempotency-Key + cache Redis | Client controla a key, server deduplica |
| Webhook de terceiro (ID no payload) | Hash do payload + tabela de eventos processados | Deduplicação por conteúdo |
| Sync de dados externos (OFICINA) | UPSERT por external ID | Operação naturalmente idempotente |
| Job em fila (Bull retry) | Check de status antes de agir | `if (already.done) return` |
| DELETE | Já é idempotente | Deletar o que não existe = 404 ou 200, não erro grave |

---

## Exercício aplicado (projeto AG real)

```bash
# Ver os endpoints POST do Meet Hub api
grep -rn "router.post\|app.post" ~/projetos/meet-hub/apps/api/src/ 2>/dev/null

# Ver o sync do OFICINA — provavelmente tem upsert
find ~/projetos/cliente-oficina-backend -name "*.js" -o -name "*.ts" 2>/dev/null | head -10
grep -rn "upsert\|ON CONFLICT\|onConflict" ~/projetos/cliente-oficina-backend/ 2>/dev/null | head -10
```

Para os endpoints POST encontrados no Meet Hub, classificar cada um:
1. O que acontece se o cliente mandar o mesmo request duas vezes?
2. É idempotente naturalmente (PUT/UPSERT)? Ou precisa de Idempotency-Key?
3. Tem algum webhook endpoint? Como deduplica eventos repetidos?

```markdown
## 2026-06-XX — [arch] auditoria de idempotência nos endpoints AG

**Endpoints analisados:**
- POST /api/recordings — cria nova gravação. Não idempotente. Double-click do usuário = 2 gravações
- POST /api/webhooks/transcription — recebe callback do serviço de transcrição. Pode chegar 2x por retry

**Decisões:**
1. POST /recordings: adicionar verificação por título+data (ou Idempotency-Key header)
2. Webhook: adicionar tabela `processed_webhooks` com hash do payload, verificar antes de processar

**Caso real OFICINA:** o sync já usa upsert por external_id — não duplica mesmo rodando 288x por dia. Padrão correto.

**Como explicar em entrevista (30s):**
> "Mapeei os endpoints POST do Meet Hub. O endpoint de criação de gravação não é idempotente — double-click cria duplicata. Para webhooks de transcrição, implementei deduplicação: hash do payload é salvo numa tabela, e se o mesmo hash chegar novamente o handler retorna 200 sem reprocessar. O OFICINA já tinha isso certo com upsert por external_id."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que acontece se o mesmo webhook chegar duas vezes no seu servidor?"
>
> **R (30s):**
> "Sem proteção, o handler roda duas vezes — duplica o efeito colateral. Webhook de pagamento roda duas vezes = cliente cobrado duas vezes. Minha proteção padrão: no recebimento do webhook, faço hash do payload e salvo numa tabela de `processed_events`. Se o mesmo hash já existe, retorno 200 para o emissor mas não processo. Se não existe, salvo o hash e processo — numa transaction para garantir que registro e processamento são atômicos. A maioria dos serviços de webhook garante 'at least once delivery', então idempotência no handler é responsabilidade minha."

> **P:** "Qual a diferença entre uma operação idempotente e uma operação segura?"
>
> **R (30s):**
> "Segura significa que a operação não causa efeitos colaterais — GET é seguro porque só lê. Idempotente significa que executar N vezes tem o mesmo resultado que executar 1 vez — GET é idempotente, PUT é idempotente (substituir com os mesmos dados = mesmo resultado), DELETE é idempotente (deletar o que não existe = ainda não existe). POST geralmente não é nenhum dos dois por padrão — cria novo recurso a cada chamada. A distinção importa porque clientes podem repetir requests seguros livremente e podem repetir requests idempotentes com segurança, mas POST requer proteção explícita contra duplicatas."

---

## Checkpoint

- [ ] Consigo classificar GET, POST, PUT, DELETE como seguro/idempotente sem consultar
- [ ] Sei implementar Idempotency-Key pattern com Redis
- [ ] Identifiquei endpoints não-idempotentes num projeto AG real
- [ ] Entendi como o OFICINA usa upsert para idempotência natural
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Idempotência em APIs dominado`.

---

## Recursos

- Stripe Docs — [Idempotent Requests](https://stripe.com/docs/api/idempotent_requests) (melhor exemplo de indústria)
- MDN — [HTTP Methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) (safe vs idempotent por método)
- `~/projetos/cliente-oficina-backend/` — upsert por external ID em produção
