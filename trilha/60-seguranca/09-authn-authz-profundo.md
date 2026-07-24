# 09 — Authn/Authz Profundo

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Autenticação (**authn**) responde "quem é você"; autorização (**authz**) responde "o que você pode fazer". São perguntas diferentes, resolvidas por mecanismos diferentes, e confundi-las é a raiz do **A01:2021 — Broken Access Control**, a categoria nº 1 do OWASP Top 10: o app confirma a identidade (authn) e depois **assume** o resto (authz esquecida). Este módulo é a diferença entre "o usuário está logado, então pode" — errado — e "o usuário está logado *e* esta linha é dele" — certo. E o coração dele é um princípio de 1975 que a maioria dos devs aplica sem saber o nome.

---

## § BASE — o fundamento

**O princípio que decide tudo — Saltzer & Schroeder (1975).** Em *The Protection of Information in Computer Systems*, Jerome Saltzer e Michael Schroeder destilaram oito princípios de projeto seguro que continuam sendo o cânone 50 anos depois. Três mandam em authz:

- **Complete mediation (mediação completa):** *todo* acesso a *todo* objeto deve ser verificado. Não basta checar na porta da frente — se existe um caminho lateral (um script, uma query esquecida, o REST direto), ele também tem que passar pela verificação. É exatamente por isso que **RLS no banco vence authz no código**: o código pode esquecer o `WHERE tenant_id = ...`; a política que mora na linha, aplicada pelo Postgres em todo caminho de acesso, é mediação completa por construção.
- **Least privilege (menor privilégio):** cada sujeito recebe o mínimo de poder que a tarefa exige. A chave que aparece no front é sempre a de menor privilégio; a poderosa nunca sai do servidor (módulo 12).
- **Fail-safe defaults (padrão seguro):** a decisão default é **negar**. Você lista o que é permitido, não o que é proibido. RLS ligada sem policy = ninguém lê: fail-closed de fábrica.

Guardar esses três nomes é o que transforma "eu faço RLS" em "eu aplico mediação completa e fail-safe defaults na camada de dados" — a segunda frase é a de quem entende o *porquê*.

**JWT, por dentro — RFC 7519.** Um JSON Web Token é `header.payload.signature`, três blocos separados por ponto, cada um em base64url. O **payload** (§4 da RFC) carrega *claims*; os registrados incluem `iss` (emissor), `sub` (sujeito), `aud` (audiência), `exp` (expiração), `iat` (emitido em), `nbf` (não antes) e `jti` (id único do token). O ponto que derruba júnior: **o payload é base64, não é cifrado** — qualquer um decodifica e lê. Base64 é *encoding*, não *encryption* (módulo 11). Nunca coloque segredo no payload. O que protege o token não é sigilo do conteúdo, é a **assinatura** (§7.2): o emissor assina `header.payload` com uma chave (HS256, simétrica; ou RS256, par assimétrico), e o verificador recomputa a assinatura — se bate, o token não foi forjado nem adulterado. A assinatura dá **integridade e autenticidade**, não confidencialidade.

**As armadilhas de assinatura (RFC + OWASP JWT Cheat Sheet).** Duas quebram implementação real: (a) **`alg: none`** — a RFC permite um token "sem assinatura"; um verificador ingênuo que confia no campo `alg` do próprio token aceita qualquer coisa. (b) **Algorithm confusion RS256→HS256** — o atacante troca o `alg` de RS256 pra HS256 e assina com a chave *pública* (que é pública!) usada como se fosse segredo HMAC. Defesa: fixar o algoritmo esperado no servidor, nunca confiar no `alg` do token.

**O mito do "JWT stateless e revogável".** JWT valida a assinatura sem consultar nada — "stateless". Mas se você consegue revogar um JWT *antes* de ele expirar, existe uma denylist consultada a cada request: isso é **estado**. Você reinventou a sessão com passos extras. As opções honestas são três: (a) access token curto (5–15 min) e aceitar a janela de revogação; (b) denylist (admitir que virou stateful); (c) sessão clássica. Não existe a quarta opção mágica.

**Refresh token rotation — OAuth 2.0 Security BCP (RFC 9700).** O padrão que fecha a conta: access token curto + refresh token de **uso único**. Cada refresh emite um par novo e invalida o anterior; se um refresh já usado reaparece, é sinal de roubo — o servidor revoga a **família inteira** de tokens (*replay/reuse detection*), exatamente como recomenda o Best Current Practice de segurança do OAuth 2.0. Supabase Auth implementa isso; saber explicar o mecanismo vale mais que saber que "o Supabase cuida".

**RBAC vs ABAC.** **RBAC** (Ferraiolo & Kuhn, NIST, 1992): papel → permissões (admin, gestor, vendedor). Simples, auditável, mas *explode em combinações* — "gestor da filial 2 só no horário comercial" vira papel novo. **ABAC** (NIST SP 800-162): política sobre **atributos** (tenant do usuário == tenant do recurso, dono do registro, horário). Expressivo, mais difícil de auditar. Nos apps AG a prática é híbrida: RBAC pro cargo, ABAC pro tenant.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Todo request seguro atravessa três camadas em ordem; cada uma responde uma pergunta e passa pra próxima:

```
  request
    │
    ▼
┌─ AUTHN ─────────────┐   "quem é você?"      → valida credencial/assinatura do token
│  (RFC 7519, sessão) │      falhou → 401 Unauthorized
└─────────┬───────────┘
          ▼
┌─ IDENTIDADE + CLAIMS ───┐  "o que o servidor sabe de você?"
│  sub, role, tenant_id   │  ⚠ tenant/role em app_metadata (só servidor escreve),
│  em app_metadata        │     NUNCA em user_metadata (o usuário edita)
└─────────┬───────────────┘
          ▼
┌─ AUTHZ ─────────────────┐  "você pode ESTE recurso?"  ← complete mediation
│  RBAC (cargo) + RLS/ABAC│      falhou → 403 Forbidden
│  na linha (Postgres)    │      RLS: filtra silenciosamente → 0 linhas, não erro
└─────────────────────────┘
```

Duas decisões estruturam o desenho:

1. **Sessão ou JWT? → pela SLA de revogação.** Precisa cortar acesso *instantâneo* (banir usuário, logout global)? Sessão server-side, revogação = apagar a linha. Tolera janela de 5–15 min? JWT curto + rotation. A pergunta não é "qual é mais moderno", é "quanto tempo posso deixar um token roubado vivo".
2. **RBAC ou ABAC? → pela explosão combinatória.** Enquanto papéis chapados (admin/gestor/vendedor) descrevem o acesso, RBAC basta. No instante em que você começa a criar papéis com "só da filial X", "só no horário Y", "só o dono do registro" — isso é atributo, é ABAC (e no banco AG, é RLS).

---

## § METODOLOGIA — o passo-a-passo replicável

**1. SEPARAR authn de authz explicitamente.** Escreva as duas frases: "autenticado como quem" e "autorizado a quê". Se a segunda estiver vazia, você tem A01 esperando acontecer.

**2. ESCOLHER a estratégia de token pela SLA de revogação** (não pela moda). Documente a janela que você aceita.

**3. EMPURRAR authz pra camada mais baixa possível.** Route guard no front é UX, não segurança (o atacante não usa o seu front). A verificação que vale é a mais próxima do dado — RLS no Postgres é mediação completa; um `if (user.role === 'admin')` no controller é melhor que nada, mas é esquecível.

**4. COLOCAR claim de tenant/role em `app_metadata`.** Só o servidor escreve. `user_metadata` é editável pelo próprio usuário via API — pôr `tenant_id` ali é entregar escalada de privilégio de graça.

**5. TESTAR por refutação.** "Consigo ver meus dados?" confirma a hipótese; "consigo ver os do **outro**?" tenta refutá-la. Segurança se testa pelo caminho do ataque.

**Anti-padrões:**
- **Authz só no front / route guard.** O atacante fala direto com a API. Toda verificação de front tem que ter uma no servidor atrás.
- **`tenant_id` / `role` em `user_metadata`.** Escalada de privilégio auto-servida.
- **Confiar no payload sem verificar assinatura**, ou confiar no campo `alg` do token (`alg:none`, RS256→HS256). Fixe o algoritmo no servidor.
- **Access token longo sem plano de revogação.** Token de 24h roubado = 24h de acesso. Curto + rotation, ou denylist assumida.
- **Testar isolamento só com "não deu erro".** RLS retorna **0 linhas**, não exceção — um teste que só checa ausência de erro passa com a policy errada.

---

## Passo-a-passo aplicado (faça agora, ~25min)

RLS multi-tenant fail-closed no PULSAR-RH, testado pela refutação.

```sql
alter table public.avaliacoes enable row level security;
-- a partir daqui, SEM policy ninguém lê: fail-safe default (Saltzer & Schroeder)

create policy tenant_isolation on public.avaliacoes
  for all using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

```sql
-- Teste como engenheiro: tentar REFUTAR o isolamento, não confirmá-lo.
-- Logado como usuário do tenant A:
select count(*) from avaliacoes;                       -- baseline: minhas linhas
select count(*) from avaliacoes
  where tenant_id = '<uuid-do-tenant-B>';              -- tem que voltar 0 (não erro!)
```

O raciocínio sênior está no segundo SELECT: "consigo ver meus dados?" só confirma; "consigo ver os **do outro**?" refuta. E note o detalhe que engana teste ingênuo: RLS filtra silenciosamente — retorna 0 linhas, não exceção — então checar "não deu erro" passa mesmo com policy errada.

Agora inspecione um JWT de verdade e prove que o payload é legível (por isso não guarda segredo):

```bash
# pegue o access_token do Supabase (localStorage / resposta de login) e decode o payload:
echo "<PAYLOAD_BASE64>" | base64 -d    # verá sub, role, app_metadata, exp — em texto claro
```

## Por que cai em entrevista

"Sessão ou JWT?" é a pergunta-armadilha favorita de entrevista de pleno: ela não tem resposta certa, tem trade-off — e o entrevistador quer ver se você conhece o custo da sua escolha. Quem responde "JWT porque é stateless" sem mencionar o problema da revogação falha; quem explica refresh rotation e RLS mostra que já operou auth de verdade.

> **P:** "Sessão ou JWT? Qual você usaria e por quê?"
>
> **R (30s):** "Depende do requisito de revogação. JWT valida sem tocar no banco, mas revogar antes de expirar exige denylist — que é estado, então o 'stateless' morre. Meu padrão: access token de 15 minutos com refresh token rotation e detecção de reuso — é o que o Supabase Auth faz nos meus projetos. E autorização eu não deixo só no código: no PULSAR-RH o isolamento multi-tenant é RLS no Postgres, com o tenant em app_metadata, que o usuário não consegue editar. Assim mesmo um bug no app não vaza dado entre clientes."

> **P (nova):** "O que tem dentro de um JWT e o que impede alguém de forjar um?"
>
> **R (30s):** "Três blocos base64: header, payload e assinatura. O payload são os claims — sub, exp, role, tenant — e é o pulo do gato: base64 é encoding, não criptografia, então qualquer um lê o payload. Por isso nunca coloco segredo lá. O que impede forjar é a assinatura: o servidor assina header+payload com uma chave, e na entrada recomputa e compara — bateu, não foi adulterado; é integridade e autenticidade, não sigilo. As duas armadilhas reais são o `alg: none`, um token sem assinatura que um verificador ingênuo aceita, e a confusão RS256 pra HS256, onde o atacante assina com a chave pública tratada como segredo HMAC. Defesa nos dois casos é a mesma: o servidor fixa o algoritmo esperado e nunca confia no campo `alg` que veio no token."

## Checkpoint

- [ ] Explico authn vs authz e por que confundi-las é a raiz do A01
- [ ] Nomeio complete mediation, least privilege e fail-safe defaults (Saltzer & Schroeder) e ligo cada um a RLS
- [ ] Sei a estrutura header.payload.signature e por que o payload não guarda segredo
- [ ] Explico em 1 minuto por que "JWT stateless revogável" é contradição, e as 3 opções honestas
- [ ] Desenho o fluxo de refresh token rotation com detecção de reuso
- [ ] Escrevi uma policy RLS com claim de `app_metadata` e testei o isolamento por refutação (ler o tenant errado → 0 linhas)

## Recursos

- **RFC 7519 — JSON Web Token**: estrutura, claims registrados (§4), assinatura (§7.2) — fonte primária da §BASE do JWT
- **Saltzer & Schroeder (1975) — *The Protection of Information in Computer Systems***: os 8 princípios; complete mediation, least privilege, fail-safe defaults
- **OAuth 2.0 Security Best Current Practice (RFC 9700)**: refresh token rotation e detecção de reuso
- **NIST — RBAC** (Ferraiolo & Kuhn, 1992) e **NIST SP 800-162 — ABAC**: os dois modelos de autorização
- **OWASP — JWT Cheat Sheet** e **Session Management Cheat Sheet**: `alg:none`, algorithm confusion, boas práticas de sessão
- **OWASP Top 10 — A01:2021 Broken Access Control**; **Supabase — Row Level Security**
