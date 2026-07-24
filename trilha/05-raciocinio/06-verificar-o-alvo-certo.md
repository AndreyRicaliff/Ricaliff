# 06 — Verificar o Alvo Certo

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Existe um bug pior do que não verificar: **verificar a coisa errada e ganhar confiança falsa**. O teste passou, o `select` voltou linhas, a tela abriu — mas contra outra branch, outro ambiente, outra tabela ou um bundle velho. Este é o irmão gêmeo do módulo 01: lá a pergunta é *"eu li a realidade?"*, aqui é *"eu li a realidade do lugar certo?"*. E o "verificado" carimbado no alvo errado é **mais perigoso** que o "não sei", porque o "não sei" mantém todo mundo alerta e o "verificado" **desativa a desconfiança** — ninguém mais vai conferir o que você já jurou que checou. Este módulo é a diferença entre "eu verifiquei" e "eu sei o que verifiquei" — e num incidente de produção essa diferença é medida em dinheiro.

---

## § BASE — o fundamento

**O erro de Tipo III: resolver certo o problema errado.** A estatística clássica tem o erro Tipo I (falso positivo) e o Tipo II (falso negativo). Howard Raiffa e depois Ian Mitroff popularizaram o **erro Tipo III**: dar a resposta **certa** à pergunta **errada**. Aplicado à verificação: você executa a checagem **impecavelmente** — o comando roda, o output é lido, a lógica está correta — só que sobre o **alvo errado**. O rigor da execução não te protege; ele até **piora**, porque quanto mais bem-feita a verificação do alvo errado, mais convincente é a confiança falsa que ela produz. É um erro que **imita** a diligência. Por isso ele engana até gente cuidadosa: o cuidado estava todo lá, apontado pro lugar errado.

**Por que o alvo errado é pior que a ignorância.** Uma verificação existe pra **transferir confiança** — quando você diz "verificado", os outros param de checar e constroem em cima. "Não sei" preserva a desconfiança coletiva; "verificado no alvo errado" a **consome**. O sistema de defesa de uma equipe é feito de camadas de checagem redundante — o modelo do **queijo suíço** de James Reason: cada camada tem furos, mas os furos raramente se alinham, então o erro é pego numa das camadas. Um "verificado" falso é um furo que você **abriu de propósito** em todas as camadas ao mesmo tempo, porque ele diz "não precisa olhar aqui". O acidente acontece quando os furos se alinham — e o "verificado" no alvo errado alinha vários de uma vez.

**O caso famoso: GitLab, 31/01/2017.** Sob pressão num incidente noturno, um engenheiro rodou `rm -rf` no diretório de dados do Postgres — convencido de estar no servidor **secundário** (`db2`). Estava no **primário** (`db1`). ~300 GB de dados de produção apagados. A recuperação então expôs o segundo desastre: **cinco mecanismos de backup diferentes falhavam em silêncio** — ninguém tinha verificado que os backups *restauravam*, só que "rodavam". A ação (`rm -rf` num secundário durante manutenção) estava dentro do razoável; o **alvo** estava errado, e a rede de segurança inteira era um "verificado" que ninguém tinha provado. O postmortem público virou aula de engenharia justamente por juntar os dois: alvo errado na ação **e** alvo errado na verificação do backup.

**A raiz cognitiva: mode error.** Sistemas com "modos" (produção/staging, esta branch/aquela, este banco/aquele) produzem o **mode error** clássico dos fatores humanos: você age correto **para o modo em que acha que está**, mas está em outro. O prompt do terminal não grita "isto é PROD"; a aba do navegador não diz "bundle de ontem". O antídoto não é ter mais cuidado (o GitLab teve cuidado) — é **tornar o modo visível e obrigatório de ler** antes de agir. É disso que trata a metodologia.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os quatro falsos "verificado" clássicos, cada um com a **prova de alvo** que o desarma:

| # | Falso verificado | Como acontece | Prova do alvo |
|---|---|---|---|
| 1 | **Branch errada** | Fix na feature branch, teste rodou na main (ou vice-versa) | `git rev-parse --abbrev-ref HEAD` + hash curto no report |
| 2 | **Ambiente errado** | "Testei o app", mas era localhost/preview — prod tem outra env var | URL completa + um header do response (build id, `x-vercel-id`) |
| 3 | **Tabela/banco errado** | Select na cópia de staging ou na tabela homônima de outro schema | `select current_database()` + schema qualificado na query |
| 4 | **Cache velho** | Bundle antigo no browser/CDN/service worker — a tela "testada" é a de ontem | Hard reload (Ctrl+Shift+R) + conferir o hash do bundle |

Há um **segundo eixo** que organiza a intensidade da prova: **destrutividade ↔ explicitude**. Quanto mais irreversível a ação, mais explícito o carimbo de alvo tem que ser **antes** de agir. Ler o alvo antes de um `select` é bom hábito; ler o alvo antes de um `rm -rf`/`DROP`/`git push --force` é o que separa o profissional do próximo postmortem. O GitLab é o extremo desse eixo: ação máxima de destrutividade, alvo não confirmado.

```
                        ler o alvo é...
ação reversível         boa prática         (select, abrir uma tela)
   │
ação destrutiva     →   OBRIGATÓRIO         (rm -rf, DROP, force push, deploy em prod)
                        imprimir hostname/pwd/current_database e LER antes do Enter
```

Este módulo empilha sobre o 01: **prova mínima (01) + prova de alvo (06) = verificação completa.** Verificar o resultado sem provar o alvo é meia-verificação — e meia-verificação com carimbo de inteira é a mais perigosa que existe.

---

## § METODOLOGIA — o passo-a-passo replicável

**A regra-mãe — o carimbo de alvo:** *toda verificação reporta QUAL alvo leu, não só o resultado.* Não "o teste passou" — **"o teste passou na branch `fix/rls` em `a1b2c3d`"**. Não "a query voltou 132 linhas" — **"132 linhas em `current_database() = prod`, schema `public`"**. O carimbo custa **uma linha**; a confiança falsa custa um incidente.

**Checklist antes de reportar (os 4 falsos):**

**1. QUE BRANCH/COMMIT** estou testando? (falso #1) → `git rev-parse --abbrev-ref HEAD` + hash curto.
**2. QUE AMBIENTE** estou abrindo? (falso #2) → URL completa + um header do response. Preview tem URL própria — a URL **é** a de prod?
**3. QUE BANCO** a query leu? (falso #3) → `select current_database(), current_schema()` junto da query de conferência.
**4. ESTOU VENDO O BUNDLE NOVO?** (falso #4) → Ctrl+Shift+R + conferir o hash do JS no DevTools.
**5. SÓ ENTÃO** o carimbo: "verificado em `<branch>@<hash>`, `<url de prod>`, banco `<nome>`".

**Corolário destrutivo (GitLab):** antes de qualquer comando irreversível, **imprima o alvo e LEIA antes do Enter** — `hostname`, `pwd`, `current_database()`. O `rm -rf` só é seguro depois de você ter *lido* que o prompt diz `db2` e não `db1`. E: um backup que "roda" não é um backup — só é backup o que você já **restaurou** e conferiu (o segundo erro do GitLab).

**Anti-padrões:**
- **"Verificado" sem alvo:** "o teste passou" (em qual branch? contra qual banco?). Resultado sem alvo não é verificação, é meia-verificação carimbada de inteira.
- **Confiar no default do modo:** assumir que o prompt/aba/env "está no lugar certo". O mode error não avisa — você tem que ler.
- **Backup não-restaurado tratado como backup:** "roda todo dia" ≠ "restaura". Só o restore testado prova.
- **Escalar cuidado sem escalar o carimbo em ação destrutiva:** cuidado apontado pro alvo errado é o GitLab.

**Aplicado — checklist antes de reportar um fix de dashboard (Cliente Varejo):**

```bash
# 1. Que branch/commit estou testando? (falso #1)
git rev-parse --abbrev-ref HEAD && git rev-parse --short HEAD

# 2. Que ambiente estou abrindo? (falso #2)
curl -s -I https://app-do-cliente.exemplo | grep -i "x-vercel-id"
#    preview deployment tem URL própria — conferir se a URL É a de prod

# 3. Que banco a query leu? (falso #3)
#    select current_database(), current_schema();  -- junto da query de conferência

# 4. Estou vendo o bundle novo? (falso #4)
#    Ctrl+Shift+R + DevTools > Network > hash do JS principal mudou?

# 5. Só então: "verificado em <branch>@<hash>, <url de prod>, banco <nome>"
```

Caso real AG: **quatro "verificados" falsos em dois dias** — teste rodado na branch errada, tela de login confundida com o app logado, `select` na tabela homônima errada e tela cacheada julgada como atual. **Nenhum era bug de código**; todos eram alvo errado. A regra do carimbo nasceu daí — não de teoria, de quatro cicatrizes seguidas.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Pegue o último fix que você reportou como "verificado":

1. Responda por escrito, para aquele fix, as 4 perguntas do checklist: **qual branch@hash, qual URL, qual banco, bundle novo?**. Você tem as quatro respostas, ou está *supondo* alguma?
2. Para cada resposta que você não tem, rode o comando de prova de alvo agora e **anote o valor real**.
3. Descobriu algum alvo diferente do que você achava? Esse é um "verificado" falso que passou — anote qual dos 4 tipos foi.
4. Reescreva o report do fix com o **carimbo completo**: "verificado em `<branch>@<hash>`, `<url>`, banco `<nome>`".
5. Antes do próximo comando destrutivo que você rodar, **imprima `hostname`/`pwd`/`current_database()` e leia em voz alta** antes do Enter. Faça disso reflexo.

## Por que cai em entrevista

Incidente causado por "achei que estava no staging" é **universal** — todo entrevistador sênior tem cicatriz disso. Perguntas como "um erro que você cometeu" ou "como você opera em produção" são a deixa: citar o carimbo de alvo demonstra maturidade operacional que a maioria dos plenos nem verbaliza. Você não está contando um erro — está mostrando o processo que nasceu dele.

> **P:** "Me conta um erro seu e o que você mudou por causa dele."
>
> **R (30s):** "Reportei um fix como testado — mas tinha rodado o teste na branch errada; o fix nem estava no código que testei. Foi pego em revisão antes de causar dano, mas me mostrou que 'verificado' sem dizer ONDE não é verificação. Desde então, toda conferência minha sai com carimbo de alvo: branch e hash, URL do ambiente, current_database na query, hard reload no front. É o padrão do incidente do GitLab em 2017 — a ação certa no servidor errado apagou produção. Verificar o resultado não basta; tem que provar o alvo."

> **P:** "Como você opera com segurança em produção?"
>
> **R (30s):** "A regra é: quanto mais destrutiva a ação, mais explícito o alvo antes do Enter. Antes de um DROP, um rm -rf ou um force push, eu imprimo hostname, pwd e current_database e leio — porque o terminal não grita em qual ambiente eu estou, e o erro de modo não avisa. E não trato backup que 'roda' como backup: só é rede de segurança o restore que eu já testei. Os dois erros do GitLab em 2017 foram isso — rm no primário achando que era o secundário, e cinco backups que ninguém tinha restaurado. A defesa não é ter mais cuidado; é tornar o alvo obrigatório de ler."

## Checkpoint

- [ ] Sei explicar o erro de Tipo III: resposta certa à pergunta/alvo errado
- [ ] Sei citar os 4 falsos "verificado" com um exemplo concreto de cada
- [ ] Meu último report de fix saiu com branch@hash + ambiente explícitos
- [ ] Rodo `current_database()`/schema junto de queries de conferência importantes
- [ ] Faço hard reload antes de julgar qualquer mudança de front
- [ ] Antes de comando destrutivo, imprimo e LEIO o alvo (hostname/pwd/banco)

## Recursos

- Postmortem público do incidente de banco do GitLab (2017): buscar "GitLab database incident postmortem" — os dois erros de alvo (ação + backup)
- James Reason — *Human Error* (1990): o modelo do queijo suíço e a natureza das falhas em camadas
- Ian Mitroff — sobre o erro de Tipo III ("solving the wrong problem precisely")
- *Site Reliability Engineering* (Google SRE Book): capítulo de postmortem blameless e operação segura em produção
- Módulo-irmão `01-verificar-antes-de-afirmar` — a dupla: prova mínima + alvo certo = verificação completa
