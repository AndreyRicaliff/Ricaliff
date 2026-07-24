# 07 — Quando Parar

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Saber **parar** é decisão de engenharia, não fraqueza. É o passo 7 do loop do módulo 00 ("iterar ou parar") olhado de perto — e o mais contraintuitivo, porque toda a cultura de "capricho" empurra na direção oposta. A verdade incômoda: depois de certo ponto, cada hora a mais **destrói valor** — rouba tempo do próximo gargalo real e adiciona complexidade que vira bug. O nome honesto do excesso é duro: **perfeccionismo é procrastinação com boa reputação.** Este módulo dá o critério externo que substitui a sensação de "ainda falta um pouco" — porque a sensação, deixada solta, nunca diz que terminou.

---

## § BASE — o fundamento

**Satisficing: parar no "bom o suficiente" é racional.** Herbert Simon (Nobel de Economia, 1978) cunhou **satisficing** (satisfy + suffice) dentro da teoria da **racionalidade limitada**: agentes reais não *otimizam* (buscar o ótimo global), eles **satisfazem** — param no primeiro resultado que cruza um limiar de aceitação. E isso não é preguiça: é a **escolha racional** quando buscar o ótimo custa mais do que o ótimo rende. Em engenharia isso vira regra operacional dura: **defina o critério de pronto ANTES de começar** ("FPS ≥ 50 na máquina alvo", "p95 < 300ms", "Lighthouse ≥ 90"). Critério atingido = **parar**. Sem critério prévio, "pronto" vira sensação — e a sensação sempre acha que falta um pouco, porque ela não tem limiar, só direção.

**Medir antes de otimizar: o Knuth completo.** A citação mais mutilada da computação é de Donald Knuth (1974): quase todo mundo cita "**otimização prematura é a raiz de todo mal**" e para. A frase inteira é: "devemos esquecer as pequenas eficiências, digamos **97% do tempo**: otimização prematura é a raiz de todo mal. **Mas não devemos abrir mão das nossas oportunidades nos 3% críticos.**" Os dois lados importam. Otimizar **sem medir** é a raiz do mal porque você gasta dias no que *não* é gargalo e ainda complica o código; mas os 3% críticos **existem** e valem ouro — e a única forma de distinguir os 97% dos 3% é **medir**. Perfil primeiro, otimização depois. Sempre nessa ordem.

**Por que otimizar o não-gargalo não adianta: a lei de Amdahl.** Gene Amdahl formalizou o teto: o ganho total de acelerar uma parte é **limitado pela fração do tempo que aquela parte ocupa**. Se uma rotina consome 5% do tempo e você a deixa **infinitamente** rápida, o sistema fica no máximo ~5% mais rápido. É a prova matemática de por que "otimizar o que é divertido" é desperdício: o divertido raramente é o gargalo, e mexer fora do gargalo tem retorno tendendo a zero. A lista de gargalos vem de **medição**, não de gosto.

**Rendimentos decrescentes e custo de oportunidade.** A régua de **Pareto** vale quase sempre: ~80% do valor sai dos primeiros ~20% do esforço; a última polida compra quase nada por quase tudo. Some a isso o **custo de oportunidade** (módulo 03): cada hora polindo o que já passa do critério é uma hora **roubada** do próximo gargalo real, do próximo card, de mostrar ao cliente. Júnior otimiza o que é *divertido*; sênior otimiza o que é *gargalo* — e a diferença entre os dois, de novo, é medição. E há a **lei de Parkinson** ("o trabalho se expande para preencher o tempo disponível"): sem um critério que diga "acabou", o polimento consome todo o tempo que existir, indefinidamente.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A decisão de parar se organiza numa curva e num par de eixos:

```
valor
  │        ╭────────── critério de pronto (satisficing) ─── PARE AQUI
  │      ╭─╯
  │    ╭─╯   ← primeiros 20% do esforço entregam ~80% do valor (Pareto)
  │  ╭─╯
  │ ╭╯          além do critério: cada hora compra quase nada
  │╱             e custa o próximo gargalo (custo de oportunidade)
  └──────────────────────────────────────────────── esforço
```

- **Onde parar (satisficing):** no critério definido *antes*. Ele é a linha horizontal — objetiva, externa à tua sensação.
- **O que otimizar (Knuth + Amdahl):** só o que a **medição** apontou como gargalo. Fora do gargalo, o teto de ganho de Amdahl mata o retorno.
- **Por que parar (Pareto + custo de oportunidade):** a curva achata; o esforço marginal migra pro próximo problema que ainda está nos "primeiros 20%".

E há um eixo escondido no critério: **onde** ele é medido. Um critério "50 FPS" sem "**na máquina que vai apresentar**" é incompleto — medir na tua máquina não é medir no alvo (módulo 06). O critério de pronto tem duas metades: o **número** e o **alvo**.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. DEFINIR o critério de pronto ANTES** — mensurável e com alvo. "≥ 50 FPS na máquina de apresentação", não "rápido". O alvo faz parte do critério.

**2. MEDIR contra o critério** — profiler, `curl -w`, `EXPLAIN`, Lighthouse. Medir, não sentir.

**3. BATEU? PARAR.** Acima do critério, mais esforço compra ~zero valor (Pareto) e custa o próximo gargalo (custo de oportunidade). Registrar no `DECISIONS.md`: critério, medição, decisão de parar.

**4. NÃO BATEU? OTIMIZAR O QUE O PERFIL APONTOU** — a long task específica, o gargalo real (Amdahl: só o gargalo move o total). Depois **medir de novo e parar no critério** — não no "ficou lindo".

**Sinais de que é hora de parar:**
- O critério definido antes foi atingido e você está mexendo "só mais um pouco".
- Você está otimizando algo que **nenhuma medição** apontou.
- **Terceira reescrita** do mesmo trecho sem requisito novo.
- O medo de mostrar (publicar, mostrar ao cliente, receber crítica) está se vestindo de "falta polir".

**Anti-padrões:**
- **Otimizar sem medir:** os 97% do Knuth — dias no não-gargalo, código complicado, ganho nulo (Amdahl).
- **Critério por sensação:** "quando estiver bom" sem número. A sensação não tem limiar (Parkinson) — expande até o infinito.
- **Perfeccionismo como fuga:** reescrever o que funciona pra adiar o passo desconfortável. É procrastinação com reputação de qualidade.
- **Medir no alvo errado:** critério sem "onde" (módulo 06) — medir na tua máquina e apresentar noutra.

**Aplicado — decidir se otimiza um deck 3D (caso real AG):** deck de apresentação com cena 3D em CSS3D. Tentação: reescrever em three.js "porque é mais robusto". Decisão por medição:

```bash
# 1. Critério ANTES: ">= 50 FPS na máquina que vai apresentar, sem jank"
# 2. Medir: DevTools > Performance > gravar 10s da animação
#    Ler: FPS médio, tempo por frame, long tasks
# 3. Resultado >= critério → PAROU. three.js não entra: o custo (dias,
#    bundle, nova superfície de bug) compra zero valor acima do critério.
# 4. Resultado < critério → otimizar O QUE O PERFIL apontou (a long task
#    específica), medir de novo e parar no critério — não no "ficou lindo".
# 5. Registrar no DECISIONS.md: critério, medição, decisão de parar.
```

Armadilha real do mesmo caso: a máquina de apresentação, acessada via RDP, forçava `prefers-reduced-motion` e **congelava** a animação — medir na MINHA máquina não era medir no alvo (módulo 06). O critério de pronto inclui **onde** ele é medido; sem isso, o "50 FPS verificado" era no alvo errado.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Pegue algo que você está polindo ou está prestes a "melhorar":

1. Escreva o **critério de pronto** com **número + alvo** ("p95 < 300ms em prod", "≥ 50 FPS na máquina X"). Se você não consegue escrever o número, é isso que está faltando — não o polimento.
2. **Meça** contra o critério (profiler / `curl -w` / `EXPLAIN` / Lighthouse). Anote o número real.
3. **Bateu?** Pare agora e registre no `DECISIONS.md`: critério, medição, decisão de parar. Resista à vontade de "só mais um pouco".
4. **Não bateu?** Otimize **só o que o perfil apontou** — não o que é divertido. Meça de novo. Pare no critério.
5. Olhe a lista de sinais de parada acima e marque honestamente: quantos se aplicam ao que você ia fazer? (Um "sim" na terceira reescrita sem requisito novo já é a resposta.)

## Por que cai em entrevista

Pergunta de maturidade e gestão de tempo: empresas já perderam dinheiro demais com devs que douram pixel enquanto o backlog queima. "Como você prioriza?" e "quando algo está pronto?" testam se você tem **critério externo** à própria sensação — e se sabe **defender uma parada**. Dizer "parei porque bateu o critério, mesmo com vontade de continuar" mostra mais senioridade do que qualquer lista de otimizações que você fez.

> **P:** "Como você decide que uma solução está boa o suficiente?"
>
> **R (30s):** "Critério de pronto definido antes de começar, e medição contra ele — não sensação. Num deck com animação 3D, o critério era 50 FPS na máquina de apresentação; medi no DevTools, bateu, parei — mesmo com vontade de reescrever em three.js, porque acima do critério a reescrita compra zero valor e custa dias. Sigo o Knuth completo: 97% das otimizações são prematuras, mas os 3% críticos a medição revela. E aprendi a desconfiar de mim: refatorar pela terceira vez sem requisito novo não é qualidade, é procrastinação."

> **P:** "Você tem uma semana. Onde investe o tempo de otimização?"
>
> **R (30s):** "Primeiro meço — profiler, EXPLAIN, o que o caso pedir — porque a lei de Amdahl diz que o ganho é limitado pela fração de tempo que a parte ocupa: acelerar algo que consome 5% do tempo dá no máximo 5% de ganho, por mais que eu capriche. Então eu ataco o gargalo que a medição aponta, não o que é divertido de mexer, e paro quando o critério bate. Otimizar sem medir é gastar a semana no lugar errado com código mais complexo e ganho nulo — é literalmente a raiz do mal do Knuth. Prioridade de otimização é uma decisão de dado, não de gosto."

## Checkpoint

- [ ] Sei explicar satisficing (Simon) e por que parar no "bom o suficiente" é racional
- [ ] Defini critério de pronto mensurável (número + alvo) ANTES da última tarefa
- [ ] Sei citar o Knuth completo (os 97% E os 3% críticos) e o teto de Amdahl
- [ ] Medi (profiler / `curl -w` / `EXPLAIN`) antes da última otimização que fiz
- [ ] Parei um polimento em andamento porque o critério já tinha sido atingido
- [ ] Sei nomear um episódio meu de perfeccionismo-procrastinação e o custo dele

## Recursos

- Donald Knuth — *Structured Programming with go to Statements* (1974): a citação completa (os 97% **e** os 3% críticos)
- Herbert Simon — *Models of Bounded Rationality* / *Administrative Behavior*: satisficing e racionalidade limitada
- Gene Amdahl — *"Validity of the Single Processor Approach…"* (1967): a lei de Amdahl (o teto do ganho pela fração otimizada)
- *The Pragmatic Programmer* — Hunt & Thomas: capítulo "Good-Enough Software"
- Módulo-irmão `06-verificar-o-alvo-certo` — o critério de pronto precisa medir no alvo certo (o caso RDP)
