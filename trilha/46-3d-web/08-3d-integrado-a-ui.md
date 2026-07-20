# 08 — 3D Integrado à UI

## O que é

3D em produto de verdade quase nunca é "a aplicação é 3D" — é 3D **a serviço** de uma UI: fundo vivo atrás de um dashboard, hero de landing, deck de apresentação. Isso muda as regras do jogo em quatro frentes:

**Hierarquia de atenção.** O 3D é camada decorativa: baixo contraste, movimento lento (ciclos de 10s+, nunca pulsos rápidos), e **nenhuma informação exclusiva nele** — se um dado só existe no 3D, usuário de leitor de tela ou de máquina fraca não o recebe. Regra prática dos fundos AG: o canvas vive atrás com `position: fixed; inset: 0; z-index: -1; pointer-events: none`, e a UI mantém contraste AA por conta própria (scrim/gradiente sobre o canvas se preciso — verificado com medidor de contraste, não no olho).

**Híbrido CSS3DRenderer + WebGL.** O padrão pro melhor dos dois mundos: cena WebGL pra atmosfera (partículas, luz, fog) e `CSS3DRenderer` pra conteúdo — cards DOM reais (com Tailwind, foco de teclado, texto selecionável) posicionados pela **mesma câmera**. Dois renderers, duas árvores, um `camera` compartilhado: `webgl.render(scene, camera)` e `css3d.render(sceneCss, camera)` no mesmo loop, com o DOM do CSS3D sobreposto ao canvas via CSS. É a arquitetura natural de um deck com fundo rico: o slide continua sendo HTML.

**Raycasting** é como clique encontra objeto 3D — não há `onClick` em mesh. `Raycaster.setFromCamera(pointerNDC, camera)` lança um raio e `intersectObjects` devolve os atingidos, ordenados por distância. O detalhe que sempre esquece: converter pixel pra NDC (−1..1) usando o **rect do canvas**, não `innerWidth`, senão o clique erra quando o canvas não ocupa a tela toda. Objetos CSS3D não precisam disso — são DOM, `click` normal.

**Degradação.** WebGL pode não existir (blocklist de driver, render por software via RDP, WebView antiga) ou morrer em runtime (`webglcontextlost`). Produto sênior decide **antes** o que acontece: fundo estático (gradiente/imagem), versão CSS3D, ou nada — e a UI funciona igual nos três casos, porque o 3D nunca foi portador de informação.

---

### Passo-a-passo: fundo 3D degradável (padrão dos dashboards AG)

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

Teste de aceitação honesto (evidência, não fé): forçar o caminho ruim — desabilitar aceleração de hardware no browser e recarregar. O dashboard tem que ficar 100% utilizável com o gradiente. Se algo sumiu, o 3D estava carregando informação — erro de arquitetura, volta pro desenho.

---

## Por que cai em entrevista

Integrar 3D com UI é onde entram as perguntas de arquitetura de front que valem pra tudo: progressive enhancement, code-splitting, acessibilidade, eventos. O candidato que diz "e se não tiver WebGL, cai num gradiente e nada de informação se perde" respondeu três perguntas antes de serem feitas.

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "Como você poria uma cena 3D atrás de um dashboard sem prejudicar a UX?"
>
> **R (30s):** "Três regras. Primeiro: o 3D é decorativo por contrato — nenhuma informação existe só nele, então a degradação pra um gradiente estático não perde nada; eu detecto WebGL antes de importar o three, com import dinâmico, e trato render por software como 'sem GPU', porque já vi cliente rodando via RDP. Segundo: orçamento — pixel ratio capado, sem sombras, draw calls medidos, porque o frame é dividido com a UI. Terceiro: contraste e foco — canvas com pointer-events none atrás de tudo, e a legibilidade da UI garantida por scrim, medida, não estimada."

---

## Checkpoint

- [ ] Implementei o fundo degradável e testei o caminho sem WebGL de verdade (aceleração off)
- [ ] Sei explicar a arquitetura híbrida WebGL + CSS3DRenderer com câmera compartilhada
- [ ] Implementei raycasting de clique e sei por que o NDC usa o rect do canvas
- [ ] O three só entra no bundle via import dinâmico e eu verifiquei isso no build
- [ ] Sei enunciar o contrato "3D nunca carrega informação exclusiva" e o que ele compra

---

## Recursos

- [three.js — Raycaster](https://threejs.org/docs/#api/en/core/Raycaster)
- [three.js — CSS3DRenderer](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer)
- [MDN — webglcontextlost](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/webglcontextlost_event)
- [react-three-fiber — docs](https://docs.pmnd.rs/react-three-fiber) — o mesmo modelo, declarativo em React
- [MDN — import() dinâmico](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
