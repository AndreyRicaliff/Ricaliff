# 03 — Testar Lógica de Negócio

## O que é

Lógica de negócio é o código que codifica uma **regra do domínio** — comissão por faixa, agrupamento de DRE, ranking de vendedores. É o código mais valioso do app — erro aqui vira dinheiro errado na tela do cliente — e o que mais aparece enterrado em componente React, misturado com fetch e JSX — intestável ali.

O movimento central é um refactor de arquitetura disfarçado de técnica de teste: **extrair a regra pra função pura** — mesma entrada → mesma saída, zero I/O, `Date.now()` ou `supabase.from()`. Testabilidade é *sintoma* de design bom; a causa é separar decidir (puro) de efetuar (I/O) — o padrão *functional core, imperative shell*.

Caso real da AG: dois dashboards do Cliente Varejo mostravam totais diferentes pro mesmo período. Uma das causas: **fórmulas homônimas** — dois trechos chamados "total de vendas" com arredondamento e filtro de status diferentes. Fosse UMA função pura importada pelos dois, a divergência seria impossível por construção. Teste aqui não é só verificação — é forçar fonte única da regra.

### Passo a passo: comissão por faixa do Cliente Varejo

Regra: 2% até R$ 10k no mês; 3% no que passar; cancelada não conta.

```ts
// src/lib/comissao.ts
export type Venda = { valor: number; status: 'ok' | 'cancelada' };

export function comissao(vendas: Venda[]): number {
  const total = vendas
    .filter(v => v.status === 'ok')
    .reduce((s, v) => s + v.valor, 0);
  const faixa1 = Math.min(total, 10_000) * 0.02;
  const faixa2 = Math.max(total - 10_000, 0) * 0.03;
  return Math.round((faixa1 + faixa2) * 100) / 100;
}
```

### A tabela de casos é a especificação

Antes de escrever `expect`, escreva a tabela. Ela força as perguntas que o código inline nunca respondeu — e as lacunas são **perguntas pro cliente, não suposições suas**:

| Caso | Input | Esperado | Por quê |
|---|---|---|---|
| vazio | `[]` | 0 | mês sem venda |
| exatamente no corte | ok 10.000 | 200 | borda: 10k ainda é faixa 1 |
| cruza a faixa | ok 15.000 | 350 | 200 + 3% de 5k |
| cancelada não conta | ok 10k + cancelada 5k | 200 | filtro de status |
| centavos | ok 10.000,01 | 200,00 | arredondamento |

```ts
// src/lib/comissao.test.ts
import { it, expect } from 'vitest';
import { comissao } from './comissao';

it.each([
  [[], 0],
  [[{ valor: 10000, status: 'ok' }], 200],
  [[{ valor: 15000, status: 'ok' }], 350],
  [[{ valor: 10000, status: 'ok' }, { valor: 5000, status: 'cancelada' }], 200],
] as const)('comissao(%j) = %d', (vendas, esperado) => {
  expect(comissao([...vendas])).toBe(esperado);
});
```

Mesmo padrão no pipeline DRE/DFC do Pulsar Finance: o mapeamento conta→grupo é uma função pura `classificar(lancamento): GrupoDRE`; a tabela de casos vira o contrato revisável com o financeiro do cliente.

### Property-based: o conceito

Teste por exemplo prova casos que você **imaginou**. Property-based testing (lib: `fast-check`) gera centenas de inputs aleatórios e verifica **invariantes** — propriedades válidas pra qualquer entrada: `comissao(vendas) >= 0`; cancelada nunca altera o resultado; comissão cresce com o total. Quando falha, a lib *encolhe* o input até o menor contra-exemplo. Não substitui a tabela: a tabela documenta a regra; as propriedades caçam a borda que você não imaginou. Vale em cálculo financeiro; raramente em UI.

## Por que cai em entrevista

"Como você testaria esse cálculo?" é pretexto: o entrevistador quer ver se você **separa lógica de I/O** e pensa em borda antes do caso feliz. "Extraio pra função pura e começo pela tabela de bordas" sinaliza design, não só ferramenta.

> **P:** "Como testar um cálculo de comissão que vive dentro de um componente React?"
>
> **R (30s):** "Primeiro extraio a regra pra função pura — entrada: lista de vendas; saída: número; zero fetch, zero data interna. Isso paga sozinho: já vi dois dashboards divergirem porque a 'mesma' fórmula existia em dois lugares com arredondamentos diferentes. Depois escrevo a tabela de casos antes dos asserts — vazio, corte exato da faixa, cancelada, centavos no limite. As lacunas da tabela viram pergunta pro cliente, não suposição minha. Cálculo crítico eu fecho com propriedades no fast-check."

## Checkpoint

- [ ] Extraí uma regra real (comissão/DRE/ranking) de componente pra função pura
- [ ] Escrevi a tabela de casos ANTES dos asserts, com pelo menos 2 bordas não-óbvias
- [ ] Identifiquei 1 pergunta de regra que a tabela expôs e eu não sabia responder
- [ ] Sei explicar *functional core, imperative shell* em 2 frases
- [ ] Sei citar 2 invariantes do meu cálculo pra um property-based test

## Recursos

- [fast-check](https://fast-check.dev/) — property-based testing em TS/JS
- [Vitest `it.each`](https://vitest.dev/api/) — testes em tabela
- [Functional Core, Imperative Shell — Gary Bernhardt](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
- Kent Beck — "Test Desiderata" (buscar pelo título)
