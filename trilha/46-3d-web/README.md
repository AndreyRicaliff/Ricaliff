# 46 — 3D na Web

Trilha de 3D no browser com foco no que a AG realmente entrega: decks de apresentação
(CSS3D e three.js), fundos animados de dashboard e a disciplina de performance que
separa "demo bonita" de "roda no notebook do cliente via RDP".

**Ordem:** 01 → 08. O 01 é o mapa (qual tecnologia usar e por quê); 02–06 constroem o
vocabulário three.js/CSS3D; 07 é performance (o módulo mais cobrado em entrevista);
08 fecha integrando 3D com UI real sem sacrificar usabilidade.

**Pré-requisitos:** JS moderno (trilha de fundamentos), `requestAnimationFrame`,
CSS transforms 2D, noção de eventos de pointer. Não precisa de matemática além de
seno/cosseno — onde entra álgebra linear, o módulo explica o mínimo operacional.

**Fio condutor:** decidir por trade-off explícito, medir antes de otimizar e provar
com evidência (FPS, draw calls, memória de GPU) antes de dizer "tá pronto".

**Casos reais usados:** deck esfera (CSS3D puro), deck imersiva (parallax por pointer),
o bug do `prefers-reduced-motion` forçado por RDP que congelou animação em produção.
