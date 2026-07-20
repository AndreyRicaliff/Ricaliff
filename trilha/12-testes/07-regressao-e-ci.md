# 07 — Regressão e CI

## O que é

Regressão é a quebra do que **já funcionava** — e é o modo de falha dominante em software vivo: não é a feature nova que derruba o cliente, é o efeito colateral dela em código que ninguém olhou. O valor econômico central de uma suíte não é provar que o código novo funciona — é **permitir mudar o código velho sem medo**. Michael Feathers (*Working Effectively with Legacy Code*) define código legado como "código sem testes" por isso: sem rede, todo refactor é aposta, e time sem rede para de refatorar — a dívida só cresce.

Pra suíte virar rede de verdade, ela precisa de duas propriedades: **rodar sozinha em todo push** (rede que depende de disciplina humana não é rede — é intenção) e **ser confiável** (verde = pode mergear, vermelho = tem bug). CI entrega a primeira. A segunda é a guerra contra o flaky.

### A suíte no GitHub Actions

`.github/workflows/ci.yml` num app AG (Vite + Vitest + Playwright):

```yaml
name: ci
on:
  pull_request:
  push: { branches: [main] }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci            # ci, não install: respeita o lockfile à risca
      - run: npx tsc --noEmit  # gate 1: tipos
      - run: npm test          # gate 2: unit/integration (vitest run)
```

O job de e2e segue a mesma receita num job `e2e` separado: `npx playwright install --with-deps chromium`, credenciais via `${{ secrets.E2E_USER }}`, e um passo `actions/upload-artifact` com `if: failure()` publicando `test-results/` — o trace da falha vira anexo do job (módulo 05).

Último passo pra virar **gate** de verdade: Settings → Branch protection na `main` → exigir os checks `test` e `e2e` verdes pra merge. Sem isso o CI é decorativo — informa, não protege.

### Teste flaky é pior que sem teste

Flaky = passa e falha sem mudança no código. Por que é PIOR que ausência de teste: sem teste você sabe que está sem rede e age com cautela; com flaky o time aprende em ~2 semanas que "vermelho = clica re-run" — e no dia em que o vermelho é um bug real, ele recebe o mesmo re-run. O flaky não falha em detectar: ele **treina o time a ignorar o alarme**, corroendo a confiança na suíte inteira. Google publicou que ~16% dos seus testes exibiam flakiness — é problema de todo mundo, a diferença é tratar ou conviver.

Método sênior diante de um flaky — hipótese e refutação, não chute:

1. **Reproduzir**: `npx vitest run --sequence.shuffle` (dependência de ordem) ou rodar o e2e 20× — `npx playwright test --repeat-each=20` — e medir a taxa.
2. **Hipóteses clássicas, na ordem**: dado residual entre testes (falta de reset/seed) → relógio real (`Date.now()`/timezone) → espera implícita (`sleep` em vez de `expect(...).toBeVisible()`) → paralelismo compartilhando estado.
3. **Decidir com prazo**: corrigir agora, ou **quarentenar** (`it.skip` + item datado no `PENDENCIAS.md` com dono). Deletar honestamente também é opção. O crime é o re-run infinito — conviver com o alarme falso.

Nunca "resolver" com retry global no CI: retry mascara exatamente o sinal que o teste existe pra dar.

## Por que cai em entrevista

"Pra que servem testes?" respondido com "verificar se funciona" é resposta de júnior; "permitir refactor sem medo + gate automático de merge" é a resposta de quem já operou uma suíte. E flaky é pergunta favorita de entrevistador experiente, porque só quem manteve suíte em CI real tem opinião formada.

> **P:** "Sua suíte tem um teste que falha às vezes. O que você faz?"
>
> **R (30s):** "Trato como incidente, porque flaky é pior que sem teste — treina o time a dar re-run no vermelho, e aí o vermelho verdadeiro passa junto. Primeiro reproduzo e meço: rodo 20 vezes, embaralho a ordem. As causas quase sempre são estado residual entre testes, relógio real ou espera implícita. Se não consigo corrigir no dia, quarenteno com skip e registro pendência datada com dono — o que não faço é deixar falhando intermitente nem esconder com retry global, porque retry mascara exatamente o sinal que o teste existe pra dar."

## Checkpoint

- [ ] Sei explicar por que o valor da suíte é permitir refactor, citando a definição de Feathers
- [ ] Tenho workflow de CI real rodando typecheck + unit + e2e em PR num projeto AG
- [ ] Ativei branch protection: PR não mergeia com check vermelho
- [ ] Sei listar de cabeça as 4 causas clássicas de flaky e o diagnóstico de cada
- [ ] Sei defender por que flaky é pior que sem teste, e por que retry global é mascaramento

## Recursos

- [GitHub Actions — docs de workflow](https://docs.github.com/en/actions)
- [Flaky Tests at Google and How We Mitigate Them — Google Testing Blog](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)
- Michael Feathers — *Working Effectively with Legacy Code* (livro)
- [Eradicating Non-Determinism in Tests — Martin Fowler](https://martinfowler.com/articles/nonDeterminism.html)
