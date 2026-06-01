# 04 — Abstração e a Regra dos 3

## O que é

**DRY mal aplicado é pior que duplicação.** "Don't Repeat Yourself" é frequentemente interpretado como "nunca escreva o mesmo código duas vezes". Isso está errado. A regra real é: não repita **conhecimento**, não código. Dois blocos que parecem iguais hoje podem representar conceitos diferentes que vão divergir amanhã.

**Regra dos 3:** só abstraia no terceiro uso. Não no segundo.

```ts
// Primeira vez: escreve direto
const employeeAge = differenceInYears(new Date(), employee.birthDate)

// Segunda vez: ainda escreve direto — pode divergir, pode mudar de lib, pode ter edge case diferente
const candidateAge = differenceInYears(new Date(), candidate.birthDate)

// Terceira vez: agora abstrai — o padrão se confirmou, a abstração tem 3 usuários reais
function calculateAgeInYears(birthDate: Date): number {
  return differenceInYears(new Date(), birthDate)
}
```

Por que esperar a terceira? Porque na segunda, você ainda não sabe se as duas instâncias são o mesmo conceito ou dois conceitos que acidentalmente têm a mesma forma. Abstração prematura une coisas que deveriam ser separadas — e quando uma precisa mudar, você deforma a abstração ou duplica de volta.

**Duplicação acidental vs conceitual:**

```ts
// Duplicação ACIDENTAL — mesma forma, conceitos diferentes
// Não abstrair: as regras de validação de CPF de funcionário vs CPF de cliente
// provavelmente vão divergir (um pode ter CNPJ, o outro não; regras de negócio diferentes)
function validateEmployeeCPF(cpf: string): boolean { /* ... */ }
function validateClientCPF(cpf: string): boolean { /* ... */ }

// Duplicação CONCEITUAL — mesmo conceito, deve ser abstraído
// Toda entidade do sistema tem a mesma lógica de soft delete — é o mesmo conceito
function softDeleteEmployee(id: string) { /* marca deletedAt = now */ }
function softDeleteClient(id: string) { /* marca deletedAt = now */ }
function softDeleteRecording(id: string) { /* marca deletedAt = now */ }
// → abstrair em função genérica ou método no Prisma client
```

**YAGNI (You Aren't Gonna Need It):** não construa a abstração "pra quando precisar depois". O custo de construir algo que não vai ser usado é real: tempo agora + complexidade pra quem lê depois.

**Sintomas de abstração prematura:**

- Função/classe com 10+ parâmetros de configuração pra cobrir variações hipotéticas
- Classe base abstrata com uma única subclasse
- Factory que instancia um único tipo concreto
- Interface implementada por uma única classe
- Parâmetro `mode: 'a' | 'b'` que faz a função ter dois comportamentos completamente diferentes — são duas funções

```ts
// Abstração prematura com mode flag — são duas funções com uma roupagem
function fetchEmployees(options: {
  mode: 'active' | 'archived',
  departmentId?: string,
  includeMetrics?: boolean,
  withSalary?: boolean,
  // ... 8 parâmetros opcionais pra cobrir casos hipotéticos
}) { /* ... */ }

// Mais honesto — quando o segundo caso aparece de verdade, você cria
function fetchActiveEmployees(departmentId?: string): Promise<Employee[]> { /* ... */ }
```

---

## Por que cai em entrevista

Abstração é um dos temas onde júnior e sênior pensam diferente. Júnior acha que mais abstração = mais qualidade. Sênior sabe que abstração tem custo — especialmente quando é prematura. Perguntas comuns:

- "Quando você cria uma abstração vs aceita duplicar?"
- "O que é DRY pra você?" — querem ouvir que não é só "não repetir código"
- "Você pode refatorar isso?" (mostram 2 funções parecidas) — a resposta errada é abstrair de imediato
- "O que é YAGNI?" — não é só conhecimento teórico, querem ver aplicação
- "Por que essa abstração tem tantos parâmetros?" — reconhecer abstração prematura ao vivo

---

## Trade-offs

| Cenário | Ação | Motivo |
|---|---|---|
| 2 blocos com mesma forma | Aguardar 3º uso antes de abstrair | Podem divergir — abstração une o que deveria ser separado |
| 3+ blocos com mesmo conceito | Abstrair agora | Padrão confirmado; mudança de conceito afeta todos |
| Abstração com 1 usuário | Inline de volta — YAGNI | Indireção sem benefício; dificulta leitura |
| Abstração com modo `a \| b` que muda comportamento radicalmente | Separar em 2 funções | São 2 funções fingindo ser 1 |
| DRY aplicado a 2 conceitos acidentalmente iguais | Aceitar duplicação | Conceitos distintos devem poder evoluir separados |
| Classe base abstrata com 1 subclasse | Remover — inline na subclasse | Hierarquia sem utilidade real |

**Custo real de abstração prematura:**
1. A abstração foi construída pra cobrir variações que nunca apareceram
2. Quando uma das instâncias precisa mudar, você deforma a abstração com um parâmetro especial
3. Ou duplica de volta — pagando o custo de criar E de desfazer
4. Próximo leitor precisa entender por que essa abstração existe com um único usuário

---

## Exercício aplicado (projeto AG real)

AG Hub e PULSAR-RH têm funções de integração/utilidade que foram criadas "genéricas" mas possivelmente têm um único chamador real.

### Passo a passo

1. **Encontrar funções "utilitárias" com poucos chamadores:**
   ```bash
   # Lista funções exportadas nos projetos
   grep -rn "^export function\|^export async function\|^export const .* = " \
     /home/ricalfiff/projetos/ag-hub/src \
     /home/ricalfiff/projetos/PULSAR-RH/src \
     --include="*.ts" 2>/dev/null \
     | grep -v "index\|types\|\.d\.ts" \
     | head -30
   ```
   Depois, para cada função identificada, contar os chamadores:
   ```bash
   # Troque NOME_DA_FUNCAO pelo nome real encontrado
   grep -rn "NOME_DA_FUNCAO" \
     /home/ricalfiff/projetos/PULSAR-RH/src \
     --include="*.ts" 2>/dev/null \
     | grep -v "^.*export\|^.*function\|^.*const "
   ```

2. **Para cada função com 1 único chamador:**
   - É uma abstração prematura? O nome é mais genérico que o uso?
   - A função tem parâmetros que nunca são passados como não-default?
   - Se sim: avaliar inline (mover o corpo direto pro único chamador)

3. **Justificar a decisão:** inline ou manter?
   - Manter se: a função encapsula uma regra de negócio nomeada, mesmo com 1 chamador
   - Inline se: é apenas agrupamento de código sem conceito próprio

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [refactor] inline de abstração prematura em <arquivo>

   **Problema:** função `<nome>` em `<arquivo>` tinha um único chamador.
   Estava abstraída "pra quando precisar depois" mas nunca foi reutilizada.
   **Análise:** duplicação acidental ou conceitual?
   - Acidental: o contexto de uso é específico demais pra generalizar
   - O nome genérico (`process`, `handle`, `util`) não representa um conceito de negócio
   **Decisão:** inline no único chamador. Se aparecer segundo uso, reavaliar.
   **Alternativa considerada:** manter abstraído com nome mais específico.
   Descartado pq o conceito não é reutilizável por natureza — é procedimento pontual.
   **Por quê:** abstração com 1 usuário é indireção sem benefício. YAGNI.
   **Como explicar em entrevista (30s):**
   > "Encontrei uma função genérica com um único chamador. Abstração prematura —
   > foi criada 'pra quando precisar'. Coloquei o código de volta no chamador.
   > Se surgir um segundo uso real, aí crio a abstração. O custo de criar quando precisar
   > é menor que o custo de manter indireção desnecessária."
   ```
5. **Commit:** `refactor: inline single-caller abstraction in <arquivo>`

---

## Pergunta de entrevista esperada + resposta exemplar

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

---

## Checkpoint

- [ ] Consigo explicar por que DRY aplicado a código acidentalmente igual pode ser pior que duplicação
- [ ] Encontrei pelo menos 1 função "genérica" num projeto AG com único chamador
- [ ] Tomei a decisão documentada: inline ou manter (com justificativa)
- [ ] `DECISIONS.md` tem o bloco com análise de duplicação acidental vs conceitual
- [ ] Recitei a resposta sobre abstração em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Abstração e regra dos 3 dominado`.

---

## Recursos

- Sandi Metz — [The Wrong Abstraction](https://sandimetz.com/blog/2016/1/20/the-wrong-abstraction) — o ensaio que define "duplicação é mais barata que abstração errada"
- Martin Fowler — [Yagni](https://martinfowler.com/bliki/Yagni.html)
- `~/.claude/CLAUDE.md` §CÓDIGO — "Abstração → Só ao 3º uso"
