# 05 — Acessibilidade e ARIA

## O que é

Acessibilidade (a11y) não é "funcionar com screen reader" — é a interface comunicar estrutura e intenção de forma que qualquer tecnologia assistiva (ou qualquer usuário) consiga operar. A hierarquia é: HTML semântico primeiro, ARIA só para preencher lacunas que HTML não cobre.

**Regra de ouro:** se você pode usar um elemento HTML nativo com semântica embutida, use. ARIA deve ser o último recurso.

```html
<!-- ERRADO — div com click handler sem semântica -->
<div class="btn" onclick="handleSubmit()">Enviar</div>

<!-- CORRETO — button tem role, keyboard, focus, disabled gerenciados pelo browser -->
<button type="button" onClick={handleSubmit}>Enviar</button>
```

**Por que `<div onClick>` é crime:**
- Não é focalizável por teclado sem `tabIndex`
- Não dispara com Enter/Space sem JavaScript adicional
- Screen reader não sabe que é interativo
- Mobile não ativa sem JavaScript explicit

**Elementos semânticos que eliminam ARIA:**
- `<nav>`, `<main>`, `<header>`, `<footer>`, `<aside>` — landmarks automáticos
- `<button>` — role button + keyboard + focus
- `<input>`, `<select>`, `<textarea>` — form controls com label
- `<h1>`–`<h6>` — hierarquia de documento
- `<table>`, `<th>`, `<caption>` — dados tabulares

**ARIA quando HTML não chega:**

```tsx
// Componente customizado que HTML nativo não resolve
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-desc"
>
  <h2 id="modal-title">Confirmar exclusão</h2>
  <p id="modal-desc">Essa ação não pode ser desfeita.</p>
</div>

// Status dinâmico que screen reader precisa anunciar
<div role="status" aria-live="polite">
  {isLoading ? 'Carregando...' : 'Dados carregados'}
</div>
```

**Focus management:** em modais e drawers, o foco deve ir para dentro quando abre e voltar pro elemento que abriu quando fecha. Sem isso, usuário de teclado perde a posição.

**Contraste:** WCAG AA exige 4.5:1 para texto normal, 3:1 para texto grande. A paleta roxa AG (`#7048E8` sobre `#0A0F1A`) passa. Verificar texto cinza muted sobre background dark.

**`useId` para associar label a input:**

```tsx
function TextInput({ label }: { label: string }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} type="text" />
    </div>
  )
}
```

**Armadilha comum de júnior:** adicionar `aria-label` em elemento que já tem texto visível. `aria-label` sobrescreve o texto para screen reader — se o botão tem texto "Salvar", não adicione `aria-label="Salvar"`, é redundante e confuso.

---

## Por que cai em entrevista

Empresas com produto real cobram a11y porque é requisito legal (LGPD não, mas WCAG em contexto de produto público sim) e de qualidade. Variações:

- "Por que `<div onClick>` é ruim?"
- "Qual a diferença entre `aria-label` e `aria-labelledby`?"
- "Como você testaria acessibilidade?"
- "O que é focus management e por que importa em modais?"

---

## Trade-offs

| Cenário | Abordagem | Por quê |
|---|---|---|
| Botão de ação | `<button>` nativo | Keyboard, focus, role de graça |
| Ícone sem texto | `aria-label` no botão pai | Texto de acompanhamento invisível para screen reader |
| Ícone com texto ao lado | `aria-hidden="true"` no ícone | Evita repetição (texto já descreve) |
| Status que muda dinamicamente | `role="status"` + `aria-live` | Anuncia mudança sem mudar foco |
| Modal | `role="dialog"` + focus trap | Browser não gerencia isso nativamente |
| Tabela de dados | `<table>` com `<caption>` e `<th scope>` | Screen reader anuncia contexto da célula |

---

## Exercício aplicado (projeto AG real)

```bash
# Verificar se axe-cli está instalado
npx axe --version 2>/dev/null || echo "instalar: npm i -g axe-cli"

# Rodar análise no PULSAR-RH (assumindo servidor local na 3000)
# Antes: iniciar o PULSAR-RH localmente
npx axe http://localhost:3000 --tags wcag2a,wcag2aa

# Alternativa: abrir DevTools → Lighthouse → acessibilidade
# Target: score > 90
```

No PULSAR-RH (HTML+JS puro), procurar:
1. Divs e spans com `onclick` sem `role` e `tabIndex` — substituir por `<button>` quando possível
2. Inputs sem `<label>` associado — adicionar `htmlFor`/`id` ou `aria-label`
3. Imagens sem `alt` (ou com `alt=""` incorreto para imagens informativas)
4. Texto com contraste insuficiente — verificar cores muted sobre dark background

```bash
# Buscar divs com onclick no PULSAR-RH
grep -rn "onclick\|addEventListener.*click" ~/projetos/PULSAR-RH/ --include="*.html" --include="*.js" | grep -v "button\|a href" | head -20
```

```markdown
## 2026-06-XX — [a11y] corrigir 3 problemas de acessibilidade no PULSAR-RH

**Problemas encontrados:**
1. Div com onclick no filtro de departamento — não focalizável por teclado
2. Input de pesquisa sem label associado — screen reader não sabe o que é
3. Texto cinza no card de KPI: contraste 2.8:1 (abaixo de 4.5:1)
**Decisão:** corrigir os 3 antes do próximo deploy.
**Implementação:**
- Filter div → `<button type="button">` com mesmo estilo
- Input → `<label htmlFor="search-input">` + `id="search-input"` no input
- Cor muted ajustada de `#7A9BC4` para `#A8C4E0` no modo dark
**Como explicar em entrevista (30s):**
> "Rodei o Lighthouse no PULSAR-RH e encontrei 3 problemas: div com onclick sem semântica, input sem label e contraste insuficiente em texto secundário. Corrigi substituindo a div por button — que traz keyboard e focus de graça — associei o label ao input via htmlFor/id, e ajustei a cor muted para passar 4.5:1 de contraste. Lighthouse subiu de 67 para 91."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que usar `<div onClick>` em vez de `<button>` é problemático?"
>
> **R (30s):**
> "Porque `<div>` não tem semântica de controle interativo. O browser não coloca na ordem de tabulação por padrão — usuário de teclado não consegue chegar nele. Não responde a Enter ou Space — precisaria de JavaScript extra. Screen reader não sabe que é clicável — anuncia como texto genérico. `<button>` resolve tudo isso de graça: está na tab order, dispara com teclado, tem `role='button'`, pode receber `disabled`. Se o design exige um elemento sem as bordas de botão, `<button>` com CSS `appearance: none` é a resposta — não `<div>` com gambiarra."

> **P:** "Qual a diferença entre `aria-label` e `aria-labelledby`?"
>
> **R (30s):**
> "Ambos fornecem texto descritivo para screen reader, mas de fontes diferentes. `aria-label` é texto inline direto no atributo — útil para ícones sem texto visível, como um botão de fechar com só um X. `aria-labelledby` aponta para o ID de outro elemento que já tem o texto — útil para formulários onde o label visual já existe. A regra é: se já tem texto visível na página que descreve o elemento, use `aria-labelledby` apontando para ele. Se não há texto visível, use `aria-label`. Nunca os dois ao mesmo tempo — `aria-labelledby` tem precedência mas é confuso."

---

## Checkpoint

- [ ] Sei listar 5 elementos HTML semânticos que eliminam a necessidade de ARIA
- [ ] Sei quando usar `aria-label` vs `aria-labelledby`
- [ ] Rodei Lighthouse no PULSAR-RH e documentei os problemas encontrados
- [ ] Corrigi pelo menos 1 `<div onClick>` substituindo por `<button>`
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Acessibilidade & ARIA dominado`.

---

## Recursos

- MDN — [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) (padrões por componente)
- axe-core — [axe DevTools](https://www.deque.com/axe/) (extensão Chrome gratuita)
- WebAIM — [Contrast Checker](https://webaim.org/resources/contrastchecker/)
- React Docs — [useId](https://react.dev/reference/react/useId)
- `npx axe <url>` — teste de acessibilidade via linha de comando
