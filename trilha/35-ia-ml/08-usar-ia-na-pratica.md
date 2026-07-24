# 08 — Usar IA na prática como dev

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na
> mesa), §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Você não vai treinar um LLM — isso custa milhões (módulo 07) e, pior, seria desperdício: **Hoffmann et al. (2022)** (Chinchilla) mostraram que treinar um modelo competitivo exige trilhões de tokens e um orçamento de compute que nenhum produto normal justifica. Como dev, você **consome** LLMs via API e os encaixa no seu produto. Seu trabalho é escolher a técnica certa (prompt, RAG ou fine-tuning), controlar custo e tratar a saída como o rascunho de um estagiário confiante demais. Este módulo é o que você de fato vai fazer no trabalho.

---

## § BASE — o fundamento

**A API é stateless e você paga por token.** Você manda uma lista de **mensagens** (papéis: `system` define o comportamento, `user` é o pedido) e recebe tokens de volta. A conta é **por token**, separando **input** (system + histórico + documentos) e **output** (o que ele gera) — e output costuma custar **várias vezes** mais que input (confira os preços atuais na doc da Anthropic; eles mudam). Como a chamada é **stateless** (módulo 07 — pesos congelados), a API **não lembra** da conversa: para manter contexto você **reenvia o histórico inteiro** a cada chamada, e **re-paga** por ele. Implicação direta no bolso: mandar um PDF gigante a cada turno **multiplica o custo**, porque o input inteiro é cobrado toda vez. Referências oficiais por seção: **Anthropic — "Getting started"** (a chamada) e **"Prompt engineering overview"** (como estruturar).

```ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) // NUNCA hardcode a chave

const res = await client.messages.create({
  model: "claude-opus-4-8",          // id atual (2026) — confira na doc, modelos mudam
  max_tokens: 1024,                  // teto de tokens da RESPOSTA (você paga por eles)
  temperature: 0,                    // 0 = determinístico/factual; ~0.8 = criativo
  system: "Você é um extrator de dados. Responda só com JSON válido.",
  messages: [
    { role: "user", content: "Extraia nome e valor: 'Pagamento de R$ 1.250 para Maria Silva'" },
  ],
})

console.log(res.content[0].type === "text" && res.content[0].text)
// → {"nome": "Maria Silva", "valor": 1250}
```

Pontos que sempre pegam o iniciante: **`temperature`** controla a aleatoriedade — `0` para extração/classificação/código (quer a mesma resposta sempre), mais alto para brainstorm; **streaming** para UX de "digitando ao vivo"; e **trate como I/O instável** — rede, rate limit, JSON malformado. Valide a saída na boundary (parse + Zod), porque o modelo às vezes devolve texto fora do formato pedido.

**Prompt engineering tem base empírica, não é adivinhação.** O prompt é a interface de programação do LLM, e as técnicas que movem o ponteiro têm papers por trás:
- **Few-shot (dar 2–3 exemplos entrada→saída):** **Brown et al. (2020)**, no GPT-3, mostraram que exemplos no prompt ensinam a tarefa **sem re-treinar** — é o *in-context learning* (módulo 07). Mostrar o padrão bate qualquer explicação.
- **Chain-of-thought ("pense passo a passo"):** **Wei et al. (2022)**, *"Chain-of-Thought Prompting Elicits Reasoning..."*, mediram que pedir o raciocínio explícito **aumenta o acerto** em tarefas de lógica e conta. Não é folclore; é resultado replicado.
- **Ser específico e dar o formato exato, usar `system` para papel/regras fixas, e delimitar os dados** (```, tags) para separar instrução de conteúdo — isso também reduz **injeção de prompt**. É o que a doc **"Prompt engineering overview"** da Anthropic sistematiza.

**Tool use / function calling — o LLM como orquestrador.** Além de texto, o modelo pode **pedir para chamar funções que você define** (buscar no banco, consultar um ERP-externo, fazer uma conta): você descreve as ferramentas, o modelo decide quando usá-las e com que argumentos, você executa e devolve o resultado. É a base dos "agentes". Referência: **Anthropic — "Tool use"** (doc oficial). O ponto de segurança: **valide os argumentos** que o modelo propõe como você validaria input de usuário — ele pode alucinar parâmetros.

**As 3 formas de "dar conhecimento" ao modelo.** O LLM só sabe o que viu no treino (até a data de corte) e o que está no contexto agora. Para ele saber dos **seus** dados:

1. **Prompt / In-context:** cole a informação **direto no prompt**. Simples, instantâneo, zero infra. Limite: tem que caber na context window e você re-paga o input toda vez. Bom para pouca informação e pontual.

2. **RAG (Retrieval-Augmented Generation):** a técnica mais útil do dia a dia, formalizada por **Lewis et al. (2020)**, *"Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks"* (NeurIPS). Em vez de despejar todo o acervo (não cabe e é caro), você **busca só os trechos relevantes** e os injeta no prompt junto da pergunta. O modelo responde **ancorado** nesses documentos — o que **reduz alucinação** (módulo 07) e permite **citar fonte**. A busca usa **embeddings** (módulo 07) para similaridade **semântica** (por significado, não palavra exata) — um k-NN (módulo 05) num banco vetorial.

```text
1. INDEXAÇÃO (uma vez): quebra seus docs em pedaços (chunks) →
   gera o embedding de cada um → guarda num banco vetorial (vector DB)
2. CONSULTA (cada pergunta):
   embedding da pergunta → busca os chunks mais PRÓXIMOS no espaço vetorial →
   monta o prompt: [trechos achados] + [pergunta do usuário] → manda pro LLM →
   resposta fundamentada nos SEUS dados, com citação
```

3. **Fine-tuning:** pegue o modelo pronto e **continue o treino** (ajusta pesos, módulo 04) com milhares dos seus exemplos, para ele incorporar um **estilo/formato/comportamento** específico. Caro, lento, exige dataset bom e re-treino quando algo muda. **NÃO** é a forma de "ensinar fatos novos" — para fatos, use RAG. Fine-tuning muda **como** o modelo responde, não **o que** ele sabe.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A ordem de ataque, do mais barato ao mais caro (regra de ouro da vida real):

```text
   PROMPT  ──não bastou──►  RAG  ──não bastou──►  FINE-TUNING
   (zero infra,             (busca trecho          (re-treina pesos,
    cole no contexto)        relevante, cita)       estilo/formato)
   │                        │                       │
   pouca info pontual       fatos que MUDAM,        tom/formato muito
                            citar fonte, acervo     específico e
                            grande (Lewis 2020)     consistente
```

Qual técnica resolve o quê (a decisão que mais cai):

| Precisa de... | Use |
|---|---|
| Tarefa pontual, pouca info extra | **Prompt** (cole no contexto) |
| Responder sobre SEUS documentos / fatos que mudam / citar fonte | **RAG** |
| Estilo, tom ou formato muito específico e consistente | **Fine-tuning** |
| Reduzir alucinação sobre dados internos | **RAG** (não fine-tuning) |
| Menor custo e complexidade pra começar | **Prompt → depois RAG → fine-tuning só se necessário** |

Os alavancas de custo (tudo cobrado por token):
```
   input barateia com: RAG (só o trecho) · resumir histórico · prompt caching
   output barateia com: max_tokens justo · modelo menor pra tarefa simples
   armadilha: PDF gigante reenviado todo turno = input cobrado N vezes
```

Embeddings não servem só a RAG: o mesmo "texto → vetor de significado" resolve **busca semântica**, **deduplicação** (itens parecidos ficam próximos), **classificação** e **recomendação**. Sempre que o problema for "quão parecidos são estes dois textos?", é embeddings + distância (módulo 05).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. Comece com prompt.** Estruture: `system` para papel e regras fixas, `user` para o pedido variável, formato de saída explícito, e **few-shot** (2–3 exemplos) se a tarefa tem padrão (Brown 2020). Peça **chain-of-thought** em lógica/conta (Wei 2022). Isso resolve a maioria dos casos sem nenhuma infra.

**2. Fixe `temperature` pela natureza da tarefa.** `0` para extração/classificação/código (reprodutível); mais alto só para criatividade.

**3. Valide a saída na boundary.** Parse + schema (Zod). O modelo é I/O instável — trate JSON malformado, rate limit e retry como você trataria qualquer rede.

**4. Se precisa dos SEUS dados ou de citar fonte, vá para RAG.** Indexe uma vez (chunk → embedding → vector DB), recupere por similaridade a cada pergunta, injete os trechos no prompt. Reduz alucinação e cita fonte (Lewis 2020).

**5. Só parta para fine-tuning se prompt + RAG não entregarem o estilo/comportamento.** É o último recurso, não o primeiro — e nunca para "ensinar fatos" (isso é RAG).

**6. Controle o custo como parte do design.** Envie só o trecho relevante (RAG), resuma histórico antigo, use modelo menor para tarefa simples, e **prompt caching** para o prefixo repetido (confira na doc).

**Anti-padrões:**
- **Fine-tuning para ensinar fatos:** re-treinar o modelo para ele "saber" seus documentos. Errado e caro — fatos que mudam pedem RAG; fine-tuning muda estilo, não conhecimento.
- **Chave hardcoded:** `apiKey` no código. Vai para `.env` (regra da casa). Chave vazada = revogar antes de qualquer coisa.
- **Confiar no output sem validar:** aceitar o JSON do modelo direto. Valide na boundary — ele às vezes foge do formato.
- **Reenviar o mundo a cada turno:** mandar o PDF/histórico inteiro sempre. Input é cobrado toda chamada; use RAG e resumo.
- **Pular a ordem prompt → RAG → fine-tuning:** começar pelo mais caro. Quase sempre prompt (ou prompt+RAG) resolve por uma fração do custo e da complexidade.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Este é o **Lab 3 (`claude-judge`)** do syllabus — comece por ele:

1. Faça **uma** chamada real à Claude API (chave em `.env`, nunca no código) que classifique um texto (ex.: sentimento de avaliações de um **Cliente Varejo**) com `system` claro e formato de saída fixo. Valide o retorno com um parse.
2. Escreva **duas variantes** do prompt: uma sem exemplos, outra **few-shot** (2–3 exemplos). Rode as duas sobre o mesmo conjunto rotulado e **compare a acurácia** — você acabou de fazer um LLM-as-judge.
3. Force **temperature 0** e rode duas vezes: confirme a reprodutibilidade. Suba para 0.8 e veja a variação.
4. Registre o **custo** da rodada (tokens de input/output) — é critério de "pronto" do Lab 3.
5. Escreva, em uma frase, quando esse mesmo problema exigiria **RAG** em vez de prompt (se as categorias dependessem de documentos internos que mudam).

## Por que cai em entrevista

"Como você daria conhecimento dos nossos dados ao modelo?" é a pergunta prática que todo time de produto faz. A resposta forte tem a ordem prompt → RAG → fine-tuning, sabe que RAG (não fine-tuning) é o caminho para fatos e citação, e demonstra consciência de custo por token.

> **P:** "Como você usa um LLM num produto e como dá a ele conhecimento dos seus dados?"
>
> **R (30s):** "Como dev eu consumo o LLM por API: mando mensagens com um system prompt e pago por token de entrada e saída, com temperature baixa pra tarefa factual. Pra dar conhecimento dos meus dados ao modelo tem três caminhos: colar no prompt pra coisa pontual; RAG, que busca os trechos relevantes por embedding e injeta no contexto pra reduzir alucinação e citar fonte — é o que eu uso na maioria dos casos; e fine-tuning, que re-treina o modelo, mas serve pra estilo, não pra fatos. A ordem certa é prompt → RAG → fine-tuning só em último caso."

> **P:** "Quando RAG e quando fine-tuning? Qual o erro comum?"
>
> **R (30s):** "RAG quando o conhecimento muda, precisa citar fonte ou o acervo é grande demais pro contexto — eu busco os trechos relevantes por embedding e injeto no prompt, o que ancora a resposta e reduz alucinação; foi o que o Lewis formalizou em 2020. Fine-tuning quando eu quero um estilo, tom ou formato muito específico e consistente — ele muda *como* o modelo responde, ajustando pesos, não *o que* ele sabe. O erro clássico é usar fine-tuning pra 'ensinar fatos novos': é caro, lento, e todo update de fato exige re-treinar. Fato que muda é RAG, sempre. E na dúvida, a ordem é prompt primeiro, RAG depois, fine-tuning só se os dois não bastarem."

## Checkpoint

- [ ] Faço uma chamada à Claude API com `system`/`user`, `temperature` certa e chave em `.env`
- [ ] Sei que a API é stateless e que reenviar histórico/PDF re-paga o input toda vez
- [ ] Uso few-shot (Brown 2020) e chain-of-thought (Wei 2022) com consciência do porquê
- [ ] Escolho entre prompt, RAG e fine-tuning e sei que fatos que mudam são RAG, não fine-tuning
- [ ] Explico o pipeline de RAG (chunk → embedding → vector DB → recupera → injeta) e por que reduz alucinação
- [ ] Valido a saída do modelo na boundary e trato a chamada como I/O instável

## Recursos

- Anthropic docs — **"Prompt engineering overview"**, **"Getting started"** e **"Tool use"** (guias oficiais, por seção)
- *Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks* — Lewis et al. (2020): o paper do RAG
- *Language Models are Few-Shot Learners (GPT-3)* — Brown et al. (2020): in-context / few-shot learning
- *Chain-of-Thought Prompting Elicits Reasoning in LLMs* — Wei et al. (2022): o "pense passo a passo" medido
- *Training Compute-Optimal LLMs (Chinchilla)* — Hoffmann et al. (2022): por que você não treina o seu do zero
- *Efficient Estimation of Word Representations (word2vec)* — Mikolov et al. (2013): embeddings além do RAG
- Módulo-irmão `07-llms-transformers` — tokens, embeddings, atenção e por que alucinação existe
