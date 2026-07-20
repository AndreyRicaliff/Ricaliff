# 10 — Threat Modeling

## O que é

Threat modeling é **modelar o adversário antes de escrever a feature** — mapear o que pode dar errado por ação de alguém mal-intencionado, enquanto o design ainda é barato de mudar. É o antídoto do A04 (Insecure Design, do módulo 01): a maioria das falhas de segurança não é bug de implementação, é ausência de qualquer pergunta sobre ataque no momento do design. Corrigir depois é patch; perguntar antes é arquitetura.

O método mais usado é o **STRIDE** — seis categorias de ameaça, cada uma o oposto de uma propriedade de segurança que você quer garantir:

- **S**poofing (falsificação de identidade) → viola **autenticação**. Alguém finge ser outro usuário. Defesa: authn forte, tokens assinados (módulo 09).
- **T**ampering (adulteração) → viola **integridade**. Alterar dado em trânsito ou em repouso. Defesa: TLS, validação em boundary, assinatura.
- **R**epudiation (repúdio) → viola **não-repúdio**. "Não fui eu que fiz" sem prova em contrário. Defesa: audit log imutável (A09).
- **I**nformation disclosure (vazamento) → viola **confidencialidade**. Dado sensível exposto. Defesa: RLS, criptografia (módulo 11), menor privilégio.
- **D**enial of service → viola **disponibilidade**. Derrubar o serviço. Defesa: rate limit, timeout, degradação (robustez 04/05).
- **E**levation of privilege (escalada) → viola **autorização**. Vira admin sem ser. Defesa: authz por recurso, RLS (módulo 09).

O valor do STRIDE é ser uma **checklist que força você a olhar cada ângulo**. Sem framework, você pensa só na ameaça óbvia; com ele, percorre as seis e descobre a que passou batido — que quase sempre é Repudiation (ninguém loga) ou Elevation (o endpoint admin sem verificação de role).

### Passo-a-passo: modelar o formulário público de pesquisa

Pegue uma feature real da AG — o formulário anônimo de pesquisa do PULSAR-RH — e rode o STRIDE:

1. **Desenhe o fluxo e as fronteiras de confiança.** Browser anônimo (não-confiável) → Edge Function → banco. A fronteira crítica é onde dado não-confiável cruza pra dentro.
2. **Spoofing:** alguém responde se passando por outro colaborador? → o design é *anônimo por construção*: não há identidade a falsificar na resposta (o ledger de participação é separado — módulo 32/08).
3. **Tampering:** manipulam o payload pra injetar resposta inválida? → validação de schema em boundary, não confiar no front.
4. **Repudiation:** não aplicável às respostas (anônimas), mas ações do admin precisam de audit log.
5. **Information disclosure:** a resposta anônima vaza a identidade por um canal lateral? → foi *exatamente* o bug real: o `audit_log` gravava a identidade que o schema tinha parado de guardar. O threat model teria pego isso antes.
6. **DoS:** bot enche o banco de respostas falsas? → rate limit por IP, captcha se necessário.
7. **Elevation:** o endpoint de resultado exige role de admin? → verificar authz, não só authn.

O resultado não é um documento pra arquivar — é uma lista de decisões de design que você toma agora, de graça, em vez de descobrir num incidente.

## Por que cai em entrevista

"Como você pensa em segurança ao projetar uma feature?" — quem responde STRIDE (ou pelo menos "modelo o adversário antes de codar") demonstra maturidade de design, não só conhecimento de vulnerabilidade isolada. E diferencia A04 (design inseguro) de A03 (bug de implementação): o primeiro não tem patch, tem redesenho.

> **P:** "Você vai construir um formulário público que coleta dados. Como pensa a segurança dele antes de codar?"
>
> **R (30s):** "Rodo um threat model rápido com STRIDE nas fronteiras de confiança. O dado vem de um cliente não-confiável, então: Tampering eu fecho com validação de schema no boundary; Information disclosure eu checo perguntando 'algum canal lateral vaza o que deveria ser anônimo?' — já me queimei com isso, o audit log gravava a identidade que o schema tinha parado de guardar; DoS eu mitigo com rate limit; Elevation eu fecho exigindo authz por role no endpoint de resultado, não só login. O ponto é fazer essas perguntas no design, quando mudar é de graça — insegurança de design não tem patch, tem redesenho."

## Checkpoint

- [ ] Sei as 6 categorias STRIDE e a propriedade de segurança que cada uma viola
- [ ] Explico a diferença entre A04 (design inseguro) e A03 (bug de implementação)
- [ ] Rodei STRIDE numa feature real e listei fronteiras de confiança
- [ ] Reconheço as ameaças mais esquecidas (Repudiation e Elevation)
- [ ] Conecto um achado do threat model a um bug real que teria sido prevenido

## Recursos

- [OWASP — Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [Microsoft — STRIDE](https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats)
- "Threat Modeling: Designing for Security" — Adam Shostack (livro de referência)
- Módulos relacionados: `60-seguranca/01` (OWASP), `09` (authn/authz), `07-auditoria-logs-imutavel`
