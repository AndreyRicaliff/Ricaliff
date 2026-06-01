# 03 — Nomes vs Comentários

## O que é

**Nome bom mata comentário.** Um comentário que descreve o quê o código faz é uma confissão de que o nome ou a estrutura falhou. O código já diz o quê — se você precisar de uma linha extra pra explicar, o problema está no nome, não na ausência de comentário.

```ts
// Ruim: comentário explicando O QUÊ — o nome deveria fazer isso
// calculate the user's remaining credit
const x = user.creditLimit - user.totalSpent

// Bom: nome elimina o comentário
const remainingCredit = user.creditLimit - user.totalSpent
```

**Nomes ruins clássicos e o que usar no lugar:**

| Nome ruim | Por que é ruim | Alternativa |
|---|---|---|
| `data` | O que são esses dados? | `employeeRecords`, `rawApiResponse`, `parsedPayload` |
| `handle` | Handle o quê? | `onPaymentConfirmed`, `handleSessionTimeout` |
| `process` | Processar como? | `validateAndPersistEmployee`, depois extrair em 2 funções |
| `manager` | Gerencia o quê? | `SessionRegistry`, `QueueCoordinator` |
| `temp` | Temporário pra quê? | `pendingUploads`, `filteredRows` — nomear pelo propósito |
| `item` em loop | Qual item? | `employee`, `recording`, `transaction` |
| `flag` / `bool` | O que significa true? | `isPaymentPending`, `hasValidSession` |
| `res` / `resp` | Qual response? | `createEmployeeResponse`, ou `employee` se é o que você realmente tem |

**Regras de formação:**
- **Variável:** substantivo ou adjetivo+substantivo (`pendingOrders`, `activeSessionCount`)
- **Função:** verbo+objeto (`fetchUserById`, `validatePaymentData`, `markOrderAsPaid`)
- **Booleano:** `is`, `has`, `can`, `should` como prefixo (`isActive`, `hasPermission`)
- **Evitar abreviações** salvo convenção universal (`id`, `url`, `db`, `ctx`) — `mgr` não é convenção, é preguiça
- **Evitar numeral** no nome (`handler2`, `newData`) — se precisou de 2, a 1ª tem nome errado

**Quando comentário é necessário:**

```ts
// 1. Por que não óbvio — decisão técnica com trade-off que não aparece no código
// Bull não suporta prioridade dinâmica após enqueue — removemos e re-adicionamos
// com nova prioridade em vez de atualizar. Aceita duplicata por ~200ms (janela de race).
await queue.remove(jobId)
await queue.add(jobData, { priority: newPriority })

// 2. Workaround de bug externo com referência
// Puppeteer 21.x vaza memória em páginas com Shadow DOM se não fechar o frame explicitamente.
// Remover quando upgradar para 22+. Issue: https://github.com/puppeteer/puppeteer/issues/XXXXX
await frame.detach()
await page.close()

// 3. Restrição externa não mapeável em código
// A API do ERP-externo rejeita requests com mais de 50 itens por lote — limite não documentado,
// descoberto empiricamente. Não alterar o BATCH_SIZE sem testar.
const BATCH_SIZE = 50
```

O que **não** é motivo pra comentar:
- O quê o código faz (renomear)
- Que uma variável existe (redundante)
- Código comentado ("pra não perder") — use git

---

## Por que cai em entrevista

É um filtro de senioridade disfarçado de pergunta simples. "Você comenta seu código?" parece trivial mas a resposta revela se você pensa em quem vai ler o código depois. Respostas erradas comuns:

- "Sim, comento tudo pra ficar documentado" — sinal de que usa comentário como muleta
- "Não, código bom se explica" — sinal de que nunca teve um workaround de bug legítimo
- A resposta certa é matizada: **depende do tipo de comentário**

Variações da pergunta:
- "Me explica como você nomearia essas variáveis num code review"
- "Esse código tem algum problema?" (mostram código com `data`, `temp`, `handle`)
- "Quando você deletaria um comentário existente?"

---

## Trade-offs

| Situação | Ação | Motivo |
|---|---|---|
| Comentário descreve O QUÊ | Deletar + renomear | O nome deveria fazer isso |
| Comentário explica POR QUÊ não óbvio | Manter | Contexto que não cabe no código |
| Comentário de workaround | Manter + link pra issue | Sem ele, alguém vai "limpar" o código e quebrar |
| Nome longo (>30 chars) | Aceitar se preciso | Legibilidade vale mais que brevidade |
| Nome curto ambíguo | Nunca sacrificar clareza por brevidade | `uid` vs `userId` — use `userId` |
| Código comentado no PR | Deletar — tem no git | Polui leitura, nunca vai ser descomentado |
| TODO sem data/contexto | Converter em issue ou deletar | TODO eternos viram lixo invisível |

---

## Exercício aplicado (projeto AG real)

### Passo a passo

1. **Listar comentários do PULSAR-RH:**
   ```bash
   grep -rn "// " /home/ricalfiff/projetos/PULSAR-RH/src \
     --include="*.ts" --include="*.js" \
     | grep -v "eslint\|prettier\|@ts-\|TODO\|FIXME\|http" \
     | head -40
   ```

2. **Para cada comentário encontrado, classificar:**
   - Descreve O QUÊ o código faz → **deletar + renomear** variável/função
   - Explica POR QUÊ uma decisão foi tomada → **manter**
   - Documenta workaround de bug/limitação externa → **manter + adicionar referência se não tiver**
   - É código comentado → **deletar**
   - É TODO sem contexto → **converter em issue ou deletar**

3. **Para os que serão deletados:** renomear a variável ou função que gerou a necessidade do comentário.

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [refactor] remover comentários redundantes em src/

   **Problema:** N comentários descreviam O QUÊ o código faz em vez de POR QUÊ.
   Isso indica nomes fracos que precisam de muleta textual.
   **Ação:** deletei X comentários, renomeei Y variáveis/funções.
   Mantive Z comentários de workaround/decisão técnica com contexto adicionado.
   **Por quê:** comentário que descreve o quê fica desatualizado quando o código muda
   — e costuma não ser atualizado. Nome que descreve não fica desatualizado: é o código.
   **Como explicar em entrevista (30s):**
   > "Comentário que explica O QUÊ é muleta de nome fraco — eu renomeio e deleto o comentário.
   > O único comentário que mantenho explica POR QUÊ: uma decisão técnica com trade-off,
   > um workaround de bug externo, ou uma restrição que não aparece no código. Esses têm valor.
   > Os outros ficam desatualizados e enganam."
   ```
5. **Commit:** `refactor: replace what-comments with descriptive names in <módulo>`

---

## Pergunta de entrevista esperada + resposta exemplar

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

---

## Checkpoint

- [ ] Consigo distinguir comentário de O QUÊ vs POR QUÊ sem hesitar
- [ ] Rodar o grep no PULSAR-RH e classificar pelo menos 10 comentários encontrados
- [ ] Renomear pelo menos 3 variáveis/funções que tinham comentário descrevendo O QUÊ
- [ ] `DECISIONS.md` tem o bloco com a justificativa da triagem de comentários
- [ ] Recitei a resposta "você comenta?" em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Nomes vs comentários dominado`.

---

## Recursos

- Robert C. Martin — *Clean Code*, cap. 2 (Meaningful Names) e cap. 4 (Comments)
- Martin Fowler — [Rename Variable](https://refactoring.com/catalog/renameVariable.html) e [Rename Function](https://refactoring.com/catalog/changeFunctionDeclaration.html)
- `~/.claude/CLAUDE.md` §CÓDIGO — "Comentário explicando O QUÊ → Deletar — nome deve explicar"
