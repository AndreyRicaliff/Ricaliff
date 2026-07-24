# 02 — Early Return e Guard Clauses

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento, com as fontes na mesa),
> §ESTRUTURAÇÃO (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão-ouro de `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

**Guard clause** é uma condição no topo da função que **sai imediatamente** (return/throw) se um pré-requisito falhar. Inverte a lógica: em vez de "se tudo estiver OK, faça X" (que enterra o caminho feliz sob camadas de `if`), você faz "se não estiver OK, saia agora" e o caminho feliz fica linear, sem recuo. Este módulo existe porque nesting profundo é o defeito de legibilidade mais comum em código legado — e porque saber achatá-lo **e** saber quando o aninhamento era legítimo separa quem decora regra de quem entende carga cognitiva.

---

## § BASE — o fundamento

**Nesting custa memória de trabalho, não estética.** Cada nível de indentação é uma condição que o leitor precisa manter **ativa** enquanto lê o bloco interno. Com 4 níveis, você rastreia 4 condições simultâneas só pra saber o que aquele bloco executa. Isso bate direto no teto da memória de trabalho — 7±2 chunks (Miller, *The Magical Number Seven*, Psychological Review, 1956), refinado para **~4** por Cowan (*The Magical Number 4 in Short-Term Memory*, BBS, 2001). Steve McConnell, em *Code Complete* 2ª ed (2004), cap. 19 "General Control Issues", transforma isso em regra operacional: **nesting ≤ 3 níveis** — ele reporta (citando trabalhos como os de Yourdon) que a compreensão degrada de forma marcada além disso. O guard clause não é "código bonito": é reduzir o número de condições vivas de N para zero quando o leitor chega no corpo principal.

**A origem da disciplina — programação estruturada (1966–1968).** O incômodo com fluxo de controle que excede a capacidade de raciocínio do leitor não nasceu em blog. Corrado Böhm e Giuseppe Jacopini, em *Flow Diagrams, Turing Machines and Languages with Only Two Formation Rules* (CACM, 1966), provaram que **qualquer programa** pode ser escrito com apenas três estruturas: sequência, seleção e iteração — sem `goto`. Edsger Dijkstra popularizou a consequência prática em *Go To Statement Considered Harmful* (CACM, 1968): controle de fluxo irrestrito produz programas que a mente humana não consegue seguir. Guard clauses são um filho direto disso — trocam o labirinto de `if/else` aninhado por uma sequência linear de decisões.

**O mito do "single return" — leia com cuidado.** Daqui saiu um dogma equivocado: "toda função deve ter um único ponto de saída" (single-entry-single-exit, SESE). Muita gente atribui isso à programação estruturada — **errado**. Böhm-Jacopini é um teorema de *expressividade* (o que é possível expressar), não um mandato de estilo sobre quantos `return` você escreve. O SESE fazia sentido em linguagens **sem gerenciamento automático de recursos** (C, assembly): um único ponto de saída garantia que o `free`/`close`/`unlock` de limpeza rodasse — é a origem do padrão `goto cleanup;` no kernel Linux. Em linguagens com `try/finally`, `defer`, RAII ou GC, essa justificativa **evapora**, e o early return vence em legibilidade. O debate é real e a resposta é contextual: **early return em código com limpeza automática; cuidado (ou `try/finally`) quando há recurso a liberar manualmente.**

**A medida formal — McCabe (1976).** Thomas McCabe, em *A Complexity Measure* (IEEE TSE, 1976), definiu a **complexidade ciclomática** `v(G) = E − N + 2P` (arestas − nós + 2×componentes do grafo de fluxo) — o número de caminhos independentes por uma função, que é também o piso de casos de teste para cobrir todos os ramos. Cada `if` aninhado multiplica caminhos; achatar com guard clauses **não reduz** a complexidade ciclomática (o número de decisões é o mesmo), mas reduz a **complexidade essencial** (a parte "emaranhada", não-estruturada) e a carga de leitura. Rigor obrigatório: a correlação de `v(G)` com densidade de defeitos é **confundida com o tamanho** (LOC) — a crítica de Shepperd (*A critique of cyclomatic complexity as a software metric*, 1988) mostra que boa parte do poder preditivo de McCabe é só LOC disfarçado. Ou seja: use `v(G)` como *cheiro* e teto de teste, não como verdade sobre bugs.

**O padrão fail-fast e a refatoração nomeada.** Validar pré-condições na entrada (**fail-fast**) faz o erro aparecer perto da causa: você não chega na linha 80 pra descobrir que o input da linha 1 era inválido. Martin Fowler catalogou o movimento com nome próprio em *Refactoring* 2ª ed (2018): **Replace Nested Conditional with Guard Clauses** e **Decompose Conditional**. É vocabulário de code review — quando você diz "aqui cabe um guard clause", está citando um refactor com receita, não um gosto pessoal.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A inversão que o guard clause faz, vista de lado:

```
   ARROW CODE (pirâmide)            GUARD CLAUSES (linear)
   if (a) {                         if (!a) throw ...   ─┐
     if (b) {                       if (!b) throw ...    │ pré-condições
       if (c) {                     if (!c) throw ...   ─┘ no topo
         faça()   ← caminho feliz   faça()  ← caminho feliz, recuo zero
       } else erro3                 return
     } else erro2
   } else erro1
   condições vivas ao chegar        condições vivas ao chegar
   no corpo: 3                      no corpo: 0
```

Nem todo aninhamento é dívida. A matriz de decisão:

| Cenário | Ação | Motivo |
|---|---|---|
| Nesting > 2 níveis por pré-condições | Guard clause no topo (fail-fast) | Zera condições vivas no corpo |
| Várias condições de saída | Early return explícito por condição | Melhor que uma flag `isValid` acumulada |
| Dados **genuinamente** hierárquicos (árvore/DOM) | Aceitar 2 níveis; extrair o interno | Nesting reflete a estrutura real do dado |
| Early return com recurso a liberar à mão | `try/finally` (ou `defer`/`using`) | Saída antecipada pode vazar recurso |
| Guard clause deixaria o código maior | Aceitar se a carga cognitiva cai | Linhas a mais valem se reduzem condições vivas |
| Revisor exige "single return" em linguagem com GC | Recusar com fundamento | SESE é para limpeza manual, não dogma universal |

**Dependências:** apoia-se em `05-raciocinio` (memória de trabalho) e conversa com `01-srp` (se o corpo linear ainda é longo, o problema virou SRP — extraia).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LOCALIZAR o afunilamento.** Ache blocos que "afunilam" em pirâmide; cada 4 espaços de indentação ≈ 1 nível. 12+ espaços de recuo num `if` já é candidato.

**2. IDENTIFICAR as condições de guarda.** Liste cada `if` que protege o bloco principal. Cada um é um guard clause em potencial.

**3. INVERTER e subir cada guarda.** `if (X) { ...corpo... }` vira `if (!X) return/throw`. Coloque a saída imediatamente. Repita até o corpo principal ficar **linear** no fim.

**4. DECIDIR sobre limpeza.** Há recurso aberto antes do ponto de saída (arquivo, conexão, lock)? Se sim e a linguagem não libera sozinha, envolva em `try/finally` antes de espalhar os returns.

**5. SE o corpo linear ainda for longo,** o problema deixou de ser nesting e virou SRP — extraia (módulo 01).

**Anti-padrões:**
- **Flag booleana acumulada:** `let isValid = true; if (...) isValid = false; ...` no lugar de sair na hora. Adia a saída e recria o labirinto.
- **Guard clause que esconde efeito colateral:** sair no meio depois de já ter mutado estado/aberto recurso, sem `finally`. Vaza.
- **Achatar dado hierárquico legítimo:** forçar guard clause onde o aninhamento *era* a estrutura da árvore. Piora.

**Aplicado — cobrança de pedido (arrow code real):**

```ts
// Antes: o caminho feliz enterrado sob 4 níveis
async function processPayment(order: Order | null, user: User | null) {
  if (order) {
    if (user) {
      if (order.status === 'pending') {
        if (user.hasPaymentMethod) {
          const result = await chargeCard(user.paymentMethod, order.total)
          if (result.success) { await updateOrderStatus(order.id, 'paid'); return result }
          else throw new Error('charge failed')
        } else throw new Error('no payment method')
      } else throw new Error('order not pending')
    } else throw new Error('user not found')
  } else throw new Error('order not found')
}

// Depois: guard clauses no topo, caminho feliz linear (recuo zero)
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

Condições vivas ao chegar em `chargeCard`: no "antes", quatro; no "depois", zero. `v(G)` é a mesma — mas a complexidade essencial e o custo de leitura despencaram.

---

## Passo-a-passo aplicado (faça agora, ~35min)

Meet Hub (produto próprio) tem lógica de bot com várias checagens (sessão ativa, slot livre, puppeteer inicializado); PULSAR-RH tem handlers de validação. Terreno real.

1. **Achar nesting profundo** (recuo ≥ 12 espaços):
   ```bash
   rg -n "^\s{12,}(if|for|while)\b" \
     "C:/Projetos/PULSAR-RH/src" "C:/Projetos/meet-hub/src" -g "*.ts" | head -20
   ```
   Ou abra um handler grande e procure a pirâmide visual.

2. **Listar as guardas** de UMA função (Metodologia passo 2).

3. **Refatorar com early returns** (passos 3–4), decidindo sobre `try/finally` se houver recurso aberto. Rode os testes; preserve o comportamento.

4. **Registrar em `DECISIONS.md`:**
   ```markdown
   ## 2026-07-XX — [refactor] achatar nesting em <nome-da-função>
   **Problema:** <N> níveis de aninhamento; leitor rastreava <X> condições simultâneas.
   **Decisão:** guard clauses no topo (fail-fast); caminho feliz linear nas últimas <Y> linhas.
   **Por quê:** carga cognitiva de nesting > 2 (memória de trabalho ~4 chunks) causa erro de
   leitura; achatar reduz complexidade essencial (não a ciclomática).
   **Consequências:** cada condição de saída agora é legível isolada; teste por ramo mais direto.
   **Em entrevista (30s):** "invertí cada pré-condição num guard clause — de 4 condições vivas
   pra zero no corpo. Onde havia recurso aberto, usei try/finally; SESE não se aplica com GC."
   ```

5. **Commit:** `refactor: flatten nested conditionals in <nome-da-função> with guard clauses`

---

## Por que cai em entrevista

Nesting profundo aparece em todo legado; ler, explicar e simplificar ao vivo é filtro real. E quem sabe o nuance do "single return" mostra que entende a *origem* da regra, não só a regra. Variações: "explica esse código aninhado e simplifica", "por que nesting é ruim?", "o que é fail-fast?", "single return, você concorda?".

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

> **P:** "Um revisor exige um único `return` por função ('single exit'). Você concorda?"
>
> **R (30s):**
> "Depende da linguagem, e a regra costuma ser mal-atribuída. O 'single exit' não vem do teorema da programação estruturada — Böhm-Jacopini fala sobre o que é *expressável* com sequência, seleção e iteração, não sobre quantos returns escrever. A regra fazia sentido em C, onde um único ponto de saída garantia que o `free`/`close` de limpeza rodasse — é a origem do `goto cleanup`.
>
> Em TypeScript ou Java, com `try/finally` e garbage collector, essa justificativa some, e múltiplos early returns são mais legíveis: as pré-condições saem no topo e o caminho feliz fica linear. Então eu concordo com single exit onde há recurso pra liberar à mão; fora disso, prefiro guard clauses e uso `try/finally` se precisar garantir limpeza."

---

## Checkpoint

- [ ] Defino guard clause e explico por que reduz condições vivas na memória de trabalho
- [ ] Sei situar a origem (Dijkstra/Böhm-Jacopini) e desmontar o mito do "single return"
- [ ] Sei o que é complexidade ciclomática (McCabe 1976) e por que achatar não a reduz
- [ ] Achei ≥ 1 função com nesting > 3 níveis num projeto AG e a refatorei linear
- [ ] Decidi corretamente sobre `try/finally` quando havia recurso aberto antes da saída
- [ ] `DECISIONS.md` tem o bloco com níveis antes/depois

## Recursos

- **Martin Fowler — *Refactoring* 2ª ed (2018):** refatorações "Replace Nested Conditional with Guard Clauses" e "Decompose Conditional" (receita nomeada)
- **Edsger Dijkstra — *Go To Statement Considered Harmful* (CACM, 1968)** e **Böhm & Jacopini (CACM, 1966):** a origem da programação estruturada — e por que o "single return" é uma má leitura dela
- **Thomas McCabe — *A Complexity Measure* (IEEE TSE, 1976):** complexidade ciclomática `v(G)=E−N+2P` · com a crítica de **Shepperd (1988)** de que ela é confundida com LOC
- **Steve McConnell — *Code Complete* 2ª ed (2004), cap. 19:** nesting ≤ 3 níveis e o custo de comprometer o caminho de leitura
- **Miller (1956) e Cowan (2001):** o teto da memória de trabalho — cada nível de nesting consome um chunk
- Módulo-irmão `01-srp-funcoes-curtas` — quando o corpo linear ainda é longo, o problema virou SRP
