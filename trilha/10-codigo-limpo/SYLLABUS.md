# Syllabus — Código Limpo

> **Disciplina:** escrever código que a próxima pessoa (você em 3 meses) lê sem sofrer — com senso crítico, não dogma.
> **Carga horária alvo: 35h** — aulas 2h · bibliografia 13h · labs 13h · projeto de conclusão 7h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Quebrar uma função que faz três coisas em três funções que fazem uma — e nomear cada uma pela intenção.
2. Achatar aninhamento com early return / guard clauses, e reconhecer quando o `if/else` era mais legível.
3. Escolher um nome que dispensa o comentário, e distinguir comentário "o quê" (apagar) de "por quê" (manter).
4. Aplicar a regra dos 3: resistir à abstração nas duas primeiras cópias e extrair na terceira — sem generalidade especulativa.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 srp-funcoes-curtas | *Clean Code* (Robert C. Martin) — cap. 3 "Functions" (com senso crítico: "small!" é meta, não lei) + *Refactoring* (Fowler, 2ª ed) — refatoração "Extract Function" | 3.5h |
| 02 early-return-guard-clauses | *Refactoring* (Fowler) — "Replace Nested Conditional with Guard Clauses" e "Decompose Conditional" | 2.5h |
| 03 nomes-vs-comentarios | *Clean Code* — cap. 2 "Meaningful Names" e cap. 4 "Comments" + *Refactoring* — "Rename Variable" e "Change Function Declaration" | 3.5h |
| 04 abstracao-regra-dos-3 | *Refactoring* (Fowler) — cap. 1 (o exemplo completo, onde a regra dos três aparece) + *The Pragmatic Programmer* — tópico "DRY — The Evils of Duplication" (DRY é sobre conhecimento, não sobre texto igual) | 3.5h |

Regra de leitura: **com um diff seu na tela** — cada regra que ler, ache no seu próprio código onde você a violou hoje. Leitura sem confronto não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `refactor-kata` (6h):** escreva do zero UMA função-monstro (~150 linhas, aninhamento fundo, nomes ruins) que resolva algo real (ex.: cálculo de comissão). Escreva PRIMEIRO testes de caracterização que fixam o comportamento; só então refatore para funções ≤ 20 linhas, guard clauses e nomes de intenção.
*Pronto quando:* os testes passam idênticos antes e depois, nenhuma função passa de 20 linhas, e o aninhamento máximo é 2.

**Lab 2 — `naming-pass` (3h):** escreva um arquivo propositalmente cheio de nomes ruins (`x`, `tmp`, `data2`, `handle`) e comentários que explicam "o quê". Faça uma passada renomeando tudo para nomes reveladores de intenção e apagando todo comentário "o quê", mantendo só "por quê".
*Pronto quando:* zero comentários "o quê" sobraram e um leitor externo entende o arquivo só pelos nomes.

**Lab 3 — `rule-of-three` (4h):** implemente uma feature com 3 blocos quase-duplicados. Deixe os 2 primeiros duplicados de propósito; abstraia SÓ no terceiro uso, sem parâmetros "para o futuro".
*Pronto quando:* a abstração nasce apenas no 3º caso, não tem nenhum parâmetro não usado (zero generalidade especulativa), e o `POR-QUE.md` justifica por que abstrair antes teria sido pior.

## Critério de formatura

- [ ] 4/4 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (o code smell que ela te fez ver no próprio código)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
