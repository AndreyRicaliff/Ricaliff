# 06 — Redes neurais e deep learning

## O que é

Uma **rede neural (neural network)** é um monte de unidades simples — **neurônios** — conectadas em camadas. Cada neurônio faz duas coisas só: uma **soma ponderada** das entradas e passa o resultado por uma **função de ativação**. Empilhe muitos e a rede aprende padrões absurdamente complexos. O "neurônio" é inspirado vagamente no cérebro, mas na prática é só aritmética.

## O neurônio: soma ponderada + ativação

Cada neurônio recebe vários números de entrada, multiplica cada um por um **peso (weight)**, soma tudo, adiciona um **viés (bias)**, e passa por uma **ativação**:

```text
entradas    pesos
  x₁ ──w₁──╲
  x₂ ──w₂───● soma = w₁x₁ + w₂x₂ + w₃x₃ + bias
  x₃ ──w₃──╱        │
                    ▼
              ativação(soma) → saída do neurônio
```

A **soma ponderada** sozinha é só uma regressão linear (módulo 05). O que dá poder é a **ativação (activation function)**: uma função não-linear que decide "quanto este neurônio dispara". A mais comum é a **ReLU**: *se a soma for negativa, devolve 0; se positiva, devolve ela mesma.* Simples assim.

**Por que a ativação é essencial:** sem ela, empilhar mil camadas lineares colapsaria numa única linha reta — a rede inteira viraria uma regressão linear inútil pra padrões curvos. A não-linearidade da ativação é o que permite a rede **dobrar e entortar** o espaço pra separar coisas que uma reta nunca separaria. (Simplificando: cada camada deforma um pouco o espaço; juntas, traçam fronteiras de qualquer formato.)

## Camadas: entrada → escondidas → saída

Neurônios se organizam em **camadas (layers)**. A saída de uma camada vira a entrada da próxima:

```text
camada de    camadas escondidas      camada de
 entrada      (hidden layers)          saída
  ●──┐         ●     ●                  
  ●──┼────────►●─────●──────────────────► gato (0.9)
  ●──┤         ●     ●                  ► cachorro (0.1)
  ●──┘         ●     ●
 (pixels)   (extraem padrões)        (resposta)
```

A intuição mais bonita do deep learning é a **hierarquia de features**: as primeiras camadas aprendem coisas cruas (bordas, cantos numa imagem); as do meio combinam isso em partes (olho, orelha, focinho); as finais montam o conceito ("gato"). **Ninguém programou "olho" ou "focinho"** — a rede inventou esses detectores sozinha, porque ajudavam a baixar a perda. Isso se chama **representation learning** (a rede aprende as próprias features, em vez de você projetá-las à mão como nos modelos clássicos).

## Por que "profundo" (deep)?

"Deep" em **deep learning** quer dizer literalmente **muitas camadas escondidas** — de algumas dezenas a centenas. Quanto mais profunda, mais níveis de abstração ela pode empilhar (borda → parte → objeto → cena). Rasa = padrões simples; profunda = padrões ricos e hierárquicos.

O treino é o mesmo do módulo 04: gradient descent minimizando a perda. O algoritmo que calcula o gradiente de **cada peso** numa rede profunda, de trás pra frente camada por camada, é o **backpropagation (retropropagação)**: ele espalha o erro da saída de volta até a entrada, dizendo a cada peso o quanto ele contribuiu pro erro. É o motor matemático que tornou treinar redes profundas viável.

## O que mudou pra dar certo: dados + GPU

A teoria das redes neurais é dos anos 1950–80. Elas **não funcionavam bem** por décadas. Por que explodiram a partir de ~2012? Três coisas chegaram juntas:

1. **Dados em escala massiva** — a internet gerou milhões de imagens/textos rotulados (ImageNet, web inteira). Redes profundas têm fome de dados (módulo 03); finalmente havia comida.
2. **GPU (placas de vídeo)** — uma rede é, no fundo, multiplicação gigante de matrizes. GPUs foram feitas pra exatamente isso (paralelizam milhares de continhas) e deram um speedup de 10–100×. Sem GPU, um treino que leva dias levaria anos.
3. **Truques de engenharia** — ativação ReLU (treino mais estável), mais dados de treino sintéticos, melhores formas de inicializar e regularizar.

Resumo: **a ideia era velha; o que faltava era dado e poder de cálculo.** Quando os dois chegaram, deep learning passou a vencer tudo em visão, áudio e — com os Transformers (módulo 07) — linguagem.

```text
1958: ideia do "perceptron"  ───────────► funcionava mal
            (faltava dado + compute)
2012: AlexNet vence ImageNet na GPU ─────► deep learning explode
2017: Transformer ───────────────────────► destrava os LLMs
```

**Em entrevista:** "Uma rede neural é uma pilha de neurônios, e cada neurônio é só uma soma ponderada das entradas passada por uma ativação não-linear tipo ReLU — é a não-linearidade que deixa a rede aprender padrões curvos que uma reta não pega. 'Deep' é ter muitas camadas, e cada nível aprende uma abstração maior: borda, depois olho, depois 'gato' — a rede inventa as features sozinha. Treina com backpropagation. E o motivo de ter explodido em 2012 não foi a teoria, que é antiga, foi a chegada de dados em massa e das GPUs."
