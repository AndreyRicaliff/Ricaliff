# 06 — Verificar o Alvo Certo

## O que é

Existe um bug pior que não verificar: verificar **a coisa errada** e ganhar confiança falsa. O teste passou, o select voltou linhas, a tela abriu — mas contra outra branch, outro ambiente, outra tabela ou um bundle velho. O "verificado" carimbado no alvo errado é mais perigoso que o "não sei", porque desativa a desconfiança de todo mundo.

O caso famoso: **GitLab, 31/01/2017**. Sob pressão num incidente, um engenheiro rodou `rm -rf` no diretório de dados do Postgres — convencido de estar no servidor secundário (`db2`). Estava no primário (`db1`). ~300 GB de dados de produção apagados, e a recuperação expôs que os mecanismos de backup em que confiavam falhavam em silêncio. A ação estava "certa"; o **alvo** estava errado. O postmortem público virou aula de engenharia.

Os quatro falsos "verificado" clássicos:

| # | Falso verificado | Como acontece | Prova do alvo |
|---|---|---|---|
| 1 | Branch errada | Fix na feature branch, teste rodou na main (ou vice-versa) | `git rev-parse --abbrev-ref HEAD` + hash curto no report |
| 2 | Ambiente errado | "Testei o app", mas era localhost/preview — prod tem outra env var | URL completa + um header do response (build id, `x-vercel-id`) |
| 3 | Tabela/banco errado | Select na cópia de staging ou na tabela homônima de outro schema | `select current_database()` + schema qualificado na query |
| 4 | Cache velho | Bundle antigo no browser/CDN/service worker — a tela "testada" é a de ontem | Hard reload (Ctrl+Shift+R) + conferir o hash do bundle |

### O carimbo de alvo

Regra: **toda verificação reporta QUAL alvo leu**, não só o resultado. Não "o teste passou" — "o teste passou na branch `fix/rls` em `a1b2c3d`". Não "a query voltou 132 linhas" — "132 linhas em `current_database() = prod`, schema `public`". O carimbo custa uma linha; a confiança falsa custa um incidente. Corolário do GitLab: quanto mais destrutiva a ação, mais explícito o carimbo — antes de qualquer comando irreversível, imprima o alvo (`hostname`, `pwd`, `current_database()`) e **leia** antes de dar Enter.

### Passo a passo: checklist antes de reportar um fix de dashboard (Cliente Varejo)

```bash
# 1. Que branch/commit estou testando? (falso #1)
git rev-parse --abbrev-ref HEAD && git rev-parse --short HEAD

# 2. Que ambiente estou abrindo? (falso #2)
curl -s -I https://app-do-cliente.exemplo | grep -i "x-vercel-id"
#    preview deployment tem URL própria — conferir se a URL É a de prod

# 3. Que banco a query leu? (falso #3)
#    select current_database(), current_schema();  -- junto da query de conferência

# 4. Estou vendo o bundle novo? (falso #4)
#    Ctrl+Shift+R + DevTools > Network > hash do JS principal mudou?

# 5. Só então: "verificado em <branch>@<hash>, <url de prod>, banco <nome>"
```

Caso real AG: quatro "verificados" falsos em dois dias — teste rodado na branch errada, tela de login confundida com o app logado, select na tabela homônima errada e tela cacheada julgada como atual. Nenhum era bug de código; todos eram alvo errado. A regra do carimbo nasceu daí.

## Por que cai em entrevista

Incidente causado por "achei que estava no staging" é universal — todo entrevistador sênior tem cicatriz disso. Perguntas como "um erro que você cometeu" ou "como você opera em produção" são a deixa: citar o carimbo de alvo demonstra maturidade operacional que a maioria dos plenos não verbaliza.

> **P:** "Me conta um erro seu e o que você mudou por causa dele."
>
> **R (30s):** "Reportei um fix como testado — mas tinha rodado o teste na branch errada; o fix nem estava no código que testei. Foi pego em revisão antes de causar dano, mas me mostrou que 'verificado' sem dizer ONDE não é verificação. Desde então, toda conferência minha sai com carimbo de alvo: branch e hash, URL do ambiente, current_database na query, hard reload no front. É o padrão do incidente do GitLab em 2017 — a ação certa no servidor errado apagou produção. Verificar o resultado não basta; tem que provar o alvo."

## Checkpoint

- [ ] Sei citar os 4 falsos "verificado" com um exemplo concreto de cada
- [ ] Meu último report de fix saiu com branch@hash + ambiente explícitos
- [ ] Rodo `current_database()`/schema junto de queries de conferência importantes
- [ ] Faço hard reload antes de julgar qualquer mudança de front
- [ ] Antes de comando destrutivo, imprimo e LEIO o alvo (hostname/pwd/banco)

## Recursos

- Postmortem público do incidente de banco do GitLab (2017) — buscar "GitLab database incident postmortem"
- [git rev-parse — documentação](https://git-scm.com/docs/git-rev-parse)
- [Google SRE Book](https://sre.google/) — cultura de postmortem blameless
- Módulo `01-verificar-antes-de-afirmar.md` desta pasta — a dupla: prova mínima + alvo certo
