# 03 — Testar Lógica de Negócio

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Lógica de negócio é o código que codifica uma **regra do domínio** — comissão por faixa, agrupamento de DRE, ranking de vendedores. É o código mais valioso do app (erro aqui vira dinheiro errado na tela do cliente) e o que mais aparece enterrado em componente React, misturado com fetch e JSX — intestável ali. Este módulo é sobre o movimento que destrava o teste dessa lógica, e por que esse movimento é, no fundo, um **refactor de arquitetura disfarçado de técnica de teste**: extrair a regra pra função pura.

---

## § BASE — o fundamento

**Testabilidade é sintoma, não causa.** A intuição errada é "vou tornar esse código testável". A verdade é o contrário: **testabilidade é um *sintoma* de design bom.** A causa é separar **decidir** (a regra, pura) de **efetuar** (o I/O). Quando a regra está entrelaçada com `supabase.from()`, `Date.now()` e JSX, você não consegue testá-la porque ela não é uma unidade — é um novelo. Extrair a regra não é um truque para o teste; é reconhecer a fronteira que já deveria existir.

**O padrão que dá nome a isso: Functional Core, Imperative Shell.** **Gary Bernhardt** nomeou o padrão em *Functional Core, Imperative Shell* (screencast da série Destroy All Software, ~2012): o miolo do sistema é um **núcleo funcional** — funções puras, sem efeito, que dado um estado e uma entrada devolvem uma decisão — envolto por uma **casca imperativa** fina que faz o I/O (lê do banco, chama a API, escreve na tela) e apenas *entrega* dados ao núcleo e *executa* o que ele decidiu. O núcleo é trivial de testar (mesma entrada → mesma saída, milhares de casos por segundo); a casca é fina o bastante para ser coberta por poucos testes de integração. Você não testa "tudo junto"; você testa a decisão barato e a fiação de leve.

**Como isolar a regra do resto: Seams.** **Michael Feathers**, em *Working Effectively with Legacy Code* (2004), no capítulo **"Seams"**, dá a ferramenta conceitual: um **seam** é um ponto onde você pode alterar o comportamento do programa **sem editar naquele ponto** — a costura por onde você separa a lógica da dependência. Extrair `comissao(vendas)` para um módulo próprio cria um seam: agora o teste chama a regra diretamente, sem subir o componente, sem tocar no banco. Feathers cunhou a frase que organiza este módulo e o 07: código sem teste é legado justamente porque não tem seams — tudo está soldado, e nada pode ser exercitado isoladamente.

**Por que isso é caro de ignorar — caso real AG.** Dois dashboards do **Cliente Varejo** mostravam totais diferentes para o mesmo período. Uma das causas: **fórmulas homônimas** — dois trechos chamados "total de vendas" com arredondamento e filtro de status diferentes. Fosse **uma** função pura importada pelos dois, a divergência seria **impossível por construção**. Aqui o teste deixa de ser só verificação e vira o que força a **fonte única da regra**: existe um lugar, testado, de onde o número sai — e não dois lugares que discordam. (Este é o mecanismo "fórmula homônima" catalogado na skill `debug-divergencia-dados`.)

**A tabela de casos é a especificação.** Antes de escrever `expect`, escreva a tabela de entrada→esperado→porquê. Ela força as perguntas que o código inline nunca respondeu — e as lacunas são **perguntas pro cliente, não suposições suas**. "10.000 exatos é faixa 1 ou faixa 2?" é uma pergunta de negócio que a tabela expõe e o código escondia. A tabela também funciona como **memória externa**: as bordas que a memória de trabalho não segura (o clássico 7±2 de Miller, tratado na trilha 05) ficam registradas e revisáveis com o financeiro do cliente.

**Property-based testing: caçar a borda que você não imaginou.** Teste por exemplo prova casos que você **imaginou**. **Property-based testing** — introduzido por **Koen Claessen e John Hughes** no paper *QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs* (ICFP 2000) — vira o jogo: em vez de casos fixos, você declara **invariantes** (propriedades válidas para *qualquer* entrada) e a ferramenta gera centenas de inputs aleatórios tentando derrubá-las. A contribuição decisiva do QuickCheck, herdada por todas as libs modernas (em JS/TS, `fast-check`), é o **shrinking**: quando um input falha, a lib *encolhe* o contra-exemplo até o menor caso que ainda quebra — em vez de te entregar um array de 400 elementos, te entrega os 2 que importam. Invariantes de um cálculo de comissão: `comissao(vendas) >= 0`; venda cancelada nunca altera o resultado; a comissão cresce monotonicamente com o total. Não substitui a tabela — a tabela **documenta** a regra, as propriedades **caçam** a borda esquecida. Vale em cálculo financeiro; raramente em UI.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O padrão é uma casca fina de I/O em volta de um núcleo puro, e o teste ataca cada anel com o instrumento certo:

```
        ╭──────────── IMPERATIVE SHELL (casca) ────────────╮
        │  supabase.from()   fetch()   Date.now()   JSX     │  ← I/O, efeito
        │        │  entrega dados        executa decisão  ▲  │     poucos testes
        │        ▼                                        │  │     de integração
        │   ╭───────── FUNCTIONAL CORE (núcleo) ─────────╮ │  │
        │   │  comissao(vendas)  classificar(lancamento) │ │  │  ← pura, sem I/O
        │   │  mesma entrada → mesma saída                │ │  │     MUITOS testes
        │   ╰─────────────────────────────────────────────╯ │  │     unit (barato)
        ╰───────────────────────────────────────────────────╯

  O SEAM (Feathers) é a linha entre casca e núcleo — a costura por onde
  o teste entra sem subir o app inteiro.

  Como o núcleo é testado:
     tabela de casos ──► os casos que você IMAGINOU (a especificação)
     propriedades   ──► a borda que você NÃO imaginou (QuickCheck/fast-check)
```

Dependência: primeiro existe o **seam** (a extração); só depois a **tabela** faz sentido (você tem uma função para tabular); só então **propriedades** rendem (você tem invariantes a declarar sobre uma função pura).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. IDENTIFICAR a regra enterrada.** Ache o `reduce`, o `filter`, o `Math.round` que decide um número de negócio dentro de um componente ou handler.

**2. EXTRAIR pra função pura** — entrada explícita, saída explícita, zero I/O (`Date.now()`, `supabase.from()`, `fetch`). Isso cria o seam.

**3. ESCREVER a tabela de casos ANTES dos asserts:** vazio, borda exata (o corte da faixa), o caso que não conta (cancelada), centavos no limite. Cada lacuna vira **pergunta pro cliente**.

**4. TRANSCREVER a tabela em `it.each`.** A tabela É a spec; o `it.each` é a spec executável.

**5. FECHAR cálculo crítico com propriedades** — 2 a 3 invariantes no `fast-check`, para a borda que a tabela não previu.

**Anti-padrões:**
- **Testar a regra dentro do componente:** exige mock de fetch e render para provar uma conta. Extraia primeiro.
- **Pular a tabela e ir direto ao `expect`:** você testa o caso feliz que já sabia que funcionava e ignora as bordas — que é onde o bug mora.
- **Suposição de negócio disfarçada de teste:** afirmar "10.000 é faixa 2" sem confirmar com o cliente grava a suposição errada como verdade. Lacuna da tabela é pergunta, não chute (regra da casa: item 12 do checklist de pré-entrega).
- **Property-based em UI:** invariante de layout raramente existe; gasta esforço onde a tabela e o olho resolvem.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Regra de comissão do **Cliente Varejo**: 2% até R$ 10k no mês; 3% no que passar; cancelada não conta.

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

A tabela de casos — escreva ANTES do `expect`; as lacunas são perguntas pro cliente:

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

Mesmo padrão no pipeline DRE/DFC do Pulsar Finance: o mapeamento conta→grupo é uma função pura `classificar(lancamento): GrupoDRE`; a tabela de casos vira o contrato revisável com o financeiro do cliente. Feche com um property-based de 1 invariante (ex.: `comissao(vendas) >= 0` para qualquer lista) e veja o `fast-check` encolher o contra-exemplo se falhar.

## Por que cai em entrevista

"Como você testaria esse cálculo?" é pretexto: o entrevistador quer ver se você **separa lógica de I/O** e pensa em borda antes do caso feliz. "Extraio pra função pura e começo pela tabela de bordas" sinaliza design, não só ferramenta.

> **P:** "Como testar um cálculo de comissão que vive dentro de um componente React?"
>
> **R (30s):** "Primeiro extraio a regra pra função pura — entrada: lista de vendas; saída: número; zero fetch, zero data interna. Isso paga sozinho: já vi dois dashboards divergirem porque a 'mesma' fórmula existia em dois lugares com arredondamentos diferentes. Depois escrevo a tabela de casos antes dos asserts — vazio, corte exato da faixa, cancelada, centavos no limite. As lacunas da tabela viram pergunta pro cliente, não suposição minha. Cálculo crítico eu fecho com propriedades no fast-check."

> **P:** "Qual a diferença entre teste por exemplo e property-based, e quando usar cada um?"
>
> **R (30s):** "Teste por exemplo prova os casos que eu imaginei — a tabela de bordas que documenta a regra. Property-based, que vem do QuickCheck do Claessen e Hughes, faz o contrário: eu declaro invariantes tipo 'comissão nunca é negativa' ou 'cancelada não muda o total', e a lib gera centenas de inputs aleatórios tentando quebrar isso. O ouro do QuickCheck é o shrinking: quando acha uma falha, encolhe o input até o menor contra-exemplo, então em vez de um array de 400 itens eu recebo os 2 que importam. Um não substitui o outro — a tabela documenta, as propriedades caçam a borda que eu não previ. Uso em cálculo financeiro; em UI quase nunca vale."

## Checkpoint

- [ ] Extraí uma regra real (comissão/DRE/ranking) de componente pra função pura, criando um seam
- [ ] Escrevi a tabela de casos ANTES dos asserts, com pelo menos 2 bordas não-óbvias
- [ ] Identifiquei 1 pergunta de regra que a tabela expôs e eu não sabia responder
- [ ] Sei explicar *functional core, imperative shell* (Bernhardt) em 2 frases
- [ ] Sei citar 2 invariantes do meu cálculo e explicar o shrinking do QuickCheck

## Recursos

- Michael Feathers — *Working Effectively with Legacy Code* (2004): capítulo "Seams" (isolar a lógica do resto) — leitura obrigatória do módulo (SYLLABUS)
- Gary Bernhardt — *Functional Core, Imperative Shell* (screencast Destroy All Software): o padrão que dá nome à separação decidir/efetuar
- Koen Claessen & John Hughes — *QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs* (ICFP 2000): a origem do property-based testing e do shrinking
- fast-check (fast-check.dev): property-based testing em TS/JS
- Kent Beck — *Test Desiderata* (ensaio): as propriedades de um bom teste (isolado, rápido, determinístico)
