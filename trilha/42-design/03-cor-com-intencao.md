# 03 — Cor com Intenção

## O que é

Cor em interface não é decoração — é um canal de informação com três empregos: **semântica** (o que esse dado significa), **hierarquia** (o que importa) e **identidade** (de quem é o produto). Quem trata cor como "paleta bonita" mistura os três canais e a interface mente.

**Modelo mental HSL:** pensar em hex (`#3B82F6`) é pensar em ruído; pensar em HSL é pensar em três alavancas independentes — **H**ue (matiz, 0–360 na roda), **S**aturation, **L**ightness. Variações de um mesmo azul? Mesmo H, varie L. Estado hover? L −5. Fundo suave da mesma família? Mesmo H, S baixa, L alta. Isso transforma "escolher 20 cores" em "escolher 3 matizes e derivar o resto". Caveat técnico que denuncia senioridade: o L do HSL **não é perceptual** — amarelo em L 50 parece muito mais claro que azul em L 50. Para escalas geradas por matemática, OKLCH corrige isso (e já tem suporte nos browsers modernos).

**Semântica consistente:** verde = positivo/entrada, vermelho = negativo/perigo, âmbar = atenção, azul = informativo/ação neutra. A regra dura não é a convenção — é a **consistência**: o mesmo verde em todo lugar que significa "positivo", e verde NUNCA usado como decoração. No padrão dos dashboards comerciais AG, os cards KPI têm cor por natureza do dado: receita verde, despesa vermelha — a cor carrega significado de negócio, então um verde decorativo num card neutro seria um bug de comunicação, não uma escolha estética.

**Contraste WCAG AA na prática:** 4.5:1 para texto normal; 3:1 para texto grande (≥ 24px, ou ≥ ~19px bold) e componentes de UI. Onde júnior quebra AA sem perceber: texto cinza-claro "elegante" sobre branco, texto sobre imagem, placeholder de input, e texto branco sobre a cor da marca (muita cor de marca reprova com branco — verifique, não assuma).

**Dark mode não é inverter:** (1) fundo não é preto puro — `#000` cria contraste agressivo e "smearing" em OLED; use cinza-azulado escuro. (2) Elevação vira superfície mais clara, não sombra — sombra some no escuro. (3) Cores saturadas do light mode vibram no escuro — dessature. (4) Todos os pares de contraste se refazem — reteste, não confie. A identidade Pulsar (AG) é dark-first com roxo só como acento: no escuro, acento saturado em área pequena funciona; em área grande, cansa.

### Passo a passo: mapa semântico + verificação de contraste

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
3. Reprovou? Ajuste só o L do HSL até passar (matiz preservado).
4. Repita no dark mode — os pares que passavam podem reprovar.
5. Hipótese a refutar: "verde e vermelho bastam pra distinguir" —
   falso pra ~8% dos homens (daltonismo). Dobre o sinal: cor + ícone
   ou sinal (▲/▼). Cor nunca é o único canal.
```

## Por que cai em entrevista

Cor é onde se testa se você projeta para o usuário ou para o print do portfólio. Perguntas recorrentes: "como você garante acessibilidade de cor?" e "como você faz dark mode?" — quem responde "inverto as cores" reprova; quem fala em dessaturar, elevação por superfície e re-teste de contraste demonstra que já fez de verdade.

> **P:** "Como você aborda dark mode num produto que nasceu light?"
>
> **R (30s):**
> "Não é inversão — é re-projeto de quatro coisas. Fundo cinza-azulado escuro, nunca preto puro. Elevação vira superfície mais clara, porque sombra some no escuro. Cores saturadas do light vibram — eu dessaturo. E refaço a verificação de contraste AA par a par, porque os pares se refazem. Trabalho com produto dark-first onde a cor da marca é só acento em área pequena — acento saturado em área grande no escuro cansa o olho. E semântica se mantém nos dois temas: verde é positivo nos dois, com ícone dobrando o sinal por causa de daltonismo."

## Checkpoint

- [ ] Consigo derivar hover, fundo suave e borda de uma cor base mexendo só em L/S
- [ ] Sei os dois números do AA (4.5:1 e 3:1) e a quem cada um se aplica
- [ ] Passei todos os pares texto/fundo de uma tela minha no contrast checker
- [ ] Todo dado semântico da minha tela tem um segundo canal além da cor (ícone/sinal)
- [ ] Sei explicar 3 diferenças entre dark mode bem-feito e inversão

## Recursos

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — a ferramenta do dia a dia
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/) — critérios 1.4.3 (AA) e 1.4.11 (non-text)
- [Radix Colors](https://www.radix-ui.com/colors) — escalas prontas com contraste garantido por step; estudar a lógica dos 12 steps
- [OKLCH Color Picker — Evil Martians](https://oklch.com/) — para entender lightness perceptual na prática
