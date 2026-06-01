# 02 — Early Return e Guard Clauses

## O que é

**Carga cognitiva de nesting:** cada nível de indentação exige que o leitor mantenha uma condição a mais na memória de trabalho. Com 3 níveis aninhados, você está rastreando 3 condições ao mesmo tempo para entender qual bloco executa. O cérebro humano começa a falhar aí.

**Guard clause** é uma condição no topo da função que retorna (ou lança) imediatamente se um pré-requisito falhar. Inverte a lógica: ao invés de "se tudo estiver OK, faz X", você faz "se não estiver OK, sai agora".

```ts
// Anti-pattern: arrow code — o caminho feliz fica enterrado
async function processPayment(order: Order | null, user: User | null) {
  if (order) {
    if (user) {
      if (order.status === 'pending') {
        if (user.hasPaymentMethod) {
          const result = await chargeCard(user.paymentMethod, order.total)
          if (result.success) {
            await updateOrderStatus(order.id, 'paid')
            return result
          } else {
            throw new Error('charge failed')
          }
        } else {
          throw new Error('no payment method')
        }
      } else {
        throw new Error('order not pending')
      }
    } else {
      throw new Error('user not found')
    }
  } else {
    throw new Error('order not found')
  }
}

// Correto: guard clauses no topo, caminho feliz linear
async function processPayment(order: Order | null, user: User | null) {
  if (!order) throw new Error('order not found')
  if (!user) throw new Error('user not found')
  if (order.status !== 'pending') throw new Error('order not pending')
  if (!user.hasPaymentMethod) throw new Error('no payment method')

  const result = await chargeCard(user.paymentMethod, order.total)
  if (!result.success) throw new Error('charge failed')

  await updateOrderStatus(order.id, 'paid')
  return result
}
```

**Padrão fail-fast:** valide pré-condições imediatamente na entrada. Quanto antes o erro aparece, mais fácil de debugar — você não chega na linha 80 para descobrir que o input da linha 1 era inválido.

**Quando aninhar faz sentido:** lógica genuinamente hierárquica onde o contexto externo e interno são interdependentes — por exemplo, parsear uma estrutura de árvore ou percorrer DOM. Mesmo assim, se passar de 2 níveis, avalie extrair a lógica interna em função separada.

---

## Por que cai em entrevista

Nesting profundo aparece em todo código legado. A capacidade de lê-lo, explicá-lo e simplificá-lo ao vivo é um filtro real. Variações:

- "Você pode me explicar o que esse código faz?" (e te mostram arrow code com 5 níveis)
- "Como você simplificaria isso?" — querem ouvir guard clauses
- "O que é fail-fast?" — conceito mais amplo, guard clause é a implementação
- "Por que nesting profundo é ruim?" — querem ouvir sobre carga cognitiva, não só "fica feio"
- "Como você mantém código legível conforme a complexidade cresce?"

---

## Trade-offs

| Cenário | Ação | Motivo |
|---|---|---|
| Nesting > 2 níveis | Guard clause no topo | Carga cognitiva, leitura linear |
| Múltiplas condições de saída | Retornos antecipados explícitos | Melhor que flag booleana `isValid` |
| Lógica genuinamente hierárquica | Aceitar 2 níveis + extrair função | Nesting reflete estrutura real dos dados |
| Guard clause tornaria o código maior | Aceitar se clareza compensa | Linhas a mais valem se reduzem carga cognitiva |
| Early return numa função com efeito colateral parcial | Cuidado com cleanup — usar `try/finally` | Saída antecipada pode vazar recurso |

**Custo de violar:** revisor precisa rastrear os caminhos de saída mentalmente. Bug escondido no `else` do nível 4. Teste que precisa configurar 4 condições aninhadas pra cobrir 1 branch.

---

## Exercício aplicado (projeto AG real)

Meet Hub tem lógica de bot com múltiplas checagens (sessão ativa, slot disponível, puppeteer inicializado) e PULSAR-RH tem handlers de validação de pesquisa.

### Passo a passo

1. **Encontrar nesting profundo (>3 níveis):**
   ```bash
   grep -n "^\s\{12,\}if\|^\s\{12,\}}" \
     $(find /home/ricalfiff/projetos/PULSAR-RH/src \
            /home/ricalfiff/projetos/meet-hub/src \
            -name "*.ts" -o -name "*.js" 2>/dev/null) \
     2>/dev/null | head -20
   ```
   Cada 4 espaços = 1 nível. 12 espaços = nível 3 (já candidato). 16+ = definitivo.

   Alternativa visual: abra qualquer handler grande e procure visualmente blocos onde o código "afunila" em pirâmide.

2. **Identificar as condições de guarda:** liste cada `if` que protege o bloco principal. Essas são suas guard clauses.

3. **Refatorar com early returns:**
   - Inverta cada condição de guarda
   - Coloque o `return` / `throw` imediatamente
   - O bloco principal fica linear no final da função

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [refactor] eliminar nesting em <nome-da-função>

   **Problema:** função `<nome>` tinha <N> níveis de nesting — leitor precisava rastrear
   <X> condições simultâneas pra entender o caminho feliz.
   **Decisão:** guard clauses no topo com early return/throw para cada pré-condição.
   Caminho feliz ficou linear nas últimas <Y> linhas.
   **Por quê:** carga cognitiva de nesting > 2 causa erros de leitura e dificulta teste por branch.
   **Como explicar em entrevista (30s):**
   > "Tinha 4 níveis de if aninhado — o caminho feliz ficava enterrado no fundo.
   > Inverta a lógica: cada pré-condição que falhasse saía imediatamente com guard clause.
   > O código principal ficou linear e cada condição de saída agora é óbvia sozinha."
   ```
5. **Commit:** `refactor: flatten nested conditionals in <nome-da-função> with guard clauses`

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Você pode me explicar esse código aninhado e me mostrar como simplificaria?"
>
> **R (30s):**
> "Vou ler de dentro pra fora — o caminho feliz está no nível mais interno, então preciso rastrear todas as condições acima pra entender o que realmente acontece.
>
> Para simplificar: inverto cada condição de guarda e retorno antecipado. Ao invés de 'se X, entra no bloco', vira 'se não X, sai agora'. As verificações ficam no topo em sequência, e o caminho principal — o que a função realmente faz — fica linear no final, sem recuo.
>
> O leitor agora lê de cima pra baixo: condições de saída primeiro, lógica principal depois. Carga cognitiva cai de N condições simultâneas pra zero quando chega no bloco principal."

> **P:** "Por que nesting profundo é um problema?"
>
> **R (30s):**
> "Não é estético — é cognitivo. Cada nível de indentação é uma condição que o leitor precisa manter ativa na memória de trabalho enquanto lê o código dentro. Com 4 níveis, você está rastreando 4 condições ao mesmo tempo pra entender o que aquele bloco interno faz.
>
> O cérebro humano começa a falhar em torno de 7 unidades simultâneas. Código aninhado gasta esse orçamento antes de você chegar na lógica real. O resultado prático: mais tempo de leitura, mais chance de erro de interpretação, e testes que precisam configurar N condições aninhadas pra cobrir 1 branch."

---

## Checkpoint

- [ ] Consigo definir guard clause e explicar por que reduz carga cognitiva
- [ ] Encontrei pelo menos 1 função com nesting > 3 níveis num projeto AG
- [ ] Refatorei com early returns e o código ficou linear
- [ ] `DECISIONS.md` tem o bloco registrado com os níveis antes/depois
- [ ] Recitei a resposta sobre nesting em voz alta sem consultar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Early return e guard clauses dominado`.

---

## Recursos

- Martin Fowler — [Replace Nested Conditional with Guard Clauses](https://refactoring.com/catalog/replaceNestedConditionalWithGuardClauses.html)
- Jeff Atwood — [Flattening Arrow Code](https://blog.codinghorror.com/flattening-arrow-code/) — cunhou o termo "arrow code"
- `~/.claude/CLAUDE.md` §CÓDIGO — regra automática: "Nesting > 2 níveis → Early return / guard clause"
