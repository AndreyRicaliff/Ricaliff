# 02 — Tipografia

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Tipografia é 90% da interface: quase tudo que o usuário consome é texto. Quatro decisões resolvem a maior parte — **escala**, **line-height**, **medida** e **família** — e uma quinta, `tabular-nums`, separa dashboard profissional de amador. Este módulo é onde a honestidade científica mais importa, porque tipografia é um campo com **pouco lastro experimental e muita convenção de praticante**: parte do que se ensina é legibilidade medida em laboratório, parte é canon estético repetido há séculos. A §BASE separa os dois — e o que sobra de ciência é o mecanismo de como o olho lê.

## § BASE — o fundamento

**Como o olho lê, de verdade (Rayner, 1998).** Ler não é deslizar suavemente pela linha. Keith Rayner, em *Eye movements in reading and information processing: 20 years of research* (Psychological Bulletin, 1998) — a revisão canônica do tema — mostra que o olho avança em **sacadas**: saltos rápidos (~7–9 caracteres) intercalados por **fixações** de ~200–250 ms onde o texto é de fato apreendido. Só uma janela estreita ao redor da fixação é nítida (visão foveal). No fim de cada linha, o olho executa uma **varredura de retorno** (return sweep) — um salto longo para o começo da linha seguinte. **Toda** decisão tipográfica de UI existe para servir essa mecânica: line-height, medida e tamanho de fonte são, no fundo, sobre tornar sacada e varredura de retorno confiáveis. Não é estética — é reduzir a taxa de erro do sistema motor ocular.

**Medida (largura da linha): o que tem lastro e o que é convenção.** O número famoso — 45–75 caracteres por linha, ideal ~66 — foi canonizado por **Robert Bringhurst** em *The Elements of Typographic Style*. Declare o que ele é: **convenção de praticante**, não experimento. O lastro empírico por trás vem da pesquisa de legibilidade de **Miles Tinker**, *Legibility of Print* (1963), que mediu velocidade de leitura contra largura de linha e tamanho de tipo por décadas. E aqui entra a **incerteza declarada honesta**: os resultados de Tinker e da literatura posterior são **ambíguos** — linhas mais longas às vezes produzem leitura mais *rápida*, mas leitores *preferem* e cometem menos erros de retorno em larguras moderadas. O mecanismo por trás é a varredura de retorno (Rayner): linha longa demais → o olho erra o alvo do retorno e relê ou pula uma linha; linha curta demais → varreduras frequentes demais quebram o ritmo. A carga de memória de trabalho também entra (Miller 1956 / Cowan 2001): manter o contexto da frase entre fixações fica mais caro quanto mais a linha se estende. Conclusão prática sóbria: `max-width: ~65ch` é uma **aposta segura** ancorada em mecânica ocular, não uma lei com número mágico exato.

**Line-height depende da largura da coluna — e isso segue da mecânica.** Linha longa exige mais entrelinha para a varredura de retorno achar o começo da próxima linha sem se perder (Rayner). Corpo de texto: 1.5–1.6. Títulos grandes: 1.1–1.2 (entrelinha de corpo num título de 40px abre buracos verticais). A regra que compacta tudo: **quanto maior a fonte OU mais curta a linha, menor o line-height**. Isso não é convenção arbitrária — é a consequência direta de que fontes grandes e linhas curtas já dão pistas suficientes para o retorno.

**Escala modular: convenção útil, não ciência.** Tamanhos de fonte não são escolhidos um a um — derivam de uma base (16px) multiplicada por uma razão constante. Razões clássicas: 1.2 (minor third, denso, bom pra dashboard), 1.25 (major third, uso geral), 1.333 (perfect fourth, editorial/landing). Com base 16 e razão 1.25: 16 → 20 → 25 → 31 → 39. **Declare:** a escala modular é herdada da tradição musical/tipográfica — não há experimento que prove que razões harmônicas leem melhor. O ganho é real, mas de **decisão**, não de percepção: você nunca mais debate "18 ou 19px?" — só existe o degrau da escala. Consistência que elimina micro-decisões (o mesmo espírito de Hick-Hyman, módulo 07 — menos opções, menos custo).

**`tabular-nums`: fato mecânico, não gosto.** Fontes têm dígitos proporcionais por padrão (o "1" é mais estreito que o "8"), então colunas de números "dançam" — as vírgulas não alinham na vertical. `font-variant-numeric: tabular-nums` (propriedade definida na especificação CSS Fonts; ver MDN, seção *font-variant-numeric*) força dígitos de largura igual. Isto é **verificável e binário**, não estético: ou as vírgulas alinham ou não. Obrigatório em qualquer tabela financeira. Caveat que denuncia experiência: nem toda fonte traz *tabular figures* como feature OpenType — Inter tem; muitas Google Fonts não. Então "não alinhou" tem duas hipóteses: falta a propriedade OU a fonte não suporta o feature.

**Pares de fonte — heurística.** A escolha mais segura é UMA família com bons pesos (Inter cobre 400→800 com excelente *rendering* em tela). Par só quando há papel claro: display com personalidade no título + sans neutra no corpo. Duas sans parecidas = parece erro, não escolha. Isto é convenção de praticante — declarada como tal.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As decisões formam uma cascata: as de cima restringem as de baixo, e todas servem à mecânica ocular da §BASE.

```
       ┌──────────────────────────────────────────────┐
LASTRO │ MECÂNICA OCULAR (Rayner 1998)                 │  sacada · fixação · retorno
       │   ↳ dita line-height e medida                 │
       ├──────────────────────────────────────────────┤
MISTO  │ LEGIBILIDADE (Tinker 1963) — ambígua          │  medida 45–75 (aposta segura)
       ├──────────────────────────────────────────────┤
CONV.  │ ESCALA MODULAR (Bringhurst / tradição)        │  base 16 × razão → degraus
       │ PARES DE FONTE (praticante)                   │  uma família, vários pesos
       ├──────────────────────────────────────────────┤
FATO   │ tabular-nums (spec CSS) — binário, verificável│  dígitos alinham ou não
       └──────────────────────────────────────────────┘
```

A ordem de aplicação numa tela nova:

```
família (1, vários pesos) → escala (base + razão por densidade)
        → medida (max-width ~65ch no texto corrido)
        → line-height (por tamanho: corpo 1.5 / título 1.1)
        → tabular-nums (toda coluna de número)
```

Dependências: a razão da escala conversa com **densidade por contexto** (módulo 04 — dashboard denso pede razão menor); o contraste do texto é do **módulo 03**; a escala como sistema de tokens é do **módulo 07**.

## § METODOLOGIA — o passo-a-passo replicável

**1. ESCOLHA uma família com pesos suficientes** (400/500/600/700). Só considere um par quando houver papel narrativo claro.

**2. DERIVE a escala de uma base e uma razão.** Base 16px. Razão por densidade: 1.2 dashboard, 1.25 uso geral, 1.333 editorial. Emita como tokens (`--fs-sm`, `--fs-base`, …) — nunca valores soltos.

**3. FIXE a medida do texto corrido** em `max-width: ~65ch`. É o fix de uma linha que mais melhora legibilidade em página larga.

**4. AJUSTE line-height por tamanho**, não global: corpo 1.5–1.6, títulos grandes 1.1–1.2. Fonte maior/linha mais curta → line-height menor.

**5. APLIQUE `tabular-nums` em toda coluna de número** e alinhe valores à direita (comparação por ordem de grandeza).

**6. VERIFIQUE com evidência, não fé:** renderize `111.111,11` e `888.888,88` — as vírgulas alinham? Meça a medida real em `ch`. "Acho que ficou legível" não conta.

**Anti-padrões:**
- **Tamanho ad hoc:** escolher px caso a caso reintroduz o debate que a escala eliminou.
- **Line-height global:** o mesmo 1.5 em título de 40px abre buracos; em corpo estreito, aperta.
- **Texto corrido full-width:** sem `max-width`, a varredura de retorno erra o alvo — releitura e fadiga.
- **Assumir tabular figures:** afirmar que "tabular-nums não funciona" sem checar se a fonte tem o feature (Inter tem; nem toda tem).

### Passo a passo aplicado: DRE do Pulsar Finance com números alinhados (faça agora, ~20min)

Caso real AG: as tabelas de DRE/DFC do **Pulsar Finance** (produto próprio) são colunas de valores comparados verticalmente. Sem tabular-nums, R$ 1.111,11 e R$ 8.888,88 têm larguras diferentes e a vírgula não alinha.

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

O raciocínio importa mais que a receita: "os números não alinham" tem duas hipóteses — falta a propriedade OU a fonte não suporta o feature. Testar com uma fonte que sabidamente suporta (Inter) isola a variável (método do módulo 05).

## Por que cai em entrevista

Tipografia é onde o entrevistador testa se você tem critério ou copia dribbble. "Por que esse tamanho de fonte?" com resposta "achei bonito" reprova; "é o degrau X de uma escala 1.25 com base 16" aprova — mostra sistema. Saber separar o que é ciência (mecânica ocular) do que é convenção (66ch, escala modular) sinaliza maturidade rara. E `tabular-nums` numa tabela financeira é o detalhe que denuncia experiência real com dados.

> **P:** "Quais decisões tipográficas você toma ao começar uma interface nova?"
>
> **R (30s):**
> "Quatro: escala modular — base 16 e razão 1.2 pra dashboard, 1.25 pra uso geral, assim tamanho de fonte vira degrau, não debate. Line-height por contexto — 1.5 no corpo, 1.1 em título grande, e quanto mais larga a linha, mais entrelinha. Medida de 45 a 75 caracteres com `max-width: 65ch`. E família única com vários pesos, tipo Inter, antes de pensar em par. Num pipeline de DRE que fiz, o detalhe decisivo foi `tabular-nums`: sem ele coluna de valor financeiro não alinha e a tabela parece quebrada."

> **P:** "A regra dos 66 caracteres por linha é ciência ou convenção?"
>
> **R (30s):**
> "É convenção do Bringhurst, mas com um lastro mecânico. O que é ciência é como o olho lê: em sacadas e fixações, com uma varredura de retorno no fim de cada linha — a revisão do Rayner de 98 é a referência. Linha longa demais e o olho erra o alvo do retorno; curta demais e as varreduras quebram o ritmo. A pesquisa de legibilidade do Tinker mediu isso e é honestamente ambígua — linha longa às vezes lê mais rápido, mas as pessoas preferem e erram menos em larguras moderadas. Então eu uso `max-width: 65ch` como aposta segura ancorada na mecânica ocular, não como número mágico. Já a escala modular eu trato como convenção pura — o ganho dela é eliminar decisão, não legibilidade comprovada."

## Checkpoint

- [ ] Montei uma escala modular (base + razão) e sei justificar a razão escolhida
- [ ] Sei explicar a mecânica ocular (sacada/fixação/varredura de retorno) e por que ela dita line-height e medida
- [ ] Separo o que é ciência (leitura, Rayner) do que é convenção (66ch de Bringhurst, escala modular)
- [ ] Apliquei `max-width: 65ch` num bloco de texto e vi a diferença de legibilidade
- [ ] Apliquei `tabular-nums` numa tabela de números e verifiquei o alinhamento com 111/888
- [ ] Consigo defender "uma família, vários pesos" contra "duas fontes porque sim"

## Recursos

- *Eye movements in reading and information processing: 20 years of research* — Keith Rayner (Psychological Bulletin, 1998): a mecânica ocular da leitura (sacadas, fixações, varredura de retorno)
- *Legibility of Print* — Miles A. Tinker (1963): o corpo empírico de legibilidade (largura de linha × tamanho de tipo) — resultados honestamente ambíguos
- *The Elements of Typographic Style* — Robert Bringhurst: a origem do 45–75/66 caracteres — convenção de praticante canonizada
- *The Magical Number Seven* — Miller (1956) / Cowan (2001): carga de memória de trabalho por trás da largura de linha
- MDN — *font-variant-numeric* (seção `tabular-nums`): referência estável da propriedade
- Documentação da família Inter (rsms.me/inter): features OpenType, incluindo tabular figures
