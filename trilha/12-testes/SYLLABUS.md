# Syllabus — Testes

> **Disciplina:** provar que o código faz o que você diz — com a pirâmide certa, mockando só na fronteira, e prendendo regressão em CI.
> **Carga horária alvo: 40h** — aulas 3h · bibliografia 15h · labs 14h · projeto de conclusão 8h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Decidir a proporção certa entre unidade / integração / e2e para uma feature, e justificar por que um teste está em cada camada.
2. Escrever teste de vitest para uma regra de negócio pura cobrindo bordas e casos-limite — sem subir a app inteira.
3. Mockar SÓ o que é fronteira (rede, relógio, banco) e reconhecer o mock que testa a si mesmo.
4. Cobrir um caminho crítico com Playwright usando locators semânticos e auto-wait — sem `sleep` arbitrário — e travar regressão em CI.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 piramide-de-testes | "The Practical Test Pyramid" (Ham Vocke, em martinfowler.com) — leitura integral | 2h |
| 02 primeiro-teste-vitest | Vitest docs — "Getting Started" e "Writing Tests" (API `test`/`expect`, `describe`, `beforeEach`) | 1.5h |
| 03 testar-logica-de-negocio | *Working Effectively with Legacy Code* (Feathers) — cap. "Seams" (isolar a lógica do resto) + Vitest docs "Assertion API" (`expect`) | 3h |
| 04 mocks-so-em-boundary | "Mocks Aren't Stubs" (Martin Fowler, ensaio) + Vitest docs "Mocking" (`vi.fn`, `vi.mock`, `vi.useFakeTimers`) | 2.5h |
| 05 e2e-playwright | Playwright docs — "Writing tests", "Locators", "Auto-waiting" e "Best Practices" | 2.5h |
| 06 tdd-quando-vale | *Test Driven Development: By Example* (Kent Beck) — Parte I (o exemplo Money, ciclo red-green-refactor) | 2h |
| 07 regressao-e-ci | *Working Effectively with Legacy Code* (Feathers) — cap. "Characterization Tests" + Playwright docs "Continuous Integration" | 1.5h |

Regra de leitura: **com um teste rodando** — cada técnica que ler, escreva o teste correspondente e veja falhar antes de passar. Leitura sem `npm test` não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `test-a-pure-core` (5h):** escreva do zero um núcleo puro (ex.: calculadora de comissão/preço com faixas) e cubra 100% dos ramos com vitest — bordas, zero, negativo, empate de faixa.
*Pronto quando:* cobertura de ramos 100% no módulo E o teste é sensível a mutação: trocar um `>` por `>=` no código faz pelo menos um teste quebrar.

**Lab 2 — `characterization-net` (5h):** escreva uma função "legada" cujo comportamento você mesmo não documentou, então escreva testes de caracterização que fixam o comportamento ATUAL (mesmo os esquisitos), e só depois refatore por baixo.
*Pronto quando:* os testes capturam a saída real atual, a refatoração muda a estrutura sem mudar comportamento, e todos seguem verdes.

**Lab 3 — `e2e-happy-path` (4h):** monte uma app mínima de 2 telas (login → lista) e cubra o caminho feliz com Playwright usando locators por role/label e auto-wait.
*Pronto quando:* o teste passa headless em CI, não contém nenhum `waitForTimeout`, e usa locators semânticos (não seletores CSS frágeis).

## Critério de formatura

- [ ] 7/7 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (o teste que ela te fez escrever diferente)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições mudam de URL, os livros não.*
