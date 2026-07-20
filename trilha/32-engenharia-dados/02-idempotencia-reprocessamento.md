# 02 — Idempotência e Reprocessamento

## O que é

Uma operação é **idempotente** quando executá-la N vezes produz o mesmo estado que executá-la uma vez. Em pipeline distribuído isso não é luxo, é fundação, porque a rede garante muito pouco. As três semânticas de entrega:

- **at-most-once:** nunca duplica, mas pode PERDER (fire-and-forget);
- **at-least-once:** nunca perde, mas pode DUPLICAR — o retry após timeout pode repetir um request que já tinha chegado (só a resposta se perdeu);
- **exactly-once:** no caso geral distribuído, é at-least-once + escrita idempotente no destino. Não existe mágica na rede; existe dedup no banco.

A escrita idempotente clássica no Postgres é o upsert por **chave natural** — o identificador que o dado já traz do mundo (ID da venda no ERP), não o `serial`/`uuid` que seu banco inventa. Com chave natural + `on conflict`, reprocessar é seguro por construção — e retry deixa de ser risco e vira estratégia. É o mesmo princípio das idempotency keys da Stripe: o cliente manda a chave, o servidor deduplica.

Dois padrões completam o tripé:

1. **Janela de overlap:** cada execução reprocessa de propósito um trecho já visto (âncora − 200 IDs, ou últimas 48h por `updated_at`) para capturar registros atrasados ou editados na origem. Custo: reprocessar um pouco. Ganho: não depender de a origem ser perfeita.

2. **Full-sync como reconciliação:** o incremental deriva com o tempo (edição antiga, registro deletado na origem). Agenda-se uma varredura completa (semanal, madrugada) que compara e corrige — o mesmo raciocínio do contador que bate o extrato: lançamento diário é incremental, conciliação é full.

### Passo a passo

```sql
-- chave natural única = pré-condição da idempotência
alter table vendas_raw
  add constraint vendas_raw_erp_id_key unique (erp_id);
```

```sql
insert into vendas_raw (erp_id, loja, valor, emitida_em)
values ($1, $2, $3, $4)
on conflict (erp_id) do update
  set loja = excluded.loja,
      valor = excluded.valor,
      emitida_em = excluded.emitida_em;
```

Reconciliação — antes de corrigir, MEDIR a deriva (hipótese antes de fix):

```sql
-- total por dia no meu banco; comparar com o total reportado pela API do ERP
select emitida_em::date as dia, count(*) as n, sum(valor) as total
from vendas_raw
where emitida_em >= now() - interval '30 days'
group by 1 order by 1;
```

Se os totais batem, a deriva é zero e o full-sync pode ser mensal; se divergem, investigar POR QUE antes de aumentar a frequência — reconciliar mais rápido um pipeline que duplica é esconder o bug. No sync do CLIENTE OFICINA o trio retry + backoff + lockfile existe exatamente por isso: o retry pressupõe upsert idempotente, e o lockfile impede duas execuções concorrentes de disputarem a mesma janela.

## Por que cai em entrevista

"O que acontece se seu job rodar duas vezes?" é a pergunta-teste de maturidade em backend/dados. Quem responde "não roda duas vezes" falha; quem responde "roda quantas vezes for, o resultado é o mesmo — e esta é a chave que garante" passa.

> **P:** "Como você reprocessa dados sem gerar duplicata?"
>
> **R (30s):**
> "Idempotência por chave natural. Minha tabela de ingestão tem unique no ID que o ERP emite, e toda escrita é upsert com on conflict — reprocessar qualquer janela é seguro por construção. Assumo entrega at-least-once: prefiro duplicar tentativa e deduplicar no banco a arriscar perda. Por cima, cada execução tem janela de overlap para pegar edição atrasada na origem, e um full-sync periódico funciona como conciliação — compara totais por dia e corrige deriva. E antes de aumentar frequência de reconciliação eu meço a deriva: se diverge, tem bug para achar, não sintoma para maquiar."

## Checkpoint

- [ ] Explico at-most-once / at-least-once / exactly-once e por que exactly-once = at-least-once + idempotência
- [ ] Diferencio chave natural de surrogate e sei qual delas ancora o upsert
- [ ] Escrevo um `on conflict do update` de cabeça
- [ ] Justifico a janela de overlap com um cenário concreto de edição atrasada
- [ ] Tenho (ou desenhei) uma query de reconciliação que mede deriva antes de corrigir

## Recursos

- [Stripe — Designing robust and predictable APIs with idempotency](https://stripe.com/blog/idempotency) — o post clássico
- [Postgres — INSERT ... ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html)
- [Supabase — upsert](https://supabase.com/docs/reference/javascript/upsert)
- Designing Data-Intensive Applications — cap. 11, tolerância a falha e semântica de entrega
