# 06 — Acessibilidade Mínima

## O que é

Acessibilidade tem uma versão maximalista (auditoria WCAG completa, leitores de tela, AAA) e uma versão **mínima profissional não-negociável** — cinco itens que cabem em qualquer sprint e cuja ausência é defeito, não "melhoria futura". O WebAIM Million encontra falhas WCAG detectáveis em ~96% do 1 milhão de homepages mais acessadas — cumprir o mínimo já te coloca na minoria.

Os cinco itens:

1. **Foco visível.** `outline: none` sem substituto é o pecado capital: usuário de teclado fica cego sobre onde está. O fix moderno é `:focus-visible` — anel de foco aparece na navegação por teclado e não no clique de mouse. Custo: 3 linhas de CSS.
2. **Navegação por teclado.** Todo interativo alcançável por Tab (na ordem lógica), acionável por Enter/Espaço; modal fecha com Escape, prende o foco enquanto aberto (focus trap) e devolve o foco ao elemento que o abriu. O teste é gratuito: solte o mouse.
3. **ARIA só no que não é semântico.** A primeira regra do ARIA é não usar ARIA: `<button>` nativo já traz foco, teclado e semântica de graça — `<div onClick>` precisa de `role`, `tabindex` e handler de teclado pra imitar mal o que o botão dá pronto. ARIA entra no que o HTML não cobre: `aria-expanded` num accordion, `aria-live` numa região que atualiza sozinha, `aria-label` num botão só-ícone.
4. **Alvo de toque.** Apple HIG: 44×44pt; Material: 48dp; WCAG 2.2 (SC 2.5.8, nível AA): mínimo 24px. Regra prática AG: 44px de área clicável em qualquer coisa tocável — o ícone pode ter 20px, mas o padding completa o alvo.
5. **Contraste AA** — números e prática no módulo 03 (4.5:1 texto, 3:1 UI).

### O caso reduced-motion (e um trade-off honesto)

`prefers-reduced-motion` é a media query que usuários com desconforto vestibular ligam para reduzir animação. Caso real AG: sessões via RDP no Windows **forçam** essa flag — e por duas vezes uma animação de deck congelou porque o código gateava o movimento nela. A lição: em **produto**, respeite a flag (animação decorativa desliga). Em **deck** rodado pelo apresentador via RDP, a flag é falso-positivo do ambiente — a decisão registrada foi ignorá-la. O anti-padrão não é nenhuma das escolhas — é obedecer ou ignorar **sem saber que a flag existe e sem registrar o trade-off**.

### Passo a passo: passada mínima num app AG

```text
1. TECLADO (5 min): solte o mouse. Tab pela tela inteira.
   - Sempre sei onde o foco está? (foco visível)
   - Alcanço TODOS os interativos? Ordem faz sentido?
   - Modal: Escape fecha? Foco fica preso dentro? Volta pro gatilho?
   Cada "não" é um bug — anote como bug, não como "detalhe".

2. SCANNER (5 min): axe DevTools (extensão) > Scan.
   Pega contraste, label faltando, aria inválido. NÃO pega ordem
   de foco nem focus trap — por isso o passo 1 existe.
   Scanner limpo ≠ acessível: necessário, não suficiente.

3. FIX típico de 3 linhas:
```

```css
:focus-visible { outline: 2px solid var(--info); outline-offset: 2px; }
button, a, [role="button"] { min-height: 44px; min-width: 44px; }
```

Raciocínio de engenheiro: o scanner automatizado cobre ~30–40% dos critérios WCAG. Afirmar "o app é acessível porque o axe passou" é o mesmo erro de afirmar "funciona porque compilou" — evidência parcial tratada como total.

## Por que cai em entrevista

Acessibilidade virou filtro de contratação porque mistura ética, lei (LBI no Brasil, ADA/EAA fora) e qualidade técnica — e porque a maioria dos candidatos não sabe nada além de "usar alt". Quem cita `:focus-visible`, a primeira regra do ARIA e o teste de teclado se diferencia imediatamente; quem cita o limite dos scanners automáticos sinaliza senioridade.

> **P:** "O que você faz de acessibilidade no dia a dia? Sem equipe dedicada."
>
> **R (30s):**
> "Tenho um mínimo não-negociável de cinco itens: foco visível com `:focus-visible`, navegação completa por teclado — meu teste é largar o mouse e tabular a tela, inclusive focus trap em modal —, HTML semântico antes de ARIA, porque button nativo dá teclado e foco de graça, alvo de toque de 44px e contraste AA. Rodo axe DevTools, mas sei que scanner cobre só uns 30% dos critérios — o teste de teclado pega o que ele não vê. E respeito prefers-reduced-motion em produto; já tive caso de RDP forçando essa flag e congelando animação, então sei na pele que ela existe."

## Checkpoint

- [ ] Naveguei uma tela minha inteira só de teclado e registrei cada falha como bug
- [ ] Meu projeto tem `:focus-visible` estilizado (e nenhum `outline: none` órfão)
- [ ] Troquei ao menos um `<div onClick>` por elemento semântico
- [ ] Todos os alvos tocáveis têm ≥ 44px de área (ícone pequeno + padding conta)
- [ ] Rodei axe DevTools e sei explicar por que scanner limpo não basta

## Recursos

- [The A11Y Project — Checklist](https://www.a11yproject.com/checklist/) — o mínimo em formato de checklist
- [axe DevTools — Deque](https://www.deque.com/axe/) — extensão gratuita, o scanner padrão de mercado
- [ARIA Authoring Practices Guide (APG) — W3C](https://www.w3.org/WAI/ARIA/apg/) — padrões de teclado por componente (modal, menu, tabs)
- [The WebAIM Million](https://webaim.org/projects/million/) — o relatório dos ~96%
