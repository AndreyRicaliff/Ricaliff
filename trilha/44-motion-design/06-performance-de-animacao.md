# 06 — Performance de Animação

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Animação fluida tem um orçamento de tempo **fixo e pequeno** por frame, ditado pela taxa de atualização da tela. Estourar esse orçamento = frame dropado = jank visível. Onde o tempo vai é definido pelo **pixel pipeline** do browser, e cada propriedade CSS entra nele num ponto diferente — pagando tudo dali pra baixo. Este módulo dá a aritmética do orçamento, o pipeline por seção, por que **só `transform` e `opacity`** são baratos, e o rito de medir antes de otimizar.

---

## § BASE — o fundamento

**A aritmética do orçamento: 60fps = 16,67ms por frame.** A maioria das telas atualiza a **60Hz** — 60 vezes por segundo. Para a animação acompanhar sem pular, o browser precisa entregar um frame pronto a cada ciclo de tela: `1000ms ÷ 60 = 16,67ms`. Esse é o orçamento **total** por frame, e não é negociável — perdeu o prazo, o frame não aparece e o olho vê o solavanco. Na prática o orçamento **útil** é ainda menor (~10ms), porque o browser gasta ~6ms de overhead por frame com sua própria contabilidade (housekeeping) — número do modelo **RAIL** do Google (web.dev, "Measure performance with the RAIL model"). Em telas de 120Hz o orçamento cai pra ~8,3ms (`1000 ÷ 120`), o que torna a disciplina ainda mais apertada. A origem do número, então, não é convenção: é `1000 / taxa_de_atualização`.

**O pixel pipeline: JS → Style → Layout → Paint → Composite (web.dev, "Rendering performance").** Para pintar um frame, o browser percorre até cinco etapas. O que decide o custo de uma animação é **em que etapa a propriedade que você anima entra** — porque ela paga daquele ponto **pra baixo**:

```
   JS  →  Style  →  Layout  →  Paint  →  Composite
                      │          │          │
   width/height ──────┘          │          │   dispara reflow: recalcula
   top/left/margin                │          │   geometria da árvore → repinta
                                  │          │   → recompõe.  O MAIS CARO.
   color/background ──────────────┘          │   rasteriza pixels de novo.
   box-shadow/border-radius                   │   Caro (box-shadow é vilão clássico).
                                             │
   transform / opacity ──────────────────────┘   só recompõe texturas já
                                                  pintadas, na GPU, FORA da
                                                  main thread.  BARATO.
```

- **`width`, `height`, `top`, `left`, `margin` → Layout (reflow).** O browser recalcula a geometria de toda a árvore afetada, depois repinta e recompõe. Animar isso é pagar o preço máximo 60×/s.
- **`background`, `color`, `box-shadow`, `border-radius` → Paint.** Rasterizar pixels de novo. Caro — `box-shadow` animado é o vilão de catálogo.
- **`transform` e `opacity` → só Composite.** A GPU reposiciona/esmaece **texturas já pintadas**, fora da main thread. Por isso a **regra número 1 do domínio**: animar **só** transform e opacity. Mover = `translate`, crescer = `scale`, esmaecer = `opacity` — **nunca** `top/width`. O compositor roda numa thread separada, então mesmo que o JS trave a main thread, uma animação de transform continua fluida.

**Layout thrashing: o assassino silencioso em JS.** Ler uma propriedade de geometria (`offsetHeight`, `getBoundingClientRect`) **depois** de escrever um estilo força o browser a resolver o layout **sincronamente, na hora**, pra te dar um valor correto. Num loop que intercala leitura e escrita, isso é **um reflow por iteração** — o pipeline inteiro roda dezenas de vezes num frame. A cura é separar as fases: **leia tudo, depois escreva tudo.** É exatamente por isso que o FLIP (módulo 04) mede First e Last antes de animar qualquer coisa. Paul Irish mantém a lista canônica de quais leituras forçam layout síncrono ("What forces layout/reflow", gist no GitHub).

**`will-change`: promoção com custo.** `will-change: transform` promove o elemento a uma **layer própria da GPU antes** da animação, eliminando o custo de promoção no primeiro frame. Mas cada layer é uma textura na memória da GPU; `will-change` espalhado é como deixar todas as luzes acesas — em mobile ou máquina fraca, degrada tudo. Regra (MDN alerta oficialmente): pouquíssimos elementos, aplicado/removido em volta da animação, **nunca** em lista inteira "por garantia".

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

A hierarquia de custo é a espinha dorsal — anime o mais baixo possível no pipeline:

```
   BARATO   Composite  →  transform, opacity ............ prefira SEMPRE
     ▲      Paint      →  color, box-shadow, bg .......... evite animar
     │      Layout     →  width, top, margin ............. quase nunca anime
   CARO     (+ thrashing: ler geometria após escrever = reflow síncrono)

   Ferramentas de mitigação:        Fio condutor:
   · will-change (com moderação)     MEDIR antes de otimizar.
   · FLIP (mód. 04) troca            Otimização sem profile é chute —
     Layout por Composite            e chute empilha "fix" por fé.
   · rAF + lerp p/ input contínuo
```

Um caso estrutural recorrente: valores que seguem **input contínuo** (tilt de card 3D acompanhando o mouse). O padrão é `requestAnimationFrame` + interpolação linear (lerp) — o valor **persegue** o alvo em vez de saltar. Duas decisões escondidas: o handler de `pointermove` (que dispara mais de 60×/s) **não toca o DOM**, só atualiza o alvo; e o fator de lerp é o amortecimento. Ressalva crítica (módulo 07): **rAF pausa em aba oculta** — screenshot de aba em background pega a animação **congelada**, e isso já enganou verificação de deck.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. MEÇA antes de tocar em qualquer coisa.** DevTools → Performance → engrenagem → CPU **4× slowdown** (simula máquina modesta). Otimização sem medição é chute.

**2. GRAVE ~5s** interagindo com a parte suspeita, e leia o **flame chart** procurando frames **vermelhos** (estouraram 16,7ms).

**3. DIAGNOSTIQUE pela cor da barra dentro do frame lento:**
   - barra **roxa (Layout)** = animando propriedade de layout **ou** thrashing;
   - barra **verde longa (Paint)** = `box-shadow`/`filter`/`background` animado;
   - só **Composite** = já está barato, o gargalo é outro (JS, contagem de layers).

**4. FORMULE uma hipótese** ("é o box-shadow do card"), aplique **UM** fix, **MEÇA DE NOVO.** Se a segunda medição não confirmar a melhora, a hipótese estava errada — **volte atrás**, não empilhe otimizações por fé (módulo 05 do raciocínio: refutar, não confirmar).

**Fixes canônicos por diagnóstico:**
- **Layout** → troque `top/left/width/height` por `transform` (translate/scale); se for reordenação, use FLIP (módulo 04).
- **Paint (box-shadow)** → pré-pinte a sombra final num `::after` com `opacity: 0` e anime **só a opacity** — Paint vira Composite.
- **Thrashing** → separe fase de leitura de fase de escrita.
- **Promoção lenta no 1º frame** → `will-change` no elemento certo, aplicado/removido em volta.

**Anti-padrões:**
- **Otimizar sem medir** — "acho que é isso" sem profile. Chute.
- **Empilhar fixes sem re-medir** — cinco "otimizações" por fé, nenhuma confirmada, e você não sabe qual (se alguma) ajudou.
- **`will-change: *`** em lista inteira — estoura memória de GPU, degrada mobile.
- **Handler de `pointermove` tocando o DOM** — escreve estilo mais de 60×/s; só atualize o alvo, deixe o rAF escrever.
- **Verificar animação em aba oculta / screenshot de background** — rAF pausado dá falso "congelou" (módulo 07).

---

## Passo-a-passo aplicado (faça agora, ~30min)

O loop de valor contínuo (tilt 3D dos decks CSS3D) e a medição:

```js
let atual = 0, alvo = 0;
window.addEventListener('pointermove', e => { alvo = calcularTilt(e); }); // só escreve o alvo
(function loop() {
  atual += (alvo - atual) * 0.1;                       // lerp: 10% do gap por frame
  card.style.transform = `rotateY(${atual}deg)`;       // só transform → compositor
  requestAnimationFrame(loop);
})();
```

1. Provoque um layout thrashing de propósito: um loop `els.forEach(el => el.style.height = el.offsetHeight * 2 + 'px')`. Grave no Performance panel com CPU 4× e veja o Layout roxo por iteração.
2. Corrija separando as fases (leia todas as alturas num array, depois escreva). Grave de novo e confirme: o Layout colapsa pra um.
3. Anime um `box-shadow` num hover e grave — veja o Paint verde. Reescreva pré-pintando a sombra num `::after opacity:0` e animando a opacity. Confirme Paint → Composite.
4. No loop de tilt acima, confirme no painel que só há Composite (nenhum Layout/Paint por frame).
5. Abra o deck em outra aba e volte: o `requestAnimationFrame` **pausou** enquanto a aba estava oculta? Confirme que ao voltar ele retoma — e entenda por que um screenshot da aba oculta pegaria a animação parada (ponte pro módulo 07).

## Por que cai em entrevista

"Por que transform e não top/left?" é possivelmente A pergunta de front performance — resposta exige explicar o pixel pipeline, o que separa quem decorou a regra de quem entende o browser. Layout thrashing e will-change são o degrau seguinte, de pleno. E a postura "medi antes de otimizar" é o que o entrevistador sênior quer ouvir em qualquer resposta de performance.

> **P:** "Uma animação está engasgando. Como você investiga?"
>
> **R (30s):** "Primeiro meço: Performance panel com CPU 4x, gravo a interação e olho os frames que estouram 16,7ms. Se tem Layout roxo em todo frame, alguém está animando top/width ou intercalando leitura e escrita de geometria — troco por transform, que roda só no compositor. Se é Paint, suspeito de box-shadow ou filter animado — pré-pinto num pseudo-elemento e animo opacity. Aplico um fix por vez e meço de novo; se não confirmar, a hipótese estava errada. Foi assim que estabilizei os efeitos 3D dos decks de apresentação que faço."

> **P:** "De onde vem o número 16,67ms, e por que transform escapa da main thread?"
>
> **R (30s):** "16,67ms é 1000 dividido por 60 — a tela atualiza 60 vezes por segundo, então o browser tem esse tempo pra montar cada frame, e na prática uns 10ms úteis porque tem overhead. Transform e opacity são a única dupla que o browser resolve só na etapa de composição: o elemento já foi pintado numa textura, e a GPU só reposiciona ou esmaece essa textura numa thread separada da main. Por isso, mesmo que o JavaScript trave a main thread, uma animação de transform continua fluida — enquanto width ou top forçam recalcular a geometria da árvore inteira, que é layout, na main thread, o caminho mais caro do pipeline."

## Checkpoint

- [ ] Sei a aritmética do orçamento: 16,67ms = 1000/60, ~10ms úteis (RAIL), ~8,3ms em 120Hz
- [ ] Sei desenhar o pixel pipeline e dizer onde cada tipo de propriedade entra (Layout/Paint/Composite)
- [ ] Sei explicar por que transform/opacity são baratos (compositor, GPU, fora da main thread)
- [ ] Provoquei e corrigi layout thrashing separando fase de leitura de escrita, comprovado no profile
- [ ] Gravei um profile com CPU 4× e li o flame chart até a causa, aplicando um fix por vez e re-medindo

## Recursos

- **web.dev — "Rendering performance":** o pixel pipeline explicado por etapa (JS/Style/Layout/Paint/Composite) — [web.dev/articles/rendering-performance](https://web.dev/articles/rendering-performance)
- **web.dev — "Animations guide":** quais propriedades disparam Layout/Paint/Composite e gestão de layers — [web.dev/articles/animations-guide](https://web.dev/articles/animations-guide)
- **web.dev — "Measure performance with the RAIL model":** a origem do orçamento útil (~10ms) e das metas de resposta
- **Paul Irish — "What forces layout/reflow" (gist no GitHub):** a lista canônica das leituras que forçam layout síncrono
- **MDN — CSS `will-change`:** inclui o aviso oficial de moderação — [developer.mozilla.org/en-US/docs/Web/CSS/will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- Módulos-irmãos `04-transicoes-de-estado` (FLIP troca Layout por Composite) e `07` (rAF pausa em aba oculta)
