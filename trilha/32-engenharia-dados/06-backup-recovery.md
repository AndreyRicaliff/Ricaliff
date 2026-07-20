# 06 — Backup e Recovery

## O que é

Backup não é feature, é apólice — e apólice que nunca foi acionada em teste não se sabe se paga. Dois números definem toda a conversa:

- **RPO (Recovery Point Objective):** quanto dado você aceita PERDER. Backup diário = RPO de até 24h.
- **RTO (Recovery Time Objective):** quanto tempo você aceita ficar FORA do ar até restaurar.

Sem esses dois números acordados com o negócio, "temos backup" é frase vazia — perder o dia de vendas pode ser inaceitável mesmo com dump diário impecável.

O caso canônico de "backup não testado é teatro": **GitLab, 31/01/2017**. Um engenheiro apagou por engano o diretório de dados do Postgres primário; dos CINCO mecanismos de backup/replicação, nenhum funcionava — o pg_dump falhava silenciosamente por divergência de versão, snapshots não estavam configurados, uploads de backup quebrados. Restauraram de um snapshot manual feito ~6 horas antes por sorte, perdendo ~6h de dados — e publicaram o postmortem que virou aula mundial. Moral: backup sem **restore drill** periódico tem probabilidade desconhecida de existir.

**PITR (point-in-time recovery)** no Postgres: base backup + arquivamento contínuo de WAL permitem restaurar para QUALQUER instante — tipicamente "1 minuto antes do DELETE sem WHERE". O RPO cai de "último dump" para segundos. O Supabase oferece PITR em plano pago; dump diário é o piso, não o teto.

**Regra 3-2-1:** 3 cópias, 2 mídias/locais distintos, 1 fora do provedor primário. Se o provedor suspende sua conta, backups dentro dele são zero cópias.

### Passo a passo — restore drill (rito trimestral)

```bash
# 1. Dump lógico (formato custom, comprimido)
pg_dump "$DATABASE_URL" -Fc -f drill-$(date +%F).dump

# 2. Restaurar em banco descartável LOCAL — nunca sobre produção
createdb drill_teste
pg_restore --no-owner -d drill_teste drill-$(date +%F).dump

# 3. Validar por EVIDÊNCIA, não por "restaurou sem erro":
psql -d drill_teste -c "select count(*), max(emitida_em) from vendas_raw;"
psql -d drill_teste -c "select sum(valor) from vendas_raw
                        where emitida_em >= date_trunc('month', now());"
# comparar com produção: contagem, máximo e soma têm que bater

# 4. Cronometrar os passos 1→3: esse tempo É o seu RTO real
# 5. Copiar o dump para storage FORA do provedor do banco (regra 3-2-1)
```

Raciocínio sênior: "restaurou sem erro" não é sucesso — dump truncado também restaura "sem erro". Sucesso é query de validação batendo com produção. E o RTO cronometrado vai para o DECISIONS.md do projeto: número medido vence estimativa otimista.

## Por que cai em entrevista

RPO/RTO é o vocabulário que o entrevistador usa para separar quem operou sistema de quem só desenvolveu. E a pergunta "seu backup funciona?" tem uma única resposta forte: "restaurei pela última vez em tal data, levou tanto tempo, validei com tais queries" — qualquer outra é fé.

> **P:** "Como você sabe que seu backup funciona?"
>
> **R (30s):**
> "Porque eu restauro ele de verdade, periodicamente, num banco descartável — e valido com queries comparando contagem, máximo e soma contra produção, porque dump truncado restaura sem erro. Cronometro o processo: esse é meu RTO medido, não estimado. O RPO depende do mecanismo: dump diário é 24h; com PITR, que arquiva WAL continuamente, cai para segundos — é o que quero em banco transacional. Sigo o 3-2-1 com uma cópia fora do provedor primário, porque backup dentro de conta suspensa não existe. O postmortem do GitLab de 2017 é meu lembrete: cinco mecanismos, zero funcionando."

## Checkpoint

- [ ] Defino RPO e RTO e digo o valor de cada num projeto meu real
- [ ] Conto o caso GitLab 2017 em 30 segundos com a moral certa
- [ ] Executei um restore drill completo com validação por query e cronômetro
- [ ] Explico PITR (base backup + WAL) e quando ele vale o custo sobre dump diário
- [ ] Minha cópia 3-2-1 fora do provedor primário existe e sei onde está

## Recursos

- [GitLab — postmortem do outage de 31/01/2017](https://about.gitlab.com/blog/2017/02/10/postmortem-of-database-outage-of-january-31/)
- [Postgres — continuous archiving / PITR](https://www.postgresql.org/docs/current/continuous-archiving.html)
- [pgBackRest](https://pgbackrest.org/) — a ferramenta séria de backup Postgres self-hosted
- [Supabase — backups](https://supabase.com/docs/guides/platform/backups)
