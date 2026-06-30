# 02 — Capacity planning e projeção

## O que é

**Capacity planning** é responder, com números aproximados, três perguntas: (1) quanta carga meu sistema vai receber? (2) quanta carga ele aguenta hoje? (3) quando vai estourar? Não precisa de precisão de engenheiro civil — precisa da ordem de grandeza certa. A técnica se chama **back-of-the-envelope** (conta de guardanapo): rápida, aproximada, suficiente pra decidir.

---

### A conta base: usuários → QPS no pico

O erro de júnior é dividir usuários/dia por 86.400s e parar aí. O tráfego real **não é uniforme** — ele concentra no horário de pico.

```text
Premissa: 1.000.000 usuários ativos/dia, cada um faz ~20 ações/dia
Total de ações/dia = 1M × 20 = 20.000.000 requests/dia

Média ingênua:
  20.000.000 / 86.400s ≈ 230 RPS   ← ERRADO usar isso pra dimensionar

Realidade — fator de pico:
  o tráfego não é plano. Regra prática: o pico vale 2x a 5x a média.
  (ex.: a maioria acessa entre 9h-22h, e concentra em ~4h de pico)
  pico ≈ 230 × 4 ≈ ~920 RPS   ← dimensione PARA o pico
```

Regra de bolso para derivar o pico sem chutar: estime que ~80% do tráfego cai em ~20% do dia (Pareto).

```text
80% de 20M ações = 16M requests em ~4,8h (20% de 24h = 17.280s)
pico ≈ 16.000.000 / 17.280 ≈ ~925 RPS

Confirma a ordem de grandeza: ~1.000 RPS no pico, não 230.
```

**Sempre dimensione para o pico, com folga.** Um sistema que só aguenta a média cai todo dia às 14h.

---

### Da QPS para "quantos servidores preciso"

Agora você tem a demanda (~1.000 RPS no pico). Precisa da capacidade de um servidor.

```text
Medido (ou estimado): cada request consome ~50ms de CPU
1 core ocupado 100% do tempo → 1.000ms / 50ms = 20 RPS por core
Um servidor de 8 cores → ~160 RPS por máquina (teórico, 100% uso)

Mas você NÃO roda a 100%. Aplica headroom (alvo ~70%):
  160 × 0,70 ≈ 112 RPS úteis por servidor

Servidores necessários = 1.000 RPS / 112 ≈ 9 servidores
+ folga pra falha (se 1 cai, os outros aguentam) → provisione ~11
```

Esse "+1 ou +2 pra falha" é o princípio **N+1 / N+2**: dimensione pra aguentar a carga mesmo com uma ou duas máquinas fora.

---

### Estimar storage e banda (mesma lógica)

```text
Cada ação grava ~2KB no banco:
  20M ações/dia × 2KB = 40 GB/dia
  × 365 ≈ 14,6 TB/ano   ← decide se cabe num Postgres ou precisa particionar

Banda de saída, resposta média de 10KB:
  1.000 RPS × 10KB = 10 MB/s = 80 Mbps no pico   ← cabe num link de 1Gbps fácil
```

---

### Headroom e "quando vai estourar"

**Headroom** é a folga entre a carga atual e a capacidade máxima. Você acompanha a utilização ao longo do tempo e **projeta** a linha pra frente.

```text
Hoje: pico de 600 RPS, capacidade ~1.100 RPS → utilização ~55%, headroom 45%
Crescimento medido: +8% de usuários/mês (composto)

Projeção (regra do 72 pra dobrar): 72 / 8 ≈ 9 meses pra dobrar a carga
600 RPS dobra → 1.200 RPS em ~9 meses → ESTOURA a capacidade de 1.100

Gatilho de ação: provisionar mais capacidade quando passar de ~75% de uso,
não quando bater 100% (latência já degrada bem antes do limite).
```

Esse é o coração da **projeção**: não esperar o incidente. Você sabe, com a tendência atual, a data aproximada em que a infra atual deixa de aguentar — e age antes.

**Em entrevista:** "Capacity planning não é prever o futuro com precisão, é ter a ordem de grandeza certa e a folga pra reagir. Dimensiono pro pico (2-5x a média), nunca pra média, deixo headroom de ~25-30%, e projeto a tendência de crescimento pra saber quando a capacidade atual estoura — com semanas de antecedência, não no dia do incidente."

---

### Checklist de uma estimativa de guardanapo

```text
1. Usuários × ações/usuário/dia        → total de requests/dia
2. Aplique fator de pico (2-5x)        → RPS de pico  (dimensione AQUI)
3. Custo por request (CPU/ms)          → RPS por servidor
4. RPS pico / RPS por servidor + N+1   → nº de servidores
5. Bytes por request                   → storage/dia e banda no pico
6. Taxa de crescimento                 → quando a capacidade estoura (projeção)
```

Todos os números acima são **estimativas** ilustrativas — o método é o que vale. Numa entrevista, declare as premissas em voz alta ("assumo 20 ações/usuário, pico de 4x") e siga a conta; o entrevistador quer ver o raciocínio, não a resposta exata.
