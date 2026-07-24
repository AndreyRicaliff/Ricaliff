# 12 — Hardening

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Hardening é **reduzir a superfície de ataque** de um sistema já funcional: fechar portas que não precisam estar abertas, apertar permissões pro mínimo, ligar as defesas que vêm desligadas por padrão. É a resposta direta ao **A05:2021 — Security Misconfiguration** — a categoria de vulnerabilidade que existe não porque alguém escreveu código ruim, mas porque **ninguém mudou o default**. O default é escolhido pra "funcionar fácil", não pra "ser seguro"; hardening é a passada que troca conveniência por segurança onde importa. E os princípios que guiam essa passada não são intuição — são os mesmos oito de 1975 que regem projeto seguro.

---

## § BASE — o fundamento

**Os princípios que mandam — Saltzer & Schroeder (1975).** *The Protection of Information in Computer Systems* deu os oito princípios canônicos de projeto seguro; quatro são o esqueleto de todo hardening:

- **Least privilege (menor privilégio):** cada credencial recebe o mínimo que a tarefa exige, nunca mais. É o princípio mais violado nos apps AG — usar `SERVICE_ROLE_KEY` (que bypassa RLS, acesso total) onde o `ANON_KEY` (limitado por RLS) bastava. A chave poderosa no lugar errado é uma chave-mestra num cadeado que devia ser específico: se vaza, vaza *tudo*.
- **Fail-safe defaults (padrão seguro):** a decisão default deve ser negar/fechar. O drama do hardening é que o vendor **inverte** isso — entrega defaults permissivos ("funciona fácil") —, então hardening é reestabelecer o fail-safe: fechar o que veio aberto.
- **Economy of mechanism (economia de mecanismo):** quanto menos peça, menos configuração pra errar. Reduzir superfície de ataque *é* economia de mecanismo — cada porta aberta, cada header default, cada serviço ligado é uma peça a mais que pode ser mal configurada.
- **Complete mediation** e **defense in depth (defesa em profundidade):** nenhuma defesa é suficiente sozinha; você empilha camadas independentes. O ag-converge fez isso: renomeou rotas administrativas pra não-óbvias *e* limitou a taxa — obscuridade **mais** limite, não obscuridade *no lugar de* limite.

Guardar esses nomes transforma "eu fecho os headers e boto rate limit" em "eu aplico least privilege, fail-safe defaults e defense in depth na configuração" — a linguagem de quem entende o porquê.

**As quatro frentes que cobrem a maior parte do ganho.**

**1. Security headers.** Cabeçalhos HTTP que instruem o browser a se defender:
- **CSP (Content-Security-Policy)** — a defesa mais forte contra XSS (módulo 02): declara de onde script/estilo/imagem podem vir; um `<script>` injetado de origem não-listada simplesmente **não executa**. Transforma XSS de "executa" em "bloqueado" (MDN — Content Security Policy).
- **HSTS (Strict-Transport-Security, RFC 6797)** — força HTTPS mesmo se o usuário digitar `http://`, fechando a janela de downgrade/man-in-the-middle na primeira conexão.
- **X-Frame-Options / `frame-ancestors`** — impede seu site de ser embutido em iframe de terceiro (clickjacking).
- **X-Content-Type-Options: nosniff** — impede o browser de "adivinhar" o content-type e executar algo como script.

**2. Rate limiting.** Todo endpoint que custa (login, envio de e-mail, criação de recurso, chamada cara) precisa de limite por origem. Sem rate limit, o login vira alvo de força bruta (A07) e qualquer endpoint vira vetor de DoS (o **D** do STRIDE, módulo 10).

**3. Menor privilégio (least privilege aplicado).** A regra operacional: **a chave que aparece no front é sempre a de menor privilégio; a poderosa nunca sai do servidor.** Anon key no browser (cortada por RLS), service role só no backend.

**4. Secrets em produção.** Segredo é variável de ambiente com **escopo** (só o serviço que precisa enxerga), **rotação** (troca periódica e revogação imediata no vazamento) e **nunca no código**. O incidente real que a AG viveu — `SERVICE_ROLE_KEY` hardcoded num script de setup — é o anti-padrão: chave versionada é chave vazada no dia em que o repo fica público. A ordem no vazamento é sempre *revogar antes de investigar* (módulo 14).

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

As quatro frentes não são aleatórias — cada uma endurece **uma camada** do caminho do request, e juntas são defense in depth:

```
[Browser]  ← FRENTE 1: security headers (CSP, HSTS, frame-ancestors) dizem ao browser como se defender
    │
    ▼
[Edge/API] ← FRENTE 2: rate limit por origem em login e endpoints caros (fecha brute force + DoS)
    │
    ▼
[Credencial] ← FRENTE 3: least privilege — anon key aqui (cortada por RLS); service key NUNCA sai do backend
    │
    ▼
[Segredo]  ← FRENTE 4: escopo + rotação + nunca no código; vazou → revoga antes de investigar
```

Cada frente troca um **default inseguro** por um estado endurecido:

| Frente | Default (inseguro, "funciona fácil") | Endurecido |
|---|---|---|
| Headers | nenhum header → XSS executa, http aceito | CSP `'self'`, HSTS, frame-ancestors, nosniff |
| Rate limit | ilimitado → brute force livre | limite por IP/origem em rotas custosas |
| Credencial | service key conveniente em todo lugar | anon no front, service só no servidor |
| Secrets | hardcoded / commitado | env com escopo + rotação, fora do git |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. INVENTARIAR os defaults.** Pergunte de cada camada: o que vem ligado/desligado por padrão, e por quê? O A05 mora no que ninguém revisou.

**2. HEADERS restritivo-primeiro.** Comece o CSP no mais fechado (`'self'`) e **afrouxe só o que quebrar de verdade**, medindo no console. O caminho oposto (`*` e ir apertando) nunca converge, porque nada quebra pra te avisar.

**3. RATE LIMIT em toda rota custosa.** Login primeiro (é o alvo de força bruta), depois envio de e-mail, criação de recurso, chamadas caras.

**4. LEAST PRIVILEGE em cada credencial.** A chave do front é a mais fraca; a poderosa mora só no servidor. Reveja cada uso de service key: dava pra ser anon?

**5. SECRETS com escopo, rotação e fora do código.** `.env` no `.gitignore`, `.env.example` sem valores, plano de rotação.

**6. MEDIR.** securityheaders.com e Mozilla Observatory dão nota da configuração em segundos — feche o loop com um número.

**Anti-padrões:**
- **CSP começando em `*` e apertando.** Nunca converge; nada quebra pra sinalizar o excesso. Restritivo → afrouxa.
- **Service key no front.** Chave-mestra exposta; vaza uma, vaza tudo. Viola least privilege da forma mais cara.
- **Secret no código.** Chave versionada = chave vazada no dia do repo público.
- **Rate limit esquecido no login.** É *o* endpoint de força bruta; sem limite, senha fraca cai em minutos.
- **Obscuridade como única defesa.** Renomear a rota admin sem limitar/autorizar é esconder a chave debaixo do tapete — defesa em profundidade é obscuridade **mais** controle, nunca no lugar dele.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Ligue os headers numa app AG e meça a nota.

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

Depois do deploy, rode **securityheaders.com** e **Mozilla Observatory** no domínio da app e leia a nota — cada header ausente aparece com o motivo. Ajuste o CSP afrouxando só o que o console acusar quebrado (uma fonte de fonte, um domínio de imagem), nunca abrindo pra `*`.

## Por que cai em entrevista

Hardening mostra que você pensa em produção, não só em "funciona local". "Que headers de segurança você configura?" e "qual a diferença entre anon key e service key, e onde cada uma vive?" são perguntas que separam quem já subiu app com responsabilidade de quem só rodou `npm run dev`.

> **P:** "Seu app está funcionando. O que você aperta antes de considerá-lo pronto pra produção?"
>
> **R (30s):** "Hardening da configuração, que é onde mora o A05. Ligo os security headers — CSP restritivo como defesa forte contra XSS, HSTS pra forçar HTTPS, frame-ancestors contra clickjacking. Ponho rate limit em login e endpoints caros pra fechar força bruta e DoS. Reviso privilégio de credencial: a chave que aparece no front é a limitada por RLS, a service key com acesso total nunca sai do servidor — usar a poderosa onde a fraca bastava é o erro clássico. E confiro que nenhum segredo está no código, com escopo e plano de rotação. O princípio é o mesmo em tudo: o default vem inseguro de propósito, hardening é a passada que corrige isso onde importa."

> **P (nova):** "Qual a diferença entre a anon key e a service role key do Supabase, e onde cada uma vive?"
>
> **R (30s):** "A anon key é a chave pública do front: ela é cortada pela RLS, então mesmo exposta no browser ela só enxerga o que a política de linha permite — é o menor privilégio de propósito. A service role key bypassa RLS por completo, acesso total ao banco — ela nunca sai do servidor, mora em variável de ambiente do backend, nunca no bundle do front. O princípio é least privilege, do Saltzer & Schroeder: a chave que aparece na frente é sempre a mais fraca; a poderosa fica no cofre. O erro clássico, que já vi nos apps AG, é usar a service key onde a anon bastava, por conveniência — e aí você tem uma chave-mestra rodando num lugar que qualquer um lê. Se ela vaza, não vaza um dado, vaza o banco inteiro; por isso o lugar dela é só o servidor, com plano de rotação."

## Checkpoint

- [ ] Nomeio least privilege, fail-safe defaults, economy of mechanism e defense in depth (Saltzer & Schroeder) e ligo cada um a uma frente de hardening
- [ ] Sei os principais security headers (CSP, HSTS, frame-ancestors, nosniff) e o que cada um defende
- [ ] Explico por que CSP é a defesa forte contra XSS e por que calibrar restritivo → afrouxar (nunca `*` → apertar)
- [ ] Aplico menor privilégio: sei quando é anon key vs service key e onde cada uma vive
- [ ] Sei tratar secrets em produção (escopo, rotação, nunca no código)
- [ ] Rodei securityheaders.com ou Mozilla Observatory num app AG e li a nota

## Recursos

- **Saltzer & Schroeder (1975) — *The Protection of Information in Computer Systems***: least privilege, fail-safe defaults, economy of mechanism (fonte primária da §BASE)
- **RFC 6797 — HTTP Strict Transport Security (HSTS)**: o mecanismo de força-HTTPS
- **OWASP — Secure Headers Project**: a lista canônica de headers e valores recomendados
- **MDN — Content Security Policy (CSP)**: diretivas e calibração
- **Mozilla Observatory** e **securityheaders.com**: nota automática de configuração
- Módulos relacionados: `60-seguranca/02` (XSS), `05-secrets-management`, `10` (threat modeling), `14` (incident response)
