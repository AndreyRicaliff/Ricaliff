# 01 — Tipos, Memória, Valor vs Referência

## O que é

JavaScript tem dois mundos de memória. **Primitivos** (number, string, boolean, null, undefined, symbol, bigint) vivem na **stack** — copiados por valor, descartados quando o escopo fecha. **Objetos** (object, array, function) vivem no **heap** — a variável guarda apenas o **endereço** (referência), não o conteúdo.

```ts
// primitivo: cópia real
let a = 42
let b = a
b = 99
console.log(a) // 42 — a não mudou

// objeto: cópia do endereço
const obj1 = { x: 1 }
const obj2 = obj1       // mesmo endereço no heap
obj2.x = 99
console.log(obj1.x)     // 99 — mutou o original
```

`const` não congela o objeto — só impede que a variável aponte para outro endereço. O conteúdo do heap é mutável. Para imutabilidade real: `Object.freeze()` (shallow) ou `structuredClone()` para deep copy.

```ts
const arr = [1, 2, 3]
arr.push(4)           // funciona — const não impede mutação interna
arr = [5]             // TypeError — isso a const bloqueia

const deep = { a: { b: 1 } }
const clone = structuredClone(deep)
clone.a.b = 99
console.log(deep.a.b) // 1 — totalmente independente
```

`===` compara endereços em objetos, não conteúdo. Dois objetos com mesmo conteúdo são sempre `false` com `===`.

```ts
const x = { n: 1 }
const y = { n: 1 }
console.log(x === y) // false — endereços diferentes no heap
console.log(x === x) // true  — mesmo endereço
```

---

## Por que cai em entrevista

É o fundamento que explica metade dos bugs de estado em React e mutações acidentais em Node. Variações reais:

- "Por que esse objeto foi modificado se eu não toquei nele diretamente?"
- "Qual a diferença entre shallow copy e deep copy?"
- "Por que `arr1 === arr2` é false mesmo tendo os mesmos elementos?"
- "O que `const` garante, de verdade?"
- "Como você clonaria um objeto profundamente aninhado?"
- "Por que `JSON.parse(JSON.stringify(obj))` funciona como deep clone mas tem limitações?"
- "Onde na memória vive uma string? E um array?"

---

## Trade-offs (quando usar X vs Y)

| Necessidade | Use | Não use |
|---|---|---|
| Copiar array sem alterar o original (flat) | `[...arr]` ou `arr.slice()` | `arr2 = arr` — compartilha referência |
| Copiar objeto simples (flat) | `{ ...obj }` ou `Object.assign({}, obj)` | `obj2 = obj` |
| Clonar estrutura com aninhamento | `structuredClone(obj)` | `JSON.parse(JSON.stringify(obj))` — perde `Date`, `undefined`, funções, `RegExp` |
| Objeto que nunca deve mudar | `Object.freeze(obj)` | Nada — `const` não basta |
| Array readonly em TypeScript | `ReadonlyArray<T>` ou `readonly T[]` | `any[]` mutable exposto em API pública |
| Comparar conteúdo de objetos | `JSON.stringify` (rápido, flat OK) ou `deep-equal` (lib) | `===` — compara referência, não conteúdo |

**Regra de bolso:**
- Variável nova = não é cópia profunda. Sempre use spread/structuredClone quando não quiser mutação cruzada.
- `const` protege o ponteiro, não o dado.
- `structuredClone` é o default moderno para deep copy — disponível em Node 17+ e todos os browsers modernos.

---

## Exercício aplicado (projeto AG real)

Mutações acidentais de array recebido como parâmetro são bug silencioso comum. Tem ocorrência provável no PULSAR-RH (handlers que manipulam arrays de resposta de API).

### Passo a passo

1. **Encontrar funções que mutam parâmetros array/objeto:**
   ```bash
   grep -rn "\.sort\(\|\.reverse\(\|\.splice\(\|\.push\(\|\.pop\(\|\.shift\(\|\.unshift\(" \
     ~/projetos/PULSAR-RH/src/ --include="*.ts" --include="*.js"
   ```

2. **Para cada match, ler o contexto:**
   - O array/objeto foi recebido como parâmetro?
   - Se sim: está mutando o dado do caller sem ele saber.
   - Exemplo clássico: `items.sort(...)` muta o array original. `[...items].sort(...)` não muta.

3. **Verificar também o cliente-oficina-backend (sync de dados de loja):**
   ```bash
   grep -rn "\.sort\(\|\.reverse\(\|\.push\(" \
     ~/projetos/cliente-oficina-backend/src/ --include="*.ts" | head -30
   ```

4. **Corrigir o padrão encontrado:**
   ```ts
   // antes (mutação acidental)
   function processItems(items: Item[]) {
     items.sort((a, b) => a.name.localeCompare(b.name)) // muta o array original!
     return items
   }

   // depois (sem mutação)
   function processItems(items: Item[]): Item[] {
     return [...items].sort((a, b) => a.name.localeCompare(b.name))
   }
   ```

5. **Registrar decisão no `DECISIONS.md` do projeto:**
   ```markdown
   ## 2026-06-XX — [bug] evitar mutação de parâmetros array em processamento

   **Problema:** funções recebiam array por referência e chamavam `.sort()` / `.push()` direto,
   mutando o dado do caller sem sinalizar. Bug silencioso: quem chamava via o array alterado
   sem ter pedido.
   **Opções:**
   - `[...arr].sort(...)` — cópia flat, suficiente para arrays de objetos simples
   - `structuredClone(arr)` — deep copy, necessário se objetos no array têm referências aninhadas
   **Decisão:** `[...arr]` para sort/reverse (acesso flat). `structuredClone` quando precisar
   isolar completamente.
   **Por quê:** funções que não mutam parâmetros são previsíveis e testáveis em isolamento.
   **Como explicar em entrevista (30s):**
   > "Array em JS é passado por referência. Chamar .sort() diretamente muta o dado do caller.
   > Corrigi criando uma cópia com spread antes de ordenar — sem custo relevante, sem surpresa."
   ```

6. **Commit:** `fix: avoid mutating array params in item processing functions`

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Por que `obj1 === obj2` retorna false mesmo que os dois tenham os mesmos campos e valores?"
>
> **R (30s):**
> "Porque `===` em objetos compara referências de memória, não conteúdo. `obj1` e `obj2` são dois objetos diferentes alocados no heap em endereços distintos — eles só seriam iguais com `===` se fossem exatamente a mesma instância. Para comparar conteúdo, você usa `JSON.stringify` nos dois (funciona para objetos simples) ou uma lib de deep equality. Isso é diferente de primitivos: `42 === 42` é true porque o valor em si é comparado."

> **P:** "Como você evita que uma função altere um objeto que ela recebeu como parâmetro?"
>
> **R (30s):**
> "Crio uma cópia antes de mexer. Para objetos e arrays simples (sem aninhamento que me importa), uso spread: `{ ...obj }` ou `[...arr]`. Para estruturas profundamente aninhadas, uso `structuredClone` — disponível nativo desde Node 17. Evito `JSON.parse(JSON.stringify(obj))` porque perde Dates, funções e undefined. Em TypeScript, declaro o parâmetro como `Readonly<T>` ou `ReadonlyArray<T>` para o compilador me avisar se eu tentar mutar."

---

## Checkpoint

- [ ] Consigo explicar o que está na stack vs no heap sem consultar
- [ ] Sei prever o comportamento de `===` em primitivos vs objetos
- [ ] Encontrei e corrigi pelo menos 1 mutação acidental de parâmetro num projeto AG
- [ ] Sei usar `structuredClone` e explico quando preferir ao spread
- [ ] Recitei ambas as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Tipos, Memória e Referência dominados`.

---

## Recursos

- MDN — [Primitive](https://developer.mozilla.org/docs/Glossary/Primitive)
- MDN — [structuredClone](https://developer.mozilla.org/docs/Web/API/structuredClone)
- MDN — [Equality comparisons (===)](https://developer.mozilla.org/docs/Web/JavaScript/Equality_comparisons_and_sameness)
- `~/.claude/CLAUDE.md` §JAVASCRIPT — regra: "Função mutando objeto/array recebido como parâmetro → retornar novo"
