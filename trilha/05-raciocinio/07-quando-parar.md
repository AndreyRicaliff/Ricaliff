# 07 — Quando Parar

## O que é

Saber parar é decisão de engenharia, não fraqueza. Três conceitos sustentam isso:

**1. Medir antes de otimizar.** A citação completa de Donald Knuth (1974): "devemos esquecer as pequenas eficiências, digamos 97% do tempo: otimização prematura é a raiz de todo mal" — e a parte que ninguém cita: "**não devemos abrir mão das nossas oportunidades nos 3% críticos**". A diferença entre os dois casos é medição. Otimizar sem perfil é chute com custo: você gasta dias no que não é gargalo e ainda complica o código.

**2. Good enough explícito.** Herbert Simon (Nobel de economia) chamou de **satisficing**: agentes racionais param no "bom o suficiente" porque o ótimo custa mais do que rende. Em engenharia isso vira regra operacional: **defina o critério de pronto ANTES de começar** ("FPS ≥ 50 na máquina alvo", "p95 < 300ms", "Lighthouse ≥ 90"). Critério atingido = parar. Sem critério prévio, "pronto" vira sensação — e sensação sempre acha que falta um pouco.

**3. Custo de oportunidade.** Cada hora polindo o que já passa do critério é uma hora roubada do próximo gargalo real. Júnior otimiza o que é divertido; sênior otimiza o que é gargalo — e a lista de gargalos vem de medição, não de gosto.

O nome honesto do excesso: **perfeccionismo é procrastinação com boa reputação**. Refatorar pela terceira vez, trocar de lib "pra ficar mais elegante", reescrever o que funciona — frequentemente é fuga do próximo passo desconfortável (publicar, mostrar ao cliente, receber crítica). E a régua de Pareto vale quase sempre: ~80% do valor sai dos primeiros ~20% do esforço; a última polida compra quase nada por quase tudo.

### Passo a passo: decidir se otimiza um deck 3D (caso real AG)

Deck de apresentação com cena 3D em CSS3D. Tentação: reescrever em three.js "porque é mais robusto". Decisão por medição:

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

Armadilha real do mesmo caso: a máquina de apresentação, acessada via RDP, forçava `prefers-reduced-motion` e congelava a animação — medir na MINHA máquina não era medir no alvo (módulo 06). O critério de pronto inclui **onde** ele é medido.

### Sinais de que é hora de parar

- O critério definido antes foi atingido e você está mexendo "só mais um pouco"
- Você está otimizando algo que nenhuma medição apontou
- Terceira reescrita do mesmo trecho sem requisito novo
- O medo de mostrar está se vestindo de "falta polir"

## Por que cai em entrevista

Pergunta de maturidade e gestão de tempo: empresas já perderam dinheiro demais com devs que douram pixel enquanto o backlog queima. "Como você prioriza?" e "quando algo está pronto?" testam se você tem critério externo à própria sensação — e se sabe defender uma parada.

> **P:** "Como você decide que uma solução está boa o suficiente?"
>
> **R (30s):** "Critério de pronto definido antes de começar, e medição contra ele — não sensação. Num deck com animação 3D, o critério era 50 FPS na máquina de apresentação; medi no DevTools, bateu, parei — mesmo com vontade de reescrever em three.js, porque acima do critério a reescrita compra zero valor e custa dias. Sigo o Knuth completo: 97% das otimizações são prematuras, mas os 3% críticos a medição revela. E aprendi a desconfiar de mim: refatorar pela terceira vez sem requisito novo não é qualidade, é procrastinação."

## Checkpoint

- [ ] Defini critério de pronto mensurável ANTES da última tarefa que comecei
- [ ] Sei citar o Knuth completo (os 97% E os 3% críticos)
- [ ] Medi (profiler / `curl -w` / EXPLAIN) antes da última otimização que fiz
- [ ] Parei um polimento em andamento porque o critério já tinha sido atingido
- [ ] Sei nomear um episódio meu de perfeccionismo-procrastinação e o custo dele

## Recursos

- Structured Programming with go to Statements — Donald Knuth (1974), fonte da citação completa
- [web.dev](https://web.dev/) — Core Web Vitals e ferramentas de medição de performance
- [React Profiler](https://react.dev/reference/react/Profiler) — medir re-render antes de memoizar
- The Pragmatic Programmer — Hunt & Thomas, capítulo "Good-Enough Software"
