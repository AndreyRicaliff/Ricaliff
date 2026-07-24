# 02 — Async, Event Loop e Promises

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — por que o JS é
> single-thread, o que é o runtime, a call stack e as duas filas), §Estruturação (como as tarefas
> se ordenam) e §Metodologia (como prever a saída e escolher a estratégia async) — além da
> prática, P/R e checkpoint. Teoria por extenso: resumo não forma.

## O que é

JavaScript roda em **uma thread só**. O *event loop* é o mecanismo que decide qual pedaço de código executa a seguir: ele tira tarefas de filas (microtasks, macrotasks) e empurra pra call stack. **Promises** representam um valor que ainda não chegou — ao resolver, o `.then`/`await` enfileira a continuação como **microtask**, que roda antes de qualquer macrotask (timers, I/O).

```js
console.log('A')
setTimeout(() => console.log('B'), 0)            // macrotask
Promise.resolve().then(() => console.log('C'))   // microtask
console.log('D')
// Saída: A, D, C, B
```

`async/await` é açúcar sintático: `await x` ≡ `x.then(...)`. O código depois do `await` **sai da call stack** e volta como microtask quando a Promise resolve.

---

## § BASE — o fundamento

**Por que uma thread só.** O JS nasceu pra rodar dentro do browser, manipulando a DOM. Se dois trechos de código pudessem tocar a mesma DOM ao mesmo tempo, você teria *data races* na interface — um handler apagando um nó que o outro está lendo. A decisão de 1995 foi radical e permanente: **um fio de execução, um evento por vez**. Isso elimina a classe inteira de bugs de concorrência com memória compartilhada (locks, mutexes, deadlocks) — o preço é que **nada pode bloquear**, porque bloquear a única thread congela a página inteira.

**O que é a "call stack".** É a mesma pilha de frames do módulo 01: cada chamada de função empurra um frame, cada retorno o remove. O JS executa **até a stack esvaziar** — esse é o conceito de *run-to-completion*: uma vez que uma função começa, ela roda sem ser interrompida até terminar. Nenhum evento externo fura a fila no meio de uma função. Isso é o que torna o modelo previsível.

**Onde o "async" acontece — o runtime não é só o motor.** Aqui está a confusão que derruba júnior: `setTimeout`, `fetch`, ler arquivo, timers — **nada disso é JavaScript**. O motor (V8) só sabe executar a linguagem. Quem oferece essas capacidades é o **host**: o browser (Web APIs — timers, DOM events, `fetch`, XHR) ou o Node (via **libuv**, uma biblioteca C que dá timers, I/O de disco/rede e um *thread pool* pra operações que o SO não faz async nativo). Quando você chama `setTimeout(fn, 0)`, o motor **entrega** o pedido ao host e **retorna imediatamente** — a stack continua. O host, lá fora, conta o tempo e, quando pronto, **enfileira** `fn` de volta pra thread do JS. O JS nunca "esperou" nada: ele delegou e seguiu.

**As duas filas + o loop.** Quando a call stack esvazia, o **event loop** entra em ação e puxa trabalho de duas filas com prioridades diferentes:

- **Macrotask queue** (task queue): callbacks de `setTimeout`/`setInterval`, eventos de I/O, eventos de UI. Uma por "volta" do loop.
- **Microtask queue** (na spec ECMAScript, a fila de *Jobs* — `PromiseJobs`): continuações de Promise (`.then`, `.catch`, `.finally`, o código depois de um `await`), `queueMicrotask`, `MutationObserver`.

O algoritmo do event loop (definido na **HTML Standard**, seção "event loops") é, em essência:

```
repita para sempre:
  1. pegue UMA macrotask da fila e execute-a até a stack esvaziar
  2. DRENE A FILA DE MICROTASKS INTEIRA
     (execute microtasks até a fila ficar vazia — microtask que cria
      microtask também roda nesta mesma rodada)
  3. (no browser) se for hora, renderize
  4. volte ao passo 1
```

O ponto que decide 90% das perguntas de saída: **entre cada macrotask, a fila de microtasks é esvaziada por completo.** Por isso toda Promise pendente resolve *antes* do próximo `setTimeout`, mesmo com timeout 0.

**Promise é uma máquina de estados.** Uma Promise tem três estados: `pending` → `fulfilled` (com um valor) **ou** `rejected` (com um motivo). A transição é **única e irreversível** — uma vez resolvida, nunca mais muda. `.then(onF, onR)` registra continuações; se a Promise já está resolvida quando você chama `.then`, a continuação ainda **não roda na hora** — é **agendada como microtask** (garantia da spec: `.then` é sempre assíncrono, nunca síncrono). Isso evita o "efeito Zalgo" (uma função que às vezes chama o callback já-já, às vezes depois — imprevisível).

**`async/await` é açúcar de Promise + geradores.** `async function` sempre retorna uma Promise. `await x` faz três coisas: (1) converte `x` numa Promise se não for; (2) **pausa** a função e devolve o controle pro chamador (a função "sai" da stack); (3) agenda a retomada como microtask pra quando `x` resolver. Ou seja, `await` não bloqueia a thread — ele **suspende só aquela função** e libera o loop pra fazer outra coisa. É por isso que dez `await`s independentes desperdiçam tempo: cada um suspende e retoma em série.

**Node vs browser — a mesma ideia, filas com mais fases.** No Node o libuv organiza o loop em **fases** (timers → pending callbacks → poll → check → close). `setTimeout` cai na fase *timers*; `setImmediate` na fase *check*; `process.nextTick` tem uma fila **ainda mais prioritária que as microtasks de Promise** (drena antes delas). No browser não existe `setImmediate`/`nextTick` — mas o conceito de "microtask antes de macrotask" é idêntico. Saber que o modelo é o mesmo, com nomes de fila diferentes, é o que te faz portar raciocínio entre os dois.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

```
        ┌─────────────────────────────────────────────┐
        │  CALL STACK (1 thread, run-to-completion)     │
        │  roda a função ATUAL até terminar             │
        └───────────────▲─────────────────┬────────────┘
                        │ empurra          │ delega (setTimeout, fetch…)
                        │                  ▼
                        │        ┌──────────────────────┐
                        │        │ HOST: Web APIs / libuv│  (fora do motor JS)
                        │        │ contam tempo, fazem I/O│
                        │        └──────────┬───────────┘
                        │ event loop        │ quando pronto, enfileira
        ┌───────────────┴───────────────────▼───────────────┐
        │ FILA DE MICROTASKS  (Promise .then, await, queue…) │ ← drenada INTEIRA
        │ FILA DE MACROTASKS  (setTimeout, I/O, eventos UI)  │ ← 1 por volta
        └────────────────────────────────────────────────────┘
    prioridade: microtasks esvaziam ANTES da próxima macrotask
    (Node: process.nextTick > Promise microtasks > macrotasks por fase)
```

**Estratégias de orquestração** (o que escolher quando há N operações async):

| Cenário | Use | Não use |
|---|---|---|
| 1 request, espera o resultado | `await fetch(...)` | callback aninhado |
| N requests **independentes** | `Promise.all(arr.map(...))` — paralelo | `for await` — serializa à toa |
| N requests, **uma falha não pode cancelar as outras** | `Promise.allSettled` | `Promise.all` (aborta no 1º reject) |
| Primeiro que responder ganha (timeout, fallback) | `Promise.race` / `Promise.any` | loop manual |
| N requests **dependentes** (B precisa de A) | `for...of` + `await` | `Promise.all` (não respeita dependência) |
| Iterar com efeito async | `for...of` + `await` | `forEach(async …)` — **não espera** |
| Fire-and-forget | sem `await`, com `.catch(logError)` | `await` desnecessário |

**Diferença `all` × `allSettled` × `race` × `any`:** `all` resolve com o array de valores, mas **rejeita no primeiro erro**. `allSettled` **nunca rejeita** — devolve `[{status:'fulfilled',value}|{status:'rejected',reason}]` pra cada uma. `race` resolve/rejeita com a **primeira que assentar** (seja sucesso ou erro). `any` resolve com a **primeira que der certo** (ignora erros até uma passar).

**Regra de bolso:** independentes → `Promise.all`; dependentes → `for...of` + `await`; quero todos os resultados mesmo com falha → `allSettled`; **NUNCA** `forEach` com `async` se você precisa esperar.

---

## § METODOLOGIA — o passo-a-passo replicável

**Prever a saída de um trecho misturando síncrono, `setTimeout` e `Promise`:**

1. **Rode todo o código síncrono primeiro.** Percorra linha a linha; tudo que não é agendamento executa **agora**, em ordem. Anote esses `console.log` — são os primeiros da saída.
2. **Ao encontrar um agendamento, classifique a fila.** `setTimeout`/`setInterval`/I/O → macrotask. `.then`/`await`/`queueMicrotask` → microtask. Não execute o callback ainda; só coloque na fila certa, na ordem em que apareceu.
3. **Stack esvaziou → drene TODAS as microtasks.** Execute-as em ordem de chegada. Se uma microtask agenda outra microtask, ela também roda **nesta mesma drenagem** (antes de qualquer macrotask).
4. **Pegue UMA macrotask.** Execute até a stack esvaziar de novo.
5. **Volte ao passo 3.** Drene microtasks de novo antes da próxima macrotask. Repita até as filas zerarem.

**Escolher a estratégia async pra N operações:**

1. **As chamadas dependem uma da outra?** Se B precisa do resultado de A → serial (`for...of` + `await`). Se não → candidatas a paralelo.
2. **Independentes: há rate limit?** Não → `Promise.all`. Sim → concorrência limitada (`p-limit`, ou lotes).
3. **Uma falha pode derrubar as outras?** Não pode → `allSettled` (colhe todos os resultados). Pode/deve → `all` (aborta cedo).
4. **Preciso do primeiro que responder?** `race` (qualquer assentamento) ou `any` (primeiro sucesso).

**Anti-padrões (o que NÃO fazer):**
- **`forEach(async item => await …)`** — `forEach` ignora a Promise retornada; o código segue antes das iterações terminarem. É o bug silencioso #1 de async. Use `for...of` + `await` (serial) ou `Promise.all(arr.map(...))` (paralelo).
- **`await` dentro de loop quando as iterações são independentes** — serializa sem motivo, N×t em vez de ~1×t. Junte com `Promise.all`.
- **`Promise.all` onde uma falha não podia abortar as outras** — perde os sucessos já obtidos. Use `allSettled`.
- **Esquecer o `.catch` num fire-and-forget** — vira *unhandled rejection* (no Node, pode derrubar o processo). Sempre `.catch(logError)`.
- **`new Promise` envolvendo algo que já é Promise** (*Promise constructor anti-pattern*) — desnecessário e engole erros; retorne a Promise direto.

---

## Passo-a-passo aplicado (faça agora, ~35min)

O `progress.md` marca **`await` dentro de `forEach`** como gap — e há ocorrência real no PULSAR-RH.

1. **Ache o caso:**
   ```bash
   cd ~/projetos/PULSAR-RH
   grep -rn "forEach" src/ --include="*.js" --include="*.ts" | grep -i "async\|await"
   ```
2. **Aplique a metodologia:** a função é `async`? Há `await` dentro do callback do `forEach`? As iterações são independentes ou uma depende da outra?
3. **Reescreva:** independentes → `await Promise.all(arr.map(async item => { … }))`; dependentes → `for (const item of arr) { await … }`.
4. **Antes disso, treine a previsão:** num arquivo `.js`, escreva 5 misturas de `console.log` + `setTimeout(…,0)` + `Promise.resolve().then` + `queueMicrotask`. **Escreva a ordem prevista** antes de rodar; depois rode e confira. Errou? Volte ao passo 3 da metodologia e refaça.
5. **Registre a decisão** no `DECISIONS.md` (problema: `forEach` não espera; opções `Promise.all` vs `for...of`; decisão + por quê; nota sobre rate limit).
6. **Commit:** `fix(perf): replace forEach+await with Promise.all in <arquivo>`.

---

## Por que cai em entrevista

É **o** tópico que separa quem leu doc de quem entende o runtime — cai em ~80% das entrevistas júnior de Node/React. Errar sinaliza "não entendeu o motor"; acertar com confiança passa o filtro. Variações:

- "Qual a saída desse código?" (mistura de `setTimeout`, `Promise.resolve`, `console.log`)
- "Diferença entre callback, Promise e async/await?"
- "Por que `forEach(async …)` não espera?"
- "O que acontece com uma `Promise.reject` sem `.catch`?"
- "Como roda 10 requests em paralelo? E sequencial?"
- "O que é microtask vs macrotask?"

> **P:** "Você tem um array de 100 IDs e precisa buscar cada um numa API. Como faz?"
>
> **R (30s):**
> "Depende de duas coisas: as chamadas são independentes? A API tem rate limit?
>
> Se são independentes e sem rate limit: `Promise.all(ids.map(id => fetch(...)))` — 100 em paralelo, mais rápido.
> Se tem rate limit: `p-limit` com concorrência tipo 5, ou loop `for...of` se quiser sequencial puro.
> Se uma falha não pode derrubar as outras: `Promise.allSettled` — me retorna o status de cada uma.
>
> O que eu **nunca** faço é `forEach(async ...)` — ele não espera, e o código segue antes das chamadas terminarem. É um bug silencioso clássico."

> **P:** "Por que `console.log('B')` aparece depois de `console.log('C')` no exemplo do topo?"
>
> **R (30s):**
> "Porque `Promise.resolve().then` enfileira na fila de **microtasks**, e `setTimeout` na de **macrotasks**. Depois que a call stack esvazia, o event loop drena **toda** a fila de microtasks antes de pegar a próxima macrotask. Por isso C (microtask) sai antes de B (macrotask), mesmo com timeout 0."

> **P:** "O `setTimeout` roda o código na hora? De quem é o timer?"
>
> **R (30s):**
> "Não roda na hora, e o timer não é do JavaScript. `setTimeout` é uma API do host — o browser (Web API) ou o Node (libuv). O motor só entrega o pedido e segue; a stack não espera. Quando o tempo passa, o host enfileira o callback como macrotask, e ele só executa quando a call stack esvazia e as microtasks pendentes são drenadas. Por isso o timeout é um **mínimo**, não um exato: se a thread está ocupada, o callback espera. `setTimeout(fn, 0)` não é 'agora', é 'na próxima volta livre do loop'."

## Checkpoint

- [ ] Explico por que o JS é single-thread e o que "run-to-completion" garante
- [ ] Sei que `setTimeout`/`fetch` são do host (Web API/libuv), não do motor — e o que isso implica
- [ ] Explico a diferença entre microtask e macrotask e por que microtask vence
- [ ] Previ a saída de 5 misturas de `setTimeout`/`Promise`/`queueMicrotask` ANTES de rodar, e acertei
- [ ] Refatorei ≥1 `forEach`+`await` real num projeto AG e registrei no `DECISIONS.md`
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Event Loop & Async dominado`.

---

## Recursos

- **Jake Archibald** — "Tasks, microtasks, queues and schedules" (o texto) e a talk "In The Loop" (JSConf 2018) — **a** referência sobre a ordem das filas
- **MDN** — "The event loop" e "Using promises" (guias do JavaScript reference)
- **You Don't Know JS** (Kyle Simpson) — volume *Async & Performance*, caps. sobre callbacks, Promises e generators
- **HTML Standard (WHATWG)** — seção "Event loops" (a definição normativa do algoritmo: task → drenar microtasks → render)
- **Node.js docs** — guia "The Node.js Event Loop, Timers, and process.nextTick()" (as fases do libuv, `setImmediate` vs `setTimeout`)
- `~/.claude/CLAUDE.md` §JAVASCRIPT — `await` em `forEach`, awaits sequenciais que deviam ser `Promise.all`
