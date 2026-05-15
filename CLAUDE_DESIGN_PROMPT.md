# Prompt — AG Hub Design (para Claude Design / claude.ai)

> Leve este arquivo + o `index.html` para o Claude Design.
> O HTML já está estruturado e o JS já funciona. Sua tarefa é gerar o CSS completo.

---

## Contexto

**AG Hub** é uma ferramenta pessoal de gestão de projetos, tarefas e agenda para um desenvolvedor solo que trabalha em produção com múltiplos clientes. É séria, usada diariamente. Não é um pet project.

O app é single-file HTML com JS puro e localStorage. Não tem framework. O CSS fica dentro de `<style>` no `<head>`. O HTML já existe — você só gera o bloco `<style>`.

---

## Paleta de cores

Inspiração: Satoru Gojo (tratada como referência de design, não como tema decorativo).

| Role | Hex | Referência visual |
|---|---|---|
| `--bg` | `#050C1A` | Void — escuridão profunda |
| `--surface` | `#0A1428` | Camada primária |
| `--surface2` | `#102038` | Camada elevada |
| `--surface3` | `#162C50` | Componentes interativos |
| `--border` | `#1A3468` | Bordas sutis azul-marinho |
| `--primary` | `#1A7FFF` | Azul elétrico — Six Eyes |
| `--secondary` | `#4DA8FF` | Glow do primary |
| `--tertiary` | `#8FC8FF` | Branco de gelo |
| `--accent` | `#08C16A` | Verde — estados de sucesso |
| `--danger` | `#FF5C5C` | Vermelho — erro / urgente |
| `--warn` | `#FFBC7D` | Amarelo — atenção |
| `--cyan` | `#00D4FF` | Azul elétrico frio |
| `--text` | `#EEF5FF` | Branco de gelo — texto principal |
| `--muted` | `#5C82B8` | Azul desbotado — texto secundário |
| `--muted2` | `#8AAED4` | Azul claro — terceiro nível |

**Dark-first.** Sem light mode. Font: Inter (já carregada via Google Fonts).

---

## Classes HTML que precisam de estilo

### Layout base
- `body` — fundo `--bg`, Inter, flex row
- `.sidebar` — 240px fixed left, altura 100vh, fundo `--surface`, borda direita
- `.main` — margin-left 240px, flex 1
- `.view` — display none + padding 32px 36px + max-width 1060px
- `.view.active` — display block

### Sidebar
- `.sb-brand` — logo + nome, padding 20px 16px, borda inferior
- `.sb-mark` — 30×30px, border-radius 8px, gradiente `--primary → --secondary`, AG em branco negrito
- `.sb-name` — 0.88rem, bold
- `.sb-sub` — 0.58rem, `--muted`
- `.sb-nav` — flex column, gap 2px, padding 12px 8px, flex 1
- `.nav-item` — botão full-width, flex row, gap 10px, padding 9px 10px, border-radius 9px, `--muted2`, sem borda
- `.nav-item:hover` — fundo `--surface2`
- `.nav-item.active` — fundo rgba do primary a 18%, texto `--secondary`, bold
- `.nav-sep` — linha 1px `--border`
- `.sb-footer` — padding 12px 8px, borda superior, data + botões backup/restaurar
- `.sb-date` — 0.68rem, `--muted`

### Componentes globais
- `.view-header` — flex, space-between, margin-bottom 28px
- `.view-title` — 1.5rem, 800, letter-spacing -.02em
- `.view-sub` — 0.8rem, `--muted`, margin-top 3px

#### Botões
- `.btn` — inline-flex, align-items center, gap 6px, padding 8px 16px, border-radius 9px, 0.8rem, 600, sem borda
- `.btn-primary` — fundo `--primary`, branco, glow sutil com box-shadow
- `.btn-primary:hover` — fundo `--secondary`, translateY(-1px)
- `.btn-ghost` — fundo rgba branco 5%, `--muted2`, borda 1px `--border`
- `.btn-ghost:hover` — `--text`, rgba branco 9%
- `.btn-sm` — padding 5px 12px, 0.75rem

### Dashboard
- `.dash-hero` — card gradiente azul-escuro com glow no canto, border-radius 16px, padding 28px 32px, borda 1px rgba primary
- `.dash-greeting` — 1.5rem, 800
- `.dash-greeting span` — gradiente text: `--tertiary → --cyan`
- `.dash-sub` — 0.85rem, `--muted2`
- `.dash-quick-stats` — flex row, gap 24px, margin-top 20px
- `.qs-val` — 1.6rem, 900
- `.qs-lbl` — 0.68rem, `--muted`
- `.dash-grid` — grid 3 colunas (1fr 1fr 1.2fr), gap 16px
- `.focus-card`, `.rings-card`, `.today-card` — cards com fundo `--surface`, borda `--border`, border-radius 14px, padding 20px
- `.card-title` — 0.72rem, 700, `--muted`, uppercase, letter-spacing .08em, flex com ícone
- `.focus-item` — flex row, padding 9px 0, borda inferior `--border`, cursor pointer
- `.fcheck` — círculo 16px, borda `--border`; `.fcheck.done` — fundo `--accent`
- `.focus-text.done-text` — riscado, `--muted`
- `.ring-row` — flex, align-items center, gap 12px, padding 7px 0
- `.ring-name` — 0.82rem, 600
- `.ring-tasks` — 0.68rem, `--muted`
- `.today-ev` — flex, gap 10px, padding 8px 0, borda inferior
- `.ev-dot` — círculo 8px, cor dinâmica por tipo
- `.ev-time-badge` — 0.68rem, bold, `--muted`

### Projetos
- `.proj-grid` — grid auto-fill, min 280px, gap 16px
- `.proj-card` — fundo `--surface`, borda `--border`, border-radius 14px, overflow hidden; hover: border primary, translateY(-3px), box-shadow
- `.proj-cover` — 80px, flex end, padding 12px 16px, posição relativa
- `.proj-cover-blur` — absolute inset 0, imagem de fundo colorida blur, opacity 12%
- `.proj-status-badge` — absolute top-right, pill colorido por status
- `.psb-ativo` — verde; `.psb-pausado` — amarelo; `.psb-concluido` — muted
- `.proj-body` — padding 14px 16px 16px
- `.proj-name` — 0.95rem, 700
- `.proj-desc` — 0.75rem, `--muted`, 2-line clamp
- `.proj-footer` — flex space-between
- `.prog-bar-thin` — 3px, fundo `--surface2`, border-radius 2px
- `.prog-fill-thin` — fill animado
- `.proj-github` — link pill com ícone GitHub, borda, hover primary

### Tarefas
- `.task-stats-row` — grid 4 colunas, gap 10px
- `.tstat` — fundo `--surface`, borda `--border`, border-radius 10px, padding 12px 14px, **borda superior 3px com cor do status**
- `.tstat-val` — 1.5rem, 800
- `.tstat-lbl` — 0.68rem, `--muted`
- `.task-toolbar` — flex, gap 8px
- `.search-wrap` — input com ícone de busca integrado
- `.search-wrap input` — fundo `--surface`, borda `--border`, padding com ícone à esquerda; focus: borda primary
- `.filter-row` — flex wrap, gap 5px
- `.fbtn` — pill, borda `--border`, `--muted`; `.fbtn.active` — fundo primary, branco
- `.task-list` — flex column, gap 6px
- `.task-row` — fundo `--surface`, borda `--border`, border-radius 10px, padding 12px 14px; hover: borda primary sutil, fundo `--surface2`
- `.task-row.done-row` — opacity 0.45
- `.tcheck` — círculo 17px; `.tcheck.checked` — fundo `--accent`
- `.ttitle` — 0.86rem, 600
- `.done-row .ttitle` — riscado, `--muted`
- `.tag` — pill colorido: `.tg-high` vermelho, `.tg-medium` amarelo, `.tg-low` verde, `.tg-proj` primary
- `.tact` — opacity 0; `.task-row:hover .tact` — opacity 1

### Agenda
- `.cal-layout` — grid (1fr 270px), gap 18px
- `.cal-wrap` — fundo `--surface`, borda, border-radius 14px
- `.cal-nav` — flex, padding 16px 18px, borda inferior
- `.cal-nav-btn` — 26×26px, border-radius 7px, fundo `--surface2`; hover: fundo primary
- `.cal-wdays` — grid 7 cols, fundo `--surface2`
- `.cal-wday` — 0.63rem, 700, `--muted`, uppercase
- `.cal-days` — grid 7 cols
- `.cal-day` — min-height 72px, padding 6px, borda direita e inferior `--border`; hover: rgba primary
- `.cal-day.today .cal-day-num` — círculo fundo primary, branco
- `.cal-day.other` — opacity 0.28
- `.cal-ev-chip` — pill 16px, 0.58rem, 600
- `.cal-sidebar`, `.cal-box` — cards lateral com lista de eventos
- `.cal-ev-row` — flex row com hora e título
- Cores por tipo: reunião=primary, prazo=danger, lembrete=warn, pessoal=accent

### Crescimento
- `.growth-grid` — grid (1.1fr 1fr), gap 20px
- `.section-label` — 0.7rem, 700, `--muted`, uppercase, letter-spacing .09em
- `.session-card` — fundo `--surface`, borda, border-radius 10px, padding 13px 15px; hover: borda primary, fundo `--surface2`
- `.session-badge` — pill por tipo: feature=primary, bugfix=danger, refactor=cyan, deploy=warn, design=pink, planning=muted
- `.domain-row` — fundo `--surface`, borda, border-radius 10px, padding 12px 14px
- `.domain-level` — pill: iniciando=muted, desenvolvendo=warn, avancado=accent, dominando=primary
- `.domain-bar` — 4px, fundo `--surface2`; `.domain-fill` — animado
- `.suggestion-card` — fundo `--surface2`, borda, border-radius 10px, padding 12px 14px

### Modais
- `.overlay` — fixed inset 0, rgba(0,0,0,.75), blur(5px), z-index 200, flex center; animação opacity
- `.modal` — fundo `--surface`, borda, border-radius 16px, padding 24px, max-width 450px; animação translateY
- `.mhead` — flex space-between, margin-bottom 18px
- `.mclose` — 26×26px, border-radius 7px, fundo `--surface2`; hover: primary
- `.fg`, `.fl`, `.fi`, `.fs`, `.fta` — form group/label/input/select/textarea
- Inputs: fundo rgba(255,255,255,.04), borda `--border`; focus: borda primary
- `.colpick` — flex wrap, gap 7px; `.col` — 21px círculo; `.col.sel` — borda branca, scale 1.25
- `.fact` — flex end, gap 8px

### Focus Project (Dashboard)
- `#focus-proj-section` — div antes do dash-grid, preenchido via JS
- `.focus-proj-bar` — flex row, align-items center, gap 10px, fundo `--surface`, borda, border-radius 12px, padding 10px 14px; abaixo dele vem `.focus-task-list`
- `.focus-label` — "FOCO" em uppercase, 0.68rem, bold, `--muted`
- `.focus-btns` — flex wrap, gap 6px
- `.fpb-btn` — pill, 0.72rem, 600, borda `--border`, `--muted2`; `.fpb-active` — borda e cor dinâmica via `style=` inline (JS injeta cor do projeto)
- `.fpb-dot` — 6×6px círculo colorido dentro do pill
- `.focus-task-list` — lista de tasks, padding 4px 0; usa `.focus-item`, `.fcheck`, `.focus-text`, `.focus-meta` já definidos acima

### Weekly Digest (Dashboard)
- `#weekly-digest` — div após dash-grid
- `.weekly-digest-card` — fundo `--surface`, borda, border-radius 12px, padding 16px 20px
- `.weekly-row` — flex row, gap 28px, margin-top 10px, flex-wrap
- `.wstat` — flex column; `.wstat-val` — 1.4rem, 900; `.wstat-lbl` — 0.63rem, `--muted`

### Study Tracker (Crescimento)
- `#study-stats` — preenchido via JS antes de `#studies-list`
- `.study-stats-row` — flex row, gap 16px, flex-wrap, fundo `--surface`, borda, border-radius 10px, padding 12px 16px
- `.study-stat` — flex column; `.ss-val` — 1.3rem, 900; `.ss-lbl` — 0.63rem, `--muted`
- `.study-card` — fundo `--surface`, borda, border-radius 10px, padding 11px 14px, margin-bottom 7px; hover: borda primary, fundo `--surface2`
- `.study-head` — flex, space-between, gap 8px, margin-bottom 4px
- `.study-topic` — 0.83rem, 600, overflow ellipsis (1 linha)
- `.study-badge` — pill 0.61rem, bold; fundo rgba primary 15%, cor `--secondary`
- `.study-meta` — flex, gap 10px, 0.67rem, `--muted`, flex-wrap

### Project Improvements
- `.proj-improvements` — 0.65rem, cor `--warn`, bold, margin-bottom 8px (aparece no proj-body quando projeto tem melhorias)

### Agenda — melhorias
- `.cal-day.sel` — fundo rgba primary 10%, outline 2px primary
- `.cal-overflow` — "+N mais" em 0.56rem, bold, `--secondary`
- `.cal-task-chip` — variante de `.cal-ev-chip`; fundo rgba accent 15%, cor `--accent`
- `.day-panel-head` — flex, space-between, margin-bottom 6px
- `.day-panel-title` — 0.78rem, bold, capitalize
- `.day-panel-close` — botão ×, sem estilo, `--muted`; hover: `--text`
- `.day-panel-counts` — flex, gap 12px, 0.63rem, `--muted`, margin-bottom 10px

### Utilitários
- `.toast` — fixed bottom-right, fundo `--surface2`, borda, border-radius 10px; `.toast.ok` — borda-left accent; `.toast.err` — borda-left danger
- `.empty` — estado vazio centralizado
- Media queries: abaixo de 900px sidebar colapsa, grid vira 1 col

---

## O que gerar

Retorne apenas o bloco `<style>` completo, sem comentários desnecessários, sem fallbacks para light mode. O CSS deve ser funcional standalone — qualquer classe mencionada acima deve estar estilizada.

Variáveis CSS ficam em `:root`. Use-as consistentemente — sem hex hardcoded fora de `:root`.
