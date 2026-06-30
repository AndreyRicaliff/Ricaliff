# 07 — LLMs e Transformers por dentro

## O que é

Um **LLM (Large Language Model, grande modelo de linguagem)** — GPT, Claude, Llama — é uma rede neural gigante (módulo 06) treinada para uma tarefa absurdamente simples de enunciar: **prever o próximo token.** Só isso. Toda a aparência de "raciocínio", "escrever código" e "conversar" emerge dessa única tarefa feita em escala monstruosa. A arquitetura que tornou isso possível é o **Transformer** (paper "Attention Is All You Need", 2017).

## Tokens — o LLM não vê letras nem palavras

O modelo não processa texto cru. Primeiro o texto é quebrado em **tokens (tokens)**: pedaços de palavra. Um token é ~4 caracteres ou ~0,75 palavra em inglês (em português costuma ser pior, mais tokens por palavra).

```text
"Machine learning é incrível"
 ↓ tokenização
["Machine", " learning", " é", " incr", "ível"]   ← cada um vira um número (id)
[ 24891,     6509,        425,  9123,    772 ]
```

Por que isso importa pra você: **você paga por token** (módulo 08), e o **limite de contexto** é contado em tokens. "Conte as letras desta palavra" confunde o LLM justamente porque ele vê tokens, não letras.

## Embeddings — significado em coordenadas

Cada token vira um **embedding (vetor de embedding)**: uma lista longa de números (centenas a milhares) que representa o **significado** daquele token como um **ponto num espaço de muitas dimensões**. A ideia que gruda: **palavras com significado parecido ficam perto** nesse espaço; palavras diferentes ficam longe.

```text
                 ↑
        gato ●  ● cachorro     ← animais: agrupados
                          ● leão
   ────────────────────────────────→
        rei ●  ● rainha         ← realeza: outro bairro
              carro ●
```

O fato clássico: a *direção* entre pontos carrega significado. `rei − homem + mulher ≈ rainha`. A relação "masculino→feminino" é uma direção constante no espaço. **Simplificando**, mas a intuição é real: o modelo aprende a geometria do significado a partir de bilhões de frases. (No módulo 08 você usa embeddings na prática pra **busca semântica**: buscar por significado, não por palavra exata.)

## Atenção (attention) — a peça central do Transformer

O grande problema da linguagem: o sentido de uma palavra depende das outras, às vezes distantes. Em *"o banco estava cheio, sentei e fiquei vendo o rio"*, o que faz "banco" ser assento e não instituição financeira são "sentei" e "rio".

O mecanismo de **atenção (attention)** resolve isso: ao processar cada token, o modelo **olha pra todos os outros tokens da frase e decide a quais prestar atenção** (dá um peso a cada um). "banco" "presta atenção" forte em "sentei" e "rio", e ajusta seu significado conforme o contexto.

```text
processando "banco":
   o   banco  estava  ...  sentei  ...  rio
        ▲                    ▲          ▲
        └──── atenção forte ─┴──────────┘   → "banco" = assento, não dinheiro
```

A sacada do Transformer (vs as redes anteriores, RNNs) é que ele olha **todos os tokens de uma vez, em paralelo**, em vez de ler um por um em ordem. Isso paraleliza lindamente em GPU (módulo 06) e é o que permitiu treinar em escala da internet inteira. "Attention is all you need" = a atenção, sozinha, basta.

## Por que prever o próximo token vira inteligência

Parece bobo, mas pense: pra prever bem a próxima palavra de *qualquer* texto da internet, o modelo é **forçado** a aprender gramática, fatos, lógica, estilo, código, raciocínio — porque tudo isso aparece nos padrões do texto. Prever o fim de "A capital da França é ___" exige saber geografia. Prever a próxima linha de uma função exige entender a lógica. A tarefa simples, em escala massiva, **obriga** a competência geral a emergir.

Geração é **autoregressiva**: prevê um token, anexa, prevê o próximo com o texto já maior, e repete — uma palavra de cada vez.

```text
"O céu é" → [azul 0.7, cinza 0.2, ...] → escolhe "azul"
"O céu é azul" → [. 0.5, e 0.3, ...]   → escolhe "."
... repete token a token ...
```

## Treino vs inferência num LLM — a distinção que mais cai

- **Treino (training):** o processo de **uma vez** (meses, milhares de GPUs, milhões de dólares) que ajusta os bilhões de pesos lendo a internet. Tem fases: **pré-treino** (prever próximo token em texto cru → aprende a língua e o mundo) e depois **alinhamento/RLHF** (humanos pontuam respostas, o modelo aprende a ser útil e seguro — o RL do módulo 02). Depois disso, **os pesos congelam.**
- **Inferência (inference):** **cada vez** que você manda um prompt e recebe resposta. Os pesos **não mudam** — o modelo só roda pra frente gerando tokens. É barata e rápida perto do treino.

A consequência prática que confunde todo iniciante: **o LLM não aprende com a sua conversa.** Pesos congelados na inferência. Ele "lembra" do que você disse só porque o histórico inteiro é **reenviado** dentro do contexto a cada turno — não porque memorizou.

## Context window — a memória de trabalho

O **context window (janela de contexto)** é o **máximo de tokens** que o modelo enxerga de uma vez: seu prompt + os documentos + o histórico + a resposta sendo gerada, tudo somado. Varia por modelo (de milhares a milhões de tokens).

Estourou a janela → o início é **truncado/esquecido**. É como uma mesa de trabalho: cabe muita coisa, mas o que não cabe cai no chão. Por isso conversas longuíssimas "esquecem" o começo. (No módulo 08, o **RAG** existe justamente pra colocar na mesa só o pedaço relevante de um acervo grande demais pra caber inteiro.)

## Alucinação (hallucination)

O LLM gera o texto **mais plausível**, não o mais **verdadeiro** — são coisas diferentes. Quando ele não sabe, em vez de calar, completa com algo que **soa** certo: cita uma lei que não existe, inventa uma função de biblioteca, erra uma data com total confiança. Isso é **alucinação (hallucination)** e é inerente a como ele funciona (prever o próximo token plausível), não um bug que somem.

Por que acontece: nada no objetivo de treino premia "dizer que não sabe" — premia continuar o texto de forma convincente. Mitigações (não curas): dar a fonte no contexto (**RAG**, módulo 08), pedir citações, baixar a temperatura, e **sempre verificar** fato crítico (nomes, números, API). Regra de ouro de dev: trate saída de LLM como rascunho de um estagiário brilhante e confiante demais — revise antes de confiar.

**Em entrevista:** "Um LLM é uma rede neural treinada só pra prever o próximo token, mas em escala da internet isso força ele a aprender gramática, fatos e lógica. O texto vira tokens, cada token vira um embedding — um ponto num espaço onde significados parecidos ficam perto — e o mecanismo de atenção deixa cada token olhar os outros pra se desambiguar pelo contexto. Treino é a fase única e cara que ajusta os pesos; inferência é cada chamada, com os pesos congelados — por isso ele não aprende da minha conversa, só relê o histórico que cabe na context window. E alucinação acontece porque ele gera o mais plausível, não o mais verdadeiro."
