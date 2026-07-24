# 03 — Nomes vs Comentários

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na mesa),
> §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão-ouro de `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

**Nome bom mata comentário de "o quê".** Um comentário que *descreve o que o código faz* é uma confissão de que o nome falhou — o código já diz o quê. Mas atenção ao salto seguinte: "código bom dispensa TODO comentário" é uma afirmação **contestada**, e defendê-la sem nuance é sinal de quem nunca precisou explicar um *porquê*. Este módulo separa os dois eixos — **nome** (carrega o "o quê") e **comentário** (carrega o "por quê" e o contrato de abstração) — e te arma para o debate real que existe na literatura sobre até onde o código se auto-documenta.

---

## § BASE — o fundamento

**Nomear tem evidência empírica de verdade — diferente de "funções curtas".** Aqui o chão é mais firme que na maior parte de "clean code". Dawn Lawrie et al., em *What's in a Name? A Study of Identifiers* (ICPC, 2006), mediram comprensão e recall de código com identificadores em três formas — palavras completas, abreviações e letra única — e encontraram **palavras completas superiores** para entender e lembrar o código. Johannes Hofmeister, Janet Siegmund e Daniel Holt, em *Shorter Identifier Names Take Longer to Comprehend* (SANER, 2017), reforçaram com experimento controlado: **palavras > abreviações > letras únicas** em velocidade de compreensão — letras únicas foram as mais lentas, apesar de "menos texto". Ou seja, `remainingCredit` não é só mais bonito que `x`: há dado dizendo que o leitor o processa mais rápido. Declaração de rigor: este é um dos poucos pontos de "código limpo" com suporte experimental razoável — cite-o de cabeça erguida, ao contrário das alegações sobre tamanho de função.

**A regra de formação, com dono.** Robert C. Martin, em *Clean Code* (2008), cap. 2 "Meaningful Names", dá as convenções que a indústria adotou: nome revela **intenção**, evita desinformação, é pronunciável e pesquisável. Variável = substantivo (`pendingOrders`); função = verbo + objeto (`fetchUserById`); booleano = `is`/`has`/`can`/`should`. Abreviação só quando é convenção universal (`id`, `url`, `db`, `ctx`) — `mgr` não é convenção, é preguiça. Numeral no nome (`handler2`, `newData`) é smell: se precisou do 2, o 1 tem nome errado. O smell tem nome no catálogo de Kent Beck e Martin Fowler (*Refactoring* 2ª ed, 2018): **Mysterious Name** — e a cura é a refatoração **Rename Variable** / **Change Function Declaration**.

**O debate de fato — Martin × Ousterhout sobre comentários.** Em *Clean Code* cap. 4, Martin trata comentário como **um mal necessário**: todo comentário representa uma falha em se expressar no código; o ideal é código tão claro que dispense a prosa. John Ousterhout, em *A Philosophy of Software Design* (2018), discorda **de frente**. No cap. 12 ("Why Write Comments? The Four Excuses") ele desmonta as quatro desculpas para não comentar — e a primeira é exatamente **"código bom se auto-documenta"**, que ele chama de bogus. O argumento central (cap. 13): boa parte da informação que o leitor precisa **não é derivável do código** — sobretudo a **abstração da interface** (o *que* um módulo faz e *quais garantias oferece*, sem o *como*). Ler a implementação inteira pra reconstruir isso derrota o propósito da abstração; um comentário de interface entrega o contrato de graça. Existe até um diálogo público gravado entre os dois — "clean code vs philosophy" é literatura viva, não flame de fórum.

**Por que o código não se auto-documenta por completo.** Peter Naur, em *Programming as Theory Building* (1985), argumentou que programar é construir uma **teoria** na cabeça do programador — e essa teoria (o porquê das decisões, os invariantes, o modelo mental) **nunca cabe inteira no texto do programa**. O código mostra o *como*; o *porquê* e o *contrato* vivem parcialmente fora dele. No extremo oposto do espectro está Donald Knuth com *Literate Programming* (The Computer Journal, 1984): prosa como cidadã de primeira classe, código intercalado na explicação. Os dois polos delimitam o campo: **nem só código (perde a teoria), nem só prosa (Knuth é raro na prática).** O ponto de equilíbrio é o que Ousterhout defende — comente o que não é óbvio a partir do código.

**A síntese que resolve o falso dilema.** Martin e Ousterhout **concordam** num ponto: comentário que repete o código em inglês (`// incrementa i`) é lixo — some. Eles **divergem** em outro: Martin vê comentário como falha; Ousterhout vê comentário de *porquê* e de *interface* como parte essencial do design. A posição defensável reúne os dois eixos: **o nome carrega o "o quê"** (e há dado empírico de que nome bom acelera a leitura); **o comentário carrega o "por quê", o workaround, a restrição externa e o contrato de abstração** que o código não expressa. Comentário de "o quê" você apaga renomeando; comentário de "por quê" você defende com Ousterhout.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Dois eixos, nunca confundir:

```
   O "O QUÊ"  ───────────────►  responsabilidade do NOME
   (o que este código faz)       (evidência: Lawrie 2006, Hofmeister 2017)
        │ comentário que descreve isto = MULETA → renomear e apagar
        ▼
   O "POR QUÊ" ──────────────►  responsabilidade do COMENTÁRIO
   (por que assim, e não óbvio)  workaround · restrição externa · trade-off · contrato
        │ isto o código NÃO expressa (Naur 1985; Ousterhout cap. 13) → manter
        ▼
   espectro:  [só código: perde a teoria] ── equilíbrio ── [literate: Knuth, raro]
```

Triagem de comentário (árvore de decisão):

| O comentário… | Ação | Fonte do critério |
|---|---|---|
| descreve **o quê** o código faz | Apagar + renomear | Martin cap. 2/4 (nome carrega o quê) |
| explica **por quê** (decisão/trade-off não óbvio) | Manter | Ousterhout cap. 13; Naur 1985 |
| documenta **workaround** de bug externo | Manter + referência (issue/versão) | Sem ele, alguém "limpa" e quebra |
| descreve o **contrato/abstração** da interface | Manter | Ousterhout cap. 13 (a interface não se lê no corpo) |
| é **código comentado** | Apagar — está no git | Polui leitura; nunca é descomentado |
| é **TODO sem data/contexto** | Virar issue ou apagar | TODO eterno = lixo invisível |

**Dependências:** apoia-se em `01-srp` (função com nome de intenção nasce da decomposição por responsabilidade) e em `05-raciocinio` (nome ruim força o leitor a segurar o significado na memória de trabalho).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LISTAR os comentários** do módulo (excluindo lint/`@ts-`/URLs de ferramenta).

**2. CLASSIFICAR cada um** pela árvore acima: o quê / por quê / workaround / contrato / código morto / TODO órfão.

**3. Para os de "o quê": RENOMEAR** a variável ou função que gerou a muleta (Rename Variable / Change Function Declaration) e apagar o comentário. Prefira palavra completa a abreviação (Lawrie/Hofmeister).

**4. Para os de "por quê"/contrato/workaround: MANTER e completar** — todo workaround ganha referência (número da issue, versão da lib, "descoberto empiricamente").

**5. Apagar código comentado e TODOs órfãos** (o git guarda o histórico; TODO sem compromisso vira issue ou some).

**Anti-padrões:**
- **Comentar tudo "pra documentar":** usa comentário como muleta de nome fraco; envelhece e passa a **mentir** quando o código muda.
- **Zero comentário por dogma:** deixa o *porquê* e o contrato de fora — o próximo leitor reconstrói a teoria na marra (Naur) ou "limpa" um workaround e quebra produção.
- **Abreviar pra economizar tecla:** `usr`, `mgr`, `q` — contra a evidência de comprensão; o custo de digitar `user` é pago uma vez, o de ler `usr` é pago sempre.

**Aplicado — os três comentários que se mantêm:**

```ts
// 1. POR QUÊ (trade-off não óbvio): a fila não suporta prioridade dinâmica após enqueue;
// removemos e re-adicionamos com nova prioridade. Aceita duplicata por ~200ms (janela de race).
await queue.remove(jobId)
await queue.add(jobData, { priority: newPriority })

// 2. WORKAROUND com referência: Puppeteer 21.x vaza memória em páginas com Shadow DOM
// se o frame não for fechado explicitamente. Remover ao subir p/ 22+. Issue: puppeteer#XXXXX
await frame.detach()
await page.close()

// 3. RESTRIÇÃO EXTERNA não mapeável em código: o ERP-externo rejeita lotes > 50 itens
// (limite não documentado, descoberto empiricamente). Não mexer sem testar.
const BATCH_SIZE = 50
```

Nenhum desses é derivável do código lendo o corpo — são exatamente o que Ousterhout (cap. 13) e Naur (1985) dizem que precisa de prosa. Já `// calculate the user's remaining credit` acima de `const x = ...` some: vira `const remainingCredit = user.creditLimit - user.totalSpent`.

---

## Passo-a-passo aplicado (faça agora, ~30min)

1. **Listar comentários do PULSAR-RH** (produto próprio):
   ```bash
   rg -n "//\s" "C:/Projetos/PULSAR-RH/src" -g "*.ts" -g "*.js" \
     | rg -v "eslint|prettier|@ts-|TODO|FIXME|https?://" | head -40
   ```

2. **Classificar ≥ 10** pela árvore da §ESTRUTURAÇÃO (o quê / por quê / workaround / contrato / código morto / TODO).

3. **Agir:** renomear ≥ 3 variáveis/funções cujo comentário descrevia "o quê" (e apagar o comentário); completar com referência os workarounds sem link.

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-07-XX — [refactor] triagem de comentários e nomes em src/
   **Problema:** N comentários descreviam O QUÊ (muleta de nome fraco).
   **Ação:** apaguei X comentários de "o quê" + renomeei Y identificadores (palavra completa,
   não abreviação); mantive Z de "por quê"/workaround/contrato, com referência adicionada.
   **Por quê:** nome carrega o "o quê" e há evidência de que palavra completa acelera a leitura
   (Lawrie 2006; Hofmeister 2017); o "por quê" o código não expressa (Ousterhout cap. 13; Naur 1985).
   **Consequências:** comentário que sobra é só o que agrega contexto não-derivável do código.
   **Em entrevista (30s):** "comentário de 'o quê' é muleta — renomeio e apago. Mantenho 'por quê',
   workaround e contrato de interface, que o código não expressa. Nome bom tem dado a favor."
   ```

5. **Commit:** `refactor: rename identifiers and triage comments in <módulo>`

---

## Por que cai em entrevista

"Você comenta seu código?" parece trivial e é filtro de senioridade: a resposta revela se você pensa em quem lê depois. Respostas fracas: "comento tudo" (muleta) ou "não, código bom se explica" (nunca teve um workaround legítimo). A resposta certa é **matizada por tipo de comentário** — e, num nível pleno+, sabe citar o debate Martin × Ousterhout.

> **P:** "Você comenta seu código?"
>
> **R (30s):**
> "Depende do tipo de comentário. Comentário que explica O QUÊ o código faz — não. Esse é sinal de que o nome está fraco. Se preciso comentar `// get user's remaining credit`, o problema é que a variável se chama `x`. Renomeio ela e deleto o comentário.
>
> Comentário que explica POR QUÊ — sim, quando o motivo não é óbvio. Workaround de bug em lib externa, restrição de API que descobri empiricamente, decisão de performance com trade-off. Esse contexto não cabe no código e se eu não escrever, alguém vai 'limpar' e quebrar tudo.
>
> Na prática: se meu comentário começa com um verbo descrevendo o que o próximo bloco faz, eu deleto e melhoro o nome."

> **P:** "Quando você deletaria um comentário existente num code review?"
>
> **R (30s):**
> "Quando ele descreve o quê o código faz. Se tenho `// loop through employees and filter active` antes de um forEach, o comentário está repetindo o código em inglês. Deleto e possivelmente extrai aquele bloco em uma função `filterActiveEmployees` — o nome passa a carregar o contexto.
>
> Também deleto código comentado — se era útil, está no git. E TODO sem data ou contexto vira issue ou some: TODO sem compromisso é lixo invisível que ninguém vai resolver."

> **P:** "Ouvi que 'código bom se auto-documenta e dispensa comentário'. Você concorda?"
>
> **R (30s):**
> "Concordo com metade e o Ousterhout ajuda a separar. A metade certa: comentário que repete o código em inglês é muleta de nome fraco — o nome deve carregar o 'o quê', e tem até evidência empírica de que palavra completa é mais rápida de ler que abreviação. Essa parte é auto-documentação de verdade.
>
> A outra metade é falsa. O Ousterhout lista 'código se auto-documenta' como uma das quatro desculpas furadas pra não comentar. Tem informação que não está no código: o porquê de uma decisão, o workaround de um bug externo, e principalmente o contrato de abstração da interface — o que o módulo garante sem eu ler a implementação inteira. O Naur já dizia isso em 85: a teoria do programa não cabe toda no texto. Então nome bom mata o comentário de 'o quê'; ele não mata o de 'por quê'."

---

## Checkpoint

- [ ] Distingo comentário de "o quê" (apagar+renomear) de "por quê"/contrato (manter) sem hesitar
- [ ] Sei citar a evidência empírica de naming (Lawrie 2006; Hofmeister 2017)
- [ ] Sei apresentar o debate Martin × Ousterhout (as quatro desculpas) e a tese de Naur (1985)
- [ ] Rodei o grep no PULSAR-RH e classifiquei ≥ 10 comentários pela árvore de triagem
- [ ] Renomeei ≥ 3 identificadores que tinham comentário de "o quê" (palavra completa)
- [ ] `DECISIONS.md` tem o bloco com a justificativa da triagem

## Recursos

- **Robert C. Martin — *Clean Code* (2008), cap. 2 "Meaningful Names" e cap. 4 "Comments":** as convenções de nome e a visão "comentário é mal necessário"
- **John Ousterhout — *A Philosophy of Software Design* (2018), cap. 12 "The Four Excuses" e cap. 13:** o contraponto frontal — comentário descreve o que não é óbvio no código (a interface, o porquê)
- **Peter Naur — *Programming as Theory Building* (1985):** por que a "teoria" do programa não cabe inteira no texto · e **Knuth — *Literate Programming* (1984)** como o polo oposto
- **Lawrie et al. — *What's in a Name?* (ICPC, 2006)** e **Hofmeister, Siegmund, Holt (SANER, 2017):** evidência experimental de que palavras completas > abreviações > letras únicas
- **Martin Fowler — *Refactoring* 2ª ed (2018):** smell "Mysterious Name"; refatorações "Rename Variable" e "Change Function Declaration"
- Módulo-irmão `01-srp-funcoes-curtas` — nome de intenção nasce da decomposição por responsabilidade
