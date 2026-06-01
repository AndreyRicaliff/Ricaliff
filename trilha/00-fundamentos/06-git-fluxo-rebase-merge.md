# 06 — Git: Fluxo, Rebase, Merge e Ferramentas

## O que é

Git rastreia snapshots do projeto, não diffs. Cada commit aponta para o commit anterior, formando um grafo acíclico dirigido (DAG). Branches são apenas ponteiros para commits — mover uma branch é barato e instantâneo.

```bash
# visualizar o grafo de commits
git log --oneline --graph --all
# * a1b2c3d (HEAD -> feat/nova-rota) feat(api): add recording endpoint
# * f4e5d6c fix(bot): resolve puppeteer crash on headless mode
# | * 9g8h7i6 (main) chore(deps): bump prisma to 5.10
# |/
# * 3j2k1l0 feat(auth): restrict login to AG domain
```

**Merge** une dois branches criando um commit de merge (dois pais). Preserva o histórico exato. O grafo fica não-linear.

**Rebase** reaplica commits de uma branch por cima de outra, reescrevendo os SHAs. O histórico fica linear — parece que o trabalho sempre foi feito depois do commit base.

```bash
# merge: preserva história, cria commit de merge
git checkout main && git merge feat/nova-rota
# resultado: histórico divergente + merge commit

# rebase: reescreve SHA, histórico linear
git checkout feat/nova-rota && git rebase main
# resultado: como se o branch tivesse começado agora em cima de main
```

---

## Por que cai em entrevista

Git é ferramenta diária. Entrevistadores testam se você navega o histórico com intenção ou usa `git add . && git commit -m "fix"` às cegas. Variações reais:

- "Qual a diferença entre merge e rebase?"
- "Quando você usaria `git reset --hard` vs `git revert`?"
- "Como você desfaz o último commit sem perder as alterações?"
- "O que é um conflito de merge e como você resolve?"
- "Como você encontraria em qual commit um bug foi introduzido?"
- "Por que force push em main é proibido?"

---

## Trade-offs (quando usar X vs Y)

### Merge vs Rebase

| | Merge | Rebase |
|---|---|---|
| Histórico | não-linear, preserva exatamente o que aconteceu | linear, mais legível |
| SHAs | originais preservados | reescritos (novos SHAs) |
| Seguro em branch compartilhada | sim | **não** — reescreve história que outros têm |
| Quando usar | integração de feature branch em main (via PR) | atualizar feature branch com main antes de PR |
| Regra de ouro | nunca rebase em branch que outras pessoas usam | livre em branches pessoais/locais |

**Regra de bolso:** `git pull --rebase` para atualizar branch local (evita merge commits de "Merge branch 'main' into feature"). PR merge para integrar (preserva quando a feature foi feita).

### Reset vs Revert

| Comando | O que faz | Seguro em main? |
|---|---|---|
| `git reset --soft HEAD~1` | desfaz commit, mantém mudanças staged | apenas local |
| `git reset --mixed HEAD~1` | desfaz commit, mantém mudanças unstaged (default) | apenas local |
| `git reset --hard HEAD~1` | desfaz commit e **descarta as mudanças** | apenas local — cuidado |
| `git revert <sha>` | cria novo commit que desfaz o alvo | seguro em main — não reescreve história |

**Regra:** em branch local que ninguém usa, `reset` é livre. Em branch compartilhada ou main, sempre `revert`.

### Conventional Commits

Prefixo comunica intenção, não só o que mudou. Segue a estrutura `tipo(escopo): mensagem imperativa`.

| Prefixo | Quando |
|---|---|
| `feat` | nova funcionalidade |
| `fix` | correção de bug |
| `refactor` | mudança interna sem alterar comportamento |
| `chore` | deps, configs, CI — sem impacto em runtime |
| `docs` | só documentação |
| `test` | adição ou correção de testes |
| `perf` | melhoria de performance |

```bash
# bom commit: diz POR QUÊ e tem escopo
feat(auth): restrict OAuth login to AG domain to prevent external access

# ruim: não diz nada
fix stuff
update
wip
```

### Ferramentas essenciais

```bash
git stash                        # salva trabalho sem commitar
git stash pop                    # recupera o stash
git stash list                   # lista stashes salvos

git log --oneline -20            # histórico compacto
git log --oneline --graph --all  # grafo completo com branches

git diff main...feat/minha-branch  # o que esta branch adicionou

git bisect start                 # inicia busca binária de bug
git bisect bad                   # commit atual tem o bug
git bisect good <sha>            # sha conhecido sem o bug
# Git faz checkout automático no meio — você testa e diz good/bad
git bisect reset                 # termina a sessão
```

---

## Exercício aplicado (projeto AG real)

Commits grandes contam a história do projeto. Ler e recontar em prosa treina a habilidade de comunicar mudanças — fundamental em PR, code review e entrevistas.

### Passo a passo

1. **Escolher um projeto AG com histórico rico:**
   ```bash
   git -C ~/projetos/cliente-oficina-backend log --oneline | head -20
   ```
   ```bash
   git -C ~/projetos/PULSAR-RH log --oneline | head -20
   ```

2. **Escolher 1 commit que parece substantivo (não "fix typo"):**
   ```bash
   git -C ~/projetos/PULSAR-RH show <sha> --stat
   ```
   O `--stat` mostra quais arquivos mudaram e quantas linhas, sem mostrar o diff completo.

3. **Ler o diff completo desse commit:**
   ```bash
   git -C ~/projetos/PULSAR-RH show <sha>
   ```

4. **Escrever 1 parágrafo** (abrir `~/projetos/estudos/rascunhos/commit-story.md`) descrevendo:
   - O que o código fazia antes
   - O que mudou
   - Por que provavelmente mudou (infira pelo contexto)
   - Se você fosse o autor, como seria a mensagem de commit ideal

5. **Auditar a mensagem de commit real**:
   - Segue Conventional Commits?
   - Descreve o POR QUÊ ou só o O QUÊ?
   - Se fosse um commit ruim, reescreva como ficaria melhor

6. **Exercitar o stash** (no projeto AG local, faça uma mudança qualquer):
   ```bash
   # muda qualquer coisa num arquivo do projeto
   git -C ~/projetos/PULSAR-RH stash
   git -C ~/projetos/PULSAR-RH stash list
   git -C ~/projetos/PULSAR-RH stash pop
   ```

7. **Registrar no `DECISIONS.md`:**
   ```markdown
   ## 2026-06-XX — [process] padrão de commits AG

   **Decisão:** Conventional Commits obrigatório em todos os projetos AG.
   **Por quê:** histórico legível vira documentação viva. `git log --oneline` de um projeto com
   conventional commits conta a história do produto. `git log` de um projeto sem é
   "update, fix, more fixes, wip, final" — inútil para debug ou onboarding.
   **Regra de bolso:**
   - Pull/sync: `git pull --rebase` → histórico linear
   - Branch local: rebase livre
   - Branch compartilhada: merge via PR, nunca rebase
   - Desfazer em main: sempre `git revert`, nunca `reset`
   ```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Qual a diferença entre `git merge` e `git rebase`? Quando você usa cada?"
>
> **R (30s):**
> "Merge une dois branches criando um commit com dois pais — o histórico fica não-linear mas preserva exatamente o que aconteceu e quando. Rebase reaplica meus commits por cima de outro branch, reescrevendo os SHAs — o histórico fica linear, mais fácil de ler. Uso rebase para manter minha feature branch atualizada com main antes de abrir PR. Uso merge para integrar a feature branch em main via PR — aí quero preservar quando a feature foi feita. A regra que nunca quebro: nunca rebase em branch que outras pessoas estão usando — estou reescrevendo história que elas já têm local."

> **P:** "Como você encontraria em qual commit um bug foi introduzido numa base com 500 commits?"
>
> **R (30s):**
> "Usaria `git bisect`. Digo pro Git qual commit tem o bug (`git bisect bad`) e qual era bom (`git bisect good <sha>`) — o Git faz uma busca binária no histórico, dando checkout no commit do meio. Eu testo, digo se é bom ou ruim, e repito. Em ~9 passos ele isola o commit culpado num histórico de 500. É exatamente busca binária O(log n) aplicada a commits. Se o projeto tem testes automatizados, dá para fazer `git bisect run npm test` e o processo roda sozinho."

---

## Checkpoint

- [ ] Consigo explicar merge vs rebase sem consultar, com exemplo de quando usar cada
- [ ] Sei a diferença entre `reset --soft`, `--mixed` e `--hard`
- [ ] Li o diff de 1 commit real de um projeto AG e escrevi o parágrafo descrevendo o que fez
- [ ] Executei um `git bisect` (mesmo que em lab local) pelo menos 1 vez
- [ ] Recitei ambas as respostas de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Git fluxo e ferramentas dominados`.

---

## Recursos

- Pro Git (gratuito) — [Capítulo 3: Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)
- Pro Git — [Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)
- Conventional Commits — [spec oficial](https://www.conventionalcommits.org/en/v1.0.0/)
- `~/projetos/PULSAR-RH/` — referência de histórico git real de projeto AG em produção
