# 07 — Fluxo de Trabalho Profissional

## O que é
A teoria dos módulos anteriores vira rotina diária num fluxo previsível: ramifica, commita atômico, sincroniza com rebase, abre PR. O objetivo é um histórico **legível** na `main` e mudanças **revisáveis** — não um emaranhado de "fix", "fix2", "agora vai".

## Remotes — o repositório de outra máquina
Um **remote** é um apelido para outra cópia do repo (no GitHub, geralmente `origin`). Os três verbos que sincronizam:

```bash
git remote -v                 # lista os remotes configurados
git fetch origin              # BAIXA commits novos do remoto, NÃO mexe no seu working dir
git push origin feature       # ENVIA seu branch pro remoto
git pull                      # = fetch + integra no branch atual (merge por padrão)
```

`fetch` é seguro: só atualiza as refs remotas (`origin/main`) localmente, sem tocar no seu trabalho — você inspeciona antes de integrar. `pull` é `fetch` + junção automática.

## pull --rebase — por que
`git pull` puro faz `fetch` + **merge**, gerando um **merge commit de sincronização** ("Merge branch 'main' of origin...") toda vez que você puxa com trabalho local pendente. O histórico enche desses commits-lixo. `pull --rebase` faz `fetch` + **rebase**: reaplica seus commits locais em cima do que veio do remoto, mantendo a linha **reta**.

```bash
git pull --rebase origin main
git config --global pull.rebase true   # torna --rebase o padrão de todo pull
```

(Lembre da regra de ouro do módulo 03: rebase só nos **seus** commits ainda não compartilhados — que é exatamente o caso aqui.)

## Feature branch + Conventional Commits
Nunca trabalhe direto na `main`. Cada feature/bug nasce num branch próprio:

```bash
git switch -c feat/exportar-pdf   # branch dedicada
# ...trabalha, commita atômico...
git push -u origin feat/exportar-pdf
```

A mensagem de commit segue **Conventional Commits** — prefixo padronizado que descreve o **tipo** e habilita changelog/versão automáticos:

```text
feat:     nova funcionalidade
fix:      correção de bug
refactor: muda código sem mudar comportamento
chore:    build, deps, config (não é feature nem fix)
docs:     documentação
test:     testes
```

```bash
git commit -m "feat: exporta relatório do dashboard em PDF"
git commit -m "fix: corrige cálculo de juros quando valor é zero"
```

A descrição diz o **porquê**, não o quê (o diff já mostra o quê). E **um commit, uma responsabilidade** — use `git add -p` (módulo 02) pra separar.

## Pull Request — o portão de revisão
Branch pronta → abre PR no GitHub (nunca merge direto na `main`). O PR é onde acontece a revisão de código, o CI roda e a discussão fica registrada. Fluxo completo:

```bash
git switch main && git pull --rebase   # parte do main atualizado
git switch -c feat/x                    # ramifica
# ...commits atômicos...
git pull --rebase origin main           # sincroniza antes de abrir (resolve conflito cedo)
git push -u origin feat/x               # publica
# abre o PR -> revisão -> merge pela interface
```

## .gitignore — o que nunca entra
Arquivos que **não** pertencem ao repositório: dependências, builds, segredos, lixo de IDE. Criar o `.gitignore` **antes do primeiro commit** evita ter que limpar histórico depois.

```text
node_modules/
dist/
build/
.next/
.env
.env.*
.DS_Store
```

`.gitignore` só afeta arquivos **ainda não rastreados**. Se você já commitou um `.env` por engano, adicionar ao `.gitignore` não basta — precisa `git rm --cached .env` e, se vazou segredo, **rotacionar a chave** (o segredo continua no histórico).

```bash
git rm --cached .env            # para de rastrear, mantém o arquivo no disco
```

**Em entrevista:** "Cada mudança nasce numa feature branch, com commits atômicos no padrão Conventional Commits (feat/fix/refactor...). Sincronizo com `pull --rebase` pra manter o histórico linear sem merge commits de sync, abro PR pra revisão — nunca merge direto na main — e mantenho `.gitignore` desde o primeiro commit pra builds, deps e `.env` jamais entrarem. `fetch` baixa sem tocar no meu trabalho; `pull` é fetch + integra."
