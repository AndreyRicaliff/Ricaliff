# 07 — Design System Prático

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Design system não é uma biblioteca de componentes bonitos — é a **eliminação sistemática de decisões repetidas**. Essa definição não é slogan: ela tem lastro em duas leis de psicologia cognitiva que explicam por que *menos escolhas* produz interface mais rápida de usar E mais rápida de construir. A §BASE mostra esse lastro; a arquitetura concreta (tokens, variantes) é convenção de engenharia — boa, mas declarada como tal.

## § BASE — o fundamento

**Por que reduzir escolhas acelera o usuário: Hick-Hyman (1952–53).** William Hick (*On the rate of gain of information*, 1952) e Ray Hyman (*Stimulus information as a determinant of reaction time*, 1953) mediram a mesma relação, hoje a **lei de Hick-Hyman**: o tempo para tomar uma decisão cresce com o **logaritmo** do número de alternativas equiprováveis:

```
RT = a + b · log₂(n + 1)      RT = tempo de reação/decisão
                              n  = número de alternativas equiprováveis
```

Um sistema com **um** botão primário, **um** espaçamento "grande", **uma** cor de ação reduz o `n` de cada micro-decisão do usuário — ele aprende o vocabulário uma vez e reconhece, não delibera. É a mesma lei que justifica "um ponto focal por tela" (módulo 01). Um design system é, no fundo, **Hick-Hyman aplicado à interface inteira**: cada padrão consistente é uma decisão que o usuário não precisa mais tomar.

**Por que consistência reduz carga: Miller (1956) / Cowan (2001).** A memória de trabalho retém ~4 chunks (Cowan, revisando os ~7 de Miller — módulo 01). Interface consistente permite **chunkificar**: "isso é um botão primário" é um chunk aprendido, reutilizado em toda tela. Cada padrão novo-e-criativo, ao contrário, **cobra um novo chunk** — novo aprendizado, nova carga. Daí o princípio que governa tudo: **consistência > originalidade**. O usuário aprende o sistema uma vez; a originalidade gratuita é imposto cognitivo. Na AG isso é literal: as identidades (Pulsar para produtos internos, padrão comercial para dashboards de cliente) vivem como skills/tokens canonizados justamente para **não** serem reinventadas a cada tela — o valor está na repetição, não na novidade.

**A mesma economia, do lado do desenvolvedor.** O ganho de "eliminar decisão" que aparece na escala tipográfica (módulo 02) e na escala de espaço (módulo 04) é o mesmo aqui, generalizado: `p-4` em vez de "13 ou 14px?", `--accent` em vez de "qual roxo?". Cada decisão pré-tomada e nomeada é uma que ninguém redebate. É por isso que design system é ferramenta de **velocidade de time**, não só de consistência visual.

**A arquitetura de tokens é convenção de engenharia (declarada).** A separação **primitivo → semântico** não é lei perceptual — é uma **convenção de engenharia** madura, análoga a "não hardcode magic numbers". Dois níveis de nome:

- **Primitivo:** o valor cru nomeado — `--purple-500`, `--gray-900`. É a paleta.
- **Semântico:** o **emprego** — `--accent`, `--text-1`, `--surface-1`. Aponta para um primitivo.

Componentes consomem **sempre** o semântico. É isso — e só isso — que torna theming e dark mode possíveis sem reescrever componente: troca-se para onde `--accent` aponta, o componente nem sabe. Para interoperar tokens entre ferramentas, o formato do **W3C Design Tokens Community Group** é o padrão em emergência; para pipeline multi-plataforma, Style Dictionary é a referência. Componentes com **variantes** (um `Button` com `variant` e `size`, não quatro botões copiados) formalizam a abstração — no stack React/Tailwind, `class-variance-authority` (CVA, o motor do shadcn/ui). O sinal de que você precisa disso é a regra da casa: o mesmo grupo de classes colado pela **terceira vez** (abstração no 3º uso).

**A camada que quase todos pulam: documentar o PORQUÊ.** Token sem racional documentado é forkado no primeiro prazo apertado ("aqui precisava de um roxo mais vivo…") e o sistema morre por mil exceções. Uma linha basta: `--accent: usar SÓ em ação primária e marca; nunca em área > 20% da tela`. Sem o porquê, a consistência (o ativo inteiro do sistema, por Hick-Hyman) corrói.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Três camadas, e a maioria dos times só precisa das duas primeiras:

```
   COMPONENTES  ── Button(variant, size) via CVA ──┐  consome só ▼
        │                                          │
   TOKENS ── semântico  --accent, --text-1  ───────┘  ← aponta para ▼
        │    primitivo  --purple-500, --gray-900
        │
   DOC DO PORQUÊ ── 1 linha por token (regra de uso)   ← a camada que segura tudo

   Fluxo de consumo:   componente → semântico → primitivo → valor
   Troca de tema:      só remapeia semântico→primitivo; componente intocado
```

Por que a direção do consumo importa: se um componente consome primitivo (`--purple-500`) direto, o dark mode obriga a reescrever o componente. Consumindo `--accent`, muda-se um ponteiro. Dependências: os tokens de cor vêm do **módulo 03** (e o gotcha do canvas, abaixo, é `vercel-react-best-practices`); as escalas de tipo e espaço são módulos 02 e 04; a auditoria "usa o sistema ou inventa?" é um eixo da crítica (**módulo 08**).

## § METODOLOGIA — o passo-a-passo replicável

**1. INVENTARIE o que já existe** (evidência antes de opinar): `grep` de hexes e valores arbitrários. Quase sempre aparecem "14 cinzas quase iguais".

**2. DEFINA primitivos** a partir do inventário consolidado (junte os "quase iguais" num só).

**3. MAPEIE semânticos por emprego** — `--text-1`, `--accent`, `--surface-1` — apontando para primitivos.

**4. MIGRE componentes para o semântico**, uma família de cor por commit (diff revisável; se quebrar, o bisect aponta a família).

**5. ABSTRAIA em variantes no 3º uso** (CVA/equivalente) — não antes.

**6. DOCUMENTE o porquê de cada token** numa linha, e defina o critério de "pronto" verificável: `grep` de hex fora de `tokens.css` retorna ~zero.

**Anti-padrões:**
- **Componente consumindo primitivo:** mata theming; dark mode vira reescrita.
- **Abstrair no 1º uso:** variante prematura antes de saber quais variam de verdade.
- **Token sem racional:** forkado no primeiro prazo; o sistema morre por exceções.
- **Originalidade gratuita:** cada padrão novo cobra um chunk do usuário (viola Hick-Hyman/consistência).
- **`var(--x)` no canvas:** libs de gráfico/canvas **não** resolvem `var()` — quebra em produção (gotcha AG abaixo).

### Gotcha real de runtime (caso AG)

Bibliotecas de gráfico/canvas **não resolvem `var(--x)`** na hora de desenhar — canvas quer a cor computada, não a referência CSS. Já quebrou em produção AG: gráfico ignorando a cor do token. O fix: resolver antes de passar.

```ts
const styles = getComputedStyle(document.documentElement);
const accent = styles.getPropertyValue('--accent').trim();
// passar `accent` (valor resolvido) pra lib de chart, nunca 'var(--accent)'
```

### Passo a passo aplicado: extrair tokens de uma tela existente (faça agora, ~25min)

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

"Como você mantém consistência visual num projeto que cresce?" é pergunta de pleno por excelência: testa abstração (tokens), API design (variantes) e cultura (documentar o porquê). Citar a separação primitivo/semântico e explicar por que ela habilita dark mode é resposta que entrevistador lembra depois. Ligar consistência a Hick-Hyman mostra que você entende o *valor* do sistema, não só a mecânica.

> **P:** "Vocês têm design system? Como funciona na prática?"
>
> **R (30s):**
> "Temos a versão pragmática: tokens em dois níveis — primitivo, tipo `purple-500`, e semântico, tipo `accent` — e componente só consome o semântico, que é o que deixa dark mode e theming baratos. Componentes com variantes via CVA em vez de cópias: um Button com variant e size tipados. E documentamos o porquê de cada token numa linha, porque token sem racional é forkado no primeiro prazo apertado. Aprendi na prática um gotcha: canvas não resolve `var()` — gráfico recebe a cor computada via getComputedStyle. O princípio que defendo é consistência acima de originalidade: o usuário aprende o sistema uma vez."

> **P:** "Por que 'consistência acima de originalidade'? Não é papel do design ser criativo?"
>
> **R (30s):**
> "Porque originalidade gratuita é imposto cognitivo, e isso tem lastro. Hick-Hyman: o tempo de decisão cresce com o log do número de opções — então padrão consistente reduz as micro-decisões do usuário, ele reconhece em vez de deliberar. E Miller-Cowan: a memória de trabalho é limitada, uns quatro chunks; 'isso é um botão primário' vira um chunk aprendido e reusado em toda tela, enquanto cada padrão novo-e-criativo cobra um chunk novo. Um design system é basicamente essas duas leis aplicadas à interface inteira. A criatividade eu gasto onde muda o resultado do usuário, não em reinventar o botão a cada tela — por isso na AG as identidades vivem como tokens canonizados, pra não reinventar."

## Checkpoint

- [ ] Sei explicar por que design system = "eliminar decisões" com lastro em Hick-Hyman e Miller/Cowan
- [ ] Sei explicar primitivo vs semântico e por que componente consome só o semântico (habilita dark mode)
- [ ] Separo o que é lei (consistência reduz carga/tempo) do que é convenção de engenharia (arquitetura de tokens)
- [ ] Rodei o inventário de hex num projeto e consolidei cores "quase iguais"
- [ ] Criei um componente com variantes (CVA ou equivalente) substituindo cópias, e documentei o porquê dos tokens
- [ ] Sei explicar o gotcha do canvas + `var(--x)` e o fix com getComputedStyle

## Recursos

- *On the rate of gain of information* — William Hick (1952) e *Stimulus information as a determinant of reaction time* — Ray Hyman (1953): a lei de Hick-Hyman (tempo de decisão × log das opções)
- *The Magical Number Seven* — Miller (1956) / *The magical number 4* — Cowan (2001): carga de memória de trabalho por trás de "consistência > originalidade"
- W3C Design Tokens Community Group — o formato padrão (em emergência) de tokens
- Style Dictionary — build de tokens multi-plataforma (referência de pipeline)
- shadcn/ui + `class-variance-authority` (CVA) — tokens semânticos + variantes tipadas na prática (estudar o código)
- Radix Colors — escalas com papéis documentados por step; Storybook — documentar variantes de forma viva
