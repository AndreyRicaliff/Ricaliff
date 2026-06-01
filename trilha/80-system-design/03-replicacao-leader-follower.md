# 03 — Replicação Leader-Follower

## O que é

**Replicação** é manter cópias do mesmo banco de dados em múltiplos servidores. No modelo **leader-follower** (também chamado primary-replica ou master-slave), existe um servidor que aceita escritas (leader/primary) e um ou mais servidores que recebem cópias dessas escritas e servem leituras (followers/replicas).

Para a AG hoje: nenhum dos projetos usa replicação. Isso é correto — o custo operacional não é justificado pelo tráfego atual. Este módulo ensina o vocabulário e os trade-offs para saber quando considerar e como defender a decisão de não usar em entrevista.

---

### Como funciona

```
Escrita:
Client → Leader → (replication log) → Replica 1
                                    → Replica 2

Leitura:
Client → Replica 1 (ou 2 ou Leader)
```

O leader processa todas as escritas (INSERT, UPDATE, DELETE). Depois de confirmar a escrita, propaga o **replication log** (WAL — Write-Ahead Log, no PostgreSQL) para as réplicas. As réplicas aplicam o log na mesma ordem e ficam com cópia idêntica.

---

### Replicação Síncrona vs Assíncrona

**Síncrona:**
```
Leader escreve → espera réplica confirmar → retorna sucesso para o cliente
Vantagem: consistência forte — se o leader cair, a réplica tem exatamente os mesmos dados
Custo: latência de escrita = latência da rede até a réplica (adiciona 1-10ms tipicamente)
```

**Assíncrona (padrão):**
```
Leader escreve → retorna sucesso → propaga para réplica em background
Vantagem: escrita rápida (sem esperar réplica)
Custo: réplica pode estar alguns segundos atrás (replication lag)
       Se leader cair antes de propagar: dados perdidos
```

**Na prática:** a maioria usa assíncrona para performance, com no mínimo uma réplica síncrona para durabilidade (PostgreSQL chama isso de "synchronous_standby_names").

---

### Read Replicas: escalar leitura

O caso de uso principal de réplicas hoje é distribuir leituras:

```
100 requests/s total:
- 10% escrita → vai para o leader
- 90% leitura → distribuído entre réplicas

Com 3 réplicas:
- Leader: 10 writes/s
- Cada réplica: 30 reads/s

Sem réplicas:
- Leader: 10 writes/s + 90 reads/s = 100 ops/s
```

No Prisma, configurar read replica é direto:

```ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }  // leader — escritas
  }
})

// Segundo cliente apontando para a réplica:
const prismaReplica = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_REPLICA_URL }  // réplica — leituras
  }
})

// Leitura vai para réplica:
const employees = await prismaReplica.employee.findMany({ where: { clientId } })

// Escrita vai para o leader:
await prisma.employee.create({ data: newEmployee })
```

**Atenção com replication lag:** se você escrever e imediatamente ler pela réplica, pode não ver o dado ainda.

```ts
// Problema de replication lag:
await prisma.employee.create({ data: newEmployee })  // leader
const employee = await prismaReplica.employee.findUnique({ where: { id: newId } }) // réplica
// employee pode ser null se a réplica ainda não recebeu o write

// Solução: ler pelo leader quando consistência imediata é necessária:
const employee = await prisma.employee.findUnique({ where: { id: newId } }) // leader — garante leitura do que acabou de escrever
```

---

### Failover

Se o leader cair:

```
Manual failover:
1. DBA promove uma réplica para ser o novo leader
2. Atualiza connection string na aplicação
3. Downtime: minutos (tempo de detecção + promoção + atualização)

Automático (alta disponibilidade):
1. Sentinel (Redis) / Patroni (Postgres) detecta falha do leader
2. Elege nova réplica como leader automaticamente
3. Downtime: 10-30s típico
```

Para Supabase (Postgres gerenciado): failover automático está incluído. Para Postgres self-hosted: precisa de Patroni ou similar.

---

### Lag de Replicação: número que importa

Replication lag é o atraso entre o momento em que o leader confirma uma escrita e o momento em que a réplica aplica essa escrita. Em condições normais em rede local: **<1ms** (praticamente instantâneo). Em condições de estresse (réplica sobrecarregada): **segundos a minutos**.

```sql
-- Medir lag atual no PostgreSQL:
SELECT
  application_name,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  (sent_lsn - replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;

-- Ou em termos de tempo (se pg_last_xact_replay_timestamp disponível na réplica):
SELECT NOW() - pg_last_xact_replay_timestamp() AS replication_lag;
```

**Implicação de design:** nunca fazer leitura crítica em réplica se depende de dado acabado de escrever. Exemplo: após cadastrar usuário, redirecionar para leitura de dados do próprio usuário → usar leader. Consultas de relatório que não dependem de dado segundos atrás → réplica.

---

### Supabase Replicas

O Supabase (que a AG usa no PULSAR-RH e outros) oferece read replicas em planos pagos. Quando o PULSAR-RH crescer:

```
Supabase Pro + Read Replica:
- Primary (SP): aceita escritas, leituras de consistência crítica
- Replica (outro region): leituras de relatório, dashboards, exports

Custo: ~$10/mês por réplica adicional no Supabase Pro
```

Para a AG hoje: single instance é correto. Quando o PULSAR-RH atingir >50 clientes com uso ativo simultâneo, considerar réplica.

---

### Por que não hoje para a AG

**PULSAR-RH atual:**
- Estimativa: <20 clientes simultaneamente
- Banco atual: single Supabase instance
- Latência de query: ~5ms–50ms — aceitável
- Read/write ratio: ~80/20 (dashboards vs atualizações)

**Custo de adicionar réplica:**
- Operacional: connection pooling diferente para reads vs writes, replication lag precisa ser monitorado, failover precisa ser testado
- Financeiro: ~$10–20/mês a mais
- Complexidade de código: 2 conexões Prisma, lógica de roteamento reads/writes

**Quando adiciona réplica fará sentido:**
- Query latência de dashboard ultrapassar 200ms consistentemente
- CPU do banco acima de 70% em horário de pico
- Mais de 10 requests/s em leitura de relatório

---

## Por que cai em entrevista

Replicação é pergunta de system design pleno/sênior. Entrevistador quer saber: você conhece o trade-off de lag? Você sabe quando ler da réplica vs do leader? Você sabe que failover tem downtime mesmo com alta disponibilidade?

Número importante para entrevista:
- Replication lag em rede local: **<1ms** típico
- Replication lag em replicação cross-região: **50ms–200ms** (velocidade da luz + serialização)
- Failover automático com Patroni: **10–30s** de downtime

---

## Trade-offs

| Configuração | Throughput leitura | Durabilidade | Complexidade |
|---|---|---|---|
| Single instance | Limitado a 1 servidor | Alta (se backup) | Zero |
| Leader + 1 réplica assíncrona | 2× | Risco de <1s de perda em crash | Média |
| Leader + 1 réplica síncrona | 1.5× (escrita mais lenta) | Zero perda | Alta |
| Leader + N réplicas | N× leitura | Depende de sync/async | Alta |
| Multi-leader (Galera) | Alta para escrita e leitura | Complexo | Muito alta — evitar |

---

## Exercício aplicado (projeto AG real)

```bash
# Justificar single-instance Postgres para o PULSAR-RH atual

# 1. Verificar configuração atual de banco nos projetos AG
cd ~/projetos/PULSAR-RH
grep -rn "DATABASE_URL\|REPLICA\|datasources" \
  .env.example apps/api/src/ --include="*.ts" --include="*.env*"

# 2. Verificar se há lógica de read/write split
grep -rn "prismaReplica\|readReplica\|replica" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"

# 3. Estimar carga atual
# (verificar logs ou analytics se disponível)
# Query: quantos clientes ativos? Quantas requests/hora?
grep -rn "req.log\|morgan\|logger.*req" apps/api/src/ --include="*.ts" | head -5
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] single-instance Postgres PULSAR-RH

**Decisão:** manter single instance Supabase sem read replica

**Contexto atual:**
- N clientes ativos no PULSAR-RH (estimativa)
- Carga estimada: < X requests/hora
- Latência de dashboard atual: < Y ms (medir se possível)

**Por que single instance é correto agora:**
1. Custo de complexidade não justificado pelo volume
2. Supabase gerencia backup e durabilidade — sem risco de perda de dado
3. Latência atual está dentro do aceitável (<200ms)
4. Read replica exigiria lógica de roteamento no código

**Quando reavaliar:**
- Latência de dashboard > 200ms consistentemente
- CPU do banco > 70% em pico
- > 10 reads/s de relatórios simultâneos

**Alternativa antes de réplica:**
- Adicionar cache Redis (02-cache-estrategias) → resolve 80% dos problemas de leitura
- Otimizar queries com índices → resolve outros 15%
- Réplica: para o 5% restante

**Referência de custo:**
- Supabase Pro + Read Replica: ~$25/mês adicional
- Quebrar ponto de inflexão: >50 clientes ativos simultâneos
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você usaria read replicas? Não valeria sempre ter?"
>
> **R (30s):**
> "Só quando o tráfego de leitura estiver saturando o banco primário. Réplica adiciona complexidade: duas connection strings, lógica de roteamento no código, e o problema de replication lag — se eu escrever e imediatamente ler da réplica, posso não encontrar o dado. Para o PULSAR-RH atual, com poucos clientes, cache Redis resolve 80% do problema de leitura sem essa complexidade. Réplica seria o próximo passo depois que cache não for suficiente."

> **P:** "O que é replication lag e por que importa?"
>
> **R (30s):**
> "Lag é o atraso entre o leader confirmar uma escrita e a réplica aplicá-la. Em rede local, tipicamente menos de 1ms — imperceptível. O problema aparece em duas situações: quando a réplica está sobrecarregada, o lag pode crescer para segundos. E se você usa replicação cross-região, tem o lag físico da rede — 50ms a 200ms. A implicação de design: nunca leia da réplica dado que você acabou de escrever. Depois de criar um usuário, a próxima leitura dos dados dele deve ir para o leader."

---

## Checkpoint

- [ ] Consigo explicar a diferença entre replicação síncrona e assíncrona com os trade-offs
- [ ] Sei o que é replication lag, o valor típico e como isso afeta o design
- [ ] Justifiquei por escrito por que single instance é correto para o PULSAR-RH agora
- [ ] Sei quando reavaliar a decisão (critérios mensuráveis)
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [PostgreSQL — Streaming Replication](https://www.postgresql.org/docs/current/warm-standby.html)
- [Supabase — Read Replicas](https://supabase.com/docs/guides/platform/read-replicas)
- [Patroni](https://github.com/patroni/patroni) — HA automático para Postgres self-hosted
- Martin Kleppmann — *Designing Data-Intensive Applications* (cap. 5 — Replication) — a referência definitiva sobre este tema
