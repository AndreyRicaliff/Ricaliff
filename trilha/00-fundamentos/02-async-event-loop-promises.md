# 02 — Async, Event Loop e Promises

## O que é

JavaScript roda em **uma thread só**. O *event loop* é o mecanismo que decide qual pedaço de código executa a seguir: ele tira tarefas de filas (microtasks, macrotasks) e empurra pra call stack. **Promises** representam um valor que ainda não chegou — ao resolver, o `.then`/`await` enfileira a continuação como **microtask**, que roda antes de qualquer macrotask (timers, I/O).

```js
console.log('A')
setTimeout(() => console.log('B'), 0)   // macrotask
Promise.resolve().then(() => console.log('C'))   // microtask
console.log('D')
// Saída: A, D, C, B
```

`async/await` é açúcar sintático: `await x` ≡ `x.then(...)`. O código depois do `await` **sai da call stack** e volta como microtask quando a Promise resolve.

---

## Por que cai em entrevista

É **o** tópico que separa quem leu doc de quem entende o runtime. Caem em ~80% das entrevistas júnior de Node/React. Variações:

- "Qual a saída desse código?" (mistura de `setTimeout`, `Promise.resolve`, `console.log`)
- "Qual a diferença entre callback, Promise e async/await?"
- "Por que `forEach(async ...)` não espera?"
- "O que acontece se você joga uma `Promise.reject` sem `.catch`?"
- "Como roda 10 requests em paralelo? E sequencial?"
- "O que é microtask vs macrotask?"

Errar isso = sinal de "não entendeu o motor". Acertar com confiança = passa o filtro júnior.

---

## Trade-offs (quando usar X vs Y)

| Cenário | Use | Não use |
|---|---|---|
| 1 request, espera resultado | `await fetch(...)` | Callback aninhado |
| N requests **independentes** | `Promise.all(arr.map(...))` — paralelo | `for await` — serializa |
| N requests onde **uma falha não pode cancelar as outras** | `Promise.allSettled` | `Promise.all` (aborta no 1º reject) |
| Primeiro que responder ganha (timeout, fallback) | `Promise.race` | Loop manual |
| N requests **dependentes** (B precisa de A) | `for await` ou `await` sequencial | `Promise.all` (não respeita ordem de dependência) |
| Iterar com efeito async | `for...of` com `await` | `forEach(async ...)` — **não espera** |
| Fire-and-forget (não importa o resultado) | Sem `await`, com `.catch(logError)` | `await` desnecessário |

**Regra de bolso:**
- **Independentes** → `Promise.all`
- **Dependentes** → `for...of` + `await`
- **Quero todos os resultados mesmo com falha** → `allSettled`
- **NUNCA** `forEach` com `async` se você quer esperar

---

## Exercício aplicado (projeto AG real)

O `progress.md` em `~/.claude/neural/learning/` aponta como gap: **`await` dentro de `forEach` — armadilha comum em async**. Tem ocorrência real no PULSAR-RH.

### Passo a passo

1. **Encontrar o caso:**
   ```bash
   cd ~/projetos/PULSAR-RH
   grep -rn "forEach" src/ --include="*.js" --include="*.ts" | grep -i "async\|await"
   ```
2. **Para cada match:**
   - Lê o bloco. A função que contém é `async`? Tem `await` dentro do callback?
   - Se sim: você encontrou um bug latente — o código não espera as iterações.
3. **Reescrever** seguindo a regra:
   - Independentes → `await Promise.all(arr.map(async item => { ... }))`
   - Dependentes → `for (const item of arr) { await ... }`
4. **Registrar a decisão** em `PULSAR-RH/DECISIONS.md` com o bloco padrão:
   ```markdown
   ## 2026-06-XX — [perf] trocar forEach+await por Promise.all em X

   **Problema:** `forEach` não aguarda o callback async — iterações começam mas o código segue antes de terminarem.
   **Opções consideradas:**
   - `Promise.all(arr.map(...))` — paraleliza, máximo de N em voo ao mesmo tempo
   - `for...of` com `await` — serializa, 1 por vez
   **Decisão:** Promise.all (as N chamadas são independentes — não há dependência de ordem nem rate limit que justifique serializar).
   **Por quê:** ganha tempo (N×t → ~1×t) sem quebrar nada.
   **Consequências:** se a API tiver rate limit, vai estourar — verificar antes; se estourar, voltar pra `for...of` ou usar `p-limit`.
   **Como explicar em entrevista (30s):**
   > "Tinha um forEach com await que não esperava — bug silencioso. Como as chamadas eram independentes, troquei por Promise.all, paralelizou e o handler ficou 4× mais rápido. Se houvesse rate limit, usaria p-limit pra controlar concorrência."
   ```
5. **Commit:** `fix(perf): replace forEach+await with Promise.all in <arquivo>`
6. **Marcar checkpoint** abaixo.

---

## Pergunta de entrevista esperada + resposta exemplar

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

---

## Checkpoint

- [ ] Consigo explicar a diferença entre microtask e macrotask sem consultar
- [ ] Sei prever a saída de qualquer mistura de `setTimeout`/`Promise`/`console.log`
- [ ] Refatorei pelo menos 1 `forEach`+`await` real num projeto AG
- [ ] `DECISIONS.md` do projeto tem o bloco registrado
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Event Loop & Async dominado`.

---

## Recursos

- MDN — [Event Loop](https://developer.mozilla.org/docs/Web/JavaScript/Event_loop)
- MDN — [Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)
- Jake Archibald — [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) (denso, mas é **a** referência)
- `~/.claude/CLAUDE.md` §JAVASCRIPT — regras automáticas que o Claude aplica em código novo
