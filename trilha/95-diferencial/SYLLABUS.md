# Syllabus — Diferencial: o que sobrevive ao Claude

> **Disciplina:** construir o que nenhuma IA constrói por você — fundamentos que você explica no quadro, decisões com seu nome e data, e presença pública. Trilha *portfolio-driven*, medida por artefato.
> **Carga horária alvo: 30h** — aulas 2h · bibliografia 10h · labs (artefatos públicos) 14h · projeto de conclusão 4h.
> Os módulos são a *aula* (mapa denso). A formação acontece na aplicação sem muleta: publicar, decidir, resolver sem IA.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar um conceito de fundamento no quadro branco, oralmente, sem autocompletar e sem travar.
2. Registrar uma decisão técnica em primeira pessoa (problema, opções, escolha, consequências) que você defende meses depois.
3. Publicar texto técnico curto e claro — frase que carrega uma ideia, sem "feliz em compartilhar".
4. Atacar um problema novo (sem resposta no Stack Overflow) com método explícito, em vez de congelar.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 fundamentos-sem-ia | Técnica de Feynman (explicar em voz alta como se ensinasse) aplicada ao banco `90-entrevista/perguntas-junior.md` — cada conceito reexplicado sem IA até fechar a lacuna | 2h |
| 02 decisoes-em-primeira-pessoa | Michael Nygard — *Documenting Architecture Decisions* (2011), o post original do padrão ADR (estrutura problema/opções/decisão/consequências) | 2h |
| 03 quando-nao-usar-claude | *Peak* (Anders Ericsson & Robert Pool) — caps. de prática deliberada + *Deep Work* (Cal Newport) — cap. sobre atenção/treino sem distração | 2.5h |
| 04 comunicacao-publica | Paul Graham — ensaios *Writing, Briefly* + *Putting Ideas Into Words* [paulgraham.com] + *On Writing Well* (William Zinsser) — caps. "Simplicity" e "Clutter" | 2.5h |
| 05 raciocinio-em-problema-novo | *How to Solve It* (George Pólya) — as quatro fases: entender, planejar, executar, revisar | 1h |

Regra de leitura: **produza o artefato enquanto lê** — cada leitura desta trilha vira um post, um `DECISIONS.md` ou um problema resolvido sem IA. Leitura que não vira artefato público não conta hora.

## Labs (artefatos públicos, do zero)

**Lab 1 — `3-posts-tecnicos` (5h):** escrever e **publicar** 3 posts técnicos (LinkedIn/dev.to/blog) destilando uma decisão real de um projeto próprio (ex.: por que RLS no banco e não filtro no backend), aplicando Paul Graham/Zinsser — frase curta, ideia por parágrafo.
*Pronto quando:* 3 posts publicados, sem "feliz em compartilhar", cada um com um trade-off explícito e nenhum parágrafo que não carregue uma ideia.

**Lab 2 — `decisions-em-3-projetos` (4h):** adicionar `DECISIONS.md` (ADR-leve, formato Nygard) em 3 projetos próprios, cada um com **≥3 entradas datadas em primeira pessoa** — problema, opções A/B/C, decisão, por quê, consequências.
*Pronto quando:* os 3 arquivos estão commitados, as entradas são datadas e em 1ª pessoa, e você defende cada decisão oralmente sem reler.

**Lab 3 — `10-problemas-sem-ia` (5h):** resolver 10 problemas (algoritmo ou bug real) **sem Claude**, documentando as 4 fases de Pólya em cada um, em repo público `_sem-ia`.
*Pronto quando:* 10 registros datados, cada um mostrando entender→planejar→executar→revisar, com a solução final e o que a fase "revisar" mudou.

## Critério de formatura

- [ ] 5/5 módulos com checkpoint (recall aprovado — 10 conceitos explicados oralmente sem travar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (qual artefato cada leitura gerou)
- [ ] 3 labs prontos (3 posts publicados, 3 `DECISIONS.md`, 10 problemas sem IA — tudo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4) — 1 repo público com README sério e pinado no GitHub **ou** 1 talk preparada (slides + ensaio), como prova pública de autoria

*Bibliografia sem link direto: procurar pelo título — os ensaios do Paul Graham estão em paulgraham.com; o post de ADR do Nygard e os livros ficam pelo nome, edições mudam de URL.*
