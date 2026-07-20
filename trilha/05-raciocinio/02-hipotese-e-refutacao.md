# 02 — Hipótese e Refutação

## O que é

Debugging científico é aplicar o critério de Popper ao bug: uma hipótese só vale alguma coisa se existe um teste capaz de **refutá-la**. O fluxo: sintoma observado → hipóteses ranqueadas por probabilidade → desenhar o experimento que derruba a mais provável → rodar → cortar metade do espaço de busca → iterar. O anti-padrão tem nome: **shotgun debugging** — "sair mexendo" em várias coisas até o sintoma sumir. Às vezes "funciona", mas você não sabe o que consertou, provavelmente mascarou a causa, e mudou três coisas que quebram outra coisa depois.

A refutação mais famosa da engenharia: **Challenger (1986)**. A tese oficial era que os O-rings toleravam frio. Richard Feynman, na comissão de investigação, mergulhou um O-ring num copo de água com gelo em rede nacional — o anel perdeu elasticidade em segundos. Um experimento de 30 segundos derrubou meses de argumento em slide. É o padrão a copiar: o teste mais barato que decide a questão.

### Ranquear hipóteses

Duas perguntas ordenam a lista:

1. **O que mudou por último?** A maioria dos bugs novos vem do último diff, deploy, config ou dado novo — `git log` é ferramenta de debugging.
2. **Qual teste é mais barato?** Entre duas hipóteses igualmente prováveis, teste primeiro a de 30 segundos.

Probabilidade alta + teste barato = topo da lista. Hipótese exótica ("bug no Postgres") vai pro fim: quase sempre o bug é seu.

### Desenhar o teste que refuta

Pergunta-guia: **"que resultado me obrigaria a abandonar essa hipótese?"** Se nenhum resultado a derruba, não é hipótese — é crença.

Caso real AG (RLS multi-tenant): sintoma — um registro não aparece no dashboard de um tenant.

| # | Hipótese | Teste que refuta | Custo |
|---|---|---|---|
| 1 | RLS está filtrando a linha | MESMA query com service_role; se também não vier → refutada | 1 min |
| 2 | Filtro de período no front | Chamar a API direto (curl), sem front | 2 min |
| 3 | Dado nunca foi ingerido pelo sync | `select` por id na tabela crua | 1 min |

A linha veio com service_role? H1 confirmada como camada do problema — agora refine: qual policy. Não veio? H1 morta, promova H3 — e você aprendeu que o problema é ingestão, não permissão, **sem ter mexido em nada**.

### Passo a passo executável

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

Duas regras de disciplina: **uma variável por vez** entre execuções (senão o resultado não é interpretável) e **diário de hipóteses** — num bug de 3 horas a memória trai e você re-testa a mesma hipótese duas vezes; um `DEBUG.md` rascunho resolve.

## Por que cai em entrevista

"Me conta um bug difícil" é pergunta padrão em todo nível. O entrevistador não quer o bug — quer o processo. Quem narra sintoma → hipóteses → teste → causa mostra método replicável; quem narra "fui tentando umas coisas até funcionar" mostra que a solução foi sorte.

> **P:** "Descreve um bug difícil que você resolveu e como."
>
> **R (30s):** "Num dashboard multi-tenant, um registro sumia para um cliente. Três hipóteses, por probabilidade: RLS filtrando, filtro do front, dado não ingerido. Desenhei o teste que refutava a primeira: a mesma query com token do tenant e com service_role. Veio vazio nos dois — então não era RLS, era ingestão. No pipeline de sync, achei a execução travada por um lock de uma rodada anterior. O ponto do processo: não mexi em nenhuma policy, porque o teste provou antes que o problema não estava lá."

## Checkpoint

- [ ] Sei explicar por que "sair mexendo" destrói informação mesmo quando o sintoma some
- [ ] No último bug, escrevi ≥ 2 hipóteses ANTES de tocar no código
- [ ] Formulo "que resultado me obrigaria a abandonar essa hipótese?" para cada uma
- [ ] Já usei o par token-do-tenant vs service_role (ou equivalente) para isolar camada
- [ ] Mudei uma variável por vez no último debugging e anotei os resultados

## Recursos

- Why Programs Fail — Andreas Zeller (debugging sistemático, delta debugging)
- Debugging: The 9 Indispensable Rules — David J. Agans
- [wizardzines.com](https://wizardzines.com/) — "The Pocket Guide to Debugging" (Julia Evans)
- Relatório da Comissão Rogers (Challenger, 1986) — apêndice F, escrito por Feynman
