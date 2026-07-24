# 01 — Tipos, Memória, Valor vs Referência

> **Formato expandido (v2):** este módulo tem §Base (o fundamento — o que é memória, stack,
> heap e como o V8 representa um valor), §Estruturação (como os tipos se organizam) e
> §Metodologia (o passo-a-passo pra diagnosticar bug de mutação) — além da prática, P/R e
> checkpoint. Teoria por extenso: resumo não forma.

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

`const` não congela o objeto — só impede que a variável aponte para outro endereço. O conteúdo do heap é mutável. Para imutabilidade real: `Object.freeze()` (shallow) ou `structuredClone()` para deep copy. E `===` compara **endereços** em objetos, não conteúdo — dois objetos com os mesmos campos são sempre `false`.

---

## § BASE — o fundamento

**O que é "memória", de verdade.** A RAM é uma fileira gigante de células numeradas (endereços). Todo dado que o programa manipula está em algum endereço. Uma "variável" não é o dado — é um **nome que o compilador/runtime resolve para um endereço**. Programar com consciência de memória é saber, pra cada nome, *o que* está no endereço: o valor em si, ou o endereço de outro lugar.

**Stack — a pilha de chamadas.** É uma região LIFO (last-in-first-out) gerida automaticamente. Toda vez que uma função é chamada, o runtime empurra um **stack frame**: um bloco com os parâmetros, as variáveis locais e o endereço de retorno (pra onde voltar quando a função acabar). Quando a função retorna, o frame inteiro é descartado num único movimento (o "stack pointer" recua). Por isso a stack é **rápida** — alocar e liberar é só mover um ponteiro, sem procurar espaço. O preço: tamanho fixo e pequeno. Recursão infinita enche a pilha → `RangeError: Maximum call stack size exceeded` (stack overflow). Só cabem coisas de **tamanho conhecido em tempo de compilação** — daí os primitivos morarem aqui.

**Heap — a alocação dinâmica.** É a região de tamanho variável e vida indeterminada. Um objeto pode crescer (`arr.push`), pode viver muito depois da função que o criou (se você retorna ele), e não tem tamanho fixo. Alocar no heap é mais caro (o runtime precisa *achar* um bloco livre grande o suficiente). A variável, na stack, guarda só o **ponteiro** — o endereço do bloco no heap. É isso que "referência" significa concretamente: um número que é um endereço.

**Por que a linguagem separa primitivo de objeto.** Não é capricho. Primitivo tem tamanho fixo e pequeno (um number é 8 bytes) → cabe inline no slot da variável, cópia é trivial. Objeto tem tamanho variável e é compartilhável → precisa do heap, e a variável só carrega o endereço. **Quase toda linguagem gerenciada faz isso** (Java: `int` vs `Object`; C#: value types vs reference types). Não é uma esquisitice do JS.

**Como o V8 representa um valor por baixo (pointer tagging).** No motor V8 (Chrome/Node), toda "word" que representa um valor JS carrega uma **tag** nos bits baixos. Inteiros pequenos (até 31 bits) são **SMIs** (Small Integers): o valor vai embutido direto na word, sem tocar no heap — por isso somar inteiros é baratíssimo. Qualquer outra coisa (objeto, string, número fracionário/grande) é um **ponteiro** pra um `HeapObject`. É esse truque que torna a fronteira stack/heap invisível pra você mas real pra máquina.

**Todo Number é um float64 (IEEE-754).** JavaScript **não tem tipo inteiro** — todo `number` é um double de 64 bits do padrão IEEE-754 (1 bit de sinal, 11 de expoente, 52 de mantissa). É por isso que `0.1 + 0.2 === 0.30000000000000004`: 0.1 e 0.2 não têm representação binária exata, exatamente como 1/3 não tem representação decimal exata. Inteiros são exatos só até `Number.MAX_SAFE_INTEGER` (2⁵³−1 = 9.007.199.254.740.991); além disso os passos ficam maiores que 1 e você perde precisão — foi pra isso que o `bigint` foi criado. **Consequência prática:** nunca guarde dinheiro em `number` de ponto flutuante (use centavos inteiros ou decimal); nunca use `id` numérico grande do banco como `number` sem checar o limite.

**Hidden classes — por que "objeto é lento" é mito.** Objetos JS são dinâmicos (você adiciona propriedade a qualquer hora), mas o V8 não guarda cada um como um dicionário. Ele cria **hidden classes** (também chamadas *Maps* ou *Shapes*): um descritor de layout que diz "propriedade `x` está no offset 0, `y` no offset 1". Objetos criados com **as mesmas propriedades na mesma ordem** compartilham a mesma hidden class e o acesso vira um offset fixo — O(1), quase tão rápido quanto struct de C. Adicionar propriedades em ordens diferentes, ou deletar propriedade, força o V8 a criar hidden classes novas ou cair pro modo dicionário (lento). Ancoragem prática: inicialize os objetos com o mesmo shape.

**Garbage collection — o que "descarta quando o escopo fecha" quer dizer.** Em JS não existe `free()`. Um objeto no heap é liberado quando se torna **inalcançável** (nenhuma cadeia de referências a partir das raízes — variáveis vivas, stack — chega nele). O V8 usa GC **geracional**: objetos novos nascem na *young generation* e são coletados por *Scavenge* (algoritmo de cópia entre dois semi-espaços — rápido, frequente); os que sobrevivem são promovidos pra *old generation*, coletada por *Mark-Sweep-Compact* (mais cara, mais rara). A hipótese que justifica isso: a maioria dos objetos morre jovem. **Por isso vazamento de memória em JS = referência que você esqueceu de soltar**: um listener não removido, um item empurrado num cache global, uma closure que segura um objeto grande. O GC não pode coletar o que ainda é alcançável.

**Por que o JS é assim (histórico).** Brendan Eich escreveu a primeira versão em 10 dias, em 1995, na Netscape. Herdou funções first-class e closures do Scheme, sintaxe do Java e o modelo de protótipos do Self. O `number` único float64 veio da vontade de simplicidade (nada de int/long/float/double pra um público de não-programadores). Muita esquisitice de hoje (`typeof null`, coerção) é dívida daquele prazo, **congelada por compatibilidade retroativa** — a web nunca pode quebrar sites antigos.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A especificação ECMAScript define **8 tipos de linguagem**: 7 primitivos (`Undefined`, `Null`, `Boolean`, `Number`, `BigInt`, `String`, `Symbol`) e `Object`. **Tudo que não é primitivo é Object** — Array, Function, Date, RegExp, Map, Set são todos objetos especializados.

```
VALOR JS
├── PRIMITIVO (imutável, copiado por valor, mora "inline")
│   ├── undefined  → ausência não-inicializada
│   ├── null       → ausência intencional  (typeof null === 'object' ← bug de 1995, congelado)
│   ├── boolean
│   ├── number     → float64 IEEE-754 (o ÚNICO tipo numérico "comum")
│   ├── bigint     → inteiro de precisão arbitrária (além de 2⁵³)
│   ├── string     → sequência imutável de UTF-16
│   └── symbol     → identificador único
└── OBJECT (mutável, referência copiada por valor, mora no heap)
    └── Array · Function · Date · Map · Set · {…}  → todos são Object por baixo
```

**Duas armadilhas do `typeof` que caem em prova.** `typeof null === 'object'` (não é objeto — é um bug histórico que virou contrato). E `typeof function === 'function'` — funções são objetos, mas `typeof` dá um caso especial pra elas; é o único não-primitivo que `typeof` distingue.

**Boxing / wrapper objects.** `"texto".length` funciona mesmo string sendo primitivo porque o JS **autoboxes**: cria temporariamente um objeto `String` wrapper, lê `.length`, descarta. Por isso você nunca usa `new String()`/`new Number()` explicitamente — cria objetos onde queria primitivos, e `new String("a") === "a"` é `false`.

**A semântica de cópia, precisamente.** JS é sempre *pass-by-value* — mas em objetos o "valor" que se copia **é a referência** (o endereço). Por isso passar um objeto pra função e mexer nas propriedades dele afeta o original (mesmo endereço), mas reatribuir o parâmetro (`param = outro`) não afeta o de fora (você trocou só a cópia local do endereço).

| Necessidade | Use | Não use |
|---|---|---|
| Copiar array flat sem alterar o original | `[...arr]` ou `arr.slice()` | `arr2 = arr` — compartilha referência |
| Copiar objeto flat | `{ ...obj }` ou `Object.assign({}, obj)` | `obj2 = obj` |
| Clonar estrutura aninhada | `structuredClone(obj)` | `JSON.parse(JSON.stringify(obj))` — perde `Date`, `undefined`, funções, `RegExp` |
| Objeto que nunca deve mudar | `Object.freeze(obj)` (shallow) | Nada — `const` não basta |
| Array readonly em TS | `ReadonlyArray<T>` / `readonly T[]` | `any[]` mutável em API pública |
| Comparar conteúdo de objetos | `JSON.stringify` (flat) ou lib de deep-equal | `===` — compara referência |

**Regra de bolso:** `const` protege o ponteiro, não o dado. Variável nova ≠ cópia profunda. `structuredClone` é o default moderno de deep copy (Node 17+ e todos os browsers atuais).

---

## § METODOLOGIA — o passo-a-passo replicável

**Diagnosticar um bug de "mudou sozinho" (mutação por referência):**

1. **Nomeie o sintoma como pergunta de identidade.** "Esse objeto/array mudou e eu não toquei" quase sempre é *dois nomes pro mesmo endereço*. Pergunte: quantas variáveis apontam pra esse bloco do heap?
2. **Rastreie a origem.** De onde veio a referência? Atribuição (`b = a`), parâmetro de função, elemento de array, valor de estado do React. Cada ponto desses **compartilha o endereço**, não copia o conteúdo.
3. **Ache o mutador.** Procure operações que mudam em vez de retornar novo: `.sort()`, `.reverse()`, `.splice()`, `.push()`, `.pop()`, atribuição a propriedade (`obj.x =`). Todas mutam **in place**.
4. **Decida a profundidade da cópia.** Só campos de primeiro nível importam? `{...obj}` / `[...arr]` resolve. Há aninhamento que você também vai mutar? `structuredClone`.
5. **Corrija na fronteira certa.** Copie **antes** de mutar, o mais perto possível de onde a mutação acontece (não espalhe cópias defensivas por todo lado — isso mascara o problema e custa memória).
6. **Prove.** Rode e verifique que o original ficou intacto (`console.log` do de fora depois da operação).

**Anti-padrões (o que NÃO fazer):**
- **`arr.sort()` num array recebido por parâmetro** — muta o dado do caller sem ele pedir. Use `[...arr].sort()`.
- **`JSON.parse(JSON.stringify(x))` como deep clone universal** — silenciosamente vira `Date` em string, apaga `undefined`, apaga funções, quebra em referência circular. Use `structuredClone`.
- **Confiar que `const obj = {...}` impede mutação** — não impede; `obj.x = 9` funciona. `const` é sobre o binding, não o conteúdo.
- **`Object.freeze` achando que é deep** — é shallow; `frozen.nested.x = 9` ainda muta o nível de baixo.
- **Comparar objetos com `===` esperando comparar conteúdo** — compara endereço; use serialização ou deep-equal.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Mutação acidental de array/objeto recebido como parâmetro é bug silencioso clássico — provável em handlers do PULSAR-RH que manipulam respostas de API.

1. **Encontre funções que mutam parâmetro:**
   ```bash
   grep -rn "\.sort(\|\.reverse(\|\.splice(\|\.push(\|\.pop(\|\.shift(\|\.unshift(" \
     ~/projetos/PULSAR-RH/src/ --include="*.ts" --include="*.js"
   ```
2. **Para cada match**, aplique a metodologia: o array veio como parâmetro? Está sendo mutado in place? Então o caller vê o dado alterado sem ter pedido.
3. **Corrija** copiando antes:
   ```ts
   // antes — muta o array do caller
   function processItems(items: Item[]) {
     items.sort((a, b) => a.name.localeCompare(b.name))
     return items
   }
   // depois — sem efeito colateral
   function processItems(items: readonly Item[]): Item[] {
     return [...items].sort((a, b) => a.name.localeCompare(b.name))
   }
   ```
4. **Confirme no console:** teste com um array de fora, verifique que ele não mudou depois da chamada.
5. **Registre a decisão** no `DECISIONS.md` do projeto (bloco ADR-leve: problema, opções `[...arr]` vs `structuredClone`, decisão, por quê, resposta de 30s).
6. **Commit:** `fix: avoid mutating array params in item processing`.

---

## Por que cai em entrevista

É o fundamento que explica metade dos bugs de estado em React e das mutações acidentais em Node. Quem não domina não consegue nem descrever por que "o objeto mudou sozinho". Variações reais:

- "Por que esse objeto foi modificado se eu não toquei nele?"
- "Qual a diferença entre shallow copy e deep copy?"
- "Por que `arr1 === arr2` é false mesmo com os mesmos elementos?"
- "O que `const` garante, de verdade?"
- "Onde na memória vive uma string? E um array?"
- "Por que `0.1 + 0.2 !== 0.3`?"

> **P:** "Por que `obj1 === obj2` retorna false mesmo que os dois tenham os mesmos campos e valores?"
>
> **R (30s):**
> "Porque `===` em objetos compara referências de memória, não conteúdo. `obj1` e `obj2` são dois objetos diferentes alocados no heap em endereços distintos — eles só seriam iguais com `===` se fossem exatamente a mesma instância. Para comparar conteúdo, você usa `JSON.stringify` nos dois (funciona para objetos simples) ou uma lib de deep equality. Isso é diferente de primitivos: `42 === 42` é true porque o valor em si é comparado."

> **P:** "Como você evita que uma função altere um objeto que ela recebeu como parâmetro?"
>
> **R (30s):**
> "Crio uma cópia antes de mexer. Para objetos e arrays simples (sem aninhamento que me importa), uso spread: `{ ...obj }` ou `[...arr]`. Para estruturas profundamente aninhadas, uso `structuredClone` — disponível nativo desde Node 17. Evito `JSON.parse(JSON.stringify(obj))` porque perde Dates, funções e undefined. Em TypeScript, declaro o parâmetro como `Readonly<T>` ou `ReadonlyArray<T>` para o compilador me avisar se eu tentar mutar."

> **P:** "Por que `0.1 + 0.2` não dá `0.3` em JavaScript?"
>
> **R (30s):**
> "Porque todo `number` em JS é um float64 do padrão IEEE-754 — não existe tipo inteiro. 0.1 e 0.2 não têm representação binária exata, do mesmo jeito que 1/3 não tem representação decimal exata. A soma acumula o erro de arredondamento e dá `0.30000000000000004`. Na prática, isso significa nunca comparar floats com `===` — uso uma tolerância (epsilon) — e nunca guardar dinheiro em float: uso centavos como inteiro ou um tipo decimal."

## Checkpoint

- [ ] Explico o que está na stack vs no heap e por que primitivo mora num e objeto no outro
- [ ] Sei prever o comportamento de `===` em primitivos vs objetos, e por quê
- [ ] Explico por que todo `number` é float64 e o que isso quebra (dinheiro, `0.1+0.2`, MAX_SAFE_INTEGER)
- [ ] Encontrei e corrigi ≥1 mutação acidental de parâmetro num projeto AG
- [ ] Sei quando `structuredClone` é necessário vs quando spread basta
- [ ] Recitei as três respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Tipos, Memória e Referência dominados`.

---

## Recursos

- **MDN** — "JavaScript data types and data structures" (os 8 tipos da linguagem) e "Memory management" (heap, alcançabilidade, GC)
- **MDN** — "Equality comparisons and sameness" (`===`, `Object.is`, `==`) e "structuredClone()" (Web API reference)
- **You Don't Know JS** (Kyle Simpson) — volume *Types & Grammar*, caps. sobre tipos e coerção; volume *Scope & Closures* pra entender o que mantém um objeto alcançável
- **V8 dev blog** — conceitos "hidden classes / Maps (Shapes)" e "the Orinoco garbage collector" (Scavenge + Mark-Compact) — ler pelos nomes dos conceitos
- **IEEE 754** — padrão de ponto flutuante binário (o *porquê* de `0.1+0.2`); o site *0.30000000000000004.com* ilustra em várias linguagens
- `~/.claude/CLAUDE.md` §JAVASCRIPT — regra: "Função mutando objeto/array recebido como parâmetro → retornar novo"
