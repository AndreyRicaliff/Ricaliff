# 01 — As métricas que importam

## O que é

Antes de escalar qualquer coisa, você precisa de números. "Está lento" não é métrica — é sentimento. As três métricas que descrevem um sistema sob carga são **vazão (throughput)**, **latência (latency)** e **saturação (saturation)**. Sem elas, capacity planning é chute.

---

### Vazão (throughput) — quanto trabalho por segundo

Mede-se em requisições por segundo: **RPS** (requests per second) para HTTP, **QPS** (queries per second) para banco. É o eixo "quanto" do sistema.

```text
1.000 RPS = o serviço processa mil requisições a cada segundo
Se cada request leva 50ms e você tem 1 worker → ele aguenta 20 RPS (1000ms / 50ms)
Para 1.000 RPS com 50ms cada → precisa de ~50 workers em paralelo
```

A conta-chave que conecta vazão, latência e concorrência é a **Lei de Little**:

```text
concorrência = vazão × latência
L = λ × W

Ex: 1.000 RPS × 0,1s de latência média = 100 requisições "em voo" simultâneas
→ você precisa de pelo menos 100 slots de concorrência (threads/conexões) só pra não enfileirar
```

---

### Latência (latency) — quanto tempo cada operação leva

Tempo de uma operação, em ms. O erro de júnior é olhar a **média**. A média esconde o sofrimento.

```text
1000 requests: 990 levam 10ms, 10 levam 2000ms
média = (990×10 + 10×2000) / 1000 = 29,9ms  ← parece ótimo
mas 1% dos seus usuários esperou 2 segundos
```

Por isso se usa **percentis**:

```text
p50 (mediana) = metade das requests foi mais rápida que isso  → "o caso típico"
p95           = 95% foi mais rápida; 5% sofreu mais            → "cauda comum"
p99           = 99% foi mais rápida; 1% sofreu mais            → "pior caso real"
```

Num serviço com 1.000 RPS, **p99 = 1%** significa **10 requests/segundo ruins** — 600 usuários irritados por minuto. Não é "borda", é volume.

**Em entrevista:** "Por que p99 importa mais que a média? Porque a média é dominada pelo caso comum e esconde a cauda. Um usuário que faz 100 requests numa sessão quase certamente bate no p99 pelo menos uma vez — então o p99 é a experiência real, não a exceção. E latência composta: se uma página chama 10 serviços, a chance de TODOS responderem rápido é baixa; a página herda a cauda."

---

### Saturação (saturation) — quão cheio está o recurso

Quão perto do limite está o recurso mais escasso: CPU, memória, I/O de disco, conexões de banco, banda. Medido em % de utilização.

```text
CPU a 50%   → folga, tranquilo
CPU a 85%   → zona de alerta: latência começa a subir não-linearmente
CPU a 100%  → saturado: fila cresce, latência explode, timeouts em cascata
```

A nuance cruel: latência **não** sobe linear com a carga. Pela teoria de filas, perto de 100% de utilização a latência tende ao infinito. A 90% de uso o tempo de espera já é ~10x o de 50%. Por isso se planeja com **headroom** (folga) — nunca rodar de propósito acima de ~70-80% sustentado.

---

### A "regra dos números que todo dev devia saber"

Ordens de grandeza (latency numbers, popularizadas por Jeff Dean). Não decore os valores exatos — decore as **distâncias** entre eles:

```text
Referência de memória (RAM)              ~100 ns
Compressão 1KB                            ~3.000 ns   (3 µs)
Enviar 1KB por rede 1Gbps                ~10.000 ns   (10 µs)
Ler 1MB sequencial da RAM               ~50.000 ns   (50 µs)
Round-trip dentro do mesmo datacenter  ~500.000 ns   (0,5 ms)
Ler 1MB do SSD                       ~1.000.000 ns   (1 ms)
Seek de disco rotacional (HDD)      ~10.000.000 ns   (10 ms)
Round-trip Califórnia↔Holanda       ~150.000.000 ns  (150 ms)
```

O que isso ensina, em ordens de grandeza:

```text
RAM      → SSD     ≈ 10.000x mais lento
SSD      → HDD seek≈ 10x mais lento
mesmo DC → rede intercontinental ≈ 300x mais lento
```

Aplicação prática: se uma rota faz 1 query ao banco (~1-10ms) e você cacheia em RAM (~100ns + rede local ~0,5ms), o ganho é de ~10-20x. Se a rota faz uma chamada cross-region, **nada** que você otimize em CPU vai importar perto dos 150ms de rede — o gargalo é a física, não o código.

**Em entrevista:** "Antes de otimizar, eu identifico em que ordem de grandeza está o gargalo. Não adianta economizar microssegundos de CPU se a request gasta 150ms num round-trip de rede. Otimiza-se o termo dominante."

---

### Resumo

| Métrica | Pergunta que responde | Unidade |
|---|---|---|
| Vazão (throughput) | Quanto trabalho por segundo? | RPS / QPS |
| Latência (latency) | Quanto tempo cada operação leva? | ms (p50/p95/p99) |
| Saturação | Quão cheio está o recurso? | % de utilização |

Regra: meça antes de mexer. Sem baseline, qualquer "otimização" é fé.
