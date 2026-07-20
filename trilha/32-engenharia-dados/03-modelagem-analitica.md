# 03 — Modelagem Analítica

## O que é

Modelagem transacional (OLTP) otimiza escrita consistente: normalizada, uma verdade por linha. Modelagem analítica (OLAP) otimiza pergunta de negócio: "faturamento por loja por mês" precisa sair em milissegundos, não em cinco joins. O vocabulário canônico vem do modelo dimensional (Kimball, "The Data Warehouse Toolkit"):

- **Fato:** o evento mensurável (venda, pagamento) — muitas linhas, colunas numéricas, FKs.
- **Dimensão:** o contexto pelo qual se filtra e agrupa (loja, vendedor, produto, tempo).
- **Grão:** o que UMA linha do fato representa (uma venda? um item de venda?). Definir grão errado é o erro número 1 — soma dupla nasce aqui.

Star schema = fato no centro, dimensões em volta. Desnormalizar (copiar `nome_loja` para o fato) é aceitável em analítico: troca-se consistência de update (raro em dado histórico) por leitura simples.

### Onde a fórmula mora — o bug real

No CLIENTE OFICINA, dois painéis mostravam "faturamento do mês" com números diferentes. Não era dado corrompido: eram **duas fórmulas homônimas** — cada front calculava "faturamento" à sua maneira (um descontava cancelamento, outro não; um filtrava por data de emissão, outro por data de pagamento). Banco consistente, apresentação divergente. A lição: **métrica com nome tem que ter UMA definição executável, num lugar só** — view ou função SQL no banco — e todo consumidor chama ela. Fórmula duplicada não "pode divergir": ela VAI divergir, porque a manutenção acontece num lugar e esquece o outro.

### View vs tabela agregada vs cálculo no front

| Onde | Quando | Custo |
|---|---|---|
| Cálculo no front | Nunca, para métrica de negócio | Duplica a fórmula por tela; diverge |
| View SQL | Padrão: sempre fresca, definição única | Recalcula a cada leitura; ok até milhões de linhas |
| Materialized view / tabela agregada | Query comprovadamente pesada demais | Refresh — introduz staleness e mais um job |

Raciocínio sênior: começar com view; só materializar com evidência de lentidão (`explain analyze`, não impressão).

### Passo a passo

```sql
-- 1. A definição canônica da métrica (uma, no banco)
create or replace view faturamento_mensal as
select loja,
       date_trunc('month', emitida_em) as mes,
       sum(valor)  filter (where status <> 'cancelada') as faturamento,
       count(*)    filter (where status <> 'cancelada') as vendas
from vendas_raw
group by 1, 2;

-- 2. Medir ANTES de materializar
explain analyze
select * from faturamento_mensal
where mes = date_trunc('month', now());

-- 3. Só se comprovadamente lento:
create materialized view faturamento_mensal_mat as
  select * from faturamento_mensal;
-- refresh sem travar leitores exige unique index:
create unique index on faturamento_mensal_mat (loja, mes);
refresh materialized view concurrently faturamento_mensal_mat;
```

O front (React) consome a view — nunca reimplementa a soma.

## Por que cai em entrevista

Modelagem dimensional é o divisor entre "faz CRUD" e "constrói produto de dados". Entrevistador pergunta grão, fato vs dimensão e "por que os números dos seus dois dashboards vão bater?" — quem responde com a solução institucional (definição única no banco) demonstra cicatriz real, não teoria decorada.

> **P:** "Dois dashboards seus mostram faturamentos diferentes. O que você faz?"
>
> **R (30s):**
> "Já vivi isso num cliente multi-loja. Primeiro testo a hipótese barata: é o mesmo dado com fórmulas diferentes, ou dado diferente? Comparei as queries e eram duas definições homônimas de faturamento — uma descontava cancelamento, a outra não. O fix estrutural não é corrigir um número: é mover a métrica para UMA view SQL no banco e os dois fronts consumirem a mesma fonte, porque fórmula duplicada diverge por construção. E só materializo essa view se o explain analyze provar leitura lenta — staleness e refresh são custos que não pago sem evidência."

## Checkpoint

- [ ] Defino fato, dimensão e grão e dou exemplo de cada num domínio de vendas
- [ ] Explico por que fórmula duplicada em dois fronts diverge inevitavelmente
- [ ] Escrevi uma view canônica de métrica usando `filter (where ...)`
- [ ] Sei os trade-offs view vs materialized view e o critério de evidência para migrar
- [ ] Sei o que `refresh ... concurrently` exige (unique index) e por quê

## Recursos

- The Data Warehouse Toolkit — o livro-fonte do modelo dimensional; ler ao menos os 4 primeiros capítulos
- [Postgres — materialized views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [dbt — docs](https://docs.getdbt.com/) — a versão industrializada de "métrica definida num lugar só"
- [Use The Index, Luke](https://use-the-index-luke.com/) — performance de leitura analítica no SQL
