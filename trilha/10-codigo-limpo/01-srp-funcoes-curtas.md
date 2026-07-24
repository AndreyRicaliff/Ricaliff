# 01 — SRP e Funções Curtas

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na mesa),
> §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão-ouro de `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

**SRP (Single Responsibility Principle):** uma função — ou módulo — tem **uma razão para mudar**. Não "faz uma coisa só" (vago), mas **uma fonte de mudança**: se dois requisitos diferentes podem te forçar a editar o mesmo bloco, ele viola SRP. "Funções curtas" é o *sintoma* mais visível disso — mas, como você vai ver, tamanho é gatilho de suspeita, não a lei. Este módulo troca o recitar "faz uma coisa só" por decompor por **razão de mudança**, sabendo defender onde parar de cortar.

---

## § BASE — o fundamento

**O teto cognitivo é real, o número é contestado.** Código longo cansa por causa da **memória de trabalho**, não de estética. George Miller, em *The Magical Number Seven, Plus or Minus Two* (Psychological Review, 1956), estimou o buffer de curto prazo em 7±2 "chunks" — número que virou folclore e hoje está **desatualizado**: Nelson Cowan (*The Magical Number 4 in Short-Term Memory*, BBS, 2001) reanalisou a evidência e aponta **~4 chunks** sem apoio de ensaio. O que sobrevive é o essencial: a janela de contexto simultâneo é **pequena e fixa**. Função que cabe numa tela num único scan respeita esse orçamento; uma de 80 linhas obriga a rolar e recarregar o contexto a cada retorno. "Cabe numa tela" é *proxy* de "cabe na memória de trabalho" — é aí que mora a força do argumento, não num limite mágico de linhas.

**A raiz do SRP não é Martin — é Parnas (1972).** Antes de "SOLID" existir, David Parnas publicou *On the Criteria To Be Used in Decomposing Systems into Modules* (Communications of the ACM, 1972) e fundou o conceito de **information hiding**: cada módulo deve **esconder uma decisão de projeto provável de mudar**, expondo só uma interface estável. Isso é o SRP dito com precisão. "Uma razão para mudar" é, literalmente, "uma decisão de projeto escondida". Robert C. Martin popularizou o nome (SOLID, em *Agile Software Development, Principles, Patterns, and Practices*, 2002) e depois **refinou a própria definição** em *Clean Architecture* (2017): SRP passou de "uma razão para mudar" para "um módulo deve ser responsável a **um, e apenas um, ator**" — um grupo de stakeholders. A evolução importa: o eixo de decomposição é o **ator/decisão de negócio**, não a contagem de operações.

**O dogma "small!" e de onde ele vem.** Em *Clean Code* (2008), cap. 3 "Functions", Martin defende funções minúsculas — na letra, 2 a 4 linhas — sob o lema "faça uma coisa" e "small, smaller than that". É a fonte do "20 linhas" que a casa usa — que já é uma folga pragmática sobre a recomendação dele. E aqui começa o debate que separa quem repete do que entende.

**O contraponto frontal — Ousterhout.** John Ousterhout, em *A Philosophy of Software Design* (2018), critica *Clean Code* de frente. Seu conceito central (cap. 4, "Modules Should Be Deep") é a oposição **deep vs shallow module**: um módulo bom tem **interface simples escondendo implementação poderosa** (deep); um módulo raso (shallow) tem quase tanta interface quanto implementação — o custo de aprender e chamar quase iguala o que ele entrega. Cortar uma função coesa em muitos pedacinhos para bater uma meta de linhas produz **shallow shrapnel**: cada fragmento adiciona um nome, uma assinatura, um ponto de indireção, e — pior — vira o que Ousterhout chama de **conjoined methods** (cap. 9, "Better Together or Better Apart?"): métodos que só se entendem lendo os outros, então a "decomposição" não decompôs nada, só espalhou a mesma cabeça por seis arquivos. A tese dele: **comprimento sozinho raramente é bom motivo para dividir um método.** Há inclusive um debate público gravado Ousterhout × Martin sobre isso — "clean code vs philosophy" é literatura viva.

**A honestidade empírica que quase ninguém cita.** Há evidência forte de que funções curtas reduzem bugs? **Não.** Steve McConnell, em *Code Complete* 2ª ed (2004), §7.4 "How Long Can a Routine Be?", revisa a literatura e conclui o oposto do senso comum: vários estudos (ele cita Basili & Perricone, 1984; Shen et al., 1985) encontraram **densidade de erro estável ou decrescente** conforme a rotina crescia até ~100–200 linhas — rotinas maiores custavam *menos* erros por linha, não mais. A recomendação dele é deixar a rotina crescer organicamente e usar coesão (não contagem de linhas) como critério, tratando >200 linhas como sinal de alerta. Traduzindo com rigor: **a alegação "curto = menos bug" é consenso de praticantes + argumento cognitivo, não resultado empírico robusto** — e tamanho isolado é um preditor fraco de defeito (confundido com complexidade e acoplamento). O que *sobrevive* à crítica é isto: decomponha por **responsabilidade** (Parnas: uma decisão escondida por módulo), não por número. A linha vira gatilho pra você *procurar* uma segunda razão de mudar — não meta a perseguir.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Há dois erros simétricos, e o alvo é o vale entre eles:

```
   SUB-DECOMPOSTO            ALVO                     SUPER-DECOMPOSTO
   god function             deep module              shallow shrapnel
   (1 função, N razões)     (1 função, 1 razão)      (N funções, 1 razão espalhada)
   ─────────────────        ─────────────────        ─────────────────
   viola SRP (Martin)       testável isolada,        classitis / conjoined
   difícil ler e testar     nome = intenção,         methods (Ousterhout)
   diff mistura concerns    interface < impl.        overhead de interface
                                  ▲
              gatilho p/ sair da esquerda: >20 linhas OU 2ª razão de mudar
              freio p/ não cair na direita: o pedaço tem nome que ACRESCENTA?
```

O critério que decide os dois lados é **um só**: existe mais de uma *razão para mudar* (ator/decisão) aqui dentro? A contagem de linhas só entra como **detector**, nunca como sentença.

| Cenário | Ação | Motivo |
|---|---|---|
| Função > 20 linhas | Ler procurando a 2ª razão de mudar; extrair se houver | Linha é gatilho de suspeita, não veredito |
| Função curta com 4 responsabilidades | Extrair — tamanho não salva SRP | Mudança de um requisito editaria bloco de outro |
| Sub-função usada 1 vez, nome não acrescenta | **Não** extrair — inline é mais claro | Early extraction vira shallow module (Ousterhout) |
| Extração cria nome de intenção (`normalizeEmployee`) | Extrair, mesmo com 1 uso | Sobe o nível de abstração; leitor lê a intenção |
| Função de 25 linhas, 100% coesa, 1 ator | Aceitar | McConnell §7.4: comprimento não é o defeito |

**Dependências:** apoia-se em `05-raciocinio` (memória de trabalho) e alimenta `04-abstracao-regra-dos-3` — a mesma pergunta "é o mesmo conceito?" reaparece na duplicação.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LER a função inteira e LISTAR o que ela faz** — cada verbo de negócio é um candidato a responsabilidade (validar, normalizar, persistir, notificar, auditar).

**2. AGRUPAR os itens por ATOR / razão de mudar.** A pergunta literal: "se o requisito X mudar, quais linhas eu edito?". Linhas que mudam juntas pertencem à mesma responsabilidade; linhas que mudam por motivos independentes são responsabilidades distintas.

**3. EXTRAIR uma responsabilidade por vez** (refatoração **Extract Function** — Fowler, *Refactoring* 2ª ed), dando a cada extração um **nome de intenção** (verbo + objeto). Se o nome não descreve algo que o código sozinho não descreveria, **não extraia** — você criaria um shallow module.

**4. PRESERVAR o comportamento externo.** Rode os testes (ou escreva testes de caracterização antes — Lab 1 do SYLLABUS). SRP é refactor: entrada→saída idênticas.

**Anti-padrões:**
- **Split por número:** cortar em 20 linhas sem uma segunda razão de mudar. Produz conjoined methods — pior que a função longa coesa.
- **Extração ansiosa:** criar `processItem`/`handleData` só pra "ficar limpo". Nome vago = indireção sem valor.
- **God function disfarçada:** função de 15 linhas que valida, cobra cartão e envia e-mail. Curta e ainda assim viola SRP.

**Aplicado — handler que mistura 4 razões (caso estilo PULSAR-RH):**

```ts
// Viola SRP: valida, transforma, persiste e notifica — 4 razões pra mudar
async function handleEmployeeSubmission(data: unknown) {
  if (!data || typeof data !== 'object') throw new Error('invalid')
  const parsed = employeeSchema.parse(data)
  const normalized = { ...parsed, name: parsed.name.trim().toUpperCase() }
  const employee = await db.employee.create({ data: normalized })
  await sendWelcomeEmail(employee.email, employee.name)
  await auditLog.record('employee_created', employee.id)
  return employee
}

// Correto: cada função tem UMA razão pra mudar (e cada nome carrega a intenção)
function normalizeEmployee(data: EmployeeInput): EmployeeNormalized {
  return { ...data, name: data.name.trim().toUpperCase() }
}

async function createEmployee(data: EmployeeInput): Promise<Employee> {
  const normalized = normalizeEmployee(employeeSchema.parse(data))
  return db.employee.create({ data: normalized })
}

async function onEmployeeCreated(employee: Employee): Promise<void> {
  await Promise.all([
    sendWelcomeEmail(employee.email, employee.name),
    auditLog.record('employee_created', employee.id),
  ])
}
```

Cada extração tem nome que **acrescenta** (nenhuma virou shrapnel raso) e `onEmployeeCreated` trocou `await` sequenciais por `Promise.all`. Mudou a normalização? O diff toca só `normalizeEmployee`.

---

## Passo-a-passo aplicado (faça agora, ~35min)

PULSAR-RH (produto próprio) foi modularizado, mas ainda tem funções longas de legado nos módulos antigos — bom terreno real.

1. **Achar candidatas** (ripgrep no Git Bash; ajuste o path do projeto):
   ```bash
   rg -n --pcre2 "^\s*(export\s+)?(async\s+)?function |=>\s*\{$|^\s*const \w+ = (async )?\(" \
     "C:/Projetos/PULSAR-RH/src" -g "*.ts" | head -30
   ```
   Abra os arquivos com mais hits e ache visualmente as funções que passam de 20 linhas ou "afunilam" em pirâmide.

2. **Listar responsabilidades** (Metodologia passo 1–2): escreva, para UMA função, a lista de verbos de negócio e agrupe por razão de mudar.

3. **Refatorar 1 função** com Extract Function, nomes de intenção, comportamento externo preservado (rode os testes; se não houver, escreva 1 teste de caracterização antes).

4. **Registrar em `PULSAR-RH/DECISIONS.md`:**
   ```markdown
   ## 2026-07-XX — [refactor] separar responsabilidades de <nome-da-função>
   **Problema:** `<nome>` em `<arquivo>` tinha <N> linhas e <X> razões de mudar (validação,
   transformação, persistência no mesmo bloco).
   **Opções:** manter inline (teste exige mockar coisas não relacionadas) · extrair por razão.
   **Decisão:** extração em `validateX`/`normalizeX`/`persistX`.
   **Por quê:** mudança de schema não deve forçar reescrita do bloco de validação (Parnas:
   uma decisão escondida por módulo).
   **Consequências:** 3 funções de 6–10 linhas, cada uma testável sem mockar banco.
   **Em entrevista (30s):** "misturava 3 razões de mudar; separei por responsabilidade,
   não por linha — um bug de validação agora tem diff de 1 função, não de um god handler."
   ```

5. **Commit:** `refactor(pulsar): split responsibilities of <nome-da-função>`

---

## Por que cai em entrevista

Porque SRP é citado por todo mundo, mas poucos definem sem cair no "faz uma coisa só". O entrevistador testa se você distingue **razão de mudar** de **quantidade de operações** — e, num nível pleno+, se você sabe **onde parar de cortar** (o lado Ousterhout). Variações: "como você decide extrair?", "essa função de 80 linhas está OK?", "me mostra uma refatoração", "o que é SRP pra você?".

> **P:** "Como você decide quando extrair uma função?"
>
> **R (30s):**
> "Tenho dois critérios. Primeiro: a função passou de 20 linhas? Acima disso, o leitor perde contexto antes de terminar de ler — já vale extrair.
>
> Segundo, mais importante: a função tem mais de uma razão pra mudar? Se eu mudar o schema do banco e tiver que editar o mesmo bloco que valida input, há duas responsabilidades misturadas — extraio independente do tamanho.
>
> O que eu não faço é extração ansiosa: se a sub-função só vai ser chamada num lugar e o nome que eu daria não acrescenta nada além do código que já estava ali, eu deixo inline. Extração prematura cria indireção sem valor."

> **P:** "O que é SRP pra você?"
>
> **R (30s):**
> "É o princípio de que uma função — ou módulo, ou classe — deve ter uma única razão pra mudar. Não 'faz uma coisa só', que é vago. Uma razão pra mudar quer dizer: existe um único requisito ou responsabilidade de negócio que, ao mudar, exigiria mexer aqui.
>
> Na prática: se eu estou refatorando validação de formulário e preciso abrir o mesmo arquivo que faz integração com a API de pagamento, SRP foi violado. O sintoma é: o diff de PR mistura concerns diferentes no mesmo lugar."

> **P:** "Um colega diz que funções pequenas viram 'shallow modules' e pioram o design. Como você responde?"
>
> **R (30s):**
> "Ele está citando o Ousterhout, e ele tem razão — quando o corte é feito por número de linhas. Se você quebra uma função coesa em seis pedaços que só se entendem juntos, você não decompôs nada: criou 'conjoined methods' e ainda pagou overhead de interface em cada um. O McConnell reforça isso: a evidência empírica não sustenta que rotina curta tem menos bug.
>
> Então eu não corto por linha, corto por razão de mudar — o Parnas: cada módulo esconde uma decisão de projeto. Se o pedaço extraído tem nome de intenção e pode mudar por um motivo próprio, é um módulo de verdade; se o nome seria 'doTheRestOfTheLoop', deixo inline. No fundo os dois lados concordam: o inimigo é o god function, mas a cura não é picotar — é separar por responsabilidade."

---

## Checkpoint

- [ ] Distingo "faz uma coisa só" de "tem uma razão para mudar" (ator/decisão) sem hesitar
- [ ] Sei citar a raiz (Parnas 1972, information hiding) e o contraponto (Ousterhout, shallow modules)
- [ ] Sei dizer que a evidência empírica NÃO sustenta "curto = menos bug" (McConnell §7.4)
- [ ] Achei ≥ 1 função > 20 linhas no PULSAR-RH com mais de uma razão de mudar
- [ ] Refatorei extraindo por responsabilidade, com nomes de intenção e comportamento preservado
- [ ] `DECISIONS.md` do projeto tem o bloco com as razões de mudar identificadas

## Recursos

- **David Parnas — *On the Criteria To Be Used in Decomposing Systems into Modules* (CACM, 1972):** information hiding, a raiz real do "uma razão para mudar"
- **Robert C. Martin — *Clean Code* (2008), cap. 3 "Functions":** a origem do "small!" e do "faça uma coisa" (leia com senso crítico) · e *Clean Architecture* (2017), cap. SRP: a redefinição "um ator"
- **John Ousterhout — *A Philosophy of Software Design* (2018), cap. 4 e 9:** deep vs shallow modules, classitis, conjoined methods — o contraponto frontal
- **Steve McConnell — *Code Complete* 2ª ed (2004), §7.4 "How Long Can a Routine Be?":** a evidência empírica (Basili & Perricone 1984; Shen et al. 1985) de que comprimento não prediz defeito
- **Martin Fowler — *Refactoring* 2ª ed (2018):** refatoração "Extract Function" (quando e como) e os smells "Long Function"/"Divergent Change"
- **Miller (1956) e Cowan (2001):** o teto da memória de trabalho — 7±2 refinado para ~4 (o "cabe numa tela" é proxy disso)
- Módulo-irmão `04-abstracao-regra-dos-3` — a mesma pergunta "é o mesmo conceito?" na duplicação
