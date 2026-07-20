# 03 — Testar Lógica de Negócio

## O que é

Lógica de negócio é o código que codifica uma **regra do domínio** — comissão por faixa, agrupamento de DRE, ranking de vendedores, rateio de custo. É o código mais valioso do app (erro aqui vira dinheiro errado na tela do cliente) e, paradoxalmente, o que mais aparece enterrado dentro de componente React, misturado com fetch e JSX — onde é intestável.

O movimento central deste módulo é um refactor de arquitetura disfarçado de técnica de teste: **extrair a regra pra função pura** — mesma entrada → mesma saída, zero I/O, zero `Date.now()` interno, zero `supabase.from()`. A testabilidade é o *sintoma* de um design bom; a causa é a separação entre decidir (puro) e efetuar (I/O). Padrão conhecido como *functional core, imperative shell*.

Caso real da AG: no dashboard do Cliente Varejo, dois apps mostravam totais de venda diferentes para o mesmo período. Uma das causas: **fórmulas homônimas** — dois trechos de código chamados "total de vendas" com regras de arredondamento e filtro de status diferentes. Se a fórmula fosse UMA função pura importada pelos dois, a divergência seria impossível por construção. Teste aqui não é só verificação — é forçar a existência de uma fonte única da regra.

### Passo a passo: comissão por faixa do Cliente Varejo

Regra: 2% até R$ 10k vendidos no mês; 3% no que passar de 10k; venda cancelada não conta.

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

### Tabela de casos: o teste é a especificação

Antes de escrever `expect`, escreva a tabela. Ela força as perguntas que o código inline nunca respondeu — e as lacunas dela são **perguntas pro cliente, não suposições suas** (regra de negócio ausente = pausar e perguntar, não inventar):

| Caso | Input | Esperado | Por quê |
|---|---|---|---|
| vazio | `[]` | 0 | mês sem venda |
| só faixa 1 | ok 8.000 | 160 | 2% |
| exatamente no corte | ok 10.000 | 200 | borda: 10k ainda é faixa 1 |
| cruza a faixa | ok 15.000 | 350 | 200 + 3% de 5k |
| cancelada não conta | ok 10k + cancelada 5k | 200 | filtro de status |
| centavos | ok 10.000,01 | 200,00 | arredondamento no limite |

```ts
// src/lib/comissao.test.ts
import { it, expect } from 'vitest';
import { comissao } from './comissao';

it.each([
  [[], 0],
  [[{ valor: 8000, status: 'ok' }], 160],
  [[{ valor: 10000, status: 'ok' }], 200],
  [[{ valor: 15000, status: 'ok' }], 350],
  [[{ valor: 10000, status: 'ok' }, { valor: 5000, status: 'cancelada' }], 200],
] as const)('comissao(%j) = %d', (vendas, esperado) => {
  expect(comissao([...vendas])).toBe(esperado);
});
```

Mesmo padrão vale pro pipeline DRE/DFC do Pulsar Finance: o mapeamento conta→grupo do DRE é uma função pura `classificar(lancamento): GrupoDRE`, e a tabela de casos vira o contrato revisável com o financeiro do cliente.

### Property-based: o conceito

Teste por exemplo prova casos que você **imaginou**. Property-based testing (lib: `fast-check`) gera centenas de inputs aleatórios e verifica **invariantes** — propriedades que valem pra qualquer entrada: `comissao(vendas) >= 0`; adicionar uma venda cancelada nunca muda o resultado; comissão cresce monotonicamente com o total. Quando uma propriedade falha, a lib *encolhe* o input até o menor contra-exemplo. Não substitui a tabela — complementa: a tabela documenta a regra, as propriedades caçam a borda que você não imaginou. Vale o custo em cálculo financeiro; raramente em UI.

## Por que cai em entrevista

"Como você testaria esse cálculo?" é pretexto: o entrevistador quer ver se você **separa lógica de I/O** e se pensa em borda antes do caso feliz. Responder "extraio pra função pura e começo pela tabela de bordas" sinaliza design, não só ferramenta.

> **P:** "Testar cálculo de comissão que hoje está dentro de um componente React — como faz?"
>
> **R (30s):** "Primeiro extraio a regra pra função pura — entrada: lista de vendas; saída: número; zero fetch, zero data interna. Isso já paga sozinho: tive um caso real de dois dashboards divergindo porque a 'mesma' fórmula existia em dois lugares com arredondamentos diferentes. Depois escrevo a tabela de casos antes dos asserts — vazio, exatamente no corte da faixa, cancelada, centavos no limite. As lacunas da tabela viram pergunta pro cliente, não suposição minha. Se o cálculo for crítico, fecho com propriedades no fast-check: comissão nunca negativa, cancelada nunca altera resultado."

## Checkpoint

- [ ] Extraí uma regra real (comissão/DRE/ranking) de dentro de componente pra função pura
- [ ] Escrevi a tabela de casos ANTES dos asserts, com pelo menos 2 bordas não-óbvias
- [ ] Identifiquei 1 pergunta de regra de negócio que a tabela expôs e que eu não sabia responder
- [ ] Sei explicar *functional core, imperative shell* em 2 frases
- [ ] Sei citar 2 invariantes do meu cálculo que um property-based test verificaria

## Recursos

- [fast-check](https://fast-check.dev/) — property-based testing em TS/JS
- [Vitest `it.each`](https://vitest.dev/api/) — testes em tabela
- [Functional Core, Imperative Shell — Gary Bernhardt (Destroy All Software)](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
- Kent Beck — "Test Desiderata" (buscar pelo título; propriedades de um bom teste)
