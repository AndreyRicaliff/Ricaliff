# 04 — Espaçamento e Grid

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Espaçamento é o sistema nervoso invisível da interface: ninguém elogia, mas todo mundo sente quando falha. Três princípios resolvem: **escala fixa**, **espaço como agrupamento** e **alinhamento como cola**. O mais importante deles — *espaço agrupa* — não é convenção: é uma lei de percepção medida há um século. Este módulo é a aplicação direta da Gestalt do módulo 01 à dimensão do espaço em branco.

## § BASE — o fundamento

**A lei que faz o espaço "agrupar": proximidade (Wertheimer, 1923).** A **lei da proximidade** de Max Wertheimer (*Untersuchungen zur Lehre von der Gestalt II*, 1923) é o achado central: **elementos próximos são percebidos como um grupo**, automaticamente, antes de qualquer leitura. O olho lê *distância* como *relação*. Isto tem uma consequência de engenharia enorme e contraintuitiva: você não precisa de bordas, caixas ou linhas divisórias para agrupar — precisa de **espaço**. Um label a 4px do seu input e a 24px do campo seguinte é lido como "esse label pertence a esse input" sem nenhum pixel de borda. A regra de ouro que compacta a lei: **espaço DENTRO de um grupo < espaço ENTRE grupos, sempre**. Quando você quebra isso — mesmo espaço dentro e entre — a Gestalt não consegue formar grupos e a tela vira uma grade indistinta.

**Além da proximidade: região comum (Palmer, 1992).** Stephen Palmer, em *Common region: A new principle of perceptual grouping* (Cognitive Psychology, 1992), estendeu a Gestalt: **elementos dentro de uma mesma região delimitada agrupam, mesmo que distantes** — é a base científica do *card*. Um fundo sutil ou uma borda cria "região comum" e sobrepõe a proximidade. Palmer & Rock (1994) acrescentaram a *uniform connectedness* (elementos visualmente conectados agrupam). A lição prática: **borda e fundo são ferramentas de agrupamento, não de decoração** — e são *mais fortes* que o espaço, então use com parcimônia. A vontade de pôr borda e divisor em tudo costuma ser sintoma: borda virou band-aid de um espaço mal resolvido que sozinho já agruparia.

**Alinhamento como cola (continuidade e destino comum).** Que o olho una elementos alinhados numa "linha" mental é a lei da **boa continuação** de Gestalt: bordas que compartilham um eixo são percebidas como pertencentes. Por isso um elemento desalinhado em 3px rebaixa a percepção de qualidade da tela inteira — ele quebra uma linha implícita que o cérebro estava traçando, e o cérebro *sente* a quebra mesmo sem saber apontá-la. O `squint test` (módulo 01) pega: linhas que deveriam ser uma viram duas no borrão.

**O que é convenção, e não lei: a escala 4/8.** Todo espaçamento múltiplo de 4px (na prática, a sub-escala de 8: 8, 16, 24, 32, 48, 64) é **convenção de praticante**, não resultado experimental — **declare**. Ela não "lê melhor" por percepção; o ganho é de **decisão** e **consistência**: elimina o debate "13 ou 14px?" (só existe o degrau) e garante que elementos vizinhos batam matematicamente. O Tailwind já *é* isso (unidade 0.25rem = 4px; `p-4` = 16px). É o mesmo tipo de ganho da escala tipográfica (módulo 02) e do design system (módulo 07): reduzir micro-decisões. Um valor fora da escala (`p-[13px]`) não é "erro" automático — é uma **afirmação sem justificativa**: exija o porquê ou normalize.

**Densidade é decisão de tarefa, não de gosto.** Não existe espaçamento "certo" universal — existe adequado à tarefa, e isso conecta com carga cognitiva (Miller/Cowan, módulo 01) e velocidade de decisão (Hick-Hyman, módulo 07). Dashboard de operação (padrão dos painéis comerciais AG): **denso** — padding compacto, fonte 13–14px em tabela, mais dados por viewport, porque o usuário volta todo dia e quer *comparar números lado a lado* (proximidade ajuda a comparação). Landing/deck: **generoso** — whitespace largo isola UM foco (figura/fundo forte), porque o visitante passa 30 segundos. Copiar densidade de landing num dashboard produz scroll infinito; copiar densidade de dashboard numa landing produz pânico visual.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A hierarquia de força para agrupar (da mais sutil à mais forte) — use sempre a mais fraca que resolve:

```
FORÇA DE AGRUPAMENTO         MECANISMO GESTALT        CUSTO VISUAL
──────────────────────────────────────────────────────────────────
1. espaço (proximidade)      proximidade (Wertheimer) nenhum ← preferir
2. alinhamento               boa continuação          nenhum
3. fundo sutil               região comum (Palmer)    baixo
4. borda / divisor           uniform connectedness    alto ← só se 1–3 falham
```

A regra "dentro < entre" aplicada a um formulário:

```
  Label                    ← 4px  (DENTRO: label pertence ao input)
  ┌─────────────────────┐
  │ input               │
  └─────────────────────┘
                           ← 24px (ENTRE: separa do próximo campo)
  Label
  ┌─────────────────────┐
  │ input               │
  └─────────────────────┘
      4 < 24  → a Gestalt forma dois grupos SEM nenhuma borda
```

Ritmo vertical (a progressão comunica a árvore do layout): interno do card `gap 16` < entre cards `24` < entre seções `48`. Dependências: a base Gestalt vem do **módulo 01**; a escala como sistema de tokens é do **módulo 07**; a densidade conversa com o **módulo 05** (estado cheio) e é auditada na crítica (**módulo 08**, eixo "respiro").

## § METODOLOGIA — o passo-a-passo replicável

**1. COMECE com espaço demais e tire.** É mais fácil apertar do que descobrir que faltava respiro (heurística do *Refactoring UI*, declarada). O default do iniciante é apertado.

**2. AGRUPE por espaço antes de qualquer borda.** Aplique "dentro < entre". Só suba para fundo (região comum) ou borda se a proximidade sozinha não resolver.

**3. USE só degraus da escala** (4/8/16/24/32/48/64). Valor arbitrário exige justificativa comentada ou vira degrau mais próximo.

**4. ALINHE tudo com algum outro elemento:** borda esquerda do título com a do conteúdo, números pela direita, ícones pela linha de base do texto.

**5. CALIBRE a densidade pela tarefa:** denso para operação/comparação, generoso para foco único/apresentação. Decisão argumentada, não copiada.

**6. VERIFIQUE com evidência:** overlay de grid de 8px + `squint test`. O que não senta na linha aparece.

**Anti-padrões:**
- **Borda em tudo:** band-aid de espaço mal resolvido; a proximidade sozinha já agruparia.
- **Espaço uniforme (dentro = entre):** a Gestalt não forma grupos; a tela vira grade indistinta.
- **Valor arbitrário às cegas:** `p-[13px]` sem porquê — mas trocar *sem checar* também erra (pode quebrar alinhamento intencional com um asset).
- **Densidade copiada:** landing densa (pânico) ou dashboard esparso (scroll infinito).

### Passo a passo aplicado: auditoria de escala num projeto AG (faça agora, ~25min)

```bash
# 1. Caçar valores arbitrários fora da escala (Tailwind)
rg -n "\-\[\d+px\]" src/ --glob "*.tsx"
# saída típica: p-[13px], mt-[7px], gap-[18px] — cada um é um suspeito

# 2. Para cada achado, perguntar ANTES de trocar:
#    por que 13 e não 12/16? Se ninguém sabe → degrau mais próximo.
#    Se há motivo real (alinhar com asset de 26px) → comentar o porquê.

# 3. Caçar margens verticais inconsistentes entre seções
rg -n "space-y-|gap-" src/components/ --glob "*.tsx" | sort
# hipótese a validar: seções irmãs usam o MESMO degrau?
```

```text
Verificação visual (evidência): overlay de grid de 8px por cima
da tela (extensão de browser ou um div com background repetindo
linhas a cada 8px). O que não senta na linha, aparece na hora.
```

O raciocínio: `p-[13px]` não é "erro" automático — é uma **afirmação sem justificativa**. Exija o porquê ou normalize; trocar às cegas também erra, pode quebrar alinhamento intencional com um asset (método do módulo 05).

## Por que cai em entrevista

Espaçamento é o teste de "olho treinado" mais barato que existe: o entrevistador mostra duas versões da mesma tela e pergunta qual é melhor e por quê. Quem responde "a segunda respira melhor" sem vocabulário reprova; quem fala escala de 8, proximidade de Gestalt e densidade por contexto mostra sistema — e sistema é o que separa pleno de júnior. Saber que "espaço agrupa" é uma **lei de percepção** (não um truque) é o que dá autoridade à resposta.

> **P:** "Como você decide os espaçamentos de uma tela? É no olho?"
>
> **R (30s):**
> "Não — escala fixa de múltiplos de 4, na prática degraus de 8: 8, 16, 24, 32, 48. O Tailwind já embute isso, então valor arbitrário tipo `p-[13px]` é red flag que eu audito com grep. A regra que mais uso é de Gestalt: espaço dentro de um grupo sempre menor que espaço entre grupos — resolve formulário e card sem precisar de borda. E densidade é decisão de contexto: dashboard que fiz pra operação é denso de propósito, o usuário compara números todo dia; landing é generosa porque o visitante precisa de um foco só."

> **P:** "Por que você evita colocar borda em tudo pra separar as coisas?"
>
> **R (30s):**
> "Porque separar é trabalho do espaço, não da borda — e isso é Gestalt, não preferência. A lei da proximidade do Wertheimer diz que o olho já lê elementos próximos como um grupo, então espaço 'dentro menor que entre' agrupa sozinho, sem nenhum pixel de borda. Borda e fundo são a lei da região comum, do Palmer — são mais fortes que o espaço, então eu guardo pra quando a proximidade não basta, tipo um card que precisa se destacar do fundo. Quando vejo borda em tudo, geralmente é sintoma de espaçamento mal resolvido: a pessoa tapou com linha um agrupamento que o espaço já daria. Menos tinta, mesma clareza — no espírito do data-ink do Tufte."

## Checkpoint

- [ ] Sei recitar a escala prática (4/8/16/24/32/48/64) e que ela é convenção, não lei perceptual
- [ ] Sei explicar a lei da proximidade (Wertheimer) e por que "dentro < entre" agrupa sem borda
- [ ] Sei diferenciar proximidade de região comum (Palmer) e quando usar fundo/borda em vez de espaço
- [ ] Apliquei "dentro < entre" num formulário e removi bordas que viraram redundantes
- [ ] Rodei o grep de valores arbitrários num projeto e tratei cada achado (normalizar ou justificar)
- [ ] Consigo defender densidades diferentes pra dashboard vs landing com argumento de tarefa

## Recursos

- *Untersuchungen zur Lehre von der Gestalt II* — Max Wertheimer (1923): a lei da proximidade (espaço agrupa) — a base do módulo
- *Common region: A new principle of perceptual grouping* — Stephen Palmer (Cognitive Psychology, 1992): a ciência do card (região comum); com Palmer & Rock (1994) sobre uniform connectedness
- *The Principle of Proximity* — NN/g: a proximidade de Gestalt aplicada a UI (divulgação empírica)
- *Refactoring UI* — Wathan & Schoger, cap. "Layout and Spacing": "comece com espaço demais", escala de espaçamento — heurística de praticante
- Tailwind CSS docs, seção *Spacing*: a escala 4/8 como implementação de referência
- Material Design 3, seção *Layout*: grid, densidade e breakpoints documentados com critério
