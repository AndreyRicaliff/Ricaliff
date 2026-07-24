# 01 — Hierarquia Visual

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Hierarquia visual é o controle deliberado da ordem em que o olho percorre a tela, usando quatro alavancas: **tamanho**, **peso**, **cor/contraste** e **espaço**. Sem hierarquia, todos os elementos gritam no mesmo volume e o usuário paga o custo cognitivo de decidir onde olhar. Com hierarquia, a tela responde "o que importa aqui?" antes da pergunta ser feita. A regra que separa amador de profissional cabe numa linha: **um ponto focal por tela** — dois elementos disputando o peso máximo = nenhum ponto focal.

Este módulo não é sobre "gosto". É sobre a **percepção humana**, que tem leis medidas em laboratório há um século. A §BASE mostra por que as quatro alavancas funcionam — e a diferença entre o que tem lastro experimental e o que é convenção de praticante.

## § BASE — o fundamento

**A base científica real: Gestalt (Wertheimer, 1923).** Max Wertheimer, em *Untersuchungen zur Lehre von der Gestalt II* (1923; traduzido como "Leis da organização em formas perceptuais"), demonstrou que o cérebro **não** percebe pixels isolados — ele organiza o campo visual em grupos, automaticamente, antes de qualquer leitura consciente. As leis que importam para hierarquia: **similaridade** (elementos parecidos — mesmo tamanho, cor, forma — são lidos como um grupo), **proximidade** (elementos próximos agrupam — a base do módulo 04) e **figura/fundo** (o sistema visual separa o que "salta" de um plano de fundo). É por isso que seis KPIs do mesmo tamanho viram uma massa cinza indistinta: por *similaridade*, o olho os funde num único grupo, e nenhum é figura. Um hero card maior quebra a similaridade — vira figura contra o fundo dos secundários. A hierarquia não é imposta ao olho; ela **explora** como o olho já organiza o mundo.

**Por que é instantâneo: processamento pré-atentivo (Treisman & Gelade, 1980; Ware).** Anne Treisman, na *feature-integration theory of attention* (Cognitive Psychology, 1980), mostrou que certos atributos visuais — tamanho, matiz, orientação, contraste de luminância, movimento — são processados **em paralelo, pré-atentivamente**, em torno de 200 ms, *antes* da atenção focada. Colin Ware, em *Information Visualization: Perception for Design*, cataloga esses canais pré-atentivos e é a fonte a citar. A consequência é direta: as quatro alavancas de hierarquia são exatamente **canais pré-atentivos**. Tamanho e contraste de cor "saltam" sem esforço porque a percepção os resolve antes de você decidir olhar. Peso (`font-weight` bold) é um caso de contraste de luminância/traço. Espaço opera pela Gestalt (proximidade/figura-fundo). Isso explica o *squint test*: apertar os olhos remove o detalhe de alta frequência e deixa só os canais pré-atentivos — o que sobra é a hierarquia que o cérebro processa primeiro.

**Por que hierarquia é necessária, não decorativa: carga cognitiva (Miller, 1956; Cowan, 2001).** George Miller, em *The Magical Number Seven, Plus or Minus Two* (Psychological Review, 1956), estabeleceu que a memória de trabalho retém ~7 "chunks"; Nelson Cowan revisou o número para ~**4** em *The magical number 4 in short-term memory* (Behavioral and Brain Sciences, 2001). Uma tela com N elementos de igual peso força o olho a considerar N candidatos a "o mais importante" — e além de ~4 chunks, a decisão satura. Hierarquia **chunkifica**: agrupa e ranqueia, entregando ao usuário 1 figura + poucos grupos, dentro da capacidade. Some a isso a **lei de Hick-Hyman** (Hick, 1952; Hyman, 1953): o tempo de decisão cresce com o log do número de opções, `RT ≈ a + b·log₂(n+1)`. Um ponto focal minimiza o `n` da pergunta "onde eu olho?". Não é estética — é reduzir o tempo e o erro de decisão do usuário.

**O que tem lastro × o que é convenção — declare a diferença.** Rigor exige separar:

- **Lastro experimental:** as leis de Gestalt (Wertheimer 1923), o processamento pré-atentivo (Treisman & Gelade 1980), a capacidade de memória de trabalho (Miller 1956 / Cowan 2001) e Hick-Hyman (1952/53). São experimentos replicados.
- **Estudo empírico (não lei):** o **padrão em F** de leitura, documentado por eye-tracking pelo Nielsen Norman Group (Nielsen, 2006; revalidado 2017) — o olho varre duas faixas no topo e desce pela margem esquerda. É observação empírica de conteúdo denso na web, não uma lei universal; em layout com forte hierarquia visual, o próprio F se dissolve.
- **Princípio de análise:** o **data-ink ratio** de Edward Tufte, em *The Visual Display of Quantitative Information* (1983): maximize a proporção de "tinta" dedicada ao dado; apague o que não informa. Hierarquia por *subtração* — o hero domina porque o resto foi rebaixado.
- **Heurística de praticante (declarada como tal):** *Refactoring UI* (Wathan & Schoger) — "peso e cor destacam melhor que tamanho", "três níveis de cinza bastam". São regras úteis destiladas da prática, não resultados de laboratório. Boas — mas não invoque como "ciência".

**Incerteza declarada — o mito dos "estilos de aprendizagem".** É tentador justificar hierarquia visual com "tem gente que é aprendiz visual". **É mito.** Pashler, McDaniel, Rohrer & Bjork, em *Learning Styles: Concepts and Evidence* (Psychological Science in the Public Interest, 2008), revisaram a literatura e não encontraram evidência adequada para a "meshing hypothesis" (casar o ensino ao estilo melhora o resultado). Hierarquia visual **não** funciona porque alguns usuários são "visuais" — funciona porque a percepção pré-atentiva e as leis de Gestalt são universais na espécie. Não construa argumento de design sobre pseudociência: o lastro está na percepção, não em tipologias de aprendiz.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As quatro alavancas não têm força igual. A ordem abaixo é heurística de praticante (declarada), mas alinhada ao que a §BASE prevê: peso e contraste destacam sem custar layout; tamanho é forte mas caro em espaço.

```
CANAL PRÉ-ATENTIVO       ALAVANCA        CUSTO           QUANDO
─────────────────────────────────────────────────────────────────
contraste de luminância  Peso (600/700)  ~zero espaço    tabelas, listas densas
matiz/saturação          Cor/contraste   ~zero espaço    3 níveis de texto; cor = ação
tamanho                  Tamanho         ocupa layout    hero card, título
figura/fundo (Gestalt)   Espaço          o mais barato   promover isolando (subutilizado)
```

O fluxo de decisão de hierarquia numa tela:

```
   Qual é a UMA pergunta que esta tela responde?
                    │
                    ▼
   O elemento que a responde = ponto focal (figura)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  aplicar 1-2 alavancas    tudo o mais = fundo:
  (tamanho + contraste)    rebaixar por cor/peso,
  para torná-lo figura     agrupar por proximidade
        │                       │
        └───────────┬───────────┘
                    ▼
        squint test + teste dos 5s (refutar)
```

Dependências com o resto da trilha: **proximidade** (agrupamento por espaço) é aprofundada no módulo 04; **contraste** vira número (AA) no módulo 03; a validação por hipótese refutável vem de `05-raciocinio/02`. Este módulo é a raiz — os módulos 03, 04 e 08 são especializações de alavancas dele.

## § METODOLOGIA — o passo-a-passo replicável

**1. DECLARE a pergunta única da tela.** "Este dashboard responde: como está o faturamento do período?" Sem a pergunta declarada, não há critério para escolher o ponto focal — vira gosto.

**2. ELEJA um ponto focal — só um.** O elemento que responde à pergunta. Dois candidatos = rebaixe um agora.

**3. APLIQUE as alavancas em ordem de custo.** Comece por peso e contraste (não custam layout). Suba para tamanho só no ponto focal. Use espaço (isolamento) para promover sem gritar — a alavanca mais barata e a menos usada.

**4. REBAIXE o fundo ativamente.** Hierarquia é tanto promover o focal quanto **apagar** o resto (Tufte): texto secundário em cinza, terciário mais claro, remover bordas e tinta que não informam.

**5. REFUTE com evidência.** `squint test` (o que sobrevive ao borrão é a hierarquia real) + teste dos 5 segundos (abaixo). A hipótese "o olho vai primeiro no hero" tem que poder falhar.

**6. ITERE uma alavanca por vez.** Mexeu em duas e melhorou? Você não sabe qual causou — evidência destruída (mesmo princípio do debug, módulo 05).

**Anti-padrões:**
- **Tudo grande:** se tudo é grande, nada é figura (viola similaridade/figura-fundo). Tamanho é a alavanca mais abusada.
- **Cor como decoração:** saturação sem significado polui o canal pré-atentivo de cor — quando tudo é colorido, a cor que importa (uma ação, um alerta) não salta.
- **Dois pontos focais:** disputa pelo peso máximo = zero foco. Rebaixe um.
- **Borda em tudo:** band-aid de hierarquia mal resolvida por espaço (ver módulo 04).

### Passo a passo aplicado: teste dos 5 segundos num dashboard AG (faça agora, ~20min)

Caso real: no padrão dos dashboards comerciais AG (ex.: painel do dono do **Cliente Varejo**), o faturamento do período é o hero card — maior, no topo; os KPIs secundários vêm menores abaixo. Isso é uma **hipótese de hierarquia**, não um fato: "eu acho que o olho vai primeiro no hero" precisa de refutação possível.

```text
1. Screenshot da tela em estado cheio (com dados reais/seed).
2. Mostre por 5 segundos a alguém de fora do projeto. Feche.
3. Pergunte: (a) "do que se trata essa tela?"
            (b) "qual era a informação mais importante?"
4. Registre a resposta LITERAL, sem corrigir a pessoa.
5. Divergiu da intenção? A hierarquia falhou — não o usuário.
   Mexa em UMA alavanca por vez (ex.: só o tamanho do hero) e repita.
```

```css
/* hero vs secundário: as 4 alavancas aplicadas */
.kpi-hero  { font-size: 2.5rem; font-weight: 700; color: var(--text-1); }
.kpi-card  { font-size: 1.25rem; font-weight: 600; color: var(--text-2); }
.kpi-label { font-size: 0.75rem; font-weight: 500; color: var(--text-3);
             text-transform: uppercase; letter-spacing: 0.05em; }
```

Mexer em duas alavancas ao mesmo tempo destrói a evidência: se melhorou, você não sabe qual mudança causou. Feche o loop registrando antes/depois — o teste dos 5s é a versão barata do eye-tracking que gerou o padrão em F.

## Por que cai em entrevista

Porque é o filtro mais rápido entre "sabe usar Tailwind" e "sabe desenhar interface". O entrevistador mostra uma tela e pergunta "o que você mudaria?" — quem responde com as alavancas pelo nome (tamanho, peso, contraste, espaço) e propõe um teste demonstra método; quem responde "deixaria mais bonito" não passa. Citar a base (Gestalt, pré-atentivo) mostra que você entende *por que* as alavancas funcionam, não só *que* funcionam.

> **P:** "Como você decide o que destacar numa tela cheia de informação?"
>
> **R (30s):**
> "Primeiro defino o ponto focal — um só por tela. Num dashboard comercial que fiz, o número-mestre é um hero card e os KPIs secundários ficam menores, porque o dono abre a tela pra responder uma pergunta: 'como está o faturamento?'. Uso quatro alavancas em ordem: tamanho, peso, contraste e espaço — e valido com teste de 5 segundos: mostro a tela a alguém de fora e pergunto o que era mais importante. Se a resposta diverge da intenção, a hierarquia falhou e eu ajusto uma alavanca por vez."

> **P:** "Por que hierarquia visual funciona? É subjetivo?"
>
> **R (30s):**
> "Não é subjetivo, tem lastro em percepção. As leis de Gestalt do Wertheimer mostram que o cérebro agrupa por similaridade e separa figura de fundo antes de a gente ler — então seis KPIs iguais viram uma massa, e um maior vira figura. E a feature-integration theory da Treisman explica por que é instantâneo: tamanho, cor e contraste são processados pré-atentivamente, em uns 200 ms, antes da atenção focada. As quatro alavancas são exatamente esses canais. O que é convenção de praticante — tipo 'peso destaca melhor que tamanho', do Refactoring UI — eu trato como heurística, não como ciência. E um cuidado: hierarquia não funciona por 'estilo de aprendizagem visual', que é mito documentado; funciona porque a percepção é universal."

## Checkpoint

- [ ] Consigo citar as 4 alavancas de hierarquia em ordem de força, com exemplo de cada
- [ ] Sei explicar a base Gestalt (similaridade + figura/fundo) e o pré-atentivo por que a hierarquia é instantânea
- [ ] Sei ligar "um ponto focal" à carga cognitiva (Miller/Cowan) e ao tempo de decisão (Hick-Hyman)
- [ ] Separo o que tem lastro (Gestalt, pré-atentivo) do que é convenção (Refactoring UI, padrão em F)
- [ ] Rodei o squint test e o teste dos 5 segundos numa tela minha e registrei a resposta literal
- [ ] Identifiquei uma tela minha com 2+ pontos focais disputando e rebaixei um deles

## Recursos

- *Untersuchungen zur Lehre von der Gestalt II* — Max Wertheimer (1923): as leis de agrupamento perceptual (proximidade, similaridade, figura/fundo) — a base científica da hierarquia
- *A feature-integration theory of attention* — Treisman & Gelade (Cognitive Psychology, 1980): processamento pré-atentivo, o mecanismo do "o olho vai primeiro ali"
- *Information Visualization: Perception for Design* — Colin Ware: catálogo dos canais pré-atentivos aplicados a design
- *The Magical Number Seven* — George Miller (1956) e *The magical number 4* — Nelson Cowan (2001): capacidade da memória de trabalho (por que chunkificar)
- *The Visual Display of Quantitative Information* — Edward Tufte (1983): data-ink ratio — hierarquia por subtração
- *Refactoring UI* — Wathan & Schoger, cap. "Hierarchy Is Everything": heurísticas de praticante (peso/cor > tamanho) — declaradas como tal
- *Learning Styles: Concepts and Evidence* — Pashler et al. (2008): a refutação do mito dos estilos de aprendizagem
- NN/g — Nielsen (2006, rev. 2017): o estudo de eye-tracking do padrão em F (empírico, não lei)
