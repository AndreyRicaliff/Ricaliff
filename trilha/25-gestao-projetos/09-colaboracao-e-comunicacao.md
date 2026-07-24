# 09 — Colaboração e Comunicação

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática, P/R e checkpoint.

## O que é

A crença júnior é que engenharia é uma atividade solitária — você contra o compilador — e que comunicação é o "soft skill" que se pega depois. É o contrário. DeMarco & Lister abrem *Peopleware* com a tese: **"os grandes problemas do nosso trabalho não são tanto tecnológicos quanto sociológicos por natureza."** O que trava um time não costuma ser o algoritmo; é a interrupção que mata o foco, o review que humilha em vez de ensinar, o silêncio de quem tem medo de perguntar, a PR que ninguém entende porque o autor não explicou *por quê*.

Este módulo trata comunicação e colaboração como **habilidade de engenharia de primeira classe**, com lastro: o que o code review realmente entrega (não é achar bug), por que segurança psicológica é o que faz um time aprender, quanto custa uma interrupção, e como dar e receber crítica sem que o ego estrague tudo. Mesmo para o dev solo com IA, isso vale — porque a PR, o commit e o design doc são a sua comunicação com o "você" de daqui a seis meses e com o próximo humano que abrir o repo.

---

## § BASE — o fundamento

**O que o code review realmente entrega (Sadowski et al., 2018).** O estudo *"Modern Code Review: A Case Study at Google"* (Caitlin Sadowski, Emma Söderberg, Luke Church, Michal Sipko, Alberto Bacchelli — **ICSE-SEIP 2018**) observou o processo real de review no Google, na ferramenta Critique. Os números derrubam a intuição de "review é uma auditoria pesada": a mudança **mediana muda ~24 linhas**, a **maioria tem um único revisor**, e o **tempo mediano até a primeira resposta é menos de uma hora**. Review leve, rápido e frequente — não cerimônia. Mas o achado central é sobre o *propósito*: quando perguntados, os desenvolvedores do Google dizem que a motivação declarada é achar defeitos — só que os **benefícios reais que eles relatam são educação, transferência de conhecimento, manutenção de normas/consistência do código e responsabilização** ("alguém além de mim olhou isto"). Isso confirma o estudo anterior de Bacchelli & Bird (*"Expectations, Outcomes, and Challenges of Modern Code Review"*, ICSE 2013, na Microsoft): todo mundo *acha* que review serve para caçar bug, mas o que ele mais entrega é **consciência de equipe e aprendizado** — e os defeitos encontrados costumam ser rasos, não os profundos. Conclusão operacional: se você trata review como caça-bug, ele decepciona; se trata como **canal de ensino e alinhamento**, ele é insubstituível. É por isso que a casa manda `code-review` antes de PR mesmo em fluxo solo — o valor é a segunda leitura consciente, não só o bug.

**Segurança psicológica: o que faz um time aprender (Edmondson, 1999).** Amy Edmondson, em *"Psychological Safety and Learning Behavior in Work Teams"* (**Administrative Science Quarterly**, vol. 44, nº 2, 1999, pp. 350–383), definiu **segurança psicológica** como "a crença compartilhada de que o time é seguro para correr riscos interpessoais" — perguntar, admitir erro, discordar, pedir ajuda sem medo de parecer incompetente. A descoberta que virou lenda: ao estudar times hospitalares, ela achou que **os melhores times reportavam MAIS erros** — não porque erravam mais, mas porque se sentiam **seguros para reportar**. Onde não há segurança, o erro é escondido, e o que é escondido não é corrigido nem vira aprendizado. A tese: segurança psicológica destrava o **comportamento de aprendizado** do time, que por sua vez melhora o desempenho.

O **Project Aristotle** — estudo interno do Google divulgado publicamente (via re:Work e reportado no NYT Magazine, "What Google Learned From Its Quest to Build the Perfect Team", 2016) — analisou ~180 times para descobrir o que faz um time ser efetivo. O resultado nº 1, acima de *quem* estava no time: **segurança psicológica**. Ressalva honesta: Project Aristotle é pesquisa interna corporativa, não um experimento controlado publicado com peer review como o de Edmondson — cite-o como *evidência convergente divulgada*, não como prova acadêmica. Mas os dois apontam para o mesmo lugar: o fator de time não é talento bruto, é se as pessoas podem falar.

**O custo de uma interrupção (Mark et al.).** Gloria Mark e colegas mediram o preço do foco quebrado. Em *"The Cost of Interrupted Work: More Speed and Stress"* (Gloria Mark, Daniela Gudith, Ulrich Klocke — **CHI 2008**), o achado é contraintuitivo: pessoas interrompidas **completam a tarefa mais rápido** — mas ao custo de **mais estresse, mais frustração, mais pressão de tempo e mais esforço**. Elas compensam a interrupção trabalhando em ritmo mais tenso, e isso não é de graça. E há o custo de **retomada**: no estudo anterior *"No Task Left Behind? Examining the Nature of Fragmented Work"* (Mark, Gonzalez, Harris — CHI 2005), mediu-se que, após uma interrupção, o trabalhador leva em média **~23 minutos** para voltar à tarefa original (frequentemente passando por outras tarefas no meio). Uma "pergunta rápida" de 30 segundos não custa 30 segundos — custa a reconstrução do contexto mental que ela demoliu.

**Flow e ambiente (DeMarco & Lister, *Peopleware*).** Tom DeMarco e Timothy Lister, em *Peopleware: Productive Projects and Teams* (1987; edições posteriores 1999/2013), nomearam o estado que a interrupção destrói: **flow** — imersão profunda, "uma condição de produtividade quase meditativa" onde o trabalho de engenharia de verdade acontece. O ponto duro: **entrar em flow leva ~15 minutos**, e a interrupção te joga de volta ao zero. Eles propuseram o **Fator-E (E-Factor)** = horas sem interrupção ÷ horas de corpo presente — a métrica de que "estar na cadeira" não é "estar produzindo". Nos "coding war games" deles, o maior preditor de desempenho não era experiência nem salário: era o **ambiente** (ruído, privacidade, interrupção). É a base empírica de "async por padrão" e de proteger blocos de foco.

**Comunicação assíncrona e escrita técnica como habilidade de engenharia.** Some os três resultados acima e a conclusão é inevitável: a comunicação síncrona (o "só uma perguntinha", a reunião que podia ser um doc) **é cara** porque destrói flow (Peopleware) e cobra ~23 min de retomada (Mark). A **comunicação assíncrona** — PR bem escrita, design doc, issue clara, commit que explica o *porquê* — respeita o flow do outro, cria **registro durável** e força você a pensar antes de falar. Por isso escrever bem é habilidade de engenharia, não enfeite: uma PR cujo texto explica a intenção, o trade-off e o que testar transfere conhecimento (o valor real do review, por Sadowski) sem custar o foco de ninguém. "Escreveu mal" e "explicou mal" são bugs de comunicação — e caros como bugs de código.

**Crítica sem ego (Weinberg, 1971).** Gerald Weinberg, em *The Psychology of Computer Programming* (1971), cunhou **egoless programming**: seu código **não é você**. Quando o programador funde identidade e artefato, toda crítica ao código vira ataque pessoal, e o time perde a capacidade de melhorar o trabalho. A prática egoless é convidar ativamente os outros a acharem falhas no seu código — porque o objetivo é o *código bom*, não o *seu orgulho intacto*. Isso fecha o ciclo com Edmondson: crítica só flui num time psicologicamente seguro, e a crítica que flui é o que faz o código (e as pessoas) melhorarem.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os cinco fundamentos não são tópicos soltos — eles formam um **circuito**: a segurança habilita a crítica, a crítica vira aprendizado, o async protege o foco onde o trabalho acontece, e a escrita é o meio que carrega tudo.

```
        ┌───────────────────────────────────────────────┐
        │  SEGURANÇA PSICOLÓGICA (Edmondson '99)         │
        │  "é seguro perguntar, errar e discordar"       │
        └───────────────┬───────────────────────────────┘
                        │ habilita
                        ▼
   CRÍTICA SEM EGO ◄──────────►  CODE REVIEW
   (Weinberg '71:                (Sadowski '18: entrega
   código ≠ você)                EDUCAÇÃO+consciência,
        │                        não só bug)
        │ o veículo de tudo isso é a
        ▼
   ESCRITA / ASYNC ──────────►  protege o FLOW
   (PR, doc, commit:             (Peopleware: ~15min p/ entrar;
   registro durável)             Mark '08: interrupção = +estresse,
                                  ~23min de retomada)
```

Leitura do diagrama:
- **Sem segurança (Edmondson), o resto trava:** ninguém dá crítica honesta, o review vira teatro, e o erro é escondido em vez de virar aprendizado.
- **Review e crítica são a *mesma força* em dois formatos:** o review é a crítica institucionalizada; ambos só entregam o valor real (educação, por Sadowski) se forem egoless (Weinberg).
- **Async/escrita é o meio *e* a defesa do flow:** é como a crítica viaja sem destruir o foco que Peopleware e Mark mostram ser caro de reconstruir.

O eixo escondido: **tudo isso é sobre atenção e confiança** — dois recursos que o time gasta o dia inteiro e quase nunca mede.

---

## § METODOLOGIA — o passo-a-passo replicável

**A) Escrever uma PR/change que ensina (o valor de Sadowski, sem custar flow):**

**1. Título imperativo + o *porquê* no corpo.** Não "muda RLS"; sim "corrige RLS fail-open no painel do vendedor — vendedor via comissão nominal de outro". O corpo responde *por que agora*, não repete o *o quê* do diff.
**2. Mantenha a change pequena.** Mediana do Google ~24 linhas: change pequena é revisada rápido e bem; change de 800 linhas recebe um "LGTM" vazio.
**3. Diga o que testar e o risco.** "Testei com usuário sem role esperando 0 linhas; risco: não cobri o caso do gerente." Isso transfere consciência — o produto real do review.

**B) Dar review egoless (Weinberg + segurança de Edmondson):**

**4. Critique o código, nomeando o efeito, não a pessoa.** "Esse `catch` vazio engole o erro non-2xx" — não "você não sabe tratar erro".
**5. Rotule a severidade.** Convenção de comentários: `nit:` (opcional), `sugestão:`, `dúvida:`, `bloqueante:`. O autor sabe o que é gosto e o que trava o merge — some ambiguidade e ansiedade.
**6. Pergunte em vez de decretar quando não tem certeza.** "Isso não quebra quando o array vem vazio?" convida raciocínio; "está errado" fecha a porta.

**C) Receber crítica sem ego (Weinberg):**

**7. O código não é você.** Uma falha achada é uma falha *evitada em produção* — isso é o revisor trabalhando *a seu favor*.
**8. Responda ao ponto, não ao tom.** Mesmo review mal-educado costuma ter um ponto técnico válido; extraia o ponto, ignore o resto.

**Anti-padrões:**
- **Review como caça-bug e nada mais:** perde educação e alinhamento — o valor real (Sadowski). Um "LGTM" sem leitura é pior que nenhum review.
- **Crítica ao autor, não ao código:** mata a segurança psicológica; da próxima vez a pessoa esconde o trabalho (o efeito que Edmondson mediu).
- **"Só uma perguntinha" no meio do foco:** você acha que custa 30s; custa ~23min do outro (Mark). Junte perguntas, mande async.
- **PR gigante ou sem descrição:** transfere o custo de entender para o revisor, que devolve um carimbo vazio.
- **Reunião que era um doc:** síncrono destrói o flow de N pessoas (Peopleware) para algo que um texto resolveria com registro.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Pegue uma PR sua recente num projeto AG (PULSAR-RH, Cliente Varejo, o hub) — de preferência uma que recebeu só "LGTM" ou nenhum comentário.

1. **Reescreva a descrição** no formato A: título imperativo, o *porquê* no corpo, e uma linha "o que testei / o risco que não cobri". Compare com a original — a nova ensina, a velha só listava arquivos?
2. **Meça o tamanho:** quantas linhas mudaram? Se passou de ~200, quebre mentalmente em quantas changes de ~24 linhas caberia. Anote onde ela deveria ter sido fatiada.
3. **Faça um self-review egoless:** leia o próprio diff caçando o efeito de cada mudança, e escreva 3 comentários no formato do passo 4/5 (`nit:` / `dúvida:` / `bloqueante:`) como se fosse outra pessoa. Achou algo? Esse é o valor da segunda leitura consciente.
4. **Audite suas interrupções de hoje:** conte quantas vezes você quebrou o foco (notificação, "perguntinha", troca de aba). Multiplique por ~23min (Mark 2005). O número assusta — é o seu Fator-E vazando.
5. Registre num `DECISIONS.md` ou nota: "a partir de agora, PR abaixo de X linhas e descrição com *porquê* + risco". Uma regra sua, com lastro.

## Por que cai em entrevista

Depois de júnior, quase todo trabalho é em time, e a empresa sabe que **o gargalo raramente é técnico puro** — é comunicação. Perguntam sobre review, sobre desacordo com colega, sobre como você explica algo, porque querem ver se você entende que review é ensino (não caça-bug), se você recebe crítica sem se fechar, e se sabe que interromper e escrever mal têm **custo mensurável**. Citar Sadowski, Edmondson ou o custo de retomada de Mark separa quem "acha que colabora bem" de quem entende *por que* colaboração funciona.

> **P:** "Para que serve code review, na sua opinião? E como você reage a um review duro no seu código?"
>
> **R (30s):** "O estudo do Google (Sadowski, 2018) mostra que a intuição de 'review serve pra achar bug' está errada — o que ele mais entrega é educação, transferência de conhecimento e consistência do time; os bugs achados costumam ser rasos. Então eu trato review como canal de aprendizado nos dois sentidos, e mantenho as PRs pequenas — a mediana no Google muda ~24 linhas — pra ele ser rápido e real, não um 'LGTM' vazio. Sobre crítica dura: código não é a pessoa, isso é programação egoless do Weinberg; uma falha que o revisor acha é uma falha evitada em produção, trabalhando a meu favor. Respondo ao ponto técnico e ignoro o tom."

> **P:** "Como você lida com interrupções e trabalho de time distribuído?"
>
> **R (30s):** "Trato foco como recurso caro, com base em dado: o estudo da Gloria Mark mediu que leva ~23 minutos pra retomar uma tarefa depois de uma interrupção, e o Peopleware mostra que o trabalho de engenharia acontece em *flow*, que leva ~15 min pra atingir. Então eu prefiro assíncrono por padrão — PR bem escrita, doc, mensagem com contexto — em vez de 'só uma perguntinha' que custa o flow do outro. Escrever bem, pra mim, é habilidade de engenharia: respeita o foco de quem lê, cria registro durável e me força a pensar antes de interromper alguém. Reunião só quando o texto genuinamente não resolve."

## Checkpoint

- [ ] Sei explicar, citando Sadowski (2018), por que o valor real do review é educação/consciência e não só achar bug
- [ ] Sei o que é segurança psicológica (Edmondson 1999) e o achado de que times melhores *reportam* mais erros
- [ ] Sei o custo de uma interrupção (~23min de retomada, Mark; +estresse, Mark et al. 2008) e o que é flow/Fator-E (Peopleware)
- [ ] Sei o que é programação egoless (Weinberg 1971) e aplico "o código não é você" ao receber crítica
- [ ] Reescrevi uma PR real no formato "porquê + o que testei + risco" e sei rotular comentário por severidade
- [ ] Tenho resposta de 30s pronta para "para que serve review?" e "como você lida com interrupção/trabalho async?"

## Recursos

- Caitlin Sadowski et al. — *"Modern Code Review: A Case Study at Google"* (**ICSE-SEIP 2018**); e o estudo-base Alberto Bacchelli & Christian Bird — *"Expectations, Outcomes, and Challenges of Modern Code Review"* (**ICSE 2013**, Microsoft)
- Amy C. Edmondson — *"Psychological Safety and Learning Behavior in Work Teams"* (**Administrative Science Quarterly**, 44(2), 1999); Google **Project Aristotle** (re:Work; reportagem NYT Magazine, 2016) — como evidência interna divulgada, não experimento peer-reviewed
- Gloria Mark, Daniela Gudith, Ulrich Klocke — *"The Cost of Interrupted Work: More Speed and Stress"* (**CHI 2008**); e Mark, González & Harris — *"No Task Left Behind?"* (**CHI 2005**) para o ~23min de retomada
- Tom DeMarco & Timothy Lister — *Peopleware: Productive Projects and Teams* (1987; ed. 2013) — flow, Fator-E, os coding war games
- Gerald M. Weinberg — *The Psychology of Computer Programming* (1971) — *egoless programming*
- Módulos-irmãos: `05-comunicacao-com-cliente` (comunicação externa/má notícia) e `07-documentar-decisoes` (a escrita como registro durável)
