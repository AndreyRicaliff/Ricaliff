# 40 — Frontend

## Foco
React além do tutorial: entender o que acontece por baixo quando um componente re-renderiza, quando memoizar resolve e quando cria mais problema, e como acessibilidade e performance deixam de ser "nice to have" para virar requisito de entrevista e de produto real. Para o Ricalfiff, que tem o dashboard do PULSAR-RH em produção com usuários reais, essa trilha converte problema já resolvido (ARIA, performance, state) em linguagem de entrevista.

## Por que cai em entrevista
- "O que dispara uma re-renderização em React?" — querem a resposta técnica, não "quando o estado muda"
- "Quando você usaria useMemo vs useCallback vs nenhum dos dois?"
- "Como você gerenciaria estado global nesse caso?" — querem raciocínio de trade-off, não "uso Redux"
- "Me explica o que é Largest Contentful Paint e por que importa"
- "Como você testaria esse componente sem testar implementação interna?"

## Pré-requisitos
- `00-fundamentos`: closures, event loop, promises — hooks dependem disso
- `10-codigo-limpo`: componente > 20 linhas já é candidato a extração
- JavaScript sólido antes de mergulhar em React avançado

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-render-cycle-e-reconciliation.md` | O que dispara render, diffing algorithm, key prop, batching no React 18 | PULSAR-RH | 🔴 |
| 02 | `02-hooks-essenciais.md` | useState, useEffect, useMemo, useCallback, useRef — regras, dependências corretas | PULSAR-RH | 🔴 |
| 03 | `03-quando-memoizar-e-quando-nao.md` | Custo de memoização, profiler do React DevTools, onde medir antes de otimizar | PULSAR-RH | 🔴 |
| 04 | `04-state-management.md` | Local state, Context API, Zustand, Redux — critérios claros para escolha | AG Converge | 🟡 |
| 05 | `05-acessibilidade-aria.md` | roles semânticos, aria-label, navegação por teclado, contraste, teste com screen reader | PULSAR-RH | 🟡 |
| 06 | `06-performance-web.md` | LCP, CLS, FID/INP, bundle size, lazy loading, code splitting | PULSAR-RH | 🟡 |
| 07 | `07-testes-ui.md` | Testing Library (queries por role, não por class), MSW para mock de API, o que não testar | Meet Hub | 🟢 |

## Como aprender essa trilha
- `01` e `02` são base — sem entender render cycle, todo o resto é decoreba
- Para `02`: não copiar exemplos — escrever cada hook do zero com um caso do PULSAR-RH
- Sinal de fixação em `03`: antes de adicionar useMemo, medir com Profiler e justificar
- `04` pode ser estudado em paralelo com `50-backend/01` — state management e API shape se influenciam
- `07` é o último, mas não é opcional — testing-library é pergunta frequente

## Conexão com decisões reais
- **PULSAR-RH ARIA (2026-05):** a melhoria de acessibilidade já entregue é o caso de estudo de `05` — entrevistador pergunta "você já implementou acessibilidade de verdade?" e a resposta está aqui com commit real
- **PULSAR-RH dashboard performance:** O(n²) corrigido em 3 commits e re-renders desnecessários são o exercício concreto de `03` e `06`
- **Meet Hub web:** componentes React+TS com chamadas assíncronas para API de transcrição são o terreno natural para `02` e `07`
