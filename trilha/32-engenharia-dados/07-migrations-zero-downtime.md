# 07 — Migrations Zero-Downtime

## O que é

Durante um deploy existe uma janela em que app VELHO e schema NOVO (ou vice-versa) convivem — segundos no melhor caso, minutos com rollback. Migration ingênua (renomear coluna, dropar campo em uso) quebra exatamente nessa janela: o app velho ainda faz `select coluna_antiga` e explode em produção. Zero-downtime não é ferramenta, é disciplina: **toda migration precisa ser compatível com a versão do app que está no ar E com a próxima.**

O padrão canônico é **expand/contract** (parallel change):

1. **Expand:** adicionar o novo sem tocar no velho — coluna nova (nullable!), tabela nova. O app velho ignora; nada quebra.
2. **Backfill:** popular o novo a partir do velho, **em lotes** — update de milhões de linhas numa transação só = lock longo, bloat e replicação atrasada.
3. **Switch:** deploy do app que lê do novo (escrevendo nos dois durante a transição — dual-write — se as duas versões convivem).
4. **Contract:** remover o velho só depois de um período de bake, em migration separada, dias depois, com evidência de que ninguém mais lê o campo.

"Renomear coluna" vira quatro passos chatos em vez de um `rename` fatal. É o preço do app no ar.

Pegadinhas de lock do Postgres que derrubam produção:

- `add column ... default X` é instantâneo no PG 11+ (só metadado); em versões antigas reescrevia a tabela inteira.
- `alter column set not null` faz full scan com lock exclusivo. Caminho seguro: `add constraint ... check (col is not null) not valid` → `validate constraint` (lock leve) → então `set not null`.
- Índice em tabela viva: **sempre** `create index concurrently` (e fora de transação).

### Passo a passo — renomear semanticamente uma coluna com app no ar (Pulsar Finance)

Cenário: `lancamentos.data` é ambígua (caixa? competência?) e o DRE precisa de `competencia_em` explícito — com o app em produção lendo `data`.

```sql
-- EXPAND (release N)
alter table lancamentos add column competencia_em date;

-- dual-write no banco enquanto as duas versões do app convivem
create or replace function sync_competencia() returns trigger
language plpgsql as $$
begin
  new.competencia_em := coalesce(new.competencia_em, new.data);
  return new;
end $$;
create trigger t_sync_competencia
  before insert or update on lancamentos
  for each row execute function sync_competencia();

-- BACKFILL em lotes (script repetido até 0 linhas, não migration única)
update lancamentos set competencia_em = data
where id in (select id from lancamentos
             where competencia_em is null limit 5000);
```

Release N+1: app e views do DRE leem `competencia_em`. Release N+2, dias depois — e só com evidência (grep no código + logs provando zero leitura de `data`):

```sql
-- CONTRACT
drop trigger t_sync_competencia on lancamentos;
drop function sync_competencia();
alter table lancamentos drop column data;
```

Raciocínio sênior: o contract é a etapa que mais atrasa e é a ÚNICA que pode esperar sem custo. Quem tem pressa no drop está otimizando estética de schema contra risco de outage — trade-off errado.

## Por que cai em entrevista

"Como você muda schema sem derrubar o sistema?" é pergunta padrão de pleno para cima, porque testa três coisas de uma vez: entendimento da janela de deploy, conhecimento dos locks do banco e disciplina de sequenciar mudança em releases — raciocínio de sistema, não de SQL.

> **P:** "Como você renomeia uma coluna com o app no ar?"
>
> **R (30s):**
> "Não renomeio — expando e contraio. Rename direto quebra o app velho na janela do deploy. Crio a coluna nova nullable, ponho um trigger de dual-write para as duas versões conviverem, faço backfill em lotes de alguns milhares para não segurar lock, e só troco a leitura no release seguinte. O drop da coluna velha é outra migration, dias depois, com evidência de que ninguém mais lê — grep no código e logs. E cuidado com locks: not null via check constraint not valid mais validate, índice sempre concurrently. O contract pode esperar de graça; outage não."

## Checkpoint

- [ ] Explico a janela app-velho/schema-novo e por que rename direto quebra nela
- [ ] Recito as 4 fases do expand/contract com o que cada release contém
- [ ] Sei por que backfill vai em lotes e o que acontece num update gigante único
- [ ] Conheço as 3 pegadinhas de lock (default, not null, index) e o caminho seguro de cada
- [ ] Sei que evidência exigir antes do contract (grep + logs, não intuição)

## Recursos

- [strong_migrations](https://github.com/ankane/strong_migrations) — catálogo de operações perigosas por tipo, vale ler o README inteiro mesmo sem Rails
- [Postgres — ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) — seção de locks
- GoCardless — "Zero-downtime Postgres migrations: the hard parts" — buscar pelo título
- Refactoring Databases (livro) — a origem formal do parallel change
