# 01 — Pirâmide de Testes

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

A pirâmide de testes é o **mapa de onde investir esforço de teste**: muitos testes unitários na base, alguns de integração no meio, poucos end-to-end (e2e) no topo. Este módulo não é sobre ferramenta — é sobre o **critério** que decide em qual camada cada teste mora, por que a forma é piramidal e não retangular, e quando esse formato deixa de valer. Errar o critério gera os dois desastres clássicos da profissão: a suíte 100% unit que passa verde enquanto a produção quebra num nome de coluna, e a suíte 100% e2e que leva 40 minutos, falha por qualquer coisa e o time desliga.

---

## § BASE — o fundamento

**De onde vem a pirâmide.** O modelo foi cunhado por **Mike Cohn** em *Succeeding with Agile: Software Development Using Scrum* (2009), no capítulo sobre automação de testes, sob o nome **"test automation pyramid"**. A forma não é decoração: ela codifica uma lei econômica. Conforme você sobe a pirâmide, **dois eixos crescem juntos** — o **custo** (escrever, rodar, manter cada teste) e a **fidelidade** (o quanto o teste prova sobre o sistema real rodando). A base é barata e de baixa fidelidade (prova lógica isolada); o topo é caro e de alta fidelidade (prova o sistema inteiro). A pirâmide é larga embaixo porque é lá que o custo por unidade de confiança é menor.

**A leitura canônica.** **Ham Vocke**, em *The Practical Test Pyramid* (ensaio em martinfowler.com, 2018), deu o tratamento operacional que a maioria dos times usa hoje. O ponto central de Vocke, quase sempre esquecido: **os nomes das camadas importam menos que a proporção e a velocidade do feedback.** Discutir se um teste é "de integração" ou "de serviço" é perda de tempo; o que importa é que a maior parte da sua confiança venha de testes que rodam rápido e isolam a falha, e a menor parte de testes lentos que provam o fluxo. Vocke também é explícito: escreva testes em camadas diferentes, mas **não duplique** a mesma verificação em três níveis — cada nível prova algo que o de baixo não consegue.

**O que cada nível PROVA — a lógica de evidência.** O raciocínio de engenheiro aqui é o mesmo do módulo de hipótese e refutação: cada nível é um **instrumento que prova uma coisa específica**, e confundir os instrumentos é erro de método.

- **Unit** testa uma função/classe isolada, sem I/O. Roda em milissegundos, milhares por segundo. Prova que a *lógica* está certa — e nada mais. Um cálculo de comissão perfeito não prova que o botão que o dispara existe.
- **Integration** testa duas ou mais peças conversando de verdade — a query contra um Postgres real, a API route com o banco de teste. Roda em segundos. Prova que os *contratos entre peças* batem: nomes de coluna, tipos, RLS.
- **E2E** dirige o navegador real, app inteiro, do clique ao banco. Roda em dezenas de segundos e quebra por mil motivos que não são bug (timeout, seletor, rede). Prova que o *fluxo do usuário* funciona — a única camada que prova isso.

**O dado que sustenta a proporção.** O **Google Testing Blog**, em *Just Say No to More End-to-End Tests* (Mike Wacker, 2015), recomendou explicitamente uma divisão de **~70% unit / 20% integration / 10% e2e** e documentou o mecanismo de falha do excesso de e2e: uma suíte top-heavy fica tão lenta e tão flaky que a equipe para de confiar nela, começa a dar re-run no vermelho e no fim volta ao teste manual — o investimento em automação é queimado. Esse é o argumento empírico contra a **pirâmide invertida** (o "cone de sorvete").

**Quando a pirâmide vira troféu.** **Kent C. Dodds**, em *The Testing Trophy* (2018), fez a ressalva que vale para os apps AG: em app web CRUD — muito I/O, pouca lógica própria (um `select` que vira tabela na tela) — quase não existe unidade interessante a testar. O risco não mora na lógica pura; mora nos **contratos** (schema, RLS, filtro) e no **fluxo**. Nesse contexto o miolo (integration) é onde cada teste compra mais confiança por real gasto, e a forma ótima engorda no meio: um **troféu**, não uma pirâmide. Isto é um *refinamento dependente de contexto*, não uma contradição — a pirâmide continua valendo onde há lógica; o formato segue o risco.

**A incerteza declarada.** A pirâmide é uma **heurística de alocação de risco, não uma lei da natureza.** A proporção "certa" depende de onde o risco vive no seu app, e o próprio Vocke pede para não idolatrar os números. Trate 70/20/10 como ponto de partida a ajustar pela medição, não como meta a bater.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O modelo tem dois eixos e uma regra de roteamento. Sobe o eixo → sobe custo E fidelidade juntos:

```
              ▲ custo por teste ↑   fidelidade ↑
             ╱ E2E ╲          poucos  — prova o FLUXO (clique→banco→tela)
            ╱───────╲
           ╱ INTEGR. ╲        alguns  — prova o CONTRATO (schema, RLS, tipos)
          ╱───────────╲
         ╱    UNIT      ╲      muitos  — prova a LÓGICA (função pura)
        ╰───────────────╯
                 ▼ velocidade de feedback ↑ (base roda em ms)

  App CRUD (pouca lógica pura) → o TROFÉU: o meio engorda
        ╱E2E╲
       ╱─────╲
     ╱ INTEGR. ╲   ← camada dominante: contrato/RLS é onde mora o risco
       ╲─────╱
        ╲UNIT╱      ← fino: só os cálculos, extraídos pra função pura
```

A decisão de projeto é uma só, aplicada peça a peça: **classifique cada trecho de código por onde mora o risco dele, e roteie para a camada mais barata que prova esse risco.**

| Tipo de código | Nível dominante |
|---|---|
| Cálculo (comissão, DRE/DFC, ranking) | Unit — extrair pra função pura primeiro |
| Query + RLS multi-tenant | Integration contra banco real de teste |
| Fluxo crítico (login, lançamento, sync) | E2E — 3 a 8 testes, não 80 |
| UI exploratória / layout | Olho + review — teste aqui vira manutenção pura |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. INVENTARIAR onde mora cada tipo de código.** Antes de escrever qualquer teste, um sênior mede o risco — hipótese antes de ferramenta. Onde está a lógica pura (candidata a unit)? Onde estão os boundaries (candidatos a integration)? Quais fluxos derrubam o cliente se quebrarem (candidatos a e2e)?

**2. CLASSIFICAR cada peça pelo risco.** O risco de um cálculo de comissão é "conta errada = dinheiro errado" → unit. O risco de uma query multi-tenant é "vaza dado de outro cliente" → integration com banco real. O risco do login é "ninguém entra" → e2e.

**3. ROTEAR para a camada mais barata que prova o risco.** Nunca use e2e para provar o que um unit prova em 3ms. E2E é o instrumento mais caro; reserve-o para o que só ele consegue provar (o fluxo inteiro).

**4. ESCREVER o mínimo que cobre o risco, não o máximo que a ferramenta permite.** Cinco fluxos e2e num smoke de 2 minutos protegem mais que 80 e2e que o time aprende a ignorar.

**5. VIGIAR a proporção como sintoma.** Se a contagem de e2e cresce, pergunte por que as camadas de baixo não estão pegando aquilo — quase sempre há lógica misturada com I/O que deveria ter sido extraída e testada barato.

**Anti-padrões:**
- **Cone de sorvete (pirâmide invertida):** tudo em e2e. Lento, flaky, o time desliga — o modo de falha documentado pelo Google.
- **100% unit com prod quebrada:** a suíte verde não testa nenhum contrato; o bug de nome de coluna passa reto porque nenhum teste toca o banco de verdade.
- **Duplicar a mesma asserção em três níveis:** paga o custo de manutenção de três testes para a confiança de um. Cada nível deve provar o que o de baixo não prova (Vocke).
- **Cargo-cult da proporção:** perseguir 70/20/10 sem medir onde o risco mora. O formato segue o risco, não o slide.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Inventarie um projeto AG real antes de escrever um único teste — o output é uma tabela de 3 linhas no `DECISIONS.md`, não uma suíte:

```bash
cd C:\Projetos\pulsar-finance   # exemplo
# 1. Onde está a lógica pura? (candidatos a unit)
grep -rn "function calc\|reduce(\|\.toFixed" src/lib src/utils

# 2. Onde estão os boundaries? (candidatos a integration)
grep -rln "supabase.from(" src | sort -u | wc -l

# 3. Quais fluxos derrubam o cliente se quebrarem? (candidatos a e2e)
#    → listar na mão: login, seleção de tenant, pipeline DRE. Fim.
```

Escrever teste antes de saber o que precisa ser provado é atividade, não engenharia. Feche o exercício classificando cada arquivo que apareceu no nível de teste adequado e anotando a proporção-alvo do projeto (não precisa ser 70/20/10 — precisa seguir o risco).

## Por que cai em entrevista

É a pergunta-filtro de testes: "como você decide o que testar?". Júnior responde "testo tudo" ou "uso Jest". Pleno responde com o modelo de custo×fidelidade e — ponto extra — sabe dizer *quando o modelo não se aplica* (CRUD → trophy). Citar a inversão mostra que você pensa, não recita.

> **P:** "Descreve a pirâmide de testes e como você a aplica nos seus projetos."
>
> **R (30s):** "Base unitária, meio integração, topo e2e — porque custo e fidelidade sobem juntos. Mas nos meus dashboards (React + Supabase) a pirâmide inverte pro formato troféu: quase não há lógica pura, o risco mora nos contratos com o banco e no RLS multi-tenant, então concentro em testes de integração contra um banco real. Unit eu reservo pros cálculos financeiros, que extraio pra funções puras. E2E só nos 4-5 fluxos que derrubam o cliente: login, troca de tenant, lançamento."

> **P:** "Sua suíte roda em 40 minutos e falha aleatoriamente às vezes. Onde você olha primeiro?"
>
> **R (30s):** "Suspeito de cone de sorvete: pirâmide invertida, e2e demais provando coisa que unit ou integração provariam mais barato e mais estável. Confirmo contando os testes por camada. O plano é empurrar cobertura pra baixo — cada e2e que só valida uma regra de cálculo vira um unit sobre a função pura extraída; cada e2e que valida um contrato de banco vira um teste de integração. No topo eu deixo só o smoke dos fluxos que derrubam o cliente. É o modo de falha que o próprio Google documentou: suíte top-heavy fica tão lenta e flaky que o time para de confiar nela e volta ao teste manual — a automação é desperdiçada."

## Checkpoint

- [ ] Sei dizer em uma frase o que cada nível PROVA (lógica / contrato / fluxo)
- [ ] Sei explicar por que custo e fidelidade crescem juntos ao subir de nível
- [ ] Sei defender quando a pirâmide vira troféu (Dodds) e por quê
- [ ] Sei explicar o cone de sorvete e por que uma suíte top-heavy corrói a confiança do time (dado do Google)
- [ ] Rodei o inventário (lógica pura / boundaries / fluxos críticos) em 1 projeto AG
- [ ] Consigo classificar qualquer arquivo de um projeto meu no nível de teste adequado

## Recursos

- Mike Cohn — *Succeeding with Agile: Software Development Using Scrum* (2009): capítulo "The Test Automation Pyramid" (origem do modelo)
- Ham Vocke — *The Practical Test Pyramid* (ensaio em martinfowler.com, 2018): o tratamento prático canônico; leitura obrigatória do módulo (SYLLABUS)
- Martin Fowler — verbete *TestPyramid* (bliki): a versão curta que popularizou o modelo
- Kent C. Dodds — *The Testing Trophy and Testing Classifications* (2018): a inversão para app CRUD I/O-pesado
- Google Testing Blog — *Just Say No to More End-to-End Tests* (Mike Wacker, 2015): a proporção ~70/20/10 e o mecanismo de falha do excesso de e2e
