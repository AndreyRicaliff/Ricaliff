# 04 — Como um modelo "aprende"

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

"Aprender", em ML, tem um significado mecânico e nada místico: é **ajustar números até errar menos.** Esses números são os **pesos (weights)** — os botões internos que decidem quanto cada feature conta. Prever preço de imóvel, no fundo, é uma soma ponderada:

```text
preço ≈ (peso_metragem × metragem) + (peso_quartos × quartos) + (peso_bairro × bairro) + viés
```

Treinar é descobrir os valores de `peso_metragem`, `peso_quartos` etc. que fazem a previsão bater com a realidade. No começo são aleatórios — o modelo chuta lixo. Este módulo abre a caixa-preta desse ajuste: o que é a "nota de erro", como o algoritmo sabe pra que lado mexer cada botão, e por que isso é a mesma engrenagem em **todo** ML, do XGBoost ao GPT.

---

## § BASE — o fundamento

**Aprender = otimizar uma função de perda.** Todo treino supervisionado é um problema de **otimização**: existe uma função — a **perda (loss)** — que mede, com um número só, o quão errado o modelo está, e o objetivo é achar os pesos que a **minimizam**. Para regressão, a perda canônica é o **erro quadrático médio (MSE)**: para cada exemplo, pega a diferença entre previsto e real, **eleva ao quadrado** (para punir erro grande e ignorar o sinal ±) e tira a média. Em palavras: *"em média, o quanto chutei longe do certo, com erro grande pesando muito mais."* Perda alta = muito errado; perda zero = perfeito. A escolha da perda **define o que "bom" significa** — trocar MSE por erro absoluto muda como o modelo trata *outliers*. A perda não é detalhe técnico; é a codificação matemática do seu objetivo.

**Gradient descent: a ideia matemática, e sua idade.** Como achar o mínimo de uma função de milhões de variáveis sem testar todas as combinações? A resposta é antiga: **descida do gradiente**, cujo método geral **Augustin-Louis Cauchy** publicou em **1847**. A analogia é exata: você está numa montanha, no **escuro total**, e quer chegar ao vale (perda mínima). Não vê o mapa, mas sente **a inclinação sob os pés** — para que lado o chão desce mais. Dá um passo ladeira abaixo, sente de novo, repete milhares de vezes até o chão ficar plano.

```text
perda
  │ \                        a cada passo:
  │  \  ●  ← você aqui       1. mede a inclinação (gradiente)
  │   \  \                   2. dá um passo ladeira abaixo
  │    \  ●                  3. repete
  │     \__●__               ← vale = perda mínima = pesos bons
  │__________________ valor do peso →
```

A **inclinação** é o **gradiente**: a derivada que diz, para cada peso, *"aumentar este peso faz a perda subir ou descer, e quão rápido?"*. O modelo usa o gradiente para ajustar **todos os pesos de uma vez**, cada um no sentido que reduz o erro. A regra de atualização é literalmente uma linha: `peso ← peso − learning_rate × gradiente`.

**O gradiente estocástico (SGD): por que treinar em lotes.** Calcular o gradiente sobre o dataset inteiro a cada passo é caro. **Robbins & Monro (1951)**, em *"A Stochastic Approximation Method"*, fundaram a ideia de estimar o gradiente com uma **amostra** (um lote pequeno) em vez do todo — o **stochastic gradient descent**. É mais barato e, surpreendentemente, o ruído do lote **ajuda** a escapar de mínimos rasos. Por isso o treino roda em **batches**, não com o dataset inteiro de uma vez.

**Backpropagation: como se calcula o gradiente numa rede.** Numa soma ponderada simples, a derivada é direta. Numa rede com muitas camadas (módulo 06), calcular o gradiente de **cada peso** parece impossível — mas não é. **Rumelhart, Hinton & Williams (1986)**, em *"Learning Representations by Back-Propagating Errors"* (*Nature*), popularizaram o **backpropagation**: aplicar a **regra da cadeia** do cálculo de trás para frente, propagando o erro da saída de volta até a entrada, camada por camada, dizendo a cada peso o quanto ele contribuiu para o erro. É computacionalmente eficiente — um único passe pra frente e um pra trás dão **todos** os gradientes. Esse paper é o marco que tornou treinar redes profundas viável; sem ele, o deep learning do módulo 06 não existiria. (Backprop **calcula** o gradiente; gradient descent **usa** o gradiente pra andar. São peças distintas que se encaixam.)

**Learning rate: o hiperparâmetro que mais importa.** O **learning rate (taxa de aprendizado)** é o tamanho de cada passo ladeira abaixo:
- **Grande demais:** pula por cima do vale, salta de um lado pro outro e nunca assenta (ou a perda explode).
- **Pequeno demais:** chega, mas devagar — treino caro, e pode empacar num buraco raso.

```text
passo grande:   ●→    ←●    →●   (saltita, nunca converge)
passo pequeno:  ●·····→·····→    (chega, mas leva uma eternidade)
passo bom:      ●··→··→·→·●      (desce suave até o fundo)
```

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As quatro peças e como se encaixam num único laço:

```text
   PESOS (aleatórios) ──1.forward──► PREVISÃO
                                        │
                              2. LOSS (mede o erro vs label)
                                        │
                          3. BACKPROP (regra da cadeia → gradiente de cada peso)
                                        │
                    4. UPDATE: peso ← peso − learning_rate × gradiente
                                        │
                          └──────── repete (próximo lote / época) ───────┘
```

Dependências e vocabulário que se aninham:
```
   ÉPOCA (epoch) = 1 passada por TODO o dataset
     └── dividida em LOTES (batches) — SGD (Robbins & Monro)
           └── cada lote = 1 update de pesos (gradient descent, Cauchy)
                 └── gradiente calculado por BACKPROP (Rumelhart 1986)
                       └── sobre a LOSS que você escolheu (define "bom")
```

O que é hiperparâmetro (você escolhe) vs parâmetro (o modelo aprende):
- **Parâmetros:** os pesos e o viés — ajustados pelo treino.
- **Hiperparâmetros:** learning rate, nº de épocas, tamanho do lote, arquitetura — escolhidos por você e afinados na **validação** (módulo 03), nunca no teste.

---

## § METODOLOGIA — o passo-a-passo replicável

O laço de treino, que é a essência de **todo** ML supervisionado:

```python
# pseudo-código do laço de treino
for epoch in range(num_epocas):          # repete o dataset inteiro N vezes
    for lote in dataset_treino:          # em lotes (batches), não tudo de vez
        previsao = modelo(lote.features) # 1. chuta (forward)
        perda = loss(previsao, lote.label)  # 2. mede o erro
        gradiente = perda.backward()     # 3. sente a inclinação (backprop)
        pesos -= learning_rate * gradiente  # 4. dá um passo ladeira abaixo
# no fim: pesos ajustados = "modelo treinado"
```

**1. Defina a perda que codifica seu objetivo.** MSE para regressão comum; erro absoluto se outliers não devem dominar; entropia cruzada para classificação. A perda é a sua função-objetivo — escolha consciente.

**2. Inicialize os pesos e rode o forward.** Pesos começam aleatórios (com cuidado — inicialização ruim atrapalha); o modelo chuta.

**3. Calcule a perda e retropropague (backprop).** Um passe pra trás dá o gradiente de cada peso.

**4. Atualize com o learning rate e itere.** `peso ← peso − lr × gradiente`, lote a lote, época a época.

**5. Monitore a perda na VALIDAÇÃO e pare na hora certa.** A perda de treino cai sempre; a de validação cai e depois **sobe** quando começa o overfitting (módulo 03). Pare quando ela para de cair — **early stopping**.

**Anti-padrões:**
- **Learning rate no chute:** aceitar o primeiro valor. É o hiperparâmetro mais sensível — grande demais diverge, pequeno demais nunca chega. Teste alguns por ordem de grandeza (0.1, 0.01, 0.001) e olhe a curva de perda.
- **Treinar épocas demais:** deixar rodar "até convergir" sem olhar a validação → o modelo decora (overfitting). Monitore e aplique early stopping.
- **Confundir backprop com gradient descent:** achar que são a mesma coisa. Backprop **calcula** o gradiente (Rumelhart 1986); gradient descent **anda** com ele (Cauchy 1847). Saber a diferença separa quem entende de quem decorou.
- **Ignorar a curva de perda:** treinar às cegas. A curva (treino e validação por época) é o principal instrumento de diagnóstico — não olhar é debugar no escuro.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Este é o coração do **Lab 1 (`micrograd-redo`)** do syllabus — antecipe-o:

1. Implemente à mão, em JS/TS, uma reta `y = w·x + b` e a perda **MSE** sobre uns 10 pontos inventados.
2. Escreva o cálculo do gradiente de `w` e `b` (a derivada da MSE) — sem framework, na unha.
3. Rode o laço: forward → perda → gradiente → `w -= lr*grad_w; b -= lr*grad_b`. Imprima a perda por época.
4. **Varie o learning rate** (0.001, 0.01, 0.1, 1.0) e observe: com qual ele converge suave, com qual saltita/explode, com qual arrasta? Anote.
5. Confirme o gradiente por **diferença numérica** (mude `w` por um `ε` minúsculo, veja quanto a perda muda) — é o critério de "pronto" do Lab 1. Se bate, seu backprop artesanal está certo.

## Por que cai em entrevista

"Explica como um modelo aprende" testa se você entende a engrenagem ou só o jargão. A resposta forte tem a analogia da montanha, nomeia as quatro peças (loss, gradiente, learning rate, época) e sabe distinguir backprop de gradient descent — o detalhe que revela profundidade.

> **P:** "Explica, sem fórmula pesada, como um modelo de ML aprende."
>
> **R (30s):** "Aprender é ajustar os pesos pra minimizar uma função de perda, que mede o quão errado o modelo está. O algoritmo é gradient descent: como descer uma montanha no escuro sentindo a inclinação com os pés e dando um passo ladeira abaixo — o gradiente é a inclinação, o learning rate é o tamanho do passo. Uma época é uma passada por todos os dados, e a gente repete até a perda parar de cair."

> **P:** "Qual a diferença entre backpropagation e gradient descent?"
>
> **R (30s):** "São peças distintas que se encaixam. Backpropagation é como se calcula o gradiente numa rede de várias camadas — aplica a regra da cadeia de trás pra frente, propagando o erro da saída até a entrada, e dá o gradiente de cada peso num passe só; foi o paper do Rumelhart, Hinton e Williams em 1986 que popularizou isso e destravou o deep learning. Gradient descent é o que anda com esse gradiente: `peso menos learning rate vezes gradiente`, a ideia do Cauchy lá de 1847. Backprop calcula pra que lado descer; gradient descent dá o passo. Confundir os dois é o erro clássico."

## Checkpoint

- [ ] Sei que aprender = minimizar uma função de perda, e que a perda codifica meu objetivo
- [ ] Explico gradient descent com a analogia da montanha no escuro (gradiente = inclinação)
- [ ] Sei o que o learning rate controla e o que dá errado se for grande ou pequeno demais
- [ ] Distingo backpropagation (calcula o gradiente, Rumelhart 1986) de gradient descent (anda com ele)
- [ ] Entendo época, lote e por que SGD treina em lotes (Robbins & Monro)
- [ ] Reconheço overfitting pela curva de perda e sei aplicar early stopping

## Recursos

- *Learning Representations by Back-Propagating Errors* — Rumelhart, Hinton & Williams (*Nature*, 1986): o paper do backpropagation
- *Méthode générale pour la résolution des systèmes d'équations simultanées* — Cauchy (1847): a origem da descida do gradiente
- *A Stochastic Approximation Method* — Robbins & Monro (1951): a raiz do SGD (gradiente por amostra)
- Andrej Karpathy — *Neural Networks: Zero to Hero*, vídeo 1 ("micrograd"): construir autograd e o laço de treino do zero
- 3Blue1Brown — série "Neural networks" (buscar "gradient descent" e "backpropagation"): a intuição visual
- Módulo-irmão `06-redes-neurais-deep-learning` — onde o backprop realmente brilha (muitas camadas)
