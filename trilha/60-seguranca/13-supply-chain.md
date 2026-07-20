# 13 — Supply Chain

## O que é

Ataque de supply chain (cadeia de suprimentos) é comprometer você **através de algo em que você confia** — uma dependência, uma ferramenta de build, um pacote transitivo três níveis abaixo no seu `node_modules`. É o A06 (Vulnerable Components) e o A08 (Integrity Failures) do módulo 01 combinados, e é hoje um dos vetores mais perigosos porque a superfície não é o seu código — é o código de centenas de estranhos que o seu `package.json` puxa sem você ler uma linha.

A dimensão do problema: um app Node típico tem **dezenas de dependências diretas e centenas de transitivas**. Você auditou o código que escreveu; não auditou as 900 libs que roda em produção. Cada uma é um autor que pode ser comprometido, um mantenedor que pode publicar código malicioso, um pacote que pode ser sequestrado.

Os vetores concretos:

**Vulnerabilidade conhecida (CVE) em dependência.** O caso definitivo é o **Log4Shell** (CVE-2021-44228, dezembro/2021): uma linha de JNDI lookup na lib de log Java `log4j` deu execução remota de código em metade da internet Java — bastava logar input do usuário. Você não escreveu o bug; ele veio de uma dependência que estava em todo lugar e ninguém rastreava a versão.

**Typosquatting.** O atacante publica `expresss` (com três s) ou `lodahs` torcendo pra você errar o `npm install`. O pacote falso rouba env vars/tokens na instalação. Defesa: conferir o nome, olhar downloads/idade do pacote antes de instalar algo novo.

**Comprometimento do mantenedor / injeção no build.** O mais assustador porque o pacote é *legítimo*. O caso **xz/liblzma (CVE-2024-3094, 2024)** é a aula: um mantenedor infiltrado passou ~2 anos ganhando confiança e inseriu um backdoor no processo de build de uma lib de compressão que ia entrar em quase todo Linux — pego quase por acaso por um engenheiro que estranhou meio segundo de latência a mais no SSH. O ataque **SolarWinds (2020)** é a versão corporativa: o update *assinado e legítimo* foi comprometido na origem e instalado por 18 mil organizações.

### Passo-a-passo: higiene de supply chain

```bash
npm audit --audit-level=high    # CVEs conhecidos nas suas deps, por severidade
npm audit fix                   # corrige o que dá sem quebrar (patch/minor)
npm ci                          # instala EXATAMENTE o lockfile, não "compatível"
```

Três disciplinas que valem mais que qualquer ferramenta:

1. **Lockfile é contrato, não sugestão.** `package-lock.json` fixa a árvore inteira com hash de integridade. `npm ci` (não `npm install`) instala exatamente o lockfile — reprodutível, e o hash detecta pacote adulterado. Lockfile sempre commitado, sempre revisado no PR quando muda.
2. **`npm audit` com critério, não pânico.** Nem todo CVE te afeta (uma vuln de SSR numa lib que você só usa no build talvez não seja explorável). Classifique por severidade *e* exploitabilidade — mas Critical em dependência de runtime é ação imediata.
3. **Instalar menos é a melhor defesa.** A dependência mais segura é a que você não adicionou. Antes de `npm install left-pad`, pergunte: dá pra escrever em 5 linhas? Cada lib nova é superfície de ataque, autor pra confiar, e transitivas que vêm de brinde. Minimalismo de dependência é decisão de segurança.

## Por que cai em entrevista

"Como você lida com vulnerabilidade em dependência?" testa se você opera com responsabilidade. Citar Log4Shell ou xz pelo nome, com o mecanismo, mostra que você acompanha o campo. E a ideia de que "instalar menos é defesa" é contra-intuitiva o suficiente pra impressionar quem entende.

> **P:** "Como você mantém as dependências do seu projeto seguras?"
>
> **R (30s):** "Três camadas. Lockfile commitado e `npm ci` pra instalar exatamente a árvore auditada, com hash de integridade que detecta pacote adulterado — não `npm install`, que resolve 'compatível' e abre janela. `npm audit` recorrente, classificando por severidade e exploitabilidade — Critical em runtime é ação imediata, tipo o Log4Shell. E a defesa mais forte, que é cultural: instalar menos. Cada dependência é código de um estranho rodando em produção e uma superfície de ataque — o caso xz de 2024, um backdoor plantado por um mantenedor infiltrado, mostra que nem pacote 'legítimo' é garantia. A lib mais segura é a que eu não adicionei."

## Checkpoint

- [ ] Explico o que é ataque de supply chain e por que a superfície é maior que meu código
- [ ] Cito Log4Shell e xz/SolarWinds com o mecanismo de cada
- [ ] Sei a diferença entre `npm install` e `npm ci` e por que ci é mais seguro
- [ ] Uso `npm audit` classificando por severidade E exploitabilidade, não por pânico
- [ ] Defendo "instalar menos" como decisão de segurança

## Recursos

- [CVE-2021-44228 (Log4Shell)](https://nvd.nist.gov/vuln/detail/CVE-2021-44228)
- [CVE-2024-3094 (xz backdoor)](https://nvd.nist.gov/vuln/detail/CVE-2024-3094)
- [npm docs — npm audit](https://docs.npmjs.com/cli/commands/npm-audit)
- [Snyk](https://snyk.io/) — scanner de dependências com free tier
