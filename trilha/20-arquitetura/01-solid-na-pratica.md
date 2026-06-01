# 01 — SOLID na Prática

## O que é

SOLID é um acrônimo para cinco princípios de design orientado a objetos que, juntos, reduzem o custo de mudar código. O nome foi cunhado por Robert Martin. Na prática, você não aplica os cinco de uma vez — você os viola, o código apodrece, e aí você aprende o que cada um protegia.

```ts
// SRP violado: uma função faz validação + lógica de negócio + persistência
async function createEmployee(data: unknown) {
  if (!data.name || !data.cpf) throw new Error('campos obrigatórios')  // validação
  const salary = data.baseSalary * 1.3                                  // lógica
  await db.employees.insert({ ...data, salary })                        // persistência
}

// SRP respeitado: cada coisa tem uma razão para mudar
function validateEmployee(data: unknown): EmployeeInput { ... }        // muda quando regras de validação mudam
function calculateSalary(base: number): number { ... }                 // muda quando regra salarial muda
async function saveEmployee(employee: Employee): Promise<void> { ... } // muda quando banco muda
```

---

## Por que cai em entrevista

SOLID é o primeiro filtro de "sabe arquitetura ou só sabe codar". Saber definir não basta — pedem exemplo real.

- "Me explica SOLID com código que você já escreveu"
- "O que é SRP? Mostre um antes/depois"
- "Qual princípio SOLID você mais viola sem querer? Como você percebe?"
- "O que é inversão de dependência e por que ela facilita teste?"
- "Diferença entre Open/Closed e herança?"

---

## Trade-offs (quando usar X vs Y)

| Princípio | O que protege | Custo se ignorado | Quando não vale a pena aplicar |
|---|---|---|---|
| SRP — Single Responsibility | Cada unidade tem uma razão para mudar | Mudança em A quebra B sem motivo aparente | Script de 30 linhas sem futuro |
| OCP — Open/Closed | Adicionar comportamento sem editar código existente | Cada feature nova exige mexer no core | Sistema sem extensões previstas |
| LSP — Liskov Substitution | Subtipo pode substituir o tipo pai sem surpresa | Bug difícil de rastrear ao usar polimorfismo | Herança rara no código |
| ISP — Interface Segregation | Cliente depende só do que usa | Mock de test enorme; anotação de tipo gigante | Interface simples com 2-3 métodos |
| DIP — Dependency Inversion | Módulo de alto nível não depende de detalhe | Trocar banco = reescrever lógica de negócio | Projeto pequeno sem troca de infra prevista |

**Regra de bolso:** SRP e DIP têm ROI imediato. OCP e ISP só pagam em sistemas com extensões reais. LSP é consequência natural de usar herança com cuidado.

---

## Exercício aplicado (projeto AG real)

O PULSAR-RH tem arquivos como `client-indicators.js`, `client-nav.js`, `client-leaders.js` — cada um separado. Mas existe violação de SRP dentro de alguns deles: funções que buscam dados, calculam e renderizam no mesmo bloco.

### Passo a passo

1. **Encontrar violação de SRP:**
   ```bash
   grep -n "fetch\|render\|document\." ~/projetos/PULSAR-RH/client-indicators.js | head -30
   ```
   Procure linhas onde `fetch(...)` e `document.querySelector(...)` aparecem na mesma função — isso é SRP violado (fetch = busca de dado; querySelector = renderização).

2. **Encontrar violação de DIP no Meet Hub:**
   ```bash
   grep -n "import.*prisma\|from.*db" ~/projetos/meet-hub/apps/api/src/routes/recordings.ts | head -10
   ```
   A rota importa `prisma` diretamente — a camada de apresentação (rota) depende do detalhe de infraestrutura (Prisma). Isso é DIP violado: deveria depender de uma interface/serviço, não do ORM.

3. **Verificar se há ISP violado nos tipos do PULSAR-RH:**
   ```bash
   grep -rn "interface\|type " ~/projetos/PULSAR-RH/client-utils.js | head -20
   ```

4. **Escolha 1 violação SRP que você encontrou** e reescreva separando em duas funções: uma que busca dado, outra que renderiza. Não precisa commitar — só exercitar o raciocínio.

5. **Registrar em `~/projetos/PULSAR-RH/DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [arquitetura] Identificação de violações SRP em client-indicators.js

   **Problema:** funções misturando fetch de dado + cálculo + renderização DOM na mesma função.
   **Princípio violado:** SRP — a função tem 3 razões para mudar (backend muda, cálculo muda, HTML muda).
   **Opções consideradas:**
   - Extrair em fetchIndicators() + calculateIndicators() + renderIndicators() separados
   - Manter como está (custo: mudança no backend = risco de quebrar renderização)
   **Decisão:** registrar como dívida técnica — aplicar na próxima sessão de refatoração.
   **Como explicar em entrevista (30s):**
   > "No PULSAR-RH tinha funções que faziam fetch, cálculo e render no mesmo bloco. Identifiquei como violação de SRP: três razões para mudar na mesma função. Extraí em funções separadas — fetch retorna dado bruto, cálculo transforma, render só exibe. Quando o backend mudou, só o fetch precisou ser alterado."
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Me dá um exemplo de onde você aplicou SOLID num projeto real."
>
> **R (30s):**
> "No Meet Hub, a rota de gravações importava o Prisma diretamente — violação de DIP. A rota (alto nível) dependia do ORM (detalhe). Quando precisei testar a lógica sem banco, era impossível fazer mock. Identifiquei que deveria depender de uma interface, não da implementação. Mesmo sem refatorar completamente, entendo o problema: se o banco mudar de Prisma para outra coisa, preciso editar cada rota. Com DIP, só mudaria o serviço de dados."

> **P:** "Por que SRP é o princípio mais violado na prática?"
>
> **R (30s):**
> "Porque a violação é invisível enquanto o projeto é pequeno. Quando você está escrevendo, 'buscar e exibir' parece uma coisa só. O custo aparece quando você precisa testar: não dá pra testar a lógica sem disparar o banco. Ou quando muda o design: precisa editar a função que também contém regra de negócio. SRP não é sobre separar por razão estética — é sobre separar por razão de mudança."

---

## Checkpoint

- [ ] Consigo identificar violação de SRP num arquivo real sem ajuda
- [ ] Sei explicar DIP sem mencionar a palavra "abstração" como decoreba
- [ ] Encontrei pelo menos 1 violação concreta no PULSAR-RH ou Meet Hub com grep
- [ ] Escrevi antes/depois de SRP com código TypeScript real
- [ ] Recitei a resposta de entrevista em voz alta e ficou abaixo de 35 segundos

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — SOLID na prática dominado`.

---

## Recursos

- Robert C. Martin — *Clean Architecture* (cap. 7-11 cobrem SOLID com exemplos)
- [SOLID em TypeScript](https://khalilstemmler.com/articles/solid-principles/solid-typescript/) — exemplos concretos por princípio
- Código real: `~/projetos/meet-hub/apps/api/src/routes/recordings.ts` — DIP violado (prisma direto na rota)
- Código real: `~/projetos/PULSAR-RH/client-indicators.js` — SRP suspeito (fetch + render misturados)
