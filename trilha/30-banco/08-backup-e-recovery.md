# 08 — Backup e recovery

## O que é

Backup é a cópia do estado do banco em um ponto no tempo. Recovery é a capacidade de restaurar o banco a partir dessa cópia. O que separa um backup útil de um falso conforto: **backup que nunca foi testado em restore não é backup — é esperança**.

**Duas abordagens principais:**

**pg_dump** — snapshot lógico. Gera SQL ou formato binário que recria o banco do zero.

```bash
# Dump lógico completo (formato custom — mais flexível que SQL puro)
pg_dump -Fc -h localhost -U postgres -d nome_banco > backup_20240615.dump

# Restaurar
pg_restore -h localhost -U postgres -d nome_banco_novo backup_20240615.dump

# Dump só de uma tabela (útil para migração seletiva)
pg_dump -Fc -h localhost -U postgres -d nome_banco -t sale_items > sale_items_backup.dump

# Verificar o conteúdo sem restaurar
pg_restore --list backup_20240615.dump
```

**WAL archiving + PITR** — replicação contínua do Write-Ahead Log. Permite restaurar para qualquer ponto no tempo (Point in Time Recovery), não só para o último snapshot.

```
WAL = diário de transações do Postgres. Cada mudança é escrita no WAL antes de ser
aplicada nos dados. Com archiving, esses logs vão para um storage externo continuamente.
PITR = você pega um base backup + os WALs a partir dele e "replay" até o timestamp exato.
```

---

## pg_dump vs WAL archiving

| | pg_dump | WAL archiving + PITR |
|---|---|---|
| Granularidade | snapshot no momento do dump | qualquer segundo desde o último base backup |
| RPO (perda máxima de dado) | até o período entre backups | segundos (depende da frequência de archiving) |
| RTO (tempo para restaurar) | minutos a horas (depende do tamanho) | minutos a horas (replay dos WALs pode ser lento) |
| Complexidade | simples | complexo (precisa de armazenamento de WAL, processo de archiving) |
| Uso | projetos menores, backups pontuais, migrações | produção crítica, onde perda de horas é inaceitável |

**RPO e RTO** são as duas métricas que importam em conversa com cliente:

- **RPO (Recovery Point Objective)** — qual o máximo de dado que você pode perder? Se RPO = 1h, backup a cada hora é suficiente. Se RPO = 0, precisa de replicação síncrona.
- **RTO (Recovery Time Objective)** — em quanto tempo o sistema precisa estar de volta? Se RTO = 4h, um restore de pg_dump pode ser aceitável. Se RTO = 5 min, você precisa de standby pronto para assumir.

---

## Supabase backups

O Supabase Pro oferece:

- **Daily backups** — snapshot diário automático, retenção de 7 dias.
- **PITR** — disponível no Pro e acima; retenção de 7 a 28 dias dependendo do plano.
- **On-demand backups** — antes de operação de risco (migration destrutiva, deploy grande).

```
Como verificar no painel Supabase:
Settings → Database → Backups

On-demand:
Settings → Database → Backups → Create new backup
```

**Limitações importantes:**
- Backup do Supabase não inclui storage de arquivos (buckets) — esses precisam de política separada.
- PITR do Supabase tem janela máxima — verificar no painel qual o período disponível.
- O backup é do projeto inteiro — não é possível restaurar só uma tabela sem exportar e reimportar.

---

## Por que backup só funciona quando você testou restore

Cenários reais de backup que falharam:

1. **Arquivo corrompido** — pg_dump falhou silenciosamente no meio, arquivo existe mas está incompleto.
2. **Permissão errada** — arquivo existe, mas o usuário de restore não tem permissão de leitura.
3. **Versão incompatível** — dump foi gerado com Postgres 14, restore tentado em Postgres 16 com flags incompatíveis.
4. **Dados faltando** — backup configurado mas excluindo tabelas grandes por "economia de espaço" — justamente as que precisavam.
5. **Tempo de restore** — backup de 50GB demora 2h para restaurar. Você descobriu isso às 3h da manhã durante um incidente.

**A única forma de saber se o backup funciona: fazer o restore regularmente, num ambiente separado, e verificar a integridade dos dados.**

---

## Por que cai em entrevista

- "Qual a diferença entre pg_dump e PITR?"
- "O que é RPO? O que é RTO?"
- "Você perdeu 2 horas de dado em produção. O que aconteceu e o que você faria diferente?"
- "Como você garantiria que o backup do cliente está funcionando?"
- "Supabase tem backup automático. Isso é suficiente?"

---

## Trade-offs

| Estratégia | RPO | RTO | Complexidade | Custo |
|---|---|---|---|---|
| Sem backup | infinito | irrelevante (dado perdido) | zero | zero |
| pg_dump manual | horas/dias | ~horas | baixa | storage |
| pg_dump automatizado (cron) | período do cron | ~horas | média | storage + automação |
| Supabase daily backup | até 24h | horas | zero (gerenciado) | incluído no plano |
| Supabase PITR | segundos | horas | zero (gerenciado) | plano Pro+ |
| Replicação + hot standby | segundos | minutos | alta | servidor adicional |

---

## Exercício aplicado (projeto AG real)

CLIENTE OFICINA — documentar a política de backup atual e o que precisa melhorar.

**Passo 1 — inventariar o que existe:**

```bash
# Checar se o Supabase do OFICINA tem PITR ativo
# (verificar no painel: Settings → Database → Backups)

# Checar se existe algum script de backup manual
find ~/projetos/cliente-oficina-backend/ -name "*.sh" -o -name "*backup*" 2>/dev/null

# Checar cron jobs de backup
crontab -l 2>/dev/null | grep -i backup
systemctl --user list-timers 2>/dev/null | grep -i backup
```

**Passo 2 — calcular RPO e RTO atuais:**

- Qual o backup mais frequente disponível? (diário = RPO de até 24h)
- Quanto tempo levaria para restaurar o banco inteiro? (estimar pelo tamanho)
- Existe processo documentado de restore? Alguém já executou esse processo?

**Passo 3 — documentar a política em `cliente-oficina-backend/DECISIONS.md`:**

```markdown
## 2026-06-XX — [reliability] política de backup CLIENTE OFICINA

### Estado atual
- Banco: Supabase (plano: [Free/Pro — verificar])
- Backup automático: [Daily? PITR? Verificar no painel]
- Último teste de restore: NUNCA (⚠ risco)
- RPO atual: [até 24h se daily, ou X horas se PITR ativo]
- RTO estimado: [estimar pelo tamanho do banco]

### Riscos identificados
- [ ] Backup nunca foi testado em restore
- [ ] Não há alerta se backup falhar
- [ ] Buckets de storage não têm política de backup separada

### Plano de ação
1. Verificar plano Supabase — Free não tem PITR
2. Realizar restore de teste trimestral num projeto Supabase separado
3. Documentar o procedimento de restore passo a passo

### Considerando para crítico
Se OFICINA escalar e perda de dados de venda for inaceitável:
- Supabase Pro com PITR (RPO ~minutos)
- Ou pg_dump diário automatizado para storage externo (S3/GCS)
  com restore testado mensalmente

### Como explicar para o cliente (30s)
"Seus dados de venda têm backup diário automático. Se houver problema,
consigo restaurar para o estado de até [24h/X horas] atrás.
Para garantir zero surpresas, vou testar o restore uma vez por trimestre
e documentar o tempo que leva."
```

**Passo 4 — testar um restore (fazer isso de verdade):**

```bash
# No Supabase: criar projeto de teste
# Settings → Database → Backups → Restore to new project
# Verificar: número de tabelas, contagem de linhas em sale_items, último registro
```

---

## Pergunta de entrevista esperada + resposta exemplar

**P:** "Qual a diferença entre RPO e RTO? Como você definiria a estratégia de backup de um sistema de vendas?"

**R (30s):**
"RPO é quanto de dado você pode perder — se perder 1h de vendas é aceitável, backup de hora em hora está OK. RTO é quanto tempo para voltar ao ar — se o negócio para por 4h é aceitável, restore de pg_dump pode funcionar. Para sistema de vendas, meu mínimo é backup diário com teste de restore trimestral. Se a perda de horas de venda for crítica (e geralmente é), uso PITR — que no Supabase Pro já vem incluído — para restaurar ao minuto exato antes do problema. O que nunca aceito: backup que nunca foi testado. Sem teste de restore, não é backup, é esperança."

**P:** "Por que backup que nunca foi testado não é confiável?"

**R (30s):**
"Porque os problemas aparecem no restore, não no backup. O arquivo pode estar corrompido por falha silenciosa de escrita. A versão do Postgres pode ser incompatível. O processo de restore pode demorar 4h e você só descobre às 3h da manhã. A permissão de leitura pode estar errada. Já vi caso real onde o backup excluía a tabela mais importante 'para economizar espaço'. Sem restore testado regularmente, você tem falsa segurança — que é pior do que não ter backup, porque você não se prepara para o cenário de perda."

---

## Checkpoint

- [ ] Sei a diferença entre pg_dump e WAL/PITR com exemplo concreto
- [ ] Consigo definir RPO e RTO e calcular os valores atuais para o OFICINA
- [ ] Verifiquei o status de backup do projeto OFICINA no painel Supabase
- [ ] Documentei a política de backup em `cliente-oficina-backend/DECISIONS.md`
- [ ] Executei ou agendei um teste de restore em ambiente separado

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Backup e Recovery dominados`.

---

## Recursos

- Postgres docs — [Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- Postgres docs — [Point-in-Time Recovery](https://www.postgresql.org/docs/current/continuous-archiving.html)
- Supabase docs — [Backups](https://supabase.com/docs/guides/platform/backups)
- pgbackrest.org — ferramenta open source para backup profissional com PITR
