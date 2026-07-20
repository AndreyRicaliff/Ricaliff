# 02 — Primeiro Teste com Vitest

## O que é

**Vitest** é o test runner nativo do ecossistema Vite: usa o mesmo pipeline de transformação do seu app (esbuild, aliases, `tsconfig`), então um projeto Vite/React não precisa de configuração paralela de Babel/Jest — o teste roda no mesmo mundo do código. API compatível com Jest (`describe/it/expect`), watch mode instantâneo por HMR, e roda TypeScript e ESM sem transpile extra. Em 2026 é o padrão de fato pra projetos Vite; Jest continua dominante em legado e React Native.

O que um teste unitário é, mecanicamente: uma função que **chama seu código com input conhecido e afirma o output esperado**. Se a afirmação falha, o runner sai com exit code ≠ 0 — e é esse exit code que o CI usa pra bloquear merge. Teste é isso: uma afirmação executável com consequência.

Ponto de método (fio da trilha): o primeiro teste de um projeto deve mirar **função pura de cálculo** — determinística, sem I/O. É onde o teste custa menos e prova mais. Testar componente React no dia 1 é começar pelo caro.

### Passo a passo: Vitest num app do Cliente Varejo

Dashboard Vite + React do Cliente Varejo (varejo de eletrônicos multi-loja), com um cálculo de margem que hoje vive inline no componente.

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

## Checkpoint

- [ ] Instalei Vitest num projeto Vite real e `npm test` sai com exit code 0
- [ ] Extraí um cálculo inline pra função pura em `src/lib/` e o teste cobre 1 caso feliz + 2 bordas
- [ ] Quebrei o teste de propósito e vi o vermelho antes de confiar no verde
- [ ] Sei explicar a diferença entre `vitest` e `vitest run` e por que o CI exige o segundo
- [ ] O teste roda no GitHub Actions e um PR com teste quebrado fica bloqueado

## Recursos

- [Vitest — docs oficiais](https://vitest.dev/)
- [Vitest: Getting Started](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/) — para quando evoluir de função pura pra componente
- [actions/setup-node](https://github.com/actions/setup-node) — cache de npm no CI
