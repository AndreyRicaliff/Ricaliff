# 04 — Abstração e a Regra dos 3

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na mesa),
> §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão-ouro de `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

**DRY mal aplicado é pior que duplicação.** "Don't Repeat Yourself" virou "nunca escreva o mesmo código duas vezes" — e isso está errado. A regra real é: não repita **conhecimento**, não texto. Dois blocos com a mesma *forma* hoje podem ser conceitos diferentes que vão **divergir** amanhã; uni-los cedo é o erro mais caro que um júnior comete achando que está "limpando". Este módulo existe pra você trocar o reflexo "vi repetição, abstraio" pela pergunta certa — "é o mesmo conhecimento?" — e saber esperar a **terceira** ocorrência antes de generalizar.

---

## § BASE — o fundamento

**DRY é sobre conhecimento — com dono.** Andy Hunt e Dave Thomas cunharam o princípio em *The Pragmatic Programmer* (1999). A definição literal deles: **cada porção de conhecimento deve ter uma representação única, inequívoca e autoritativa dentro do sistema.** A palavra-chave é *conhecimento* — uma regra de negócio, uma fórmula, um invariante — **não** "texto igual". Na ed. de 20 anos (2019) reforçam que é o princípio mais mal-interpretado do livro: dois trechos idênticos que representam decisões independentes **não** violam DRY (não são o mesmo conhecimento); e dois trechos de aparência diferente que codificam a *mesma* regra **violam** DRY. O teste não é visual, é semântico.

**A Regra dos 3 tem origem nomeada.** "Abstraia no terceiro uso, não no segundo" não é folclore: Martin Fowler credita a Don Roberts em *Refactoring* (1ª ed, 1999; mantido na 2ª, 2018), cap. 2 — o famoso "**three strikes and you refactor**": a primeira vez você só faz; a segunda, você duplica (mesmo incomodado); na terceira, você refatora. O motivo de esperar não é preguiça — é **informação**. Na segunda ocorrência você ainda não sabe se os dois casos são o mesmo conceito ou dois conceitos que **acidentalmente** têm a mesma forma. Três pontos revelam a curva; dois, não. Abstrair no segundo é decidir com metade da evidência.

**Por que a abstração errada é mais cara que a duplicação — o mecanismo.** Sandi Metz cristalizou isto em *The Wrong Abstraction* (2016): **prefira duplicação à abstração errada.** O caminho do desastre é mecânico e sempre igual: (1) você vê duplicação e extrai uma abstração; (2) surge um chamador que precisa de algo *quase* igual, então você adiciona um parâmetro; (3) outro chamador, outro parâmetro `if`; (4) a abstração vira um emaranhado de flags que ninguém entende, e agora é **mais caro** desfazer do que teria sido nunca ter feito — você paga o custo de criar **e** o de desmanchar. Declaração de rigor: isto é **consenso de praticantes** (Metz, DHH, a maioria dos seniores), sustentado por argumento de custo — **não** há estudo controlado medindo "duplicação vs abstração errada". Heurística forte e amplamente compartilhada; apresente-a como tal.

**A distinção que decide tudo — Parnas (1972).** Como saber, na terceira ocorrência, se abstrai ou aceita a duplicação? O critério vem de David Parnas, *On the Criteria To Be Used in Decomposing Systems into Modules* (CACM, 1972): um módulo (uma abstração) deve **esconder uma decisão de projeto**. Logo:
- **Duplicação conceitual** = os sites escondem a **mesma** decisão (ex.: "toda entidade faz soft delete marcando `deletedAt`"). Mudar a decisão deve mudar **um** lugar → abstraia.
- **Duplicação acidental** = os sites têm a mesma forma hoje mas escondem decisões **diferentes** (ex.: validação de CPF de funcionário vs. de cliente — regras de negócio que vão divergir). Uni-los acopla decisões que precisam evoluir separadas → **aceite a duplicação**.

A pergunta "é o mesmo conhecimento?" (Hunt & Thomas) e "é a mesma decisão de projeto?" (Parnas) são a mesma pergunta dita de dois jeitos — e é ela, não a semelhança visual, que autoriza a abstração.

**YAGNI e o smell nomeado.** O outro lado do erro é abstrair pra um futuro que talvez não venha. **YAGNI — You Aren't Gonna Need It** — vem do Extreme Programming (Kent Beck, *Extreme Programming Explained*, 1999; sistematizado por Fowler no bliki "Yagni", 2015): não construa a generalidade "pra quando precisar". O custo é real e imediato — tempo agora + complexidade pra quem lê depois — e, quando o caso real chega, ele quase nunca é o que você imaginou. Beck e Fowler deram nome ao cheiro no catálogo de *Refactoring*: **Speculative Generality** — classe base abstrata com uma única subclasse, factory que instancia um único tipo, parâmetro `mode` que nunca é usado como não-default. Alinha com Ousterhout (*A Philosophy of Software Design*, 2018): uma boa abstração é **deep** (interface simples escondendo complexidade real); a abstração especulativa é **shallow** e ainda **vaza** — dez parâmetros de configuração expondo o interior que deveriam esconder.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O eixo é a interseção **contagem de usos × natureza da duplicação**:

```
                  1º uso            2º uso            3º uso+
   ┌────────────────────────────────────────────────────────────────┐
   │ ESCREVE     │ DUPLICA         │ decisão: MESMO CONHECIMENTO?     │
   │ direto      │ (aguenta o      │   sim → ABSTRAI (deep module)    │
   │             │  incômodo)      │   não → mantém DUPLICADO         │
   └────────────────────────────────────────────────────────────────┘
        ▲ Regra dos 3 (Don Roberts / Fowler)      ▲ Parnas: mesma decisão de projeto?

   duplicação CONCEITUAL  → mesma decisão escondida  → abstrair (muda 1 lugar)
   duplicação ACIDENTAL   → decisões que vão divergir → aceitar (evoluem separadas)
```

Trade-offs e sintomas:

| Cenário | Ação | Motivo |
|---|---|---|
| 2 blocos com mesma forma | Aguardar 3º uso | Podem divergir — 2 pontos não revelam a curva |
| 3+ blocos, **mesma decisão** de projeto | Abstrair agora | Parnas: mudança do conceito toca 1 lugar |
| 3+ blocos, decisões que **vão divergir** | Aceitar duplicação | Abstração acoplaria o que deve evoluir separado |
| Abstração com 1 chamador | Inline de volta — YAGNI | Indireção sem benefício (shallow module) |
| Parâmetro `mode: a\|b` que muda o comportamento todo | Separar em 2 funções | São 2 funções fingindo ser 1 |
| Classe base abstrata com 1 subclasse / factory de 1 tipo | Remover — Speculative Generality | Hierarquia sem uso real |
| Abstração já virou emaranhado de flags | Re-duplicar e refazer (Metz) | Abstração errada custa mais que duplicação |

**Dependências:** herda de `01-srp` — "é o mesmo conceito?" é a mesma pergunta de "uma razão de mudar?" — e usa o vocabulário Parnas que abre a trilha.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CONTAR os usos reais.** Um? Escreve direto. Dois? Duplica e aguenta. Três+? Vá ao passo 2.

**2. PERGUNTAR "é o mesmo conhecimento / a mesma decisão de projeto?"** (Hunt & Thomas / Parnas). Se os sites vão divergir por razões de negócio distintas, é duplicação **acidental** — pare, mantenha duplicado.

**3. Se for conceitual, ABSTRAIR sem generalidade especulativa.** A abstração nasce **exatamente** cobrindo os casos reais que existem — **zero** parâmetros "pro futuro" (YAGNI). Prefira um módulo **deep** (interface pequena) a um com dez flags.

**4. NOMEAR pela decisão escondida,** não pela mecânica (`softDelete`, não `updateTimestampField`).

**5. VIGIAR o drift.** Se depois a abstração começar a acumular `if mode`/parâmetros especiais, é sinal de que uniu conceitos divergentes — **re-duplique** (Metz) antes que vire emaranhado.

**Anti-padrões:**
- **Abstrair no 2º uso** com metade da evidência.
- **DRY por semelhança visual:** unir dois blocos idênticos que codificam regras que vão divergir (acidental).
- **Mode flag:** `fetch(mode: 'active'|'archived', ...8 opcionais)` — duas funções disfarçadas de uma.

**Aplicado — acidental vs conceitual (caso estilo AG):**

```ts
// ACIDENTAL — mesma forma, decisões diferentes → NÃO abstrair
// CPF de funcionário e de cliente têm regras que vão divergir (cliente pode ter CNPJ etc.)
function validateEmployeeCPF(cpf: string): boolean { /* ... */ }
function validateClientCPF(cpf: string): boolean { /* ... */ }

// CONCEITUAL — mesma decisão de projeto ("soft delete = marcar deletedAt") → abstrair
function softDeleteEmployee(id: string) { /* deletedAt = now */ }
function softDeleteClient(id: string)   { /* deletedAt = now */ }
function softDeleteRecording(id: string){ /* deletedAt = now */ }
// → uma abstração deep: softDelete(entity, id) — muda a política em 1 lugar

// SPECULATIVE GENERALITY — mode flag = 2 funções fingindo ser 1
function fetchEmployees(o: { mode: 'active'|'archived'; departmentId?: string;
  includeMetrics?: boolean; withSalary?: boolean /* +4 opcionais hipotéticos */ }) { /* ... */ }
// mais honesto: crie a segunda quando o segundo caso REALMENTE aparecer
function fetchActiveEmployees(departmentId?: string): Promise<Employee[]> { /* ... */ }
```

A forma de `validateEmployeeCPF`/`validateClientCPF` é idêntica — e ainda assim abstraí-las seria erro, porque escondem decisões que vão divergir. É o ponto de Parnas na prática.

---

## Passo-a-passo aplicado (faça agora, ~40min)

AG Hub e PULSAR-RH (produtos próprios) têm funções "utilitárias" criadas genéricas que talvez tenham um único chamador real.

1. **Listar exportações e contar chamadores:**
   ```bash
   rg -n "^export (async )?function |^export const \w+ = " \
     "C:/Projetos/ag-hub/src" "C:/Projetos/PULSAR-RH/src" -g "*.ts" \
     | rg -v "index|types|\.d\.ts" | head -30
   # depois, para um nome encontrado, conte os call-sites reais:
   rg -n "<NOME_DA_FUNCAO>" "C:/Projetos/PULSAR-RH/src" -g "*.ts" | rg -v "export|function "
   ```

2. **Para cada função com 1 chamador:** é abstração prematura? O nome é mais genérico que o uso? Tem parâmetro que nunca é passado como não-default (Speculative Generality)?

3. **Decidir com critério:** *manter* se encapsula uma regra de negócio nomeada (mesmo com 1 uso); *inline* se é só agrupamento sem conceito próprio.

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-07-XX — [refactor] inline de abstração prematura em <arquivo>
   **Problema:** `<nome>` tinha 1 chamador; criada "pra quando precisar", nunca reusada.
   **Análise:** duplicação acidental ou conceitual? Nome genérico (`process`/`handle`/`util`)
   não representa uma decisão de projeto → não é conhecimento reutilizável.
   **Opções:** manter com nome específico · inline no chamador.
   **Decisão:** inline; se surgir 2º uso real, reavalio na 3ª (Regra dos 3).
   **Por quê:** abstração com 1 usuário é indireção sem benefício (YAGNI; Speculative Generality).
   **Consequências:** menos um shallow module; o custo de recriar quando precisar < manter indireção.
   **Em entrevista (30s):** "abstração genérica com 1 chamador — inline. Se vier 2º uso, duplico;
   no 3º decido pela regra dos 3 e só se for o mesmo conhecimento (Parnas)."
   ```

5. **Commit:** `refactor: inline single-caller abstraction in <arquivo>`

---

## Por que cai em entrevista

Abstração é onde júnior e sênior pensam diferente: júnior acha que mais abstração = mais qualidade; sênior sabe que abstração tem **custo**, sobretudo quando é prematura. Variações: "quando você abstrai vs duplica?", "o que é DRY?", "refatora isso" (mostram 2 funções parecidas — a resposta errada é abstrair na hora), "o que é YAGNI?", "por que essa abstração tem tantos parâmetros?".

> **P:** "Quando você cria uma abstração vs duplica o código?"
>
> **R (30s):**
> "Eu uso a regra dos 3: só abstraio no terceiro uso. Não no segundo.
>
> Por quê não no segundo? Porque na segunda ocorrência, ainda não sei se os dois casos são o mesmo conceito ou dois conceitos que acidentalmente têm a mesma forma hoje. Se eu abstrair cedo e os dois divergirem amanhã, vou deformar a abstração com parâmetros especiais ou duplicar de volta — pagando o custo duas vezes.
>
> No terceiro uso, o padrão se confirmou. Mas mesmo assim verifico: é duplicação conceitual ou acidental? Se dois módulos têm a mesma lógica hoje por acidente, mas representam regras de negócio distintas, aceito a duplicação — eles precisam poder evoluir independentes."

> **P:** "O que é YAGNI?"
>
> **R (30s):**
> "You Aren't Gonna Need It — não construa por antecipação. Se não tem um segundo caso real que justifique a abstração agora, não crie a abstração agora.
>
> O erro comum é construir um sistema de configuração com 15 parâmetros pra cobrir variações hipotéticas. O custo é real: tempo agora pra construir, complexidade pra quem lê depois, e quando o caso real aparecer, ele raramente é o que você imaginou. É mais fácil criar a abstração quando você tem os dois casos reais na frente do que adivinhar a interface certa."

> **P:** "O que é pior — duplicação ou a abstração errada? Por quê?"
>
> **R (30s):**
> "A abstração errada, e a Sandi Metz tem um ensaio inteiro sobre isso: prefira duplicação à abstração errada. O mecanismo é o que mata. Você extrai cedo, aí chega um chamador que precisa de algo quase igual e você põe um parâmetro; chega outro, mais um `if`; em pouco tempo a abstração é um emaranhado de flags que ninguém entende, e desfazer custa mais do que nunca ter feito — você paga pra criar e paga pra desmanchar.
>
> Duplicação é barata e honesta: dá pra ver os dois casos lado a lado e abstrair depois, quando souber o que é comum de verdade. Ressalva de rigor: é consenso de sênior, não estudo medido — mas das heurísticas mais consistentes que existem. E o critério pra abstrair, quando chega a hora, é o do Parnas: só se os sites escondem a mesma decisão de projeto."

---

## Checkpoint

- [ ] Explico DRY como "não repita conhecimento" (Hunt & Thomas), não "não repita texto"
- [ ] Distingo duplicação acidental de conceitual pelo critério de Parnas (mesma decisão?)
- [ ] Sei o mecanismo da abstração errada (Metz) e que é consenso de praticantes, não estudo
- [ ] Reconheço Speculative Generality (mode flag, base com 1 subclasse) ao vivo
- [ ] Achei ≥ 1 função genérica com 1 chamador num projeto AG e decidi inline/manter com justificativa
- [ ] `DECISIONS.md` tem o bloco com a análise acidental vs conceitual

## Recursos

- **Andy Hunt & Dave Thomas — *The Pragmatic Programmer* (1999; ed. 20 anos, 2019):** o princípio DRY — "representação única e autoritativa do conhecimento" (não do texto)
- **Martin Fowler — *Refactoring* (1ª ed 1999, cap. 2; 2ª ed 2018):** a Regra dos 3 creditada a Don Roberts ("three strikes and you refactor") e o smell "Speculative Generality"
- **Sandi Metz — *The Wrong Abstraction* (2016):** "prefira duplicação à abstração errada" — o mecanismo de custo (consenso de praticantes, não estudo medido)
- **David Parnas — *On the Criteria To Be Used in Decomposing Systems into Modules* (CACM, 1972):** information hiding — o critério que separa duplicação conceitual de acidental
- **Kent Beck — *Extreme Programming Explained* (1999)** e **Fowler, bliki "Yagni" (2015):** o princípio YAGNI
- **John Ousterhout — *A Philosophy of Software Design* (2018):** deep vs shallow modules — por que a abstração especulativa vaza
- Módulo-irmão `01-srp-funcoes-curtas` — "é o mesmo conceito?" é a mesma pergunta de "uma razão de mudar?"
