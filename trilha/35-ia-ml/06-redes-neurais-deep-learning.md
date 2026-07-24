# 06 — Redes neurais e deep learning

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Uma **rede neural (neural network)** é um monte de unidades simples — **neurônios** — conectadas em camadas. Cada neurônio faz duas coisas só: uma **soma ponderada** das entradas e passa o resultado por uma **função de ativação**. Empilhe muitos e a rede aprende padrões absurdamente complexos. O "neurônio" é inspirado *vagamente* no cérebro; na prática é só aritmética. Este módulo mostra por que empilhar essas continhas dá tanto poder, por que a ideia (velha dos anos 1950) só funcionou em 2012, e por que — mesmo funcionando — nós ainda não entendemos direito o que a rede aprende por dentro.

---

## § BASE — o fundamento

**O neurônio: soma ponderada + ativação.** Cada neurônio recebe vários números, multiplica cada um por um **peso**, soma tudo, adiciona um **viés (bias)** e passa por uma **ativação**:

```text
entradas    pesos
  x₁ ──w₁──╲
  x₂ ──w₂───● soma = w₁x₁ + w₂x₂ + w₃x₃ + bias
  x₃ ──w₃──╱        │
                    ▼
              ativação(soma) → saída do neurônio
```

A soma ponderada sozinha é só uma regressão linear (módulo 05). O que dá poder é a **ativação** — uma função **não-linear** que decide "quanto este neurônio dispara". A mais comum é a **ReLU**: *se a soma for negativa, devolve 0; se positiva, devolve ela mesma*. A raiz histórica é o **perceptron** de **Frank Rosenblatt (1958)** — o primeiro neurônio artificial treinável.

**Por que a ativação é essencial (e por que o campo quase morreu sem ela).** Sem a não-linearidade, empilhar mil camadas lineares **colapsa numa única reta** — a rede inteira vira uma regressão linear inútil para padrões curvos. Essa limitação foi provada por **Minsky & Papert (1969)** no livro *Perceptrons*: um perceptron de uma camada **não consegue** aprender nem o simples XOR. O resultado foi tão desmoralizante que ajudou a causar o primeiro **"inverno da IA"** — anos de descrédito e corte de verba. A não-linearidade da ativação é o que permite a rede **dobrar e entortar** o espaço para separar coisas que uma reta nunca separaria; cada camada deforma um pouco o espaço, e juntas traçam fronteiras de qualquer formato.

**Por que uma rede pode aprender qualquer coisa: o teorema da aproximação universal.** **Cybenko (1989)** e **Hornik, Stinchcombe & White (1989)** provaram, independentemente, o **Universal Approximation Theorem**: uma rede com **uma única camada escondida** e neurônios não-lineares suficientes pode aproximar **qualquer** função contínua com a precisão que você quiser. Isso explica o poder bruto — mas com uma pegadinha honesta: o teorema garante que a função **existe**, não que o gradient descent (módulo 04) vá **achá-la**, nem quantos neurônios seriam necessários. Poder de representação e treinabilidade são coisas diferentes.

**Camadas e a hierarquia de features — a intuição mais bonita do deep learning.** Neurônios se organizam em **camadas**; a saída de uma vira a entrada da próxima. As primeiras camadas aprendem coisas cruas (bordas, cantos numa imagem); as do meio combinam isso em partes (olho, orelha, focinho); as finais montam o conceito ("gato"). **Ninguém programou "olho" ou "focinho"** — a rede inventou esses detectores sozinha, porque baixavam a perda. Isso é **representation learning**: a rede aprende as próprias features, em vez de você projetá-las à mão como nos modelos clássicos. E não é só teoria: **Zeiler & Fergus (2014)**, em *"Visualizing and Understanding Convolutional Networks"*, **fotografaram** essa hierarquia — mostraram, camada por camada, que a rede de fato aprende de bordas a texturas a objetos.

```text
camada de    camadas escondidas      camada de
 entrada      (hidden layers)          saída
  ●──┐         ●     ●
  ●──┼────────►●─────●──────────────────► gato (0.9)
  ●──┤         ●     ●                  ► cachorro (0.1)
  ●──┘         ●     ●
 (pixels)   (bordas→partes→objeto)   (resposta)
```

**"Deep" = muitas camadas.** *Deep* em deep learning quer dizer literalmente **muitas camadas escondidas** — de dezenas a centenas. Quanto mais profunda, mais níveis de abstração ela empilha (borda → parte → objeto → cena). O treino é o do módulo 04: gradient descent minimizando a perda, com o gradiente de cada peso calculado por **backpropagation** (**Rumelhart, Hinton & Williams, 1986**) — o motor que tornou treinar redes profundas viável.

**O que destravou tudo em 2012: dados + GPU.** A teoria é dos anos 1950–80 e **não funcionava bem** por décadas. Três coisas chegaram juntas por volta de 2012:
1. **Dados em escala massiva** — a internet gerou milhões de imagens/textos rotulados. O **ImageNet** (**Deng et al., 2009**) deu 1,2 milhão de imagens rotuladas; redes profundas têm fome de dados (módulo 03) e finalmente havia comida.
2. **GPU** — uma rede é, no fundo, multiplicação gigante de matrizes, e GPUs foram feitas para exatamente isso (paralelizam milhares de continhas), dando *speedup* de ordens de grandeza.
3. **Truques de engenharia** — a ativação ReLU (treino mais estável), melhores inicializações e regularização.

O marco público é o **AlexNet** (**Krizhevsky, Sutskever & Hinton, 2012**): venceu o desafio ImageNet com **~15,3% de erro top-5**, contra **~26,2% do segundo colocado** — um salto que não se via, e que rodou em GPU. Foi o estalo que fez o campo inteiro migrar para deep learning. **A ideia era velha; o que faltava era dado e poder de cálculo.**

```text
1958: perceptron (Rosenblatt) ──────────► funcionava mal
1969: Minsky & Papert (XOR) ────────────► "inverno da IA"
1986: backpropagation (Rumelhart) ──────► treino de redes profundas viável
1989: aproximação universal (Cybenko) ──► base teórica do poder
2012: AlexNet vence ImageNet na GPU ────► deep learning explode
```

**Incerteza declarada — nós não entendemos o que a rede aprende por dentro.** Sabemos *que* ela aprende features hierárquicas (Zeiler & Fergus fotografaram), mas **ler** o que cada neurônio de uma rede grande realmente representa é **campo aberto de pesquisa** — a **interpretabilidade mecanicista**. Trabalhos como *"Zoom In: An Introduction to Circuits"* (**Olah et al., Distill, 2020**) e a linha de interpretabilidade da **Anthropic** (superposição, monossemanticidade) mostram progresso, mas também que a rede é, hoje, **majoritariamente uma caixa-preta**: ela funciona sem que ninguém consiga dar uma explicação completa de *por quê*, neurônio a neurônio. Isso tem consequência prática — auditar, depurar e garantir uma rede profunda é genuinamente mais difícil do que um modelo clássico legível (módulo 05).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Da unidade ao sistema, e o que cada nível acrescenta:

```text
   NEURÔNIO = soma ponderada + ativação não-linear (ReLU)
      │  (sem a não-linearidade, tudo colapsa numa reta — Minsky & Papert)
      ▼
   CAMADA = muitos neurônios em paralelo (deforma o espaço um pouco)
      │
      ▼
   PILHA PROFUNDA = muitas camadas → hierarquia de features
      │  borda → parte → objeto → conceito (representation learning)
      │  poder garantido pela aproximação universal (Cybenko/Hornik 1989)
      ▼
   TREINO = gradient descent (mód. 04) + gradiente por BACKPROP (Rumelhart 1986)
      │
      ▼
   FUNCIONA EM ESCALA quando há DADOS (ImageNet) + GPU (2012, AlexNet)
      │
      ▼
   ...mas o QUE ela aprendeu por dentro = interpretabilidade (campo aberto)
```

Relação com os módulos vizinhos:
- **Módulo 05 (clássicos):** você projeta as features à mão; o modelo é legível. **Aqui:** a rede projeta as features sozinha; ganha poder, perde legibilidade.
- **Módulo 04:** o motor de treino (loss, gradiente, learning rate) é **o mesmo** — a rede só tem muito mais pesos, e o backprop os alcança todos.
- **Módulo 07:** o Transformer é uma arquitetura de rede neural específica para sequências — herda tudo daqui.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Pergunte se o dado justifica uma rede.** Tabular → provavelmente clássico (módulo 05). Imagem, áudio, texto, sinal com estrutura espacial/sequencial → é onde a rede ganha, porque ela aprende as features que você não saberia projetar.

**2. Garanta que há dado e compute suficientes.** Rede profunda tem fome de dados (a lição de 2012). Poucos exemplos → prefira clássico ou *transfer learning* (reaproveitar uma rede pré-treinada).

**3. Entenda que treino é o laço do módulo 04, em escala.** Loss, gradiente por backprop, learning rate, épocas, early stopping — nada novo no motor, só muito mais pesos.

**4. Comece raso e aprofunde só se precisar.** Mais camadas = mais poder e mais risco de overfitting e de treino instável. Ajuste a profundidade pela nota de validação.

**5. Trate a rede como caixa-preta e planeje a auditoria.** Como a interpretabilidade é campo aberto, monte avaliação por comportamento (casos de teste, métricas por fatia) — você não vai conseguir "ler" a rede para justificar cada decisão.

**Anti-padrões:**
- **Rede neural em dado tabular por moda:** trocar um XGBoost por uma rede que custa mais e explica menos, para ganhar nada (módulo 05).
- **Empilhar camadas achando que profundidade sempre ajuda:** rede profunda demais para pouco dado overfitta e treina instável. Profundidade tem que casar com volume de dados.
- **Tratar a rede como "explicável":** prometer justificar cada decisão de uma rede profunda. A interpretabilidade não está resolvida — não venda o que o campo ainda não entrega.
- **Ignorar a base histórica:** achar que deep learning é novo. A ideia é de 1958; o que mudou foi dado + GPU. Quem entende isso não superestima "a próxima arquitetura mágica" e valoriza o gargalo real (dados e compute).

---

## Passo-a-passo aplicado (faça agora, ~30min)

Antecipe o **Lab 2 (`bigram-namer`)** / o vídeo "makemore" do syllabus, na intuição:

1. Desenhe no papel um neurônio com 2 entradas, 2 pesos, um viés e uma ReLU. Calcule a saída para `x=(1, -3)`, `w=(2, 1)`, `bias=0`. Confirme que a ReLU zerou o negativo.
2. Explique, em uma frase, por que remover a ReLU (deixar só a soma) faz uma pilha de 3 camadas virar equivalente a **uma** regressão linear.
3. Escreva a hierarquia de features para um problema seu (ex.: classificar foto de produto de um **Cliente Varejo**): o que as camadas rasas x profundas aprenderiam?
4. Liste as **3 coisas** que faltavam antes de 2012 (dado, GPU, truques) e escreva por que a teoria sozinha não bastava.
5. Escreva uma frase honesta sobre o limite: "a rede aprende features sozinha, mas ler o que cada neurônio faz é campo aberto — logo, auditar é mais difícil que num modelo clássico".

## Por que cai em entrevista

"Explica o que é uma rede neural e por que deep learning explodiu" é pergunta padrão. A resposta forte tem o neurônio (soma + ativação), a razão da não-linearidade, a hierarquia de features, o backprop e — o que separa quem entende — a história: a ideia é velha, o que mudou foi dado + GPU.

> **P:** "O que é uma rede neural e por que o deep learning só decolou nos anos 2010?"
>
> **R (30s):** "Uma rede neural é uma pilha de neurônios, e cada neurônio é só uma soma ponderada das entradas passada por uma ativação não-linear tipo ReLU — é a não-linearidade que deixa a rede aprender padrões curvos que uma reta não pega. 'Deep' é ter muitas camadas, e cada nível aprende uma abstração maior: borda, depois olho, depois 'gato' — a rede inventa as features sozinha. Treina com backpropagation. E o motivo de ter explodido em 2012 não foi a teoria, que é antiga, foi a chegada de dados em massa e das GPUs."

> **P:** "Se a rede aprende as features sozinha, a gente entende o que ela aprendeu?"
>
> **R (30s):** "Só em parte, e é honesto admitir isso. A gente sabe *que* ela aprende uma hierarquia — o Zeiler e Fergus em 2014 até visualizaram, de bordas a objetos — mas *ler* o que cada neurônio de uma rede grande representa é campo aberto de pesquisa, a interpretabilidade mecanicista, com trabalhos do Chris Olah e da Anthropic. Na prática a rede é majoritariamente uma caixa-preta: funciona sem que ninguém consiga explicar completamente por quê, neurônio a neurônio. A consequência é concreta — auditar e depurar uma rede profunda é bem mais difícil que um modelo clássico legível, e por isso eu não prometo 'explicar cada decisão' quando uso deep learning."

## Checkpoint

- [ ] Explico o neurônio (soma ponderada + ativação) e por que a não-linearidade é essencial
- [ ] Sei que sem ativação a pilha colapsa numa reta (a limitação de Minsky & Papert)
- [ ] Enuncio a aproximação universal (Cybenko/Hornik) e sua pegadinha (existe ≠ o treino acha)
- [ ] Explico a hierarquia de features / representation learning e o que "deep" significa
- [ ] Sei que backprop + dados (ImageNet) + GPU (AlexNet 2012) destravaram o campo, não a teoria
- [ ] Reconheço que a interpretabilidade é campo aberto e não prometo explicar cada decisão

## Recursos

- *The Perceptron* — Frank Rosenblatt (1958) e *Perceptrons* — Minsky & Papert (1969): o neurônio e sua limitação linear
- *Approximation by Superpositions of a Sigmoidal Function* — Cybenko (1989) (e Hornik et al., 1989): a aproximação universal
- *Learning Representations by Back-Propagating Errors* — Rumelhart, Hinton & Williams (1986): o backprop
- *ImageNet Classification with Deep CNNs (AlexNet)* — Krizhevsky, Sutskever & Hinton (2012): o marco de 2012
- *Visualizing and Understanding Convolutional Networks* — Zeiler & Fergus (2014): a hierarquia de features fotografada
- *Zoom In: An Introduction to Circuits* — Olah et al. (Distill, 2020) e a interpretabilidade da Anthropic: o campo aberto
- Andrej Karpathy — *Zero to Hero*, "makemore" (partes 1–2): camadas e ativações do zero
