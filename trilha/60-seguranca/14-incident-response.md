# 14 — Incident Response

## O que é

Incident response é **o que você faz quando a defesa falhou** — porque uma hora falha. Segurança madura não é a fantasia de nunca ser comprometido; é ter um plano frio pra hora quente, quando a chave vazou, o dado saiu ou o serviço foi invadido, e a adrenalina empurra você a fazer a coisa errada na ordem errada. O plano existe justamente porque, no meio do incidente, você não pensa direito — então pensa antes.

O ciclo canônico (NIST) tem quatro fases:

**1. Detecção.** Você não pode responder ao que não vê. É aqui que a observabilidade (robustez 06) e o logging (A09 do módulo 01) pagam a conta: sem log de acesso e alerta de anomalia, o breach roda invisível. O número que assusta: o tempo médio pra *detectar* um breach é de **~200 dias** (IBM Cost of a Data Breach). Duzentos dias de acesso indevido antes de alguém perceber — quase sempre porque ninguém estava olhando.

**2. Contenção.** Parar o sangramento *antes* de entender tudo. E aqui está a regra que mais contraria o instinto de dev: **revogar antes de investigar**. Chave vazou no repo? Revoga a chave AGORA — antes de descobrir quem commitou, quando, ou se alguém usou. A ordem é essa porque cada minuto investigando é um minuto com a chave ainda válida na mão de quem a pegou. Esse é literalmente o protocolo da AG: `.env` commitado → revogar a credencial ANTES de qualquer outra ação. Rotacionar depois; investigar depois; conter primeiro.

**3. Erradicação e recuperação.** Remover o acesso do atacante (fechar a porta que ele usou, não só expulsá-lo), rotacionar todos os segredos que *podem* ter sido expostos (na dúvida, rotaciona — barato perto do risco), e restaurar de um backup que você tem certeza de ser anterior ao comprometimento (robustez/dados: backup testado, RPO conhecido). Recuperar sem fechar a porta é convidar o atacante a voltar.

**4. Post-mortem sem culpado (blameless).** Depois que o fogo apaga: o que aconteceu, por que a defesa falhou, o que muda pra não repetir. A palavra-chave é **blameless** — o objetivo é consertar o sistema que *permitiu* o erro, não punir quem apertou o botão. Cultura que caça culpado gera cultura que esconde incidente, e incidente escondido é o pior tipo. O erro é sinal de um processo frágil, não de uma pessoa ruim.

### Passo-a-passo: a primeira hora de uma chave vazada

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

O passo 5 é a lição dura: em repo público, dado sensível que entrou no histórico **já foi indexado, clonado, arquivado**. Reescrever o histórico não desfaz o vazamento — a revogação é a única contenção que funciona de verdade. É por isso que a ordem é revogar primeiro: o resto é limpeza, a revogação é a defesa.

## Por que cai em entrevista

Incident response mostra maturidade operacional — pensar em "quando falhar", não só "pra não falhar". "O que você faz se descobrir uma chave commitada?" é pergunta comum, e a resposta certa (revogar antes de investigar) é contra-intuitiva o bastante pra separar quem já viveu de quem só leu. Blameless post-mortem sinaliza que você entende cultura de engenharia, não só técnica.

> **P:** "Você descobre que uma chave de API está commitada num repositório. Qual sua primeira ação?"
>
> **R (30s):** "Revogar a chave, imediatamente, antes de qualquer investigação. O instinto é ir olhar quem commitou e quando — errado: cada minuto investigando é um minuto com a chave válida na mão de quem já a pegou. Contenção vem antes de análise. Revogo, emito uma nova com escopo mínimo, troco em produção, e só então investigo desde quando estava exposta e se foi usada. E se o repo é público, revogar é a única saída real — a chave já está em todo o histórico do git, indexada e clonada; reescrever histórico não desfaz vazamento. Depois, post-mortem sem culpado: conserto o processo que deixou a chave chegar no commit, que é o problema de verdade."

## Checkpoint

- [ ] Sei as 4 fases do ciclo (detecção, contenção, erradicação/recuperação, post-mortem)
- [ ] Explico por que "revogar antes de investigar" e defendo a ordem
- [ ] Sei por que, em repo público, revogação é a única contenção real de uma chave
- [ ] Explico o que é post-mortem blameless e por que caçar culpado piora a segurança
- [ ] Conecto detecção ao logging/observabilidade (sem log, o breach é invisível)

## Recursos

- [NIST SP 800-61 — Computer Security Incident Handling Guide](https://csrc.nist.gov/pubs/sp/800/61/r2/final)
- [Google SRE Book — Postmortem Culture: Learning from Failure](https://sre.google/sre-book/postmortem-culture/)
- [GitHub — Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Módulos relacionados: `60-seguranca/05-secrets-management`, `07-auditoria-logs`, `82-robustez/06` (observabilidade)
