# 01 — Escopo e Fatiamento

## O que é

Escopo é o contrato do que será entregue. Fatiamento é a arte de quebrar esse contrato em pedaços que **entregam valor sozinhos**. Três conceitos técnicos sustentam isso:

**MVP de verdade** (Eric Ries, *Lean Startup*, 2011): o mínimo produto **viável** — a menor versão que responde uma pergunta de negócio com usuário real. Não é "versão capada com metade das telas"; é o experimento mais barato que valida ou refuta a hipótese. Se o cliente quer "ver as vendas por loja", o MVP é UM número certo na tela dele, não um dashboard com 8 abas vazias.

**Walking skeleton** (Alistair Cockburn): a menor implementação ponta-a-ponta que atravessa TODAS as camadas — front → API → banco → deploy. Feio, mínimo, mas de pé e em produção. O valor é de-riscar cedo: os problemas caros (auth, CORS, RLS, deploy, credencial do ERP-externo) aparecem no dia 1, não na véspera da entrega.

**Fatia vertical vs horizontal**: fatia horizontal é "primeiro todo o banco, depois toda a API, depois todo o front" — três semanas sem nada demonstrável e integração big-bang no final, onde tudo quebra junto. Fatia vertical é "uma feature completa, das três camadas, por vez". O famoso dado do CHAOS Report (Standish) de que ~64% das features raramente ou nunca são usadas é metodologicamente contestado — e citar isso com a ressalva é exatamente o hábito sênior: **o número exato é duvidoso, o fenômeno (construímos demais) é amplamente observado**. Não afirme com confiança o que você não verificou.

### Anti big-bang: por que integração tardia sempre dói

Cada camada construída isolada acumula suposições não testadas sobre as outras. Integração no final = todas as suposições cobradas de uma vez. No sync do ERP-externo da AG isso apareceu na prática: paginação, rate-limit e formato de data só revelaram seus problemas quando o pipeline rodou inteiro contra dados reais — por isso o esqueleto ponta-a-ponta veio antes de qualquer refinamento.

### Passo a passo: fatiar um dashboard em entregas de 1 dia

Cenário real (codinome): dashboard comercial do **Cliente Varejo** (varejo multi-loja).

```bash
# Dia 1 — walking skeleton: login + 1 KPI real, EM PRODUÇÃO
git checkout -b feat/skeleton
# uma página, uma query agregada, deploy
npx vercel --prod
# critério de pronto: o dono abre a URL e vê o faturamento do mês — número REAL
```

```text
Dia 2 — filtro de período (global, afeta o KPI existente)
Dia 3 — ranking de vendedores (nova fatia vertical: query + tabela + estado)
Dia 4 — comparativo por loja
Dia 5 — drill-down até o registro
```

Regra de corte de cada fatia: **demonstrável ao cliente em produção no fim do dia**. Se a fatia planejada não fecha em 1 dia, ela está grande — fatie de novo (por loja, por período, por tipo de dado), nunca por camada.

## Por que cai em entrevista

Entrevistador de pleno quer saber se você entrega valor incremental ou some por três semanas e volta com um big-bang. "Como você quebraria essa feature?" é pergunta clássica de system design comportamental — quem responde com fatias verticais e critério de pronto demonstrável passa o filtro; quem responde "primeiro modelo o banco todo" não.

> **P:** "Te dou um dashboard de vendas pra entregar em uma semana. Como você organiza o trabalho?"
>
> **R (30s):** "Primeiro dia eu subo um walking skeleton: login, uma query agregada e um KPI real em produção — isso de-risca auth, deploy e acesso ao dado de uma vez. Daí em diante, uma fatia vertical por dia: filtro de período, ranking, comparativo por loja — cada uma demonstrável no fim do dia. Fiz assim num dashboard multi-loja real: o cliente viu número verdadeiro no dia 1, e os problemas de integração apareceram cedo, quando eram baratos."

## Checkpoint

- [ ] Sei explicar a diferença entre MVP de verdade e "versão capada" com um exemplo
- [ ] Consigo definir walking skeleton e dizer O QUE ele de-risca
- [ ] Fatiei uma feature real em fatias verticais de ≤ 1 dia, cada uma com critério de pronto demonstrável
- [ ] Identifico fatia horizontal disfarçada ("primeiro o CRUD inteiro") e reformulo em vertical
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30s

## Recursos

- *Lean Startup* — Eric Ries (cap. sobre MVP)
- [Shape Up — Basecamp](https://basecamp.com/shapeup) — livro gratuito online; apetite fixo, escopo variável
- Alistair Cockburn — conceito original de walking skeleton (buscar "Cockburn walking skeleton")
- Mike Cohn — padrão SPIDR para fatiar user stories (Mountain Goat Software)
- [Martin Fowler — bliki](https://martinfowler.com/bliki/) — verbetes sobre entrega incremental
