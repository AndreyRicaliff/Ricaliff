# 13 — Supply Chain

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento, com lastro em fonte
> primária), §Estruturação (como o conhecimento se organiza) e §Metodologia (o passo-a-passo
> replicável) — além da prática, P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Ataque de supply chain (cadeia de suprimentos) é comprometer você **através de algo em que você confia** — uma dependência, uma ferramenta de build, um pacote transitivo três níveis abaixo no seu `node_modules`. É o **A06 (Vulnerable Components)** e o **A08:2021 (Software and Data Integrity Failures)** do módulo 01 combinados, e é hoje um dos vetores mais perigosos porque a superfície não é o seu código — é o código de centenas de estranhos que o seu `package.json` puxa sem você ler uma linha. E o problema é mais fundo do que "atualize suas libs": ele toca numa verdade de 1984 sobre confiança que nenhuma ferramenta resolve.

---

## § BASE — o fundamento

**A raiz teórica — Ken Thompson, *Reflections on Trusting Trust* (1984).** Na palestra do Turing Award, Ken Thompson demonstrou algo que redefine o problema: ele backdooreou um compilador C pra inserir uma backdoor em *qualquer* programa que ele compilasse — inclusive em novas versões **do próprio compilador** — de forma **invisível no código-fonte**. Você podia ler cada linha do source e não achar nada: o mal morava no binário que compilava o source. A moral, nas palavras dele: *"você não pode confiar em código que você não criou totalmente por conta própria."* Essa é a declaração fundadora do problema de supply chain — **confiança é transitiva**, e a superfície de ataque não é o seu código, é *todo mundo na cadeia* que produziu o que você roda: o autor da lib, o mantenedor, a ferramenta de build, o registry. Ler o código não basta, porque o comprometimento pode estar um degrau abaixo de onde você olha.

**A dimensão do problema.** Um app Node típico tem **dezenas de dependências diretas e centenas de transitivas**. Você auditou o código que escreveu; não auditou as ~900 libs que roda em produção. Cada uma é um autor que pode ser comprometido, um mantenedor que pode publicar código malicioso, um pacote que pode ser sequestrado. Thompson estava certo em escala industrial.

**Os vetores concretos:**

**1. Vulnerabilidade conhecida (CVE) em dependência.** O caso definitivo é o **Log4Shell (CVE-2021-44228, dezembro/2021)**: uma linha de *JNDI lookup* na lib de log Java `log4j` deu execução remota de código em metade da internet Java — bastava logar input do usuário. Você não escreveu o bug; ele veio de uma dependência que estava em todo lugar e ninguém rastreava a versão.

**2. Typosquatting.** O atacante publica `expresss` (com três s) ou `lodahs` torcendo pra você errar o `npm install`. O pacote falso executa um script de `postinstall` que rouba env vars/tokens **na hora da instalação** — antes de qualquer código seu rodar. Defesa: conferir o nome, olhar downloads/idade/mantenedores antes de instalar algo novo.

**3. Dependency confusion (Alex Birsan, 2021).** Variante elegante: você tem um pacote *interno* `ag-utils`; o atacante publica um `ag-utils` **público** com versão maior, e o resolvedor do npm, achando que é o "mais novo", puxa o malicioso do registry público em vez do seu privado. Defesa: escopo (`@ag/utils`), registry configurado, versões pinadas.

**4. Comprometimento do mantenedor / injeção no build.** O mais assustador porque o pacote é *legítimo*. O caso **xz/liblzma (CVE-2024-3094, 2024)** é a aula: um mantenedor infiltrado (sob o nome "Jia Tan") passou **~2 anos** ganhando confiança e inseriu um backdoor no *processo de build* de uma lib de compressão que ia entrar em quase todo Linux — pego quase por acaso por **Andres Freund**, um engenheiro que estranhou **~500ms** de latência a mais no SSH. O ataque **SolarWinds (2020)** é a versão corporativa: o update *assinado e legítimo* foi comprometido na origem e instalado por **~18 mil organizações**. Nos dois, o código-fonte que você leria estava limpo — exatamente o cenário de Thompson.

**A resposta de integridade — A08.** Contra "o pacote foi adulterado no caminho", a defesa é criptográfica: o lockfile grava um **hash de integridade** de cada pacote; iniciativas como **SLSA** e **Sigstore** assinam a *procedência* do artefato (quem buildou, de qual source). É a materialização do "confie, mas verifique com hash".

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A cadeia é uma sequência de pontos de confiança; o ataque entra em qualquer elo, e a maioria dos elos você não controla nem vê:

```
VOCÊ ─► deps DIRETAS ─► TRANSITIVAS (centenas) ─► MANTENEDORES ─► BUILD/CI ─► REGISTRY (npm)
  │        │                 │                        │              │            │
  │     você escolheu    você nunca viu          pode ser        pode injetar   pode servir
  │     (dezenas)        (vêm de brinde)         infiltrado      no artefato    pacote falso
  ▼        ▼                 ▼                        ▼              ▼            ▼
 seu    Log4Shell      o CVE mora aqui           xz/liblzma      SolarWinds   typosquat /
 código (A06)          (transitiva)              CVE-2024-3094   (2020)       dependency confusion
                                                 "pacote legítimo" — Thompson 1984
```

Três disciplinas valem mais que qualquer scanner, e mapeiam nos elos:

| Disciplina | Ataca o elo | Como |
|---|---|---|
| Lockfile + `npm ci` | registry/adulteração | hash de integridade fixa a árvore exata; detecta pacote trocado |
| `npm audit` com critério | CVE conhecido | classifica por severidade **e** exploitabilidade, não por pânico |
| Instalar menos | autor/mantenedor/transitiva | menos código de estranho = menos superfície (a lição de Thompson) |

---

## § METODOLOGIA — o passo-a-passo replicável

**1. PINAR com lockfile e instalar com `npm ci`.** `package-lock.json` fixa a árvore inteira com hash de integridade. `npm ci` (não `npm install`) instala **exatamente** o lockfile — reprodutível, e o hash detecta pacote adulterado. `npm install` resolve "compatível" e pode trazer versão diferente: abre janela. Lockfile sempre commitado, sempre revisado no PR quando muda.

**2. AUDITAR com critério, não pânico.** Nem todo CVE te afeta (uma vuln numa lib que você só usa no build talvez não seja explorável em runtime). Classifique por severidade **e** exploitabilidade (módulo 08) — mas Critical em dependência de runtime é ação imediata.

**3. INSTALAR MENOS — a defesa mais forte.** A dependência mais segura é a que você não adicionou. Antes de `npm install left-pad`, pergunte: dá pra escrever em 5 linhas? Cada lib nova é superfície de ataque, autor pra confiar e transitivas de brinde. Minimalismo de dependência é decisão de segurança, direto de Thompson.

**4. VERIFICAR o que adiciona.** Antes de instalar um pacote novo: nome exato (anti-typosquat), downloads, idade, mantenedores, se o repo existe. `@escopo/` pra pacote interno (anti-dependency-confusion).

**5. ISOLAR a instalação.** Scripts de `postinstall` rodam com os seus privilégios: no CI, não exponha secrets no passo de install; considere `--ignore-scripts` onde der.

**Anti-padrões:**
- **`npm install` em CI/prod em vez de `npm ci`.** Resolve "compatível", ignora o hash — perde reprodutibilidade e detecção de adulteração.
- **`npm audit fix --force` no escuro.** Sobe majors, pode quebrar; teste depois (módulo 08).
- **Instalar por preguiça** (`left-pad`, `is-odd`). Cada uma é superfície e transitivas.
- **Confiar porque "é legítimo".** xz era legítimo por 2 anos. Legitimidade não é garantia — integridade (hash) e minimalismo são.
- **Rodar postinstall com secrets no ambiente.** É o vetor do typosquat: rouba token na instalação.

---

## Passo-a-passo aplicado (faça agora, ~20min)

Higiene de supply chain num projeto AG, e inspeção antes de instalar.

```bash
npm audit --audit-level=high    # CVEs conhecidos nas suas deps, por severidade
npm audit fix                   # corrige o que dá sem quebrar (patch/minor)
npm ci                          # instala EXATAMENTE o lockfile (com hash), não "compatível"
```

Antes de adicionar qualquer lib nova, inspecione — é o passo que pega typosquat e pacote abandonado:

```bash
# troque <pkg> pelo pacote que você ia instalar
npm view <pkg> name version time.created time.modified maintainers dist.integrity
#  - name:      confira letra por letra (expresss? lodahs?)
#  - created:   pacote de 3 dias com nome parecido com um popular = red flag
#  - maintainers / repository: existe? é quem você espera?
```

## Por que cai em entrevista

"Como você lida com vulnerabilidade em dependência?" testa se você opera com responsabilidade. Citar Log4Shell ou xz pelo nome, com o mecanismo, mostra que você acompanha o campo. E a ideia de que "instalar menos é defesa" é contra-intuitiva o suficiente pra impressionar quem entende.

> **P:** "Como você mantém as dependências do seu projeto seguras?"
>
> **R (30s):** "Três camadas. Lockfile commitado e `npm ci` pra instalar exatamente a árvore auditada, com hash de integridade que detecta pacote adulterado — não `npm install`, que resolve 'compatível' e abre janela. `npm audit` recorrente, classificando por severidade e exploitabilidade — Critical em runtime é ação imediata, tipo o Log4Shell. E a defesa mais forte, que é cultural: instalar menos. Cada dependência é código de um estranho rodando em produção e uma superfície de ataque — o caso xz de 2024, um backdoor plantado por um mantenedor infiltrado, mostra que nem pacote 'legítimo' é garantia. A lib mais segura é a que eu não adicionei."

> **P (nova):** "Você não pode simplesmente auditar o código das suas dependências e ficar seguro?"
>
> **R (30s):** "Não, e isso é o Ken Thompson em 'Reflections on Trusting Trust', de 1984: ele mostrou que dá pra backdoorar um compilador de um jeito invisível no código-fonte — o mal mora no binário que compila o source, não no source que você lê. A lição é que confiança é transitiva: eu não posso confiar totalmente em código que eu não criei inteiro. E na prática são centenas de transitivas, mais mantenedores, mais o build, mais o registry — não tem como eu ler tudo, e ler não pegaria um ataque plantado no build, como o xz. Então eu não aposto em 'auditar e confiar': aposto em hash de integridade no lockfile e `npm ci` pra detectar adulteração, procedência assinada onde existe, e principalmente em reduzir a superfície — instalar menos. A parte que eu não consigo verificar, eu diminuo."

## Checkpoint

- [ ] Explico o que é ataque de supply chain e por que a superfície é maior que meu código (Thompson, trusting trust)
- [ ] Cito Log4Shell, xz/CVE-2024-3094 e SolarWinds com o mecanismo de cada
- [ ] Sei a diferença entre `npm install` e `npm ci` e por que ci é mais seguro (hash de integridade)
- [ ] Reconheço typosquatting e dependency confusion e sei a defesa de cada
- [ ] Uso `npm audit` classificando por severidade E exploitabilidade, não por pânico
- [ ] Defendo "instalar menos" como decisão de segurança, não só de bundle

## Recursos

- **Ken Thompson (1984) — *Reflections on Trusting Trust* (Turing Award Lecture)**: a raiz teórica — não se confia em código que não se criou (fonte primária da §BASE)
- **NVD — CVE-2021-44228 (Log4Shell)** e **CVE-2024-3094 (xz backdoor)**: os advisories e mecanismos
- **Alex Birsan (2021) — "Dependency Confusion"**: o vetor de confusão de nomes público × privado
- **SLSA** (Supply-chain Levels for Software Artifacts) e **Sigstore**: procedência assinada de artefatos
- **OWASP Top 10 — A08:2021 Software and Data Integrity Failures**; **npm docs — `npm audit` / `npm ci`**; **Snyk**
