# 03 — Dados, features e o ciclo treino/teste

## O que é

Antes de qualquer modelo, vem o **dado**. Em ML o dado tem um vocabulário fixo que cai sempre.

- **Dataset:** a tabela inteira de exemplos. Cada linha é um exemplo.
- **Feature (atributo):** uma coluna de entrada — algo que descreve o exemplo. Para um imóvel: metragem, nº de quartos, bairro. São os "sinais" que o modelo lê.
- **Label (rótulo / alvo / target):** a coluna que você quer prever — a resposta certa, no aprendizado supervisionado. Para o imóvel: o preço.

```text
| metragem | quartos | bairro  |  preço   |
|----------|---------|---------|----------|
|   80     |   2     | centro  | 450.000  |   ← features = entrada | label = preço
|  120     |   3     | jardim  | 600.000  |
```

Escolher e preparar boas features (**feature engineering**) costuma importar mais que escolher o modelo. "Lixo entra, lixo sai": se as features não carregam o sinal, nenhum modelo salva.

## O ciclo treino / validação / teste

Aqui mora o erro nº 1 de iniciante: **avaliar o modelo nos mesmos dados em que ele treinou.** Isso é colar na prova com a prova aberta — a nota é alta e mentirosa.

Você **divide (split)** o dataset em três partes que o modelo vê em momentos diferentes:

```text
Dataset (100%)
 ├── Treino (training, ~70%)   → o modelo aprende AQUI (vê features + label)
 ├── Validação (validation, ~15%) → você ajusta config/hiperparâmetros AQUI
 └── Teste (test, ~15%)        → nota final, dados que o modelo NUNCA viu
```

A regra sagrada: o conjunto de **teste é cofre lacrado**. Você só abre **uma vez**, no fim, pra estimar como o modelo vai se sair no mundo real com dados novos. Se você fica espiando o teste pra melhorar o modelo, ele vaza pro processo e a nota volta a mentir (data leakage).

Analogia: treino é a lista de exercícios resolvida; validação é o simulado (você confere e estuda mais); teste é a **prova oficial** — vista uma vez só, sem segunda chance.

## Overfitting vs underfitting — a tensão central de todo ML

O modelo tem que **generalizar**: ir bem em dados que nunca viu, não decorar os que viu.

- **Overfitting (sobreajuste):** o modelo **decorou** o treino, incluindo o ruído e os acidentes daquele conjunto. Vai perfeito no treino e mal no teste. É o aluno que decorou as respostas da lista e trava quando a prova muda os números.
- **Underfitting (subajuste):** o modelo é simples/burro demais pra captar o padrão. Vai mal no treino **e** no teste. É o aluno que não estudou o suficiente.

```text
Erro
 │                          ____ teste (sobe = overfitting)
 │  \                  ____/
 │   \            ____/
 │    \______treino (cai sempre)
 │_____________________________________ complexidade do modelo →
        ↑underfit        ↑ponto bom        ↑overfit
```

O sinal clássico de overfitting: **erro de treino baixo, erro de teste alto** — a distância (gap) entre os dois é o alarme. Remédios: mais dados, modelo mais simples, regularização, parar o treino antes (early stopping).

## "Mais dados" costuma ganhar de "modelo melhor"

Um resultado que surpreende: na prática, **dobrar a qualidade/quantidade dos dados rende mais que trocar por um algoritmo mais esperto.** Por quê? Mais exemplos cobrem mais casos reais, ensinam o que é ruído vs sinal, e empurram o modelo a generalizar em vez de decorar. Foi essa lição — dados em escala massiva — que destravou o deep learning e os LLMs (módulos 06–07).

Não é absoluto: dados sujos, enviesados ou desbalanceados estragam o modelo por mais que existam. **Mais dados BONS** ganham. Garbage não escala.

**Em entrevista:** "Features são as colunas de entrada, label é o que eu quero prever. Eu divido o dataset em treino, validação e teste — o teste eu só toco no fim, pra não enganar a mim mesmo. Overfitting é decorar o treino e ir mal em dado novo; o sinal é erro de treino baixo e de teste alto. E na prática, mais dados bons costuma render mais que um modelo mais sofisticado."
