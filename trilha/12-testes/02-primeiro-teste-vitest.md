# 02 — Primeiro Teste com Vitest

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Este módulo tira o teste do abstrato: escrever o primeiro `expect` que roda, falha quando deve e vira gate de merge no CI. A ferramenta é **Vitest** (o runner nativo do ecossistema Vite), mas a ferramenta é o menos importante — o que se aprende aqui é a **anatomia de um teste** e a ordem de raciocínio que separa quem já configurou uma suíte de quem leu a respeito: extrair a lógica pura primeiro, testar o barato, **provar que o teste falha**, só então plugar no CI.

---

## § BASE — o fundamento

**O que é um teste, mecanicamente.** Um teste unitário é uma função que **chama seu código com input conhecido e afirma o output esperado**. Se a afirmação falha, o runner sai com **exit code ≠ 0** — e é esse exit code, não um relatório bonito, que o CI usa para bloquear o merge. Reduzido ao osso: **teste é uma afirmação executável com consequência.** Sem a consequência (o gate), é documentação que apodrece.

**A linhagem xUnit.** Essa mecânica não é do Vitest nem do Jest — é herdada. **Kent Beck** escreveu o **SUnit** para Smalltalk e o documentou em *Simple Smalltalk Testing: With Patterns* (~1994), fundando a família **xUnit** (JUnit, NUnit, PyTest, Jest, Vitest — todos descendem daquele desenho). O que Beck fixou e sobrevive até hoje: cada teste é isolado, roda sozinho, e ou passa ou falha de forma binária e automática. Vitest é uma reencarnação moderna desse padrão de 30 anos.

**A anatomia: o Four-Phase Test.** **Gerard Meszaros**, em *xUnit Test Patterns: Refactoring Test Code* (2007), nomeou a estrutura canônica de todo bom teste — o **Four-Phase Test**: **Setup** (arranjar o cenário), **Exercise** (executar o código sob teste), **Verify** (afirmar o resultado) e **Teardown** (limpar). A versão enxuta, popularizada por **Bill Wake** (2001) como **Arrange-Act-Assert (AAA)**, colapsa as três primeiras fases nas três linhas que você vê em qualquer teste unitário bem escrito. Não é convenção estética: a separação torna o teste legível como uma frase — *dado isto, quando faço aquilo, então espero isto* — e Meszaros mostra que testes que borram essas fases viram o smell **Obscure Test**, difícil de ler e de manter.

**Por que o primeiro teste mira função pura.** Fio de método da trilha: o primeiro teste de um projeto deve mirar **função pura de cálculo** — determinística, mesma entrada → mesma saída, sem I/O. É onde o Setup é trivial (não precisa de banco, relógio ou rede), o teste custa menos e prova mais. Testar componente React no dia 1 é começar pelo caro: você paga mock de fetch, render, DOM virtual — tudo antes de ter provado uma única regra. A ordem certa é extrair a regra e testá-la nua.

**A disciplina inegociável: ver o vermelho.** Um teste que nunca ficou vermelho na sua frente **não provou nada** — pode estar testando o arquivo errado, importando o símbolo errado, ou afirmando uma tautologia. Antes de confiar no verde, quebre o teste de propósito (troque o esperado por um valor errado), veja o vermelho, desfaça. Isto é o mesmo princípio de refutação do módulo `05-raciocinio/02-hipotese-e-refutacao` aplicado à sua própria suíte: você prova que o teste é **capaz de falhar** antes de acreditar quando ele passa.

**Vitest, especificamente.** Vitest usa o **mesmo pipeline de transformação do Vite** (esbuild, aliases, `tsconfig`), então um projeto Vite/React não precisa de configuração paralela de Babel/Jest — o teste roda no mesmo mundo do código. API compatível com Jest (`describe`/`it`/`expect`), watch mode instantâneo por HMR, TypeScript e ESM sem transpile extra. Em 2026 é o padrão de fato para projetos Vite; Jest continua dominante em legado e React Native. Fato de lib a conferir sempre no `package.json` antes de afirmar disponibilidade de uma API — não decore, verifique.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Um teste tem uma anatomia fixa, e a suíte tem uma cadeia que termina no gate:

```
UM TESTE (Four-Phase / AAA)              A CADEIA ATÉ O GATE
┌─────────────────────────┐             função pura  (o alvo, sem I/O)
│ Setup   (Arrange)        │                  │
│   input conhecido        │             teste .test.ts  (afirmação executável)
├─────────────────────────┤                  │
│ Exercise (Act)           │             vitest run  →  exit code 0 | ≠0
│   chama o código         │                  │
├─────────────────────────┤             GitHub Actions  (roda em todo push)
│ Verify  (Assert)         │                  │
│   expect(saída).toBe(x)  │             branch protection  →  BLOQUEIA merge
├─────────────────────────┤                  ▼
│ Teardown (limpa)         │             o teste vira GATE, não decoração
└─────────────────────────┘
```

A dependência é estrita e de baixo pra cima: sem **função pura** o Setup vira um pesadelo de mocks; sem **ver o vermelho** o verde não significa nada; sem **`vitest run` no CI** e **branch protection** o teste informa mas não protege. Cada elo que falta esvazia o próximo.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. ACHAR a lógica pura de maior risco.** Não comece instalando ferramenta. Comece caçando o cálculo que, se der errado, vira dinheiro errado na tela — quase sempre vive inline em componente.

**2. EXTRAIR pra função sem I/O** em `src/lib/`. A extração é o passo de design; o módulo 03 aprofunda por quê.

**3. INSTALAR o Vitest e escrever 3 casos:** o feliz + duas bordas. Menos que isso não cobre; mais que isso no primeiro teste é otimização prematura.

**4. QUEBRAR o teste de propósito e ver o vermelho.** Só depois confie no verde.

**5. PLUGAR no CI com `vitest run`** e ativar branch protection para o teste virar gate.

**Anti-padrões:**
- **Começar pelo componente:** paga o caro (mock, render, DOM) antes de ter provado uma regra. Extraia e teste a lógica nua primeiro.
- **Confiar no verde sem nunca ter visto o vermelho:** o teste pode estar testando nada. Não é teste até ter falhado uma vez na sua frente.
- **`vitest` puro no CI:** fica em watch mode e o job trava até o timeout. No CI é sempre `vitest run`.
- **Teste que mistura as quatro fases num bloco só:** o smell Obscure Test — ilegível e frágil. Separe Arrange-Act-Assert.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Dashboard Vite + React do **Cliente Varejo** (varejo de eletrônicos multi-loja), com um cálculo de margem que hoje vive inline no componente.

```bash
cd C:\Projetos\dashboard-varejo   # codinome
npm i -D vitest
```

`package.json`:

```json
"scripts": { "test": "vitest run", "test:watch": "vitest" }
```

Extrair o cálculo pra `src/lib/margem.ts` (a extração É o passo importante — módulo 03 aprofunda):

```ts
export function margemPct(venda: number, custo: number): number {
  if (venda <= 0) return 0;            // fail-closed: sem venda, sem margem
  return ((venda - custo) / venda) * 100;
}
```

`src/lib/margem.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { margemPct } from './margem';

describe('margemPct', () => {
  it('calcula margem padrão', () => {
    expect(margemPct(100, 60)).toBe(40);
  });
  it('venda zero não divide por zero', () => {
    expect(margemPct(0, 50)).toBe(0);
  });
  it('custo acima da venda dá margem negativa', () => {
    expect(margemPct(100, 130)).toBeCloseTo(-30);
  });
});
```

```bash
npm test
# ✓ src/lib/margem.test.ts (3 tests)  — exit code 0
```

Disciplina de evidência: antes de confiar no verde, **prove que o teste consegue falhar** — troque `toBe(40)` por `toBe(41)`, veja o vermelho, desfaça. Teste que nunca ficou vermelho na sua frente não provou nada; pode estar testando o arquivo errado, ou nada.

### No CI

`.github/workflows/ci.yml` (o módulo 07 expande):

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm test
```

`vitest run` (sem watch) é obrigatório no CI — `vitest` puro fica em watch mode e o job trava até o timeout.

## Por que cai em entrevista

"Como você configura testes num projeto novo?" separa quem já fez de quem leu a respeito. A resposta forte não é a lista de comandos — é a ordem do raciocínio: extrair lógica pura primeiro, testar o barato, provar que o teste falha, só então plugar no CI.

> **P:** "Você tem um projeto React sem nenhum teste. Por onde começa?"
>
> **R (30s):** "Não começo instalando ferramenta — começo achando a lógica pura de maior risco, geralmente cálculo financeiro que vive inline em componente. Extraio pra uma função sem I/O, instalo Vitest — que num projeto Vite usa o mesmo pipeline do app, config quase zero — e escrevo três casos: o feliz e duas bordas. Antes de confiar no verde, quebro o teste de propósito pra provar que ele detecta falha. Depois ligo `vitest run` no GitHub Actions pra virar gate de merge. Um teste que bloqueia PR vale mais que cinquenta que ninguém roda."

> **P:** "Qual a estrutura de um bom teste unitário?"
>
> **R (30s):** "Sigo o Arrange-Act-Assert, que é a versão enxuta do Four-Phase Test do Meszaros: arranjo o input conhecido, executo o código sob teste numa linha, e afirmo a saída — cada fase separada e legível como uma frase, 'dado isto, quando faço aquilo, espero isto'. Quando as fases se misturam num bloco só, o teste vira o smell Obscure Test: passa a ser difícil de ler e frágil de manter. E o teste tem que ser determinístico e isolado — mesma entrada, mesma saída, sem depender de banco, relógio ou de outro teste. Essa anatomia não é do Vitest; é a linhagem xUnit que o Kent Beck fundou lá no SUnit."

## Checkpoint

- [ ] Instalei Vitest num projeto Vite real e `npm test` sai com exit code 0
- [ ] Extraí um cálculo inline pra função pura em `src/lib/` e o teste cobre 1 caso feliz + 2 bordas
- [ ] Escrevo cada teste em Arrange-Act-Assert, com as fases separadas e legíveis
- [ ] Quebrei o teste de propósito e vi o vermelho antes de confiar no verde
- [ ] Sei explicar a diferença entre `vitest` e `vitest run` e por que o CI exige o segundo
- [ ] O teste roda no GitHub Actions e um PR com teste quebrado fica bloqueado

## Recursos

- Kent Beck — *Simple Smalltalk Testing: With Patterns* (~1994): a origem do SUnit e da família xUnit
- Gerard Meszaros — *xUnit Test Patterns: Refactoring Test Code* (2007): o "Four-Phase Test" e o smell "Obscure Test"
- Bill Wake — *3A: Arrange, Act, Assert* (2001): a forma enxuta da anatomia do teste
- Vitest — docs oficiais (vitest.dev): "Getting Started" e "Writing Tests" (API `test`/`expect`, `describe`, `beforeEach`) — leitura do SYLLABUS
- Testing Library (testing-library.com): para quando evoluir de função pura pra componente
