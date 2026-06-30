# 08 — Usar IA na prática como dev

## O que é

Você não vai treinar um LLM — isso custa milhões (módulo 07). Como dev, você **consome** LLMs via API e os encaixa no seu produto. Seu trabalho é escolher a técnica certa (prompt, RAG ou fine-tuning), controlar custo e tratar a saída como o rascunho de um estagiário confiante demais.

## Chamar a API de um LLM

Você manda uma lista de **mensagens** (papéis: `system` define o comportamento, `user` é o pedido) e recebe tokens de volta. Exemplo com a API da Anthropic (Claude):

```ts
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) // NUNCA hardcode a chave

const res = await client.messages.create({
  model: "claude-opus-4-8",          // id atual (jun/2026) — confira na doc, modelos mudam
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

Pontos que sempre pegam o iniciante:
- **`temperature`**: controla a aleatoriedade. `0` pra extração/classificação/código (quer a mesma resposta sempre); mais alto pra brainstorm/texto criativo.
- **A chamada é stateless**: a API **não lembra** da conversa anterior. Pra manter contexto, você reenvia o histórico inteiro a cada chamada (e paga por ele de novo).
- **Streaming**: pra UX de "digitando ao vivo", use a versão que devolve tokens conforme saem.
- **Trate como I/O instável**: rede, rate limit, JSON malformado. Valide a saída na boundary (ex.: parse + Zod) — o modelo às vezes devolve texto fora do formato pedido.

## Custo: você paga por token (entrada + saída)

A conta é **por token**, separando **input** (tudo que você manda: system + histórico + documentos) e **output** (o que ele gera). Output costuma custar várias vezes mais que input. Implicações diretas no seu bolso:

- Mandar um PDF gigante de contexto a cada turno **multiplica o custo** — porque o input inteiro é cobrado **toda** chamada.
- Conversa longa fica cara progressivamente: o histórico cresce e você re-paga por ele.
- Otimizações: enviar só o trecho relevante (RAG, abaixo), resumir histórico antigo, usar um modelo menor/barato pra tarefas simples, e **prompt caching** (a API cacheia o prefixo repetido — confira na doc).

## Prompt engineering básico

O prompt é a interface de programação do LLM. O que mais move o ponteiro:

1. **Seja específico e dê o formato exato.** "Responda em JSON com as chaves `nome` e `valor`" > "me dê os dados".
2. **Dê exemplos (few-shot).** Mostrar 2–3 pares entrada→saída desejada ensina o padrão melhor que qualquer explicação.
3. **Peça raciocínio passo a passo** (chain-of-thought) em tarefas de lógica/conta — "pense passo a passo antes de responder" mede mais acerto.
4. **Use o `system` pra papel e regras fixas**; o `user` pro pedido variável.
5. **Delimite os dados** com marcadores (```, tags) pra separar instrução de conteúdo — também reduz injeção de prompt.

## As 3 formas de "dar conhecimento" ao modelo — e quando usar cada

O LLM só sabe o que viu no treino (até a data de corte) e o que está no contexto agora. Pra ele saber dos **seus** dados, há três caminhos:

### Prompt / In-context
Você cola a informação **direto no prompt**. Simples, instantâneo, zero infra. Limite: tem que caber na context window e você re-paga o input toda vez. Bom pra pouca informação e pontual.

### RAG (Retrieval-Augmented Generation) — dar os documentos certos no contexto
A técnica mais útil pro dia a dia. Em vez de despejar todo o acervo (não cabe e é caro), você **busca só os trechos relevantes** e os injeta no prompt junto da pergunta. O modelo responde **ancorado** nesses documentos — o que **reduz alucinação** e permite citar fonte.

Como funciona, usando **embeddings** (módulo 07) pra busca **semântica** (por significado, não palavra exata):

```text
1. INDEXAÇÃO (uma vez): quebra seus docs em pedaços (chunks) →
   gera o embedding de cada um → guarda num banco vetorial (vector DB)
2. CONSULTA (cada pergunta):
   embedding da pergunta → busca os chunks mais PRÓXIMOS no espaço vetorial →
   monta o prompt: [trechos achados] + [pergunta do usuário] → manda pro LLM →
   resposta fundamentada nos SEUS dados, com citação
```

```ts
// 1. transformar texto em vetor de significado
const { data } = await client.embeddings // (API de embeddings)
// 2. "próximo no espaço vetorial" = "parecido em significado" (módulo 05, k-NN / módulo 07)
// 3. um vector DB (pgvector, Pinecone, etc.) faz essa busca por similaridade rápido
```

Use RAG quando: conhecimento **muda** (docs internos, base de produto), precisa de **fonte citável**, ou o acervo é grande demais pro contexto. É a resposta certa pra ~80% dos "quero um chatbot sobre os nossos documentos".

### Fine-tuning — re-treinar o modelo nos seus exemplos
Você pega o modelo pronto e **continua o treino** (ajusta pesos, módulo 04) com milhares dos seus exemplos, pra ele incorporar um **estilo/formato/comportamento** específico. Caro, lento, exige dataset bom e re-treino quando algo muda. **NÃO** é a forma de "ensinar fatos novos" — pra fatos, use RAG.

### Como escolher

| Precisa de... | Use |
|---|---|
| Tarefa pontual, pouca info extra | **Prompt** (cole no contexto) |
| Responder sobre SEUS documentos / fatos que mudam / citar fonte | **RAG** |
| Estilo, tom ou formato muito específico e consistente | **Fine-tuning** |
| Reduzir alucinação sobre dados internos | **RAG** (não fine-tuning) |
| Menor custo e complexidade pra começar | **Prompt → depois RAG → fine-tuning só se necessário** |

Ordem de ataque na vida real: **comece com prompt**. Não bastou, vá pra **RAG**. Só parta pro **fine-tuning** se prompt + RAG não entregarem o estilo/comportamento — ele é o último recurso, não o primeiro.

## Embeddings também servem além de RAG

O mesmo "texto → vetor de significado" resolve **busca semântica** (achar por sentido, não keyword), **deduplicação** (itens parecidos ficam próximos), **classificação** e **recomendação**. Sempre que o problema for "quão parecidos são estes dois textos?", embeddings + distância (módulo 05) é a ferramenta.

**Em entrevista:** "Como dev eu consumo o LLM por API: mando mensagens com um system prompt e pago por token de entrada e saída, com temperature baixa pra tarefa factual. Pra dar conhecimento dos meus dados ao modelo tem três caminhos: colar no prompt pra coisa pontual; RAG, que busca os trechos relevantes por embedding e injeta no contexto pra reduzir alucinação e citar fonte — é o que eu uso na maioria dos casos; e fine-tuning, que re-treina o modelo, mas serve pra estilo, não pra fatos. A ordem certa é prompt → RAG → fine-tuning só em último caso."
