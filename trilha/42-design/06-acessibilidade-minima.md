# 06 — Acessibilidade Mínima

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Acessibilidade tem uma versão maximalista (auditoria WCAG completa, leitores de tela, AAA) e uma versão **mínima profissional não-negociável** — cinco itens que cabem em qualquer sprint e cuja ausência é defeito, não "melhoria futura". Escala do problema, com número de origem: **The WebAIM Million** (relatório anual do WebAIM) encontrou falhas WCAG *detectáveis automaticamente* em ~**96%** do 1 milhão de homepages mais acessadas. Cumprir o mínimo já te coloca na minoria. Este módulo tem lastro incomum para design: parte é **lei física** (Fitts) e parte é **critério normativo numerado** (WCAG 2.2).

## § BASE — o fundamento

**A lei por trás do alvo de toque: Fitts (1954).** Paul Fitts, em *The information capacity of the human motor system in controlling the amplitude of movement* (Journal of Experimental Psychology, 1954), estabeleceu a lei que rege todo apontar-e-clicar. O tempo para atingir um alvo é:

```
MT = a + b · log₂(2D / W)          MT = tempo de movimento
                                    D  = distância até o alvo
ID = log₂(2D / W)  (em bits)       W  = largura do alvo na direção do movimento
```

O termo `log₂(2D/W)` é o **índice de dificuldade (ID)**. A consequência é direta e não-opinativa: **dobrar W (o alvo) reduz o ID e, portanto, o tempo e a taxa de erro** — e o efeito é logarítmico, então alvos pequenos custam desproporcionalmente caro. É *por isso* que botão minúsculo é lento e frustrante, e por que alvo de toque grande não é "capricho": é reduzir MT e erro de uma população que inclui quem tem tremor, baixa visão ou está num ônibus balançando. Fitts é **lei experimental replicada** (a formulação de Shannon, por MacKenzie 1992, refinou a fórmula) — não convenção.

**Onde a lei vira número normativo: WCAG 2.2, por critério.** O WCAG 2.2 (W3C Recommendation, 2023) traduz o princípio de Fitts e os demais em critérios **numerados e verificáveis** — o vocabulário que você deve citar por número:

- **SC 2.5.5 "Target Size (Enhanced)"** (AAA): alvo ≥ **44×44** CSS px. Convergente com Apple HIG (44pt) e Material (48dp).
- **SC 2.5.8 "Target Size (Minimum)"** (AA, novo na 2.2): alvo ≥ **24×24** CSS px. Regra prática AG: mirar 44px de área clicável — o ícone pode ter 20px, o padding completa o alvo.
- **SC 2.1.1 "Keyboard"** (A): toda funcionalidade operável por teclado.
- **SC 2.4.7 "Focus Visible"** (AA): o foco de teclado tem indicador visível.
- **SC 2.4.11 "Focus Not Obscured (Minimum)"** (AA, novo na 2.2): o elemento focado não fica escondido atrás de header fixo/sticky.
- **SC 4.1.2 "Name, Role, Value"** (A): todo componente expõe nome, papel e estado à API de acessibilidade — a base do ARIA.
- **SC 1.4.3 "Contrast (Minimum)"** (AA): 4.5:1 / 3:1 — a fórmula está no módulo 03.

**A primeira regra do ARIA é não usar ARIA.** `<button>` nativo já traz foco, teclado (Enter/Espaço) e semântica de graça (satisfaz 2.1.1, 2.4.7 e 4.1.2 sem esforço). `<div onClick>` precisa de `role`, `tabindex` e handler de teclado para *imitar mal* o que o botão dá pronto — e quase sempre esquece um. ARIA entra só no que o HTML **não** cobre: `aria-expanded` num accordion, `aria-live` numa região que atualiza sozinha, `aria-label` num botão só-ícone. Esta é a diretriz nº 1 do W3C ARIA Authoring Practices Guide (APG).

**O limite dos scanners (rigor de engenheiro).** Scanner automatizado (axe DevTools, o padrão de mercado da Deque) cobre estimadamente **~30–40%** dos critérios WCAG — pega contraste, label faltando, ARIA inválido. Ele **não** pega ordem de foco, *focus trap*, se o alvo é grande o bastante para uso real, nem se o `aria-label` faz sentido. Afirmar "o app é acessível porque o axe passou" é o mesmo erro de "funciona porque compilou": evidência **parcial** tratada como total. Scanner limpo é necessário, não suficiente — o teste de teclado (grátis) pega o que ele não vê.

**Incerteza declarada — reduced-motion e o falso-positivo de ambiente.** `prefers-reduced-motion` é a media query que usuários com desconforto vestibular ligam para reduzir animação. Caso real AG: sessões via **RDP no Windows forçam** essa flag — e por duas vezes uma animação de deck congelou porque o código gateava o movimento nela. A lição é um **trade-off honesto, não uma regra única**: em **produto**, respeite a flag (animação decorativa desliga). Em **deck** rodado pelo apresentador via RDP, a flag é falso-positivo do ambiente — a decisão registrada foi ignorá-la. O anti-padrão não é nenhuma das escolhas — é obedecer ou ignorar **sem saber que a flag existe e sem registrar o trade-off** (ver a memória `reduced-motion-rdp-congela-animacao`).

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A acessibilidade tem uma base que dá quase tudo de graça (HTML semântico) e camadas que só se adicionam quando a base não cobre. Construa de baixo para cima:

```
        ┌──────────────────────────────┐
   topo │ ARIA (só onde HTML não cobre) │  aria-expanded, aria-live, aria-label
        ├──────────────────────────────┤
        │ contraste AA (SC 1.4.3)       │  ← módulo 03
        │ alvo ≥ 44px (Fitts / 2.5.x)   │
        │ foco visível (SC 2.4.7)       │
        ├──────────────────────────────┤
   base │ HTML SEMÂNTICO                │  <button>,<a>,<nav>,<label>,<h1..h6>
        │ (teclado + foco + role grátis)│  satisfaz 2.1.1, 2.4.7, 4.1.2
        └──────────────────────────────┘

Cobertura de teste:  scanner (axe) ≈ 30–40%  ┃  teclado (mão) pega o resto crítico
                     └─ contraste, label, ARIA ┃  └─ ordem de foco, trap, alvo real
```

Dependências: o número do contraste é do **módulo 03**; a acessibilidade é um dos 5 eixos da crítica (**módulo 08**); o hábito de auditar antes de afirmar conversa com a trilha `60-seguranca` e com `01-verificar-antes-de-afirmar`.

## § METODOLOGIA — o passo-a-passo replicável

**1. COMECE por HTML semântico.** Antes de qualquer ARIA: é `<button>`, `<a>`, `<nav>`, `<label>`? A base resolve teclado, foco e papel de graça.

**2. GARANTA foco visível com `:focus-visible`.** `outline: none` sem substituto é o pecado capital (cega o usuário de teclado). `:focus-visible` mostra o anel no teclado e não no clique de mouse. Custo: 3 linhas.

**3. DIMENSIONE os alvos** para ≥ 44px de área clicável (Fitts + SC 2.5.x). Ícone pequeno + padding conta.

**4. USE ARIA só no que o HTML não cobre** — e sempre com `Name, Role, Value` (4.1.2) em mente.

**5. TESTE de teclado (largue o mouse):** Tab pela tela inteira, ordem lógica, Enter/Espaço aciona; modal fecha com Escape, prende o foco (trap) e devolve ao gatilho. Cada "não" é bug.

**6. RODE o scanner (axe) sabendo o limite:** ele é necessário, não suficiente. O passo 5 pega o que ele não vê.

**Anti-padrões:**
- **`outline: none` órfão:** foco invisível — o usuário de teclado fica cego.
- **`<div onClick>`:** reinventa mal o `<button>`; quase sempre falta teclado ou role.
- **Alvo de 20px "porque o ícone é pequeno":** o padding é obrigatório, não opcional (Fitts).
- **"Passou no axe = acessível":** evidência parcial como total; ordem de foco e trap ficam de fora.
- **Gatear animação em reduced-motion sem saber que a flag existe:** vira congelamento em RDP.

### Passo a passo aplicado: passada mínima num app AG (faça agora, ~15min)

```text
1. TECLADO (5 min): solte o mouse. Tab pela tela inteira.
   - Sempre sei onde o foco está? (foco visível — SC 2.4.7)
   - Alcanço TODOS os interativos? Ordem faz sentido? (SC 2.1.1)
   - Modal: Escape fecha? Foco fica preso dentro? Volta pro gatilho?
   - O foco some atrás do header fixo? (SC 2.4.11)
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

Raciocínio de engenheiro: o scanner cobre ~30–40% dos critérios WCAG. Afirmar "o app é acessível porque o axe passou" é o mesmo erro de "funciona porque compilou" — evidência parcial tratada como total (método do módulo 05 / `01-verificar`).

## Por que cai em entrevista

Acessibilidade virou filtro de contratação porque mistura ética, lei (LBI no Brasil, ADA/EAA fora) e qualidade técnica — e porque a maioria dos candidatos não sabe nada além de "usar alt". Quem cita `:focus-visible`, a primeira regra do ARIA e o teste de teclado se diferencia imediatamente; quem cita o limite dos scanners e a lei de Fitts por trás do alvo de toque sinaliza senioridade real.

> **P:** "O que você faz de acessibilidade no dia a dia? Sem equipe dedicada."
>
> **R (30s):**
> "Tenho um mínimo não-negociável de cinco itens: foco visível com `:focus-visible`, navegação completa por teclado — meu teste é largar o mouse e tabular a tela, inclusive focus trap em modal —, HTML semântico antes de ARIA, porque button nativo dá teclado e foco de graça, alvo de toque de 44px e contraste AA. Rodo axe DevTools, mas sei que scanner cobre só uns 30% dos critérios — o teste de teclado pega o que ele não vê. E respeito prefers-reduced-motion em produto; já tive caso de RDP forçando essa flag e congelando animação, então sei na pele que ela existe."

> **P:** "Por que o alvo de toque tem que ser grande? 24 ou 44 pixels, tanto faz?"
>
> **R (30s):**
> "Não é capricho, é a lei de Fitts, de 1954: o tempo pra acertar um alvo é proporcional ao log de distância sobre largura do alvo. Dobrar o tamanho do alvo derruba o tempo e a taxa de erro — e como é logarítmico, alvo pequeno custa desproporcionalmente caro, ainda mais pra quem tem tremor ou baixa visão. O WCAG 2.2 numerou isso: SC 2.5.8 pede no mínimo 24 CSS pixels no nível AA, e o 2.5.5 pede 44 no AAA, que bate com o Apple HIG. Minha regra prática é mirar 44 de área clicável: o ícone pode ter 20, o padding completa o alvo. Então 24 é o piso legal, 44 é o alvo de qualidade."

## Checkpoint

- [ ] Sei enunciar a lei de Fitts e ligá-la ao tamanho de alvo (SC 2.5.5 / 2.5.8)
- [ ] Cito os critérios WCAG 2.2 por número: 2.1.1, 2.4.7, 2.5.8, 4.1.2, 1.4.3
- [ ] Naveguei uma tela minha inteira só de teclado e registrei cada falha como bug
- [ ] Meu projeto tem `:focus-visible` estilizado (e nenhum `outline: none` órfão)
- [ ] Troquei ao menos um `<div onClick>` por elemento semântico
- [ ] Rodei axe DevTools e sei explicar por que scanner limpo (~30–40%) não basta

## Recursos

- *The information capacity of the human motor system…* — Paul Fitts (Journal of Experimental Psychology, 1954): a lei do alvo de toque (MT = a + b·log₂(2D/W))
- WCAG 2.2 (W3C Recommendation, 2023) — SC 2.5.5 e 2.5.8 (Target Size), 2.1.1 (Keyboard), 2.4.7 (Focus Visible), 2.4.11 (Focus Not Obscured), 4.1.2 (Name, Role, Value): os critérios por número
- ARIA Authoring Practices Guide (APG) — W3C: "a primeira regra do ARIA é não usar ARIA" e os padrões de teclado por componente
- The WebAIM Million — WebAIM: o relatório dos ~96% (número com origem)
- axe DevTools — Deque: o scanner padrão de mercado (e a estimativa de cobertura ~30–40%)
- Memória AG `reduced-motion-rdp-congela-animacao`: o trade-off registrado do falso-positivo de ambiente
