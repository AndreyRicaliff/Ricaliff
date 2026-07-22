# Syllabus — 3D na Web

> **Disciplina:** montar cena, luz e movimento em WebGL sem virar refém de mágica de tutorial.
> **Carga horária alvo: 45h** — aulas 3h · bibliografia 16h · labs 16h · projeto de conclusão 10h.
> Os módulos são a *aula* (mapa denso). A formação acontece na bibliografia + labs + projeto.

## Resultados de aprendizagem

Ao formar nesta disciplina você consegue, sem consultar:

1. Explicar o pipeline WebGL e o trio Scene/Camera/Renderer do three.js — e quando 3D é a ferramenta errada.
2. Construir uma cena iluminada com geometria e material físico (PBR), responsiva a resize, do zero.
3. Animar por loop e mapear estado 3D a scroll/UI, com rAF que pausa quando a aba oculta.
4. Diagnosticar gargalo de performance (draw calls, InstancedMesh, render-on-demand) por número, não por sensação.

## Aprofundamento por módulo (bibliografia obrigatória)

| Módulo | Leitura obrigatória | ~h |
|---|---|---|
| 01 mapa-do-3d | *Discover three.js* (discover.threejs.org, livro gratuito) — "Prerequisites" + "The Structure of a three.js Application"; MDN — "Getting started with WebGL" (visão geral do pipeline) | 1.5h |
| 02 three-fundamentos | three.js manual (threejs.org/manual) — "Fundamentals" + *Discover three.js* — "First Steps: Your First Scene" (Scene, Camera, Renderer, Mesh) | 2.5h |
| 03 css3d-sem-webgl | MDN — "Using CSS transforms" (perspective, `transform-style: preserve-3d`, backface) + three.js docs — `CSS3DRenderer` | 1.5h |
| 04 geometria-materiais | three.js manual — "Primitives" + "Materials"; *Discover three.js* — "Physically Based Rendering and Lighting" (parte de materiais/PBR) | 2h |
| 05 animacao-3d | three.js manual — "Animation System"; *Discover three.js* — "The Animation Loop" (delta time, clock) | 2h |
| 06 luz-e-atmosfera | three.js manual — "Lights" + "Fog"; *Discover three.js* — capítulo de iluminação (ambient + directional, sombras) | 2h |
| 07 performance-3d | three.js manual — "Rendering on Demand" + "Optimize Lots of Objects" (InstancedMesh); MDN — "WebGL best practices" | 2.5h |
| 08 3d-integrado-a-ui | three.js manual — "Responsive Design" + "Multiple Scenes / Canvas as Background"; *Three.js Journey* (Bruno Simon) — **curso de referência opcional (pago)** para scroll-based scenes | 2h |

Regra de leitura: **com o repositório aberto** — cada conceito que aparecer, procure onde ele existe (ou falta) nos decks 3D / estudio-imersivo. Leitura sem aplicação não conta hora.

## Labs (mini-apps isolados, do zero)

**Lab 1 — `first-scene` (5h):** cena three.js do zero — um mesh iluminado girando, canvas responsivo a resize, com render sob demanda (só redesenha quando há mudança).
*Pronto quando:* o mesh está iluminado e girando, o canvas redimensiona sem distorcer o aspect ratio, e o loop renderiza apenas em mudança (comprovado por contador de frames).

**Lab 2 — `instanced-field` (5h):** renderizar 5.000 objetos de duas formas — 5.000 `Mesh` separados vs. um `InstancedMesh` — e medir FPS e draw calls dos dois.
*Pronto quando:* as duas versões rodam, a diferença de FPS está documentada com números reais, e a contagem de draw calls (via `renderer.info`) prova o ganho.

**Lab 3 — `scroll-3d` (6h):** objeto 3D que reage ao progresso de scroll da página, integrado atrás de DOM transparente (padrão de 2 camadas).
*Pronto quando:* o estado do objeto mapeia ao progresso de scroll sem jank, e o rAF pausa quando a aba fica oculta (comprovado por log de frames em `document.hidden`).

## Videoteca (YouTube)

Complemento em vídeo por tema — **canal + o que buscar** (links mudam; canais ficam). Assistir É estudo quando feito com o repositório aberto; passivo no sofá não conta hora.

| Canal | Buscar por | Cobre |
|---|---|---|
| **Fireship** | "three.js in 100 seconds", "webgl" | visão-relâmpago dos módulos 01, 02 |
| **SimonDev** | "three.js tutorial", "shaders", "game engine three.js" | módulos 04, 05, 07 — three.js a fundo |
| **The Coding Train** | "webgl shaders", "perlin noise", "3d in p5" | módulo 01 — intuição do pipeline |
| **Sebastian Lague** | "coding adventure rendering", "compute shaders" | módulo 07 — profundidade de render (referência opcional) |

Ordem sugerida: vídeo-relâmpago (Fireship) ANTES da bibliografia pra ver a forma, three.js aplicado (SimonDev) DEPOIS do módulo, e Sebastian Lague só quando quiser entender o render por dentro. Vídeo nunca substitui o lab.

## Critério de formatura

- [ ] 8/8 módulos com checkpoint (recall aprovado na aba Revisar)
- [ ] Bibliografia obrigatória lida com nota de aplicação por item (onde isso existe/falta nos decks 3D / estudio-imersivo)
- [ ] 3 labs prontos (critério de cada um batido, repo público)
- [ ] Projeto de conclusão **aceito via /revisao** (rubrica 4/4)

*Bibliografia sem link direto: procurar pelo título — edições e URLs mudam, as obras não.*
