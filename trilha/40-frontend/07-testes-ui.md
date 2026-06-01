# 07 — Testes de UI

## O que é

Testes de UI têm uma hierarquia de valor: **comportamento observável > implementação interna**. O que o usuário faz e o que acontece como resultado — essa é a unidade certa de teste. Testar implementação (nomes de funções internas, estado do componente, quais métodos foram chamados) é frágil: qualquer refactor quebra o teste sem quebrar o comportamento.

**Testing Library** (React Testing Library) foi construída com esse princípio: as queries priorizadas são as que um usuário real usaria para encontrar o elemento.

**Hierarquia de queries (da mais recomendada para menos):**

```
1. getByRole         — role semântico (button, heading, textbox, listitem)
2. getByLabelText    — label do form control
3. getByPlaceholderText
4. getByText         — texto visível
5. getByDisplayValue — valor atual do input
6. getByAltText      — alt de imagem
7. getByTitle
8. getByTestId       — data-testid (último recurso — só quando não tem outra forma)
```

`data-testid` é para quando o elemento não tem role semântico, label ou texto acessível. Se você está usando `getByTestId` para tudo, o componente provavelmente tem problemas de acessibilidade.

```tsx
// RUIM — testa implementação interna, quebra com qualquer refactor
expect(wrapper.find('.btn-submit').prop('disabled')).toBe(true)

// BOM — testa comportamento observable
const button = screen.getByRole('button', { name: /enviar/i })
expect(button).toBeDisabled()
```

**MSW (Mock Service Worker)** — intercepta requests na camada de rede, não no código do componente. Permite testar o fluxo completo (fetch → render → update) sem mockar módulos internos.

```tsx
// setup (msw/node para Jest, msw/browser para Playwright)
const server = setupServer(
  http.get('/api/recordings', () => {
    return HttpResponse.json([{ id: '1', title: 'Reunião Q1' }])
  })
)

test('exibe lista de gravações', async () => {
  render(<RecordingsList />)
  expect(await screen.findByText('Reunião Q1')).toBeInTheDocument()
})
```

**Snapshot testing — a armadilha:** snapshots capturam o HTML inteiro do componente. Qualquer mudança de markup quebra o snapshot — incluindo mudanças intencionais de CSS class ou texto. O resultado é desenvolvedores que rodam `--updateSnapshot` sem olhar o diff. Snapshot não testa comportamento, testa que nada mudou. Para componentes complexos, prefira asserções explícitas.

**E2E (Playwright) vs unit:**

| | Unit (Testing Library) | E2E (Playwright) |
|---|---|---|
| Velocidade | Milissegundos | Segundos |
| Cobertura | Componente isolado | Fluxo completo no browser real |
| Confiabilidade | Alta (sem variáveis de rede/estado) | Menor (flaky por timing) |
| Quando usar | Lógica de UI, validação, estados | Fluxo crítico end-to-end (login, checkout) |
| Custo de manutenção | Baixo | Alto |

**Regra prática:** testar comportamento de componentes com Testing Library, testar os 3 fluxos mais críticos do produto com Playwright.

**Armadilha comum de júnior:** testar `useState` diretamente, checar se `setUser` foi chamado, verificar estrutura interna do componente. Isso não verifica se o usuário consegue usar o produto — verifica se o componente foi implementado de um jeito específico.

---

## Por que cai em entrevista

Empresas maduras cobram testes como critério de senioridade. A pergunta não é "você usa testes?" mas "o que você testa e como". Variações:

- "Como você testaria esse componente sem acoplamento à implementação?"
- "Quando você usaria `data-testid`?"
- "Qual a diferença entre unit test e E2E test? Quando escolher cada?"
- "O que é o problema com snapshot tests?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Componente de formulário com validação | Testing Library + `getByRole` | Testa fluxo do usuário |
| Fetch de dados da API | MSW para mock de rede | Não acopla ao fetch interno |
| Comportamento de botão desabilitado | `toBeDisabled()` | Observable pelo usuário |
| Fluxo de login | Playwright E2E | Verifica integração real |
| Texto exato de um label | `getByLabelText` | Dupla verificação de a11y + conteúdo |
| Elemento sem role semântico | `getByTestId` como último recurso | Mas indica dívida de a11y |

---

## Exercício aplicado (projeto AG real)

```bash
# Verificar se testing-library está configurado no Meet Hub web
cat ~/projetos/meet-hub/apps/web/package.json | grep -E "testing|vitest|jest|playwright"

# Ver testes existentes
find ~/projetos/meet-hub/apps/web/src -name "*.test.tsx" -o -name "*.spec.tsx" 2>/dev/null

# Instalar se não tiver (Vitest + Testing Library)
# cd ~/projetos/meet-hub/apps/web
# npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

Escolher 1 componente do Meet Hub web (sugestão: o componente de lista de gravações ou o formulário de upload) e escrever 1 teste de comportamento:

```tsx
// Exemplo de estrutura — adaptar para o componente real do Meet Hub
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecordingsList } from './RecordingsList'

// Mock de rede com MSW
const recordings = [{ id: '1', title: 'Reunião Q1 2026' }]

test('exibe gravações e permite selecionar', async () => {
  // Arrange
  render(<RecordingsList recordings={recordings} />)

  // Act — encontrar por role, não por class ou data-testid
  const item = screen.getByRole('listitem', { name: /reunião q1/i })

  // Assert
  expect(item).toBeInTheDocument()
})
```

```markdown
## 2026-06-XX — [test] primeiro teste de comportamento no Meet Hub web

**Componente testado:** RecordingsList
**O que testei:** usuário vê a lista de gravações quando há dados disponíveis
**Queries usadas:** getByRole (listitem, button) — sem data-testid
**Mock de rede:** MSW interceptando GET /api/recordings
**Decisão:** não testar setState interno, não testar props individuais. Testar o que o usuário vê.
**Aprendizado:** getByRole força a semântica correta — se o teste falhou por 'role not found', o componente tinha div onde devia ter ul/li.
**Como explicar em entrevista (30s):**
> "Escrevi o teste pensando no que o usuário faria, não no que o código faz. Usei getByRole para encontrar elementos — isso verifica comportamento e acessibilidade ao mesmo tempo. Mockei a rede com MSW em vez de mockar o módulo de fetch — o componente não sabe que está em teste, o que deixa o teste mais confiável."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você testaria um componente de lista sem acoplar à implementação?"
>
> **R (30s):**
> "Usando React Testing Library com queries semânticas. Em vez de buscar por className ou data-testid, uso `getByRole('listitem')` ou `getByText`. Para mockar a API, uso MSW — ele intercepta a requisição na camada de rede, então o componente roda de verdade e eu verifico o que aparece na tela. A asserção é sobre o que o usuário vê: texto visível, botão habilitado, mensagem de erro. Não verifico se `setRecordings` foi chamado ou qual prop passou para o filho — isso é implementação. Se refatorar o componente sem mudar o comportamento, o teste continua verde."

> **P:** "Qual o problema com snapshot tests?"
>
> **R (30s):**
> "Snapshots capturam o HTML inteiro. Qualquer mudança — incluindo adicionar uma class CSS, mudar um texto ou refatorar um componente filho — quebra o snapshot. O resultado na prática é que os devs rodam `--updateSnapshot` sem revisar, porque 'o componente visualmente não mudou'. O snapshot vira papelada que ninguém confia. Para garantir que o componente renderiza corretamente, prefiro asserções explícitas: `screen.getByRole('button', { name: /salvar/i })` — verifica que o botão existe e tem o texto certo, sem capturar o HTML completo."

---

## Checkpoint

- [ ] Sei a hierarquia de queries do Testing Library e por que `getByRole` é preferido
- [ ] Sei o que é MSW e por que mockar na rede é melhor que mockar o módulo
- [ ] Escrevi pelo menos 1 teste de comportamento num projeto AG real
- [ ] Consigo explicar o problema com snapshot tests
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Testes de UI dominado`.

---

## Recursos

- Testing Library — [Queries](https://testing-library.com/docs/queries/about) (hierarquia de prioridade)
- MSW — [Getting Started](https://mswjs.io/docs/getting-started)
- Kent C. Dodds — [Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) (por que não testar implementação)
- Playwright — [Getting Started](https://playwright.dev/docs/intro)
