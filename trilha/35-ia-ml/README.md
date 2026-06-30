# 35 — IA & Machine Learning do zero

> **Comece por aqui se nunca viu ML.** Esta trilha assume que você programa (JS/TS) mas nunca estudou machine learning. O objetivo é **entendimento de verdade** dos fundamentos e do vocabulário — "machine learning", "training", "inference", "embeddings", "transformers" — com intuição que gruda, não fórmula decorada. Cada módulo: conceito → analogia → exemplo → pegadinha.

## Foco

Sair de "IA é mágica" para conseguir **explicar como funciona e usar na prática como dev**: desde o que é aprender com exemplos até chamar uma API de LLM, montar RAG e decidir entre prompt, RAG e fine-tuning. Sem matemática pesada; quando ela aparece, vem explicada em português primeiro.

## Módulos

| # | Módulo | O que você sai sabendo |
|---|---|---|
| 01 | [O que é Machine Learning de verdade](01-o-que-e-ml.md) | Código = regras escritas à mão; ML = a máquina infere as regras dos exemplos; quando vale a pena |
| 02 | [Os 3 tipos de aprendizado](02-tipos-de-aprendizado.md) | Supervisionado, não-supervisionado e por reforço — exemplo concreto de cada |
| 03 | [Dados, features e o ciclo treino/teste](03-dados-features-treino-teste.md) | Dataset, feature/label, split treino/validação/teste, overfitting vs underfitting, por que mais dados ganha |
| 04 | [Como um modelo "aprende"](04-como-um-modelo-aprende.md) | Loss, gradient descent ("descer a montanha no escuro"), learning rate, épocas, pesos |
| 05 | [Modelos clássicos antes do deep learning](05-modelos-classicos.md) | Regressão linear/logística, árvores de decisão, k-NN — intuição e onde ainda dominam |
| 06 | [Redes neurais e deep learning](06-redes-neurais-deep-learning.md) | Neurônio = soma ponderada + ativação; camadas; por que "profundo"; dados + GPU |
| 07 | [LLMs e Transformers por dentro](07-llms-transformers.md) | Tokens, embeddings, atenção, prever o próximo token, treino vs inferência, contexto, alucinação |
| 08 | [Usar IA na prática como dev](08-usar-ia-na-pratica.md) | Chamar API de LLM, prompt engineering, RAG, prompt vs RAG vs fine-tuning, custo por token, busca semântica |

## Como percorrer

Leia **na ordem** — cada módulo apoia no anterior. 01–04 são o núcleo conceitual (o que é aprender). 05–06 mostram os modelos (clássicos → redes profundas). 07–08 chegam onde você de fato vai atuar: LLMs e como usá-los no seu produto.

Cada módulo fecha com um trecho **"Em entrevista:"** — resposta pronta de 1-2 frases pra recitar. Decore esses; são o resumo destilado de cada tema.
