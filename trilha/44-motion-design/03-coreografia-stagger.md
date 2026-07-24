# 03 — Coreografia & Stagger

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Coreografia é a camada acima do easing: não *como* um elemento se move (módulo 02), mas **como vários elementos se relacionam no tempo**. O princípio é brutal de simples e tem base perceptual dura: **se tudo entra junto, nada se destaca**. Dez cards em fade-in simultâneo lêem-se como um blob único; os mesmos dez em sequência criam ritmo, direção de leitura e sensação de sistema vivo. **Stagger** — um delay incremental entre irmãos — é a ferramenta que quebra o "junto" e transforma movimento em narração.

---

## § BASE — o fundamento

**Por que "tudo junto" vira um blob — Gestalt, common fate (Wertheimer, 1923).** Max Wertheimer, em "Untersuchungen zur Lehre von der Gestalt II" (1923), catalogou as leis de organização perceptual — proximidade, similaridade, continuidade — e entre elas o **destino comum** (*gemeinsames Schicksal* / "common fate"): **elementos que se movem juntos, na mesma direção e velocidade, são percebidos como um único grupo.** É uma das leis de agrupamento mais fortes que existem — mais forte que cor ou forma. A consequência pra motion é direta e científica, não estética: dez cards com o **mesmo** fade-in ao **mesmo** tempo satisfazem o destino comum e o cérebro os funde num objeto só. Você animou dez coisas e comunicou uma. **Stagger é a quebra deliberada do destino comum:** escalonar o início separa os elementos no tempo, o agrupamento se desfaz, e cada item recupera identidade — o olho passa a lê-los como sequência, não como massa.

**Por que a sequência funciona — atenção serial + staging da Disney.** O agrupamento explica por que "junto" falha; a atenção serial explica por que "sequência" acerta. O olho acompanha **um** movimento por vez (atenção visual é serial — o mesmo fundamento do módulo 01). Uma cascata apresenta os elementos um a um dentro da capacidade de foco, e a **ordem** vira significado: o que entra primeiro é lido como anunciado primeiro. Thomas & Johnston (*The Illusion of Life*, 1981, cap. 3) chamam isso de **staging** ("encenação") — dirigir a atenção da plateia para o que importa naquele instante, um evento por vez, para que nada essencial se perca. Coreografia de UI é staging: você é o diretor decidindo a ordem em que a informação sobe ao palco.

**A janela numérica onde o stagger funciona.** Os intervalos não são livres — têm faixa perceptual:

- **30–60ms entre itens.** Abaixo de ~30ms o olho não separa os inícios (o destino comum se restabelece — vira "tudo junto" com custo extra de CPU). Acima de ~80ms começa a parecer lento e teatral, e o total estoura.
- **Teto no total: ~600–800ms** somando (stagger × n) + duração, num contexto de trabalho. Lista de 30 itens a 50ms = 1,5s só de delays — inaceitável. Solução: **stagger só nos primeiros 8–10** e o resto entra junto, ou stagger decrescente. O teto vem da mesma zona sub-1s dos limites de resposta (módulo 05): passou de ~1s, o usuário está esperando a lista aparecer.

**A ordem segue a hierarquia de informação, não a ordem do DOM por acaso.** Título → número-chave → conteúdo de apoio → chrome (navegação, rodapé). O stagger **narra**; narrar na ordem errada (rodapé antes do título só porque veio primeiro no HTML) conta a história errada. Isso liga coreografia à hierarquia temporal do módulo 01: ordem no tempo é hierarquia, do mesmo jeito que tamanho é hierarquia no espaço.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Três decisões, nesta ordem de dependência:

```
   1. ORDEM  ──► 2. INTERVALO (stagger) ──► 3. TETO (total)
      │              │                          │
      hierarquia     30–60ms                    ~600–800ms
      de informação  (< 30 = "junto")           (> 1s = espera)
      NÃO ordem      (> 80 = teatral)           cap nos 8–10 primeiros
      do DOM

   Base perceptual por trás de cada uma:
   ORDEM     → staging (Disney) + hierarquia temporal (mód. 01)
   INTERVALO → quebra do common fate (Wertheimer 1923)
   TETO      → limite de resposta sub-1s (Card/Nielsen, mód. 05)
```

O mecanismo de implementação é **indexar irmãos** e derivar o delay do índice — o mesmo padrão em CSS puro (`--i` + `calc()`) e em React (`style={{ '--i': index }}` no `map`) ou via orquestração de lib (`staggerChildren`). A técnica muda; o princípio (delay = índice × intervalo, respeitando ordem de hierarquia e teto) não.

Um invariante estrutural amarra este módulo ao 07: **o estado final mora no CSS normal; a animação só descreve a viagem** (`from` sem `to`). Coreografia que esconde conteúdo quando não roda é coreografia quebrada.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. ORDENE por hierarquia de informação.** Escreva a sequência de leitura pretendida — título, número-mestre, apoio, chrome — *antes* de tocar no código. Essa lista é a coreografia.

**2. INDEXE os irmãos** na ordem da hierarquia (não na do DOM, se divergirem): `--i: 0, 1, 2…`.

**3. DERIVE o delay:** `animation-delay: calc(var(--i) * 45ms)` — comece em ~45ms e ajuste dentro de 30–60ms.

**4. APLIQUE o teto:** se n > 10, escalone só os primeiros 8–10 (`--i` limitado) e deixe o resto em delay fixo, ou zere o stagger acima do corte. Confira: (stagger × itens_escalonados) + duração ≤ ~800ms.

**5. VERIFIQUE a ordem percebida = hierarquia pretendida.** Não confie no replay mental — grave a tela ou use DevTools → Animations panel e confira item a item. Já bastou duas vezes pra achar um item entrando antes do título por ordem de DOM.

**Anti-padrões:**
- **`animation-fill-mode: both` (ou `forwards`)** quando o destino é o CSS normal — congela o transform final e cria o bug do `position: fixed` (módulo 07). Use **`backwards`**: aplica o `from` durante o delay e some depois.
- **Keyframe com `to` explícito** — amarra o destino à animação; se ela não roda (reduced-motion), o conteúdo some. Use só `from`; o destino é o estilo normal.
- **Deslocamento longo (translateY de 40–60px)** — stagger vira montanha-russa. Fique em 8–16px.
- **Stagger sem teto** — 30 itens a 50ms = 1,5s de puro delay.
- **Ordem do DOM como coreografia acidental** — narra a história errada; ordene por hierarquia.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Padrão dos decks (single-file, sem lib): indexar irmãos e derivar o delay.

```html
<section class="slide">
  <h2 class="reveal"     style="--i:0">Título</h2>
  <p  class="reveal num" style="--i:1">R$ 1,2M</p>
  <li class="reveal"     style="--i:2">Ponto um</li>
  <li class="reveal"     style="--i:3">Ponto dois</li>
</section>
```

```css
.slide.active .reveal {
  animation: rise 400ms cubic-bezier(0.22, 1, 0.36, 1) backwards;
  animation-delay: calc(var(--i) * 50ms);   /* 50ms de stagger */
}
@keyframes rise {
  from { opacity: 0; transform: translateY(12px); }
  /* sem `to`: o destino é o CSS normal do elemento */
}
```

1. Rode com stagger **0ms** (todos juntos) e depois **50ms**. Sinta a diferença: o primeiro é um blob (common fate), o segundo tem leitura.
2. Inverta a ordem do `--i` (rodapé com `--i:0`, título por último). Veja a narração errada — o olho é puxado pro lugar errado primeiro.
3. Empurre o stagger pra 100ms. Note virar teatral/lento. Volte pra faixa 30–60.
4. Simule uma lista de 30 itens. Meça o total (30 × 50ms = 1,5s). Aplique o cap: escalone só os 8 primeiros.
5. Abra DevTools → Animations panel, dispare o reveal e confirme: a ordem percebida bate com a hierarquia que você escreveu no passo 1?
6. Troque `backwards` por `both` e observe (se houver um `position: fixed` dentro): o transform residual pode prender o fixed — a ponte pro módulo 07.

## Por que cai em entrevista

Coreografia é o tópico que revela se o candidato pensa em **sistema** ou em elemento isolado. "Como você animaria a entrada de um dashboard?" — quem responde "fade-in nos cards" para no júnior; quem fala em ordem por hierarquia, stagger de 30–60ms e teto de tempo total demonstra critério de produto, não de efeito.

> **P:** "Você tem uma lista de resultados que entra na tela. Como anima?"
>
> **R (30s):** "Stagger de 40 a 50ms entre itens, cada um com fade + translateY curto de uns 12px, ease-out, 300–400ms. A ordem segue a hierarquia: cabeçalho antes dos itens. E eu ponho um teto — se a lista tem 30 itens, só os 8 primeiros ganham stagger e o resto entra junto, senão o usuário espera 1,5s de puro delay. O princípio é que atenção é serial: tudo junto, nada se destaca; em sequência, eu controlo a ordem de leitura. Uso esse padrão nos reveals de slide das apresentações que faço."

> **P:** "Por que dez elementos entrando ao mesmo tempo parecem 'um só'? Qual é o fundamento?"
>
> **R (30s):** "É uma lei de Gestalt: o destino comum. Wertheimer mostrou que elementos que se movem juntos, mesma direção e velocidade, o cérebro agrupa como um objeto único — é um dos agrupamentos perceptuais mais fortes. Então dez fade-ins simultâneos não comunicam dez coisas, comunicam uma massa. O stagger existe justamente pra quebrar esse destino comum: escalonando o início, eu separo os elementos no tempo, o agrupamento se desfaz e o olho volta a lê-los como sequência. É por isso que 30ms é o piso — abaixo disso o olho não separa os inícios e o destino comum se restabelece."

## Checkpoint

- [ ] Sei os números de cabeça: 30–60ms de stagger, teto de ~600–800ms no total, cap nos primeiros 8–10
- [ ] Sei explicar o common fate de Wertheimer (1923) e por que ele fundamenta a necessidade do stagger
- [ ] Ordeno o stagger por hierarquia de informação, não pela ordem do DOM
- [ ] Implementei stagger via `--i` + `calc()` sem lib e sei por que `backwards` (não `both`) e por que só `from`
- [ ] Conferi no Animations panel que a ordem percebida = hierarquia pretendida (não só no replay mental)

## Recursos

- **Wertheimer, Max — "Untersuchungen zur Lehre von der Gestalt II" (1923), lei do *gemeinsames Schicksal* (common fate):** por que movimento conjunto agrupa
- **Thomas, Frank & Johnston, Ollie — *The Illusion of Life* (1981), cap. 3, princípio "Staging":** dirigir a atenção, um evento por vez
- **MDN — CSS `animation-delay` e `animation-fill-mode`:** o mecanismo do stagger e a diferença `backwards`/`both`/`forwards` — [developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode)
- **Material Design 3 — "Choreography":** ordem, atraso escalonado e staging na prática da indústria
- **Emil Kowalski — *Animations on the Web* (animations.dev):** curso de referência em coreografia de UI
- Módulo-irmão `01-motion-com-proposito` (hierarquia temporal) e `07-motion-acessivel-e-armadilhas` (`backwards` vs `both`)
