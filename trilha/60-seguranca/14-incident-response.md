# 14 — Incident Response

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Incident response é **o que você faz quando a defesa falhou** — porque uma hora falha. Segurança madura não é a fantasia de nunca ser comprometido; é ter um plano frio pra hora quente, quando a chave vazou, o dado saiu ou o serviço foi invadido, e a adrenalina empurra você a fazer a coisa errada na ordem errada. O plano existe justamente porque, no meio do incidente, você não pensa direito — então pensa antes. E "pensar antes" tem um manual: o NIST escreveu o ciclo que a indústria inteira segue.

---

## § BASE — o fundamento

**O ciclo canônico — NIST SP 800-61r2.** O *Computer Security Incident Handling Guide* (Rev. 2, 2012) define quatro fases, e a ordem delas é a lição:

**1. Preparação.** A fase que ninguém lembra e que decide todas as outras. É onde você monta o que vai precisar *antes* do incidente: logging e observabilidade ligados (sem log, você é cego na fase 2), contatos definidos, runbook escrito, backups testados. A resposta boa a um incidente é 90% preparação — no meio do fogo você executa um plano, não inventa um.

**2. Detecção & Análise.** Você não pode responder ao que não vê. É aqui que o logging (A09 do módulo 01) e a observabilidade (robustez 06) pagam a conta. O número que assusta, com dono: segundo o **IBM Cost of a Data Breach 2023**, o tempo médio só pra **identificar** um breach é de **~200 dias** (MTTI 204; conter leva mais ~73; ciclo total ~277 dias). Duzentos dias de acesso indevido antes de alguém perceber — quase sempre porque ninguém estava olhando. Detecção sem preparação (logging) é o que produz esse número.

**3. Contenção, Erradicação & Recuperação.** Parar o sangramento, fechar a porta, voltar limpo. E aqui está a regra que mais contraria o instinto de dev: **revogar antes de investigar**. Chave vazou no repo? Revoga a chave AGORA — antes de descobrir quem commitou, quando, ou se alguém usou. A ordem é essa porque **cada minuto investigando é um minuto com a chave ainda válida na mão de quem a pegou**. É literalmente o protocolo da AG: `.env` commitado → revogar a credencial ANTES de qualquer outra ação. Erradicação é *fechar a porta que o atacante usou* (não só expulsá-lo) e rotacionar todos os segredos que *podem* ter sido expostos (na dúvida, rotaciona — barato perto do risco). Recuperação é restaurar de um backup que você tem *certeza* de ser anterior ao comprometimento. Recuperar sem fechar a porta é convidar o atacante a voltar.

**4. Pós-incidente (lições aprendidas) — blameless.** Depois que o fogo apaga: o que aconteceu, por que a defesa falhou, o que muda pra não repetir. A palavra-chave, do **Google SRE Book — *Postmortem Culture: Learning from Failure***, é **blameless**: o objetivo é consertar o *sistema que permitiu* o erro, não punir quem apertou o botão. Cultura que caça culpado gera cultura que **esconde** incidente — e incidente escondido é o pior tipo, porque roda invisível e vira o breach de 200 dias. O erro é sinal de um processo frágil, não de uma pessoa ruim.

**Por que repo público muda tudo.** Segredo que entrou no histórico do git **já foi indexado, clonado, arquivado** por bots no minuto seguinte. Reescrever o histórico (remover o commit) **não desfaz** o vazamento — a cópia já saiu do seu controle. Por isso, em repo público, a **revogação é a única contenção que funciona de verdade**; o resto é limpeza cosmética.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O incidente é uma linha do tempo, e o valor está na *ordem* — a fase que o instinto quer pular (Preparação) e a inversão que o instinto erra (investigar antes de conter):

```
ANTES  │ 1. PREPARAÇÃO ──────── logging on, backups testados, runbook, contatos
       │        (sem isto, a fase 2 é cega e a 3 é improviso)
───────┼───────────────────────────────────────────────  ← o incidente acontece
DURANTE│ 2. DETECÇÃO ────────── alerta/anomalia   (MTTI ~200 dias sem log — IBM 2023)
       │ 3. CONTENÇÃO ────────► REVOGAR  ⟵ ANTES de investigar (a inversão-chave)
       │    ERRADICAÇÃO ──────► fechar a porta usada, rotacionar tudo que pôde vazar
       │    RECUPERAÇÃO ──────► restaurar de backup comprovadamente pré-comprometimento
───────┼───────────────────────────────────────────────  ← fogo apagado
DEPOIS │ 4. PÓS-INCIDENTE ───── post-mortem BLAMELESS: conserta o processo, não pune a pessoa
       │        (culpar → esconder → o próximo breach roda invisível)
```

A preparação e o pós-incidente **se fecham num loop**: a lição aprendida na fase 4 vira a preparação melhorada pro próximo — logging que faltou, alerta que não disparou, secret que não devia estar no código. Incident response maduro é esse ciclo girando, não um evento isolado.

---

## § METODOLOGIA — o passo-a-passo replicável (a primeira hora de uma chave vazada)

**1. CONTER — revogar a chave AGORA**, antes de qualquer investigação. Contenção vem antes de análise.

**2. EMITIR credencial nova**, com escopo mínimo (módulo 12: least privilege).

**3. TROCAR em produção** e confirmar que o serviço voltou com a nova.

**4. SÓ AGORA INVESTIGAR:** desde quando estava exposta? foi usada? (`git log`, logs de acesso do serviço no período).

**5. Se o repo é público, aceitar que revogar era a única saída** — a chave está em todo o histórico, indexada e clonada; reescrever histórico não desfaz vazamento.

**6. ERRADICAR:** fechar a porta que o atacante usou (não só expulsá-lo) e rotacionar todos os segredos que *podem* ter vazado.

**7. RECUPERAR** de um backup comprovadamente anterior ao comprometimento.

**8. PÓS-MORTEM blameless:** consertar o processo que deixou a chave chegar ao commit (pre-commit hook? secret scanning? `.gitignore`?), sem caçar culpado.

**Anti-padrões:**
- **Investigar antes de revogar.** O instinto ("quem foi? quando?") mantém a chave viva na mão de quem a pegou. Contenção primeiro, sempre.
- **Achar que reescrever o histórico do git conserta.** Em repo público, a cópia já saiu. Só a revogação contém.
- **Expulsar o atacante sem fechar a porta.** Ele volta pela mesma entrada. Erradicação é fechar a entrada, não só limpar a sala.
- **Restaurar de backup pós-comprometimento.** Você reinstala o problema. Restaure de um ponto que você *sabe* ser limpo (RPO conhecido, backup testado).
- **Caçar culpado.** Gera cultura de esconder incidente — o oposto de detecção. Blameless: o processo falhou, não a pessoa.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Simule a primeira hora de uma chave vazada num projeto AG e escreva o pós-mortem.

```bash
# 1. CONTER — revogar a chave AGORA (antes de investigar)
#    no dashboard do provedor: revoke/rotate a credencial exposta
# 2. Emitir credencial nova, com escopo mínimo (módulo 12)
# 3. Trocar em produção e confirmar que o serviço voltou com a nova
# 4. SÓ AGORA investigar: desde quando estava exposta? foi usada?
git log -p -- caminho/do/.env    # quando entrou, o que continha
#    revisar logs de acesso do serviço no período de exposição
# 5. Se o repo é público: a chave está em TODO o histórico do git,
#    não só no HEAD — revogar é a única saída real (remover o commit não basta)
```

```markdown
## POST-MORTEM (blameless) — 2026-XX-XX — [incident] chave X exposta no repo

**O que aconteceu:** [SERVICE_ROLE_KEY commitada em script de setup, repo Y]
**Detecção:** [como/quando — secret scanning? aviso externo? MTTI = quanto tempo?]
**Contenção:** [revogada às HH:MM, nova chave escopada emitida, prod trocado]
**Foi usada?** [logs de acesso no período de exposição — sim/não/inconclusivo]
**Por que a defesa falhou (processo, não pessoa):** [faltava pre-commit hook / secret
  scanning / a chave nem devia existir (least privilege)]
**O que muda (vira preparação do próximo):** [gitleaks no CI, .env no .gitignore,
  rotação programada, treinar o time no protocolo revogar-antes-de-investigar]
```

## Por que cai em entrevista

Incident response mostra maturidade operacional — pensar em "quando falhar", não só "pra não falhar". "O que você faz se descobrir uma chave commitada?" é pergunta comum, e a resposta certa (revogar antes de investigar) é contra-intuitiva o bastante pra separar quem já viveu de quem só leu. Blameless post-mortem sinaliza que você entende cultura de engenharia, não só técnica.

> **P:** "Você descobre que uma chave de API está commitada num repositório. Qual sua primeira ação?"
>
> **R (30s):** "Revogar a chave, imediatamente, antes de qualquer investigação. O instinto é ir olhar quem commitou e quando — errado: cada minuto investigando é um minuto com a chave válida na mão de quem já a pegou. Contenção vem antes de análise. Revogo, emito uma nova com escopo mínimo, troco em produção, e só então investigo desde quando estava exposta e se foi usada. E se o repo é público, revogar é a única saída real — a chave já está em todo o histórico do git, indexada e clonada; reescrever histórico não desfaz vazamento. Depois, post-mortem sem culpado: conserto o processo que deixou a chave chegar no commit, que é o problema de verdade."

> **P (nova):** "O que é um post-mortem blameless e por que ele importa pra segurança?"
>
> **R (30s):** "É a análise pós-incidente que foca em consertar o sistema que permitiu o erro, não em punir quem cometeu. Importa pra segurança por um motivo bem concreto: cultura que caça culpado gera cultura que esconde incidente — se apontar a chave vazada me queima, eu vou torcer pra ninguém ver, e aí o breach roda invisível, que é justamente o cenário dos 200 dias médios até detecção que a IBM mede. O erro quase nunca é uma pessoa ruim, é um processo frágil: a chave chegou no commit porque faltava um secret scanning no CI, não porque o dev é descuidado. Então no post-mortem eu pergunto 'por que o sistema deixou isso acontecer e o que muda', e a resposta vira a preparação do próximo incidente — é o loop do NIST, a lição aprendida virando defesa. É o que o Google formalizou em Postmortem Culture no SRE Book."

## Checkpoint

- [ ] Sei as 4 fases do NIST SP 800-61r2 (preparação, detecção/análise, contenção-erradicação-recuperação, pós-incidente) e por que a ordem importa
- [ ] Explico por que "revogar antes de investigar" e defendo a ordem
- [ ] Sei por que, em repo público, revogação é a única contenção real de uma chave
- [ ] Explico o que é post-mortem blameless e por que caçar culpado piora a segurança
- [ ] Ligo detecção à preparação (sem logging/observabilidade montados antes, o breach é invisível — ~200 dias, IBM 2023)
- [ ] Sei que erradicação é fechar a porta usada e recuperação é restaurar de backup comprovadamente limpo

## Recursos

- **NIST SP 800-61r2 — *Computer Security Incident Handling Guide***: as quatro fases do ciclo (fonte primária da §BASE)
- **IBM — Cost of a Data Breach 2023**: MTTI ~204 dias, ciclo total ~277 dias (o número da fase de detecção)
- **Google SRE Book — *Postmortem Culture: Learning from Failure***: o conceito de post-mortem blameless
- **NIST SP 800-63B — Digital Identity Guidelines**: rotação de credencial mediante evidência de comprometimento
- **GitHub — Removing sensitive data from a repository**: por que remover o commit não basta em repo público
- Módulos relacionados: `60-seguranca/05-secrets-management`, `07-auditoria-logs`, `12` (hardening), `82-robustez/06` (observabilidade)
