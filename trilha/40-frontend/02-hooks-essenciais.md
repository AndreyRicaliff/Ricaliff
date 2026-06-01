# 02 — Hooks Essenciais

## O que é

Hooks são funções que conectam componentes funcionais ao mecanismo interno do React. Cada hook tem um mental model diferente — decorar a API sem entender o model leva a bugs que só aparecem em produção.

**`useState`** — estado local. O setter não mutua o objeto: cria um novo render com o novo valor. Atualizar objeto: `setState(prev => ({ ...prev, campo: valor }))` — nunca mutar `prev` diretamente.

**`useEffect`** — sincronização com o mundo externo (fetch, subscription, timer). Mental model correto: "quando essas dependências mudarem, rode esse código e, se precisar, limpe o anterior". Não é "rode quando o componente montar".

```tsx
useEffect(() => {
  const sub = subscribe(id)
  return () => sub.unsubscribe()  // cleanup: roda antes do próximo effect e no unmount
}, [id])  // roda toda vez que id muda
```

**`useMemo`** — memoiza um valor computado. Só recalcula quando as deps mudam.

**`useCallback`** — memoiza uma função. Semanticamente é `useMemo(() => fn, deps)`. Útil para estabilizar referência de função passada para filho com `React.memo`.

**`useRef`** — dois usos distintos:
1. Referenciar nó do DOM: `<input ref={inputRef} />`
2. Persistir valor entre renders **sem causar re-render**: ideal para timers, contadores, valores de animação

**`useLayoutEffect`** — mesmo que `useEffect` mas dispara de forma síncrona após mutações do DOM e antes do browser pintar. Use para medir layout e ajustar antes da tela piscar. Quase nunca necessário — `useEffect` resolve 95% dos casos.

**`useId`** — gera ID único e estável para acessibilidade (`aria-labelledby`, `htmlFor`). Funciona em SSR sem hydration mismatch.

**Closure trap (o bug mais frequente com hooks):** O valor capturado no closure do `useEffect` ou evento é o valor no momento que a função foi criada, não o atual.

```tsx
// BUG: count sempre vale 0 dentro do interval — closure antiga
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + 1)  // count = 0, sempre
  }, 1000)
  return () => clearInterval(id)
}, [])  // deps vazias = nunca recria o closure

// FIX: usar forma funcional do setter
useEffect(() => {
  const id = setInterval(() => {
    setCount(c => c + 1)  // recebe o valor atual como argumento
  }, 1000)
  return () => clearInterval(id)
}, [])
```

**Dependency array:**
- `[]` — roda uma vez (mount). Closure captura estado inicial.
- `[a, b]` — roda quando `a` ou `b` muda.
- sem array — roda todo render. Geralmente indica problema de design.
- Função como dep: instável se declarada no corpo do componente. Estabilizar com `useCallback` se necessário.

**Armadilha comum de júnior:** omitir dependência do `useEffect` porque "sabe" que não vai mudar. ESLint `exhaustive-deps` pega isso — confiar na regra é mais seguro do que confiar no julgamento manual.

---

## Por que cai em entrevista

Hooks são pergunta obrigatória em toda entrevista React. O que separa júnior de pleno aqui é saber explicar por que a dependency array funciona como funciona e o que é a closure trap. Variações:

- "Qual a diferença entre `useEffect` com `[]` e sem array?"
- "Por que esse código tem um bug?" (exemplo com closure trap)
- "Quando você usaria `useRef` em vez de `useState`?"
- "Qual a diferença entre `useMemo` e `useCallback`?"
- "O que é o cleanup do `useEffect` e quando ele roda?"

---

## Trade-offs

| Cenário | Hook | Por quê |
|---|---|---|
| Valor que dispara re-render quando muda | `useState` | Propósito principal |
| Valor que precisa persistir mas não disparar re-render | `useRef` | Não é estado — é referência mutável |
| Computação cara derivada de estado | `useMemo` | Evitar recalcular a cada render |
| Função passada para filho com `React.memo` | `useCallback` | Estabilizar referência |
| Medir tamanho de elemento antes de pintar | `useLayoutEffect` | Síncrono com DOM, evita flash |
| Sincronizar com API externa | `useEffect` | Cleanup incluso |

---

## Exercício aplicado (projeto AG real)

```bash
# Encontrar useEffect com array de dependências vazio ou potencialmente incompleto
grep -rn "useEffect" ~/projetos/meet-hub/apps/web/src/ | grep -v "node_modules"

# Ver todos os effects com deps para análise manual
grep -A 5 "useEffect(" ~/projetos/meet-hub/apps/web/src/ -rn | grep -E "\[.*\]|useEffect"
```

Para cada `useEffect` encontrado:
1. Listar todas as variáveis de estado e props usadas dentro do callback
2. Comparar com o array de deps declarado
3. Se variável usada não está no array: closure trap potencial — analisar se é bug real ou intencional

```markdown
## 2026-06-XX — [fix] corrigir dependency array em useEffect de fetch

**Problema:** useEffect busca dados com um ID que vem de prop, mas ID não está no array de deps. Quando prop muda, fetch não roda novamente — dado fica desatualizado.
**Opções consideradas:**
- Adicionar ID ao array: correto, fetch roda quando ID muda
- useCallback no handler: não resolve o problema raiz
**Decisão:** adicionar `id` ao array de dependências.
**Por quê:** `useEffect` com deps incompletas é closure trap — a função captura o ID antigo e nunca atualiza.
**Consequências:** o effect vai rodar novamente quando ID muda, o que é o comportamento correto. Verificar se há cancelamento de request em voo (cleanup com AbortController).
**Como explicar em entrevista (30s):**
> "Tinha um useEffect que buscava dados por ID, mas o ID não estava no array de deps. Closure trap clássico — a função fechava sobre o valor inicial do ID e nunca atualizava quando a prop mudava. Adicionei o ID ao array e implementei cleanup com AbortController para cancelar request anterior quando o ID mudasse antes da resposta chegar."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre `useEffect` com array vazio `[]` e sem array?"
>
> **R (30s):**
> "`[]` — o effect roda uma vez, logo após o primeiro render (equivalente ao antigo `componentDidMount`). O cleanup roda no unmount. A closure captura os valores iniciais de tudo — se você usa estado dentro do effect sem colocar no array, vai ter closure trap.
> Sem array — o effect roda após todo render, o que quase sempre é erro de design. Geralmente significa que você esqueceu de pensar nas dependências. O mental model certo é: array de deps define 'quando a sincronização precisa acontecer novamente', não 'quando o componente monta'."

> **P:** "O que é a closure trap em hooks?"
>
> **R (30s):**
> "Quando uma função dentro de um hook captura uma variável do render anterior e não vê o valor atual. Exemplo clássico: `setInterval` com `useEffect` e `[]` lê um contador que sempre vale o valor inicial, porque a função foi criada no primeiro render e nunca recriada. O fix é usar a forma funcional do setter — `setCount(c => c + 1)` — que recebe o valor atual como argumento em vez de capturar do closure."

---

## Checkpoint

- [ ] Sei explicar o mental model correto do `useEffect` (sincronização, não lifecycle)
- [ ] Consigo identificar closure trap num snippet de código sem rodar
- [ ] Sei a diferença de casos de uso entre `useRef` e `useState`
- [ ] Encontrei pelo menos 1 dependency array incompleto num projeto AG real
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Hooks Essenciais dominado`.

---

## Recursos

- React Docs — [Hooks Reference](https://react.dev/reference/react)
- React Docs — [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) (mental model correto do useEffect)
- Dan Abramov — [A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/) (longo, mas resolve qualquer dúvida sobre closure trap)
- ESLint plugin — [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) — ativar `exhaustive-deps`, confiar na regra
