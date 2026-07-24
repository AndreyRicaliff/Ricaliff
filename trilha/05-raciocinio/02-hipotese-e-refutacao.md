# 02 — Hipótese e Refutação

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Debugging bem-feito é **método científico aplicado a um sistema quebrado**. O fluxo é o mesmo da ciência: sintoma observado → hipóteses ranqueadas por probabilidade → experimento que **derruba** a mais provável → rodar → cortar metade do espaço de busca → iterar. O anti-padrão tem nome — **shotgun debugging**: "sair mexendo" em várias coisas até o sintoma sumir. Às vezes o sintoma some, e é aí que mora o perigo: você não sabe o que consertou, provavelmente mascarou a causa em vez de removê-la, e mudou três coisas que vão quebrar uma quarta na semana que vem. Este módulo é o que separa "resolvi por método" de "resolvi por sorte" — e a diferença aparece na entrevista, no incidente às 3h e na tua capacidade de garantir que o bug **não volta**.

---

## § BASE — o fundamento

**O que é uma hipótese, de verdade.** Karl Popper, em *A Lógica da Pesquisa Científica* (1934), resolveu o problema da demarcação — o que separa ciência de pseudociência — com um critério único: **falseabilidade**. Uma afirmação é científica não porque pode ser confirmada, mas porque pode ser **refutada** por algum experimento concebível. "Todos os cisnes são brancos" é científica porque *um* cisne preto a mata; "o universo é regido por energia positiva" não é, porque nenhum resultado a contraria. Traduzido pra debug: **uma hipótese só vale alguma coisa se existe um teste capaz de derrubá-la.** Se nenhum resultado possível te obrigaria a abandoná-la, você não tem uma hipótese — tem uma crença, e crença não fecha bug.

**Por que refutar, e não confirmar.** Aqui está a assimetria que Popper enxergou e que é o coração do método: **confirmação é fraca, refutação é forte.** Ver a query voltar dados "confirma" mil hipóteses ao mesmo tempo e não decide entre elas. Mas ver a query voltar vazia com service_role **mata** de vez a hipótese "é RLS" — uma observação, uma hipótese eliminada. Cada refutação é definitiva; cada confirmação é provisória. É por isso que o debug eficiente **caça o teste que derruba**, não o que agrada: o teste que derruba é o único que produz informação que não volta atrás.

**Refutar corta o espaço de busca pela metade.** O bug mora em algum ponto de um espaço enorme (todo o código × todo o dado × toda a config × todo o ambiente). Cada teste bem desenhado é uma pergunta de **sim/não** que divide esse espaço — é **busca binária** aplicada à causa. Refutar "é RLS" não só elimina RLS; **promove** a próxima hipótese e reduz o resto do trabalho a metade. Andreas Zeller formalizou isso em *Why Programs Fail* como **delta debugging**: dado um diff que introduziu o bug, você bissecciona o próprio diff — aplica metade, testa, descarta a metade inocente — até isolar a mudança mínima que causa a falha. `git bisect` é essa ideia empacotada. Shotgun debugging é o oposto: não divide nada, e **destrói** a informação que a divisão produziria, porque muda várias variáveis de uma vez e você perde a leitura de qual delas importou.

**A refutação mais famosa da engenharia.** **Challenger, 1986.** A tese oficial era que os O-rings toleravam o frio da manhã do lançamento. Richard Feynman, na comissão Rogers, mergulhou um pedaço de O-ring num copo de água com gelo em rede nacional — o anel perdeu elasticidade em segundos. Um experimento de 30 segundos derrubou meses de argumento em slide. É o padrão a copiar até na estética: o **teste mais barato que decide a questão**, executado à vista de todos, sem discurso.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O trabalho tem uma ordem, e ela é ditada por duas variáveis por hipótese: **probabilidade** (quão provável é a causa) e **custo do teste** (quão rápido eu a refuto). O ranqueamento sai do cruzamento:

```
                 TESTE BARATO            TESTE CARO
ALTA PROB.    ┌────────────────────┬────────────────────┐
              │  ① TESTAR PRIMEIRO │  ③ testar em 3º    │
              ├────────────────────┼────────────────────┤
BAIXA PROB.   │  ② testar em 2º    │  ④ último recurso  │
              └────────────────────┴────────────────────┘
```

Duas perguntas alimentam a probabilidade:

1. **O que mudou por último?** A maioria dos bugs novos vem do último diff, deploy, config ou dado novo. `git log` é ferramenta de debugging, e o delta debugging do Zeller é a versão sistemática dessa intuição: o suspeito default é a mudança mais recente.
2. **Qual teste é mais barato?** Entre duas hipóteses igualmente prováveis, teste primeiro a de 30 segundos. Hipótese exótica ("bug no Postgres", "bug no compilador") vai pro fim da fila — quase sempre o bug é seu, e o teste que a refuta costuma ser caro. Feynman não começou desmontando o ônibus espacial; começou pelo copo d'água.

Dois instrumentos sustentam a disciplina ao longo de um bug longo:
- **Uma variável por vez** entre execuções. Mudou duas coisas e o sintoma sumiu? Você não sabe qual resolveu — o resultado é *ininterpretável*, e você acabou de comprar um bug futuro.
- **Diário de hipóteses** (um `DEBUG.md` rascunho). Num bug de 3 horas a memória de trabalho (7±2 itens — módulo 05) satura e você **re-testa a mesma hipótese duas vezes** sem perceber. Escrever hipótese → teste → resultado é o que impede o loop.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. OBSERVAR o sintoma com precisão.** "Não funciona" não é sintoma; "o registro id=123 não aparece no dashboard do tenant A, mas o do tenant B aparece" é. Quanto mais estreito o sintoma, menor o espaço de busca inicial.

**2. LISTAR ≥ 2 hipóteses ANTES de tocar no código.** Escrever força a considerar mais de uma causa — o antídoto contra fixar na primeira que veio (viés de confirmação, módulo 01).

**3. RANQUEAR por probabilidade × custo.** Topo da lista = provável + barato. Use "o que mudou por último?".

**4. DESENHAR o teste que REFUTA a do topo.** A pergunta-guia é literal: **"que resultado me obrigaria a abandonar essa hipótese?"** Se você não consegue responder, a hipótese não é falseável — reescreva ou descarte.

**5. RODAR, mudando uma variável só, e LER o resultado.** Refutou? Risque a hipótese, o espaço caiu pela metade, promova a próxima. Confirmou a *camada*? Refine dentro dela (qual policy, qual linha).

**6. ITERAR até a causa raiz** — anotando cada passo no diário. Parou quando a hipótese sobrevivente prevê o sintoma **e** o fix a confirma.

**Anti-padrões:**
- **Shotgun debugging:** mudar N coisas de uma vez. Destrói a interpretabilidade — mesmo que funcione, você não aprendeu nada e mascarou a causa.
- **Hipótese não-falseável:** "deve ser algo no cache". Nenhum teste a derruba porque ela não afirma nada. Reformule pra algo que um resultado possa matar.
- **Pular a camada barata:** ir refatorar a policy RLS antes de confirmar que o problema *é* RLS. Confirme a camada com o teste de 1 minuto antes de gastar uma hora dentro dela.

**Aplicado — RLS multi-tenant (caso real AG):** sintoma — um registro não aparece no dashboard de um tenant.

| # | Hipótese | Teste que refuta | Custo |
|---|---|---|---|
| 1 | RLS está filtrando a linha | MESMA query com service_role; se também não vier → refutada | 1 min |
| 2 | Filtro de período no front | Chamar a API direto (curl), sem front | 2 min |
| 3 | Dado nunca foi ingerido pelo sync | `select` por id na tabela crua | 1 min |

```bash
# Sintoma: linha id=123 sumiu para o tenant A. H1 = RLS.
# Teste que refuta: mesma query, dois papéis.
curl -s "$URL/rest/v1/pedidos?id=eq.123" \
  -H "apikey: $ANON" -H "Authorization: Bearer $JWT_TENANT_A"
curl -s "$URL/rest/v1/pedidos?id=eq.123" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE"
# [] nos dois  → H1 refutada: não é RLS, vá para ingestão (H3)
# [] só no 1º  → H1 confirmada: inspecionar as policies
#   select policyname, qual from pg_policies where tablename = 'pedidos';
```

Veio vazio nos dois papéis? **H1 morta sem você ter tocado numa policy** — o problema é ingestão, e você economizou a hora que gastaria mexendo no lugar errado. Esse é o ganho do método: refutar antes de consertar.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Pegue o próximo bug real (ou o último que você resolveu, e reconstrua honestamente):

1. Escreva o **sintoma preciso** em uma linha — o mais estreito que conseguir.
2. Liste **≥ 3 hipóteses** antes de abrir qualquer arquivo. Rode `git log --oneline -10` e deixe "o que mudou por último" enviesar a lista.
3. Para cada hipótese, escreva **o resultado que a mataria**. Descarte na hora qualquer uma pra qual você não consegue escrever isso — não é hipótese.
4. Ranqueie por probabilidade × custo e teste **só a do topo**, mudando **uma variável**.
5. Anote o resultado no `DEBUG.md` e risque as hipóteses refutadas. Repita até a causa raiz.
6. No fim, conte: quantas hipóteses o primeiro teste eliminou? (Um teste bem desenhado costuma matar mais de uma.)

## Por que cai em entrevista

"Me conta um bug difícil" é pergunta padrão em todo nível. O entrevistador **não quer o bug** — quer o processo. Quem narra sintoma → hipóteses → teste que refuta → causa mostra método replicável, transferível a qualquer stack; quem narra "fui tentando umas coisas até funcionar" mostra que a solução foi sorte e que o próximo bug vai ser sorte de novo.

> **P:** "Descreve um bug difícil que você resolveu e como."
>
> **R (30s):** "Num dashboard multi-tenant, um registro sumia para um cliente. Três hipóteses, por probabilidade: RLS filtrando, filtro do front, dado não ingerido. Desenhei o teste que refutava a primeira: a mesma query com token do tenant e com service_role. Veio vazio nos dois — então não era RLS, era ingestão. No pipeline de sync, achei a execução travada por um lock de uma rodada anterior. O ponto do processo: não mexi em nenhuma policy, porque o teste provou antes que o problema não estava lá."

> **P:** "O que você faz quando o bug some mas você não sabe por quê?"
>
> **R (30s):** "Isso me preocupa mais do que o bug aberto, porque 'sumiu' sem causa identificada quase sempre é sintoma mascarado, não causa removida — ele volta em produção no pior momento. Se sumiu depois que mudei várias coisas, eu reverto e reintroduzo uma de cada vez até isolar qual mudança importou; é delta debugging, a mesma ideia do git bisect. Sem saber a causa raiz, eu não consigo garantir que não volta nem escrever o teste de regressão que trava ele — então pra mim o bug não está fechado, está escondido."

## Checkpoint

- [ ] Sei explicar por que refutar é mais forte que confirmar (a assimetria de Popper)
- [ ] Sei explicar por que "sair mexendo" destrói informação mesmo quando o sintoma some
- [ ] No último bug, escrevi ≥ 2 hipóteses ANTES de tocar no código
- [ ] Formulo "que resultado me obrigaria a abandonar essa hipótese?" para cada uma
- [ ] Já usei o par token-do-tenant vs service_role (ou equivalente) para isolar camada
- [ ] Mudei uma variável por vez no último debugging e anotei os resultados

## Recursos

- *A Lógica da Pesquisa Científica* — Karl Popper (1934): o critério de falseabilidade e a assimetria confirmação/refutação
- *Why Programs Fail* — Andreas Zeller: delta debugging e busca sistemática da causa (a teoria por trás do `git bisect`)
- *Debugging: The 9 Indispensable Rules* — David J. Agans: "Divide and Conquer" e "Change One Thing at a Time"
- Relatório da Comissão Rogers (Challenger, 1986) — Apêndice F, escrito por Feynman (o experimento do O-ring)
- Módulo-irmão `01-verificar-antes-de-afirmar` — como provar que o fix da hipótese sobrevivente realmente fecha o bug
