# 02 — Priorização

## O que é

Priorizar é decidir **o que NÃO fazer agora** — e sustentar essa decisão com critério, não com quem gritou mais alto. Três ferramentas cobrem 90% dos casos:

**Impacto × esforço**: matriz 2×2. Alto impacto + baixo esforço = fazer já ("quick win"). Alto impacto + alto esforço = planejar e fatiar (módulo 01). Baixo impacto + baixo esforço = talvez, em folga. Baixo impacto + alto esforço = recusar. A armadilha: impacto e esforço são **estimativas**, não fatos — o hábito sênior é declarar a incerteza ("acho que é esforço baixo, mas não abri esse código ainda; confirmo em 30 min de leitura antes de prometer").

**Urgente vs importante** (matriz de Eisenhower): urgente = tem prazo batendo; importante = move o objetivo. O erro clássico do júnior é viver no quadrante urgente-e-não-importante (interrupções, pedidos "rapidinho") e nunca tocar no importante-e-não-urgente (dívida técnica, automação, estudo) — que é exatamente o quadrante onde se constrói o salto pra pleno.

**Custo de atraso** (*cost of delay*, Don Reinertsen, *The Principles of Product Development Flow*): a pergunta não é "quanto custa fazer?", é "quanto custa POR SEMANA não ter isso pronto?". Um fix no sync do ERP-externo que trava o faturamento do cliente tem custo de atraso altíssimo; um refactor estético tem custo de atraso ~zero. CD3 (*cost of delay divided by duration*) ordena a fila: maior custo de atraso ÷ menor duração primeiro.

### A fila única

Múltiplas "listas" (uma no chat, uma na cabeça, uma no repo) = prioridade decidida por acaso. Regra: **uma fila única, ordenada, visível**. Para dev solo AG isso é um quadro/arquivo só, onde entra TODO pedido — de cliente, de dívida, de ideia própria. O que não está na fila não existe; o que está, tem posição, e a posição É a decisão de prioridade.

### Dizer não com alternativa

"Não" seco queima relação; "sim" pra tudo queima o prazo de todo mundo. O formato profissional é **não + trade-off explícito + alternativa**:

> "Consigo, mas isso entra na frente do relatório que combinamos pra sexta — prefere trocar? Alternativa: faço uma versão mínima disso hoje (só o número, sem gráfico) e o completo semana que vem."

Quem decide o trade-off é o cliente; quem EXPÕE o trade-off é você. Esconder o custo do "sim" é a mentira mais comum da profissão.

### Passo a passo: ordenar a fila real de um projeto AG

```bash
# 1. Materializar a fila única no repo do Cliente Varejo
cd C:\Projetos\cliente-varejo
# PENDENCIAS.md já concentra dívidas; crie a fila geral acima delas
```

```markdown
## FILA (ordenada por CD3 — revisar toda segunda)
1. fix: total divergente entre painel e relatório — CdA: alto (cliente sem confiar no número) / dur: 1d
2. feat: filtro por loja no ranking — CdA: médio / dur: 0.5d
3. refactor: extrair fórmula duplicada — CdA: baixo hoje, cresce a cada toque / dur: 0.5d
4. ideia: exportar PDF — CdA: baixo (ninguém pediu duas vezes) / dur: 2d
```

```text
# 2. Teste de honestidade: para cada item, escreva a EVIDÊNCIA do impacto.
#    "Cliente pediu 2x" é evidência. "Acho que seria legal" não é.
# 3. Item sem evidência de impacto desce pro fim ou sai.
```

## Por que cai em entrevista

"Como você prioriza quando tudo é urgente?" é pergunta de pleno por excelência: mede se você tem critério próprio ou só executa ordem. Citar custo de atraso — em vez de só "impacto × esforço" — sinaliza leitura acima da média.

> **P:** "O cliente pede uma feature nova no meio da sprint. O que você faz?"
>
> **R (30s):** "Não digo sim nem não na hora — exponho o trade-off. Olho o custo de atraso: se o pedido destrava faturamento dele, provavelmente fura a fila mesmo; se é cosmético, mostro o que atrasa em troca e deixo ele decidir. Mantenho uma fila única ordenada, então a conversa é 'isso entra na posição 2 e empurra X pra semana que vem, ok?'. Já fiz isso com cliente de varejo real: ele mesmo despriorizou o pedido quando viu o custo."

## Checkpoint

- [ ] Sei explicar custo de atraso e dar um exemplo com números por semana
- [ ] Tenho UMA fila única ordenada num projeto real (não três listas paralelas)
- [ ] Reescrevi um "sim" automático recente como "não + trade-off + alternativa"
- [ ] Para os 3 primeiros itens da minha fila, sei citar a evidência de impacto de cada um
- [ ] Recitei a resposta de entrevista em menos de 30s

## Recursos

- *The Principles of Product Development Flow* — Don Reinertsen (custo de atraso, filas)
- Matriz de Eisenhower — buscar "Eisenhower matrix" (conceito, não ferramenta)
- [Intercom — framework RICE](https://www.intercom.com/blog/rice-simple-prioritization-for-product-managers/) — Reach/Impact/Confidence/Effort
- *Essencialismo* — Greg McKeown (a disciplina do não)
