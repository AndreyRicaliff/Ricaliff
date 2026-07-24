# 05 — Modelos clássicos antes do deep learning

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Antes das redes neurais dominarem, ML era um catálogo de modelos mais simples — e eles **continuam vivos e muito usados**. Em dados **tabulares** (planilhas, banco de dados), um modelo clássico costuma **ganhar** de uma rede neural: treina em segundos, roda barato, e você consegue **explicar** a decisão. Não confunda "antigo" com "ultrapassado". Este módulo é o arsenal que você vai usar de verdade no dia a dia — a rede profunda (módulo 06) é a exceção cara, não a regra.

---

## § BASE — o fundamento

**Duas culturas de modelagem.** **Leo Breiman (2001)**, em *"Statistical Modeling: The Two Cultures"*, dividiu a modelagem em duas escolas: a que assume um **modelo de dados** interpretável (uma equação que se lê) e a que busca só **precisão preditiva**, tratando o mecanismo como caixa-preta. Os modelos deste módulo cobrem o espectro inteiro — da regressão linear (interpretável ao extremo) ao gradient boosting (forte e opaco) — e a escolha entre eles é, no fundo, onde você quer ficar nesse trade-off **interpretabilidade × precisão**.

**Regressão linear — a reta que melhor encaixa.** A ideia mais básica: prever um **número** assumindo que ele é uma **soma ponderada** das features. Geometricamente, achar a **reta** (ou plano) que passa mais perto de todos os pontos, minimizando o erro quadrático (módulo 04). Já vimos a fórmula: `preço ≈ peso₁·metragem + peso₂·quartos + viés`. O **trunfo é a legibilidade**: cada peso vira uma frase em português — *"cada m² a mais soma R$ 3 mil no preço"*. O método dos **mínimos quadrados** que a resolve remonta a **Gauss e Legendre (~1805–1809)** — tem dois séculos e não saiu de moda. Limite: só captura relação **linear**; se o padrão é curvo, subajusta (underfitting, módulo 03).

**Regressão logística — classificar com uma probabilidade.** Apesar do nome, serve para **classificação** (sim/não). Faz a mesma soma ponderada, mas **espreme** o resultado por uma curva em S — a função **sigmoid** — que comprime qualquer número para o intervalo 0–1, virando uma **probabilidade**. A formulação é de **David Cox (1958)**, *"The Regression Analysis of Binary Sequences"*. É o cavalo de batalha da classificação binária — churn, aprovar/negar crédito, spam/não-spam — rápida, interpretável e **o baseline por excelência**: sempre compare o modelo sofisticado contra ela; se não bate uma logística, algo está errado.

**Árvores de decisão — uma sequência de perguntas.** A árvore aprende uma cascata de perguntas sim/não que fatiam os dados até decidir — é **exatamente** um fluxograma de `if/else`, só que a máquina escolheu sozinha quais perguntas fazer e em que ordem (em cada passo, a pergunta que **melhor separa** as classes, medida por *impureza de Gini* ou *entropia*). O framework clássico é o **CART** de **Breiman, Friedman, Olshen & Stone (1984)**. Vantagem matadora: **lê como decisão humana** — você aponta o caminho exato. Defeito: uma árvore sozinha **decora** o treino (overfitting).

**Ensembles — o estado da arte em tabular.** A cura do overfitting da árvore é juntar **muitas** árvores:
- **Random Forest** (**Breiman, 2001**, *"Random Forests"*): centenas de árvores, cada uma treinada num subconjunto aleatório de dados e features, **votando** — o erro de uma é cancelado pela média das outras (*bagging*).
- **Gradient Boosting** (**Friedman, 2001**): árvores em sequência, cada uma corrigindo o **erro residual** da anterior. A implementação que dominou o mundo é o **XGBoost** (**Chen & Guestrin, 2016**), seguida por LightGBM e CatBoost.

Esses ensembles são, **até hoje**, campeões em dados tabulares e dominam competições de Kaggle nessa categoria. O ponto que surpreende quem só ouviu falar de deep learning: para a planilha do seu **Cliente Varejo**, um XGBoost quase sempre bate uma rede neural.

**k-NN — "me diga com quem andas".** O mais preguiçoso de todos: **não treina nada**. Guarda todos os exemplos e, para classificar um caso novo, olha os **k vizinhos mais próximos** (os mais parecidos) e copia a resposta da maioria. **Cover & Hart (1967)**, em *"Nearest Neighbor Pattern Classification"*, provaram uma garantia teórica elegante: com dados infinitos, a taxa de erro do vizinho mais próximo é no máximo **o dobro** do erro ótimo possível (Bayes) — um resultado forte para algo tão simples (a ideia vem de **Fix & Hodges, 1951**). Defeitos: fica **lento** com muitos dados (compara com todo mundo a cada previsão) e exige uma boa noção de **distância** entre exemplos. Esse conceito — *"próximo = parecido"* — é a semente da **busca por embeddings** dos LLMs (módulos 07–08): busca vetorial é k-NN num espaço de significado.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O espectro interpretabilidade × precisão (as "duas culturas" de Breiman):

```text
+ INTERPRETÁVEL                                        + PRECISO (opaco)
│                                                                       │
regressão   regressão    árvore de     Random Forest /   Gradient Boosting
linear      logística    decisão       (bagging)         (XGBoost — boosting)
│           │            │             │                 │
lê como     probabili-   fluxograma    árvores votam,    árvores corrigem
equação     dade + S     if/else       cancela ruído     o erro uma da outra
│                                                         │
└──── baseline: comece aqui ────► ──── suba só se precisar ─────► topo tabular
```

k-NN fica fora desse eixo — é **preguiçoso** (não constrói modelo, memoriza):
```
   k-NN: zero treino · previsão cara · precisa de boa métrica de distância
         └── mesma ideia da busca vetorial / embeddings (módulos 07–08)
```

Regra de dependência: **linear/logística são o piso** (baseline obrigatório); **árvore** é o degrau interpretável; **ensembles** são o teto para tabular; **rede neural** (módulo 06) só quando os dados têm estrutura que o tabular não tem (imagem, texto, áudio).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Comece pelo baseline: linear (número) ou logística (sim/não).** É rápido, interpretável e define a nota P que qualquer modelo mais caro tem que bater. Modelo que não bate a logística não deveria ir a produção.

**2. Se precisa de explicação humana da decisão, pare na árvore.** Uma árvore rasa vira o fluxograma que você mostra pro cliente ou pro auditor. Interpretabilidade é feature, não consolo.

**3. Se quer o topo em tabular e não precisa auditar cada decisão, vá pra ensemble.** Random Forest é o padrão robusto e quase sem ajuste; XGBoost/LightGBM é o que ganha Kaggle, com mais afinação.

**4. Use k-NN só com poucos dados e boa noção de distância.** É ótimo protótipo e péssimo em escala (previsão custa comparar com todo o dataset).

**5. Antes de pensar em rede neural, pergunte se o dado é tabular.** Se for planilha/banco, o clássico quase sempre ganha — mais barato, mais rápido, explicável.

**Anti-padrões:**
- **Pular o baseline:** ir direto pro XGBoost/rede sem uma logística de referência. Sem baseline você não sabe se o modelo caro ganhou coisa nenhuma.
- **Rede neural em tabular por moda:** trocar um XGBoost que treina em segundos por uma rede que treina em horas, custa GPU e não explica — para ganhar nada ou perder. Deep learning brilha em imagem/texto/áudio, não na planilha.
- **Uma árvore sozinha em produção:** confiar numa única árvore que decorou o treino. Use o ensemble (bagging/boosting) que remove o overfitting.
- **k-NN em escala:** deixar o k-NN prever sobre milhões de linhas — cada previsão varre o dataset inteiro. Vira gargalo silencioso.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Pegue uma planilha real (ex.: prever se um cliente de um **Cliente Varejo** vai comprar de novo):

1. Rode mentalmente (ou em código) o **baseline logístico**: quais 3 features entrariam, e que probabilidade o modelo daria?
2. Desenhe a **árvore** equivalente à mão: qual pergunta separa melhor "compra / não compra"? Depois qual? Você acabou de fazer o que a árvore faz.
3. Escreva por que um **XGBoost** provavelmente bateria a sua árvore única — e o que você **perde** ao trocar (a legibilidade).
4. Identifique um problema seu onde **k-NN / embeddings** seriam a ferramenta: "quão parecidos são estes dois registros?" — e ligue à busca vetorial do módulo 08.
5. Escreva a decisão final numa frase, situando-a no espectro de Breiman: "logística porque preciso explicar" ou "XGBoost porque quero precisão e o dado é tabular".

## Por que cai em entrevista

Entrevistador testa se você conhece o arsenal além de "usei uma rede". A resposta forte mostra o trade-off interpretabilidade × precisão, sabe que XGBoost domina tabular, e liga k-NN a embeddings — provando que você vê a linha contínua até os LLMs.

> **P:** "Que modelos clássicos você conhece e quando ainda valem a pena?"
>
> **R (30s):** "Antes do deep learning tem um arsenal que ainda é o melhor pra dados tabulares: regressão linear pra prever número, logística pra classificar com probabilidade, árvores de decisão que viram um fluxograma de if/else legível, e k-NN que classifica pelo vizinho mais parecido. Em planilha, um XGBoost normalmente bate uma rede neural — treina rápido, custa pouco e dá pra explicar a decisão."

> **P:** "Por que juntar muitas árvores (Random Forest, XGBoost) funciona melhor que uma só?"
>
> **R (30s):** "Uma árvore sozinha decora o treino — overfitting. Juntar muitas ataca isso de dois jeitos. Random Forest é bagging, do Breiman em 2001: cada árvore vê um subconjunto aleatório de dados e features e todas votam, então o erro idiossincrático de uma é cancelado pela média das outras. Gradient boosting, tipo o XGBoost do Chen e Guestrin de 2016, é o oposto: as árvores vêm em sequência, cada uma corrigindo o erro residual da anterior. As duas abordagens reduzem a variância sem virar caixa-preta indecifrável, e por isso ensemble de árvore ainda é campeão em dados tabulares e domina o Kaggle."

## Checkpoint

- [ ] Situo cada modelo no espectro interpretabilidade × precisão (as duas culturas de Breiman)
- [ ] Uso regressão linear/logística como baseline obrigatório antes de qualquer modelo caro
- [ ] Sei que uma árvore decora e que o ensemble (Random Forest / XGBoost) resolve isso
- [ ] Sei que ensembles de árvore ainda dominam dados tabulares e não substituo por rede à toa
- [ ] Explico o k-NN e sua garantia (Cover & Hart) e ligo "próximo = parecido" a embeddings
- [ ] Escolho o modelo pelo trade-off do problema, não pela moda

## Recursos

- *Statistical Modeling: The Two Cultures* — Leo Breiman (2001): o trade-off interpretabilidade × precisão
- *The Regression Analysis of Binary Sequences* — David Cox (1958): a regressão logística
- *Classification and Regression Trees (CART)* — Breiman, Friedman, Olshen & Stone (1984): árvores de decisão
- *Random Forests* — Leo Breiman (2001): o ensemble por bagging
- *XGBoost: A Scalable Tree Boosting System* — Chen & Guestrin (2016): o boosting que dominou tabular
- *Nearest Neighbor Pattern Classification* — Cover & Hart (1967): a garantia teórica do k-NN
- Google *ML Crash Course* — "Logistic Regression", "Classification" (limiar, matriz de confusão, ROC/AUC)
