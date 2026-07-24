# 05 — Decompor Problemas

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Problema grande não se resolve — se **corta**. Decomposição é transformar "migrar o dashboard pra multi-tenant" (impossível de *começar*) em 6 subproblemas com critério de pronto cada um (impossível de *não* começar). É a habilidade primária da engenharia: toda arquitetura, todo módulo, toda função é decomposição cristalizada em código. E é a habilidade onde a IA mais brilha e o júnior mais falha — não porque o júnior não *sabe* decompor, mas porque **sob pressão ele pula a etapa** e ataca o problema inteiro de uma vez, contra o próprio limite cognitivo. Este módulo é sobre por que o corte é obrigatório (não opcional) e como fazer um corte que *funciona* em vez de uma lista que só *parece* decomposição.

---

## § BASE — o fundamento

**Por que decompor é obrigatório: o limite cognitivo.** George Miller, em *"The Magical Number Seven, Plus or Minus Two"* (1956), mediu que a **memória de trabalho** humana segura ~7 blocos de informação — revisões modernas apontam mais perto de **4**. Um sistema real tem milhares de partes interagindo. A conta não fecha: **o problema inteiro não cabe na cabeça.** Decompor não é organização estética, é a única forma de fazer um problema grande **caber na memória de trabalho** um pedaço por vez. Toda técnica de engenharia — função pequena, módulo, interface, nome bom, commit atômico — é fundamentalmente uma **tecnologia contra o limite de Miller**. Quando você entende isso, "por que quebrar em funções pequenas?" deixa de ser regra de estilo e vira necessidade fisiológica.

**O que é um corte BOM: Parnas e o information hiding.** Aqui está a base que separa decomposição de "picar em pedaços". David Parnas, em *"On the Criteria To Be Used in Decomposing Systems into Modules"* (1972), derrubou a intuição óbvia. A forma errada de decompor é **por etapas do fluxo** (ler → processar → escrever), porque cada módulo precisa saber como os outros funcionam por dentro — mudou o formato do dado, mudou todo mundo. A forma certa: **cada módulo esconde uma decisão de design** que pode mudar. O módulo expõe uma interface estável e **esconde** (information hiding) o que é volátil lá dentro. O critério do corte não é "que passos existem?", é **"o que provavelmente vai mudar, e como isolo cada mudança num módulo só?"**. Um corte bom produz subproblemas **independentes**: alto na coesão interna, baixo no acoplamento entre eles. Se toda fatia depende de toda fatia, você não decompôs — só fez uma lista com marcadores.

**Por que sistemas complexos *toleram* decomposição: Simon.** Herbert Simon, em *"The Architecture of Complexity"* (1962), observou que quase todo sistema complexo estável é **quase-decomponível** (near-decomposable): interações fortes *dentro* de subsistemas, fracas *entre* eles — e por isso pode ser entendido em camadas. A parábola dos dois relojoeiros ilustra o retorno prático: **Hora** monta relógios em subconjuntos estáveis de 10 peças; **Tempus** monta cada relógio numa sequência única de 1.000 peças que desmorona a cada interrupção. Hora prospera, Tempus quebra — não por talento, por **estrutura**. Decompor em subconjuntos estáveis é o que faz o progresso sobreviver à interrupção (e a IA é uma "Hora" perfeita: nunca tenta montar as 1.000 peças de uma vez).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Existem três **eixos de corte**, e escolher o eixo é a decisão-mãe:

```
POR CAMADA      banco → API → front        natural, mas cria dependência em cadeia
                                            (o front espera a API que espera o banco)
POR FATIA       feature fininha completa,   cada fatia é demo-ável e reversível
VERTICAL        da tabela ao botão          (o strangler fig do Fowler) — preferível quando dá
POR RISCO       o que você NÃO sabe fazer   ataca a incerteza primeiro, num spike curto
                vai primeiro                (falhar cedo é barato; falhar no fim replaneja tudo)
```

- **Por camada** é o corte intuitivo e o pior default: acopla tudo em cadeia, nada é entregável até o último elo.
- **Por fatia vertical** é o corte preferível — cada fatia atravessa todas as camadas mas entrega *uma* coisa inteira, demo-ável e reversível. É o **strangler fig** de Martin Fowler: migrar legado fatia por fatia, cada fatia no ar, em vez de um big-bang que ou funciona todo ou falha todo.
- **Por risco** é o corte que salva prazo: se a incerteza mora em "como a API do ERP-externo pagina?", um **spike** de 1h nessa pergunta vale mais que 3 dias de UI. Falhar cedo custa uma hora; falhar no fim custa o replanejamento inteiro.

Depois do corte vem a **ordem de ataque**, ditada pelas dependências:

1. **Desenhe as dependências** (rabisco de setas basta).
2. **Arriscado/desconhecido primeiro** (spike) — resolve a incerteza que pode matar o plano.
3. **Caminho crítico:** a corrente mais longa de dependências define o prazo; tudo fora dela pode paralelizar. Otimizar algo fora do caminho crítico **não adianta o prazo** — o conceito vem do CPM (Critical Path Method), mas a intuição é a mesma do Amdahl: o teto do ganho é a fração que você mexeu.
4. **Bloqueador não para o resto:** anote a linha bloqueada + o que falta, ataque a próxima frente independente, reporte no final "fiz X e Y; Z bloqueado por W". Ficar parado esperando resposta de terceiro é a forma **mais cara** de espera — você tinha 4 frentes e escolheu ter zero.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CRITÉRIO DE PRONTO ANTES** — verificável por comando, não por sensação. Numa sanitização de repo, o critério é "a varredura de termos proibidos volta zero" — um comando que qualquer um roda. Definir isso *antes* faz "pronto" deixar de ser opinião.

**2. CORTAR em subproblemas de UMA FRASE cada.** A regra de teste: se você não explica o subproblema numa frase, ele ainda é grande demais — corte de novo. Cada subproblema ganha o *seu* critério de pronto.

**3. ESCOLHER O EIXO** (camada / vertical / risco). Prefira vertical quando der; sempre puxe o risco pra frente.

**4. DESENHAR dependências e achar o caminho crítico.** O que trava o quê? O que dá pra fazer em paralelo?

**5. ATACAR risco primeiro, paralelizar o resto, e não travar em bloqueador** — pendência anotada, próxima frente atacada.

**6. VERIFICAR com a MESMA prova do critério do passo 1.** "Pronto" é o comando do passo 1 voltando verde, não a sensação de ter terminado.

**Anti-padrões:**
- **Lista que não é decomposição:** subproblemas todos acoplados entre si. Se um não pode ser feito sem o outro pronto, você não cortou — reordene ou re-corte pra achar as fronteiras independentes.
- **Corte por etapa do fluxo (Parnas):** módulos que sabem o interior um do outro. Corte pela *decisão que pode mudar*, não pelo passo do processo.
- **Big-bang:** fazer tudo e integrar no fim (Tempus). Prefira fatias que já rodam (Hora).
- **Conforto antes de risco:** começar pela UI bonita e deixar "como a API pagina?" pro fim. É onde o plano morre — e morre caro.
- **Esperar bloqueador parado:** trocar 4 frentes por zero.

**Aplicado — sanitizar um repo antes de abrir ao público (caso real AG):** problema grande e vago — "tornar o repo público sem vazar dado de cliente". Decomposto:

```bash
# 0. Critério de pronto ANTES: a varredura do passo 1 tem que voltar zero.
# 1. Inventário — subproblema independente, roda em minutos
#    (termos-proibidos.txt: um termo sensível por linha — nomes, domínios, docs)
rg -i -n -f termos-proibidos.txt --stats . > inventario.txt

# 2. Classificar cada hit: apagar / trocar por codinome / precisa de decisão
# 3. Reescrever classe a classe — frentes paralelas por pasta, independentes
# 4. Verificar com a MESMA varredura do passo 1:
rg -i -f termos-proibidos.txt . && echo "AINDA VAZA" || echo "limpo"

# 5. Hit que depende de decisão de terceiro → PENDENCIAS.md com contexto,
#    e as outras frentes seguem. Um item bloqueado não segura o repo inteiro.
```

Repare no desenho: o critério de pronto foi definido **antes** (passo 0 = varredura zero), então "pronto" não é opinião — é um comando que qualquer um roda e confere. E o corte é por pasta (frentes independentes), não por etapa — cada pasta se limpa sem esperar a outra.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Pegue a maior tarefa vaga do teu backlog (o "migrar X", o "refazer Y"):

1. Escreva o **critério de pronto verificável por comando** — antes de qualquer corte.
2. **Corte em ≤ 6 subproblemas de uma frase cada.** Qualquer um que não caiba numa frase, corte de novo.
3. Marque o **eixo** de cada corte (camada/vertical/risco) e circule o subproblema mais **arriscado**.
4. Desenhe as setas de dependência e identifique o **caminho crítico** e o que dá pra paralelizar.
5. Ataque o **spike do risco** primeiro (só ele, ~1h). Se travar em terceiro, escreva a pendência e siga pra próxima frente.
6. No fim, cheque: você conseguiu *começar* em 10 minutos? (Se sim, o corte funcionou. Se ainda parece "impossível de começar", o corte foi raso — os subproblemas ainda estão grandes.)

## Por que cai em entrevista

"Como você atacaria [tarefa grande e vaga]?" é pergunta de system design e comportamental ao mesmo tempo. O entrevistador observa se você **congela**, se levanta requisitos e, principalmente, se a sua primeira ação é **cortar** o problema e nomear o que ataca primeiro — e por quê. Quem começa a codar a UI mostra que ataca pelo conforto; quem começa perguntando "onde está a maior incerteza?" mostra que ataca pelo risco.

> **P:** "Te dou uma feature grande e vaga. Por onde você começa?"
>
> **R (30s):** "Corto em subproblemas independentes e ordeno por risco, não por conforto: o pedaço que eu não sei fazer vai primeiro, como spike curto, porque é onde o plano pode morrer barato. Depois identifico o caminho crítico e o que dá pra paralelizar. E tenho uma regra: bloqueador não me para — frente que trava esperando terceiro vira pendência anotada com contexto, e eu ataco a próxima; no report final entrego 'fiz X e Y, Z bloqueado por W'. Numa sanitização de repo real, isso significou publicar no prazo com um único item pendente documentado, em vez de atrasar tudo por causa dele."

> **P:** "Como você decide as fronteiras entre módulos/componentes?"
>
> **R (30s):** "Não corto pelo fluxo — ler, processar, escrever — porque isso faz cada módulo depender do interior do outro, e qualquer mudança de formato quebra a cadeia toda. Corto pelo que **vai mudar**: cada módulo esconde uma decisão volátil atrás de uma interface estável, o information hiding do Parnas. Se a regra de negócio do cliente muda toda semana, ela vira um módulo isolado; o resto não precisa saber como ela funciona por dentro. O teste é: consigo mexer num módulo sem abrir os outros? Se não, a fronteira está no lugar errado."

## Checkpoint

- [ ] Sei explicar por que decompor é obrigatório (o limite de Miller na memória de trabalho)
- [ ] Corto pela decisão que pode mudar (Parnas), não pela etapa do fluxo
- [ ] Decompus uma tarefa real em ≥ 4 subproblemas com critério de pronto cada um
- [ ] Sei explicar fatia vertical vs camada e quando cada corte vence
- [ ] Ataquei o subproblema mais arriscado PRIMEIRO na última tarefa grande (spike)
- [ ] Registrei um bloqueador e continuei outra frente em vez de esperar

## Recursos

- David Parnas — *"On the Criteria To Be Used in Decomposing Systems into Modules"* (1972): information hiding, o critério do corte bom
- Herbert Simon — *"The Architecture of Complexity"* (1962): quase-decomponibilidade e a parábola de Hora e Tempus
- George Miller — *"The Magical Number Seven, Plus or Minus Two"* (1956): o limite da memória de trabalho que torna a decomposição obrigatória
- Martin Fowler — *Strangler Fig Application*: decompor migração de legado em fatias verticais reversíveis
- Módulo `80-system-design/08-design-de-sistema-exemplo.md` desta trilha — decomposição aplicada de ponta a ponta
