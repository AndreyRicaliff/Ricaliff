# 05 — Load Balancing

## O que é

**Load balancer** distribui requests entre múltiplas instâncias de um serviço. Sem ele, você pode escalar para 10 servidores mas todos os usuários continuarão batendo no mesmo. O load balancer é o ponto de entrada único que decide qual instância recebe cada request.

Para a AG hoje: Vercel faz isso automaticamente para o frontend. DigitalOcean faz para infraestrutura gerenciada. Meet Hub em produção com uma instância não precisa de LB. Este módulo prepara o vocabulário para quando escalar os bots para 6 instâncias.

---

### L4 vs L7: os dois níveis

**L4 (Layer 4 — Transport):**
```
Opera no TCP/UDP — vê endereço IP e porta, não o conteúdo da request
Mais rápido (menos processamento)
Não entende HTTP, paths, headers, cookies
Use quando: latência ultra-baixa, TCP genérico, UDP

Exemplo:
Cliente → TCP:443 → LB → Server A (TCP encaminhado)
LB não sabe se é HTTP, gRPC, WebSocket — só distribui fluxo TCP
```

**L7 (Layer 7 — Application):**
```
Opera no HTTP — vê método, path, headers, body, cookies
Mais inteligente (e um pouco mais lento — tem que parsear HTTP)
Pode rotear por path, versão, tenant

Exemplo:
GET /api/recordings → Server A
GET /api/transcriptions → Server B
WebSocket /ws → Server C (sticky)

Nginx, HAProxy em modo HTTP, AWS ALB, Caddy são L7
```

Para a AG (aplicações HTTP/WebSocket): L7 é o correto.

---

### Algoritmos de distribuição

**Round-robin:**
```
Request 1 → Server A
Request 2 → Server B
Request 3 → Server C
Request 4 → Server A
...

Vantagem: simples, distribuição igual
Custo: não considera carga real — Server A pode estar processando job pesado
```

**Least Connections:**
```
Server A: 10 conexões ativas
Server B: 3 conexões ativas
Server C: 7 conexões ativas

Próxima request → Server B (menor carga)

Vantagem: distribui pela carga real, não por contagem de requests
Use quando: requests têm duração variável (transcrições do Meet Hub: 10s vs 3min)
```

**IP-Hash (Sticky por IP):**
```
hash(client_ip) → sempre o mesmo server

Client A (IP: 1.2.3.4) → sempre Server B
Client B (IP: 5.6.7.8) → sempre Server C

Vantagem: mesmo cliente sempre vai para o mesmo server (útil para sessão local)
Custo: se Server B cair, Client A perde sessão; distribuição irregular se poucos IPs
```

**Weighted:**
```
Server A (4 cores): peso 4
Server B (2 cores): peso 2
Server C (1 core): peso 1

Para 7 requests: A recebe 4, B recebe 2, C recebe 1

Use quando: instâncias têm capacidades diferentes
```

---

### Sticky Sessions: necessário?

Sticky session = garantir que o mesmo usuário sempre vai para o mesmo servidor. Necessário quando estado local é armazenado na instância (memória, arquivo temporário).

```
Problema:
- Usuário faz login → estado de sessão armazenado em memória do Server A
- Próxima request cai no Server B → não encontra sessão → usuário deslogado

Soluções (em ordem de preferência):
1. Stateless: sessão em Redis compartilhado → qualquer server atende → sticky desnecessário
2. Sticky por cookie (load balancer injeta cookie com ID do server)
3. Sticky por IP-hash → instável se usuário mudar IP

Para a AG: usar Redis para sessão → stateless → sem necessidade de sticky
```

**Regra AG:** toda instância da API deve ser stateless. Se precisar de estado entre requests, vai para Redis (sessão, locks, cache).

---

### Health Check

Load balancer precisa saber quais servidores estão saudáveis:

```
LB → HTTP GET /health → Server A
                             ↓
                         200 OK {"status":"ok"} → saudável, recebe tráfego
                         500 ou timeout → removido do pool temporariamente

Configuração típica:
- Intervalo: 10s
- Timeout: 2s
- Unhealthy threshold: 3 falhas consecutivas → remove do pool
- Healthy threshold: 2 sucessos consecutivos → volta ao pool
```

```ts
// Endpoint de health check em Express:
app.get('/health', async (req, res) => {
  try {
    // Verificar que o banco responde
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', timestamp: new Date() })
  } catch {
    res.status(503).json({ status: 'unhealthy', error: 'database unreachable' })
  }
})
```

---

### Por que Vercel/DO fazem isso por você

Vercel Edge Network:
- CDN em 30+ regiões → request roteada para o edge mais próximo
- Serverless functions escalam automaticamente
- Você não configura nada — é transparente

DigitalOcean App Platform / Managed Kubernetes:
- Load balancer incluído no plano
- Health check automático
- Escalamento por CPU/memória

Para serviços self-hosted (Meet Hub no DigitalOcean Droplet): sem LB por enquanto — uma instância. Quando escalar para 6 bots, precisará de Nginx como LB:

```nginx
# nginx.conf para Meet Hub com múltiplos workers:
upstream meet_hub_api {
    least_conn;  # algoritmo: menor número de conexões ativas

    server api-1:3000 max_fails=3 fail_timeout=30s;
    server api-2:3000 max_fails=3 fail_timeout=30s;
    server api-3:3000 max_fails=3 fail_timeout=30s;
}

server {
    listen 443 ssl;
    server_name meet.agconsultorialtda.com;

    location / {
        proxy_pass http://meet_hub_api;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /health {
        access_log off;  # não poluir logs com health checks
        proxy_pass http://meet_hub_api;
    }
}
```

---

### Desenhando LB para Meet Hub com 6 bots

O plano de escala (memória `project_meet_hub_scale_plan.md`) prevê 6 bots simultâneos. Arquitetura:

```
[Bot 1] [Bot 2] [Bot 3] [Bot 4] [Bot 5] [Bot 6]
           ↓ POST /api/recordings
     [Nginx LB — L7, least_conn]
           ↓
  [API 1]  [API 2]  [API 3]    ← stateless, 3 instâncias
           ↓ INSERT job
         [Redis]               ← compartilhado, fonte de estado
           ↓
  [Worker 1] [Worker 2]        ← consomem fila, concorrência controlada
           ↓
       [Postgres]              ← single instance (para essa escala)
```

Bots são stateful por design (Puppeteer + Chrome profile) — não fazem parte do LB. A API é stateless → LB funciona. Workers consomem de Redis compartilhado → distribuição natural.

---

## Por que cai em entrevista

"Projete um sistema para N usuários" — sempre inclui load balancer. Entrevistadores querem saber: você sabe a diferença entre L4 e L7? Você sabe quando sticky session é necessário? Você sabe configurar health check?

Números de referência:
- Nginx: suporta ~10.000 conexões simultâneas por worker (config default)
- Nginx com `worker_processes auto`: usa todos os cores da CPU
- Um node Express com I/O bound (queries de banco): ~1.000–5.000 req/s por core
- Round-trip do LB: <1ms em rede local

---

## Trade-offs

| Algoritmo | Melhor para | Pior para |
|---|---|---|
| Round-robin | Requests de duração similar | Requests com duração muito variável |
| Least connections | Requests de duração variável | Muitas conexões curtas (overhead de contagem) |
| IP-hash | Sessão local sem Redis | Distribuição irregular, instabilidade em falha |
| Weighted | Servidores com capacidades diferentes | Quando capacidades mudam dinamicamente |

| Tipo LB | Melhor para | Overhead |
|---|---|---|
| L4 | TCP genérico, máxima performance | Muito baixo |
| L7 | HTTP routing inteligente, health check rico | Baixo (ms) |

---

## Exercício aplicado (projeto AG real)

```bash
# Desenhar LB para Meet Hub com 6 bots

# 1. Verificar configuração atual do Nginx no servidor do Meet Hub
ssh -i ~/.ssh/meet-hub root@46.101.174.29 \
  "cat /etc/nginx/nginx.conf 2>/dev/null || cat /etc/nginx/sites-enabled/default 2>/dev/null"

# 2. Verificar se a API do Meet Hub é stateless (não armazena estado em memória)
cd ~/projetos/meet-hub
grep -rn "global\.\|process\.\|Map\(\|Set\(\|cache\s*=\s*{" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules\|//\|test" | head -10

# 3. Verificar onde a sessão de auth está armazenada
grep -rn "express-session\|cookie-session\|jwt.*secret" \
  apps/api/src/ --include="*.ts" --include="*.json" | grep -v "node_modules"

# 4. Verificar se há endpoint /health
grep -rn "'/health'\|\"/health\"\|/ping\|healthcheck" \
  apps/api/src/ --include="*.ts" | grep -v "node_modules"
```

```markdown
## DECISIONS.md — 2026-06-XX — [arch] LB design para escala Meet Hub 6 bots

**Estado atual:** single API instance, sem LB

**Pré-requisitos antes de adicionar LB:**
1. API deve ser stateless → verificar: [resultado do grep acima]
2. Sessão deve estar em Redis → [resultado do grep]
3. Endpoint /health deve existir → [resultado do grep]

**Algoritmo escolhido:** least_conn
**Justificativa:** jobs de transcrição têm duração muito variável (30s a 5min);
round-robin enviaria novos jobs para workers já sobrecarregados.

**Configuração Nginx planejada:**
[colar nginx.conf do módulo acima com os IPs reais]

**Quando implementar:** quando Meet Hub escalar de 1 para ≥2 instâncias de API
**Estimativa de custo no Hetzner:**
- 3 × CX21 (2 CPU, 4GB RAM): ~R$75/mês total
- vs 1 × CX51 (8 CPU, 16GB RAM): ~R$85/mês
- Horizontal win: 3 instâncias menores = melhor fault tolerance pelo mesmo preço
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual algoritmo de load balancing você usaria para processar transcrições de vídeo? Por quê?"
>
> **R (30s):**
> "Least connections. Transcrições duram de 30 segundos a 5 minutos dependendo da duração da reunião. Com round-robin, um worker que pegou 3 transcrições longas ficaria sobrecarregado enquanto outro ficaria ocioso. Least connections olha para quantas conexões cada worker tem abertas e rota para o menos ocupado — distribui pela carga real. Round-robin funciona bem quando as requests têm duração similar, que não é o caso aqui."

> **P:** "Quando sticky session é necessária? Como você evita precisar dela?"
>
> **R (30s):**
> "Sticky session é necessária quando a instância guarda estado local que outras instâncias não têm — sessão em memória, arquivo temporário. Evita-se tornando o serviço stateless: estado vai para um armazenamento compartilhado como Redis. Sessão de auth em Redis — qualquer instância autentica o usuário. Cache em Redis — qualquer instância serve o cache. Se o serviço é stateless, o LB pode rotear para qualquer instância sem problema."

---

## Checkpoint

- [ ] Sei a diferença entre L4 e L7 load balancing e quando usar cada um
- [ ] Consigo explicar os 4 algoritmos de distribuição e quando cada um é melhor
- [ ] Desenhei a arquitetura de LB para Meet Hub com 6 bots com justificativa
- [ ] Sei implementar endpoint `/health` que verifica banco e retorna status adequado
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Nginx — upstream module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html) — documentação de configuração de upstream
- [HAProxy — algorithms](https://www.haproxy.com/blog/loadbalancing-faq/) — comparação de algoritmos
- [AWS — What is a load balancer?](https://aws.amazon.com/what-is/load-balancing/) — visão geral com diagramas
- [Caddy](https://caddyserver.com/) — LB com HTTPS automático, bom para a AG quando escalar
