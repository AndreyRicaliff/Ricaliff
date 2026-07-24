# 03 — Cor com Intenção

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Cor em interface não é decoração — é um canal de informação com três empregos: **semântica** (o que esse dado significa), **hierarquia** (o que importa) e **identidade** (de quem é o produto). Quem trata cor como "paleta bonita" mistura os três canais e a interface mente. Este é o módulo com o **lastro mais duro da trilha de design**: contraste tem uma fórmula normativa, não uma opinião. E também tem a parte mais claramente convencional — a semântica das cores é cultural. A §BASE separa os dois.

## § BASE — o fundamento

**A parte com lastro normativo: a fórmula de contraste (WCAG 2.2).** O WCAG 2.2 (W3C Recommendation, 2023), no critério **SC 1.4.3 "Contrast (Minimum)"** (nível AA), não pede "bom contraste" — define um **número** com uma fórmula. A razão de contraste é:

```
              L1 + 0.05
contraste = ───────────      (L1 = luminância do mais claro, L2 do mais escuro)
              L2 + 0.05       resultado de 1:1 (nenhum) a 21:1 (#000 vs #fff)
```

onde **L** é a *luminância relativa*, calculada a partir dos canais sRGB **linearizados** (correção de gama) e ponderados pela sensibilidade do olho a cada cor:

```
L = 0.2126·R + 0.7152·G + 0.0722·B
    (cada canal c: se c ≤ 0.03928 → c/12.92; senão → ((c+0.055)/1.055)^2.4)
```

Os pesos não são arbitrários: o olho humano é **muito** mais sensível ao verde (0.7152) que ao azul (0.0722) — por isso verde "acende" e azul puro sobre preto é quase invisível. Os limiares do AA: **4.5:1** para texto normal, **3:1** para texto grande (≥ 18pt / 24px, ou ≥ 14pt bold / ~19px) e para componentes de UI e gráficos (SC 1.4.11 "Non-text Contrast"). Isto é o que dá para **verificar** — é o objeto do Lab 1 da disciplina (`contrastRatio(hexA, hexB)`): implementar essa fórmula e conferir que `#000/#fff` = 21:1.

**A parte convencional: semântica de cor.** Verde = positivo/entrada, vermelho = negativo/perigo, âmbar = atenção, azul = informativo/ação neutra. **Declare o que é:** convenção **cultural**, não lei perceptual — e culturalmente variável (vermelho é "alta/sorte" em mercados asiáticos; a associação vermelho=perigo vem de sinalização ocidental). A regra dura não é a convenção específica — é a **consistência**: o mesmo verde em todo lugar que significa "positivo", e verde NUNCA usado como decoração. No padrão dos dashboards comerciais AG, os cards KPI têm cor por natureza do dado: receita verde, despesa vermelha — a cor carrega significado de negócio, então um verde decorativo num card neutro seria um bug de comunicação, não uma escolha estética.

**Modelo mental HSL — e por que ele mente (lastro perceptual).** Pensar em hex (`#3B82F6`) é pensar em ruído; pensar em HSL é pensar em três alavancas independentes — **H**ue (matiz), **S**aturation, **L**ightness. Variações de um mesmo azul? Mesmo H, varie L. Hover? L −5. Fundo suave da mesma família? Mesmo H, S baixa, L alta. Isso transforma "escolher 20 cores" em "escolher 3 matizes e derivar o resto". **O caveat que denuncia senioridade tem base perceptual:** o L do HSL **não é perceptualmente uniforme** — amarelo em L 50% parece muito mais claro que azul em L 50%, exatamente pelos pesos de luminância acima (verde/amarelo dominam L). Para escalas geradas por matemática, **OKLCH** (definido na especificação CSS Color Module Level 4, do W3C) corrige isso: seu L *é* aproximadamente perceptual, então "L igual" produz cores de brilho igual. Já tem suporte nos browsers modernos.

**Deficiência de visão de cores — número com origem.** ≈ **8% dos homens** (e ~0.5% das mulheres) de ascendência norte-europeia têm alguma deficiência de visão de cores vermelho-verde (deuteranomalia é a mais comum) — prevalência epidemiológica bem estabelecida. Consequência direta e refutável: "verde e vermelho bastam para distinguir alta de queda" é **falso** para ~1 em cada 12 homens. Cor nunca pode ser o **único** canal de informação — dobre o sinal com ícone ou forma (▲/▼). Isto também é WCAG: SC 1.4.1 "Use of Color".

**Dark mode não é inverter (mecânica, não gosto):** (1) fundo não é preto puro — `#000` cria contraste agressivo e *smearing* em OLED; use cinza-azulado escuro. (2) Elevação vira superfície mais clara, não sombra — sombra some no escuro. (3) Cores saturadas do light mode vibram no escuro (o contraste de luminância contra fundo escuro aumenta a vibração aparente) — dessature. (4) **Todos os pares de contraste se refazem** — reteste com a fórmula, não confie. A identidade Pulsar (AG) é dark-first com roxo só como acento: no escuro, acento saturado em área pequena funciona; em área grande, cansa.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Cor tem duas camadas: uma **normativa** (verificável por fórmula) e uma **convencional** (verificável só por consistência). Tratar convenção como se fosse norma — ou vice-versa — é o erro raiz.

```
                    ┌─────────────────────────────────────┐
NORMATIVO (verificável)  contraste WCAG (fórmula, 4.5/3:1)  │  → Lab 1
   ↑ fórmula, número     luminância relativa (0.2126R…)     │
   │                     perceptual: OKLCH (CSS Color 4)     │
   ├─────────────────────────────────────────────────────────┤
CONVENCIONAL (consistência)  semântica (verde=+, vermelho=−) │  cultural
   ↓ acordo, não lei     identidade (marca = acento)         │
                    └─────────────────────────────────────┘

Nomeação de token: PRIMITIVO (--green-600, valor cru)
                       │
                       ▼
                   SEMÂNTICO (--positive, o EMPREGO) ← componente consome ESTE
```

Dependências: o número do contraste vem para cá do **módulo 06** (acessibilidade) e volta como Lab 1; a arquitetura primitivo→semântico é detalhada no **módulo 07** (design system). A cor como alavanca de hierarquia é do **módulo 01**.

## § METODOLOGIA — o passo-a-passo replicável

**1. DEFINA os matizes semânticos por emprego, não por cor.** Nomeie `--positive`, `--negative`, `--warning`, `--info` — o token diz o que significa. Derive tons (hover, fundo, borda) variando só L/S do mesmo H.

**2. LISTE todos os pares texto/fundo** da tela — inclusive placeholder, disabled, texto sobre imagem e texto branco sobre a cor da marca (muita marca reprova AA com branco).

**3. MEÇA cada par contra a fórmula** (WebAIM Contrast Checker ou o Lab 1). Meta: AA (4.5:1 / 3:1). Reprovou? Ajuste **só o L** até passar — matiz preservado.

**4. DOBRE o sinal de todo dado semântico:** cor + ícone/forma. Refute "cor basta" pensando no daltônico.

**5. REPITA no dark mode do zero:** fundo cinza-escuro, elevação por superfície, dessaturar acentos, e **remedir todos os pares** — os que passavam podem reprovar.

**Anti-padrões:**
- **Cinza-claro "elegante" sobre branco:** o lugar onde júnior mais quebra AA sem perceber. Meça.
- **Cor como único canal:** ~8% dos homens não distinguem verde/vermelho. Dobre o sinal.
- **Escala de tons via L do HSL:** produz brilhos desiguais entre matizes — use OKLCH para geração matemática.
- **Dark mode por inversão:** re-projeto de 4 coisas, não `filter: invert()`.

### Passo a passo aplicado: mapa semântico + verificação de contraste (faça agora, ~20min)

```css
/* tokens semânticos — o nome diz o EMPREGO, não a cor */
:root {
  --positive: hsl(152 60% 32%);   /* verde: entrada, alta   */
  --negative: hsl(0 65% 45%);     /* vermelho: saída, queda */
  --warning:  hsl(38 90% 40%);    /* âmbar: atenção          */
  --info:     hsl(217 80% 46%);   /* azul: neutro/ação       */
}
```

```text
1. Liste TODO par texto/fundo da tela (inclusive placeholder e disabled).
2. Passe cada par no WebAIM Contrast Checker — meta: AA.
   (ou rode seu Lab 1: contrastRatio(hexA, hexB) → a mesma fórmula WCAG)
3. Reprovou? Ajuste só o L do HSL até passar (matiz preservado).
4. Repita no dark mode — os pares que passavam podem reprovar.
5. Hipótese a refutar: "verde e vermelho bastam pra distinguir" —
   falso pra ~8% dos homens (daltonismo). Dobre o sinal: cor + ícone
   ou sinal (▲/▼). Cor nunca é o único canal.
```

## Por que cai em entrevista

Cor é onde se testa se você projeta para o usuário ou para o print do portfólio. Perguntas recorrentes: "como você garante acessibilidade de cor?" e "como você faz dark mode?" — quem responde "inverto as cores" reprova; quem fala em dessaturar, elevação por superfície e re-teste de contraste demonstra que já fez de verdade. Citar a fórmula do contraste (não só o número) mostra que você entende o critério, não decorou.

> **P:** "Como você aborda dark mode num produto que nasceu light?"
>
> **R (30s):**
> "Não é inversão — é re-projeto de quatro coisas. Fundo cinza-azulado escuro, nunca preto puro. Elevação vira superfície mais clara, porque sombra some no escuro. Cores saturadas do light vibram — eu dessaturo. E refaço a verificação de contraste AA par a par, porque os pares se refazem. Trabalho com produto dark-first onde a cor da marca é só acento em área pequena — acento saturado em área grande no escuro cansa o olho. E semântica se mantém nos dois temas: verde é positivo nos dois, com ícone dobrando o sinal por causa de daltonismo."

> **P:** "Como você garante que um par de cores passa em acessibilidade?"
>
> **R (30s):**
> "Contraste no WCAG não é opinião, é fórmula: razão igual a (L1 + 0,05) sobre (L2 + 0,05), onde L é a luminância relativa — os canais sRGB linearizados e ponderados, com o verde pesando 0,72 porque o olho é mais sensível a ele. O AA pede 4,5:1 pra texto normal e 3:1 pra texto grande e componente. Eu listo cada par texto/fundo, inclusive placeholder e texto sobre a cor da marca, e meço — o WebAIM faz, ou o meu próprio verificador que implementa a fórmula. Se reprova, eu mexo só na lightness do HSL até passar, preservando o matiz. E cor nunca é canal único: como ~8% dos homens têm daltonismo vermelho-verde, todo sinal semântico ganha um ícone junto."

## Checkpoint

- [ ] Sei a fórmula do contraste WCAG (razão + luminância relativa) e por que o verde pesa mais
- [ ] Sei os dois números do AA (4.5:1 e 3:1) e a quem cada um se aplica
- [ ] Separo o que é normativo (contraste) do que é convenção cultural (semântica de cor)
- [ ] Consigo derivar hover, fundo suave e borda de uma cor base mexendo só em L/S, e sei por que o L do HSL não é perceptual (OKLCH corrige)
- [ ] Passei todos os pares texto/fundo de uma tela minha no contrast checker (ou no meu Lab 1)
- [ ] Todo dado semântico da minha tela tem um segundo canal além da cor (ícone/sinal)

## Recursos

- WCAG 2.2 (W3C Recommendation, 2023) — SC 1.4.3 "Contrast (Minimum)", SC 1.4.11 "Non-text Contrast", SC 1.4.1 "Use of Color": os critérios e a fórmula de contraste normativa
- *Understanding SC 1.4.3* / *relative luminance* (W3C, definições WCAG): a derivação da luminância relativa e da razão de contraste
- CSS Color Module Level 4 (W3C) — `oklch()`: lightness perceptualmente uniforme, correção do L não-perceptual do HSL
- WebAIM Contrast Checker — a ferramenta que implementa a fórmula (o dia a dia)
- Radix Colors — escalas de 12 steps com contraste garantido por papel; estudar a lógica dos steps
- *Refactoring UI* — Wathan & Schoger, cap. "Working with Color": HSL e "define your shades" — heurística de praticante
