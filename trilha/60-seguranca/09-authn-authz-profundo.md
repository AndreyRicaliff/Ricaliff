# 09 — Authn/Authz Profundo

## O que é

Autenticação (authn) responde "quem é você"; autorização (authz) responde "o que você pode fazer". Misturar os dois é a raiz do A01 (Broken Access Control) — o app confirma a identidade e depois assume o resto.

**Sessão vs JWT.** Sessão clássica: cookie com id opaco, estado no servidor (Postgres/Redis). Revogar = apagar a linha; o custo é uma consulta por request. JWT: token assinado com claims; o servidor valida a assinatura sem consultar nada — "stateless". **O mito que derruba candidato: "JWT stateless e revogável".** Se você consegue revogar um JWT antes de ele expirar, existe uma denylist consultada a cada request — ou seja, estado. Você reinventou a sessão com passos extras. As opções honestas são três: (a) access token curto (5–15 min) e aceitar a janela de revogação; (b) denylist (admitir que virou stateful); (c) sessão clássica. Não existe a quarta opção mágica.

**Refresh token rotation.** O padrão que fecha a conta: access token curto + refresh token de **uso único**. Cada refresh emite um par novo e invalida o anterior; se um refresh já usado reaparece, é sinal de roubo — o servidor revoga a **família inteira** de tokens (replay detection). Supabase Auth implementa exatamente isso; saber explicar o mecanismo vale mais que saber que "o Supabase cuida".

**RBAC vs ABAC.** RBAC: papel → permissões (admin, gestor, vendedor). Simples, auditável, mas explode em combinações ("gestor da filial 2 só no horário comercial" vira papel novo). ABAC: política sobre **atributos** (tenant do usuário == tenant do recurso, dono do registro, horário). Expressivo, mais difícil de auditar. Nos apps AG a prática é híbrida: RBAC pro cargo, ABAC pro tenant.

**RLS como authz declarativa.** A política mora na linha e o Postgres a aplica em TODO caminho de acesso — REST, client SDK, query esquecida num script. O código não tem como "esquecer o WHERE". É authz que sobrevive ao bug do desenvolvedor.

**Multi-tenant sem vazar.** O claim de tenant vai em `app_metadata` (só o servidor escreve). NUNCA em `user_metadata`: o próprio usuário edita esse campo via API — colocar `tenant_id` ali é entregar escalada de privilégio de graça.

### Passo a passo: RLS multi-tenant fail-closed (padrão PULSAR-RH)

```sql
alter table public.avaliacoes enable row level security;
-- a partir daqui, SEM policy ninguém lê: fail-closed por padrão

create policy tenant_isolation on public.avaliacoes
  for all using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

```sql
-- Teste como engenheiro: tentar REFUTAR o isolamento, não confirmá-lo.
-- Logado como usuário do tenant A:
select count(*) from avaliacoes;                             -- baseline: minhas linhas
select count(*) from avaliacoes
  where tenant_id = '<uuid-do-tenant-B>';                    -- tem que voltar 0 (não erro!)
```

O raciocínio sênior está no segundo SELECT: "consigo ver meus dados?" só confirma a hipótese; "consigo ver os dados **do outro**?" tenta refutá-la. Segurança se testa pelo caminho do ataque. E note o detalhe: RLS filtra silenciosamente — retorna 0 linhas, não erro — então um teste que só checa "não deu exceção" passa mesmo com a policy errada.

### Trade-offs

| Escolha | Ganha | Paga |
|---|---|---|
| Sessão server-side | Revogação instantânea | Consulta por request; estado pra escalar |
| JWT curto + refresh rotation | Valida sem I/O; revogação em ≤15 min | Complexidade do fluxo de refresh |
| RLS no banco | Authz que o código não consegue esquecer | Policy errada é invisível (0 linhas ≠ erro); debugging mais duro |

## Por que cai em entrevista

"Sessão ou JWT?" é a pergunta-armadilha favorita de entrevista de pleno: ela não tem resposta certa, tem trade-off — e o entrevistador quer ver se você conhece o custo da sua escolha. Quem responde "JWT porque é stateless" sem mencionar o problema da revogação falha; quem explica refresh rotation e RLS mostra que já operou auth de verdade.

> **P:** "Sessão ou JWT? Qual você usaria e por quê?"
>
> **R (30s):** "Depende do requisito de revogação. JWT valida sem tocar no banco, mas revogar antes de expirar exige denylist — que é estado, então o 'stateless' morre. Meu padrão: access token de 15 minutos com refresh token rotation e detecção de reuso — é o que o Supabase Auth faz nos meus projetos. E autorização eu não deixo só no código: no PULSAR-RH o isolamento multi-tenant é RLS no Postgres, com o tenant em app_metadata, que o usuário não consegue editar. Assim mesmo um bug no app não vaza dado entre clientes."

## Checkpoint

- [ ] Explico em 1 minuto por que "JWT stateless revogável" é contradição
- [ ] Desenho o fluxo de refresh token rotation incluindo a detecção de reuso
- [ ] Sei dizer quando RBAC basta e quando preciso de ABAC, com exemplo
- [ ] Escrevi uma policy RLS com claim de `app_metadata` e sei por que não usar `user_metadata`
- [ ] Testei o isolamento tentando LER o tenant errado (refutação, não confirmação)

## Recursos

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RFC 7519 — JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519)
- Auth0 docs — "Refresh Token Rotation" (explica a detecção de reuso por família)
