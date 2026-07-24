# 10 — Threat Modeling

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Threat modeling é **modelar o adversário antes de escrever a feature** — mapear o que pode dar errado por ação de alguém mal-intencionado enquanto o design ainda é barato de mudar. É o antídoto do **A04:2021 — Insecure Design**: a categoria que a OWASP criou em 2021 justamente pra dizer que a maioria das falhas *não é bug de implementação* — é ausência de qualquer pergunta sobre ataque no momento do design. E a distinção é operacional, não acadêmica: bug de implementação (A03) tem patch; design inseguro (A04) tem **redesenho**. Perguntar antes é arquitetura; corrigir depois é remendo.

---

## § BASE — o fundamento

**O método por trás do método — Shostack, as quatro perguntas.** Adam Shostack, em *Threat Modeling: Designing for Security* (2014), reduz threat modeling a quatro perguntas que qualquer pessoa consegue rodar:

1. **No que estamos trabalhando?** (desenhar o sistema)
2. **O que pode dar errado?** (enumerar ameaças)
3. **O que vamos fazer a respeito?** (mitigar/eliminar/transferir/aceitar)
4. **Fizemos um bom trabalho?** (revisar o próprio modelo)

Todo o resto — STRIDE, diagramas — é ferramenta pra responder essas quatro. Guardar o esqueleto de 4 perguntas é o que impede o threat model de virar ritual burocrático: se você não consegue apontar o que está trabalhando e o que faz a respeito, você tem um documento, não um modelo.

**A lente para a pergunta 2 — STRIDE (Kohnfelder & Garg, Microsoft, 1999).** Loren Kohnfelder e Praerit Garg escreveram o memo interno *The Threats to Our Products* em 1999, e dele nasceu o mnemônico mais usado da área. A sacada elegante: cada uma das seis categorias é a **negação de uma propriedade de segurança** que você quer garantir. Você não precisa imaginar ataques do zero — percorre as seis propriedades e pergunta "e se esta falhar?":

| STRIDE | Viola a propriedade | O ataque | Defesa (módulo) |
|---|---|---|---|
| **S**poofing | Autenticação | fingir ser outro usuário | authn forte, token assinado (09) |
| **T**ampering | Integridade | alterar dado em trânsito/repouso | TLS, validação em boundary, assinatura |
| **R**epudiation | Não-repúdio | "não fui eu" sem prova em contrário | audit log imutável (07) |
| **I**nformation disclosure | Confidencialidade | vazar dado sensível | RLS, criptografia (11), menor privilégio |
| **D**enial of service | Disponibilidade | derrubar o serviço | rate limit, timeout, degradação |
| **E**levation of privilege | Autorização | virar admin sem ser | authz por recurso, RLS (09) |

**A fronteira de confiança é o ponto de partida.** O conceito central do Shostack é o **trust boundary**: a linha onde dado *não-confiável* cruza pra dentro de uma zona *confiável* — o browser anônimo → sua Edge Function, o input do usuário → seu banco. A ferramenta é o **Data Flow Diagram (DFD)**: você desenha os fluxos e marca onde eles atravessam fronteiras, porque **é na fronteira que a ameaça vive**. Threat modeling sem marcar fronteiras é olhar pro sistema inteiro de uma vez e não ver nada; marcar a fronteira foca a análise onde importa.

**A controvérsia (declarada).** STRIDE tem uma fraqueza conhecida, que o próprio Shostack reconhece: ele **enumera mas não prioriza**. As seis categorias te dão a lista completa de o-que-pode-dar-errado, mas não dizem *qual é mais provável* nem *qual dói mais* — e uma lista sem ranking vira paralisia ou teatro. A tentativa da Microsoft de rankear, o **DREAD**, é hoje amplamente criticada por ser subjetiva e irreprodutível (dois analistas dão notas diferentes pro mesmo risco) e caiu em desuso. A prática madura: use STRIDE pra *enumerar* e um julgamento explícito de probabilidade × impacto pra *ordenar* — sem fingir que o segundo é uma ciência exata.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O trabalho se organiza pelas quatro perguntas do Shostack, com STRIDE dentro da segunda e a fronteira de confiança como o objeto que amarra tudo:

```
Q1: NO QUE ESTAMOS TRABALHANDO?  →  Data Flow Diagram + fronteiras de confiança

   [Browser anônimo]  ⟵ NÃO-CONFIÁVEL
        │  (o dado cruza AQUI = trust boundary — analise este ponto)
   ═════╪═══════════════════════════════  ◄── fronteira
        ▼  CONFIÁVEL
   [Edge Function] ──► [Postgres + RLS] ──► [audit_log]

Q2: O QUE PODE DAR ERRADO?  →  percorra STRIDE em CADA fronteira
        S T R I D E  (as 6 sempre — a esquecida é quase sempre R ou E)

Q3: O QUE FAZER?  →  por ameaça: Mitigar · Eliminar · Transferir · Aceitar
        e PRIORIZAR (STRIDE não prioriza) por probabilidade × impacto

Q4: FIZEMOS BOM TRABALHO?  →  revisar; ligar cada achado a uma decisão de design
```

A ameaça que passa batido tem padrão: sem framework você pensa só na óbvia (roubar dado = Information disclosure) e esquece **Repudiation** (ninguém loga, então "não fui eu" é imbatível) e **Elevation** (o endpoint admin sem verificação de role). STRIDE existe pra te obrigar a percorrer as seis e achar essas duas.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. DESENHAR o DFD e marcar as fronteiras de confiança.** Onde dado não-confiável cruza pra dentro? Esse é o alvo da análise — não o sistema inteiro.

**2. PERCORRER as seis letras do STRIDE em cada fronteira.** Uma por uma, mesmo as que "obviamente não se aplicam" — é percorrendo a que parece boba que você acha a que passou batido.

**3. DECIDIR o destino de cada ameaça:** *mitigar* (adicionar defesa), *eliminar* (mudar o design pra ela não existir — ex.: anônimo por construção elimina Spoofing da resposta), *transferir* (delegar a um provedor) ou *aceitar* (risco documentado e consciente).

**4. PRIORIZAR** por probabilidade × impacto — porque STRIDE lista, não ordena. Julgamento explícito, não nota mágica.

**5. TRANSFORMAR em decisões de design, agora.** O output não é PDF pra arquivar: é a lista de decisões que você toma no design, de graça, em vez de descobrir num incidente.

**Anti-padrões:**
- **Threat model como documento pra arquivar.** Se ninguém muda uma linha de design por causa dele, foi teatro.
- **Modelar depois de codar.** Aí toda ameaça vira patch, não arquitetura — perdeu o barato do "de graça no design".
- **Esquecer Repudiation e Elevation.** As duas mais negligenciadas; STRIDE existe pra forçar as seis.
- **Enumerar sem priorizar.** Lista de 30 ameaças sem ranking paralisa; sem probabilidade × impacto você trata a bobagem igual à catástrofe.
- **Pensar só na ameaça óbvia.** Sem percorrer as seis letras, você fecha a porta da frente e deixa a lateral aberta.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Pegue uma feature real da AG — o formulário **anônimo** de pesquisa do PULSAR-RH — e rode as quatro perguntas com STRIDE na segunda.

1. **Q1 — DFD e fronteiras.** Browser anônimo (não-confiável) → Edge Function → banco. A fronteira crítica é onde o dado não-confiável cruza pra dentro.
2. **S — Spoofing:** alguém responde se passando por outro colaborador? → o design é *anônimo por construção*: não há identidade a falsificar na resposta (o ledger de participação é separado — módulo 07). Ameaça **eliminada** pelo design, não mitigada.
3. **T — Tampering:** manipulam o payload pra injetar resposta inválida? → validação de schema no boundary; não confiar no front. **Mitigar.**
4. **R — Repudiation:** não se aplica às respostas (anônimas), mas ações do admin precisam de audit log. **Mitigar** no lado admin.
5. **I — Information disclosure:** a resposta anônima vaza a identidade por um canal lateral? → foi *exatamente* o bug real: o `audit_log` gravava a identidade que o schema tinha parado de guardar. O threat model teria pego isso antes. **A ameaça mais cara, achada pela pergunta certa.**
6. **D — DoS:** bot enche o banco de respostas falsas? → rate limit por IP, captcha se necessário. **Mitigar.**
7. **E — Elevation:** o endpoint de resultado exige role de admin? → verificar authz, não só authn. **Mitigar.**

O resultado não é um documento — é uma lista de decisões de design tomadas agora, de graça.

## Por que cai em entrevista

"Como você pensa em segurança ao projetar uma feature?" — quem responde STRIDE (ou pelo menos "modelo o adversário antes de codar") demonstra maturidade de design, não só conhecimento de vulnerabilidade isolada. E diferencia A04 (design inseguro) de A03 (bug de implementação): o primeiro não tem patch, tem redesenho.

> **P:** "Você vai construir um formulário público que coleta dados. Como pensa a segurança dele antes de codar?"
>
> **R (30s):** "Rodo um threat model rápido com STRIDE nas fronteiras de confiança. O dado vem de um cliente não-confiável, então: Tampering eu fecho com validação de schema no boundary; Information disclosure eu checo perguntando 'algum canal lateral vaza o que deveria ser anônimo?' — já me queimei com isso, o audit log gravava a identidade que o schema tinha parado de guardar; DoS eu mitigo com rate limit; Elevation eu fecho exigindo authz por role no endpoint de resultado, não só login. O ponto é fazer essas perguntas no design, quando mudar é de graça — insegurança de design não tem patch, tem redesenho."

> **P (nova):** "O que é uma fronteira de confiança e por que ela é o ponto de partida do threat model?"
>
> **R (30s):** "Fronteira de confiança é a linha onde um dado não-confiável cruza pra dentro de uma zona confiável — o browser anônimo entrando na minha Edge Function, o input do usuário chegando no banco. É o ponto de partida porque é ali que a ameaça vive: dentro da minha zona confiável eu controlo tudo, o perigo é o que atravessa de fora. Se eu tento modelar o sistema inteiro de uma vez, me perco; se eu desenho o data flow e marco onde cruza a fronteira, a análise foca onde importa. Foi assim que, no formulário anônimo do PULSAR-RH, a pergunta certa apareceu: na fronteira da resposta anônima, algum canal lateral vaza a identidade? A resposta era sim — o audit log — e o threat model teria pego isso no design em vez de em produção."

## Checkpoint

- [ ] Sei as quatro perguntas do Shostack e uso STRIDE só na segunda ("o que pode dar errado")
- [ ] Sei as 6 categorias STRIDE e a propriedade de segurança que cada uma viola
- [ ] Explico o que é fronteira de confiança e desenho um DFD marcando onde ela está
- [ ] Explico a diferença entre A04 (design inseguro, sem patch) e A03 (bug de implementação)
- [ ] Reconheço que STRIDE enumera mas não prioriza — e ordeno por probabilidade × impacto
- [ ] Conecto um achado do threat model (o vazamento no audit log) a um bug real que teria prevenido

## Recursos

- **Kohnfelder & Garg (1999) — *The Threats to Our Products* (Microsoft)**: a origem do STRIDE (fonte primária da §BASE)
- **Adam Shostack — *Threat Modeling: Designing for Security* (2014)**: as quatro perguntas, DFD, fronteiras de confiança, a crítica ao DREAD
- **OWASP — Threat Modeling** e **OWASP Top 10 — A04:2021 Insecure Design**
- **Microsoft — STRIDE / Threat Modeling Tool**: o mapeamento categoria → propriedade
- Módulos relacionados: `60-seguranca/01` (OWASP), `09` (authn/authz), `07-auditoria-logs-imutavel`, `11` (criptografia)
