# 05 — Comunicação com Cliente

## O que é

Projeto não morre de bug — morre de **expectativa quebrada**. O cliente não vê seu código; ele vê a distância entre o que entendeu que ia receber e o que recebeu, quando recebeu. Gerir essa distância é trabalho de engenharia tanto quanto o código, e tem técnica:

**Expectativa se gere na entrada, não na saída.** O momento de alinhar é ANTES de começar: o que entra, o que explicitamente NÃO entra (o "não-escopo" evita 80% das discussões), quando fica pronto e em faixa (módulo 03). Promessa vaga na entrada vira frustração certa na saída.

**Demo curta e frequente > relatório longo e raro.** Um cliente que vê a URL de produção toda semana com uma fatia nova (módulo 01) nunca pergunta "e aí, como tá?" — ele SABE como tá. A demo de 5 minutos com dado real vale mais que status report de duas páginas, porque é **evidência, não narrativa**. É o mesmo princípio do "pronto só com evidência" aplicado à relação: não digo "está andando", eu MOSTRO andando.

**Mudança de escopo por escrito.** Pedido novo em conversa de voz evapora e vira "mas eu tinha pedido". A regra profissional: toda mudança de escopo é registrada por escrito — mensagem curta serve — com o trade-off visível: *"Fechado: entra o comparativo por loja, sai o exportar PDF desta entrega, prazo mantém sexta. Confirma?"*. Não é burocracia nem desconfiança; é memória compartilhada. Quem escreve o resumo controla a clareza.

**Má notícia cedo é serviço, não fracasso.** A conta é fria: problema comunicado com 10 dias de antecedência dá ao cliente 10 dias de opções (cortar escopo, mover prazo, avisar o chefe dele). O mesmo problema na véspera dá zero opções — e transfere o incêndio pra ele. O engenheiro que avisa cedo com plano ("estourou por X, opções: A ou B") é percebido como confiável; o que esconde até o fim é percebido como risco. **Você não é julgado pelo problema; é julgado pelo tempo entre você saber e o cliente saber.**

### Passo a passo: ritual de comunicação num projeto AG

Cenário: dashboard do **CLIENTE OFICINA** (oficina multi-loja), entrega de 2 semanas.

```markdown
# 1. Kick-off por escrito (uma mensagem, antes de codar):
Escopo desta entrega: painel com faturamento, ranking e filtro de período.
NÃO entra nesta entrega: exportar PDF, metas por vendedor (ficam pra fase 2).
Prazo: sexta 26, com demo parcial sexta 19.
Suposição: os dados do ERP-externo chegam com loja preenchida — se não
chegarem, aviso na hora e o prazo pode mover.
```

```markdown
# 2. Demo semanal (5 min, roteiro fixo):
- URL de produção na tela, dado real
- "Desde a última: X e Y prontos. Esta semana: Z."
- 1 pergunta de negócio ("esse número bate com o que você esperava?")
  → resposta do cliente é validação de dado que nenhum teste automatizado dá
```

```markdown
# 3. Template de má notícia (usar no DIA da descoberta):
"Descobri hoje que [fato verificado — não suposição]. Impacto: [prazo/escopo].
Opções: (A) manter prazo cortando X; (B) mover pra Y mantendo tudo.
Minha recomendação: A, porque [motivo]. Como prefere?"
```

Repare no fio: a má notícia leva **fato verificado + impacto + opções + recomendação**. Nunca só o problema ("deu ruim") nem falsa tranquilidade ("deve dar certo").

## Por que cai em entrevista

Pergunta comportamental clássica — "me conte de um conflito com cliente/prazo estourado" — mede exatamente isso. Quem narra esconde-esconde reprova; quem narra aviso cedo + opções + registro por escrito demonstra a maturidade que separa executor de dono de projeto.

> **P:** "Você percebe no meio do projeto que não vai dar tempo. O que faz?"
>
> **R (30s):** "Aviso no dia em que descubro, não na véspera — má notícia cedo dá opções ao cliente, tarde só transfere o incêndio. Levo o pacote completo: o fato verificado que causou o estouro, o impacto em prazo, duas opções com trade-off e a minha recomendação. E fecho por escrito o que decidirmos. Num projeto multi-loja real, um dado que veio sujo do ERP mudou o prazo: avisei no mesmo dia com duas opções, o cliente cortou uma feature da entrega e a relação saiu mais forte, não mais fraca."

## Checkpoint

- [ ] Meu último projeto teve escopo E não-escopo registrados por escrito antes de codar
- [ ] Fiz pelo menos 2 demos curtas com dado real em produção para um cliente
- [ ] Registrei uma mudança de escopo por escrito com trade-off explícito
- [ ] Dei uma má notícia no formato fato + impacto + opções + recomendação
- [ ] Recitei a resposta de entrevista em menos de 30s

## Recursos

- *Crucial Conversations* — Patterson et al. (conversa de alto risco sem rodeio)
- *The Trusted Advisor* — Maister, Green & Galford (confiança = credibilidade + histórico ÷ auto-interesse)
- Shape Up (Basecamp) — capítulo sobre comunicar progresso (hill charts): https://basecamp.com/shapeup
- *Nonviolent Communication* — Marshall Rosenberg (separar fato de interpretação — a base do template de má notícia)
