# Syllabus — IA e Machine Learning

> **Disciplina:** entender o que um modelo faz por dentro — do gradiente ao transformer — para usar LLMs na prática com critério, sem tratar a IA como oráculo.
> **Carga horária alvo: 50h** — aulas 4h · bibliografia 24h · labs 15h · projeto de conclusão 7h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar "aprender" em termos mecânicos: loss, gradiente e ajuste de pesos por descida de gradiente.
2. Construir do zero um autograd escalar e uma pequena rede que treina — sem framework.
3. Descrever como um transformer prevê o próximo token (atenção, embeddings, tokenização) sem hand-waving.
4. Montar um prompt estruturado + um harness de avaliação (LLM-as-judge) para medir variações de prompt na Claude API.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 o-que-e-ml | Google — *Machine Learning Crash Course*, unidades "Introduction to ML" e "ML Framing" (developers.google.com/machine-learning) | 2h |
| 02 tipos-de-aprendizado | Google *ML Crash Course* — unidades "Linear Regression" (supervisionado) + material introdutório de clustering (não-supervisionado) | 2.5h |
| 03 dados-features-treino-teste | Google *ML Crash Course* — "Working with Data", "Generalization", "Training and Test Sets" e "Validation Set" | 3h |
| 04 como-um-modelo-aprende | Andrej Karpathy — *Neural Networks: Zero to Hero*, vídeo 1 "The spelled-out intro to neural networks and backpropagation: building micrograd" (YouTube, grátis) | 3.5h |
| 05 modelos-classicos | Google *ML Crash Course* — "Logistic Regression", "Classification" (limiar, matriz de confusão, ROC/AUC) | 2.5h |
| 06 redes-neurais-deep-learning | Karpathy — *Zero to Hero*, vídeos "building makemore" (partes 1–2: bigramas → MLP, camadas e ativações) | 4h |
| 07 llms-transformers | Karpathy — "Let's build GPT: from scratch, in code" + "Let's build the GPT Tokenizer" (atenção, embeddings, BPE) | 4.5h |
| 08 usar-ia-na-pratica | Anthropic docs — "Prompt engineering overview" (guia oficial) + Claude API "Getting started" e "Tool use" | 2h |

Regra de leitura: **assista com o editor aberto** — cada vídeo do Karpathy só conta hora se você recodar o trecho e rodar. Doc da Anthropic só conta com uma chamada real à API feita e conferida.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `micrograd-redo` (6h):** reimplemente um motor de autograd escalar (classe `Value` com `+`, `*`, `tanh` e `backward()`) do zero, seguindo o vídeo 1, e treine um MLP minúsculo num dataset de brinquedo até a loss cair.
*Pronto quando:* o gradiente calculado pelo seu `backward()` bate com uma diferença numérica (finite difference) dentro de tolerância, e a loss do MLP decresce ao longo das épocas — provado por um gráfico ou log.

**Lab 2 — `bigram-namer` (5h):** gerador de nomes a nível de caractere (estilo makemore): conte bigramas de uma lista de nomes, construa a matriz de probabilidade e amostre nomes novos; depois substitua a contagem por um MLP de 1 camada treinado.
*Pronto quando:* os dois modelos (contagem e MLP) geram nomes plausíveis e você reporta a loss (negative log-likelihood) de cada um sobre os dados, mostrando o MLP igualando ou batendo o de contagem.

**Lab 3 — `claude-judge` (4h):** script que usa a Claude API para classificar textos (ex.: sentimento) com um prompt estruturado, e um harness LLM-as-judge que roda 2–3 variantes de prompt sobre um conjunto rotulado e compara acurácia.
*Pronto quando:* o harness imprime a acurácia por variante sobre o mesmo conjunto e aponta a vencedora — com a chave de API em `.env` (nunca no código) e o custo da rodada registrado.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o editor aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **3Blue1Brown** | "neural networks" (série completa), "gradient descent", "backpropagation", "attention in transformers" | módulos 04, 06, 07 — a intuição visual por trás da matemática |
| **Andrej Karpathy** | "Zero to Hero", "micrograd", "let's build GPT", "let's build the GPT tokenizer" | módulos 04, 06, 07 — recodar junto (já na bibliografia) |
| **Two Minute Papers** | "large language models", "GPT", "what neural networks learn" | módulo 08 — panorama do estado da arte |
| **Filipe Deschamps** *(PT-BR)* | "como a inteligência artificial funciona", "redes neurais", "o que é machine learning" | módulos 01, 02 — panorama em português |

Ordem sugerida: 3Blue1Brown/Filipe Deschamps para a intuição ANTES; Karpathy DEPOIS, recodando cada trecho (só conta hora rodando). Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória "lida" com nota de aplicação por item (o que você recodou / a chamada de API que fez)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — uma feature de IA aplicada (classificação/extração via Claude API) com prompt versionado e eval reproduzível

*Bibliografia sem link direto: procurar pelo título — o *ML Crash Course*, os vídeos do Karpathy e os docs da Anthropic mudam de URL, o conteúdo não.*
