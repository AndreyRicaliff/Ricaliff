# Ricaliff — hub pessoal de dev & estudos

Dashboard gamificado que acompanha minha evolução como desenvolvedor: cada commit
nos meus projetos vira XP, nível, streak e atributos de RPG — automaticamente,
via git hook. Também é meu painel de projetos, tarefas, agenda e trilha de estudos.

**Ao vivo:** [ag-hub-tan.vercel.app](https://ag-hub-tan.vercel.app)

## Como funciona

```
commit em qualquer projeto rastreado
        │  (git hook post-commit global)
        ▼
ag-hub-sync.ps1  ── redige codinomes, calcula XP/nível/streak/atributos,
        │           regenera índices quando a trilha muda
        ▼
data/sync.json ── commit + push automático neste repo
        ▼
app.js (SPA vanilla, zero build) ── renderiza o hub
```

- **Zero build por decisão** ([DECISIONS.md](DECISIONS.md)): HTML + CSS + JS puro,
  sem framework, sem bundler. As duas únicas libs (marked, DOMPurify) são
  vendoradas em `assets/vendor/`.
- **Identidade visual própria** (design tokens P3 portados do meu rice de desktop
  QML→CSS — a identidade é uma tabela de tokens, não componentes).
- **Dados de clientes reais nunca aparecem aqui**: o pipeline de sync sanitiza
  identificadores na escrita (lista de redação + re-sanitização do arquivo inteiro
  a cada gravação) e o conteúdo usa codinomes (`cliente-varejo`, `cliente-oficina`).

## Estrutura

| Pasta | O quê |
|---|---|
| `index.html` + `app.js` + `seed.js` | O hub (SPA single-file, localStorage como storage) |
| `data/` | JSONs consumidos pelo app — `sync.json` (pipeline), índices gerados |
| `trilha/` | Trilha de estudos em markdown (15 trilhas · 99 módulos), fonte canônica |
| `bin/` | Geradores dos índices (`build-trilha.sh`, `build-quest-board.sh`) |
| `docs/` + `DECISIONS.md` | Specs e registro de decisões técnicas (ADRs) |
| `apps/` | Sub-apps arquivados (referência histórica, sem build no deploy) |

## Rodar local

Qualquer servidor estático serve:

```bash
npx serve .        # ou python -m http.server
```

## Decisões técnicas

Todas as decisões não-triviais estão registradas em [DECISIONS.md](DECISIONS.md)
no formato ADR-leve — problema, opções, decisão, trade-off e consequências.
