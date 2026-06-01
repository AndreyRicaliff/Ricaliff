# 06 — LGPD na Prática

## O que é

**LGPD (Lei Geral de Proteção de Dados)** é a lei brasileira de privacidade, em vigor desde setembro de 2020. Se sua aplicação processa dados de pessoas físicas que estejam no Brasil — independente de onde o servidor está — ela se aplica. Modelo da lei: GDPR europeu adaptado.

Para a AG isso não é opcional: PULSAR-RH processa dados de RH de colaboradores de empresas clientes. Meet Hub grava e transcreve reuniões com nomes e vozes reais. Qualquer entrevista em empresa que tem produto B2B vai perguntar sobre isso.

---

### Os 10 princípios (os 4 mais importantes para devs)

| Princípio | O que significa na prática |
|---|---|
| **Finalidade** | Coletar dado só para o propósito declarado. Se você coleta email para enviar relatório, não pode usar para marketing sem consentimento novo. |
| **Minimização (Adequação + Necessidade)** | Coletar só o que é necessário para a finalidade. Se você não precisa da data de nascimento completa, não coleta. |
| **Retenção limitada** | Dados não devem ser guardados além do necessário. A AG definiu 180 dias para transcrições. Depois: deletar ou anonimizar. |
| **Direito do titular** | A pessoa pode pedir acesso, correção e exclusão dos próprios dados. Sua aplicação precisa ter caminho técnico para isso. |

---

### PII — O que é dado pessoal

**PII (Personally Identifiable Information)** para fins de LGPD:

```
Identificação direta:
- Nome completo, CPF, RG, CNH, passaporte
- Email, número de telefone
- Endereço físico completo
- Data de nascimento + nome + local já são suficientes para identificação

Identificação indireta (quando combinado com outros dados):
- IP address
- ID de dispositivo
- Localização GPS
- Cookie de sessão com ID de usuário

Dados sensíveis (categoria especial — proteção reforçada):
- Origem racial ou étnica
- Convicção religiosa
- Opinião política
- Saúde ou vida sexual
- Dados genéticos ou biométricos
- Filiação sindical
```

**Atenção AG:** transcrições de reuniões do Meet Hub contêm PII (nome das pessoas falando, temas sensíveis de negócio). Dados de colaboradores do PULSAR-RH podem conter dados de saúde (afastamentos, NR-1 riscos psicossociais) — categoria especial.

---

### Retenção de dados — a regra dos 180 dias

A AG definiu 180 dias de retenção para transcrições e gravações de reuniões. Isso não é arbitrário — é o período mínimo necessário para utilidade do dado (revisitar reunião, buscar informação) versus exposição continuada do PII.

**Implementação técnica de retenção:**

```ts
// Soft delete com data de expiração (abordagem recomendada):
// Coluna expires_at permite limpeza automática sem UPDATE complexo

// Schema Prisma:
model Recording {
  id         String    @id @default(cuid())
  created_at DateTime  @default(now())
  expires_at DateTime  // calculado no insert: now() + 180d
  deleted_at DateTime? // null = ativo; date = marcado para exclusão
  // ... demais campos
}

// Insert com expiração:
await prisma.recording.create({
  data: {
    // ...
    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  }
})

// Job diário de limpeza:
async function purgeExpiredRecordings() {
  const expired = await prisma.recording.findMany({
    where: {
      expires_at: { lt: new Date() },
      deleted_at: null,
    },
    select: { id: true, storage_path: true }
  })

  for (const rec of expired) {
    await deleteFromDrive(rec.storage_path) // apagar arquivo do storage
    await prisma.recording.update({
      where: { id: rec.id },
      data: { deleted_at: new Date() }
    })
  }
}
```

**Por que soft delete primeiro:** permite período de graça para titular perceber e contestar antes do dado sumir permanentemente. Hard delete (DELETE) pode vir depois de outro período.

---

### Direito ao esquecimento — caminho técnico

"Direito ao esquecimento" = titular pede exclusão de todos os dados pessoais que a aplicação tem sobre ele.

**O que precisa ser deletado ou anonimizado:**

```
1. Conta do usuário (users table)
2. Conteúdo associado (recordings, transcriptions, comments)
3. Logs de acesso que contenham o user_id ou nome
4. Dados em sistemas de backup (mais complexo — política de backup)
5. Cache (Redis, CDN) — TTL ou invalidação manual
6. Search index (se tiver Elasticsearch ou similar)
7. Dados em serviços de terceiros (se tiver enviado para analytics, LLM externo)
```

**Pseudoanonimização vs Exclusão:**

```sql
-- Opção 1: Exclusão hard (limpa tudo)
DELETE FROM users WHERE id = $1;
-- Problema: logs históricos ficam com dados orfãos; analytics histórico quebra

-- Opção 2: Pseudoanonimização (manter estrutura, apagar PII)
UPDATE users SET
  name = 'Usuário Removido',
  email = CONCAT('deleted_', id, '@removed.local'),
  phone = NULL,
  avatar_url = NULL,
  deleted_at = NOW()
WHERE id = $1;
-- Mantém histórico de atividade sem identificar o titular
-- Analytics de uso (sem PII) continua funcionando
```

Qual usar: depende da finalidade dos dados históricos. Para a AG, pseudoanonimização é preferível em tabelas com relações (preserva integridade referencial), exclusão hard para blobs de arquivo (gravações, transcrições).

---

### PII em logs — a armadilha silenciosa

```ts
// NUNCA logar PII:
console.log(`User ${user.name} (${user.email}) logged in from ${req.ip}`)
// Se alguém tiver acesso aos logs, tem acesso ao email de todos os usuários

// CORRETO — logar ID, não PII:
logger.info({ event: 'user_login', userId: user.id, ip: req.ip })

// Para debugging temporário de produção, mascarar:
const masked = email.replace(/(.{2}).+(@.+)/, '$1***$2')
logger.debug({ event: 'auth_check', email: masked })
```

Para a AG especificamente: transcrições do Meet Hub passam pela API do Gemini para transcrição. Verificar se o conteúdo está protegido por NDA antes. Se sim, anonimizar nomes próprios antes de enviar para LLM externo.

---

### Casos AG específicos

**PULSAR-RH:**
- Dados: nome, cargo, avaliações de desempenho, indicadores NR-1 (psicossociais) de colaboradores de empresas clientes
- Categoria NR-1: dado de saúde — categoria especial, proteção reforçada
- Obrigação: base legal explícita (contrato com empresa cliente = legítimo interesse ou consentimento)
- Retenção: enquanto durar o contrato + [definir período após término]
- Exclusão: quando empresa cliente encerrar contrato, deletar ou pseudoanonimizar dados dos colaboradores

**Meet Hub:**
- Dados: gravações e transcrições de reuniões com nome e voz de participantes
- Retenção: 180 dias (já definido)
- Exclusão: a pedido do titular (colaborador que participou de reunião) ou após 180 dias
- Atenção: participante que não é usuário do sistema (convidado externo) também tem direito ao esquecimento

**Café com AG:**
- `cag_log` é imutável por design — mas se contém PII, há conflito com direito ao esquecimento
- Solução: log deve conter user_id (não nome, não email). Se alguém pedir exclusão, anonimizar no log

---

## Por que cai em entrevista

Empresas B2B com dado de RH, saúde ou financeiro perguntam LGPD obrigatoriamente. A pergunta não é teórica — é "me descreve como você implementaria o caminho de exclusão de dados num sistema de RH".

---

## Trade-offs

| Decisão | Vantagem | Custo |
|---|---|---|
| Hard delete | Dado realmente some | Integridade referencial quebra; analytics histórico perde registros |
| Pseudoanonimização | Mantém integridade referencial | Dado "pessoal" continua existindo (possível re-identificação com outros dados) |
| Retenção curta (30d) | Menor exposição | Usuário perde histórico mais cedo; suporte mais difícil |
| Retenção longa (365d) | Mais utilidade para o usuário | Mais PII em risco por mais tempo; custo de storage |
| Logar só user_id | LGPD compliant, bom para segurança | Debugging mais difícil — correlacionar usuário ↔ id exige tabela |

---

## Exercício aplicado (projeto AG real)

```bash
# 1. Mapear onde PII do PULSAR-RH está armazenada
cd ~/projetos/PULSAR-RH
grep -rn "email\|name\|phone\|cpf\|rg\|nascimento\|saúde\|health" \
  prisma/schema.prisma

# 2. Verificar se há job de limpeza automática
grep -rn "expires_at\|delete\|purge\|cleanup\|retention" \
  apps/api/src/ --include="*.ts"

# 3. Verificar se PII está em logs
grep -rn "console\.log\|logger\." apps/api/src/ --include="*.ts" | \
  grep -i "email\|name\|user\."

# 4. Mapear o caminho técnico de exclusão:
#    a) Quais tabelas têm dados do titular?
#    b) Qual a sequência de deleção respeitando foreign keys?
#    c) Existe endpoint ou script de exclusão?
```

```markdown
## DECISIONS.md — 2026-06-XX — [lgpd] mapeamento exclusão PULSAR-RH

**Titulares dos dados:** colaboradores de empresas clientes

**Tabelas com PII:**
- users: nome, email (diretamente identificável)
- [listar outras tabelas com PII após grep]

**Dados de categoria especial:**
- [tabelas com dados NR-1 / saúde — proteção reforçada]

**Retenção definida:** [enquanto contrato ativo + X meses após encerramento]

**Caminho de exclusão a pedido:**
1. Receber pedido via [canal definido — email? formulário?]
2. Verificar identidade do titular (não apagar dados de outra pessoa)
3. Pseudoanonimizar: name='Removido', email='deleted_<id>@removed.local'
4. Deletar arquivos associados (se houver)
5. Registrar a exclusão no audit log (sem PII — só user_id + timestamp + "data_removed")
6. Confirmar para o titular por escrito

**Lacunas identificadas:**
- Existe canal formal de pedido de exclusão? [sim/não]
- Backups incluem PII? Se sim, política de backup precisa ser atualizada
- Dados enviados para Gemini/Claude API: verificar contrato de DPA

**Prazo para implementar caminho técnico:** [data]
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você implementaria o direito ao esquecimento num sistema de RH?"
>
> **R (30s):**
> "Primeiro mapear todas as tabelas que têm dado pessoal do titular. Para dados de usuário em tabelas com relações, prefiro pseudoanonimização — substituo nome e email por valores genéricos, preservo a integridade referencial e o histórico de uso fica intacto sem identificar ninguém. Para arquivos como transcrições e gravações, exclusão hard mesmo. O caminho fica documentado: recebi pedido, verifiquei identidade, anonimizei, deletei arquivos, registrei no audit log o evento (sem PII) e confirmei para o titular. O audit log é imutável, então o registro da exclusão fica — mas sem dado pessoal."

> **P:** "O que é dado de categoria especial na LGPD e como isso afeta o design de um sistema?"
>
> **R (30s):**
> "São dados que exigem proteção reforçada: saúde, origem racial, religião, opinião política, dados biométricos. No PULSAR-RH temos indicadores NR-1 de risco psicossocial — isso é dado de saúde ocupacional, categoria especial. O impacto no design: precisamos de base legal explícita para processar (não basta interesse legítimo genérico), controle de acesso mais granular (nem todo funcionário da empresa cliente pode ver), retenção mais curta e auditoria de quem acessou o quê."

---

## Checkpoint

- [ ] Sei os 4 princípios mais importantes da LGPD para devs sem consultar
- [ ] Consigo implementar soft delete com `expires_at` e job de limpeza em Prisma
- [ ] Documentei o caminho de exclusão LGPD do PULSAR-RH
- [ ] Sei a diferença entre exclusão hard e pseudoanonimização e quando usar cada uma
- [ ] Recitei a resposta de entrevista em voz alta em menos de 30 segundos

---

## Recursos

- [Lei 13.709/2018 — LGPD (texto completo)](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [ANPD — Autoridade Nacional de Proteção de Dados](https://www.gov.br/anpd/) — publicações e guias de conformidade
- [OWASP GDPR Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GDPR_Cheat_Sheet.html) — GDPR é o modelo do LGPD; aplicável
- Caso referência: vazamento Serasa/SPC 2021 — 223 milhões de CPFs expostos (Brasil)
