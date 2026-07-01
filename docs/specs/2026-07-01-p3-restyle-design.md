# P3 Restyle — Ricaliff Hub

**Data:** 2026-07-01
**Escopo:** Restyle visual do hub principal (`index.html` + `app.js`) para o estilo Persona 3 Reload.
**Abordagem:** A (refino + camada de animação) + toques do C (wallpaper sutil, tipografia inclinada, SFX opt-in).

## Objetivo

O app já é dark-first azul e gamificado (player/XP/quests). Levar ao "exato estilo P3": paleta P3, animações-assinatura (slide-in + stagger), wallpaper sutil, tipografia inclinada e SFX de menu opcional — **sem quebrar funcionalidade** (localStorage, views, gamificação) e mantendo single-file/vanilla.

## Paleta (retune das vars existentes, sem renomear)

| Var | Novo | Papel |
|---|---|---|
| `--bg` | `#05070F` | fundo void |
| `--surface` | `#0B1B33` | camada 1 |
| `--surface2` | `#12294D` | camada elevada |
| `--border` | `#1C3A5E` | borda |
| `--primary` | `#159CF3` | azul elétrico P3 |
| `--secondary` | `#33C6FF` | glow |
| `--cyan` | `#5DE0FF` | ciano frio |
| `--text` | `#EAF6FF` | texto |
| **`--p3-pink`** (novo) | `#FF3D7F` | magenta-assinatura: nav ativo, destaques |

`--accent` (verde sucesso), `--danger`, `--warn` mantidos.

## Wallpaper (sutil, CSS puro)

`body::before` fixo: gradiente navy + motivo geométrico "bars" P3 em baixa opacidade (~0.06) com leve deriva (animação lenta, 60s+). Cards ganham `backdrop-filter: blur` leve + fundo semitransparente → sensação de camadas. Zero dependência externa; nada de arte de personagem (atrapalha leitura).

## Animações (assinatura P3)

- **Troca de view:** ao ativar `.view`, entra com `translateX(24px→0) + opacity` em `cubic-bezier(0.16,1,0.3,1)` (OutExpo-like), ~350ms. Gancho JS adiciona classe `entering` no view alvo.
- **Stagger:** filhos diretos de listas/grids animam em cascata via `--i` (índice) → `transition-delay: calc(var(--i)*40ms)`, slide-up+fade (OutCubic). JS seta `--i` nos itens ao renderizar.
- **Interação:** hover com escala mola + glow ciano; nav ativo com barra `--p3-pink` deslizante.
- `@media (prefers-reduced-motion: reduce)` → desliga animações.

## Tipografia (toque C)

Títulos/números grandes (`.view-title`, `.player-level`, `.card-title`) em Inter 900 com `transform: skewX(-6deg)` sutil (look diagonal P3). Aplicado só em display, não em corpo.

## SFX (toque C, opt-in)

Módulo WebAudio sintetizado (sem arquivo) tocando um "blip" de menu ao trocar de view/hover-confirm. **Off por padrão**; toggle persistido em localStorage (`p3_sfx`) numa config existente. Respeita mute do SO.

## Arquivos tocados

- `index.html` — bloco `<style>`: paleta, wallpaper, animações, tipografia.
- `app.js` — gancho de `entering`/`--i` na troca de view e render de listas; módulo SFX + toggle.

## Critérios de aceite

1. App funciona igual (nenhuma view/feature quebrada; localStorage intacto).
2. Troca de tela com slide + stagger visível.
3. Paleta P3 aplicada em todo o hub.
4. Wallpaper sutil sem prejudicar legibilidade.
5. SFX togglável, off por padrão.
6. `prefers-reduced-motion` desliga animações.
7. Deploy segue por `git push` (single-file preservado).
