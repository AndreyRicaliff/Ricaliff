# 04 — Mocks Só em Boundary

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Mock é um objeto que substitui uma dependência real durante o teste. A regra deste módulo — **mock só em boundary** — define ONDE isso é legítimo: nas fronteiras com o mundo que você não controla (Supabase, ERP-externo, `fetch`, relógio). No seu próprio código, nunca. O porquê não é estilo; é design: mock de módulo interno é o sintoma de um teste que **congela a implementação** e passa a *impedir* o refactor em vez de proteger. Este módulo é o critério de fronteira e a taxonomia que o sustenta.

---

## § BASE — o fundamento

**A taxonomia dos test doubles.** "Mock" é usado no dia a dia como guarda-chuva, mas a nomenclatura precisa é de **Gerard Meszaros** (*xUnit Test Patterns*, 2007), que cunhou o termo genérico **Test Double** e separou cinco tipos:

- **Dummy** — objeto passado só para preencher parâmetro, nunca usado.
- **Stub** — devolve respostas prontas ("dado X, retorne Y"); serve o teste de **estado**.
- **Spy** — um stub que também **grava** como foi chamado, para você inspecionar depois.
- **Mock** — pré-programado com as chamadas que **espera** receber; falha o teste se a interação não bater. Serve o teste de **interação**.
- **Fake** — implementação funcional mas simplificada (um banco em memória, por exemplo).

Saber a distinção importa porque cada tipo prova uma coisa diferente, e usar o tipo errado gera o teste frágil.

**Estado × interação — a distinção de Fowler.** **Martin Fowler**, no ensaio *Mocks Aren't Stubs*, formaliza os dois estilos e a consequência de cada um. Teste de **estado** ("dado X, a saída foi Y") verifica o **resultado** — sobrevive a refactor, porque só olha o que entrou e o que saiu. Teste de **interação** ("o método `metodoInterno()` foi chamado 2 vezes") verifica **como** o resultado foi produzido — quebra com qualquer reorganização interna, mesmo sem mudança de comportamento. Fowler chama os dois campos de **classicista** (Detroit, verifica estado) e **mockista** (Londres, verifica interação). A síntese madura: **interação é legítima no boundary** — "enviou o request certo pro ERP-externo" *é* o comportamento observável, não há estado interno a inspecionar; **internamente, interação é grilhão**.

**Por que mock interno é acoplamento — e inverte o propósito da suíte.** Quando você precisa de `vi.mock('../services/calculo')` para testar um módulo, o teste está gritando que **o módulo conhece demais o vizinho**. Pior: o mock congela a *implementação*. Refatorou sem mudar comportamento? O teste quebra. Isso inverte a razão de existir da suíte: teste existe para **permitir** refactor (módulo 07); acoplado à implementação, ele **impede**. Meszaros cataloga esse teste como o smell **Fragile Test** (o "change detector": qualquer mudança no código o quebra, mesmo correta), e o parente **Overspecified Software** — o teste especifica *como*, não *o quê*, e vira uma segunda cópia da implementação que você agora tem que manter em sincronia.

**Design vence mock — a injeção de dependência.** A melhor solução muitas vezes nem é mock: é **injetar** a dependência. O relógio é I/O — `Date.now()` torna a função não-determinística. Em vez de `vi.setSystemTime()`, receba `agora` como parâmetro: `function streak(commits, agora: Date)`. O que dá pra injetar como parâmetro **dispensa framework de mock**, roda mais rápido e não acopla o teste a detalhe de mock. **Mock é plano B; design é plano A.**

**O limite conhecido do mock: fixture stale.** Todo mock de boundary tem uma fraqueza estrutural: ele congela o contrato externo no momento em que você o capturou. Se o ERP-externo muda o formato do payload, o mock continua devolvendo o formato antigo — **teste verde, produção quebrada**. Isso não é falha do mock; é o preço de isolar. É exatamente por isso que existe o **smoke de integração real** (módulos 05/07): uma vez em produção-espelho, sem mock, para pegar o drift que o mock por construção não vê.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O critério é geométrico: desenhe o anel entre o que você controla e o que não controla. Mock mora **no anel**, nunca dentro dele.

```
   ┌──────────────── MUNDO QUE VOCÊ NÃO CONTROLA ────────────────┐
   │  ERP-externo   Supabase   fetch/rede   Date.now()   FS       │
   │       ▲            ▲          ▲            ▲                   │
   │       │            │          │            │                   │
   ╞═══════╪════════════╪══════════╪════════════╪═══════════════════╡ ← BOUNDARY
   │       │            │          │            │      mock legítimo │   (mock/stub/
   │   ┌───┴────────────┴──────────┴────────────┴────┐             │    injeção aqui)
   │   │        SEU CÓDIGO (você controla)            │             │
   │   │  comissao()   classificar()   streak()       │  ← NUNCA    │
   │   │  chame o REAL: puro, rápido, determinístico   │    mockar  │
   │   └──────────────────────────────────────────────┘             │
   └────────────────────────────────────────────────────────────────┘

  estado (sobrevive a refactor)   ── use no seu código e em stubs de boundary
  interação (quebra com refactor) ── legítima SÓ no boundary ("mandou o request certo")
```

A pergunta única que decide: **"eu controlo essa dependência?"** Sim → use o código real. Não → é boundary, mock/stub/injeção. E entre injetar e mockar, prefira injetar.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. LISTAR os boundaries do projeto.** Rede, banco, relógio, filesystem, qualquer API de terceiro. Deve sair em menos de 1 minuto num projeto que você conhece.

**2. PERGUNTAR de cada dependência: "eu controlo isso?"** Se sim, o teste usa o real. Se não, é candidata a double.

**3. PREFERIR injeção a mock.** Dá pra receber como parâmetro (relógio, config)? Injete — dispensa framework e acopla menos.

**4. NO boundary, escolher o double certo:** stub para respostas prontas (teste de estado), mock/spy quando "chamou o endpoint certo com o payload certo" É o comportamento (teste de interação legítima).

**5. CAPTURAR fixture real e anonimizar.** Nunca digite o payload de memória — capture uma resposta real do ERP-externo, remova PII preservando o *formato*, commite.

**Anti-padrões:**
- **`vi.mock` do próprio módulo:** acoplamento; o teste vira change detector e trava refactor (Fragile Test, Meszaros).
- **Mockar "tudo que é lento":** critério errado — o critério é *boundary*, não latência. Sua função pura é rápida; use a real.
- **Fixture inventada:** testa sua imaginação, não o contrato. O ERP-externo real manda data `"DD/MM/YYYY"` como string, valor com vírgula, campo que às vezes vem `null` — exatamente o que a fixture "bonita" omite.
- **`vi.setSystemTime` onde caberia injeção:** design pior escondido de teste. Receba `agora` como parâmetro.

---

## Passo-a-passo aplicado (faça agora, ~25min)

O sync do **CLIENTE OFICINA** pagina a API do **ERP-externo** com retry/backoff. A lógica de decisão é testável sem rede — mockando só o `fetch` (boundary), com fixture de payload real anonimizado:

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

  const r = await sincronizar({ delayBase: 0 }); // teste não dorme
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(r.registros).toHaveLength(pagina1.itens.length);
});
```

Note que o teste é de **interação legítima** — verificar que o `fetch` foi chamado 2 vezes (backoff + retry) É o comportamento do boundary. `fixtures/erp-pagina-1.json` deve ser **payload real capturado e anonimizado**: remova nome/documento/valores preservando o formato (a vírgula decimal, a data como string, o campo que às vezes vem `null`). Se você nunca viu o payload, você **não sabe** o formato — verificar antes de afirmar vale pra fixture também. Depois: refatore um teste que usa `vi.setSystemTime` para receber `agora` como parâmetro e sinta a diferença de acoplamento.

## Por que cai em entrevista

Mock é onde entrevistador separa quem testa de quem *entende* teste. A pergunta "o que você mocka?" tem resposta errada comum ("tudo que é lento") e resposta de pleno: critério de boundary + a consequência de acoplamento do mock interno.

> **P:** "Quando você usa mock e quando evita?"
>
> **R (30s):** "Mocko só boundary: rede, banco, relógio — o que não controlo. No sync de ERP que mantenho, mocko o fetch com fixture capturada de payload real anonimizado — fixture inventada testa minha imaginação, não o contrato. Módulo interno nunca: se preciso mockar meu próprio código pra testar, isso é acoplamento, e o teste passa a travar refactor em vez de proteger. Quando dá, nem mocko: injeto a dependência — relógio como parâmetro em vez de `vi.setSystemTime`. Mock é plano B; design é o plano A."

> **P:** "Qual a diferença entre stub e mock, e por que isso muda a robustez do teste?"
>
> **R (30s):** "Na taxonomia do Meszaros, stub devolve resposta pronta e serve o teste de estado — 'dado X, a saída foi Y' — que só olha entrada e saída e por isso sobrevive a refactor. Mock é pré-programado com as chamadas que espera e verifica interação — 'chamou tal método duas vezes' — que quebra com qualquer reorganização interna, mesmo correta. Como o Fowler põe em 'Mocks Aren't Stubs': interação é legítima no boundary, onde 'mandei o request certo' É o comportamento observável; internamente vira change detector, o Fragile Test do Meszaros — o teste especifica *como* em vez de *o quê* e passa a impedir o refactor que deveria proteger."

## Checkpoint

- [ ] Sei listar os boundaries de um projeto AG real em menos de 1 minuto
- [ ] Sei nomear os 5 test doubles do Meszaros e dizer qual serve estado e qual serve interação
- [ ] Sei explicar por que mock de módulo interno trava refactor (Fragile Test / change detector)
- [ ] Tenho 1 fixture capturada de payload real (anonimizada), não digitada de memória
- [ ] Refatorei um teste que usava `vi.setSystemTime` pra receber `agora` como parâmetro
- [ ] Sei citar o limite do mock: fixture stale = verde mentiroso quando o contrato externo muda

## Recursos

- Martin Fowler — *Mocks Aren't Stubs* (ensaio): estado × interação, classicista × mockista — leitura obrigatória do módulo (SYLLABUS)
- Gerard Meszaros — *xUnit Test Patterns* (2007): a taxonomia Test Double (Dummy/Stub/Spy/Mock/Fake) e os smells "Fragile Test"/"Overspecified Software"
- Vitest — docs oficiais (vitest.dev): "Mocking" (`vi.fn`, `vi.mock`, `vi.useFakeTimers`)
- MSW / Mock Service Worker (mswjs.io): intercepta na camada de rede, não no import
- Justin Searls — talk *Please Don't Mock Me* (buscar pelo título): o custo do over-mocking
