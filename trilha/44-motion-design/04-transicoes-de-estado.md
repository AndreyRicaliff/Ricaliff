# 04 — Transições de Estado & FLIP

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Animar **mudança de layout** — um elemento que muda de posição, tamanho ou de container — é o problema mais espinhoso do motion de UI, por dois motivos: as propriedades que descrevem layout (`top/left/width/height`) são caras de animar (disparam reflow, módulo 06), e muitas vezes **não há propriedade pra transicionar** (um item que sobe num ranking reordenado simplesmente re-renderiza noutro lugar e **teleporta**). **FLIP** (Paul Lewis, 2015) resolve invertendo o problema; **View Transitions API** faz o browser fazer FLIP por você. Este módulo é sobre continuidade espacial — manter o modelo mental do usuário quando o layout muda.

---

## § BASE — o fundamento

**Por que continuidade espacial importa — o modelo mental persiste quando o objeto persiste.** Quando um elemento **teleporta**, o usuário precisa reconstruir "isto é a mesma coisa que estava ali?" na força bruta. Quando o elemento **viaja** de forma contínua, essa pergunta nem se forma — o cérebro rastreia objetos por continuidade de trajetória, o mesmo mecanismo perceptual que Michotte (1946, módulo 01) mostrou governar a leitura de causa em movimento, e que a Gestalt trata como continuidade/destino comum (módulo 03). Card que **cresce** até virar a tela de detalhe carrega a identidade do objeto pela transição inteira; detalhe que surge do nada obriga a reconstrução. Continuidade espacial não é enfeite — é preservação do modelo mental, o propósito "orientar" do módulo 01 na sua forma mais forte.

**O obstáculo de engenharia: você não pode animar *até* um layout que ainda não existe.** O layout final de uma reordenação é resultado do browser recalcular a árvore depois da mudança de DOM — não é um valor que você tenha de antemão pra interpolar. E as propriedades que *tocam* layout (`top`, `left`, `width`, `height`, `margin`) pagam o preço máximo do pixel pipeline a cada frame: Layout → Paint → Composite (módulo 06). Animar geometria 60×/s é o antipadrão de performance por excelência.

**FLIP: a inversão (Paul Lewis, "FLIP Your Animations", 2015).** A sacada é deixar o layout acontecer **de graça** e animar *a partir* dele, de trás pra frente. *First, Last, Invert, Play*:

1. **First** — meça a posição atual: `getBoundingClientRect()`.
2. **Last** — aplique a mudança de estado (reordene, troque a classe) e meça de novo. O browser já pôs o elemento no **destino final**, sem custo de animação.
3. **Invert** — aplique um `transform` que o devolve **visualmente** pra posição antiga: `translate(firstX − lastX, firstY − lastY)`. Pro usuário, nada se moveu ainda.
4. **Play** — transicione o transform até `none`. O elemento "viaja" do lugar antigo pro novo — mas o layout já foi resolvido **uma vez** no passo 2, e a animação inteira é **só transform** (compositor, barato).

Em vez de animar *até* um layout futuro desconhecido, você mede os dois estados reais e anima a diferença como transform. É o padrão por baixo do `layout` prop do Framer Motion e das transições de lista do Vue. E ele **exige** medir tudo antes de mexer (First e Last antes de qualquer animação) — a mesma disciplina anti-thrashing do módulo 06.

**View Transitions API: o browser fazendo FLIP.** `document.startViewTransition(() => atualizarDOM())` tira um snapshot do estado antigo, aplica a mudança e cross-fade entre os dois. Com `view-transition-name: nome-unico` em CSS, elementos com o **mesmo nome** nos dois estados são **morfados** (posição + tamanho) em vez de cross-fade — FLIP nativo, declarativo. Same-document é suportada em Chromium desde 2023 e Safari 18; Firefox chegou por último — **verifique no caniuse antes de afirmar suporte** e trate sempre como *progressive enhancement*, nunca baseline.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Três caminhos pro mesmo objetivo (continuidade espacial), do mais manual ao mais automático — e a decisão de quando cada um vale:

```
   PROBLEMA: elemento muda de posição/tamanho/container → não teleportar

   ┌─ FLIP manual (getBoundingClientRect + Web Animations) ─┐
   │    controle total · vanilla · funciona em qualquer     │  mais código
   │    lugar · você mede First/Last                        │  mais controle
   ├─ View Transitions API (startViewTransition + names) ───┤
   │    o browser mede por você · declarativo ·             │
   │    progressive enhancement (checar suporte)            │
   ├─ Lib de layout (Framer Motion `layout`/`layoutId`) ────┤
   │    FLIP industrializado · custo de bundle/JS           │  menos código
   └────────────────────────────────────────────────────────┘  menos controle

   Invariante dos três: layout resolve UMA vez, animação é SÓ transform
   Prova de que está certo: 1 barra de Layout + resto só Composite (mód. 06)
```

O trade-off honesto que atravessa os três: **continuidade custa complexidade.** Em rota com data-fetching no meio (Next.js), o "card vira detalhe" exige segurar a transição até os dados chegarem — e muitas vezes um **skeleton bem coreografado entrega 80% do valor por 20% do custo**. Continuidade espacial é decisão, não dogma: aplique onde o ganho de orientação justifica.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. IDENTIFIQUE o que muda de lugar** entre os dois estados e o que tem **identidade estável** (o mesmo `data-id` antes e depois). Só o que persiste ganha FLIP; o que nasce/morre entra/sai com fade.

**2. MEÇA First** (`getBoundingClientRect` de cada elemento com identidade) **antes** de qualquer mudança de DOM.

**3. APLIQUE a mudança de estado** (reordene, troque classe). Deixe o browser resolver o layout final — não anime nada ainda.

**4. MEÇA Last, calcule o delta, INVERTA e PLAY:** para cada elemento, `delta = firstTop − lastTop`; anime de `translateY(delta)` até `none`, só transform, com `ease-out`.

**5. VERIFIQUE no Performance panel:** grave a transição. A prova de FLIP correto é **uma** barra de Layout (na mudança de DOM) e frames seguintes **só com Composite**. Layout roxo em todo frame = você está animando propriedade de layout e o FLIP falhou (módulo 06). Evidência antes de "pronto".

**Anti-padrões:**
- **Animar `top/left/width/height`** direto — reflow por frame, o preço máximo. É o problema que o FLIP existe pra resolver.
- **Esquecer o First/Last e medir no meio** — thrashing: leitura e escrita de geometria intercaladas forçam reflow síncrono (módulo 06).
- **Apostar o produto na View Transitions API sem fallback** — API nova ainda desigual entre browsers; sem `if (!document.startViewTransition) return atualizarDOM()` você quebra onde não há suporte.
- **Continuidade espacial onde não paga** — segurar rota inteira por 300ms de morph quando um skeleton resolveria. Complexidade sem ganho de orientação.

---

## Passo-a-passo aplicado (faça agora, ~35min)

FLIP num ranking que reordena — caso plausível de dashboard comercial (Cliente Varejo): ranking de vendedores que reordena ao mudar o filtro de período. Sem FLIP, as linhas teleportam.

```js
function reordenarComFlip(container, aplicarNovaOrdem) {
  const linhas = [...container.children];
  const first = new Map(linhas.map(el => [el.dataset.id, el.getBoundingClientRect()]));

  aplicarNovaOrdem(); // muda o DOM — browser resolve o layout final

  for (const el of container.children) {
    const f = first.get(el.dataset.id);
    if (!f) continue;                       // linha nova: entra sem FLIP (ou com fade)
    const d = f.top - el.getBoundingClientRect().top;
    if (!d) continue;                       // não se moveu: nada a animar
    el.animate(
      [{ transform: `translateY(${d}px)` }, { transform: 'none' }],
      { duration: 300, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
    );
  }
}
```

1. Monte uma lista de 5 linhas com `data-id` e um botão que embaralha a ordem. Sem FLIP, veja as linhas teleportarem.
2. Envolva a troca com `reordenarComFlip`. Agora elas viajam. Confirme que a viagem é suave.
3. DevTools → Performance, grave uma reordenação. Conte as barras de Layout: **deve ser uma** (na mudança de DOM). Se houver Layout roxo em todo frame, o FLIP falhou — investigue.
4. Adicione uma linha nova no embaralho (id inédito). Confirme que ela **entra sem FLIP** (o `continue` do `if (!f)`) — idealmente com um fade.
5. Reescreva o mesmo efeito com `document.startViewTransition` + `view-transition-name` por linha, com o fallback `if (!document.startViewTransition) return atualizarDOM()`. Teste desligando a API (ou num browser sem suporte) e confirme que degrada pra corte seco, sem quebrar.

## Por que cai em entrevista

FLIP é pergunta clássica de vaga front pleno/sênior porque testa duas coisas de uma vez: entender o pipeline de render (por que transform e não top/left) e capacidade de inverter um problema. View Transitions testa se você acompanha plataforma web moderna — e se sabe tratar API nova como enhancement em vez de apostar o produto nela.

> **P:** "Como você animaria um item de lista que muda de posição após um sort?"
>
> **R (30s):** "FLIP: meço a posição antes com getBoundingClientRect, deixo o DOM reordenar, meço de novo, aplico um transform que devolve o item visualmente pro lugar antigo e transiciono até transform none. O layout acontece uma vez só e a animação inteira é transform no compositor. Usei esse padrão em ranking de vendedores que reordena com filtro de período. Hoje eu testaria também View Transitions API, que faz isso nativo — mas com fallback, porque é progressive enhancement, não baseline."

> **P:** "Por que não animar direto o top/left até a posição nova? O que o FLIP resolve exatamente?"
>
> **R (30s):** "Dois problemas. Primeiro, top/left disparam reflow a cada frame — layout, paint, composite — então animar geometria 60 vezes por segundo engasga. Segundo, e mais sutil: numa reordenação eu não *tenho* o layout final de antemão pra interpolar; ele é o resultado de o browser recalcular a árvore depois que o DOM muda. O FLIP inverte isso: deixo o layout final acontecer de graça, meço os dois estados reais, e animo a diferença como transform, que roda só no compositor. Em vez de animar até um destino desconhecido, eu meço o destino e animo a partir dele, de trás pra frente. A prova de que está certo é uma barra de Layout no Performance panel e o resto só Composite."

## Checkpoint

- [ ] Sei recitar os 4 passos do FLIP e explicar por que a inversão evita animar até um layout desconhecido
- [ ] Sei por que continuidade espacial preserva o modelo mental (o objeto persiste, o usuário não pergunta "onde estou?")
- [ ] Implementei FLIP vanilla numa lista que reordena e vi funcionando
- [ ] Provei no Performance panel: 1 Layout na mudança, resto só Composite
- [ ] Fiz um `startViewTransition` com fallback funcional e sei defender quando continuidade NÃO vale a complexidade

## Recursos

- **Paul Lewis — "FLIP Your Animations" (aerotwist.com, 2015):** o artigo original que nomeou a técnica
- **MDN — View Transitions API:** conceitos, `startViewTransition`, `view-transition-name` — [developer.mozilla.org/en-US/docs/Web/API/View_Transition_API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
- **Chrome for Developers — "Smooth and simple transitions with the View Transitions API":** same-document, com exemplos e caveats de suporte
- **MDN — Web Animations API (`Element.animate`):** a API usada no exemplo de FLIP vanilla
- **caniuse.com — "view-transitions":** conferir suporte **antes** de prometer em call de projeto — [caniuse.com/view-transitions](https://caniuse.com/view-transitions)
- Módulo-irmão `06-performance-de-animacao` — por que top/left é caro e transform é barato (o pixel pipeline)
