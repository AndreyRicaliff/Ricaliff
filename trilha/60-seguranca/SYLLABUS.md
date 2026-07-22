# Syllabus — Segurança

> **Disciplina:** OWASP Top 10 aplicado ao código que você já escreve — nomear o risco, provar o fix.
> **Carga horária alvo: 50h** — aulas 3.5h · bibliografia 20h · labs 16.5h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar as categorias do OWASP Top 10 e apontar, num app real, onde cada uma se materializa ou já foi corrigida.
2. Prevenir XSS, SQLi e CSRF pelo mecanismo certo (encoded output + CSP, prepared statements, SameSite + token) — não por "validar input".
3. Desenhar autorização fail-closed (RLS default-deny) e gerir secrets/criptografia/senhas com padrão consagrado.
4. Fazer threat modeling (STRIDE), auditar dependências e cadeia de suprimentos, e conduzir resposta a incidente com log imutável.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 owasp-top-10-resumo | OWASP Top 10 (2021) — as dez categorias, lista e descrição oficiais | 1h |
| 02 xss-stored-reflected-dom | OWASP "Cross Site Scripting Prevention Cheat Sheet" + "DOM based XSS Prevention Cheat Sheet"; PortSwigger Web Security Academy — trilha "Cross-site scripting" (gratuita) | 2h |
| 03 sql-injection-prepared-statements | OWASP "SQL Injection Prevention Cheat Sheet" + "Query Parameterization Cheat Sheet"; PortSwigger — trilha "SQL injection" | 2h |
| 04 csrf-e-samesite-cookies | OWASP "Cross-Site Request Forgery Prevention Cheat Sheet"; MDN — "SameSite cookies"; PortSwigger — trilha "CSRF" | 1.5h |
| 05 secrets-management-env-rotacao | OWASP "Secrets Management Cheat Sheet"; 12factor.net — "Config" (config no ambiente, nunca no repo) | 1h |
| 06 lgpd-na-pratica | Lei nº 13.709/2018 (LGPD) — texto oficial, arts. 6, 7, 9, 18 e 46; OWASP "User Privacy Protection Cheat Sheet" | 1.5h |
| 07 auditoria-logs-imutavel | OWASP "Logging Cheat Sheet"; OWASP Top 10 — A09:2021 "Security Logging and Monitoring Failures" | 1h |
| 08 dependency-vulnerabilities | OWASP Top 10 — A06:2021 "Vulnerable and Outdated Components"; OWASP "Vulnerable Dependency Management Cheat Sheet"; npm docs — "`npm audit`" | 1.5h |
| 09 authn-authz-profundo | OWASP "Authentication Cheat Sheet" + "Authorization Cheat Sheet"; PortSwigger — trilhas "Authentication" e "Access control"; Supabase docs — "Row Level Security" | 2h |
| 10 threat-modeling | OWASP "Threat Modeling Cheat Sheet"; Adam Shostack — *Threat Modeling: Designing for Security* (framework STRIDE, caps. introdutórios) | 1.5h |
| 11 criptografia-aplicada | OWASP "Cryptographic Storage Cheat Sheet" + "Password Storage Cheat Sheet" (bcrypt/argon2, salt) + "Transport Layer Protection Cheat Sheet" | 2h |
| 12 hardening | OWASP "HTTP Security Response Headers Cheat Sheet"; MDN — "Content Security Policy (CSP)"; OWASP Top 10 — A05:2021 "Security Misconfiguration" | 1.5h |
| 13 supply-chain | OWASP Top 10 — A08:2021 "Software and Data Integrity Failures"; SLSA framework (slsa.dev) — níveis; OWASP "CI/CD Security Cheat Sheet" | 1h |
| 14 incident-response | NIST SP 800-61r2 — "Computer Security Incident Handling Guide" (ciclo prepare/detect/contain/eradicate/recover); OWASP "Incident Response" (guia) | 1.5h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) num app AG. Os commits reais de correção de XSS e log imutável do Café com AG são caso de estudo pronto. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `xss-playground` (5h):** página deliberadamente vulnerável e a versão corrigida lado a lado (XSS stored, reflected e DOM), mais uma CSP que bloqueia o payload.
*Pronto quando:* cada tipo de XSS dispara na versão vulnerável e falha na corrigida, o relatório de CSP mostra o bloqueio, e há um write-up nomeando o fix de cada caso (encoded output, sink seguro, CSP).

**Lab 2 — `sqli-lab` (5h):** uma query vulnerável (concatenação de string) sobre SQLite que vaza linhas, e a versão com prepared statement.
*Pronto quando:* o payload de injeção (`' OR 1=1 --` e um UNION) extrai dados na versão vulnerável, a versão parametrizada não retorna nada indevido, e a suíte prova os dois comportamentos.

**Lab 3 — `rls-fail-closed` (6.5h):** tabela em Postgres/Supabase com RLS default-deny; provar que um usuário sem a role recebe zero linhas e um usuário permitido vê só as suas.
*Pronto quando:* SELECT com anon/role errada retorna 0 linhas (teste afirma), a role correta vê apenas as próprias linhas, e uma policy é quebrada de propósito para exibir o fail-open (`USING(true)`) e então refechada.

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **LiveOverflow** | "web hacking", "xss explained", "how sql injection works" | módulos 02, 03 — o ataque por dentro |
| **IppSec** | "hackthebox web", "sql injection walkthrough", "access control" | módulos 02, 03, 09 — exploração guiada |
| **John Hammond** | "malware analysis", "incident response", "dependency confusion" | módulos 08, 13, 14 |
| **NetworkChuck** | "how hashing works", "password security", "https tls" | módulos 05, 11 |
| **Curso em Vídeo / Gustavo Guanabara** *(PT-BR)* | "segurança da informação", "criptografia" | módulos 01, 11 — fundamentos em português |

Ordem sugerida: entenda o ataque primeiro (LiveOverflow/IppSec) pra depois a cheat sheet do OWASP fazer sentido; fundamentos em PT-BR (Guanabara) pra assentar o vocabulário. Vídeo nunca substitui o lab — reproduza o exploit no seu playground.

## Critério de formatura

- [ ] 14/14 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos apps AG)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — as cheat sheets do OWASP e as trilhas da PortSwigger têm nome estável, a URL muda.*
