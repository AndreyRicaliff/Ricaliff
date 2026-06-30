# 07 — Saber que está aguentando

## O que é

Você dimensionou (módulo 02), escalou (03), cacheou (04), enfileirou (05) e ajustou o banco (06). Como você **sabe** que está aguentando — sem esperar o cliente reclamar? Duas disciplinas: **observabilidade** (enxergar o sistema rodando em produção) e **load testing** (provar a capacidade antes do pico real). Sem isso, escalar é dirigir no escuro.

---

### Os 3 pilares da observabilidade

```text
MÉTRICAS (metrics)  → números agregados ao longo do tempo
   "RPS, latência p99, uso de CPU, profundidade da fila, hit ratio do cache"
   barato de guardar, ótimo pra dashboards e alertas. Responde "QUANTO/QUANDO".

LOGS                → eventos discretos com contexto
   "2026-06-30 14:02 ERROR pagamento falhou order=123 motivo=timeout gateway"
   caro em volume, ótimo pra investigar UM caso. Responde "O QUE aconteceu aqui".

TRACES (rastros)    → o caminho de UMA request por todos os serviços
   "request X: API 5ms → auth 12ms → query banco 380ms ← gargalo → render 8ms"
   mostra ONDE o tempo foi gasto numa request distribuída. Responde "ONDE travou".
```

A regra mental: **métrica te avisa que algo está ruim, trace te diz onde, log te diz o porquê.** Os três juntos. Métrica sozinha vê o sintoma; sem trace e log você não acha a causa.

```text
Exemplo de uso encadeado:
1. Métrica: alerta "p99 da rota /relatorio subiu de 200ms pra 3s" → SEI que tem problema
2. Trace:   abre uma request lenta → 90% do tempo está numa query ao banco → SEI onde
3. Log:     a query loga "seq scan em orders, 8M linhas" → SEI por quê (faltou índice)
```

---

### SLI, SLO, SLA — o que cada um é

Três siglas que sempre confundem. A diferença é **medida → meta → contrato**.

```text
SLI (Service Level Indicator)  = a MÉTRICA que você mede
   ex.: "% de requests com latência < 300ms" ou "% de requests sem erro 5xx"
   é um número observado da realidade.

SLO (Service Level Objective)  = a META interna sobre o SLI
   ex.: "99,9% das requests abaixo de 300ms no mês"
   é o alvo que o time se compromete a manter. Define o que é "saudável".

SLA (Service Level Agreement)  = o CONTRATO com o cliente (+ penalidade)
   ex.: "garantimos 99,9% de uptime; se não, você ganha 10% de crédito"
   é jurídico/comercial. SLA é sempre mais frouxo que o SLO interno
   (você quer descobrir antes do cliente cobrar).
```

```text
Hierarquia:  SLI (mede)  →  SLO (meta interna)  →  SLA (promessa externa)
Folga típica: SLO 99,95% interno  >  SLA 99,9% no contrato
```

**Em entrevista:** "SLI é a métrica medida — tipo % de requests rápidas. SLO é a meta interna sobre essa métrica, ex. 99,9% abaixo de 300ms. SLA é o contrato com o cliente, com penalidade se quebrar. Mantenho o SLO mais apertado que o SLA pra ter margem antes de virar problema comercial."

### Error budget — o que o SLO compra

```text
SLO de 99,9% de uptime no mês = você PODE ficar fora ~43 minutos/mês
  (0,1% de 30 dias ≈ 43min). Esse é o "error budget" (orçamento de erro).
Sobrou budget → pode arriscar deploys/experimentos.
Estourou budget → congela features, foca em estabilidade.
```

99,9% ("três noves") ≈ 43min/mês de downtime. 99,99% ("quatro noves") ≈ 4min/mês. Cada nove a mais custa muito mais caro — não persiga noves sem necessidade de negócio.

---

### Alertas — ser avisado antes do cliente

Alerta é uma regra sobre uma métrica que dispara notificação. O segredo é alertar no **sintoma que o usuário sente**, não em todo ruído.

```text
BOM (sintoma, acionável):
  - p99 de latência > 1s por 5min
  - taxa de erro 5xx > 1%
  - profundidade da fila crescendo sem parar (backpressure, módulo 05)
  - utilização > 80% sustentada (vai estourar — age antes, módulo 01)

RUIM (ruído, fadiga de alerta):
  - "CPU em 75% por 1 minuto" (oscila, não importa sozinho)
  - alertar em métrica que não corresponde a dor do usuário
```

Alerta demais = **alert fatigue**: o time ignora tudo e perde o que importa. Alerte pouco e no que dói.

---

### Load testing — provar a capacidade antes do pico

**Load test** é gerar carga artificial pra descobrir, num ambiente controlado, em que ponto o sistema quebra — **antes** da Black Friday/lançamento descobrir por você.

```text
Tipos:
  Load test    → carga esperada sustentada. "Aguenta o pico previsto de 1.000 RPS?"
  Stress test  → empurra até quebrar. "Em quantos RPS ele cai? Como ele cai?"
  Spike test   → rajada súbita. "Aguenta 5x em 10s sem morrer?"
  Soak test    → carga moderada por horas. "Tem memory leak? degrada com o tempo?"
```

Exemplo com **k6** (script em JS, sobe a 200 usuários virtuais e mede):

```ts
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '1m', target: 200 },  // sobe pra 200 VUs em 1min
    { duration: '3m', target: 200 },  // sustenta 200 por 3min
    { duration: '1m', target: 0 },    // desce
  ],
  thresholds: {
    http_req_duration: ['p(99)<500'], // FALHA o teste se p99 passar de 500ms
    http_req_failed: ['rate<0.01'],   // FALHA se erro > 1%
  },
}

export default function () {
  const res = http.get('https://staging.exemplo.com/relatorio')
  check(res, { 'status 200': (r) => r.status === 200 })
  sleep(1)
}
```

Versão mínima com **ab** (Apache Bench), pra um teste rápido de um endpoint:

```text
ab -n 10000 -c 100 https://staging.exemplo.com/health
   -n 10000 → 10 mil requests no total
   -c 100   → 100 concorrentes
saída útil: requests/sec (vazão), e a tabela de percentis (p50/p95/p99)
```

Regra de ouro: **teste em staging parecido com produção, contra dados realistas, e olhe o p99 e a saturação — não a média.** Um load test que só mostra média esconde exatamente a cauda que vai te derrubar (módulo 01).

**Em entrevista:** "Antes de um pico previsto, eu rodo load test em staging com k6 simulando o RPS esperado e além, com thresholds em p99 e taxa de erro. O objetivo não é só ver 'passou' — é descobrir EM QUE ponto quebra e COMO quebra (degrada suave ou cai em cascata?), pra dimensionar headroom com base em número, não em fé."

---

### Resumo

| Ferramenta | Responde |
|---|---|
| Métricas | Quanto/quando? (RPS, p99, CPU, fila) — base de dashboard e alerta |
| Logs | O que aconteceu neste caso específico? |
| Traces | Onde o tempo foi gasto nesta request distribuída? |
| SLI/SLO/SLA | Medida / meta interna / contrato externo |
| Error budget | Quanto downtime o SLO permite — guia risco de deploy |
| Alertas | Avisa no sintoma do usuário, antes da reclamação |
| Load testing | Prova a capacidade e o modo de falha antes do pico real |
