# 04 — Geometria e Materiais

> **Formato expandido (v2):** este módulo tem §Base (o fundamento), §Estruturação (como o
> conhecimento se organiza) e §Metodologia (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão do módulo `00-metodologia-da-ia`.

## O que é

Geometria é *o que* aparece; material é *como* a superfície reage à luz. O material moderno — **PBR (Physically Based Rendering)** — não é "cor + brilho" no chute: é meio século de modelos de reflexão, cada um resolvendo o defeito do anterior, até chegar nos dois parâmetros (`metalness`, `roughness`) que o `MeshStandardMaterial` expõe. Este módulo dá a linhagem científica desses modelos — porque saber *por que* metalness/roughness venceu specular/gloss é o que separa quem ajusta slider de quem entende o que a GPU calcula no fragment shader (módulo 01).

---

## § BASE — o fundamento

**Geometria: `BufferGeometry` e o que a luz usa.** Toda geometria no three moderno é `BufferGeometry` — arrays tipados (`Float32Array`) que vão direto pra GPU como *vertex buffers*. Atributos padrão: `position` (3 floats), `normal` (3 floats — a direção da superfície, **é o que os modelos de luz abaixo consomem**), `uv` (2 floats, 0–1, coordenada de textura) e opcionalmente `index`, que reusa vértices (cubo indexado: 24 vértices em vez de 36). `SphereGeometry(1, 64, 64)` ≈ 8k triângulos; `(1, 16, 16)` ≈ 500 — resolução alta atrás de blur é VRAM jogada fora.

**A linhagem dos modelos de reflexão — cada um conserta o anterior:**

1. **Lambert (1760).** Johann Heinrich Lambert, em *Photometria*, formalizou a **lei do cosseno**: a intensidade difusa numa superfície fosca é proporcional a `max(0, N·L)` — o cosseno do ângulo entre a normal `N` e a direção da luz `L`. É por isso que uma esfera tem gradiente do claro ao escuro. Puro Lambert = superfície totalmente fosca, sem brilho especular. `MeshLambertMaterial` é isto.

2. **Phong (1975).** Bui Tuong Phong, "Illumination for Computer Generated Pictures" (CACM), acrescentou o **realce especular**: `(R·V)^n`, onde `R` é a luz refletida, `V` a direção do olho, e `n` o "shininess". Nasce o brilho pontual do plástico. Custo: calcular `R` por fragmento.

3. **Blinn-Phong (1977).** James Blinn, "Models of Light Reflection…" (SIGGRAPH), trocou `R·V` pelo **vetor médio (halfway)** `H = normalize(L + V)` e usou `(N·H)^n` — mais barato e mais fiel a ângulos rasantes. Foi o padrão de tempo real por 30 anos e ainda é o default de muita engine leve.

4. **Cook-Torrance (1982).** Robert Cook e Kenneth Torrance, "A Reflectance Model for Computer Graphics" (ACM ToG), trouxeram a **microfacet theory**: a superfície é um mar de micro-espelhos, e o brilho sai de três termos físicos — **D** (distribuição das microfacetas, a rugosidade), **G** (auto-sombreamento entre elas) e **F** (Fresnel: reflexão sobe nos ângulos rasantes). É a base física de tudo que veio depois; Phong/Blinn eram aproximações empíricas, Cook-Torrance é derivado da ótica.

5. **Disney "Principled" (Burley, 2012).** Brent Burley, "Physically-Based Shading at Disney" (SIGGRAPH Courses), fez a virada de **usabilidade**: em vez de expor os termos físicos crus (que só um TD entende), reduziu tudo a poucos parâmetros **intuitivos e artista-friendly**, sendo `roughness` e a lógica metal/dielétrico os centrais. Brian Karis adaptou para tempo real em "Real Shading in Unreal Engine 4" (SIGGRAPH 2013), e a spec **glTF** (Khronos) canonizou o *metallic-roughness workflow* — que é o que o `MeshStandardMaterial` implementa.

**Por que metalness/roughness venceu specular/gloss.** No modelo antigo (specular/gloss) você pintava *à mão* a cor especular — e era fácil criar materiais **fisicamente impossíveis** (um dielétrico com especular colorido forte, um metal escuro sem reflexo), que quebram sob luzes diferentes. O metallic-roughness codifica a **física real**: dielétricos (plástico, madeira, pele) têm reflexo especular quase branco e fixo (~4%); metais não têm cor difusa e tingem o *reflexo* com a cor base. Reduzir a dois parâmetros com significado físico **fecha a porta pro impossível** — o material fica coerente sob qualquer iluminação (módulo 06). Daí os dois dials do `MeshStandardMaterial`:
- **`metalness`** (0–1): quase binário — 0 pra dielétrico, 1 pra metal. Intermediário só em transição enferrujada.
- **`roughness`** (0–1): a microrrugosidade de Cook-Torrance. 0 = espelho, 1 = fosco. É o dial que você mais mexe.

**A regra que economiza horas: metal sem environment map parece carvão.** Metal não tem componente difuso — ele é *só reflexo*. Sem nada pra refletir (um envmap, módulo 06), reflete o vazio: preto. A hipótese errada "minha luz tá fraca" leva o iniciante a empilhar luzes inúteis; a causa é ausência de mundo pra refletir.

**Espaço de cor: linear vs sRGB, e por que blending errado nasce disso.** A luz se soma **linearmente** na física — dobrar a energia dobra o valor. Mas os arquivos de imagem e o `#RRGGBB` guardam cor em **sRGB** (IEC 61966-2-1:1999), uma curva de gama (~2.2) herdada da resposta não-linear dos CRTs e afinada à percepção humana. Se você **misturar/iluminar/interpolar em sRGB**, está somando números que não representam energia linear — o resultado é o clássico *dark fringe* na borda entre cores, gradiente "sujo", e antialiasing acinzentado. O fluxo correto (que o three faz por padrão desde as versões recentes, via `renderer.outputColorSpace` e o decode automático de texturas `sRGB`): **decodifica sRGB→linear na entrada, faz toda a matemática de luz em linear, re-encoda linear→sRGB na saída**. Saber isso é o que explica "por que minha cor ficou lavada" sem chutar.

**Texturas e UV.** Uma textura é imagem amostrada pelos UVs. Além da cor (`map`), o PBR usa `normalMap` (relevo falso barato), `roughnessMap`/`metalnessMap`, `aoMap`. Custo real está na **resolução** (2048×2048 RGBA ≈ 16 MB de VRAM, sem contar mipmaps) e no formato — produção usa KTX2/Basis (comprimido *na* GPU), não PNG gigante. E atenção: mapas de cor são sRGB; mapas de dado (normal, roughness) são **lineares** — marcar o color space errado corrompe o resultado.

**Onde o custo mora de verdade.** Contar polígono é intuição de 2005. GPU moderna come milhões de triângulos; o gargalo real é **draw call** (1 por mesh×material) e **troca de material** (rebind de shader/texturas). 200 meshes de 100 triângulos custam mais que 1 mesh de 20 mil — ponte pro módulo 07.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Dois eixos independentes, e confundi-los é a raiz do "por que meu material está errado":

```
                 DIFUSO (Lambert, N·L)        ESPECULAR (Cook-Torrance: D·G·F)
                 "cor da superfície"          "reflexo / brilho"
metalness = 0    albedo colorido              reflexo branco fixo (~4%)   → plástico/madeira
metalness = 1    (sem difuso)                 reflexo tingido pela cor    → metal
                    │                              │
             roughness controla ← nada    roughness controla o quão espalhado é o reflexo
```

- **`metalness`** decide *para onde vai a cor base*: para o difuso (dielétrico) ou para o reflexo (metal).
- **`roughness`** decide *o quão nítido* é o especular — o termo D de Cook-Torrance.
- **A luz da cena** (módulo 06) alimenta o `N·L` de Lambert; **o environment map** alimenta o reflexo especular do metal. Faltando o segundo, metal morre.

Toda essa matemática roda **no fragment shader** (módulo 01), por fragmento, em espaço **linear** — e o resultado é re-encodado pra sRGB antes de ir pro framebuffer. É essa cadeia que amarra §BASE inteira: geometria dá `N`; material dá os parâmetros; luz dá `L` e o envmap; o shader avalia D·G·F + Lambert em linear; a saída volta pra sRGB.

---

## § METODOLOGIA — o passo-a-passo replicável

**Autorar um material PBR por evidência, não por chute:**

**1. Comece dielétrico.** `metalness: 0`. Mexa só em `roughness` de 0 a 1 e observe o realce especular abrir/fechar (é o termo D). Você está vendo Cook-Torrance ao vivo.

**2. Vire metal só com envmap na cena.** `metalness: 1` sem `scene.environment` → preto. Adicione um HDRI (módulo 06) e o metal "liga". Provou a regra da §BASE com evidência.

**3. Confira o color space dos mapas.** Cor = sRGB; normal/roughness = linear. Marca errada corrompe silenciosamente.

**4. Meça o custo antes de detalhar.** `renderer.info.render` (draw calls, triângulos) *depois* de 1 frame. Otimizar geometria antes de medir é intuição de 2005.

**Anti-padrões:**
- **"metal = brilhante" sem envmap:** produz carvão. A causa é ausência de reflexo, não luz fraca.
- **Iluminar/misturar em sRGB:** blending "sujo", bordas escuras. Toda a luz é linear; a cor de arquivo é sRGB; não some sem decodar.
- **`metalness` intermediário "pra ficar bonito":** cria material fisicamente incoerente que quebra sob outra luz. É quase binário por um motivo físico.
- **Esfera 64×64 num fundo desfocado:** polígono que ninguém vê. Casa com o módulo 07.

---

## Passo-a-passo aplicado (faça agora, ~35min)

Objetivo real: painéis com o look dark+neon dos decks 3D da AG. Partindo do projeto do módulo 02:

```js
// Painel: pouco polígono, material fazendo o trabalho
const painel = new THREE.Mesh(
  new THREE.BoxGeometry(2, 1.2, 0.06),
  new THREE.MeshStandardMaterial({
    color: 0x0d0d14,          // quase-preto azulado, não #000 (preto puro mata a luz)
    roughness: 0.35,
    metalness: 0.0,
    emissive: 0x7c3aed,       // o "neon": emissive ignora a luz da cena
    emissiveIntensity: 0.25,
  })
);
scene.add(painel);

// Verificação, não achismo: quantos draw calls e triângulos custou?
console.log(renderer.info.render); // { calls, triangles, ... } — leia DEPOIS de 1 frame
```

Experimento pra fixar a §BASE (rode, não leia): varra `roughness` de 0 a 1 com `lil-gui` e observe o highlight de Cook-Torrance abrir; depois ponha `metalness: 1` **sem** envmap e veja o painel morrer em preto. Você acabou de refutar "metal = brilhante" com evidência.

```js
import GUI from 'lil-gui';
const gui = new GUI();
gui.add(painel.material, 'roughness', 0, 1);
gui.add(painel.material, 'metalness', 0, 1);
```

---

## Por que cai em entrevista

Materiais PBR são vocabulário compartilhado com designers e ferramentas (Blender, glTF, Substance) — saber o que `roughness` significa *fisicamente* mostra que você transita entre código e asset. Explicar por que metalness/roughness substituiu specular/gloss é uma pergunta de "você entende a evolução do campo ou decorou a API atual". E "draw call importa mais que polígono" é a afirmação contraintuitiva que, bem defendida, marca o candidato.

> **P:** "O que custa mais numa cena three.js: 100 mil triângulos ou 300 objetos?"
>
> **R (30s):** "Quase sempre os 300 objetos. Cada mesh com seu material é um draw call — uma ida CPU→GPU com rebind de estado — e é aí que o frame morre, não na rasterização. GPU moderna processa milhões de triângulos, mas centenas de draw calls estrangulam a CPU. Eu verifico em `renderer.info.render.calls` antes de otimizar qualquer coisa; se calls está alto, a resposta é mergear geometria ou instancing, não baixar polígono."

> **P:** "Por que o workflow metalness/roughness substituiu specular/gloss no PBR?"
>
> **R (30s):** "Porque metalness/roughness codifica a física e fecha a porta pro material impossível. No specular/gloss você pinta a cor especular à mão e é fácil criar um dielétrico com reflexo colorido forte ou um metal sem reflexo — coisas que não existem, e que quebram sob outra luz. Metalness é quase binário: dielétrico tem reflexo branco fixo de uns 4% e cor no difuso, metal não tem difuso e tinge o reflexo com a cor base. Isso vem da microfacet theory de Cook-Torrance e da parametrização que a Disney popularizou em 2012 e o glTF canonizou. Com dois parâmetros de significado físico, o material fica coerente em qualquer iluminação — é menos liberdade, de propósito."

---

## Checkpoint

- [ ] Sei listar os 4 atributos padrão de uma BufferGeometry e o que cada um guarda
- [ ] Sei a linhagem Lambert → Phong → Blinn → Cook-Torrance → Disney e o que cada um resolveu
- [ ] Sei explicar por que metalness/roughness venceu specular/gloss (fecha o material impossível)
- [ ] Provoquei o "metal preto sem envmap" e sei explicar a causa (metal é só reflexo)
- [ ] Sei por que iluminar em sRGB dá blending "sujo" e o que é o fluxo linear
- [ ] Li `renderer.info.render` numa cena minha e sei estimar a VRAM de uma textura 2048²

---

## Recursos

- *Photometria* — Johann Heinrich Lambert (1760): a lei do cosseno, base da reflexão difusa
- "Illumination for Computer Generated Pictures" — Bui Tuong Phong, CACM (1975): o realce especular empírico
- "Models of Light Reflection for Computer Synthesized Pictures" — James Blinn, SIGGRAPH (1977): o vetor halfway (Blinn-Phong)
- "A Reflectance Model for Computer Graphics" — Cook & Torrance, ACM ToG (1982): a microfacet theory (D·G·F), base física do PBR
- "Physically-Based Shading at Disney" — Brent Burley, SIGGRAPH Courses (2012); e "Real Shading in Unreal Engine 4" — Brian Karis (2013): a parametrização metalness/roughness
- *glTF Specification* — Khronos: o *metallic-roughness workflow* canonizado (o que o `MeshStandardMaterial` implementa)
- IEC 61966-2-1:1999 (sRGB) e a seção "Color management" do three.js manual: o fluxo linear vs sRGB
- lil-gui (georgealways) e Poly Haven (CC0): tweaking e assets pra treinar
