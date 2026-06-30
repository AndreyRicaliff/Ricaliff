# 05 — Modelos clássicos antes do deep learning

## O que é

Antes das redes neurais dominarem, ML era um catálogo de modelos mais simples — e eles **continuam vivos e muito usados**. Em dados tabulares (planilhas, banco de dados), um modelo clássico costuma ganhar de uma rede neural: treina em segundos, roda barato, e você consegue **explicar** a decisão. Não confunda "antigo" com "ultrapassado".

## Regressão linear (linear regression) — a reta que melhor encaixa

A ideia mais básica de todas: prever um **número** assumindo que ele é uma **soma ponderada** das features. Geometricamente, é achar a **reta** (ou plano, com várias features) que passa mais perto de todos os pontos.

```text
preço │        ●
      │      ●  ╱●        ← a reta que minimiza a distância
      │    ● ╱●            total aos pontos (via gradient descent
      │   ╱●               ou fórmula fechada)
      │ ●╱
      └──────────────── metragem
```

Já vimos a fórmula no módulo 04: `preço ≈ peso₁·metragem + peso₂·quartos + viés`. Treinar = achar os pesos que minimizam o erro. **Intuição-chave:** cada peso vira uma frase em português — "cada m² a mais soma R$ 3 mil no preço". Essa legibilidade é o trunfo. Limite: só captura relação **linear**; se o padrão é curvo, ela subajusta (underfitting).

## Regressão logística (logistic regression) — classificar com uma probabilidade

Apesar do nome "regressão", serve pra **classificação** (sim/não). Ela faz a mesma soma ponderada, mas espreme o resultado por uma curva em S (a função **sigmoid**) que comprime qualquer número pro intervalo 0–1 — virando uma **probabilidade**.

```text
prob │        ____  1.0     "0.92 → provavelmente spam"
     │      ╱            ← acima de 0.5 = classe "sim"
 0.5 │----╱----------       abaixo = classe "não"
     │  ╱
 0.0 │╱______________ soma ponderada das features →
```

É o cavalo de batalha de classificação binária: prever churn, aprovar/negar crédito, spam/não-spam. Rápida, interpretável, ótimo ponto de partida (baseline) — sempre compare modelos sofisticados contra ela.

## Árvores de decisão (decision trees) — uma sequência de perguntas

Uma árvore aprende uma cascata de perguntas sim/não que vão fatiando os dados até decidir. É **exatamente** um fluxograma de `if/else`, só que a máquina escolheu sozinha quais perguntas fazer e em que ordem (escolhe a pergunta que melhor separa as classes em cada passo).

```text
              renda > 5k?
             ╱          ╲
          sim            não
           │              │
    dívida < 30%?     nega crédito
       ╱      ╲
    aprova    nega
```

Vantagem matadora: **lê como decisão humana** — você aponta pro caminho exato. Defeito: uma árvore sozinha facilmente decora o treino (overfitting). A solução é juntar **muitas** árvores: **Random Forest** (centenas de árvores votando) e **Gradient Boosting** (XGBoost, LightGBM — árvores que corrigem o erro umas das outras). Esses *ensembles* são, até hoje, **campeões em dados tabulares** e dominam competições de Kaggle nessa categoria.

## k-NN (k-Nearest Neighbors) — "me diga com quem andas"

O mais preguiçoso de todos: **não treina nada.** Ele guarda todos os exemplos e, na hora de classificar um caso novo, olha os **k vizinhos mais próximos** (os exemplos mais parecidos) e copia a resposta da maioria.

Analogia: chega alguém novo na cidade; pra adivinhar o time dele, você olha os 5 vizinhos mais próximos e chuta o time mais comum entre eles.

```text
        ●flamengo          ? = caso novo
   ●flamengo   ?           olha os 3 mais próximos:
        ●corinthians       2 flamengo, 1 corinthians
   ●flamengo               → chuta "flamengo"
```

Simples e intuitivo, mas: fica **lento** com muitos dados (compara com todo mundo a cada previsão), e exige uma boa noção de "distância" entre exemplos. Esse conceito de "próximo = parecido" é a semente da busca por **embeddings** nos LLMs (módulos 07–08).

## Quando usar qual

| Modelo | Bom para | Trunfo | Limite |
|---|---|---|---|
| Regressão linear | prever número | interpretável | só relação linear |
| Regressão logística | sim/não com probabilidade | baseline rápido | fronteira simples |
| Árvore / Random Forest / XGBoost | tabular em geral | explicável + forte | árvore só decora; ensemble resolve |
| k-NN | poucos dados, padrão local | zero treino | lento em escala |

**Em entrevista:** "Antes do deep learning tem um arsenal que ainda é o melhor pra dados tabulares: regressão linear pra prever número, logística pra classificar com probabilidade, árvores de decisão que viram um fluxograma de if/else legível, e k-NN que classifica pelo vizinho mais parecido. Em planilha, um XGBoost normalmente bate uma rede neural — treina rápido, custa pouco e dá pra explicar a decisão."
