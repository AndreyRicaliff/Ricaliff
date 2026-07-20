# 07 — Design System Prático

## O que é

Design system não é uma biblioteca de componentes bonitos — é a **eliminação sistemática de decisões repetidas**. A hierarquia tem três camadas, e a maioria dos times só precisa das duas primeiras:

**1. Tokens** — as decisões atômicas nomeadas: cor, espaço, tipografia, raio, sombra. Dois níveis de nome importam: **primitivo** (`--purple-500`, o valor cru) e **semântico** (`--accent`, o emprego). Componentes consomem SEMPRE o semântico — é isso que torna theming e dark mode possíveis sem reescrever componente. O padrão em emergência para interoperar tokens entre ferramentas é o formato do W3C Design Tokens Community Group; para pipeline multi-plataforma, Style Dictionary é a ferramenta de referência.

**2. Componentes com variantes** — um `Button` com props `variant` (primary/secondary/ghost/danger) e `size` (sm/md/lg), não quatro botões copiados. No stack React/Tailwind, `class-variance-authority` (CVA) — o motor do shadcn/ui — formaliza isso: variantes declaradas num lugar, combinações tipadas. O sinal de que você precisa disso: o mesmo grupo de classes Tailwind colado pela terceira vez (a regra da abstração no 3º uso vale pra UI também).

**3. Documentação do PORQUÊ** — a camada que quase todo mundo pula e a que mais paga. Token sem racional documentado é forkado no primeiro prazo apertado ("aqui precisava de um roxo mais vivo…") e o sistema morre por mil exceções. Uma linha basta: `--accent: usar SÓ em ação primária e marca; nunca em área > 20% da tela`.

O princípio que governa tudo: **consistência > originalidade**. O usuário aprende o sistema uma vez; cada padrão novo-e-criativo cobra novo aprendizado. Na AG isso é literal: as identidades visuais (Pulsar para produtos internos, padrão comercial para dashboards de cliente) vivem como skills/tokens canonizados justamente para NÃO serem reinventadas a cada tela — o valor está na repetição, não na novidade.

### Gotcha real de runtime (caso AG)

Bibliotecas de gráfico/canvas **não resolvem `var(--x)`** na hora de desenhar — canvas quer a cor computada, não a referência CSS. Já quebrou em produção AG: gráfico ignorando a cor do token. O fix: resolver antes de passar:

```ts
const styles = getComputedStyle(document.documentElement);
const accent = styles.getPropertyValue('--accent').trim();
// passar `accent` (valor resolvido) pra lib de chart, nunca 'var(--accent)'
```

### Passo a passo: extrair tokens de uma tela existente

```bash
# 1. Inventário do que existe de fato (evidência antes de opinar):
rg -o "#[0-9a-fA-F]{3,8}" src/ --glob "*.{tsx,css}" | sort | uniq -c | sort -rn
# saída típica: 14 hexes "quase iguais" — 3 cinzas a 1 step de distância
```

```css
/* 2. tokens.css — primitivo -> semântico */
:root {
  --gray-900: #111318;          /* primitivo */
  --text-1: var(--gray-900);    /* semântico: texto primário */
  --surface-1: #ffffff;
  --radius-md: 8px;
  --shadow-1: 0 1px 3px rgb(0 0 0 / 0.1);
}
```

```text
3. Substituir hex por token, UMA família de cor por commit
   (diff revisável; se algo quebrar, o bisect aponta a família).
4. Critério de "pronto": rg de hex no src/ retorna ~zero fora
   de tokens.css. Isso é verificável — "acho que migrei tudo" não é.
```

## Por que cai em entrevista

"Como você mantém consistência visual num projeto que cresce?" é pergunta de pleno por excelência: testa abstração (tokens), API design (variantes) e cultura (documentar o porquê). Citar a separação primitivo/semântico e explicar por que ela habilita dark mode é resposta que entrevistador lembra depois.

> **P:** "Vocês têm design system? Como funciona na prática?"
>
> **R (30s):**
> "Temos a versão pragmática: tokens em dois níveis — primitivo, tipo `purple-500`, e semântico, tipo `accent` — e componente só consome o semântico, que é o que deixa dark mode e theming baratos. Componentes com variantes via CVA em vez de cópias: um Button com variant e size tipados. E documentamos o porquê de cada token numa linha, porque token sem racional é forkado no primeiro prazo apertado. Aprendi na prática um gotcha: canvas não resolve `var()` — gráfico recebe a cor computada via getComputedStyle. O princípio que defendo é consistência acima de originalidade: o usuário aprende o sistema uma vez."

## Checkpoint

- [ ] Sei explicar primitivo vs semântico e por que componente consome só o semântico
- [ ] Rodei o inventário de hex num projeto e consolidei cores "quase iguais"
- [ ] Criei um componente com variantes (CVA ou equivalente) substituindo cópias
- [ ] Cada token novo meu tem uma linha de racional documentada
- [ ] Sei explicar o gotcha do canvas + `var(--x)` e o fix com getComputedStyle

## Recursos

- [shadcn/ui](https://ui.shadcn.com/) — estudar o CÓDIGO dos componentes: tokens semânticos + CVA na prática
- [Radix Colors](https://www.radix-ui.com/colors) — sistema de escalas com papéis documentados por step
- [Style Dictionary](https://styledictionary.com/) — build de tokens multi-plataforma
- [W3C Design Tokens Community Group](https://design-tokens.github.io/community-group/format/) — o draft do formato padrão de tokens
- [Storybook](https://storybook.js.org/) — documentar variantes de componente de forma viva
