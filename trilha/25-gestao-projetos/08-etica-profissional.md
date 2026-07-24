# 08 — Ética Profissional

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática, P/R e checkpoint.

## O que é

Software **age no mundo**: ele dosa radiação, mede emissão de poluente, nega crédito, guarda o CPF de alguém. Não existe código "neutro" quando ele tem consequência física, financeira ou sobre a vida de uma pessoa. Por isso engenharia de software tem **códigos de ética formais** — não etiqueta de boas maneiras, mas o contrato que diz que a sua obrigação com o público **supera** a ordem do gestor e o prazo do cliente.

O júnior aprende a dizer "sim, faço" antes de aprender a dizer "não, isso é errado" — e a defesa "eu só executei a task" já mandou engenheiro para a cadeia e já matou paciente. O objetivo aqui: (1) os dois códigos canônicos como checklist concreto, (2) dois casos onde o processo de software falhou com mortos e crime, e (3) a habilidade mais difícil da profissão: recusar.

---

## § BASE — o fundamento

**Os dois códigos canônicos.** A profissão tem dois documentos-fonte, e você deve citar os dois **por número** — "acho que existe um código de ética" não vale nada; "o princípio 1.2 da ACM" vale muito.

**1) ACM Code of Ethics and Professional Conduct (2018)** — princípios numerados. Os que mais aparecem no dia a dia:

- **1.1** Contribuir para a sociedade e o bem-estar humano, reconhecendo que *todas* as pessoas são stakeholders da computação.
- **1.2** **Evitar dano.** Dano é consequência negativa, especialmente quando séria e injusta; a negligência conta como dano intencional.
- **1.3** Ser honesto e confiável — incluindo ser transparente sobre limitações do sistema.
- **1.6** Respeitar privacidade; **1.7** honrar confidencialidade.
- **2.1** Buscar alta qualidade no *processo* e no *produto*.
- **2.5** Dar **avaliações abrangentes** dos sistemas e impactos, **incluindo análise de riscos possíveis.** É o princípio que torna o silêncio sobre um risco conhecido uma violação *ativa* — calar não é neutro.
- **2.6** Trabalhar só em áreas de competência; **2.9** projetar sistemas robustamente seguros.
- **3.1** (liderança) O **bem público** como preocupação central de todo trabalho; **3.7** cuidar de sistemas que viram infraestrutura da sociedade.

**2) IEEE-CS/ACM Software Engineering Code of Ethics and Professional Practice (1999, versão 5.2)** — redigido por uma força-tarefa conjunta presidida por Don Gotterbarn, específico para *engenharia de software*. São **8 princípios**, e a ordem não é acidental — ela é uma hierarquia:

1. **PUBLIC** — agir consistentemente com o interesse público.
2. **CLIENT AND EMPLOYER** — agir no melhor interesse do cliente e do empregador, **desde que consistente com o interesse público.**
3. **PRODUCT** — garantir que produtos e modificações atinjam o mais alto padrão profissional possível.
4. **JUDGMENT** — manter integridade e **independência** no julgamento profissional.
5. **MANAGEMENT** — liderança promove abordagem ética à gestão do desenvolvimento.
6. **PROFESSION** — zelar pela integridade e reputação da profissão.
7. **COLLEAGUES** — ser justo e solidário com os colegas.
8. **SELF** — aprendizado contínuo e prática ética por toda a carreira.

O preâmbulo é explícito: o código **não é um algoritmo** que resolve todo dilema mecanicamente — é um conjunto de princípios com **precedência**. E ela é clara: quando CLIENT (2) colide com PUBLIC (1), **PUBLIC vence.** É aqui que os dois casos abaixo explodiram.

**Caso 1 — Therac-25 (Leveson & Turner, 1993).** O paper *"An Investigation of the Therac-25 Accidents"* (Nancy Leveson e Clark Turner, *IEEE Computer*, vol. 26, nº 7, julho de 1993) é o estudo canônico de software que **matou**. O Therac-25 era um acelerador linear de radioterapia da AECL; entre 1985 e 1987 houve **seis acidentes documentados de sobredose massiva de radiação, com ao menos três mortes**. A leitura preguiçosa diz "foi um bug". A correta — a de Leveson — é que **não houve um bug; houve um processo de engenharia falido.**

- Havia **pelo menos dois defeitos distintos** (uma *race condition* quando o operador editava a prescrição em menos de 8 segundos; e um contador de 8 bits que estourava a cada 256 incrementos e, quando calhava de estar zero no "set", **pulava a checagem do colimador**). Corrigir um não evitaria os outros acidentes — prova de que "achar o bug" não era o problema.
- O Therac-**20**, anterior, tinha **o mesmo erro de software** — mas **intertravamentos de hardware** (fusíveis) impediam a sobredose. O Therac-25 **removeu o hardware de segurança e confiou só no software.** A lição que Leveson martela: **confiabilidade de software não é segurança de software** — pode rodar "certo" mil vezes e ser inseguro por design.
- Código reusado do Therac-6/20 com bugs latentes que o hardware mascarava; erros crípticos ("MALFUNCTION 54") que o operador aprendeu a ignorar; sem análise de risco séria; **nenhuma revisão de código independente**; **excesso de confiança no software**. O relato pobre aos reguladores atrasou a correção.

A conclusão de Leveson é uma frase de ética, não de técnica: acidentes com software vêm do **sistema e da organização** — processo, suposições, confiança injustificada — não de uma linha isolada. (Expandido em *Safeware: System Safety and Computers*, 1995.)

**Caso 2 — Volkswagen "Dieselgate" (processo do DOJ).** Em 2015 a EPA emitiu uma Notice of Violation contra a VW: os motores diesel EA189 tinham um **defeat device** — software que **reconhecia o ciclo de teste de emissões** (volante parado, velocidade, duração, pressão) e ligava o controle total de NOx **só durante o teste**; na rua, a emissão chegava a ~40× o limite legal. Não foi bug: foi engenharia **deliberada** para enganar o regulador. O ponto é quem pagou: o engenheiro **James Liang se declarou culpado (2017)** de conspiração e foi **condenado a 40 meses de prisão e US$ 200 mil de multa** pelo DOJ (*United States v. Liang*); o executivo Oliver Schmidt pegou 7 anos. Liang não desenhou a fraude nem lucrou como os chefes — **executou a task que mandaram.** Não bastou como defesa.

**O dever de dizer não, e o whistleblowing técnico.** Junte 2.5 da ACM (avaliar e comunicar riscos) com o princípio 1 (PUBLIC) do IEEE e há uma obrigação positiva: quando o trabalho pedido coloca o público em risco, o profissional tem **o dever de recusar** e, se grave e não corrigido internamente, de **reportar** (whistleblowing). O IEEE lista isso: revelar ao empregador/cliente os perigos que você conhece e, quando ignorado, escalar para quem tenha autoridade — porque a lealdade ao empregador (2) **não sobrepõe** o interesse público (1). "**Eu só executei a task**" é a versão de engenharia do "eu só cumpria ordens": **não é defesa** — a independência de julgamento (4, JUDGMENT) é sua justamente para poder dizer não.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A ética profissional não é uma lista plana de "seja bonzinho". Ela é uma **hierarquia de lealdades com precedência definida**, e é isso que decide o dilema quando dois deveres colidem:

```
   PRECEDÊNCIA (quem vence quando há conflito)
   ┌──────────────────────────────────────────────┐
   │  1. PÚBLICO / EVITAR DANO   (ACM 1.1,1.2,2.5) │  ← vence sempre
   │        ▲                    (IEEE §1 PUBLIC)   │
   │        │ supera                                │
   │  2. CLIENTE / EMPREGADOR    (IEEE §2)          │  ← "…consistente
   │        ▲                                       │     com §1"
   │        │ supera                                │
   │  3. PROFISSÃO / COLEGAS     (IEEE §6,§7)       │
   │        ▲                                       │
   │        │                                       │
   │  4. VOCÊ / A TASK           (IEEE §8 SELF)     │  ← nunca é o topo
   └──────────────────────────────────────────────┘
        JUDGMENT (§4) é o eixo vertical que atravessa tudo:
        é a independência que te deixa dizer "não" para cima.
```

- **Therac-25** foi um colapso do nível 1 por **omissão**: ninguém avaliou o risco a sério (2.5) nem tratou "confiabilidade" como se fosse "segurança".
- **Dieselgate** foi um colapso do nível 1 por **ação**: o nível 2 (empregador) foi obedecido *contra* o nível 1 (público) — exatamente a inversão que o código proíbe.
- O **dever de dizer não** é o mecanismo que mantém a pirâmide na ordem certa: sem JUDGMENT independente, o nível 4 ("a task que me deram") sobe ao topo, e é aí que gente morre ou vai presa.

---

## § METODOLOGIA — o passo-a-passo replicável

Um **check de ética** antes de shippar qualquer feature com consequência (dado pessoal, dinheiro, segurança, decisão sobre pessoas). Cinco passos:

**1. IDENTIFICAR os stakeholders — quem é afetado além de quem pediu.** O cliente pediu; mas quem *sofre* a consequência (o funcionário medido, o titular do dado, o paciente)? ACM 1.1: todos são stakeholders.

**2. NOMEAR o dano possível (2.5).** O pior resultado plausível em uma frase concreta: "se essa RLS falhar aberta, o vendedor A vê a comissão nominal do B". Risco não-nomeado é risco não-avaliado.

**3. CLASSIFICAR reversibilidade e escala.** Bug de UI reversível ≠ vazamento de PII irreversível e amplo. Quanto mais irreversível/amplo, mais o nível 1 pesa sobre o nível 2.

**4. CHECAR contra o código, por número.** Passe a feature pelos princípios aplicáveis (1.2 dano, 1.6 privacidade, 2.5 risco, 2.9 segurança). Onde ela fere um, registre no `DECISIONS.md` a decisão e a justificativa.

**5. Se colide com PÚBLICO: DIZER NÃO e ESCALAR.** Documente a objeção por escrito a quem pediu (cria rastro, força decisão consciente); se mantido e grave, escale. Recusar é o passo 5, não o zero: primeiro entenda, nomeie e documente; só então recuse, com fundamento.

**Anti-padrões:**
- **"Só executei a task."** Nível 4 no topo da pirâmide. É a defesa do Liang — que não funcionou.
- **Confiabilidade confundida com segurança.** "Passou nos testes" ≠ "é seguro"; o Therac-20 passava e o design era inseguro — foi o *hardware* que salvava.
- **Silêncio sobre risco conhecido.** Calar viola 2.5 *ativamente* — é omissão com dono, não neutralidade.
- **Objeção só verbal.** Sem rastro escrito, não protege ninguém e some na primeira reunião. Escreva.
- **Terceirizar a consciência pro cliente.** "O cliente assumiu o risco" não te exime do princípio 1 se o afetado é um terceiro que não estava na sala.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Pegue uma feature real de um projeto AG que **age sobre pessoas ou dados sensíveis** — no PULSAR-RH um ranking que expõe desempenho individual, na CLIENTE OFICINA uma métrica de produtividade por mecânico, ou qualquer tela que colete PII.

1. **Lista de stakeholders** (passo 1): inclua explicitamente quem é *medido/exposto*, não só quem pediu.
2. **Uma frase de dano** (passo 2): o pior resultado plausível, concreto. Ex.: "o ranking nominal vira base para demitir o último colocado, sem contexto".
3. **Classifique** (passo 3): reversível? qual escala?
4. **Rode contra 3 princípios com número** (passo 4): 1.2, 1.6/2.5, 2.9 — "ok" ou "fere, porque…". Registre a decisão no `DECISIONS.md` (bloco ADR-leve).
5. Se algum for ferido a sério, **escreva a objeção** que mandaria a quem pediu (as 3 linhas do passo 5). Esse parágrafo é a diferença entre um executor e um engenheiro — e a história real para a entrevista abaixo.

## Por que cai em entrevista

Empresa madura testa ética porque um engenheiro sem freio é passivo jurídico. Não perguntam "você é ético?" (todo mundo diz sim); perguntam um **cenário**. O que separa júnior de pleno é ter **um framework nomeado** (a hierarquia PUBLIC > CLIENT), **um caso na ponta da língua** (Therac ou Dieselgate) e a disposição de **escrever a objeção e escalar** — não o heroísmo vago de "eu não faria".

> **P:** "Seu gestor pede uma feature que você considera antiética ou perigosa para o usuário. O que você faz?"
>
> **R (30s):** "Não é 'obedeço' nem 'bato o pé'. Primeiro nomeio o dano concreto e quem é afetado além de quem pediu, e classifico reversibilidade e escala — é o 2.5 da ACM, avaliar e comunicar o risco. Aí registro a objeção **por escrito**, porque o IEEE coloca o interesse público (1) acima do empregador (2), e a independência de julgamento (4) existe justamente para eu poder dizer não. Se for grave e ignorado, escalo. O que não faço é a defesa do engenheiro da VW — 'eu só executei a task' — que rendeu 40 meses de prisão. Executar não isenta."

> **P:** "Um sistema seu passou em todos os testes. Ele é seguro?"
>
> **R (30s):** "Passar em teste é confiabilidade, não segurança, e o Therac-25 é a prova: o modelo anterior tinha o mesmo bug e não matava, porque tinha intertravamento de hardware; o -25 removeu o hardware, confiou só no software, e matou. A lição de Leveson é que acidente vem do *sistema e do processo*, não de uma linha isolada — havia dois defeitos distintos, corrigir um não resolveria. 'Passou nos testes' só me diz que os casos que imaginei funcionam; segurança exige análise de risco, revisão independente e não remover a rede de proteção porque o software 'parece' confiável."

## Checkpoint

- [ ] Sei citar por número ao menos 3 princípios da ACM (1.2, 2.5, e outro) e explicar o que exigem
- [ ] Sei os 8 princípios do IEEE-CS/ACM e por que PUBLIC (1) tem precedência sobre CLIENT (2)
- [ ] Sei explicar por que o Therac-25 **não** foi "um bug" — dois defeitos, hardware removido, confiabilidade ≠ segurança
- [ ] Sei contar o Dieselgate como caso de "só executei a task" que não isentou (condenação de Liang pelo DOJ)
- [ ] Consigo aplicar o check de 5 passos a uma feature real e registrar a objeção por escrito no `DECISIONS.md`
- [ ] Tenho uma resposta de 30s pronta para "o gestor pede algo que você acha errado"

## Recursos

- Nancy Leveson & Clark Turner — *"An Investigation of the Therac-25 Accidents"* (**IEEE Computer**, vol. 26, nº 7, julho 1993); aprofundamento em Nancy Leveson, *Safeware: System Safety and Computers* (1995)
- **ACM** — *Code of Ethics and Professional Conduct* (2018) — ler pelos princípios numerados (seções 1–4)
- **IEEE-CS/ACM** — *Software Engineering Code of Ethics and Professional Practice* (1999, versão 5.2; força-tarefa presidida por Don Gotterbarn) — os 8 princípios
- **U.S. Department of Justice** — *United States v. James Liang* (2017): declaração de culpa e sentença no caso do defeat device da Volkswagen (Dieselgate); contexto na EPA Notice of Violation (setembro de 2015)
- Módulo-irmão `07-documentar-decisoes` — a objeção ética e a decisão de risco moram no `DECISIONS.md`; e `60-seguranca` / `lgpd-check` para o dano de privacidade concreto
