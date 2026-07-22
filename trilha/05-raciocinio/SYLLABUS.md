# Syllabus — Raciocínio de Engenharia

> **Disciplina:** o método antes do código — verificar em vez de afirmar, refutar em vez de confirmar, decidir com trade-off explícito.
> **Carga horária alvo: 30h** — aulas 3h · bibliografia 11h · labs 12h · projeto de conclusão 4h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Distinguir o que você VIU do que você SUPÔS — e nunca reportar "funciona/corrigido" sem a evidência (rodei + li o output).
2. Formular uma hipótese falseável de um bug e desenhar o teste que a REFUTA (não o que a confirma).
3. Tornar qualquer decisão técnica defensável: opções, critério de corte, o trade-off decisivo — em 30 segundos.
4. Decompor um problema grande até a menor unidade reproduzível, e reconhecer quando parar (o alvo certo foi verificado, não o parecido).

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 verificar-antes-de-afirmar | *Debugging: The 9 Indispensable Rules* (David J. Agans) — regra "Quit Thinking and Look" + *The Pragmatic Programmer* (Hunt & Thomas, ed. 20 anos) — tópico "Don't Assume It — Prove It" | 1.5h |
| 02 hipotese-e-refutacao | Agans — regras "Make It Fail" e "Change One Thing at a Time" + *How to Solve It* (Polya) — fase "Devising a Plan" | 1.5h |
| 03 trade-offs-explicitos | *The Pragmatic Programmer* — tópicos "Good-Enough Software" e "Orthogonality" (custo de acoplamento na decisão) | 1.5h |
| 04 ler-o-erro-de-verdade | Agans — regras "Read the Manual" e "Quit Thinking and Look" (ler a mensagem/stack inteira antes de teorizar) | 1.5h |
| 05 decompor-problemas | *How to Solve It* (Polya) — as quatro fases completas + Agans — regra "Divide and Conquer" | 2.5h |
| 06 verificar-o-alvo-certo | Agans — regras "Check the Plug" e "If You Didn't Fix It, It Ain't Fixed" (provar QUAL alvo foi lido: branch, ambiente, tabela) | 1.5h |
| 07 quando-parar | *The Pragmatic Programmer* — tópico "Good-Enough Software" + Agans — "Get a Fresh View" (quando pedir olhos de fora em vez de insistir) | 1h |

Regra de leitura: **com um bug real na mão** — cada regra que ler, aplique no debug do dia e anote se pegou ou não. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `bug-hunt` (5h):** construa (você mesmo, do zero) uma pequena app com UM bug plantado não-óbvio, depois entregue um `BUGLOG.md` que percorre as 9 regras: cada hipótese levantada, o teste que a refutou ou confirmou, e a causa final.
*Pronto quando:* o bug está corrigido E o log mostra pelo menos 2 hipóteses REFUTADAS antes da causa raiz (prova de que você refutou, não confirmou).

**Lab 2 — `trade-off-matrix` (3h):** mini-app (HTML ou CLI) que recebe 2–3 opções e N critérios com pesos, e devolve a decisão pontuada. Sem libs de UI pesadas.
*Pronto quando:* dado um caso real seu (ex.: escolher entre 2 libs), a ferramenta produz a decisão com pesos explícitos e você defende em 30s por que a opção vencedora venceu — mesmo contra o gosto pessoal.

**Lab 3 — `minimal-repro` (4h):** pegue um "bug" que só reproduz com muito contexto (app inteira) e reduza-o, por divisão ao meio, ao menor snippet que ainda falha, logando cada camada removida.
*Pronto quando:* a reprodução final tem < 20 linhas, roda isolada, e o `REDUCAO.md` registra cada corte (o que removeu, se ainda falhava).

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (que bug/decisão real ela mudou)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
