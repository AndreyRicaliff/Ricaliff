# 02 — Tipografia

## O que é

Tipografia é 90% da interface: quase tudo que o usuário consome é texto. Quatro decisões resolvem a maior parte: **escala**, **line-height**, **medida** e **família** — e uma quinta, `tabular-nums`, separa dashboard profissional de amador.

**Escala modular:** tamanhos de fonte não são escolhidos um a um — derivam de uma base (16px) multiplicada por uma razão constante. Razões clássicas: 1.2 (minor third, denso, bom pra dashboard), 1.25 (major third, uso geral), 1.333 (perfect fourth, editorial/landing). Com base 16 e razão 1.25: 16 → 20 → 25 → 31 → 39. O ganho não é estético, é de **decisão**: você nunca mais debate "18 ou 19px?" — só existe o degrau da escala.

**Line-height depende da largura da coluna:** linha longa exige mais entrelinha para o olho achar o começo da próxima linha sem se perder. Corpo de texto: 1.5–1.6. Títulos grandes: 1.1–1.2 (entrelinha de corpo em título de 40px abre buracos). Regra: quanto maior a fonte OU mais curta a linha, menor o line-height.

**Medida (largura da linha):** 45–75 caracteres por linha, ideal ~66 — número canonizado por Robert Bringhurst em *The Elements of Typographic Style*. Abaixo de 45 o texto pica; acima de 75 o olho se perde no retorno. Em CSS: `max-width: 65ch` no container de texto corrido. É o fix de uma linha que mais melhora legibilidade em página larga.

**Pares de fonte:** a escolha mais segura é UMA família com bons pesos (Inter, por exemplo, cobre 400→800 e tem excelente rendering em telas). Par só quando há papel claro: display com personalidade no título + sans neutra no corpo. Duas sans parecidas = parece erro, não escolha.

**`tabular-nums`:** fontes têm dígitos proporcionais por padrão (o "1" é mais estreito que o "8"), então colunas de números dançam. `font-variant-numeric: tabular-nums` força dígitos de largura igual — obrigatório em qualquer tabela financeira.

### Passo a passo: DRE do Pulsar Finance com números alinhados

Caso real AG: as tabelas de DRE/DFC do Pulsar Finance são colunas de valores que precisam ser comparados verticalmente. Sem tabular-nums, R$ 1.111,11 e R$ 8.888,88 têm larguras diferentes e a vírgula não alinha.

```css
/* tokens de tipografia — escala 1.2 base 16, dashboard denso */
:root {
  --fs-sm: 0.813rem;  /* 13 — células de tabela */
  --fs-base: 1rem;    /* 16 */
  --fs-lg: 1.25rem;   /* 20 */
  --fs-xl: 1.563rem;  /* 25 */
}
td.valor {
  font-variant-numeric: tabular-nums;
  text-align: right;          /* número compara pela ordem de grandeza */
}
```

```text
Verificação (evidência, não fé):
1. Renderize duas linhas: 111.111,11 e 888.888,88.
2. As vírgulas alinham na vertical? Se não: a fonte não tem
   tabular figures (confira antes de afirmar que "não funciona" —
   Inter tem; nem toda Google Font tem).
3. Em Tailwind: classe `tabular-nums` pronta, sem CSS custom.
```

O raciocínio importa mais que a receita: "os números não alinham" tem duas hipóteses — falta a propriedade OU a fonte não suporta o feature. Testar com uma fonte que sabidamente suporta (Inter) isola a variável.

## Por que cai em entrevista

Tipografia é onde o entrevistador testa se você tem critério ou copia dribbble. "Por que esse tamanho de fonte?" com resposta "achei bonito" reprova; "é o degrau X de uma escala 1.25 com base 16" aprova — mostra sistema. E `tabular-nums` numa tabela financeira é o tipo de detalhe que sinaliza experiência real com dados.

> **P:** "Quais decisões tipográficas você toma ao começar uma interface nova?"
>
> **R (30s):**
> "Quatro: escala modular — base 16 e razão 1.2 pra dashboard, 1.25 pra uso geral, assim tamanho de fonte vira degrau, não debate. Line-height por contexto — 1.5 no corpo, 1.1 em título grande, e quanto mais larga a linha, mais entrelinha. Medida de 45 a 75 caracteres com `max-width: 65ch`. E família única com vários pesos, tipo Inter, antes de pensar em par. Num pipeline de DRE que fiz, o detalhe decisivo foi `tabular-nums`: sem ele coluna de valor financeiro não alinha e a tabela parece quebrada."

## Checkpoint

- [ ] Montei uma escala modular (base + razão) e sei justificar a razão escolhida
- [ ] Sei explicar por que título grande usa line-height menor que corpo de texto
- [ ] Apliquei `max-width: 65ch` num bloco de texto e vi a diferença de legibilidade
- [ ] Apliquei `tabular-nums` numa tabela de números e verifiquei o alinhamento com 111/888
- [ ] Consigo defender "uma família, vários pesos" contra "duas fontes porque sim"

## Recursos

- [Practical Typography — Matthew Butterick](https://practicaltypography.com/) — o melhor livro gratuito do tema; ler "Typography in ten minutes"
- [Type Scale](https://typescale.com/) — gerador visual de escala modular
- [Inter](https://rsms.me/inter/) — a família e a documentação de features OpenType (tabular figures inclusos)
- [font-variant-numeric — MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric) — referência da propriedade
- *The Elements of Typographic Style* (Robert Bringhurst) — a origem do 45–75
