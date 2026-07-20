# 06 — Fluxo Solo com IA

## O que é

Dev solo com IA não tem scrum master, code reviewer nem colega de baia — e por isso precisa de MAIS processo, não menos: o processo é o que substitui o par que te puxaria de volta. Três mecanismos:

**Kanban pessoal + WIP limit 2** (Jim Benson, *Personal Kanban*): três colunas (a fazer / fazendo / feito) e a regra que importa: **no máximo 2 itens em "fazendo"**. A base teórica é a Lei de Little: tempo de ciclo = itens em progresso ÷ vazão. Com vazão constante, cada item a mais em andamento ATRASA todos os outros — multitarefa não acelera, só espalha o atraso e cobra imposto de troca de contexto (estudos de interrupção mostram ~20 min para reimergir num problema profundo). WIP 2 e não 1 porque sempre existe um item bloqueado esperando (deploy, resposta de cliente); o segundo slot absorve a espera sem abrir a porteira.

**Sessão com IA como sprint de objetivo único.** A sessão herda os ritos do sprint: *planning* (definir UM objetivo verificável antes de abrir: "fix do total divergente, com evidência de query batendo" — não "mexer no dashboard"), *timebox* (objetivo atingido = sessão encerra; descoberta nova vira item na fila do módulo 02, não desvio agora) e *review* no fechamento. Sessão sem objetivo único vira deriva: 40 turnos, 5 assuntos, contexto gigante e nada fechado.

**Higiene de contexto.** O contexto da IA é recurso finito e degradável — como atenção humana. Regras práticas: sessão nova por tarefa não-relacionada (`/clear` entre elas); compactar quando inchar; nunca arrastar uma sessão quilométrica por dias "porque ela já sabe tudo". Uma sessão focada com contexto limpo supera uma sessão onisciente e entulhada — o entulho não é neutro, ele degrada as respostas. E o princípio anti-alucinação vale dobrado a dois: **a IA afirma com confiança; quem verifica é você.** "A IA disse" nunca é evidência — rodar e ler o output é.

**Revisão como ritual de fechamento.** Antes do push, sempre: reler o diff inteiro (você é o único reviewer — se você não ler, ninguém leu), rodar a verificação real (não "deve funcionar": funcionou, com output), atualizar PENDENCIAS.md/DECISIONS.md, commit atômico. O ritual é inegociável justamente porque é onde o solo substitui o code review de time.

### Passo a passo: montar o fluxo num dia real de AG

```markdown
# 1. Kanban pessoal — arquivo simples versionado (ou quadro no hub):
## FAZENDO (máx 2)
- fix: total divergente no painel do Cliente Varejo  [objetivo da sessão de hoje]
- feat: filtro por loja (BLOQUEADO: aguardando cliente confirmar lista de lojas)
## A FAZER (fila ordenada — módulo 02)
## FEITO (semana)
```

```markdown
# 2. Abertura de sessão — contrato de UMA linha, colado como 1ª mensagem:
"Objetivo único: corrigir divergência entre painel e relatório no
Cliente Varejo. Pronto = as duas telas mostram o mesmo total, provado
com a query executada. Fora disso: anota e não faz."
```

```bash
# 3. Fechamento — ritual antes do push:
git diff main --stat        # reler TUDO que mudou (o diff inteiro, não o resumo)
npm run build && npm test   # evidência, não fé
git commit -m "fix: unifica formula de faturamento entre painel e relatorio"
# PENDENCIAS.md: linha da divergência apagada NESTE mesmo commit
```

## Por que cai em entrevista

Todo entrevistador em 2026 pergunta como você usa IA. A resposta fraca é "uso pra gerar código". A forte descreve **processo**: objetivo único por sessão, verificação própria do output, revisão de todo diff. Isso diferencia quem é acelerado pela IA de quem é dependente dela — e WIP limit + Lei de Little mostram fundamento raro em júnior.

> **P:** "Como você trabalha com IA no dia a dia sem virar refém dela?"
>
> **R (30s):** "Trato cada sessão como um sprint de objetivo único: defino antes o que é 'pronto' e qual evidência prova. Limito trabalho em progresso a dois itens — Lei de Little: mais WIP só atrasa tudo. E tenho um ritual de fechamento inegociável: leio o diff inteiro, porque sou o único reviewer, e rodo a verificação real antes de dizer pronto — 'a IA disse que funciona' não é evidência. O código que sobe é meu, a responsabilidade não terceiriza."

## Checkpoint

- [ ] Meu kanban pessoal existe, e "fazendo" tem no máximo 2 itens agora
- [ ] Minhas últimas 3 sessões de IA começaram com objetivo único + critério de pronto
- [ ] Sei explicar a Lei de Little e por que WIP alto atrasa tudo
- [ ] Encerrei uma sessão ao atingir o objetivo (e a descoberta extra virou item de fila)
- [ ] Executei o ritual de fechamento completo (diff lido + verificação + registro) no último push

## Recursos

- *Personal Kanban* — Jim Benson & Tonianne DeMaria Barry
- Lei de Little — buscar "Little's Law kanban" (a formulação para fluxo de trabalho)
- [Anthropic — Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices) — engenharia de contexto e fluxo agêntico
- *Deep Work* — Cal Newport (custo real da troca de contexto)
