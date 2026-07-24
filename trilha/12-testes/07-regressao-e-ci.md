# 07 — Regressão e CI

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Regressão é a quebra do que **já funcionava** — e é o modo de falha dominante em software vivo: não é a feature nova que derruba o cliente, é o efeito colateral dela em código que ninguém olhou. Este módulo é sobre o valor econômico real de uma suíte (que não é "provar que o novo funciona") e sobre transformar a suíte em **rede de verdade** via CI — o que exige vencer o inimigo que corrói a confiança na suíte inteira: o teste **flaky**.

---

## § BASE — o fundamento

**O valor da suíte é permitir mudar o código velho sem medo.** Este é o ponto que separa quem já operou uma suíte de quem só a escreveu. **Michael Feathers**, em *Working Effectively with Legacy Code* (2004), define código legado como **"código sem testes"** — e a definição é econômica, não pejorativa: sem rede, todo refactor é aposta, então o time **para de refatorar**, e a dívida técnica só cresce. A suíte não existe para carimbar o código novo; existe para que o código velho possa ser **mudado com segurança**. É o que destrava a evolução do sistema.

**Characterization tests: rede onde não há requisito escrito.** Feathers dá a técnica para o caso comum na AG — código legado cuja regra ninguém documentou. Um **characterization test** não afirma o comportamento *correto*; afirma o comportamento **atual**, seja ele qual for (mesmo os esquisitos). Você roda o código, captura a saída real, e a fixa num teste. Agora você tem uma rede: pode refatorar por baixo e qualquer mudança de comportamento acende o vermelho. É como você põe sob teste um código que você não entende ainda — pin o que ele faz, depois mude a estrutura sem mudar o que ele faz.

**Duas propriedades para a suíte virar rede.** Uma suíte só é rede se tiver ambas: **rodar sozinha em todo push** (rede que depende de disciplina humana não é rede — é intenção) e **ser confiável** (verde = pode mergear; vermelho = tem bug). **CI** (Continuous Integration) entrega a primeira: o servidor roda a suíte a cada push, sem depender de ninguém lembrar. A segunda é a guerra contra o flaky.

**O dado da entrega — por que isto move o negócio.** Que automação de teste + CI não é só higiene, mas **preditor de performance de entrega**, é a conclusão de **Forsgren, Humble e Kim** em *Accelerate* (2018), a partir dos dados do programa **DORA (DevOps Research and Assessment)**: times que praticam test automation e integração contínua pontuam melhor nas quatro métricas-chave — frequência de deploy, lead time, tempo de restauração e taxa de falha de mudança. É a evidência de que a rede não desacelera; ela é o que permite entregar rápido **e** estável ao mesmo tempo.

**Flaky é PIOR que sem teste — e o dado do Google.** Flaky = o teste passa e falha **sem mudança no código**. Por que é pior que ausência: sem teste, você *sabe* que está sem rede e age com cautela; com flaky, o time aprende em ~2 semanas que "vermelho = clica re-run" — e no dia em que o vermelho é um bug real, ele recebe o mesmo re-run. O flaky não falha em detectar; ele **treina o time a ignorar o alarme**, corroendo a confiança na suíte inteira. Não é problema de projeto amador: o **Google Testing Blog**, em *Flaky Tests at Google and How We Mitigate Them* (John Micco, 2016), reportou que **~16% dos testes deles exibiam algum grau de flakiness** — é problema de todo mundo; a diferença é tratar ou conviver.

**Por que retry global é mascaramento, não solução.** A tentação é ligar retry automático no CI e o vermelho intermitente "some". Mas retry mascara exatamente o sinal que o teste existe para dar: um flaky que passa no retry pode estar escondendo uma condição de corrida real que vai bater em produção. **Martin Fowler**, em *Eradicating Non-Determinism in Tests*, é direto: a resposta ao não-determinismo é **erradicá-lo na causa** (estado residual, relógio real, espera implícita, paralelismo compartilhando estado), não escondê-lo com repetição.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A suíte só protege quando vira **gate** automático; o flaky é a doença que corrói esse gate por dentro:

```
   A CADEIA DO GATE (o que torna a suíte uma rede)
   push / PR
      │
      ▼
   ┌─────────── GitHub Actions (roda sozinho) ───────────┐
   │  npm ci  →  tsc --noEmit  →  vitest run  →  playwright │
   │   gate 0      gate 1          gate 2         gate 3     │
   └──────────────────────┬───────────────────────────────┘
                          ▼
                 branch protection (main)
                          │
              verde ──────┼────── vermelho
                mergeia          BLOQUEIA
                          ▼
              sem branch protection = CI DECORATIVO (informa, não protege)

   O FLAKY (corrói a cadeia de dentro)
      passa/falha sem mudança de código
                 │
                 ▼
      time aprende "vermelho = re-run"  ← em ~2 semanas
                 │
                 ▼
      o vermelho VERDADEIRO recebe o mesmo re-run  ← pior que sem teste
```

A dependência: a suíte precisa **rodar sozinha** (CI) E **ser confiável** (anti-flaky) — falta qualquer uma e ela deixa de ser rede. E sem **branch protection**, o CI roda mas não impede o merge do vermelho: informa, não protege.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. RODAR a suíte em todo push** via GitHub Actions — typecheck + unit/integração + e2e, cada um um gate.

**2. ATIVAR branch protection na `main`** exigindo os checks verdes. Sem isso o CI é decorativo.

**3. PUBLICAR o trace da falha** como artifact (`if: failure()`) para diagnosticar sem reproduzir local.

**Diante de um flaky — hipótese e refutação, não chute:**

**4. REPRODUZIR e medir a taxa:** `npx vitest run --sequence.shuffle` (dependência de ordem) ou `npx playwright test --repeat-each=20`.

**5. TESTAR as hipóteses clássicas na ordem:** dado residual entre testes (falta de reset/seed) → relógio real (`Date.now()`/timezone) → espera implícita (`sleep` em vez de `expect(...).toBeVisible()`) → paralelismo compartilhando estado.

**6. DECIDIR com prazo:** corrigir agora, ou **quarentenar** (`it.skip` + item datado no `PENDENCIAS.md` com dono). Deletar honestamente também é opção.

**Anti-padrões:**
- **Retry global no CI:** mascara o sinal que o teste existe pra dar (Fowler). Erradique a causa.
- **Conviver com o alarme falso:** o re-run infinito treina o time a ignorar o vermelho — o crime central do flaky.
- **CI sem branch protection:** roda e informa, mas o vermelho ainda mergeia. Decorativo.
- **`npm install` no CI:** ignora o lockfile; use `npm ci`, que respeita o `package-lock.json` à risca e falha se ele estiver dessincronizado.

---

## Passo-a-passo aplicado (faça agora, ~30min)

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

Último passo pra virar **gate** de verdade: Settings → Branch protection na `main` → exigir os checks `test` e `e2e` verdes pra merge. Sem isso o CI é decorativo — informa, não protege. Depois, exercite o anti-flaky: rode uma suíte 20× embaralhando a ordem (`--sequence.shuffle` / `--repeat-each=20`) e, se algo piscar vermelho, ataque na ordem das hipóteses clássicas — não com re-run.

## Por que cai em entrevista

"Pra que servem testes?" respondido com "verificar se funciona" é resposta de júnior; "permitir refactor sem medo + gate automático de merge" é a resposta de quem já operou uma suíte. E flaky é pergunta favorita de entrevistador experiente, porque só quem manteve suíte em CI real tem opinião formada.

> **P:** "Sua suíte tem um teste que falha às vezes. O que você faz?"
>
> **R (30s):** "Trato como incidente, porque flaky é pior que sem teste — treina o time a dar re-run no vermelho, e aí o vermelho verdadeiro passa junto. Primeiro reproduzo e meço: rodo 20 vezes, embaralho a ordem. As causas quase sempre são estado residual entre testes, relógio real ou espera implícita. Se não consigo corrigir no dia, quarenteno com skip e registro pendência datada com dono — o que não faço é deixar falhando intermitente nem esconder com retry global, porque retry mascara exatamente o sinal que o teste existe pra dar."

> **P:** "Por que investir em testes automatizados? Qual o retorno?"
>
> **R (30s):** "O retorno não é provar que o código novo funciona — é poder mudar o código velho sem medo. O Feathers define legado como 'código sem testes' justamente por isso: sem rede, todo refactor é aposta, e o time para de refatorar, então a dívida cresce. A suíte é o que mantém o sistema mutável ao longo do tempo. E isso não é opinião: os dados do DORA no livro *Accelerate* mostram que automação de teste e integração contínua predizem as quatro métricas de entrega — deploy mais frequente, lead time menor, menos falha de mudança e restauração mais rápida. A rede não desacelera; é o que deixa entregar rápido e estável ao mesmo tempo."

## Checkpoint

- [ ] Sei explicar por que o valor da suíte é permitir refactor, citando a definição de Feathers
- [ ] Sei o que é um characterization test e quando ele é a técnica certa (código legado sem requisito)
- [ ] Tenho workflow de CI real rodando typecheck + unit + e2e em PR num projeto AG
- [ ] Ativei branch protection: PR não mergeia com check vermelho
- [ ] Sei listar de cabeça as 4 causas clássicas de flaky e o diagnóstico de cada
- [ ] Sei defender por que flaky é pior que sem teste, e por que retry global é mascaramento

## Recursos

- Michael Feathers — *Working Effectively with Legacy Code* (2004): a definição "código sem testes é legado" e o capítulo "Characterization Tests" — leitura obrigatória do módulo (SYLLABUS)
- Google Testing Blog — *Flaky Tests at Google and How We Mitigate Them* (John Micco, 2016): os ~16% de testes com flakiness e a estratégia de mitigação
- Martin Fowler — *Eradicating Non-Determinism in Tests* (ensaio): erradicar a causa em vez de mascarar com retry
- Forsgren, Humble & Kim — *Accelerate* (2018) e os relatórios DORA (State of DevOps): automação de teste e CI como preditores das quatro métricas de entrega
- GitHub Actions — docs de workflow (docs.github.com/actions) e Playwright "Continuous Integration" (playwright.dev/docs): as receitas de CI
