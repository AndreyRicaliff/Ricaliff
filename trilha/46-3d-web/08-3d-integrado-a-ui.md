# 08 — 3D Integrado à UI

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

3D em produto de verdade quase nunca é "a aplicação é 3D" — é 3D **a serviço** de uma UI: fundo vivo atrás de um dashboard, hero de landing, deck de apresentação, o *void* animado da home do hub. Isso muda as regras: o 3D vira camada decorativa que **nunca carrega informação exclusiva**, tem que degradar pra 2D quando a GPU falta, e precisa saber traduzir clique em objeto. Este módulo fecha a trilha amarrando 3D a arquitetura de front — progressive enhancement, ray casting e o híbrido DOM+WebGL — sem sacrificar usabilidade.

---

## § BASE — o fundamento

**Progressive enhancement — o contrato que torna a degradação possível (Champeon 2003).** O termo é de Steve Champeon (SXSW, 2003, "Inclusive Web Design for the Future"): construa da base sólida (conteúdo/HTML que funciona em tudo) pra cima, adicionando camadas que *enriquecem* mas nunca são *requisito*. Aplicado a 3D: o 3D é a camada de topo, **decorativa por contrato** — se um dado só existe nele, o usuário de leitor de tela ou de máquina fraca não o recebe, e isso é bug de arquitetura. A consequência libertadora: se nada de informação vive no 3D, a **degradação** (gradiente estático quando não há WebGL) não perde nada, e você pode decidi-la com tranquilidade.

**Raycasting — como clique encontra objeto 3D (Appel 1968, Roth 1982).** Não existe `onClick` em mesh: a cena é rasterizada em pixels, a identidade dos objetos se perde. Pra saber o que foi clicado, você lança um **raio** da câmera pelo pixel e testa interseção com a geometria — a técnica que Arthur Appel introduziu em 1968 ("Some Techniques for Shading Machine Renderings of Solids") e que Scott Roth nomeou e formalizou em "Ray Casting for Modeling Solids" (1982). No three: `Raycaster.setFromCamera(pointerNDC, camera)` constrói o raio, `intersectObjects` devolve os atingidos ordenados por distância. O passo que amarra tudo ao módulo 02: o ponto do clique vem em **pixels**, mas o raio precisa dele em **NDC** (Normalized Device Coordinates, −1 a 1) — que é o resultado da divisão perspectiva. Converter é aplicar a transformação inversa (unproject), e o detalhe que sempre esquece: use o **rect do canvas**, não `innerWidth`, senão o clique erra quando o canvas não ocupa a tela toda. Objetos CSS3D não precisam disso — são DOM, `click` normal.

**Híbrido CSS3DRenderer + WebGL — o melhor dos dois mundos.** A cena WebGL cuida da atmosfera (partículas, luz, fog — módulos 04/06); o `CSS3DRenderer` (módulo 03) posiciona **conteúdo DOM real** (cards com Tailwind, foco de teclado, texto selecionável) usando a **mesma câmera** (a mesma matriz V·P do módulo 02). Dois renderers, duas árvores, um `camera` compartilhado: `webgl.render(scene, camera)` e `css3d.render(sceneCss, camera)` no mesmo loop, com o DOM sobreposto ao canvas. É a arquitetura natural de um deck com fundo rico — o slide continua sendo HTML.

**Degradação em runtime, não só na detecção.** WebGL pode faltar na entrada (blocklist, software render via RDP — módulo 01) **ou morrer em execução**: o evento `webglcontextlost` dispara quando o driver reseta o contexto (GPU sob pressão, aba em background por muito tempo). Produto sênior decide **antes** o que acontece nos dois casos — fundo estático, versão CSS3D, ou nada — e a UI funciona igual, porque o 3D nunca foi portador de informação. A cicatriz do módulo 05 (rAF pausa em aba oculta; RDP força reduced-motion) mora aqui também: a decisão de degradação inclui "o que a cena faz quando a aba está oculta".

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A arquitetura se organiza em **camadas de robustez decrescente**, e a regra é que remover qualquer camada de cima **não** quebra as de baixo:

```
  ┌─ 3D rico (WebGL: partículas, luz, fog)   ← enriquece; pode sumir
  ├─ conteúdo 3D (CSS3DRenderer: cards DOM)   ← ou vira layout 2D normal
  ├─ interação (raycaster / click DOM)        ← 3D usa raio; DOM usa click nativo
  └─ UI base (HTML + dados, contraste AA)     ← SEMPRE funciona, sozinha
     ▲ nenhuma informação existe só acima desta linha
```

Três consequências estruturais:
1. **Detecção antes do import.** Detecte WebGL **antes** de importar o three, com import dinâmico — o three (grande) só entra no bundle de quem aguenta rodá-lo. Caminho ruim = zero custo de download.
2. **O canvas é fundo passivo.** `position: fixed; inset: 0; z-index: -1; pointer-events: none` — atrás de tudo, sem capturar evento, e a UI garante contraste AA por conta própria (scrim/gradiente sobre o canvas se preciso, **medido** com medidor de contraste, não no olho).
3. **Interação segue a camada.** Objeto WebGL → raycaster (NDC pelo rect). Card CSS3D → `click` de DOM. Não misture.

---

## § METODOLOGIA — o passo-a-passo replicável

**Integrar 3D numa UI sem prejudicar a UX:**

**1. Defina o contrato de informação.** Liste o que o 3D mostra; se qualquer item é exclusivo, mova pra UI base. Sem isso, a degradação mente.

**2. Detecte capacidade e faça import dinâmico.** `temWebGL()` (software render conta como "sem GPU") → `lazy(() => import('./Cena3D'))`. Fallback primeiro.

**3. Ponha o canvas como fundo passivo.** `fixed inset-0 -z-10 pointer-events-none` e garanta o contraste da UI por scrim medido.

**4. Roteie interação pela camada.** Raycaster com NDC pelo rect do canvas pra WebGL; `click` nativo pra CSS3D.

**5. Teste o caminho ruim de verdade.** Desabilite aceleração de hardware, recarregue: a UI tem que ficar 100% utilizável no gradiente.

**Anti-padrões:**
- **Informação exclusiva no 3D:** quebra a degradação e a acessibilidade. O pecado de origem.
- **NDC por `innerWidth`:** clique erra quando o canvas não é tela cheia. Use o rect.
- **Importar three sempre:** infla o bundle de quem nem vai rodar 3D. Import dinâmico atrás da detecção.
- **Canvas sem `pointer-events: none`:** rouba clique da UI. Fundo é passivo.
- **Testar só o caminho feliz:** "funciona na minha máquina com GPU" não prova a degradação. Force o caminho ruim.

---

## Passo-a-passo aplicado (faça agora, ~45min)

```js
// capacidade.js — detectar ANTES de importar three (economiza o bundle no caminho ruim)
export function temWebGL() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return false;
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const r = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
    return !/swiftshader|llvmpipe|software/i.test(r); // software render = trata como sem GPU
  } catch { return false; }
}
```

```jsx
// Fundo3D.jsx — React: import dinâmico, fallback primeiro
export function Fundo3D() {
  const [ok, setOk] = useState(null);
  useEffect(() => { setOk(temWebGL()); }, []);
  if (!ok) return <div className="fixed inset-0 -z-10 bg-gradient-to-b from-[#08080f] to-[#1a1033]" />;
  const Cena = lazy(() => import('./Cena3D')); // three só entra no bundle de quem aguenta
  return <Suspense fallback={null}><Cena /></Suspense>;
}
```

```js
// Dentro da cena: clique em objeto via raycaster (NDC pelo rect do canvas!)
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
canvas.addEventListener('click', (e) => {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1,
          -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(clicaveis, true)[0];
  if (hit) abrirDetalhe(hit.object.userData.id);
});
```

Teste de aceitação honesto (evidência, não fé): forçar o caminho ruim — desabilitar aceleração de hardware no browser e recarregar. O dashboard tem que ficar 100% utilizável com o gradiente. Se algo sumiu, o 3D estava carregando informação — erro de arquitetura, volta pro desenho. Verifique também, no build, que o chunk do three só é baixado no caminho com WebGL (aba Network / análise de bundle).

---

## Por que cai em entrevista

Integrar 3D com UI é onde entram as perguntas de arquitetura de front que valem pra tudo: progressive enhancement, code-splitting, acessibilidade, eventos. O candidato que diz "e se não tiver WebGL, cai num gradiente e nada de informação se perde" respondeu três perguntas antes de serem feitas. E saber que raycasting resolve o "clique em objeto" — e por que o NDC usa o rect — mostra que você entende a matemática de câmera (módulo 02) de trás pra frente.

> **P:** "Como você poria uma cena 3D atrás de um dashboard sem prejudicar a UX?"
>
> **R (30s):** "Três regras. Primeiro: o 3D é decorativo por contrato — nenhuma informação existe só nele, então a degradação pra um gradiente estático não perde nada; eu detecto WebGL antes de importar o three, com import dinâmico, e trato render por software como 'sem GPU', porque já vi cliente rodando via RDP. Segundo: orçamento — pixel ratio capado, sem sombras, draw calls medidos, porque o frame é dividido com a UI. Terceiro: contraste e foco — canvas com pointer-events none atrás de tudo, e a legibilidade da UI garantida por scrim, medida, não estimada."

> **P:** "Não existe `onClick` num mesh. Como você detecta clique num objeto 3D?"
>
> **R (30s):** "Com raycasting, que é a técnica clássica de lançar um raio da câmera pela posição do cursor e testar interseção com a geometria — o `Raycaster` do three faz isso. O pulo do gato é a conversão de coordenada: o clique vem em pixels, mas o raio precisa do ponto em NDC, de −1 a 1, e eu calculo isso com o `getBoundingClientRect` do canvas, não com `innerWidth` — senão erra quando o canvas não é tela cheia, que é o caso de um fundo atrás de UI. O `intersectObjects` me devolve os alvos ordenados por distância, e eu pego o primeiro. Se fosse conteúdo CSS3D em vez de WebGL, nem precisaria disso: é DOM, o click nativo já funciona."

---

## Checkpoint

- [ ] Sei enunciar o contrato "3D nunca carrega informação exclusiva" e o que ele compra
- [ ] Implementei o fundo degradável e testei o caminho sem WebGL de verdade (aceleração off)
- [ ] Sei explicar a arquitetura híbrida WebGL + CSS3DRenderer com câmera compartilhada
- [ ] Implementei raycasting de clique e sei por que o NDC usa o rect do canvas (módulo 02)
- [ ] O three só entra no bundle via import dinâmico e eu verifiquei isso no build
- [ ] Sei o que fazer no `webglcontextlost` e por que decido a degradação antes, não depois

---

## Recursos

- "Inclusive Web Design for the Future" — Steve Champeon, SXSW (2003): a origem do progressive enhancement
- "Ray Casting for Modeling Solids" — Scott Roth (1982), e "Some Techniques for Shading Machine Renderings of Solids" — Arthur Appel (1968): a fundação do raycasting
- three.js — docs, `Raycaster` e `CSS3DRenderer`: o clique em objeto e o híbrido DOM+WebGL
- three.js — manual, "Responsive Design" e "Canvas as Background / Multiple Scenes": o canvas como fundo de UI
- MDN — evento `webglcontextlost` e operador `import()` dinâmico: a degradação em runtime e o code-splitting
- react-three-fiber (docs.pmnd.rs): o mesmo modelo, declarativo em React, quando o projeto já é React
