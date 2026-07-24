# 07 — Motion Acessível & Armadilhas

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Motion tem **custo de acessibilidade real e médico**, não apenas de gosto. Este módulo fecha a trilha com o outro lado da moeda do módulo 01 (onde "animação melhora usabilidade" já entrou como tese contestada): para uma parcela de usuários, motion **prejudica** — causa náusea e tontura. A WCAG cobre isso em dois critérios, a plataforma expõe via `prefers-reduced-motion`, e há uma **cicatriz de produção** deste próprio repositório que muda como você deve tratar o flag. E fecha com duas armadilhas técnicas de CSS que já custaram bugs no catálogo.

---

## § BASE — o fundamento

**O custo médico: desordens vestibulares.** O sistema vestibular (ouvido interno) rege equilíbrio e orientação espacial. Para pessoas com disfunções vestibulares — labirintite, enxaqueca vestibular, vertigem — grandes translações, parallax, zoom e movimento de fundo disparam **náusea, tontura e desorientação reais**, o mesmo mecanismo de enjoo de movimento (conflito entre o que o olho vê e o que o corpo sente). Não é preferência estética; é sintoma físico. Isso é a evidência concreta por trás da incerteza declarada no módulo 01: motion excessivo não é neutro — **prejudica** uma parcela mensurável de usuários. Val Head sistematizou o tema pra web em "Designing Safer Web Animation For Motion Sensitivity" (A List Apart, 2017).

**Os dois critérios WCAG, por número.** A WCAG 2.1 endereça motion em dois success criteria distintos — saber qual é qual separa quem cita de quem entende:

- **2.3.3 Animation from Interactions (Nível AAA):** "animação de movimento disparada por interação **pode ser desativada**, a menos que a animação seja essencial à funcionalidade ou à informação transmitida." É o critério que fundamenta respeitar `prefers-reduced-motion` — cobre parallax, reveals, transições disparadas por scroll/clique.
- **2.2.2 Pause, Stop, Hide (Nível A):** para conteúdo em movimento/piscando/rolando que **(1)** inicia automaticamente, **(2)** dura **mais de 5 segundos** e **(3)** é apresentado em paralelo com outro conteúdo — deve haver mecanismo para **pausar, parar ou ocultar**. É Nível A (o mínimo legal), mais forte que o 2.3.3 (AAA), e mira autoplay/carrossel/marquee, não a transição pontual.

A diferença de nível importa: 2.2.2 é obrigação de conformidade básica; 2.3.3 é excelência. Um carrossel que roda sozinho por mais de 5s **viola A** se não puder ser parado.

**O mecanismo da plataforma: `prefers-reduced-motion` (MDN, `@media/prefers-reduced-motion`).** A media query reflete a preferência de "reduzir movimento" do sistema operacional; valores `no-preference | reduce`. **Reduzir ≠ congelar** — e este é o erro conceitual central:

- **Certo:** substituir o que enjoa (grandes translações, parallax, zoom, autoplay) por equivalentes calmos — fade de opacity, corte seco. Feedback **funcional** (loading, confirmação de ação, focus) **permanece**: o usuário pediu menos movimento, não menos informação.
- **Errado:** `animation: none` global. Se o estado inicial do elemento era `opacity: 0` esperando a animação trazê-lo, matar a animação **congela a página invisível**. O flag vira interruptor de quebrar o site.

O padrão estrutural que imuniza (já visto nos módulos 03 e 04): **o estado final mora no CSS normal do elemento; a animação só descreve a viagem** (`from` sem `to`). Animação que não roda = conteúdo visível no destino. Aí a redução é segura, e usa `0.01ms` em vez de `none` — os keyframes ainda "acontecem" (eventos `animationend` disparam, fill-modes resolvem), só que instantâneos, então lógica JS que espera o fim não trava.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

O domínio tem três camadas — a conformidade, a implementação segura, e as armadilhas:

```
   1. POR QUE reduzir        WCAG 2.2.2 (A, autoplay >5s: pausar)
                             WCAG 2.3.3 (AAA, interação: desativável)
                             + vestibular (náusea real)
        │
   2. COMO reduzir sem       "estado final no CSS, animação = viagem"
      quebrar                @media reduce → 0.01ms (não `none`)
                             feedback funcional intocado
        │
   3. AS ARMADILHAS          (a) flag forçado pelo AMBIENTE (RDP/Windows)
                                  → escape explícito ?static=1
                             (b) fill-mode both/forwards → transform residual
                                  → prende position:fixed (containing block)
```

A camada 3 é o que este módulo tem de próprio e caro: os dois casos abaixo não estão em tutorial — são cicatrizes pagas no código deste repositório.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. ESTRUTURE pro reduzível:** todo elemento animado tem o estado final no CSS normal; a animação descreve só a viagem (`from` sem `to`). Isso é pré-condição — sem ela, reduzir quebra.

**2. MAPEIE o que enjoa vs o que é funcional.** Translações grandes, parallax, zoom, autoplay → substituíveis por fade/corte. Loading, confirmação, focus → **permanecem**.

**3. IMPLEMENTE o `@media (prefers-reduced-motion: reduce)`** colapsando só o que enjoa, com `0.01ms` (não `none`):

```css
@media (prefers-reduced-motion: reduce) {
  .reveal   { animation-duration: 0.01ms; animation-delay: 0ms; }
  .parallax { transform: none !important; }
  /* loading e feedback de ação: intocados */
}
```

**4. DECIDA sobre o sinal do ambiente** (a armadilha (a) abaixo): o flag é confiável no contexto deste artefato? Se o artefato roda em ambiente que **força** o flag sem intenção do usuário, projete um **escape explícito** (ver caso real) e documente a decisão com escopo.

**5. VERIFIQUE por dado, não por olho:** `matchMedia('(prefers-reduced-motion: reduce)').matches` no console diz o valor **real** na máquina. Antes de culpar o JS por uma tela congelada, confirme se o flag está ligado — o alvo pode estar mentindo (módulo `alvo-certo` / raciocínio 05).

**Anti-padrões:**
- **`animation: none` global no media query** — congela o que estava em `opacity: 0`.
- **Gatear *visibilidade* no flag** — animação que não roda esconde conteúdo.
- **Confiar no flag como intenção do usuário** — em RDP/Windows ele liga sozinho (caso abaixo).
- **`fill-mode: both`/`forwards` em container de `fixed`** — transform residual prende o fixed (caso abaixo).

### A armadilha (a): o flag forçado pelo ambiente — a cicatriz do `?static=1`

**Caso real deste repositório, pago duas vezes.** Windows com "Efeitos de animação" desligado — **e sessões RDP, que desligam sozinhas** — reportam `prefers-reduced-motion: reduce` **sem nenhum pedido consciente do usuário**. Resultado: camada de efeitos aberta via área de trabalho remota com a intro **congelada em `opacity: 0`** — tela preta, parecia bug de render. A hipótese inicial ("quebrou o JS") foi **refutada verificando o dado**: `matchMedia('(prefers-reduced-motion: reduce)').matches` → `true` numa máquina onde ninguém configurou isso.

A decisão que ficou no código do hub (`fx.js`), com o comentário do porquê:

```js
// NUNCA gatear no prefers-reduced-motion: em Windows/RDP o flag liga sozinho e
// mataria a camada inteira justamente no ambiente do dono (bug já pago 2×).
// O escape explícito e confiável é ?static=1.
const REDUCED = false;
const STATIC = new URLSearchParams(location.search).has('static');
if (STATIC) document.documentElement.dataset.static = '1'; // CSS colapsa via html[data-static]
```

Lição em duas camadas:

1. **Universal:** nunca gatear *visibilidade* nesse flag — só a viagem (o padrão "estado final no CSS" já resolve).
2. **Decisão de produto com escopo:** neste artefato — cuja função **é** o motion, apresentado num ambiente que corrompe o sinal — o flag automático é deliberadamente ignorado (`REDUCED = false`), e o controle de redução é movido pra um **escape explícito e confiável**: `?static=1`, que seta `html[data-static]` e o CSS colapsa tudo pro estado final. Isso **não** é abandonar acessibilidade — é trocar um sinal quebrado por um confiável, e está registrado em DECISIONS.md. Num produto de uso diário (PULSAR-RH), respeitar o flag automático **continua obrigatório** — a exceção é fechada a este caso.

### A armadilha (b): fill-mode `backwards` vs `both` (o bug do `position:fixed`)

`animation-fill-mode` define o que os keyframes aplicam **fora** da janela da animação: `backwards` aplica o `from` durante o delay; `forwards` mantém o último keyframe **para sempre**; `both` = os dois. A pegadinha, por spec CSS: **`transform` não-`none` num ancestral vira o *containing block* de `position: fixed`** — o "fixed" passa a ser relativo àquele ancestral, não ao viewport (MDN, "Containing block").

O bug de catálogo: container entra com `animation: rise 400ms both`, keyframe termina em `transform: translateY(0)`. Visualmente idêntico a nada — mas com `both`/`forwards` esse transform **fica aplicado eternamente**, e o modal `position: fixed` lá dentro abre "grudado no topo" do container em vez de centralizado no viewport. Diagnóstico: inspecionar o modal → Computed → achar o containing block; o transform residual aparece no ancestral. Fixes, do melhor pro paliativo: **`backwards`** quando o destino já é o CSS normal (padrão do módulo 03 — não há o que "manter"); remover a classe num `animationend`; ou nunca animar `transform` em containers que abrigam `fixed` (portar o modal pra fora — React portal).

---

## Passo-a-passo aplicado (faça agora, ~30min)

1. Num deck ou app seu, abra o console e rode `matchMedia('(prefers-reduced-motion: reduce)').matches`. Anote o valor.
2. **Force o flag:** Windows → Configurações → Acessibilidade → Efeitos visuais → desligue "Efeitos de animação" (ou macOS → Acessibilidade → Reduzir movimento). Recarregue e rode o `matchMedia` de novo — deve virar `true`.
3. Se sua página tinha elementos em `opacity: 0` esperando animação, veja se **sumiram**. Se sumiram, você gateou visibilidade no flag — corrija movendo o estado final pro CSS normal.
4. Implemente o `@media reduce` com `0.01ms` (não `none`) e confirme: o conteúdo aparece instantâneo no destino, sem parallax/translação grande, com loading/feedback intactos.
5. Reproduza a armadilha (b): ponha `animation: rise 400ms both` num container com um modal `position: fixed` dentro. Veja o modal grudar no topo. Troque `both` por `backwards` e confirme que ele volta a centralizar no viewport.
6. Adicione um `?static=1` (ou equivalente) como escape explícito e teste que ele colapsa a animação **independente** do flag do SO.

## Por que cai em entrevista

Acessibilidade de motion é o diferencial que quase nenhum candidato leva: citar `prefers-reduced-motion` já destaca; explicar "reduzir sem congelar" + um caso real de flag forçado por ambiente demonstra cicatriz de produção, que é o que separa pleno de júnior com portfólio bonito. O bug do containing block é pergunta armadilha clássica de CSS avançado.

> **P:** "Como você lida com prefers-reduced-motion?"
>
> **R (30s):** "Reduzo, não congelo: troco translações grandes e parallax por fade ou corte seco, e mantenho feedback funcional. Estruturalmente, o estado final vive no CSS normal e a animação só descreve a viagem — assim, animação que não roda nunca esconde conteúdo. E aprendi na prática que o flag pode vir do ambiente, não do usuário: sessão RDP no Windows liga reduced-motion sozinha e congelou uma apresentação minha em opacity zero. Verifiquei com matchMedia antes de culpar o código — e a exceção pra decks ficou documentada em DECISIONS.md com escopo fechado."

> **P:** "Qual a diferença entre WCAG 2.2.2 e 2.3.3, e qual é obrigatória?"
>
> **R (30s):** "São critérios diferentes com níveis diferentes. O 2.2.2, Pause Stop Hide, é Nível A — o mínimo: conteúdo que se move sozinho, dura mais de 5 segundos e aparece junto de outro conteúdo tem que poder ser pausado. Mira carrossel e autoplay. O 2.3.3, Animation from Interactions, é Nível AAA — mais alto: animação disparada por interação, tipo parallax e reveal por scroll, tem que poder ser desativada, e é o que fundamenta respeitar prefers-reduced-motion. Então o autoplay sem botão de pausa viola o A; o parallax sem opção de reduzir fere o AAA. Na prática eu trato os dois, mas se preciso priorizar, o 2.2.2 é o piso legal."

## Checkpoint

- [ ] Sei explicar "reduzir ≠ congelar" com o exemplo do `opacity: 0` preso
- [ ] Sei distinguir WCAG 2.2.2 (A, autoplay >5s) de 2.3.3 (AAA, interação) e o custo vestibular por trás
- [ ] Apliquei "estado final no CSS, animação é só a viagem" e sei por que `0.01ms` em vez de `none`
- [ ] Reproduzi o flag forçado (desligar efeitos no Windows/macOS) e vi o `matchMedia` virar `true`
- [ ] Sei defender o escape `?static=1` como troca de um sinal quebrado por um confiável, com escopo documentado
- [ ] Sei explicar o bug do `position:fixed` por transform residual (`both`/`forwards`) e os 3 fixes

## Recursos

- **WCAG 2.1 — SC 2.3.3 "Animation from Interactions" (Understanding):** o critério AAA de desativar animação por interação — [w3.org/WAI/WCAG21/Understanding/animation-from-interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
- **WCAG 2.1 — SC 2.2.2 "Pause, Stop, Hide" (Understanding):** o critério A de pausar autoplay/movimento >5s — [w3.org/WAI/WCAG21/Understanding/pause-stop-hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html)
- **MDN — `@media/prefers-reduced-motion`:** valores, uso e o padrão de reduzir sem remover — [developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- **MDN — "Containing block":** a regra do `transform` que prende o `fixed` — [developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block)
- **Val Head — "Designing Safer Web Animation For Motion Sensitivity" (A List Apart, 2017):** o custo vestibular por extenso
- **Cicatriz interna:** `fx.js` deste repositório (`const REDUCED = false` + `?static=1`) e o DECISIONS.md correspondente — a decisão de escopo em código
