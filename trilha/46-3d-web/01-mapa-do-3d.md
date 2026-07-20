# 01 — Mapa do 3D na Web

## O que é

Existem quatro caminhos para renderizar "3D" no browser, e escolher errado custa semanas. **WebGL** (2011, baseado no OpenGL ES 2.0/3.0) é a API de GPU dominante: rasteriza triângulos via shaders GLSL, suporte ~98% dos browsers, e é o backend do three.js e do Babylon.js. **WebGPU** (2023, Chrome 113+; Firefox e Safari chegaram depois) é o sucessor: compute shaders, menos overhead de driver, WGSL em vez de GLSL — mas em 2026 ainda exige fallback WebGL porque o suporte não é universal (confira em caniuse). **CSS3D** (`transform: translate3d/rotateY` + `perspective`) não é uma API de 3D de verdade: é o compositor do browser aplicando matrizes 4×4 em elementos DOM. Sem malha, sem luz, sem z-buffer entre elementos irmãos com stacking context próprio — mas cada "objeto" é DOM real: acessível, selecionável, estilizável com Tailwind. **SVG** é 2D vetorial; "3D" em SVG é projeção calculada na mão — serve para diagramas isométricos, não para cena interativa.

O custo mental também difere: WebGL/three.js cobra vocabulário (cena, câmera, materiais, dispose manual de memória de GPU); CSS3D cobra quase nada além de transforms; WebGPU cobra tudo do WebGL mais conceitos de pipeline explícito.

---

### Árvore de decisão

1. **O conteúdo é texto/UI que o usuário lê ou clica?** → CSS3D. Texto em WebGL vira textura: borrado no zoom, invisível pra screen reader, fora do fluxo do DOM.
2. **Precisa de malha, iluminação, milhares de objetos, modelo glTF?** → three.js sobre WebGL (WebGPU só se você controla o ambiente do usuário — em produto de cliente, ainda não).
3. **É um diagrama estático com "cara" de 3D?** → SVG isométrico ou até PNG. Zero runtime.
4. **É fundo decorativo atrás de UI?** → three.js com orçamento agressivo (módulo 07) ou CSS3D — e sempre com degradação para 2D (módulo 08).

### Por que os decks AG usam CSS3D

Os decks de apresentação da AG (o deck esfera, o deck imersiva) são slides: texto grande, cards, navegação. Hipótese inicial era three.js; foi refutada por três fatos verificáveis: (a) o conteúdo é textual — em WebGL perderíamos seleção e nitidez; (b) o alvo roda em notebook de cliente e até via RDP, onde GPU real não existe e WebGL cai para SwiftShader (software, lento); (c) um arquivo HTML único sem build nem dependência é requisito de entrega (mandar por mensagem, abrir com dois cliques). CSS3D atende os três. O trade-off aceito: sem oclusão correta entre cards e sem iluminação — irrelevante para slides.

### Passo-a-passo: detecção de capacidade antes de escolher

Raciocínio sênior: não assuma o ambiente — meça nele. Cole isto no console do browser da máquina-alvo (foi assim que confirmamos o cenário RDP):

```js
const gl = document.createElement('canvas').getContext('webgl2');
const dbg = gl && gl.getExtension('WEBGL_debug_renderer_info');
console.log('webgl2:', !!gl,
  '| renderer:', dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/d',
  '| webgpu:', 'gpu' in navigator,
  '| reduced-motion:', matchMedia('(prefers-reduced-motion: reduce)').matches);
```

Se `renderer` contém "SwiftShader" ou "llvmpipe", é render por software: trate como "sem WebGL". E atenção ao último campo: em sessão RDP o Windows força `prefers-reduced-motion: reduce` — já congelou animação de deck nosso em produção. A lição não é "ignore o flag": é **verifique o que o flag significa naquele ambiente antes de gatear comportamento nele**.

---

## Por que cai em entrevista

"Por que você usou X e não Y" é a pergunta que separa quem copiou tutorial de quem decidiu por trade-off. 3D é onde essa pergunta fica óbvia: o candidato que responde "three.js porque é popular" perde para o que responde com restrições do ambiente, custo de acessibilidade e plano de fallback.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Você faria um site 3D com WebGPU hoje?"
>
> **R (30s):** "Depende de quem acessa. WebGPU é melhor tecnicamente — menos overhead, compute shaders — mas o suporte ainda não é universal, então em produto de cliente eu escrevo para WebGL e deixo WebGPU como backend opcional, que o three.js já abstrai. Num deck que fiz, fui além: o alvo rodava via RDP, sem GPU real, então nem WebGL — usei CSS3D puro, que o compositor do browser aguenta. Primeiro eu meço o ambiente, depois escolho a API."

---

## Checkpoint

- [ ] Sei explicar a diferença entre WebGL, WebGPU, CSS3D e SVG em uma frase cada
- [ ] Rodei o snippet de detecção em 2 máquinas diferentes e comparei os renderers
- [ ] Sei citar as 3 razões pelas quais os decks AG usam CSS3D e o trade-off aceito
- [ ] Sei dizer quando texto NÃO deve virar WebGL (nitidez, seleção, acessibilidade)
- [ ] Respondi a pergunta de entrevista em voz alta em menos de 30s

---

## Recursos

- [three.js — docs oficiais](https://threejs.org/docs/)
- [MDN — WebGL API](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)
- [MDN — perspective (CSS)](https://developer.mozilla.org/en-US/docs/Web/CSS/perspective)
- [caniuse — WebGPU](https://caniuse.com/webgpu) — conferir suporte atual antes de decidir
- WebGL Fundamentals / WebGPU Fundamentals (webglfundamentals.org) — teoria de base
