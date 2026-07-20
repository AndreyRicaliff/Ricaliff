# 01 — Pipeline ETL/ELT

## O que é

Pipeline de dados é o caminho que um dado percorre da origem (ERP, API, formulário) até o destino analítico (dashboard, relatório). **ETL** (Extract, Transform, Load) transforma ANTES de carregar: nasceu na era em que warehouse era caro — só entrava dado limpo e agregado. **ELT** inverte: carrega o dado CRU no destino e transforma lá dentro com SQL — viável desde que armazenamento ficou barato (BigQuery, Snowflake, e o próprio Postgres em escala pequena/média). O padrão de mercado hoje é ELT com dbt orquestrando transformações como camadas de views versionadas em git.

Duas decisões definem qualquer pipeline:

1. **Batch vs streaming.** Batch roda em janelas (cron a cada 15 min); streaming processa evento a evento (Kafka, Debezium/CDC). Streaming custa uma ordem de magnitude a mais de complexidade operacional. Raciocínio sênior: perguntar a latência que o NEGÓCIO tolera — dashboard comercial tolera minutos, então batch vence até prova em contrário. "Real-time" sem requisito medido é vaidade cara.

2. **Full load vs incremental.** Full recarrega tudo (simples, caro, trava com volume); incremental busca só o que mudou desde a última execução — exige uma **âncora** confiável (ID sequencial ou `updated_at` DA ORIGEM, nunca o relógio de quem roda o job).

### O sync ERP-externo → Postgres como ETL real

No CLIENTE OFICINA e no Cliente Varejo, uma Edge Function puxa vendas do ERP-externo por API paginada e grava no Postgres (Supabase). Anatomia:

- **Extract:** paginação (`pagina`/`por_pagina`), backoff exponencial em rate-limit (HTTP 429), lockfile para impedir duas execuções concorrentes.
- **Janela incremental:** só registros com ID acima da âncora persistida numa tabela de controle.
- **Transform leve no boundary:** mapeamento de campos + validação (módulo 04).
- **Load:** upsert idempotente (módulo 02).

### Passo a passo

```sql
create table sync_estado (
  recurso text primary key,
  ancora_id bigint not null default 0,
  atualizado_em timestamptz not null default now()
);
```

```ts
// Edge Function — janela incremental por âncora de ID
const { data: e } = await db.from('sync_estado')
  .select().eq('recurso', 'vendas').single();
let pagina = 1, maiorId = e.ancora_id;
while (true) {
  const lote = await erpGet('/vendas', {
    desde_id: e.ancora_id, pagina, por_pagina: 500 });
  if (!lote.length) break;
  await db.from('vendas_raw')
    .upsert(lote.map(mapear), { onConflict: 'erp_id' });
  maiorId = Math.max(maiorId, ...lote.map(v => v.id));
  pagina++;
}
await db.from('sync_estado')
  .update({ ancora_id: maiorId }).eq('recurso', 'vendas');
```

O detalhe que separa júnior de pleno: a âncora só avança DEPOIS do lote persistido. Se o job morrer no meio, a próxima execução repete a janela — duplicação possível, perda não. Escolha deliberada por **at-least-once**; o módulo 02 resolve a duplicação.

## Por que cai em entrevista

"Desenha um pipeline que traz dados de uma API externa pro seu banco" é pergunta clássica de system design para pleno. O entrevistador quer ouvir âncora incremental, paginação, o que acontece se o job morrer no meio e o trade-off batch vs streaming — não o nome de dez ferramentas da moda.

> **P:** "ETL ou ELT? Qual você usaria e por quê?"
>
> **R (30s):**
> "Depende de onde a transformação é mais barata e auditável. Nos meus syncs de ERP faço um híbrido: validação leve no boundary da Edge Function — dado inválido não pode nem entrar — e o resto em SQL, em views no Postgres, que é ELT. Vantagem: o dado cru fica preservado, então quando a regra de negócio muda eu retransformo sem re-extrair. Streaming só com requisito de latência medido; dashboard comercial tolera minutos, e batch com janela incremental é uma ordem de magnitude mais simples de operar."

## Checkpoint

- [ ] Explico ETL vs ELT e digo onde cada transformação do meu pipeline acontece e por quê
- [ ] Desenho janela incremental com âncora e justifico por que a âncora vem da origem, não do meu relógio
- [ ] Sei o que acontece se o job morrer no meio do lote — e por que isso é escolha, não acidente
- [ ] Defendo batch vs streaming pela latência que o negócio tolera, com número
- [ ] Li de ponta a ponta (ou implementei) um sync paginado com backoff e lockfile

## Recursos

- Designing Data-Intensive Applications — cap. 10 e 11 (batch e stream processing), o livro-base da área
- [dbt docs](https://docs.getdbt.com/) — ELT industrializado: transformação versionada em SQL
- [Debezium](https://debezium.io/) — CDC (change data capture), a porta de entrada do streaming
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions) — onde o extract dos syncs AG roda
