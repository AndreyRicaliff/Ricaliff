# 02 — Os 3 tipos de aprendizado

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Todo ML cai em uma de três famílias, e o que as separa é uma variável só: **que tipo de feedback** a máquina recebe enquanto aprende. Saber classificar um problema nessas três famílias é o primeiro filtro de qualquer projeto — ele decide que dado você precisa, que modelo cabe e quanto vai custar rotular.

---

## § BASE — o fundamento

A taxonomia canônica aparece consolidada em *Artificial Intelligence: A Modern Approach* (**Russell & Norvig**), o livro-texto de referência do campo. Ela se organiza pelo **sinal de aprendizado**: resposta certa dada (supervisionado), nenhuma resposta (não-supervisionado) ou recompensa esparsa por ação (reforço).

**1. Supervisionado — aprender com gabarito.** Você dá pares **entrada → resposta certa** (a *label*). O modelo prevê, compara com o gabarito, mede o erro por uma função de perda (módulo 04) e se corrige. Formalmente, é **estimar uma função** `f: X → Y` a partir de exemplos `(xᵢ, yᵢ)` — a base da *teoria estatística do aprendizado* de **Vladimir Vapnik** (*The Nature of Statistical Learning Theory*, 1995). Dois sabores pela natureza de `Y`:
- **Classificação:** `Y` é uma categoria discreta ("spam ou não?", "gato, cachorro ou pássaro?").
- **Regressão:** `Y` é um número contínuo ("quanto vale este imóvel?", "quantas vendas mês que vem?").

É de longe o tipo mais usado em produção. O **custo escondido** é o rótulo: alguém precisou marcar cada exemplo à mão — caro, lento, e frequentemente o gargalo real do projeto.

```text
Treino (com gabarito):
  [80m², 2 quartos, centro]  → R$ 450.000
  [120m², 3 quartos, bairro] → R$ 600.000
Depois (modelo prevê sem gabarito):
  [95m², 2 quartos, centro]  → R$ ?  (modelo responde ~R$ 510.000)
```

**2. Não-supervisionado — achar padrão sem gabarito.** Só os dados `X`, sem `Y`. O modelo procura **estrutura escondida**: agrupa o parecido (*clustering*), comprime muitas colunas em poucas (*redução de dimensionalidade*), ou aponta o que foge do padrão (*detecção de anomalia*). Ninguém disse o que é "certo" — a medida de sucesso é a própria estrutura encontrada. A conexão que importa para o resto da trilha: os **embeddings** que os LLMs usam (módulo 07) nascem de objetivos auto-supervisionados. **Mikolov et al. (2013)**, no word2vec, treinou vetores de palavra **sem rótulo humano** — a "tarefa" era prever a palavra pelo contexto, e o rótulo saía do próprio texto. Isso é *self-supervised learning*: o dado se rotula sozinho, e é o motor de treino dos LLMs modernos.

**3. Por reforço (RL) — aprender por tentativa e erro.** Não há gabarito nem dataset pronto. Um **agente** age num ambiente, recebe **recompensa** quando acerta e punição quando erra, e aprende a **política** (a estratégia de ações) que maximiza a recompensa acumulada ao longo do tempo. A referência canônica é **Sutton & Barto, *Reinforcement Learning: An Introduction*** (1998; 2ª ed. 2018). A dificuldade que define RL é o **credit assignment**: a recompensa vem **atrasada**. No xadrez, a jogada decisiva aconteceu 20 lances antes do xeque-mate — o agente precisa aprender que ações cedo levam a recompensa lá na frente. O marco público foi o **AlphaGo** (**Silver et al., 2016**, *Nature*), que venceu o campeão mundial de Go combinando RL com busca em árvore.

**A ponte RL → LLM que cai em entrevista.** O que transforma um LLM cru (que só prevê o próximo token) num assistente útil e educado é **RL a partir de feedback humano (RLHF)**. **Christiano et al. (2017)** mostraram que dá para treinar um agente a partir de **preferências humanas** (humano escolhe qual de duas saídas é melhor) em vez de uma recompensa programada. **Ouyang et al. (2022)**, no InstructGPT, aplicou isso a LLM: humanos ranqueiam respostas, um *reward model* aprende a nota, e o LLM é ajustado por RL para maximizá-la. A **Anthropic** propôs uma variante — **Constitutional AI** (**Bai et al., 2022**): em vez de só feedback humano para o quesito "inofensivo", o próprio modelo critica e revisa suas respostas segundo uma "constituição" de princípios, reduzindo a necessidade de rótulo humano para casos sensíveis. Ou seja: o alinhamento dos LLMs que você usa é, na sua última milha, um problema de RL.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O eixo organizador é o **sinal de aprendizado**, e ele decide tudo a jusante — que dado, que custo, que modelo:

```
                        SINAL DE APRENDIZADO
   ┌─────────────────┬─────────────────────┬──────────────────────┐
   │ SUPERVISIONADO  │ NÃO-SUPERVISIONADO  │ POR REFORÇO           │
   ├─────────────────┼─────────────────────┼──────────────────────┤
   │ (x, y) rotulado │ só x                │ recompensa por ação  │
   │ "qual a         │ "que estrutura      │ "que sequência       │
   │  resposta?"     │  existe aqui?"      │  maximiza o ganho?"  │
   │ preço, spam     │ segmentar clientes  │ Go, robô andar       │
   │ custo: rótulo   │ custo: interpretar  │ custo: ambiente +    │
   │ humano caro     │ os grupos achados   │ credit assignment    │
   └─────────────────┴─────────────────────┴──────────────────────┘
        │                     │                        │
   self-supervised (rótulo tirado do próprio dado) ── motor dos LLMs
                                                         │
                              RLHF (Ouyang 2022) alinha o LLM cru ◄── RL
```

Dependências práticas:
- **Supervisionado** é o mais direto de medir (tem gabarito → tem P), mas o mais caro de alimentar (rótulo humano).
- **Não-supervisionado** é barato em rótulo mas **ambíguo em avaliação**: sem `Y`, não há um "certo" objetivo — a qualidade do cluster é uma escolha de negócio.
- **Reforço** é o mais poderoso e o mais instável: precisa de um ambiente onde o agente possa errar barato (simulação), e a recompensa mal desenhada leva a *reward hacking* (o agente maximiza a nota sem resolver o problema).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Pergunte primeiro: eu tenho a resposta certa para cada exemplo?** Se sim → supervisionado. Se não, mas tenho dados → não-supervisionado. Se o problema é uma **sequência de decisões** com recompensa lá na frente → reforço. Esse é o galho inicial da árvore.

**2. Se supervisionado, decida classificação vs regressão pela natureza de `Y`.** Categoria → classificação; número contínuo → regressão. Isso já escolhe a família de modelo e a função de perda (módulo 04).

**3. Estime o custo do rótulo antes de prometer o projeto.** Em supervisionado, quem rotula os exemplos, quantos, a que custo? Esse número mata mais projetos de ML que o modelo.

**4. Em não-supervisionado, defina de antemão como você vai *interpretar* o resultado.** Achar 5 clusters é fácil; dizer o que cada um significa e por que o negócio deve agir sobre eles é o trabalho real.

**5. Em reforço, desenhe a recompensa com paranoia.** Pergunte: "que comportamento degenerado maximiza essa nota sem resolver meu problema?" — e feche essa brecha antes de treinar.

**Anti-padrões:**
- **Forçar supervisionado sem ter rótulo:** partir para classificação quando ninguém rotulou os dados. Ou você rotula (caro) ou muda de família.
- **Clustering sem critério de negócio:** rodar k-means, achar grupos e não ter o que fazer com eles. Estrutura sem decisão é enfeite.
- **Recompensa ingênua em RL (reward hacking):** premiar a métrica proxy em vez do objetivo real — o agente aprende a enganar a métrica. É o mesmo risco do RLHF mal calibrado num LLM.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Pegue três problemas reais do seu contexto (ex.: prever churn de um **Cliente Varejo**; agrupar clientes de uma **CLIENTE OFICINA** por perfil de compra; um bot que aprende a priorizar tickets):

1. Para cada um, responda: **tenho a resposta certa por exemplo?** Classifique em supervisionado / não-supervisionado / reforço.
2. Nos supervisionados, marque classificação vs regressão e **escreva quem rotularia** os exemplos e quantos.
3. No não-supervisionado, escreva **antes de rodar qualquer coisa** o que você faria com 4 clusters — a decisão de negócio que justifica o esforço.
4. Escreva uma frase ligando o RLHF ao que você usa: "o Claude/GPT é útil porque, além de prever o próximo token, foi alinhado por RL a partir de preferência humana (Ouyang 2022)".

## Por que cai em entrevista

Classificar um problema nas três famílias é a primeira coisa que um entrevistador testa — porque erra aí quem não vai saber escolher dado nem modelo. Amarrar RLHF na conversa mostra que você conectou o clássico ao que está em produção hoje.

> **P:** "Quais são os tipos de aprendizado de máquina? Dá um exemplo de cada."
>
> **R (30s):** "Supervisionado aprende com gabarito — entrada e resposta certa, tipo prever preço ou classificar spam. Não-supervisionado só recebe os dados e acha padrão sozinho, tipo agrupar clientes parecidos. Por reforço é tentativa e erro com recompensa, tipo treinar cachorro com petisco — é o que faz o AlphaGo, e o RLHF que alinha os LLMs."

> **P:** "Como o RLHF se encaixa nessas três famílias, e por que ele importa?"
>
> **R (30s):** "RLHF é aprendizado por reforço: o LLM é o agente, e a recompensa vem de humanos que ranqueiam respostas — um reward model aprende essa nota e o modelo é ajustado pra maximizá-la, é o que o InstructGPT do Ouyang mostrou em 2022. Importa porque o pré-treino só ensina a prever o próximo token; é o RLHF que transforma isso num assistente útil e seguro. A Anthropic fez uma variante, a Constitutional AI, onde o próprio modelo se critica por princípios em vez de depender só de rótulo humano. O risco de qualquer RL é o reward hacking: se a recompensa é mal desenhada, o agente maximiza a nota sem resolver o problema."

## Checkpoint

- [ ] Classifico um problema novo em supervisionado / não-supervisionado / reforço pelo sinal de aprendizado
- [ ] Distingo classificação de regressão pela natureza da label (categoria vs número)
- [ ] Sei que o custo do rótulo humano costuma ser o gargalo do supervisionado
- [ ] Entendo self-supervised (rótulo tirado do próprio dado) e que é o motor dos LLMs
- [ ] Sei explicar o credit assignment e por que ele torna o RL difícil
- [ ] Ligo RLHF (Ouyang 2022) e Constitutional AI (Bai 2022) ao alinhamento dos LLMs que uso

## Recursos

- *Artificial Intelligence: A Modern Approach* — Russell & Norvig: a taxonomia canônica dos tipos de aprendizado
- *Reinforcement Learning: An Introduction* — Sutton & Barto (2ª ed., 2018): a referência de RL, recompensa e credit assignment
- *Deep reinforcement learning from human preferences* — Christiano et al. (2017): aprender de preferências humanas
- *Training language models to follow instructions with human feedback* — Ouyang et al. (2022): o RLHF do InstructGPT
- *Constitutional AI: Harmlessness from AI Feedback* — Bai et al. (Anthropic, 2022): alinhamento com feedback do próprio modelo
- *Efficient Estimation of Word Representations in Vector Space* — Mikolov et al. (2013): self-supervision no word2vec
- Google *ML Crash Course* — "Linear Regression" (supervisionado) + introdução a clustering (não-supervisionado)
