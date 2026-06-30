# 03 — Escalar: vertical vs horizontal

## O que é

Quando a carga cresce além do que a infra atual aguenta, há dois caminhos. **Escala vertical (scale up):** colocar uma máquina maior — mais CPU, mais RAM. **Escala horizontal (scale out):** colocar mais máquinas e dividir a carga entre elas. Não são exclusivos; quase todo sistema real começa vertical e migra pra horizontal quando o vertical fica caro ou impossível.

---

### Vertical (scale up) — máquina maior

```text
Antes: 4 cores, 16 GB → aguenta ~400 RPS
Depois: 16 cores, 64 GB → aguenta ~1.600 RPS (na teoria)
```

**Vantagens:**
- Simples. Zero mudança de código. Trocar o tamanho da instância e reiniciar.
- Sem complexidade de rede, balanceamento ou estado distribuído.
- Banco de dados relacional adora vertical (transações ACID num nó só são fáceis).

**Limites (por que o vertical sempre acaba):**
```text
1. Teto físico: existe um tamanho máximo de máquina. Acabou, acabou.
2. Custo não-linear: a instância 2x maior custa ~3-4x, não 2x.
   Hardware "topo de linha" tem prêmio de preço.
3. Ponto único de falha (SPOF): uma máquina, um cair = sistema todo fora.
   Vertical não dá redundância — só potência.
4. Downtime no upgrade: trocar de máquina geralmente exige reiniciar.
```

**Em entrevista:** "Vertical é o primeiro passo certo — simples e barato até certo ponto. Mas tem teto físico, custo super-linear e é ponto único de falha. Quando o custo da próxima máquina maior fica absurdo ou a redundância vira requisito, migro pra horizontal."

---

### Horizontal (scale out) — mais máquinas

```text
1 servidor de 400 RPS não basta pra 1.200 RPS?
→ 3 servidores de 400 RPS + um load balancer na frente
→ adiciona o 4º quando precisar; escala "infinita" em teoria
```

**Vantagens:**
- Sem teto: cresce adicionando nós (limitado por banco/coordenação, não pela máquina).
- Redundância nativa: um nó cai, os outros absorvem — sem downtime.
- Custo linear: 10 máquinas comuns costumam custar menos que 1 supermáquina equivalente.

**Custo:**
- Precisa de **load balancer** (balanceador) na frente.
- Exige **statelessness** (sem estado local) — o pré-requisito crítico (abaixo).
- Complexidade: deploy, observabilidade e debug ficam distribuídos.

---

### Load balancer — o porteiro

O balanceador recebe todas as requisições e as distribui entre os nós saudáveis.

```text
            ┌──────────────┐
request →   │ Load Balancer│
            └──────┬───────┘
        ┌──────────┼──────────┐
     ┌──▼──┐    ┌──▼──┐    ┌──▼──┐
     │node1│    │node2│    │node3│   ← todos idênticos, intercambiáveis
     └─────┘    └─────┘    └─────┘
```

Algoritmos comuns: **round-robin** (reveza em ordem), **least connections** (manda pro nó menos ocupado). E **health check**: o LB pinga cada nó; se um para de responder, ele é tirado da rotação automaticamente. É isso que dá a redundância.

---

### Statelessness — o pré-requisito do horizontal

Horizontal só funciona se **qualquer nó pode atender qualquer request**. Se o nó guarda estado local (sessão de usuário na memória do processo), o LB pode mandar a 2ª request do usuário pra outro nó que não conhece a sessão → o usuário "desloga".

```text
ERRADO (stateful): sessão guardada na RAM do node1
  req1 do user → node1 (cria sessão na memória) ✓
  req2 do user → node2 (não tem a sessão) ✗ usuário deslogado

CERTO (stateless): sessão num store compartilhado (Redis) ou num JWT
  req1 → node1 → lê/grava sessão no Redis ✓
  req2 → node2 → lê a MESMA sessão no Redis ✓  qualquer nó serve
```

Regra: **tire o estado dos nós e ponha num store compartilhado** (Redis para sessão/cache, Postgres/S3 para dados, fila para trabalho). Nós viram descartáveis — pode matar, criar e escalar à vontade. Isso é base de container/Kubernetes.

---

### Sticky sessions — o remendo (e por que evitar)

**Sticky session** (afinidade de sessão) é configurar o LB pra sempre mandar o mesmo usuário pro mesmo nó, contornando o problema de estado local.

```text
Funciona? Sim, na marra.
Problemas:
- node cai → todos os usuários "presos" nele perdem a sessão
- balanceamento fica desigual (um nó pode ficar lotado de usuários ativos)
- impede escalar/reduzir nós suavemente
```

É um curativo. A solução correta é statelessness, não sticky.

**Em entrevista:** "Horizontal exige nós stateless: qualquer nó atende qualquer request. Isso significa tirar sessão e estado da memória do processo e pôr num store compartilhado, tipo Redis. Sticky session resolve no curto prazo mas reintroduz acoplamento e ponto de falha — prefiro stateless."

---

### Quando usar cada um

```text
Vertical primeiro: MVP, tráfego pequeno, banco relacional, simplicidade vale ouro
Horizontal quando: precisa de redundância (zero downtime),
                   passou o teto/custo do vertical,
                   ou tem tráfego variável (escalar pra cima e pra baixo)
Na prática: vertical no app + banco; horizontal nos workers/stateless services;
            banco escala diferente (read replicas, sharding — ver módulo 06)
```
