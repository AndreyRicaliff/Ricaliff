# 04 — State Management

## O que é

State management não é uma decisão de biblioteca — é uma decisão de onde o estado mora e quem pode alterá-lo. A escala vai de local até global, e o erro mais comum é pular etapas.

**Hierarquia de complexidade:**

```
useState (local)
  ↓ precisa compartilhar com irmão/pai
Lifted state (prop drilling)
  ↓ prop drilling > 2 níveis OU dados usados em > 3 lugares não relacionados
Context API
  ↓ contexto causa re-renders excessivos OU lógica ficou complexa demais
Zustand (ou Jotai)
  ↓ app muito grande, time múltiplo, DevTools de debug essenciais
Redux Toolkit
```

**`useState` local:** padrão inicial para tudo. Formulário, toggle, tab ativo — estado que só esse componente usa. Não eleve antes de precisar.

**Lifted state:** mover o estado pro ancestral comum mais próximo dos componentes que precisam dele. Passar por prop. Funciona bem até 2 níveis — acima disso vira prop drilling doloroso.

**Context API:** compartilhar dado sem prop drilling. Mas tem custo: todo consumidor do contexto re-renderiza quando o valor muda. Separar contextos por frequência de atualização (ex: tema muda raramente → contexto separado do estado de sessão que muda sempre).

```tsx
// Contexto de tema: muda raramente, pode ser global
const ThemeContext = createContext<Theme>('dark')

// Contexto de filtro ativo: muda frequentemente, cuidado com re-renders
const FilterContext = createContext<FilterState>({ ... })
```

**Zustand:** store global simples, sem boilerplate. Comparação por seletor — só o componente que usa o pedaço do state que mudou re-renderiza. Ideal para projetos médios.

```tsx
const useStore = create<AppState>(set => ({
  user: null,
  setUser: (user) => set({ user }),
}))

// Componente só re-renderiza se user mudar
const user = useStore(state => state.user)
```

**Redux Toolkit:** overhead justificado apenas em apps grandes com múltiplos devs, onde rastreabilidade de mutações e DevTools de time-travel importam. Para projetos AG atuais: excessivo.

**Server state vs client state:** esse é o trade-off mais ignorado. Dados que vêm de API (lista de gravações, usuário logado, dashboard) **não são estado do cliente** — são cache do servidor. Gerenciá-los com `useState` + `useEffect` é mais trabalho do que usar TanStack Query ou SWR, que resolvem loading, error, refetch, stale-while-revalidate, cache invalidation.

```tsx
// Não faça isso para dados da API
const [recordings, setRecordings] = useState([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)
useEffect(() => { fetch('/api/recordings').then(...) }, [])

// Faça isso
const { data: recordings, isLoading, error } = useQuery({
  queryKey: ['recordings'],
  queryFn: () => api.getRecordings(),
})
```

**Armadilha comum de júnior:** colocar tudo no Redux/Context "para facilitar o acesso futuro". Isso aumenta indireção, dificulta rastrear quem muda o quê e cria estados impossíveis. Estado local é mais fácil de testar e raciocinar.

---

## Por que cai em entrevista

"Como você gerenciaria o estado desse app?" é pergunta que aparece em quase toda entrevista de React. O entrevistador quer ver raciocínio de trade-off, não "eu uso Redux". Variações:

- "Quando você usaria Context em vez de Redux?"
- "O que é prop drilling e como resolve?"
- "Qual a diferença entre estado do servidor e estado do cliente?"
- "Como você evitaria re-renders excessivos com Context?"

---

## Trade-offs

| Cenário | Abordagem | Motivo |
|---|---|---|
| Formulário local | `useState` | Só esse componente precisa |
| Modal de confirmação | `useState` no pai | Pai controla quando abre/fecha |
| Tema da aplicação | Context | Muda raramente, muitos consumidores |
| Dados de API | TanStack Query | Cache, loading, error, refetch — já resolvidos |
| Filtros compartilhados entre 3+ componentes | Context ou Zustand | Prop drilling seria doloroso |
| Autenticação | Context (simples) ou Zustand | Dado estável, poucos updates |
| App com 10+ devs e histórico de mutações complexo | Redux Toolkit | DevTools, rastreabilidade |

---

## Exercício aplicado (projeto AG real)

O Meet Hub web tem estado de autenticação, lista de gravações e filtros. Mapear onde cada estado mora e onde deveria estar.

```bash
# Ver onde está o estado de autenticação e gravações
grep -rn "useState\|useContext\|createContext" ~/projetos/meet-hub/apps/web/src/ | head -40

# Ver se TanStack Query já está sendo usado
grep -rn "useQuery\|useMutation\|QueryClient" ~/projetos/meet-hub/apps/web/src/ 2>/dev/null

# Ver estrutura de componentes
find ~/projetos/meet-hub/apps/web/src -name "*.tsx" | head -20
```

Para cada `useState` encontrado, classificar:
- É dado do servidor? → candidato a TanStack Query
- É usado só nesse componente? → correto, manter local
- É passado por props mais de 2 níveis? → candidato a Context ou Zustand

```markdown
## 2026-06-XX — [arch] auditoria de state management no Meet Hub web

**Contexto:** mapeei todos os useState e contextos.
**Findings:**
- Dados de gravações gerenciados com useState + useEffect manual: candidato a TanStack Query
- Estado de autenticação em Context: correto — muda raramente
- Filtro de busca em useState local: correto — só o componente de busca usa
**Decisão:** migrar fetch de gravações para TanStack Query como primeiro passo.
**Por quê:** elimina boilerplate de loading/error, ganha cache automático e refetch on focus.
**Como explicar em entrevista (30s):**
> "No Meet Hub o estado de gravações estava num useState com useEffect manual — loading, error, refetch na mão. Migrei para TanStack Query porque esses dados são server state, não client state. Ganhei cache, stale-while-revalidate e refetch automático sem escrever uma linha de lógica adicional."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Quando você escolheria Context API em vez de Zustand?"
>
> **R (30s):**
> "Context para dados que mudam raramente e têm muitos consumidores — tema, locale, dados do usuário logado. O custo do Context é que todo consumidor re-renderiza quando o valor muda, então frequência baixa de updates é importante. Zustand para estado que muda com frequência e precisa ser acessado de múltiplos lugares — filtros, seleções, estado de UI que precisa ser compartilhado. Zustand permite selecionar só o pedaço que o componente usa, então re-renderiza só quem precisa. Para o caso específico de dados da API, nenhum dos dois — uso TanStack Query, que resolve cache, loading e refetch de forma muito mais completa."

> **P:** "O que é a diferença entre estado do servidor e estado do cliente?"
>
> **R (30s):**
> "Estado do cliente é o que só existe no browser: qual tab está ativa, se o modal está aberto, o texto digitado num filtro. Estado do servidor é dado que existe no backend e você está cacheando localmente: lista de gravações, perfil do usuário, dashboard de métricas. A diferença prática é que servidor state tem problemas que cliente state não tem: pode ficar stale, precisa de refetch, pode ser invalidado por outra ação. Gerenciar isso com useState é reinventar a roda. TanStack Query foi construído exatamente para esse problema."

---

## Checkpoint

- [ ] Consigo mapear qual estado vai onde (local / lifted / context / store) sem consultar
- [ ] Sei explicar por que contexto com updates frequentes causa problemas de performance
- [ ] Classificar o estado do Meet Hub web em servidor vs cliente
- [ ] Sei o que TanStack Query resolve que useState+useEffect não resolvem
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — State Management dominado`.

---

## Recursos

- React Docs — [Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)
- Zustand — [Getting Started](https://zustand-demo.pmnd.rs/)
- TanStack Query — [Overview](https://tanstack.com/query/latest/docs/framework/react/overview) (ler "Why TanStack Query?")
- Kent C. Dodds — [Application State Management with React](https://kentcdodds.com/blog/application-state-management-with-react)
