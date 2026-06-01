# 04 — CAP Theorem na Prática

## O que é

O **Teorema CAP** (Brewer, 2000) afirma que um sistema distribuído pode garantir no máximo 2 das 3 propriedades simultaneamente:

- **C — Consistency (Consistência):** toda leitura retorna o dado mais recente escrito (ou erro). Não existe leitura stale.
- **A — Availability (Disponibilidade):** toda request recebe resposta (mesmo que o dado não seja o mais recente). O sistema nunca retorna erro por indisponibilidade interna.
- **P — Partition Tolerance (Tolerância a Partição):** o sistema continua funcionando mesmo que mensagens entre nós sejam perdidas ou atrasadas.

---

### Por que CAP é "binário" só durante partição

**A intuição que a maioria perde:** em um sistema distribuído, partição de rede não é uma exceção teórica — é uma certeza estatística dado tempo suficiente. Cabo de rede que perde pacotes, datacenter com problemas de rota, instância reiniciando — tudo são partições.

Quando uma partição acontece, você **precisa escolher**:

```
Nó A (primário) ← partição de rede → Nó B (réplica)

Chega request de leitura no Nó B:
- Opção CP: retornar erro ("não consigo garantir dado consistente") → sacrifica A
- Opção AP: retornar o que tenho, mesmo potencialmente stale → sacrifica C

Não há opção que preserve C e A simultaneamente durante a partição
```

**O mito do "CA":** sistemas "CA" (consistente e disponível sem tolerância a partição) só existem em single-node. Com mais de um servidor, partições são inevitáveis. Todo banco distribuído é CP ou AP.

---

### Exemplos reais

**CP (Consistency + Partition Tolerance) — sacrifica Availability:**

| Sistema | Por que CP |
|---|---|
| **PostgreSQL** (modo padrão) | Em partição: líder para de aceitar escritas se não pode confirmar quórum |
| **MongoDB** (padrão desde 3.0) | Writes só no primary — se primary fica inalcançável, sistema recusa escritas |
| **HBase** | Construído sobre HDFS — consistente ou falha |
| **Zookeeper** | Coordenação distribuída — consistência é o ponto; aceita timeouts |
| **Redis Cluster** | Nodes particionados ficam unavailable para writes |

**AP (Availability + Partition Tolerance) — sacrifica Consistency:**

| Sistema | Por que AP |
|---|---|
| **Cassandra** | Aceita escritas e leituras mesmo com nodes inacessíveis; consistência eventual |
| **DynamoDB** (eventual consistency mode) | Qualquer node responde; pode retornar stale |
| **CouchDB** | "Offline-first" por design; sync posterior |
| **DNS** | Cached, pode estar desatualizado por horas — mas sempre responde |

---

### Consistência Eventual: o que significa na prática

AP não significa "sem consistência para sempre" — significa "consistência eventual":

```
Escrita → Nó 1 (confirmado)
              ↓
         propagação assíncrona
              ↓
         Nó 2 (atualizado ~50ms depois)
         Nó 3 (atualizado ~100ms depois)

Durante esses 100ms:
- Leitura em Nó 1: dado correto ✓
- Leitura em Nó 2: dado antigo (stale) ✗ temporariamente
- Leitura em Nó 3: dado antigo (stale) ✗ temporariamente

Após propagação completa: todos consistentes novamente
```

O sistema "converge" para consistência após a propagação. A janela de inconsistência é pequena (ms a segundos em condições normais), mas **existe**.

---

### Classificando as dependências AG

| Dependência | Modelo | Evidência |
|---|---|---|
| **Supabase/Postgres** | CP | Transações ACID; escrita no primary; failover rejeita escritas durante eleição |
| **Redis (Bull, cache)** | AP (single) / CP (Cluster) | Single node: sempre disponível, sem consistência distribuída; Cluster: CP |
| **Google Drive API** | AP (com cache) | Retorna dado em cache mesmo que recente não esteja propagado |
| **Gemini API (transcrição)** | Stateless/CP | Request independente; falha ou responde |
| **ERP-externo (Cliente Varejo)** | Desconhecido | Rate limit sugere eventual consistency no backend deles |
| **Google OAuth** | AP | Token cached; pode haver delay de revogação |

**Implicação para o Meet Hub:** o fluxo `bot → job no Bull (Redis) → worker → Supabase` tem dois segmentos:
- Bull/Redis: AP — job pode ser reprocessado se Redis tiver lag (at-least-once delivery)
- Supabase: CP — escrita confirmada ou erro, nunca silenciosamente perdida

Isso é por design correto: usar idempotência no worker para lidar com o at-least-once do Redis, e confiar no CP do Supabase para durabilidade final.

---

### Além do CAP: PACELC

CAP só fala de comportamento durante partição. O modelo **PACELC** (Daniel Abadi, 2012) adiciona o trade-off durante operação normal:

```
Durante Partição (P): escolha entre Availability (A) e Consistency (C)
Else (E — operação normal): escolha entre Latency (L) e Consistency (C)
```

Exemplo: Dynamo é PA (durante partição) EL (durante operação normal — troca latência por consistência). Postgres é PC (durante partição, recusa) EC (durante operação normal — latência maior mas dado consistente).

PACELC explica por que Cassandra é mais rápido que Postgres para escritas mesmo sem partições: Cassandra não precisa garantir consistência imediata, então não precisa esperar quórum.

---

## Por que cai em entrevista

CAP é a pergunta de "teoria aplicada" mais frequente em entrevistas de pleno/sênior. Entrevistador quer saber se você entende que a escolha C vs A tem implicação no design do sistema — e se você sabe que "CA" não existe em distribuído.

Pergunta clássica: "O Postgres é CA ou CP?" — resposta errada comum: "É CA porque é consistente e disponível". Resposta correta: "É CP. Postgres garante consistência mesmo durante partição (ACID), o que significa que pode ficar indisponível para escritas durante failover. 'CA' não existe em sistemas distribuídos reais."

---

## Trade-offs

| Escolha | Quando faz sentido | Exemplo de uso |
|---|---|---|
| CP | Dados financeiros, inventário, qualquer coisa onde stale causa problema real | Banco, e-commerce estoque, reservas |
| AP | Dados onde stale por segundos é aceitável, disponibilidade é mais importante | DNS, session cache, feed de redes sociais |
| Consistência forte (CP) com read replicas | Escritas consistentes + leituras com lag tolerável | Dashboard analítico (pode ter 1min de stale) |
| Multi-region AP | Alta disponibilidade global, latência baixa, aceita eventual | CDN, configuração de feature flags |

Para a AG: Postgres como fonte de verdade (CP) + Redis para cache e filas (aceitar eventual) é o design correto.

---

## Exercício aplicado (projeto AG real)

```bash
# Classificar dependências externas da AG por modelo CAP

# 1. Listar todas as dependências externas nos projetos AG
for project in meet-hub PULSAR-RH cliente-oficina-backend; do
  echo "=== $project ==="
  cat ~/projetos/$project/.env.example 2>/dev/null | \
    grep -v "^#" | grep "=" | cut -d'=' -f1
  echo ""
done

# 2. Verificar se algum projeto tem múltiplos bancos (implica escolha CAP)
grep -rn "DATABASE_URL\|MONGO\|REDIS\|ELASTIC\|DYNAMO" \
  ~/projetos/*/. env.example 2>/dev/null | grep -v node_modules

# 3. Verificar se há tratamento de eventual consistency em algum projeto
# (ex: retry após escrita, delay antes de leitura, verificação de status)
grep -rn "retry\|setTimeout.*read\|await.*delay\|waitFor" \
  ~/projetos/meet-hub/apps/api/src/ --include="*.ts" | \
  grep -v "node_modules\|test" | head -10
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] classificação CAP dependências AG

**Dependências e modelos:**

| Dependência | Modelo | Implicação para o código |
|---|---|---|
| Supabase (Postgres) | CP | Escrita falha ou confirma — nunca silenciosamente perdida. Retry em erro. |
| Redis (Bull/cache) | AP (single node) | Job pode ser entregue mais de uma vez. Consumer deve ser idempotente. |
| Google Drive API | AP (com cache) | Arquivo pode demorar a aparecer após upload. Não assumir visibilidade imediata. |
| Gemini API | Stateless | Retry em timeout; sem estado compartilhado entre requests. |
| ERP-externo API | Desconhecido | Rate limit de 350/dia → fila com throttle necessário. |

**Decisão sobre consistência no Meet Hub:**
- Fonte de verdade: Supabase (CP) — durabilidade garantida
- Fila: Redis Bull (AP/at-least-once) — idempotência obrigatória no worker
- Cache: Redis (AP) — TTL como mecanismo de eventual consistency

**Janela de inconsistência aceitável por tipo de dado:**
- Dados de sessão/auth: zero tolerância → CP
- Dashboard analytics: 5 minutos → cache com TTL
- Status de jobs de transcrição: 10 segundos → polling ou websocket
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O Postgres é CA, CP ou AP?"
>
> **R (30s):**
> "'CA' não existe em sistemas distribuídos — com mais de um servidor, partições de rede são inevitáveis. Postgres é CP: durante operação normal, garante consistência via ACID. Durante uma partição de rede ou failover, o Postgres prefere ficar indisponível para escritas (returnar erro) a arriscar inconsistência. Quando o primary cai, há uma janela de indisponibilidade até a réplica ser promovida — é o sacrifício de A para manter C."

> **P:** "Quando você usaria Cassandra em vez de Postgres?"
>
> **R (30s):**
> "Cassandra quando: escrita é o gargalo (10x mais throughput que Postgres para writes), leituras são simples por chave primária (sem joins complexos), consistência eventual por alguns segundos é aceitável para o negócio, e você precisa de escala horizontal nativa. Para a AG hoje? Nunca — Postgres resolve tudo que temos com muito menos complexidade operacional. Cassandra faz sentido em escala de petabytes ou writes de 100k/s — não é o nosso problema."

---

## Checkpoint

- [ ] Consigo explicar o teorema CAP e por que "CA" não existe em sistemas distribuídos sem consultar
- [ ] Sei classificar Postgres, Redis e Cassandra no modelo CAP com justificativa
- [ ] Documentei as dependências externas da AG com seus modelos e implicações
- [ ] Entendo o que é consistência eventual com exemplo de janela de tempo real
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Eric Brewer — CAP Twelve Years Later](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) — o próprio criador revisitando o teorema
- [Daniel Abadi — PACELC](http://cs-www.cs.yale.edu/homes/dna/papers/abadi-pacelc.pdf) — extensão do CAP
- Martin Kleppmann — *Designing Data-Intensive Applications* (cap. 9 — Consistency and Consensus) — a referência
- [Jepsen](https://jepsen.io/) — testes de consistência em bancos de dados reais; mostra quais bancos violam as próprias garantias
