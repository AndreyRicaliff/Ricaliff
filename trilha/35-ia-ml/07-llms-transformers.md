# 07 — LLMs e Transformers por dentro

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Um **LLM (Large Language Model)** — GPT, Claude, Llama — é uma rede neural gigante (módulo 06) treinada para uma tarefa absurdamente simples de enunciar: **prever o próximo token**. Só isso. Toda a aparência de "raciocínio", "escrever código" e "conversar" emerge dessa única tarefa feita em escala monstruosa. A arquitetura que tornou isso possível é o **Transformer** (**Vaswani et al., 2017**, *"Attention Is All You Need"*). Este módulo abre a caixa: tokens, embeddings, atenção, por que prever a próxima palavra vira competência, treino vs inferência, e os dois pontos onde a literatura ainda discorda — habilidades emergentes e alucinação.

---

## § BASE — o fundamento

**Tokens — o LLM não vê letras nem palavras.** O modelo não processa texto cru; primeiro o texto é quebrado em **tokens**, pedaços de palavra, por um algoritmo tipo **BPE (Byte-Pair Encoding)** — a variante para NLP é de **Sennrich et al. (2016)**. Um token é ~4 caracteres ou ~0,75 palavra em inglês (em português costuma ser pior, mais tokens por palavra).

```text
"Machine learning é incrível"
 ↓ tokenização (BPE)
["Machine", " learning", " é", " incr", "ível"]   ← cada um vira um número (id)
[ 24891,     6509,        425,  9123,    772 ]
```

Isso importa para você por dois motivos concretos: você **paga por token** (módulo 08) e o **limite de contexto** é contado em tokens. "Conte as letras desta palavra" confunde o LLM justamente porque ele vê tokens, não letras.

**Embeddings — significado como coordenadas.** Cada token vira um **embedding**: uma lista longa de números (centenas a milhares) que representa o **significado** como um **ponto num espaço de muitas dimensões**. A ideia que gruda: **significados parecidos ficam perto**; diferentes ficam longe. O marco é o **word2vec** de **Mikolov et al. (2013)**, que revelou o fato clássico: a **direção** entre pontos carrega significado — `rei − homem + mulher ≈ rainha`. A relação "masculino→feminino" é uma direção quase constante no espaço. O modelo aprende essa **geometria do significado** a partir de bilhões de frases. (No módulo 08 você usa embeddings na prática para **busca semântica** — buscar por significado, não por palavra exata — que é um k-NN nesse espaço, módulo 05.)

**Atenção — a peça central do Transformer.** O problema da linguagem: o sentido de uma palavra depende das outras, às vezes distantes. Em *"o banco estava cheio, sentei e fiquei vendo o rio"*, o que faz "banco" ser assento e não instituição são "sentei" e "rio". O mecanismo de **atenção (attention)** resolve: ao processar cada token, o modelo **olha todos os outros tokens e decide a quais prestar atenção** (dá um peso a cada um), ajustando o significado conforme o contexto.

```text
processando "banco":
   o   banco  estava  ...  sentei  ...  rio
        ▲                    ▲          ▲
        └──── atenção forte ─┴──────────┘   → "banco" = assento, não dinheiro
```

A sacada de **Vaswani et al. (2017)** foi jogar fora a recorrência das RNNs anteriores (que liam token a token, em ordem) e usar **só atenção**, olhando **todos os tokens de uma vez, em paralelo**. Isso paraleliza lindamente em GPU (módulo 06) e foi o que permitiu treinar em escala da internet inteira. "Attention is all you need" = a atenção, sozinha, basta.

**Por que prever o próximo token vira competência.** Parece bobo, mas: para prever bem a próxima palavra de *qualquer* texto da internet, o modelo é **forçado** a aprender gramática, fatos, lógica, estilo, código, raciocínio — porque tudo isso aparece nos padrões do texto. Prever o fim de "A capital da França é ___" exige geografia; prever a próxima linha de uma função exige entender a lógica. A tarefa simples, em escala massiva, **obriga** a competência geral a emergir. **Brown et al. (2020)**, no **GPT-3** (175 bilhões de parâmetros), mostraram o fenômeno que redefiniu o campo: o **in-context learning** — o modelo aprende uma tarefa nova **só com exemplos no prompt** (few-shot), sem re-treinar nenhum peso. Geração é **autoregressiva**: prevê um token, anexa, prevê o próximo com o texto já maior, repete — uma palavra por vez.

**Treino vs inferência — a distinção que mais cai.**
- **Treino:** o processo de **uma vez** (meses, milhares de GPUs, milhões de dólares) que ajusta os bilhões de pesos. Tem fases: **pré-treino** (prever o próximo token em texto cru → aprende a língua e o mundo) e **alinhamento/RLHF** (humanos pontuam respostas, o modelo aprende a ser útil e seguro — **Ouyang et al., 2022**, InstructGPT; a variante da Anthropic é a **Constitutional AI**, **Bai et al., 2022**). Depois disso, **os pesos congelam**.
- **Inferência:** **cada vez** que você manda um prompt e recebe resposta. Os pesos **não mudam** — o modelo só roda pra frente gerando tokens. É barata e rápida perto do treino.

A consequência que confunde todo iniciante: **o LLM não aprende com a sua conversa.** Pesos congelados na inferência. Ele "lembra" do que você disse só porque o histórico inteiro é **reenviado** dentro do contexto a cada turno — não porque memorizou. O **context window (janela de contexto)** é o **máximo de tokens** que ele enxerga de uma vez (prompt + documentos + histórico + resposta). Estourou → o início é **truncado/esquecido**. Por isso conversas longuíssimas "esquecem" o começo. (No módulo 08 o **RAG** existe para colocar na mesa só o pedaço relevante de um acervo grande demais para caber.)

**Incerteza declarada #1 — habilidades emergentes: fenômeno real ou miragem de métrica?** **Wei et al. (2022)**, em *"Emergent Abilities of Large Language Models"*, reportaram que certas habilidades **aparecem de repente** acima de uma escala crítica — abaixo de um tamanho o modelo não faz aritmética de vários dígitos; acima, faz. Virou senso comum. Mas **Schaeffer, Miranda & Koyejo (2023)**, em *"Are Emergent Abilities of Large Language Models a Mirage?"* (NeurIPS), **contestaram**: o "salto" seria em boa parte **artefato da métrica** — métricas de tudo-ou-nada criam degraus abruptos; troque por uma métrica contínua e a melhora vira **suave e previsível**. **Onde a coisa está:** sem consenso fechado — provavelmente há dos dois. A resposta madura foge do hype ("o modelo ganhou consciência aos X bilhões") e da negação total: "a literatura ainda discute, e parte do salto é escolha de métrica".

**Incerteza declarada #2 — alucinação: propriedade estatística, não bug.** O LLM gera o texto **mais plausível**, não o mais **verdadeiro** — são coisas diferentes. Quando não sabe, em vez de calar, ele **completa com algo que soa certo**: cita uma lei inexistente, inventa uma função de biblioteca, erra uma data com total confiança. Isso é **alucinação**, e é **inerente** a como ele funciona — prever o próximo token plausível. **Por quê:** nada no objetivo de treino premia "dizer que não sei"; premia continuar o texto de forma convincente (survey de referência: **Ji et al., 2023**, *"Survey of Hallucination in Natural Language Generation"*, ACM Computing Surveys). Resultados teóricos recentes **argumentam** que alucinação é *inevitável* em qualquer LLM — **Xu et al. (2024)**, *"Hallucination is Inevitable"*, e **Kalai & Vempala (2024)**, ligando-a à calibração estatística — mas são argumentos formais sob premissas, ainda debatidos. O consensual é que alucinação **se mitiga, não se cura**: dar a fonte no contexto (**RAG**, módulo 08), pedir citações, baixar a temperatura, e **sempre verificar** fato crítico (nomes, números, API). Regra de ouro: trate a saída do LLM como rascunho de um estagiário brilhante e confiante demais — revise antes de confiar.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O pipeline de uma resposta, do texto ao token gerado:

```text
TEXTO ──tokenização(BPE)──► TOKENS ──► EMBEDDINGS (ponto no espaço de significado)
                                            │
                                    camadas de ATENÇÃO (cada token olha os outros,
                                    em paralelo — Vaswani 2017)
                                            │
                                    prevê distribuição do PRÓXIMO token
                                            │
                                    amostra 1 token ──► anexa ──► repete (autoregressivo)
```

As duas fases de vida, e o que congela:

```text
   ┌──────────── TREINO (uma vez, caro) ────────────┐   ┌─── INFERÊNCIA (cada chamada) ──┐
   │ pré-treino: prever próximo token em texto cru  │   │ pesos CONGELADOS               │
   │  → aprende língua, fatos, lógica               │   │ só roda pra frente             │
   │ alinhamento: RLHF (Ouyang) / Constitutional    │   │ "lembra" = histórico REENVIADO │
   │  AI (Bai) → útil e seguro                       │   │ limitado pela context window   │
   │  ► PESOS CONGELAM ──────────────────────────────┼──►│ NÃO aprende da sua conversa    │
   └─────────────────────────────────────────────────┘   └────────────────────────────────┘
```

Os dois pontos de incerteza, mapeados:
```
   habilidades emergentes:  Wei 2022 (salto real) ⚔ Schaeffer 2023 (miragem de métrica)
   alucinação:              propriedade estatística do "próximo token plausível"
                            └ mitiga (RAG, citação, verificar) — não cura
```

---

## § METODOLOGIA — o passo-a-passo replicável

Como raciocinar sobre um LLM em produção sem se enganar:

**1. Pense em tokens, não em palavras.** Custo e limite de contexto são em tokens; tarefas de caractere (contar letras, reverter string) são hostis ao modelo por design.

**2. Assuma que os pesos estão congelados na inferência.** O modelo não aprende da sua conversa. Todo "estado" que você quer que ele lembre tem que estar **no contexto** (histórico reenviado ou RAG).

**3. Orce a context window como memória de trabalho finita.** O que não cabe é esquecido. Conversas longas precisam de resumo ou recuperação seletiva (módulo 08), não de "mandar tudo".

**4. Trate toda saída como plausível-por-padrão, não verdadeira.** Fato crítico (nome, número, endpoint de API, lei) exige verificação externa. Alucinação é propriedade do sistema, não acidente.

**5. Calibre seu discurso sobre "capacidades" pela incerteza real.** Não afirme que o modelo "entende" ou "ganhou uma habilidade emergente" como fato — a literatura discute. Descreva comportamento observável, não estados mentais.

**Anti-padrões:**
- **"O LLM aprende comigo":** achar que a conversa treina o modelo. Pesos congelados; ele só relê o histórico que cabe.
- **Confiar em fato sem verificar:** aceitar citação, número ou API que o modelo deu. Alucinação soa exatamente igual à verdade — a confiança do texto não é sinal de correção.
- **Hype de emergência:** narrar "o modelo desenvolveu X sozinho ao atingir Y bilhões" como fato. Parte do salto é métrica (Schaeffer 2023) — declare a controvérsia.
- **Tarefa de caractere num modelo de token:** pedir contagem de letras ou manipulação de string char-a-char e estranhar o erro. É limitação da tokenização, não burrice do modelo.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Antecipe o **Lab "let's build GPT"** do syllabus, na intuição, com a Claude API à mão:

1. Conte os **tokens** de uma frase (tokenizer online ou o uso retornado pela API). Compare o mesmo texto em PT e EN — PT gasta mais tokens.
2. Peça "conte as letras de 'paralelepípedo'" e observe o erro. Explique-o pela tokenização.
3. Em duas chamadas separadas, conte algo na primeira; na segunda, sem reenviar o histórico, pergunte o que disse. Confirme que ele **não lembra** — pesos congelados.
4. Provoque uma **alucinação**: peça a "função `xyz` da lib tal" que não existe; veja se ele inventa com confiança. Repita dando a doc no contexto (mini-RAG) e compare.
5. Escreva, em uma frase honesta, sua posição sobre habilidades emergentes citando os **dois lados** (Wei vs Schaeffer).

## Por que cai em entrevista

LLM é o tema quente — e o entrevistador testa se você entende a máquina ou repete marketing. A resposta forte tem o pipeline (token → embedding → atenção → próximo token), a distinção treino/inferência (o "não aprende da conversa"), e — o que impressiona — trata emergência e alucinação com a incerteza que a literatura exige.

> **P:** "Explica, por alto, como um LLM funciona por dentro."
>
> **R (30s):** "Um LLM é uma rede neural treinada só pra prever o próximo token, mas em escala da internet isso força ele a aprender gramática, fatos e lógica. O texto vira tokens, cada token vira um embedding — um ponto num espaço onde significados parecidos ficam perto — e o mecanismo de atenção deixa cada token olhar os outros pra se desambiguar pelo contexto. Treino é a fase única e cara que ajusta os pesos; inferência é cada chamada, com os pesos congelados — por isso ele não aprende da minha conversa, só relê o histórico que cabe na context window. E alucinação acontece porque ele gera o mais plausível, não o mais verdadeiro."

> **P:** "As tais 'habilidades emergentes' dos LLMs são reais?"
>
> **R (30s):** "Depende de quem você lê, e é honesto dizer isso. O Wei e colegas em 2022 reportaram que certas habilidades aparecem de repente acima de uma escala crítica — abaixo o modelo não faz, acima faz. Mas em 2023 o Schaeffer publicou 'Are Emergent Abilities a Mirage?' argumentando que boa parte desse salto é artefato da métrica: métricas de tudo-ou-nada criam degraus abruptos, e com uma métrica contínua a melhora vira suave e previsível. Não tem consenso fechado — provavelmente tem dos dois. Então eu não afirmo que o modelo 'ganhou uma capacidade mágica' num tamanho X; descrevo o comportamento observável e reconheço que parte do efeito é escolha de medição."

## Checkpoint

- [ ] Explico o pipeline token → embedding → atenção → próximo token (autoregressivo)
- [ ] Sei por que a atenção (Vaswani 2017) substituiu as RNNs e permitiu treinar em escala
- [ ] Distingo treino de inferência e explico por que o LLM não aprende da minha conversa
- [ ] Entendo context window como memória de trabalho finita e por que conversas longas "esquecem"
- [ ] Trato alucinação como propriedade estatística (mitiga, não cura) e verifico fato crítico
- [ ] Discuto habilidades emergentes com os dois lados (Wei 2022 vs Schaeffer 2023), sem hype

## Recursos

- *Attention Is All You Need* — Vaswani et al. (2017): a arquitetura Transformer e o mecanismo de atenção
- *Efficient Estimation of Word Representations in Vector Space (word2vec)* — Mikolov et al. (2013): embeddings e a geometria do significado
- *Language Models are Few-Shot Learners (GPT-3)* — Brown et al. (2020): escala e in-context learning
- *Training LMs to Follow Instructions with Human Feedback (InstructGPT)* — Ouyang et al. (2022) e *Constitutional AI* — Bai et al. (2022): o alinhamento
- *Emergent Abilities of LLMs* — Wei et al. (2022) **vs** *Are Emergent Abilities a Mirage?* — Schaeffer et al. (2023): a controvérsia da emergência
- *Survey of Hallucination in NLG* — Ji et al. (2023); *Hallucination is Inevitable* — Xu et al. (2024): a alucinação como propriedade
- Andrej Karpathy — "Let's build GPT" e "Let's build the GPT Tokenizer": atenção, embeddings e BPE recodados
