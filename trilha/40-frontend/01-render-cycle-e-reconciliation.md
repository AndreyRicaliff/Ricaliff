# 01 — Render Cycle e Reconciliation

## O que é

React tem duas fases separadas: **render** e **commit**.

**Render phase:** React chama sua função de componente e monta uma árvore de elementos virtuais (o Virtual DOM — uma representação JS pura da UI). Pode ser interrompida e reiniciada (React 18 com Concurrent Mode). **Nenhum DOM real é tocado aqui.**

**Commit phase:** React compara a árvore nova com a anterior (reconciliation), calcula o menor conjunto de mudanças e aplica no DOM. Essa fase é síncrona e não pode ser interrompida.

O algoritmo de reconciliation usa duas heurísticas para ser O(n) em vez de O(n³):
1. Elementos de tipos diferentes → descarta a subárvore inteira e reconstrói
2. Elementos do mesmo tipo → atualiza só os atributos que mudaram

A prop `key` é o mecanismo que diz ao React qual elemento é qual em listas. Sem `key`, React compara por posição, o que causa comportamento errado quando a lista reordena ou filtra.

**O que dispara uma re-renderização:**
- `setState` (ou o setter do `useState`) é chamado — mesmo que o valor seja idêntico ao anterior (objeto novo com mesma forma ainda causa render)
- Prop muda (comparação por referência para objetos/funções)
- Contexto do `useContext` muda
- O componente pai re-renderiza — filho re-renderiza por padrão, a menos que seja `React.memo`

**Batching no React 18:** `setState` chamado múltiplas vezes no mesmo handler é batched — só um render. No React 17, batching só funcionava em event handlers; chamadas dentro de `setTimeout` ou promises causavam render separado para cada `setState`. React 18 unificou isso com Automatic Batching.

```tsx
// Re-renderiza 1x (batching) — React 18
function handleClick() {
  setCount(c => c + 1)
  setName('novo')  // não causa render extra
}

// Sem batching no React 17 (2 renders), com batching no React 18 (1 render)
setTimeout(() => {
  setCount(c => c + 1)
  setName('novo')
}, 0)
```

**Armadilha comum de júnior:** usar `key={index}` em listas mutáveis. Quando a lista reordena, o React mantém o estado do componente que estava na posição 0 e cola no novo item que veio para a posição 0. O resultado é estado errado no componente errado — bug silencioso e difícil de debugar.

```tsx
// ERRADO — reorder ou filter desloca o estado para o item errado
{items.map((item, index) => <Row key={index} data={item} />)}

// CORRETO — key estável e única por entidade
{items.map(item => <Row key={item.id} data={item} />)}
```

`key={index}` só é aceitável em listas **estáticas** (nunca reordenam, nunca filtram, nunca inserem no meio).

---

## Por que cai em entrevista

Pergunta direta de 80% das entrevistas React. Saber "quando o estado muda" não é resposta — o entrevistador quer ouvir render phase, commit phase, reconciliation, referência de objetos. Variações:

- "O que dispara uma re-renderização?"
- "Por que `key={index}` é ruim em listas?"
- "O que é o Virtual DOM e por que o React usa isso?"
- "Qual a diferença entre render e commit?"
- "O que mudou no React 18 sobre batching?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Lista estática de 5 itens sem filtro | `key={index}` é ok | Nunca vai reordenar — não tem risco |
| Lista de produtos com filtro/sort | `key={item.id}` obrigatório | Reorder desloca estado |
| Componente caro que pai re-renderiza sem motivo | `React.memo` | Evita render desnecessário |
| Componente leve que pai re-renderiza | Sem memo | Custo do memo > custo do render |
| Lista enorme (> 1000 itens) | Virtualização (react-window) | DOM com 1000 nós é mais caro que qualquer reconciliation |

---

## Exercício aplicado (projeto AG real)

O Meet Hub web (`~/projetos/meet-hub/apps/web/`) tem listas de gravações e participantes renderizadas em vários lugares.

```bash
# Encontrar listas com key={index}
grep -rn "key={index}" ~/projetos/meet-hub/apps/web/src/
grep -rn 'key=\{.*index\}' ~/projetos/meet-hub/apps/web/src/

# Também checar no PULSAR-RH (HTML puro com React embutido não tem, mas verificar)
grep -rn "key={index}" ~/projetos/PULSAR-RH/src/ 2>/dev/null || echo "sem src/ — verificar estrutura"
```

Para cada ocorrência encontrada:
1. Perguntar: essa lista pode ser filtrada, reordenada ou ter itens inseridos no meio?
2. Se sim: trocar por `key={item.id}` (ou o identificador único do domínio)
3. Abrir React DevTools → Profiler → gravar → interagir com a lista → ver quais componentes re-renderizam

```markdown
## 2026-06-XX — [perf] corrigir key={index} em lista de gravações

**Problema:** `key={index}` em lista de gravações causa bug de estado quando lista é filtrada — o estado do componente da posição anterior fica no item errado.
**Opções consideradas:**
- Manter index: simples, mas causa bug em filter/sort
- Usar recording.id como key: estável, correto
**Decisão:** `key={recording.id}` — todo item de lista tem ID único no banco.
**Por quê:** React usa key para mapear elemento da árvore anterior ao elemento atual. ID estável = mapeamento correto mesmo com reorder.
**Consequências:** nenhuma regressão esperada. Se um item não tiver ID, bug de modelagem — não esconder com index.
**Como explicar em entrevista (30s):**
> "Tinha key={index} numa lista de gravações. Quando o usuário filtrava, o estado dos inputs do componente ficava deslocado — você filtrava, e o estado do item A aparecia no item B. Corrigi usando o ID da gravação como key, que é estável e único. O React usa a key pra saber qual componente é qual entre renders — sem ela, mapeia por posição e o estado vai pro lugar errado."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que dispara uma re-renderização em React?"
>
> **R (30s):**
> "Três coisas: chamada de `setState` no próprio componente, mudança de prop — comparação por referência, então objeto novo com mesma forma ainda dispara — ou mudança de contexto via `useContext`. O componente pai re-renderizar também causa render no filho por padrão, a menos que seja `React.memo`. No React 18 tem Automatic Batching — múltiplos `setState` no mesmo tick viram um único render, o que antes só funcionava em event handlers síncronos."

> **P:** "Por que `key={index}` é ruim em listas que podem ser filtradas?"
>
> **R (30s):**
> "React usa `key` pra mapear o componente da árvore anterior ao da árvore nova. Com `key={index}`, o item que estava na posição 0 e agora está na posição 2 depois de um filtro recebe a key `2` — React acha que é um componente diferente e descarta o estado. Com `key={item.id}`, o React rastreia pelo ID independente de posição e preserva o estado corretamente. Já debuguei esse bug em produção: input de formulário aparecia preenchido com dado do item anterior."

---

## Checkpoint

- [ ] Consigo explicar render phase vs commit phase sem consultar
- [ ] Sei listar as 4 causas de re-renderização (setState, prop, contexto, pai)
- [ ] Encontrei e corrigi pelo menos 1 `key={index}` em lista mutável num projeto AG
- [ ] Consigo explicar Automatic Batching do React 18 e o que mudou
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Render Cycle & Reconciliation dominado`.

---

## Recursos

- React Docs — [Render and Commit](https://react.dev/learn/render-and-commit)
- React Docs — [Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) (o melhor sobre `key`)
- React 18 Blog — [Automatic Batching](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching)
- Dan Abramov — [React as a UI Runtime](https://overreacted.io/react-as-a-ui-runtime/) (denso, mas é a base teórica)
