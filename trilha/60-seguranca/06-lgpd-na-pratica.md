# 06 — LGPD na Prática

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro jurídico e científico),
> §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo replicável)
> — além da prática, P/R e checkpoint. Segue o padrão do módulo `05-raciocinio/00-metodologia-da-ia`.

## O que é

**LGPD (Lei nº 13.709/2018)** é a lei brasileira de proteção de dados, em vigor desde setembro de 2020. Se sua aplicação trata dados de pessoas físicas no Brasil — independentemente de onde o servidor está (art. 3) — ela se aplica. É modelada no GDPR europeu (Regulamento UE 2016/679). Para a AG não é opcional: o PULSAR-RH trata dado de RH de colaboradores de empresas clientes; o Meet Hub grava e transcreve reuniões com nomes e vozes reais. Este módulo traduz a lei — por artigo — em decisões de schema, retenção e exclusão.

---

## § BASE — o fundamento

**A lei, pelos artigos que o dev precisa conhecer.** LGPD não é ética vaga; é texto com número:

- **Art. 5** — as definições. *Dado pessoal* (inc. I): informação relacionada a pessoa **identificada ou identificável**. *Dado pessoal sensível* (inc. II): origem racial/étnica, convicção religiosa, opinião política, saúde, vida sexual, dado genético ou biométrico. *Anonimização* (inc. XI): processo que torna o dado **não mais associável a um indivíduo**.
- **Art. 6** — os **10 princípios** (incisos I a X): finalidade, adequação, **necessidade** (a minimização), livre acesso, qualidade, transparência, segurança, prevenção, não-discriminação e responsabilização. São o coração operacional da lei.
- **Art. 7 e Art. 11** — as **bases legais**. Art. 7 lista 10 hipóteses que autorizam o tratamento (consentimento, execução de contrato, legítimo interesse...); art. 11 restringe fortemente as bases para **dado sensível** — legítimo interesse genérico **não** basta.
- **Art. 15-16** — término do tratamento e **eliminação**: o dado deve ser eliminado quando a finalidade se exaure (o fundamento legal da retenção limitada).
- **Art. 18** — os **direitos do titular**: confirmação, acesso, correção, anonimização/bloqueio/eliminação (inc. IV e VI), portabilidade. O "direito ao esquecimento" mora no inc. VI.
- **Art. 37** — o controlador deve **manter registro das operações** de tratamento (a ponte para auditoria, módulo 07).

O GDPR é o espelho: princípios no **art. 5**, categorias especiais no **art. 9**, direito ao apagamento (*right to erasure*) no **art. 17**. Quem entende um lê o outro.

**A ciência por trás da minimização: dado "anônimo" quase nunca é.** O princípio da necessidade (art. 6, III) manda coletar só o indispensável — e há uma razão técnica dura para isso. **Latanya Sweeney**, em pesquisa de Harvard (final dos anos 1990, formalizada no artigo de *k-anonymity*, 2002), mostrou que **~87% da população dos EUA é unicamente identificável pela combinação de CEP + data de nascimento + sexo** — três campos que, isolados, ninguém chama de "identificação". Ela demonstrou reidentificando o prontuário do governador de Massachusetts num dataset "anonimizado" cruzado com o registro eleitoral. A lição para o design: **identificação é emergente** — nasce da *combinação* de campos, não de um campo mágico. Coletar "só a data de nascimento" já é coletar um quase-identificador. Minimizar não é delicadeza; é reduzir a superfície de reidentificação.

**Corolário que cai em prova: pseudoanonimização NÃO é anonimização.** Trocar nome e email por um id ainda deixa o dado **associável ao indivíduo** por quem tem a chave ou por cruzamento (o resultado de Sweeney). Por isso, tanto na LGPD (o dado pseudoanonimizado segue sendo *dado pessoal*, art. 12 §2) quanto no GDPR (recital 26), **dado pseudoanonimizado continua sob a lei**. Só o dado **verdadeiramente anonimizado** (irreversível, art. 12) sai do escopo. Confundir os dois é o erro clássico — e defender a diferença é o que separa o candidato que "sabe LGPD" do que decorou.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Do dado à obrigação técnica:

```
CLASSE DO DADO (art. 5)          BASE LEGAL (art. 7/11)      OBRIGAÇÃO TÉCNICA
identificação direta             consentimento OU            minimizar (art. 6 III);
(nome, CPF, email, telefone)     execução de contrato        criptografar; caminho de exclusão
                                                             (art. 18 VI)
quase-identificador              idem                        cuidado com CRUZAMENTO
(CEP, nascimento, IP, device id)                             (reidentificação — Sweeney)
dado sensível (saúde, NR-1,      base RESTRITA (art. 11) —   acesso granular; retenção curta;
biometria, raça, religião)       legítimo interesse não vale  auditoria de quem acessou (art.37)
```

**PII — o que conta como dado pessoal:** identificação direta (nome, CPF, RG, CNH, email, telefone, endereço); identificação indireta / quase-identificadores (IP, device id, GPS, cookie com id de usuário — perigosos por **combinação**); dado sensível (art. 5 II — proteção reforçada). **Atenção AG:** transcrições do Meet Hub contêm PII (nomes, temas de negócio); indicadores **NR-1** do PULSAR-RH (risco psicossocial) são **dado de saúde ocupacional** — categoria especial, art. 11.

**Retenção — a regra dos 180 dias.** A AG definiu 180 dias para transcrições/gravações. Isso é **decisão de negócio** ancorada no art. 15-16 ("enquanto durar a finalidade"), não um prazo que a lei fixe — o registro no `DECISIONS.md` deve dizer isso. Implementação técnica com `expires_at` + job de limpeza:

```ts
model Recording {
  id String @id @default(cuid())
  created_at DateTime @default(now())
  expires_at DateTime   // now() + 180d, calculado no insert
  deleted_at DateTime?  // null = ativo; date = marcado p/ exclusão
}
async function purgeExpired() {
  const expired = await prisma.recording.findMany({
    where: { expires_at: { lt: new Date() }, deleted_at: null },
    select: { id: true, storage_path: true },
  })
  for (const rec of expired) {
    await deleteFromDrive(rec.storage_path)                                   // apaga o arquivo
    await prisma.recording.update({ where: { id: rec.id }, data: { deleted_at: new Date() } })
  }
}
```

Soft delete primeiro dá **período de graça** (o titular percebe e contesta antes do hard delete).

**Exclusão vs. pseudoanonimização** (lembrar: pseudo ainda é dado pessoal):

```sql
-- Hard delete: dado some; mas quebra integridade referencial e analytics histórico
DELETE FROM users WHERE id = $1;
-- Pseudoanonimização: mantém a estrutura, apaga o PII (segue sob a LGPD — não é "anônimo")
UPDATE users SET name='Usuário Removido',
  email=CONCAT('deleted_', id, '@removed.local'), phone=NULL, deleted_at=NOW()
WHERE id = $1;
```

Para a AG: pseudoanonimização em tabelas com relações (preserva integridade); hard delete para blobs (gravações, transcrições).

**PII em log — a armadilha silenciosa:**

```ts
console.log(`User ${user.name} (${user.email}) from ${req.ip}`)   // ❌ email de todos no log
logger.info({ event: 'user_login', userId: user.id, ip: req.ip }) // ✅ id, não PII
const masked = email.replace(/(.{2}).+(@.+)/, '$1***$2')          // debug: mascarar
```

**Trade-off de decisões LGPD:**

| Decisão | Vantagem | Custo |
|---|---|---|
| Hard delete | dado realmente some | quebra FK; analytics histórico perde registro |
| Pseudoanonimização | preserva integridade referencial | **continua sendo dado pessoal** (reidentificável por cruzamento) |
| Retenção curta (30d) | menor exposição | usuário perde histórico; suporte mais difícil |
| Logar só user_id | compliant e seguro | correlacionar usuário↔id exige consultar tabela |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. MAPEAR o PII por classe.** `grep` no schema por nome/email/cpf/telefone/nascimento/saúde. Classifique: direto, quase-identificador (cuidado com cruzamento), sensível (art. 11).

**2. AMARRAR cada dado a uma finalidade e base legal.** Se você não sabe *por que* coleta e *sob qual base* (art. 7/11), não devia estar coletando (princípios de finalidade + necessidade, art. 6).

**3. DEFINIR retenção e implementá-la.** `expires_at` + job de purga; registrar o prazo como decisão de negócio ancorada no art. 15-16.

**4. CONSTRUIR o caminho de exclusão (art. 18 VI).** Mapear todas as tabelas com dado do titular, a ordem de deleção respeitando FK, e escolher pseudo (relações) ou hard delete (blobs) por tabela — lembrando que pseudo não sai do escopo da lei.

**5. AUDITAR o acesso a dado sensível (art. 37).** Quem viu o quê fica registrado no audit log (módulo 07), sem PII no próprio log.

**Anti-padrões:**
- **Chamar pseudoanonimização de "anonimização":** o dado segue sob a LGPD. Só irreversível (art. 12) sai do escopo.
- **"É só a data de nascimento":** quase-identificador — combinado com CEP + sexo reidentifica ~87% (Sweeney). Minimize.
- **PII em log/analytics/LLM externo:** o log tem acesso mais amplo que o dado original. Logar id; antes de mandar transcrição a LLM, verificar DPA e anonimizar nome próprio.
- **Base legal genérica para dado sensível:** legítimo interesse não cobre saúde/NR-1 (art. 11). Exige base específica.

---

## Passo-a-passo aplicado (faça agora, ~30min)

```bash
cd ~/projetos/PULSAR-RH
# 1. Onde o PII vive (inclui quase-identificadores)
grep -rn "email\|name\|phone\|cpf\|rg\|nascimento\|cep\|saúde\|health" prisma/schema.prisma
# 2. Existe job de limpeza / retenção?
grep -rn "expires_at\|delete\|purge\|cleanup\|retention" apps/api/src/ --include="*.ts"
# 3. PII vaza para log?
grep -rn "console\.log\|logger\." apps/api/src/ --include="*.ts" | grep -i "email\|name\|user\."
# 4. Mapear caminho de exclusão: quais tabelas têm dado do titular? qual a ordem (FK)?
```

```markdown
## DECISIONS.md — 2026-06-XX — [lgpd] mapeamento exclusão PULSAR-RH
**Titulares:** colaboradores de empresas clientes
**Tabelas com PII:** users (nome, email — direto); [quase-identificadores após grep]
**Dado sensível (art. 11):** [tabelas com NR-1 / saúde — base legal específica exigida]
**Retenção:** [enquanto contrato ativo + X meses] — decisão de negócio (art. 15-16)
**Caminho de exclusão (art. 18 VI):**
1. Receber pedido via [canal] → 2. verificar identidade do titular
3. pseudoanonimizar (name='Removido', email='deleted_<id>@removed.local') — segue sob a lei
4. hard delete de arquivos associados → 5. registrar no audit log (sem PII) → 6. confirmar por escrito
**Lacunas:** canal formal de exclusão? backups com PII? DPA com Gemini/Claude?
```

## Por que cai em entrevista

Empresa B2B com dado de RH, saúde ou financeiro pergunta LGPD **obrigatoriamente**. A pergunta é prática: "me descreve como você implementaria o caminho de exclusão num sistema de RH", "o que muda no design quando o dado é sensível".

> **P:** "Como você implementaria o direito ao esquecimento num sistema de RH?"
>
> **R (30s):**
> "Primeiro mapear todas as tabelas que têm dado pessoal do titular. Para dados de usuário em tabelas com relações, prefiro pseudoanonimização — substituo nome e email por valores genéricos, preservo a integridade referencial e o histórico de uso fica intacto sem identificar ninguém. Para arquivos como transcrições e gravações, exclusão hard mesmo. O caminho fica documentado: recebi pedido, verifiquei identidade, anonimizei, deletei arquivos, registrei no audit log o evento (sem PII) e confirmei para o titular. O audit log é imutável, então o registro da exclusão fica — mas sem dado pessoal."

> **P:** "O que é dado de categoria especial na LGPD e como isso afeta o design de um sistema?"
>
> **R (30s):**
> "São dados que exigem proteção reforçada: saúde, origem racial, religião, opinião política, dados biométricos. No PULSAR-RH temos indicadores NR-1 de risco psicossocial — isso é dado de saúde ocupacional, categoria especial. O impacto no design: precisamos de base legal explícita para processar (não basta interesse legítimo genérico), controle de acesso mais granular (nem todo funcionário da empresa cliente pode ver), retenção mais curta e auditoria de quem acessou o quê."

> **P:** "Qual a diferença entre anonimização e pseudoanonimização — e por que isso importa juridicamente?"
>
> **R (30s):**
> "Anonimização, no art. 12 da LGPD, é irreversível: o dado não é mais associável a ninguém, e por isso sai do escopo da lei. Pseudoanonimização só troca o identificador por um pseudônimo — mas o dado continua reidentificável, por quem tem a chave ou por cruzamento com outra base. A Latanya Sweeney provou isso: CEP mais data de nascimento mais sexo identificam uniquamente 87% das pessoas. Então dado pseudoanonimizado ainda é dado pessoal e continua sob a LGPD e o GDPR. Importa porque muita gente 'anonimiza' trocando o nome por um id e acha que está fora da lei — não está. No design, eu uso pseudo pra preservar integridade referencial, mas trato a tabela como se ainda tivesse PII, porque tem."

## Checkpoint

- [ ] Sei os princípios do art. 6 e as bases legais do art. 7/11 (e por que sensível é mais restrito)
- [ ] Explico por que pseudoanonimização continua sob a LGPD, citando o resultado de Sweeney
- [ ] Implemento soft delete com `expires_at` + job de limpeza em Prisma
- [ ] Mapeei o caminho de exclusão (art. 18 VI) do PULSAR-RH, com ordem de FK
- [ ] Sei por que PII em log é armadilha e como mascarar/logar id
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

## Recursos

- Lei nº 13.709/2018 (LGPD) — ler por artigo: art. 5 (definições), art. 6 (princípios), art. 7/11 (bases legais), art. 15-16 (eliminação), art. 18 (direitos do titular), art. 37 (registro)
- Regulamento (UE) 2016/679 (GDPR) — o modelo: art. 5 (princípios), art. 9 (categorias especiais), art. 17 (right to erasure)
- Latanya Sweeney — *k-anonymity: a model for protecting privacy* (2002) e a reidentificação do dataset de Massachusetts: por que quase-identificadores reidentificam ~87% da população
- ANPD (Autoridade Nacional de Proteção de Dados) — guias de conformidade e orientações oficiais
- OWASP *GDPR Cheat Sheet* — mapeamento de obrigações para controles técnicos
- Vazamento de ~223 milhões de CPFs no Brasil (2021) — nas reportagens atribuído à base da Serasa, embora a origem exata tenha permanecido contestada; caso-referência de exposição em massa de PII
- Módulo-irmão `07-auditoria-logs-imutavel` — o registro do art. 37 e da própria exclusão
