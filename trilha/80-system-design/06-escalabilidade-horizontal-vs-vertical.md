# 06 — Escalabilidade: Horizontal vs Vertical

## O que é

Quando sua aplicação não aguenta mais a carga, você tem dois caminhos:

**Vertical (scale-up):** trocar a máquina por uma maior — mais CPU, mais RAM, mais disco.
- $5/mês → $20/mês → $80/mês → $320/mês (DigitalOcean Droplets)
- Simples: sem mudança de código, sem nova infra
- Limite: existe um servidor mais potente no mundo, e você chegará lá

**Horizontal (scale-out):** adicionar mais máquinas pequenas em vez de uma grande.
- 1× $20 → 2× $20 → 4× $20
- Teóricamente sem limite de escala
- Complexo: precisa de stateless, LB, coordenação

---

### Quando vertical resolve (90% das vezes)

O erro mais comum é pular direto para escala horizontal por achar que é "mais correto" arquiteturalmente. Vertical resolve mais do que a maioria pensa:

```
DigitalOcean Droplet $20/mês (2 vCPU, 4GB RAM):
- Node.js Express: ~1.000–3.000 req/s com I/O bound
- PostgreSQL: ~500–2.000 queries/s para queries simples
- Redis: ~100.000 ops/s

Para a AG com 50 clientes ativos:
- Peak de 100 simultâneos × 5 requests/min = 500 requests/min = ~8 req/s
- Um droplet de $20 aguenta 100× esse tráfego com folga
```

**Regra de bolso para escala:** meça o bottleneck antes de escalar. Use `htop`, `iostat`, logs de query lenta. O problema é quase sempre:
1. Query sem índice (fix: adicionar índice — sem custo de infra)
2. N+1 queries (fix: incluir relação no Prisma — sem custo de infra)
3. Sem cache (fix: Redis — pequeno custo de infra)
4. CPU/RAM limitada (fix: vertical — custo proporcional)
5. Só depois disso: horizontal

---

### Stateful vs Stateless: o pré-requisito de horizontal

**Stateful:** instância armazena dados que outras não têm.
```
API stateful com sessão em memória:
- Usuário A faz login → sessão no Server 1
- Próxima request vai para Server 2 → sessão não existe → usuário precisa logar de novo

Com 2 instâncias, 50% das requests falham para usuários logados
→ Horizontal é impossível sem resolver o estado
```

**Stateless:** instância não armazena nada local.
```
API stateless com sessão em Redis:
- Usuário A faz login → sessão no Redis (compartilhado)
- Request vai para Server 1 → busca sessão do Redis → ok
- Request vai para Server 2 → busca sessão do Redis → ok

Com N instâncias, 100% das requests funcionam
→ Horizontal é trivial
```

**Inventário de estado comum e onde mover:**

| Estado | Onde hoje (ruim) | Onde deve estar |
|---|---|---|
| Sessão de auth | Memória da instância | Redis |
| Cache de query | Memória local | Redis |
| Arquivo de upload em processamento | Disco local | S3/Drive/volume compartilhado |
| Job queue state | Memória | Redis (Bull) |
| WebSocket connections | Processo local | Redis Pub/Sub (socket.io-adapter-redis) |

---

### Monolito modular escala mais do que parece

Existe um mito de que microsserviços são necessários para escalar. Não são.

**Monolito modular bem feito:**
```
[Monolito Express]
  ├── /auth (rotas de autenticação)
  ├── /recordings (rotas de gravação)
  ├── /transcriptions (rotas de transcrição)
  └── /reports (rotas de relatório)

Tudo no mesmo processo → mais simples → mesmos recursos de máquina
Quando precisar escalar: rodar 3 instâncias do mesmo processo → horizontal trivial
```

**Microsserviços antes da hora:**
```
[Auth Service] [Recording Service] [Transcription Service] [Report Service]
     ↓                ↓                     ↓                    ↓
  Redis          PostgreSQL (1)        PostgreSQL (2)         PostgreSQL (3)

Cada service: deploy separado, CI/CD separado, monitoring separado
Comunicação via HTTP ou message bus → latência de rede entre services
Debugging: rastrear request que passa por 4 services
```

Para a AG com time de 1 dev: microsserviços multiplicam a carga operacional por N sem benefício de escala (que o monolito também provê).

---

### Cálculo de capacity do Meet Hub

A memória `project_meet_hub_scale_plan.md` prevê 6 bots simultâneos no Hetzner.

**Consumo por bot (Puppeteer + Chrome):**
- RAM: ~200–400MB por instância Chrome com perfil
- CPU: ~0.5–1.0 vCPU durante captura de vídeo ativa; ~0.1 vCPU em standby
- Disco: Chrome profile ~50MB; gravações temporárias ~50MB/hora de reunião

**Cálculo para 6 bots simultâneos:**
```
RAM:
- 6 bots × 300MB = 1.8GB (Chrome)
- API Node.js: ~200MB
- Redis: ~100MB
- PostgreSQL: ~500MB
- SO + buffer: ~400MB
Total: ~3.0GB → precisar de máquina com 4GB+ RAM

CPU:
- 6 bots em standby: 6 × 0.1 = 0.6 vCPU
- Pico (todos capturando): 6 × 0.8 = 4.8 vCPU
- API: ~0.5 vCPU em carga normal
Total em pico: ~5.3 vCPU → precisar de 6+ vCPU

Comparação de instâncias Hetzner:
- CX21 (2 vCPU, 4GB): ~R$25/mês → 2 bots por instância (3 instâncias = R$75)
- CX31 (4 vCPU, 8GB): ~R$50/mês → 4 bots em uma; 2 em outra (2 instâncias = R$100)
- CX41 (8 vCPU, 16GB): ~R$100/mês → todos os 6 bots (1 instância = R$100)

Recomendação: CX41 (vertical) se fault tolerance não é crítico
              3× CX21 (horizontal) se quiser tolerância a falha
```

---

### Sharding (menção para entrevista)

Quando vertical não resolve mais e horizontal já foi esgotado: sharding.

```
Sharding: dividir o banco em partições horizontais

Exemplo: PULSAR-RH com 10.000 clientes
- Shard A: clientes com ID 1–3.333 → Postgres instance A
- Shard B: clientes com ID 3.334–6.666 → Postgres instance B
- Shard C: clientes com ID 6.667–10.000 → Postgres instance C

Query que precisa de dados de múltiplos shards: scatter-gather (complexo)
JOINs entre shards: impossíveis ou muito lentos
Re-sharding quando shards ficam desbalanceados: doloroso
```

Sharding é complexo o suficiente para ser pergunta de sênior/staff. Para a AG: anos de distância. Mas nomear o conceito em entrevista mostra que você pensa além.

---

## Por que cai em entrevista

"Como você escalaria esse sistema?" é a pergunta que fecha toda entrevista de system design. A maioria dos candidatos vai direto para horizontal. A resposta madura é: "Depende do bottleneck. Começaria medindo. 90% dos casos é vertical + cache + índice. Se ainda não basta, aí discutimos horizontal."

---

## Trade-offs

| Estratégia | Custo de infra | Custo de código | Fault tolerance | Escala máxima |
|---|---|---|---|---|
| Vertical | Linear ($ por mais RAM/CPU) | Zero | Baixa (single point of failure) | Limitada pelo hardware |
| Horizontal (stateless) | Linear ($ por instância) | Médio (tornar stateless) | Alta (N-1 instâncias continuam) | Teoricamente ilimitada |
| Sharding | Alto (N bancos) | Muito alto | Alta | Ilimitada |
| Microsserviços | Alto (N serviços) | Muito alto | Alta | Ilimitada |

---

## Exercício aplicado (projeto AG real)

```bash
# Calcular capacity do Meet Hub para 6 bots

# 1. Medir consumo atual de RAM do processo bot (se em produção)
ssh -i ~/.ssh/meet-hub root@46.101.174.29 \
  "ps aux --sort=-%mem | head -10"

# 2. Medir consumo de RAM total do servidor atual
ssh -i ~/.ssh/meet-hub root@46.101.174.29 "free -h"

# 3. Medir consumo de CPU por processo
ssh -i ~/.ssh/meet-hub root@46.101.174.29 \
  "ps aux --sort=-%cpu | head -10"

# 4. Ver qual droplet DO está sendo usado atualmente
ssh -i ~/.ssh/meet-hub root@46.101.174.29 \
  "nproc && free -h && df -h /"

# 5. Com os dados coletados, preencher a planilha de capacity:
#    RAM atual / utilização / headroom
#    CPU atual / utilização / headroom
#    Quando chegar ao limite e qual o próximo passo
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] capacity plan Meet Hub 6 bots

**Medições atuais (servidor DO $24/mês):**
- RAM: X GB total / Y GB usado / Z GB livre
- CPU: N cores / P% uso médio
- Instâncias de bot ativas: [N atual]

**Projeção para 6 bots:**
- RAM necessária: ~4GB (cálculo no módulo)
- CPU necessária: ~6 vCPUs em pico de captura
- Custo estimado Hetzner CX41: R$100/mês (vs R$~150 DigitalOcean equivalente)

**Decisão de scale strategy:**
[ ] Vertical: CX41 (8 vCPU, 16GB) — simples, sem mudança de código
[ ] Horizontal: 3× CX21 — tolerância a falha, precisa tornar stateless

**Pré-requisitos para horizontal:**
- API stateless: [verificado sim/não]
- Sessão em Redis: [verificado sim/não]
- Nginx como LB: [a configurar]
- Bots: NÃO são stateless (Chrome profile local) → bots ficam 1-por-servidor

**Recomendação:** vertical primeiro (CX41) → menos risco, sem mudança de código
                   horizontal quando CX41 não for suficiente
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você escalaria o Meet Hub para suportar 100 bots simultâneos?"
>
> **R (30s):**
> "Primeiro, mediria o bottleneck atual. Para bots Puppeteer, o gargalo é RAM: ~300MB por instância Chrome. Para 100 bots: ~30GB de RAM só para Chrome — não cabe em uma máquina razoável. Então, horizontal por sharding de bots: cada servidor físico roda N bots, com um orquestrador distribuindo reuniões entre eles. A API pode ser horizontal stateless atrás de um LB. O banco fica single instance por mais tempo — a leitura/escrita de metadados de reunião não é o bottleneck. A pergunta é: antes de tudo isso, quais os motivos de negócio para 100 bots simultâneos? Se for real, Kubernetes no Hetzner distribui os pods de bot automaticamente."

> **P:** "Por que monolito modular pode ser melhor que microsserviços para uma startup?"
>
> **R (30s):**
> "Microsserviços têm custo operacional alto: N deploys, N monitorings, N pontos de falha, latência de rede entre serviços, debugging cross-service. Para time de 1 a 3 devs, isso é overhead que consome mais tempo do que o problema de escala que você está tentando resolver. Monolito modular com separação clara de responsabilidades escala horizontalmente igual — você roda N instâncias do mesmo processo. A separação em microsserviços faz sentido quando diferentes partes do sistema têm requisitos de escala e deploy completamente diferentes, e quando o time é grande o suficiente para absorver o custo operacional."

---

## Checkpoint

- [ ] Consigo explicar quando vertical resolve sem precisar de horizontal com exemplos numéricos
- [ ] Sei o que torna um serviço stateless e como tornar stateful em stateless (Redis)
- [ ] Calculei o consumo de RAM e CPU para 6 bots simultâneos do Meet Hub
- [ ] Entendo por que monolito modular é preferível a microsserviços para a AG hoje
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Hetzner — Cloud pricing](https://www.hetzner.com/cloud) — tabela de instâncias e preços
- [DigitalOcean — Droplet sizing](https://www.digitalocean.com/pricing/droplets) — comparação
- Martin Fowler — [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) — argumento para começar com monolito
- [The Majestic Monolith](https://m.signalvnoise.com/the-majestic-monolith/) — DHH (Basecamp) sobre monolito em produção com milhões de usuários
