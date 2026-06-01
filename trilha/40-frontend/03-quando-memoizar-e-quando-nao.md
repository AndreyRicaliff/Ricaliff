# 03 — Quando Memoizar e Quando Não

## O que é

`useMemo`, `useCallback` e `React.memo` têm custo real: alocação de closure, comparação de dependências, overhead de bookkeeping do React. A pergunta certa não é "posso memoizar?" mas "o custo da memoização é menor que o custo do recalculo/re-render que quero evitar?".

**React.memo** — memoiza o componente inteiro. Antes de re-renderizar, compara props com shallow equality. Se todas as props são iguais por referência, pula o render.

```tsx
const Row = React.memo(({ item, onSelect }: Props) => {
  return <li onClick={() => onSelect(item.id)}>{item.name}</li>
})
```

O problema: se `onSelect` é declarado no componente pai sem `useCallback`, é uma nova função a cada render do pai — React.memo não serve porque a prop nunca é "igual".

**`useCallback`** — estabiliza a referência de uma função entre renders. Só útil em conjunto com `React.memo` ou como dep de outro `useEffect`/`useMemo`.

**`useMemo`** — memoiza um valor computado. Útil quando a computação é genuinamente cara (sort em lista grande, transformação complexa de dados).

**Quando memoização é desperdício:**
- Componentes simples que renderizam em < 1ms — o overhead do memo pode ser maior que o render
- Props primitivas (string, number, boolean) — já comparam por valor, `React.memo` não precisa de `useCallback`
- Listas curtas (< 100 itens) com render simples
- Cálculo trivial (`a + b`, `.length`, `.filter` em 10 itens)

**Custo real da memoização:**
```tsx
// Sem memo — direto, limpo
const doubled = items.map(x => x * 2)

// Com useMemo — alocação de closure + comparação de deps a cada render
const doubled = useMemo(() => items.map(x => x * 2), [items])
// Vale a pena SE: items tem 10.000 itens E o componente re-renderiza com frequência
```

**O fluxo correto:**
1. Escrever sem memo
2. Perceber lentidão (medir, não intuir)
3. Abrir React DevTools Profiler e identificar qual componente é o gargalo
4. Adicionar memo cirurgicamente no componente identificado
5. Medir novamente para confirmar melhora

**Armadilha comum de júnior:** envolver tudo em `useMemo`/`useCallback` "por precaução". Isso é otimização prematura — aumenta o bundle, dificulta a leitura e frequentemente não muda nada porque o gargalo está em outro lugar.

---

## Por que cai em entrevista

Entrevistadores testam se você memoiza por entendimento ou por superstição. A resposta "uso useMemo pra performance" sem saber medir é pior do que "não uso, meço primeiro". Variações:

- "Quando você usaria useMemo?"
- "useCallback sempre melhora performance?"
- "Como você mediria se uma memoização está ajudando?"
- "Qual a diferença entre React.memo e useMemo?"

---

## Trade-offs

| Situação | Memoizar? | Motivo |
|---|---|---|
| Cálculo em lista < 100 itens | Não | Custo do memo > custo do cálculo |
| Sort/filter em lista > 1000 itens que re-renderiza com frequência | Sim, medir antes | Potencialmente caro |
| Função passada para filho com `React.memo` | Sim (`useCallback`) | Sem isso o `React.memo` é inútil |
| Função usada como dep de `useEffect` | Sim (`useCallback`) | Evita loop de re-subscribe |
| Componente com render > 16ms medido no Profiler | Sim (`React.memo`) | Gargalo confirmado |
| Componente com render < 1ms | Não | Overhead de comparação pode ser maior |

---

## Exercício aplicado (projeto AG real)

```bash
# Encontrar useMemo e useCallback no Meet Hub web
grep -rn "useMemo\|useCallback\|React.memo" ~/projetos/meet-hub/apps/web/src/

# Contar quantas memoizações existem
grep -rn "useMemo\|useCallback" ~/projetos/meet-hub/apps/web/src/ | wc -l
```

Para cada `useMemo`/`useCallback` encontrado, responder:
1. Qual é o custo do recalculo que isso está evitando? (trivial / moderado / caro)
2. Esse componente re-renderiza com frequência? (sempre / às vezes / raramente)
3. Sem essa memoização, tem bug ou só "parece mais lento"?

**Com React DevTools Profiler:**
1. Instalar extensão React DevTools no browser
2. Abrir a aba Profiler
3. Clicar "Record"
4. Interagir com o componente em questão
5. Parar gravação → ver flamegraph → identificar componentes com render > 5ms
6. Só esses são candidatos reais à memoização

```markdown
## 2026-06-XX — [perf] auditoria de memoização no Meet Hub web

**Contexto:** auditei todos os useMemo/useCallback do projeto.
**Findings:**
- 3 useMemo em computações triviais (< 0.1ms no profiler): removidos
- 1 useCallback em função passada para filho com React.memo: mantido (justificado)
- 1 useMemo em sort de lista de 500 gravações: mantido (4ms sem memo, 0.1ms com memo)
**Decisão:** remover memoizações não justificadas por medição.
**Por quê:** código mais simples, sem custo real de performance. Só os 2 casos com justificativa de medição foram mantidos.
**Como explicar em entrevista (30s):**
> "Fiz uma auditoria de memoização no projeto. Medi com o React DevTools Profiler e encontrei 3 useMemo em cálculos que levavam 0.1ms — o overhead do memo era maior que o benefício. Removi os sem justificativa e mantive os dois com melhora medida de verdade."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você usaria `useMemo`?"
>
> **R (30s):**
> "Raramente, e só depois de medir. O fluxo que sigo: escrevo sem memo, meço com o React DevTools Profiler se a UI parecer lenta, e só adiciono se o componente aparece como gargalo com render > 5ms e re-renderiza com frequência. Na prática, os casos que justificam são sort ou filter em listas grandes, ou transformações que dependem de dados externos. Computações triviais não — o overhead do memo de comparar dependências a cada render pode ser maior do que o custo do cálculo que estou 'evitando'."

> **P:** "`useCallback` sempre melhora performance?"
>
> **R (30s):**
> "Não. `useCallback` só ajuda quando a função é passada para um componente filho que usa `React.memo`, ou quando é dep de um `useEffect` que não pode ser recriado. Fora desses casos, `useCallback` aloca um closure e compara deps a cada render sem benefício nenhum. Vi code base com `useCallback` em todo handler de click e nenhum `React.memo` no projeto — o overhead era maior que qualquer ganho."

---

## Checkpoint

- [ ] Sei explicar em que condições `React.memo` não serve sem `useCallback`
- [ ] Sei usar o React DevTools Profiler para medir render time de um componente
- [ ] Identifiquei pelo menos 1 memoização desnecessária num projeto AG real
- [ ] Consigo responder "quando não memoizar" com exemplos concretos
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Memoização dominado`.

---

## Recursos

- React Docs — [useMemo](https://react.dev/reference/react/useMemo)
- React Docs — [useCallback](https://react.dev/reference/react/useCallback)
- Kent C. Dodds — [When to useMemo and useCallback](https://kentcdodds.com/blog/usememo-and-usecallback) (a referência definitiva — argumenta contra uso excessivo)
- React DevTools — [Profiler](https://react.dev/learn/react-developer-tools)
