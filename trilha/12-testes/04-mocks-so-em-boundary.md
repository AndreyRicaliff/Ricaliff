# 04 — Mocks Só em Boundary

## O que é

Mock (dublê de teste, no guarda-chuva de *test doubles*: stub, fake, spy, mock) é um objeto que substitui uma dependência real durante o teste. A regra desta trilha — **mock só em boundary** — define ONDE isso é legítimo: nas fronteiras do seu sistema com o mundo que você não controla. Supabase, ERP-externo, `fetch`, relógio (`Date.now`), filesystem. Dentro do seu próprio código: nunca.

O porquê é de design, não de estilo. Quando você precisa de `vi.mock('../services/calculo')` pra testar um módulo interno, o teste está gritando que **o módulo conhece demais o vizinho** — acoplamento. E mock de módulo interno congela a *implementação*: refatorou a estrutura interna sem mudar comportamento, o teste quebra. Isso inverte o propósito da suíte — o módulo 07 mostra que teste existe pra **permitir** refactor; teste acoplado a implementação **impede** refactor. É o smell que a literatura chama de teste "change detector".

A distinção clássica (Martin Fowler, "Mocks Aren't Stubs"): testar **estado** ("dado X, saiu Y") sobrevive a refactor; testar **interação** ("verificou que chamou `metodoInterno()` 2 vezes") quebra com qualquer reorganização. Em boundary, testar interação é legítimo — "enviou o request certo pro ERP-externo" É o comportamento. Internamente, é grilhão.

### Onde mockar nos projetos AG

| Dependência | É boundary? | Estratégia |
|---|---|---|
| API do ERP-externo (sync CLIENTE OFICINA) | Sim | fixture de payload real + msw/stub de fetch |
| Cliente Supabase | Sim | mock fino do client OU banco local de teste (integração > mock) |
| `Date.now()` no cálculo de streak/período | Sim (relógio é I/O) | `vi.setSystemTime()` — ou melhor: `agora` como parâmetro |
| `src/lib/comissao.ts` chamado pela tela | **Não** | usar a função real — é pura, rápida, determinística |
| Componente filho no teste do pai | **Não** (via de regra) | renderizar de verdade; mock aqui esconde quebra de contrato |

Note a linha do relógio: a melhor solução nem é mock — é **injetar** (`function streak(commits, agora: Date)`). Dependência que dá pra injetar como parâmetro não precisa de framework de mock. Mock é o plano B; design é o plano A.

### Passo a passo: testar o sync do ERP-externo sem o ERP

O sync do CLIENTE OFICINA pagina a API do ERP-externo com retry/backoff. A lógica de decisão (o que fazer com cada página, quando desistir) é testável sem rede — mockando só o `fetch`:

```ts
// src/sync/erp.test.ts
import { it, expect, vi, afterEach } from 'vitest';
import { sincronizar } from './erp';
import pagina1 from './fixtures/erp-pagina-1.json';

afterEach(() => vi.restoreAllMocks());

it('rate limit 429 → backoff e re-tenta a MESMA página', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(new Response(null, { status: 429 }))
    .mockResolvedValueOnce(Response.json(pagina1));

  const r = await sincronizar({ delayBase: 0 }); // delay zero: teste não dorme
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(r.registros).toHaveLength(pagina1.itens.length);
});
```

### Fixtures honestas

`fixtures/erp-pagina-1.json` deve ser um **payload real capturado e anonimizado** — não um JSON que você digitou de memória. Fixture inventada testa sua imaginação: o ERP-externo real manda data como `"DD/MM/YYYY"` string, valor com vírgula, campo que às vezes vem `null` — exatamente o que sua fixture "bonita" omite e a produção não. Capture uma resposta real (log do sync, uma chamada manual), remova nome/documento/valores sensíveis preservando o *formato*, e commite. Regra de honestidade: se você nunca viu o payload, você **não sabe** o formato — verificar antes de afirmar vale pra fixture também. E quando o ERP mudar o contrato, a fixture fica stale: teste verde, produção quebrada — é o limite conhecido do mock, e o motivo de manter um smoke de integração real (módulo 05/07).

## Por que cai em entrevista

Mock é onde entrevistador separa quem testa de quem *entende* teste. A pergunta "o que você mocka?" tem resposta errada comum ("tudo que é lento") e resposta de pleno: critério de boundary + a consequência de acoplamento do mock interno.

> **P:** "Quando você usa mock e quando evita?"
>
> **R (30s):** "Mocko só boundary: rede, banco, relógio — o que não controlo. No sync de ERP que mantenho, mocko o fetch com fixtures capturadas de payload real anonimizado, porque fixture inventada testa minha imaginação, não o contrato. Módulo interno eu nunca mocko: se preciso mockar meu próprio código pra testar, isso é acoplamento — e o teste passa a travar refactor em vez de proteger. Quando dá, nem mocko: injeto a dependência — relógio como parâmetro em vez de `vi.setSystemTime`. Mock é plano B; design é o plano A."

## Checkpoint

- [ ] Sei listar os boundaries de um projeto AG real em menos de 1 minuto
- [ ] Sei explicar por que mock de módulo interno trava refactor (estado × interação)
- [ ] Tenho 1 fixture capturada de payload real (anonimizada), não digitada de memória
- [ ] Refatorei um teste que usava `vi.setSystemTime` pra receber `agora` como parâmetro
- [ ] Sei citar o limite do mock: fixture stale = verde mentiroso quando o contrato externo muda

## Recursos

- [Mocks Aren't Stubs — Martin Fowler](https://martinfowler.com/articles/mocksArentStubs.html)
- [Vitest — Mocking](https://vitest.dev/guide/mocking.html)
- [MSW (Mock Service Worker)](https://mswjs.io/) — intercepta na camada de rede, não no import
- Justin Searls — talk "Please don't mock me" (buscar pelo título)
