# 01 — Pirâmide de Testes

## O que é

Modelo proposto por Mike Cohn (~2009) e popularizado por Martin Fowler: a suíte de testes saudável tem **muitos testes unitários** na base, **alguns de integração** no meio e **poucos end-to-end (e2e)** no topo. A forma não é estética — é consequência de dois eixos que crescem juntos conforme você sobe: **custo** (escrever, rodar, manter) e **fidelidade** (o quanto o teste prova sobre o sistema real).

- **Unit**: testa uma função/classe isolada, sem I/O. Roda em milissegundos, milhares por segundo. Prova que a *lógica* está certa — e nada mais. Um cálculo de comissão perfeito não prova que o botão que o dispara existe.
- **Integration**: testa duas ou mais peças conversando de verdade — sua query contra um Postgres real, sua API route com o banco de teste. Roda em segundos. Prova que os *contratos entre peças* batem (nomes de coluna, tipos, RLS).
- **E2E**: navegador real, app inteiro, do clique ao banco. Roda em dezenas de segundos, quebra por mil motivos que não são bug (timeout, seletor, rede). Prova que o *fluxo do usuário* funciona — a única camada que prova isso.

O raciocínio de engenheiro aqui é de **evidência**: cada nível é um instrumento que prova uma coisa específica. Confundir os instrumentos gera os dois erros clássicos: suíte 100% unit que passa verde enquanto a produção quebra num nome de coluna, e suíte 100% e2e que leva 40 minutos e falha aleatoriamente até o time ignorá-la.

### Onde a pirâmide inverte em app CRUD

Nos apps AG típicos (dashboard React + Supabase, pouca lógica própria, muito fluxo dado-pra-tela), a base da pirâmide fica magra por um motivo honesto: **quase não há lógica pura pra testar**. Um componente que faz `select` e renderiza tabela não tem unidade interessante — o risco mora nos contratos (schema, RLS, filtro) e no fluxo. Kent C. Dodds formalizou isso como **Testing Trophy**: em app web CRUD, o miolo (integration) é onde cada teste compra mais confiança por real gasto.

Regra prática AG:

| Tipo de código | Nível dominante |
|---|---|
| Cálculo (comissão, DRE/DFC, ranking) | Unit — extrair pra função pura primeiro |
| Query + RLS multi-tenant | Integration contra banco real de teste |
| Fluxo crítico (login, lançamento, sync) | E2E — 3 a 8 testes, não 80 |
| UI exploratória / layout | Olho + review — teste aqui vira manutenção pura |

### Passo a passo: inventariar o Pulsar Finance

Antes de escrever qualquer teste, um sênior mede onde o risco mora — hipótese antes de ferramenta:

```bash
cd C:\Projetos\pulsar-finance   # exemplo
# 1. Onde está a lógica pura? (candidatos a unit)
grep -rn "function calc\|reduce(\|\.toFixed" src/lib src/utils

# 2. Onde estão os boundaries? (candidatos a integration)
grep -rln "supabase.from(" src | sort -u | wc -l

# 3. Quais fluxos derrubam o cliente se quebrarem? (candidatos a e2e)
#    → listar na mão: login, seleção de tenant, pipeline DRE. Fim.
```

O output desse inventário é uma tabela de 3 linhas no `DECISIONS.md`, não uma suíte. Escrever teste antes de saber o que precisa ser provado é atividade, não engenharia.

## Por que cai em entrevista

É a pergunta-filtro de testes: "como você decide o que testar?". Júnior responde "testo tudo" ou "uso Jest". Pleno responde com o modelo de custo×fidelidade e — ponto extra — sabe dizer *quando o modelo não se aplica* (CRUD → trophy). Citar a inversão mostra que você pensa, não recita.

> **P:** "Descreve a pirâmide de testes e como você a aplica nos seus projetos."
>
> **R (30s):** "Base unitária, meio integração, topo e2e — porque custo e fidelidade sobem juntos. Mas nos meus dashboards (React + Supabase) a pirâmide inverte pro formato troféu: quase não há lógica pura, o risco mora nos contratos com o banco e no RLS multi-tenant, então concentro em testes de integração contra um banco real. Unit eu reservo pros cálculos financeiros, que extraio pra funções puras. E2E só nos 4-5 fluxos que derrubam o cliente: login, troca de tenant, lançamento."

## Checkpoint

- [ ] Sei dizer em uma frase o que cada nível PROVA (lógica / contrato / fluxo)
- [ ] Sei explicar por que custo e fidelidade crescem juntos ao subir de nível
- [ ] Sei defender quando a pirâmide vira troféu e por quê
- [ ] Rodei o inventário (lógica pura / boundaries / fluxos críticos) em 1 projeto AG
- [ ] Consigo classificar qualquer arquivo de um projeto meu no nível de teste adequado

## Recursos

- [Test Pyramid — Martin Fowler](https://martinfowler.com/bliki/TestPyramid.html)
- [The Practical Test Pyramid — Ham Vocke (martinfowler.com)](https://martinfowler.com/articles/practical-test-pyramid.html)
- [The Testing Trophy — Kent C. Dodds](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- Google Testing Blog — artigo "Just Say No to More End-to-End Tests" (buscar pelo título)
