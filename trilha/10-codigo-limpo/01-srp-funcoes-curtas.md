# 01 — SRP e Funções Curtas

## O que é

**SRP (Single Responsibility Principle):** uma função tem **uma razão para mudar**. Não "faz uma coisa só" (vago) — tem **uma fonte de mudança**. Se dois requisitos diferentes podem te forçar a editar a mesma função, ela viola SRP.

O limite de **20 linhas não é arbitrário.** É onde o cérebro humano deixa de manter todo o contexto na memória de trabalho simultaneamente. Acima de ~7 unidades de informação, começa a descartar. Função com 40 linhas força o leitor a rolar, perder contexto e reler. Função com 15 linhas cabe inteira numa tela, num único scan.

```ts
// Viola SRP: valida, transforma, persiste e envia notificação — 4 razões pra mudar
async function handleEmployeeSubmission(data: unknown) {
  if (!data || typeof data !== 'object') throw new Error('invalid')
  const parsed = employeeSchema.parse(data)
  const normalized = { ...parsed, name: parsed.name.trim().toUpperCase() }
  const employee = await db.employee.create({ data: normalized })
  await sendWelcomeEmail(employee.email, employee.name)
  await auditLog.record('employee_created', employee.id)
  return employee
}

// Correto: cada função tem UMA razão pra mudar
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

**Quando NÃO extrair (early extraction é code smell):**
- Sub-função usada em um único lugar E o contexto inline é mais claro que o nome da extração
- Extração cria um nome que não diz nada melhor que o código que estava ali (`processItem`, `handleData`)
- A função ainda está dentro de 20 linhas — não extraia por extrair

Regra de bolso: se o nome da sub-função explica algo que o código sozinho não explicaria, vale extrair. Se o nome seria `doTheRestOfTheThingInTheLoop`, não vale.

---

## Por que cai em entrevista

Porque SRP é citado por todo mundo, mas poucos conseguem definir sem ficar no "faz uma coisa só". Entrevistadores testam se você entende **motivo de mudança** vs **quantidade de operações**. Variações comuns:

- "Como você decide quando extrair uma função?"
- "Essa função de 80 linhas está OK? Por quê não?"
- "Me mostra uma refatoração que você faria nesse código." (e te mostram um god function)
- "O que é SRP pra você?" (querem ouvir 'razão pra mudar', não 'faz uma coisa')

---

## Trade-offs

| Cenário | Ação | Motivo |
|---|---|---|
| Função > 20 linhas | Extrair sub-função | Carga cognitiva; testabilidade |
| Sub-função usada só 1 vez | Avaliar inline se o nome não acrescenta | Early extraction ofusca fluxo |
| Extração cria 3 funções de 3 linhas | OK se cada uma tem nome que vale | Granularidade fina é melhor que monólito |
| Função curta mas com 4 responsabilidades | Extrair — tamanho não salva SRP | Mudança de requisito = bug potencial |
| Função de 25 linhas 100% coesa | Aceitar se não há extração natural | Regra é guia, não lei — justifique no PR |

**Custo de violar SRP:** quando o requisito de notificação muda, você mexe no mesmo lugar que valida dados. Um teste quebrado por motivo errado. Diff de PR mixando concerns. Code review confuso.

---

## Exercício aplicado (projeto AG real)

PULSAR-RH foi modularizado recentemente e ainda tem funções longas de legado nos módulos mais antigos.

### Passo a passo

1. **Encontrar funções longas:**
   ```bash
   awk '/function |=>\s*{|async [a-zA-Z]/{start=NR; count=0} start{count++} /^}$/{if(count>20) print FILENAME ":" start " (" count " linhas)"; start=0}' \
     $(find /home/ricalfiff/projetos/PULSAR-RH/src -name "*.ts" -o -name "*.js" 2>/dev/null) \
     2>/dev/null | head -20
   ```
   Alternativa mais simples que funciona bem na prática:
   ```bash
   grep -n "async function\|function \|const .* = (" \
     $(find /home/ricalfiff/projetos/PULSAR-RH/src -name "*.ts" 2>/dev/null) \
     | head -30
   ```
   Abra os arquivos com mais hits e procure funções que visivelmente passam de 20 linhas.

2. **Identificar as responsabilidades:** leia a função e liste o que ela faz. Cada item da lista é uma responsabilidade. Se a lista tem mais de 1 item, há candidato a extração.

3. **Refatorar 1 função:** extraia sub-funções com nomes que descrevem a responsabilidade. Teste que o comportamento externo não mudou.

4. **Registrar a decisão** em `PULSAR-RH/DECISIONS.md`:
   ```markdown
   ## 2026-06-XX — [refactor] extrair responsabilidades de <nome-da-função>

   **Problema:** função `<nome>` em `<arquivo>` tinha <N> linhas e <X> razões distintas pra mudar:
   validação de input, transformação de dados e persistência no mesmo bloco.
   **Opções consideradas:**
   - Manter inline: leitura difícil, teste unitário exige mockar coisas não relacionadas
   - Extrair por responsabilidade: cada função testável isoladamente
   **Decisão:** extração em `validateX`, `normalizeX`, `persistX`.
   **Por quê:** mudança de schema de banco não deve forçar reescrita do bloco de validação.
   **Como explicar em entrevista (30s):**
   > "A função misturava validação, transformação e persistência — três razões diferentes pra mudar.
   > Separei em três funções de 6–10 linhas cada. Agora um bug de validação tem diff de 1 arquivo,
   > não de 1 função que faz de tudo. E dá pra testar validação sem mockar banco."
   ```
5. **Commit:** `refactor(pulsar): extract responsibilities from <nome-da-função>`

---

## Pergunta de entrevista esperada + resposta exemplar

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

---

## Checkpoint

- [ ] Consigo distinguir "faz uma coisa só" de "tem uma razão pra mudar" quando perguntado
- [ ] Encontrei pelo menos 1 função > 20 linhas no PULSAR-RH com mais de uma responsabilidade
- [ ] Refatorei a função extraindo sub-funções com nomes descritivos
- [ ] `DECISIONS.md` do projeto tem o bloco registrado com as responsabilidades identificadas
- [ ] Recitei a resposta de entrevista sobre "quando extrair" em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — SRP e funções curtas dominado`.

---

## Recursos

- Robert C. Martin — *Clean Code*, cap. 3 (Functions) — fonte original do "20 linhas"
- Martin Fowler — [Extract Function](https://refactoring.com/catalog/extractFunction.html) — quando e como
- `~/.claude/CLAUDE.md` §CÓDIGO — regras automáticas: "Função > 20 linhas → Extrair sub-função"
