# 03 — Idempotência

## O que é

Operação idempotente é a que pode rodar N vezes com o mesmo efeito de rodar uma: `f(f(x)) = f(x)`. Não é luxo acadêmico — é consequência direta de um fato de sistemas distribuídos: **entrega exactly-once não existe na prática**. Toda fila, todo webhook, todo scheduler honesto promete *at-least-once*: se o ack se perde (timeout, crash depois de processar, retry do módulo 02), a mensagem chega DE NOVO. A pergunta não é "e se duplicar?", é "QUANDO duplicar, o que acontece?". Ou o processamento é idempotente, ou você tem cobrança dupla, notificação em dobro, estoque errado.

Dois mecanismos:

**1. Chave de idempotência (dedup por chave artificial).** O produtor gera um identificador único da INTENÇÃO (não do request) e o consumidor registra o que já processou. O padrão canônico é o header `Idempotency-Key` do Stripe: o cliente manda um UUID; se a mesma key chega de novo, o Stripe devolve a resposta gravada da primeira vez — sem cobrar duas vezes. O registro precisa ser atômico: `INSERT` com UNIQUE constraint, não `SELECT` seguido de `INSERT` (isso é race — módulo 07).

**2. Dedup por chave natural.** Quando o dado JÁ tem identidade (id do pedido no ERP, id do evento no webhook), a idempotência sai quase de graça com upsert:

```sql
-- sync ERP-externo → Supabase: rodar 1x ou 50x dá o mesmo estado final
create unique index if not exists ux_pedidos_tenant_erp
  on pedidos (tenant_id, erp_id);
```

```ts
await supabase.from('pedidos')
  .upsert(lote, { onConflict: 'tenant_id,erp_id' }); // upsert, não insert
```

É assim que o sync da AG (Cliente Varejo, CLIENTE OFICINA) sobrevive a retry, re-execução manual e varredura completa em background: a chave natural `(tenant_id, erp_id)` faz qualquer repetição colapsar no mesmo registro. Sem o UNIQUE, o retry do módulo 02 seria uma fábrica de duplicatas.

### Passo-a-passo: webhook idempotente

Todo provedor sério reentrega (o Stripe tenta por até ~3 dias). O consumidor registra o claim do evento ANTES do efeito colateral:

```ts
const { error } = await supabase.from('webhook_eventos')
  .insert({ evento_id: payload.id });   // UNIQUE em evento_id
if (error?.code === '23505') {          // unique_violation: já processei
  return new Response('ok (duplicado)', { status: 200 });
}
await processar(payload);               // efeito colateral só depois do claim
```

Raciocínio explícito de trade-off: o claim vem primeiro porque, entre "processar" e "registrar", o processo pode morrer. Com claim primeiro, o pior caso é evento marcado e não processado — detectável e reprocessável de propósito. Sem claim, o pior caso é efeito duplo silencioso. Você não elimina a falha; escolhe QUAL falha prefere.

Teste que prova, não fé: dispare o mesmo payload 2x com `Promise.all` e asserte 1 registro. Idempotência que nunca viu um duplicado é hipótese, não fato (módulo 08).

## Por que cai em entrevista

Idempotência é o divisor entre quem já integrou sistema de verdade e quem só fez CRUD. Aparece em três formatos: "como você processa webhook com segurança?", "o que é at-least-once?" e o clássico de pagamento: "como garantir que o cliente não é cobrado duas vezes num retry?". As três têm a mesma resposta.

> **P:** "Seu job de sincronização rodou duas vezes por engano. Qual o estrago?"
>
> **R (30s):** "Nenhum — por design. O sync que mantenho grava por upsert numa chave natural composta, tenant mais id do registro no ERP, com UNIQUE no banco. Rodar duas vezes colapsa no mesmo estado final. Pra eventos sem chave natural, uso chave de idempotência: registro o id do evento numa tabela com UNIQUE antes do efeito colateral; violação de unicidade significa 'já processei, responde 200 e sai'. E eu testo disparando o duplicado de propósito — idempotência que nunca viu duplicado é suposição, não garantia."

## Checkpoint

- [ ] Explico por que exactly-once delivery não existe e o que at-least-once implica
- [ ] Sei escolher entre chave natural (upsert) e chave de idempotência (tabela de eventos)
- [ ] Implementei UNIQUE + upsert e um claim de evento tratando o erro 23505
- [ ] Defendo por que o claim vem ANTES do efeito colateral (qual falha eu prefiro)
- [ ] Disparei o mesmo evento 2x em paralelo e assertei efeito único

## Recursos

- [Stripe — Idempotent requests](https://docs.stripe.com/api/idempotent_requests)
- [PostgreSQL — INSERT ... ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)
- "You Cannot Have Exactly-Once Delivery" — Tyler Treat (blog Brave New Geek)
- [Supabase — upsert](https://supabase.com/docs/reference/javascript/upsert)
