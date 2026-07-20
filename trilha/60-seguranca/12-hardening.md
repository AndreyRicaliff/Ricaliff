# 12 — Hardening

## O que é

Hardening é **reduzir a superfície de ataque** de um sistema já funcional: fechar portas que não precisam estar abertas, apertar permissões pro mínimo, ligar as defesas que vêm desligadas por padrão. É a resposta direta ao A05 (Security Misconfiguration, do módulo 01) — a categoria de vulnerabilidade que existe não porque alguém escreveu código ruim, mas porque ninguém mudou o default. O default é escolhido pra "funcionar fácil", não pra "ser seguro"; hardening é a passada que troca conveniência por segurança onde importa.

Quatro frentes que cobrem a maior parte do ganho:

**1. Security headers.** Cabeçalhos HTTP que instruem o browser a se defender:
- **CSP (Content-Security-Policy)** — a defesa mais forte contra XSS (módulo 02): declara de onde script/estilo/imagem podem vir; um `<script>` injetado de origem não-listada simplesmente não executa. É trabalhoso de calibrar, mas é o que transforma XSS de "executa" em "bloqueado".
- **HSTS (Strict-Transport-Security)** — força HTTPS mesmo se o usuário digitar `http://`, fechando a janela de downgrade.
- **X-Frame-Options / frame-ancestors** — impede seu site de ser embutido em iframe de terceiro (defesa contra clickjacking).

**2. Rate limiting.** Todo endpoint que custa (login, envio de e-mail, criação de recurso, chamada cara) precisa de limite por origem. Sem rate limit, o login vira alvo de força bruta (A07) e qualquer endpoint vira vetor de DoS (o D do STRIDE, módulo 10). O ag-converge renomeou rotas administrativas pra não-óbvias *e* limitou — defesa em profundidade.

**3. Menor privilégio.** Cada credencial recebe o mínimo que precisa, nunca mais. O erro clássico e recorrente nos apps AG: usar `SERVICE_ROLE_KEY` (que bypassa RLS, acesso total) onde o `ANON_KEY` (limitado por RLS) bastava. A service key no lugar errado é uma chave-mestra num cadeado que devia ser específico — se vaza, vaza tudo. A regra: a chave que aparece no front é sempre a de menor privilégio; a poderosa nunca sai do servidor.

**4. Secrets em produção.** Segredo é variável de ambiente com **escopo** (só o serviço que precisa enxerga), **rotação** (troca periódica e revogação imediata no vazamento) e **nunca no código** (A02/A05). O incidente real que a AG viveu — `SERVICE_ROLE_KEY` hardcoded num script de setup — é o anti-padrão: chave versionada é chave vazada no dia em que o repo fica público. A ordem no vazamento é sempre *revogar antes de investigar* (módulo 14).

### Passo-a-passo: headers numa app AG

```json
// vercel.json / netlify — headers em toda resposta
{ "headers": [{
  "source": "/(.*)",
  "headers": [
    { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
    { "key": "X-Frame-Options", "value": "DENY" },
    { "key": "X-Content-Type-Options", "value": "nosniff" },
    { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:" }
  ]
}]}
```

Raciocínio: comece o CSP restritivo (`'self'`) e afrouxe só o que quebrar de verdade, medindo no console — o caminho oposto (`*` e ir apertando) nunca converge porque nada quebra pra te avisar. Ferramentas como **securityheaders.com** e **Mozilla Observatory** dão nota da sua configuração em segundos.

## Por que cai em entrevista

Hardening mostra que você pensa em produção, não só em "funciona local". "Que headers de segurança você configura?" e "qual a diferença entre anon key e service key, e onde cada uma vive?" são perguntas que separam quem já subiu app com responsabilidade de quem só rodou `npm run dev`.

> **P:** "Seu app está funcionando. O que você aperta antes de considerá-lo pronto pra produção?"
>
> **R (30s):** "Hardening da configuração, que é onde mora o A05. Ligo os security headers — CSP restritivo como defesa forte contra XSS, HSTS pra forçar HTTPS, frame-ancestors contra clickjacking. Ponho rate limit em login e endpoints caros pra fechar força bruta e DoS. Reviso privilégio de credencial: a chave que aparece no front é a limitada por RLS, a service key com acesso total nunca sai do servidor — usar a poderosa onde a fraca bastava é o erro clássico. E confiro que nenhum segredo está no código, com escopo e plano de rotação. O princípio é o mesmo em tudo: o default vem inseguro de propósito, hardening é a passada que corrige isso onde importa."

## Checkpoint

- [ ] Sei os principais security headers (CSP, HSTS, frame-ancestors) e o que cada um defende
- [ ] Explico por que CSP é a defesa forte contra XSS e como calibrar (restritivo → afrouxar)
- [ ] Aplico menor privilégio: sei quando é anon key vs service key e onde cada uma vive
- [ ] Sei tratar secrets em produção (escopo, rotação, nunca no código)
- [ ] Rodei securityheaders.com ou Mozilla Observatory num app AG e li a nota

## Recursos

- [OWASP — Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [MDN — Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Mozilla Observatory](https://observatory.mozilla.org/) — nota automática de configuração
- Módulos relacionados: `60-seguranca/02` (XSS), `05-secrets-management`, `10` (threat modeling)
