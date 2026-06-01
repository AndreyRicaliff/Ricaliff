# 60 — Segurança

## Foco
OWASP Top 10 aplicado ao código que o Ricalfiff já escreve, não em abstrato. XSS, SQLi e secrets mal gerenciados já apareceram nos projetos AG — essa trilha nomeia o que já foi corrigido, fecha o que ainda tem risco e adiciona LGPD como camada obrigatória pra qualquer produto que toca dado de pessoa física. Domínio onde o portfólio AG já é forte: commits reais de correção de XSS e logs imutáveis no Café com AG são casos de estudo prontos.

## Por que cai em entrevista
- "Você pode me explicar o que é XSS e como prevenir?" — querem encoded output e CSP, não só "validar input"
- "Como você protegeria uma query contra SQL injection?" — prepared statement / ORM parameterizado
- "Como você gerenciaria secrets num projeto real?" — .env + rotação + nunca no repositório
- "O que é LGPD e como isso afeta o design de uma feature?"
- "Como você garantiria que logs de auditoria não possam ser adulterados?"

## Pré-requisitos
- `30-banco/05-rls`: RLS é mecanismo de segurança — antes de `60` entender `30`
- `50-backend/08-validation-zod`: validação de input é a primeira linha de defesa
- `00-fundamentos`: HTTP, cookies, headers — sem isso CSRF não faz sentido

## Módulos planejados

| # | Módulo | Foco | Projeto AG conectado | Prioridade |
|---|---|---|---|---|
| 01 | `01-owasp-top-10-resumo.md` | Os 10 itens com exemplo real, nível de risco, mitigação padrão | PULSAR-RH | 🔴 |
| 02 | `02-xss-stored-reflected-dom.md` | Três tipos de XSS, onde o PULSAR-RH tinha o bug, output encoding, CSP header | PULSAR-RH | 🔴 |
| 03 | `03-sql-injection-prepared-statements.md` | Ataque clássico, por que ORM protege, quando ORM falha (raw queries) | CLIENTE OFICINA | 🔴 |
| 04 | `04-csrf-e-samesite-cookies.md` | Attack flow, SameSite=Strict, token anti-CSRF, quando cada proteção basta | PULSAR-RH | 🔴 |
| 05 | `05-secrets-management-env-rotacao.md` | .env nunca no git, SERVICE_ROLE_KEY rotação, vault básico, auditoria de quem tem acesso | CLIENTE OFICINA | 🔴 |
| 06 | `06-lgpd-na-pratica.md` | Finalidade, minimização, retenção, exclusão a pedido, consentimento em produto real | PULSAR-RH | 🔴 |
| 07 | `07-auditoria-logs-imutavel.md` | Log de auditoria com INSERT-only (sem UPDATE/DELETE), quem viu o quê e quando | Café com AG | 🟡 |
| 08 | `08-dependency-vulnerabilities.md` | npm audit, Dependabot, quando atualizar imediatamente vs planejar | AG Hub | 🟡 |

## Como aprender essa trilha
- `01` primeiro — mapa do território antes de mergulhar em cada item
- `02` e `04` têm commits reais no PULSAR-RH — estudar com o diff aberto
- `05` é o mais urgente para ops: SERVICE_ROLE_KEY no OFICINA nunca foi rotacionado — estudar e executar junto
- `06` é obrigatório para qualquer entrevista em empresa que tem produto B2B com dados de RH
- Sinal de fixação: consegue fazer code review de um PR e apontar vulnerabilidade OWASP pelo nome

## Conexão com decisões reais
- **PULSAR-RH XSS corrigido (2026-05):** o bug estava em URL params sendo inseridos no DOM sem encode — é o caso de estudo de `02` com commit real, data e impacto descrito; nenhum candidato concorrente tem isso
- **CLIENTE OFICINA SERVICE_ROLE_KEY:** chave com privilégio máximo usada em processo Windows — `05` ensina a nomear o risco e planejar a rotação
- **Café com AG cag_log imutável:** tabela de log com trigger que bloqueia UPDATE/DELETE é `07` implementado em produção — pergunta "como você garantiria integridade de log?" tem resposta com código
