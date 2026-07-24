# 03 — Trade-offs Explícitos

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Não existe decisão técnica grátis. **Toda escolha compra uma vantagem pagando um custo**, e engenharia é a disciplina de escolher *qual custo aceitar de olhos abertos*. O júnior pergunta "qual é o melhor?"; o sênior pergunta "melhor **em quê**, pagando **o quê**?". A pergunta do júnior não tem resposta — "melhor" sem dimensão é vazio — e é exatamente por isso que ela denuncia. Este módulo é o que mais pesa na promoção júnior→pleno, porque a diferença entre os dois níveis quase nunca é sintaxe: é a capacidade de **defender uma decisão** nomeando o que ela custou. Quem só sabe a vantagem escolheu no escuro; quem sabe a vantagem e o custo escolheu como engenheiro.

---

## § BASE — o fundamento

**Trade-off é uma lei, não uma falha de projeto.** A ideia primitiva vem da economia: **custo de oportunidade**. Todo recurso gasto num caminho (tempo, memória, CPU, complexidade, uma peça de infra a mais pra manter) é um recurso que deixou de ir pro caminho alternativo. Não há almoço grátis — a expressão "there ain't no such thing as a free lunch" (Milton Friedman popularizou, Robert Heinlein cunhou em ficção) é o nome popular do princípio. Em engenharia isso significa: **quando alguém te diz que uma tecnologia é "melhor" sem dizer em qual dimensão e ao custo de quê, ou está vendendo ou não entendeu.**

**O trade-off formalizado: o teorema CAP.** Eric Brewer conjecturou em 2000, e Gilbert & Lynch **provaram** em 2002, que um sistema distribuído, **na presença de uma partição de rede** (P), tem que escolher entre **Consistência** (C — todo leitor vê o dado mais recente) e **Disponibilidade** (A — toda requisição recebe resposta). Não existe terceira opção: com a rede partida, ou você recusa responder pra não servir dado velho (escolheu C), ou responde com o que tem arriscando servir dado velho (escolheu A). O CAP importa aqui não porque você vai desenhar um banco distribuído amanhã, mas porque é a **prova matemática de que "escolher um sem pagar o outro" é literalmente impossível** numa classe inteira de problemas. O que no dia a dia parece falta de esforço ("por que não posso ter os dois?") às vezes é uma impossibilidade demonstrada.

**"Depende" sozinho é não-resposta.** O erro simétrico ao "X é sempre melhor" é o "depende" solto. A resposta de engenheiro tem a forma **"depende de X: se X, então A; senão, B"** — ela nomeia o **critério decisivo**, a variável que desempata *neste* contexto. Quem diz só "depende" sinaliza que sabe que o trade-off existe, mas não sabe *o que* o resolve — decorou a existência do trade-off sem entender o mecanismo. Nomear o critério é a prova de que você entendeu.

**A escala do custo importa: portas de uma via vs de duas vias.** Jeff Bezos separou decisões em **irreversíveis** ("one-way doors" — caras ou impossíveis de desfazer) e **reversíveis** ("two-way doors" — dá pra voltar barato). O peso da análise deve escalar com a reversibilidade: numa two-way door, decida rápido e corrija se errar (o custo do erro é baixo); numa one-way door — schema em produção com dados de cliente, escolha de banco, contrato público de API —, o custo de errar é alto e a análise formal se paga. Gastar uma semana decidindo o que dá pra reverter em 10 minutos é tão errado quanto decidir em 10 minutos o que vai custar meses pra desfazer.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os trade-offs de software se organizam em dois eixos úteis:

```
                        REVERSÍVEL (two-way)        IRREVERSÍVEL (one-way)
FORMAL (provado)     retry vs fila num sync       escolha de banco (SQL/NoSQL)
                     memoizar vs recalcular        CAP: consistência vs disponibilidade
INFORMAL (heurístico) monolito vs microsserviço    schema público / contrato de API
                     lib A vs lib B                 formato de dado persistido
```

- **Eixo formal ↔ informal:** alguns trade-offs têm prova (CAP; memória vs CPU numa memoização é aritmética), outros são heurísticos (monolito vs microsserviço: simplicidade de deploy vs autonomia dos times). O formal você cita; o informal você argumenta com o critério decisivo.
- **Eixo reversível ↔ irreversível:** define quanto rigor a decisão merece (a distinção de Bezos acima).

E há a **cristalização da decisão: o ADR** (Architecture Decision Record, formato popularizado por Michael Nygard em 2011). Uma decisão de engenharia não vive só no código — o código mostra o **quê**, nunca o **por quê**. Seis meses depois, alguém (talvez você) olha o `retry+lockfile` e pensa "por que não usaram uma fila? que amadorismo". O ADR é o registro **imutável** que responde antes que a pergunta vire refação: ele guarda o contexto que o código apaga. É a mesma família de raciocínio do bloco 🎓 e do `DECISIONS.md` do teu fluxo — a decisão fica defensável porque ficou escrita **no momento** em que o contexto ainda estava vivo.

---

## § METODOLOGIA — o passo-a-passo replicável

**O framework em 4 passos:**

**1. OPÇÕES A/B/C** — no mínimo duas reais. Se só existe uma opção, não há decisão a documentar (e desconfie: quase sempre existe pelo menos "não fazer" ou "fazer o mais simples").

**2. CRITÉRIO DECISIVO** — a *uma* variável que desempata neste contexto: volume? prazo? infra disponível? reversibilidade? Não liste dez fatores — identifique o que *de fato* decide. Se você não consegue nomear um critério, você não entendeu o trade-off ainda.

**3. DECISÃO** — qual opção o critério escolhe. Deve ser uma consequência quase mecânica do passo 2.

**4. CONSEQUÊNCIAS ACEITAS** — o que você está **deliberadamente pagando**. Escrever isso é o que dissolve o "por que não pensaram nisso?" futuro: pensaram, aceitaram, e registraram o gatilho de quando revisar.

**ADR de 6 linhas** (cabe em qualquer commit):

```markdown
## 2026-07-19 — [sync] Retry + lockfile em vez de fila
**Problema:** sync do ERP-externo falha sob rate-limit e duplica em execução concorrente.
**Opções:** A) retry+backoff+lockfile na edge function · B) fila (Redis/Bull) · C) cron ingênuo
**Decisão:** A.
**Por quê:** critério decisivo = infra disponível: sem servidor p/ Redis; volume (centenas de registros/dia) não justifica fila.
**Consequências:** sem escala horizontal do worker; lock órfão exige TTL; migrar p/ B se volume ×10.
**Em entrevista (30s):** "o mais simples que resolve o volume atual, com gatilho de migração escrito."
```

Caso real AG: foi exatamente essa a decisão no sync do **CLIENTE OFICINA** — retry com backoff exponencial + lockfile com TTL contra execução dupla. A fila era "mais certa" no abstrato; o critério decisivo (infra zero + volume baixo) escolheu o simples, e a consequência ficou registrada **com gatilho de revisão** (volume ×10 → reavaliar). Sem o ADR, essa decisão pareceria preguiça em vez de escolha.

**O teste de qualidade — "apaga a decisão":** cubra mentalmente a linha *Decisão* do ADR. Um colega chegaria à mesma escolha só com *Problema + Opções + Critério*? Se sim, o critério está bem nomeado e a decisão é reconstrutível — é engenharia. Se não, o critério está frouxo e a "decisão" foi gosto disfarçado — reescreva o critério.

**Anti-padrões:**
- **"X é sempre melhor":** trade-off negado. Não existe "sempre melhor" sem dimensão — pergunte "melhor em quê, pagando o quê?".
- **"Depende" solto:** trade-off reconhecido mas não resolvido. Force a forma "depende de X: se X então A".
- **Listar só a vantagem:** metade do trade-off. Toda opção precisa do **custo nomeado**, não só do benefício — senão o ADR é propaganda.
- **Rigor invertido:** análise longa em two-way door, decisão apressada em one-way door. Escale o esforço pela reversibilidade.

---

## Passo-a-passo aplicado (faça agora, ~25min)

```bash
# 1. Ache uma decisão implícita no seu projeto (lib, padrão, workaround)
git log --oneline -20
# 2. Crie DECISIONS.md na raiz (se faltar) e escreva o ADR de 6 linhas
# 3. Classifique: é one-way ou two-way door? (isso calibra quanto a análise merecia)
# 4. Teste "apaga a decisão": cubra a linha Decisão.
#    Um colega reconstrói a escolha só com Problema + Opções + Critério?
#    Se não, o critério decisivo está mal nomeado — reescreva até reconstruir.
```

Faça isso com **uma** decisão hoje. O objetivo não é documentar tudo retroativamente — é treinar o reflexo de nomear o critério decisivo, que é o que aparece na entrevista.

## Por que cai em entrevista

"Por que X e não Y?" é **A** pergunta que separa pleno de júnior — mais que qualquer pergunta de sintaxe. O entrevistador quase nunca discorda da sua escolha; ele mede se a escolha **teve dono**. Responder com critério + consequência aceita prova senioridade mesmo quando a escolha foi discutível — porque o que ele avalia é o *raciocínio*, não a resposta.

> **P:** "Por que você usou retry com backoff em vez de uma fila de mensagens?"
>
> **R (30s):** "Critério decisivo: infra e volume. Eram centenas de registros por dia num sync de ERP e eu não tinha servidor para sustentar Redis — fila adicionaria uma peça de infra inteira para um problema que backoff exponencial mais lock com TTL resolve. Aceitei duas consequências, documentadas no ADR: não escala horizontal e lock órfão depende do TTL. E deixei o gatilho escrito: volume dez vezes maior, a decisão certa passa a ser fila. Não é 'fila é ruim' — é 'fila custa mais do que este problema paga'."

> **P:** "Qual foi uma decisão técnica sua que envelheceu mal?"
>
> **R (30s):** "O valor da resposta não está no acerto — está em eu saber *por que* decidi e *o que mudou*. Toda decisão minha vira ADR com o critério decisivo e o gatilho de revisão; então quando uma envelhece mal, eu abro o registro e comparo: o critério ainda vale? Geralmente o que mudou foi uma premissa — o volume cresceu, a infra apareceu — e o próprio ADR já previa isso como gatilho de migração. Decisão sem registro não dá pra revisar com honestidade, porque a gente reescreve o passado; com o ADR, eu sei exatamente o que eu sabia na hora."

## Checkpoint

- [ ] Transformo "depende" em "depende de X: se X então A, senão B" em 3 decisões do meu stack
- [ ] Sei explicar o CAP como prova de que "os dois sem custo" pode ser impossível
- [ ] Classifico decisões em reversível/irreversível e escalo o rigor da análise por isso
- [ ] Escrevi ≥ 1 ADR de 6 linhas num projeto real esta semana
- [ ] Toda opção da minha lista tem o CUSTO nomeado, não só a vantagem
- [ ] Passo no teste "apaga a decisão": o critério sozinho reconstrói a escolha

## Recursos

- *Documenting Architecture Decisions* — Michael Nygard (2011): o post original dos ADRs (formato Contexto/Decisão/Consequências)
- Gilbert & Lynch, *"Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services"* (2002): a prova formal do CAP
- *Designing Data-Intensive Applications* — Martin Kleppmann: o livro inteiro é análise de trade-off (cap. 5 replicação, cap. 9 consistência)
- Jeff Bezos — carta aos acionistas da Amazon (2015): a distinção one-way / two-way doors
- Módulo `20-arquitetura/05-adrs-architecture-decision-records.md` desta trilha — aprofunda o formato do ADR
