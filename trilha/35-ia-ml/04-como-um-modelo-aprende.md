# 04 — Como um modelo "aprende"

## O que é

"Aprender", em ML, tem um significado mecânico e nada místico: é **ajustar números até errar menos.** Esses números são os **pesos (weights)** do modelo — os botões internos que decidem quanto cada feature conta.

Imagine prever preço de imóvel como uma soma ponderada:

```text
preço ≈ (peso_metragem × metragem) + (peso_quartos × quartos) + (peso_bairro × bairro) + viés
```

Treinar é descobrir os valores de `peso_metragem`, `peso_quartos`, etc. que fazem a previsão bater com a realidade. No começo eles são aleatórios — o modelo chuta lixo. O treino vai apertando esses botões aos poucos.

## A função de perda (loss) — uma nota de "quão errado"

Pra ajustar os botões na direção certa, o modelo precisa **medir o erro** com um número só. Essa medida é a **função de perda (loss function)**: ela compara a previsão com o gabarito e devolve "o tamanho do erro". Perda alta = muito errado. Perda zero = perfeito.

Exemplo intuitivo (regressão): para cada exemplo, pega a diferença entre previsto e real, eleva ao quadrado (pra punir erro grande e ignorar sinal), e tira a média. Isso é o **erro quadrático médio (mean squared error, MSE)**. Em palavras: *"em média, o quanto eu chutei longe do certo, com erro grande pesando muito mais."*

O objetivo de todo treino vira: **encontrar os pesos que deixam a perda o menor possível.**

## Gradient descent — descer a montanha no escuro

Como achar os pesos que minimizam a perda, se há milhões deles? Você não consegue testar todas as combinações. A solução é o **gradient descent (descida do gradiente)**, e a analogia é perfeita:

Você está numa montanha, no **escuro total**, e quer chegar ao vale (perda mínima). Não vê o mapa. Mas você consegue sentir com os pés **a inclinação sob você** — pra que lado o chão desce mais. Então você dá um passinho ladeira abaixo. Sente de novo. Mais um passo. Repete milhares de vezes até o chão ficar plano (chegou no fundo).

```text
perda
  │ \                        a cada passo:
  │  \  ●  ← você aqui       1. mede a inclinação (gradiente)
  │   \  \                   2. dá um passo ladeira abaixo
  │    \  ●                  3. repete
  │     \__●__               ← vale = perda mínima = pesos bons
  │__________________ valor do peso →
```

A **inclinação** que você sente é o **gradiente**: a matemática (derivada) que diz, pra cada peso, "aumentar este peso faz a perda subir ou descer, e quão rápido?". O modelo usa isso pra ajustar **todos os pesos de uma vez**, cada um no sentido que reduz o erro. (Simplificando: em redes neurais esse cálculo eficiente do gradiente camada por camada se chama **backpropagation** — módulo 06.)

## Learning rate — o tamanho do passo

O **learning rate (taxa de aprendizado)** é quão grande é cada passo ladeira abaixo. É o hiperparâmetro mais importante de ajustar:

- **Grande demais:** você pula por cima do vale, salta de um lado pro outro e nunca assenta (ou explode).
- **Pequeno demais:** chega lá, mas devagar — treino caro e lento, pode empacar num buraco raso.

```text
passo grande:   ●→    ←●    →●   (saltita, nunca converge)
passo pequeno:  ●·····→·····→    (chega, mas leva uma eternidade)
passo bom:      ●··→··→·→·●      (desce suave até o fundo)
```

## Épocas — repetir até assentar

Uma **época (epoch)** é uma passada completa por **todo** o dataset de treino. Um treino tem muitas épocas: o modelo vê os mesmos dados de novo e de novo, e a cada passada os pesos ficam um pouco melhores e a perda cai mais um tico.

```python
# pseudo-código do laço de treino — a essência de TODO ML supervisionado
for epoch in range(num_epocas):          # repete o dataset inteiro N vezes
    for lote in dataset_treino:          # em lotes (batches), não tudo de vez
        previsao = modelo(lote.features) # 1. chuta
        perda = loss(previsao, lote.label)  # 2. mede o erro
        gradiente = perda.backward()     # 3. sente a inclinação (backprop)
        pesos -= learning_rate * gradiente  # 4. dá um passo ladeira abaixo
# no fim: pesos ajustados = "modelo treinado"
```

Esses 4 passos — chutar, medir, sentir a inclinação, dar o passo — repetidos milhões de vezes, **são** o aprendizado. Não há mágica embaixo. Pegadinha comum: épocas demais → o modelo começa a **decorar** (overfitting, módulo 03); por isso se monitora a perda na **validação** e se para quando ela para de cair (early stopping).

**Em entrevista:** "Aprender é ajustar os pesos pra minimizar uma função de perda, que mede o quão errado o modelo está. O algoritmo é gradient descent: como descer uma montanha no escuro sentindo a inclinação com os pés e dando um passo ladeira abaixo — o gradiente é a inclinação, o learning rate é o tamanho do passo. Uma época é uma passada por todos os dados, e a gente repete até a perda parar de cair."
