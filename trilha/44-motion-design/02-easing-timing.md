# 02 — Easing & Timing

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Easing é a **curva de velocidade** de uma animação — como o valor interpola entre início e fim ao longo do tempo. Timing é **quanto** tempo essa viagem dura. Os dois carregam significado: a curva certa faz a interface parecer física e responsiva; a duração certa a mantém no lado de "usando" e não de "esperando". Este módulo dá a base física e perceptual de ambos — por que `linear` parece robótico, por que `ease-out` na entrada e `ease-in` na saída não é gosto, e por que 400ms é aproximadamente onde a UI vira sala de espera.

---

## § BASE — o fundamento

**Por que nada linear parece natural — Newton, e a Disney que o traduziu.** No mundo físico nenhum objeto muda de velocidade instantaneamente: massa tem inércia, então tudo **acelera** ao partir e **desacelera** ao chegar (segunda lei de Newton, F = ma — força finita sobre massa não-nula dá aceleração finita, nunca um degrau de velocidade). Velocidade constante (`linear`) viola essa expectativa embutida no sistema visual, e o olho lê "mecânico", "robótico". Thomas & Johnston (*The Illusion of Life: Disney Animation*, 1981, cap. 3) codificaram isso como o princípio **"Slow In and Slow Out"**: um objeto tem mais quadros no começo e no fim do movimento (onde está lento) e menos no meio (onde está rápido). Easing de UI **é** esse princípio — a única diferença é que o animador Disney distribuía quadros e nós distribuímos uma curva paramétrica. Corolário direto:

- **`ease-out` (rápido → lento) para ENTRADAS.** A parte rápida acontece **primeiro**, dentro da janela de percepção — o elemento responde na hora ao gatilho e assenta suave no destino. Default de ~90% da UI.
- **`ease-in` (lento → rápido) para SAÍDAS.** O elemento "ganha velocidade" ao ir embora; como está saindo, ninguém precisa acompanhar o final. `ease-in` numa **entrada** é o erro clássico: nada acontece nos primeiros frames e a interface parece travada.
- **`ease-in-out` para movimento DENTRO da tela** (muda de posição sem entrar nem sair).
- **`linear` só para propriedades sem posição:** opacity pura, cor, rotação contínua de spinner — não há inércia espacial pra violar.

**O que é uma curva cubic-bezier, formalmente.** Os keywords CSS são atalhos: `ease-out` = `cubic-bezier(0, 0, 0.58, 1)`. Uma curva de Bézier cúbica (Pierre Bézier / Paul de Casteljau, engenharia automotiva anos 1960) é definida por 4 pontos; em CSS os extremos são fixos — P₀=(0,0) e P₃=(1,1) — e os 4 números são os **dois pontos de controle** P₁ e P₂. O eixo x é o tempo normalizado (0→1), o eixo y é o progresso da propriedade (0→1). A inclinação da curva **é** a velocidade instantânea: curva íngreme = rápido, plana = lento. Por isso `cubic-bezier(0.22, 1, 0.36, 1)` (quint-out aproximado) parece "cara" — o y dispara pra perto de 1 quase de imediato (resposta instantânea) e depois rasteja o resto (assentamento longo). Ler os 4 números como "início/controle-de-saída/controle-de-entrada/fim" é o que separa quem calibra de quem chuta.

**Springs: a física em vez da duração (oscilador harmônico amortecido).** `cubic-bezier` tem **duração fixa** e é não-interrompível com graça — se o usuário interage no meio, corta ou reinicia. Springs não têm duração; têm **condições físicas**: massa, rigidez (constante k da lei de Hooke, F = −kx) e amortecimento. A animação emerge da simulação do oscilador harmônico amortecido, e o valor **preserva velocidade** quando interrompido — um drag solto no meio continua do momentum atual em vez de saltar. É por isso que Framer Motion e react-spring usam springs como default. Trade-off honesto: spring exige **JS** rodando por frame (custo de main thread e bundle); bezier é CSS puro que roda no compositor (módulo 06). CSS moderno tem `linear()` (MDN, `easing-function`), que **amostra** uma curva arbitrária — inclusive aproximações de spring — em pontos e interpola reto entre eles, trazendo o efeito pro compositor; suporte e tooling ainda maturando.

**Duração tem teto perceptual, não estético.** A tabela de durações por porte não é convenção arbitrária — ela vive dentro da zona sub-1s dos limites de resposta humana (Card, Robertson & Mackinlay, 1991; Nielsen, *Usability Engineering*, 1993, cap. 5 — desenvolvidos no módulo 05). Abaixo de ~100ms o feedback é "instantâneo"; até ~1s o usuário mantém o fluxo de pensamento, mas cada centena de ms adicional é tempo em que ele **espera a UI** em vez de agir. Daí o teto prático de ~400ms pra transição funcional.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Duas variáveis independentes — **curva** (papel do movimento) e **duração** (porte do elemento) — combinadas por regra:

```
   CURVA por PAPEL                     DURAÇÃO por PORTE
   ┌──────────────┬─────────────┐      ┌───────────────────────┬──────────┐
   │ entra na tela│ ease-OUT    │      │ micro (hover/toggle)  │ 100–150ms│
   │ sai da tela  │ ease-IN     │      │ pequeno (dropdown)    │ 150–250ms│
   │ move dentro  │ ease-in-out │      │ médio (modal/painel)  │ 250–350ms│
   │ sem posição  │ linear      │      │ grande (tela/rota)    │ 300–400ms│
   └──────────────┴─────────────┘      └───────────────────────┴──────────┘
        ↑ Disney: slow in/out               ↑ zona sub-1s (Card/Nielsen)
                                            > 400ms = "esperando a UI"
   Exceção: intro/reveal de deck (encanta, roda 1×) → 600–900ms OK
```

O eixo escondido que decide entre **bezier e spring**:

```
   disparo 1× (transição de estado)  →  CSS cubic-bezier  (compositor, barato)
   gesto contínuo/interrompível      →  spring em JS      (preserva velocidade)
     (drag, swipe, arraste solto)
```

E o princípio de **tokenização**: curva e duração não são valores mágicos espalhados no código — são **design tokens** (custom properties) centralizados, exatamente como cor e espaçamento. Trocar a personalidade de motion do produto inteiro deve ser editar 4 linhas, não caçar 200 `transition:`.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CLASSIFIQUE o papel** do movimento: entra, sai, move-dentro, ou sem-posição. Isso escolhe a **família** da curva (out/in/in-out/linear) antes de qualquer número.

**2. ESCOLHA o porte** do elemento: micro → tela cheia. Isso escolhe a **faixa** de duração pela tabela.

**3. DECIDA bezier vs spring** pela natureza do disparo: transição pontual → bezier; gesto interrompível → spring. Não pague o custo de JS de spring numa transição que dispara uma vez.

**4. CALIBRE a curva autoral** (não chute): abra o editor visual (cubic-bezier.com), ponha a candidata **lado a lado** com `ease-out`, ajuste os pontos de controle até a inclinação inicial dar a resposta que você quer, cole nos tokens.

**5. VERIFIQUE no alvo real, nos dois portes.** A mesma curva parece **diferente** em 100ms e em 400ms — a percepção de uma bezier depende da duração em que roda. "Ficou bom" é hipótese; só vira afirmação depois de ver rodando no menor e no maior porte que a usa (módulo 05 do raciocínio: verificar antes de afirmar).

**Anti-padrões:**
- **`ease` (ou `ease-in-out`) em tudo:** o default do browser é morno e genérico; entrada com `ease-in` embutido faz a UI parecer lenta.
- **`ease-in` na entrada:** nada acontece nos primeiros frames; o elemento parece grudado antes de se soltar.
- **Duração acima de ~400ms em transição funcional:** vira sala de espera. Reserve 600ms+ pro que encanta e roda 1×.
- **Spring pra transição pontual:** custo de main thread e bundle sem o ganho de interrupção — spring só paga quando há gesto pra interromper.
- **Curva calibrada num porte só:** aprovar em 300ms e aplicar em 120ms sem re-olhar.

---

## Passo-a-passo aplicado (faça agora, ~30min)

Num deck HTML (arquivo único, vanilla) ou num componente seu, centralize motion em tokens:

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);   /* entradas — quint-out */
  --ease-in:  cubic-bezier(0.64, 0, 0.78, 0);    /* saídas */
  --dur-s: 180ms; --dur-m: 300ms; --dur-l: 400ms;
}
.slide-enter { transition: transform var(--dur-l) var(--ease-out),
                           opacity   var(--dur-l) var(--ease-out); }
.slide-exit  { transition: transform var(--dur-m) var(--ease-in),
                           opacity   var(--dur-m) var(--ease-in); }
```

1. Troque **um** elemento de entrada de `ease` (default) para `--ease-out` autoral. Recarregue e sinta a diferença de resposta nos primeiros frames.
2. Aplique a **mesma** `--ease-out` a um elemento micro (120ms) e a um grande (400ms). Grave os dois (ou olhe atento): a curva "assenta" diferente? Ajuste o token grande se ficou lento demais.
3. Force um erro: ponha `--ease-in` numa entrada. Observe a UI parecer travada. Reverta. Agora você reconhece o bug de olho.
4. Pegue um drag simples (um slider, um card arrastável) e note: com transição CSS, soltar no meio **corta**. É o caso onde spring venceria — descreva por escrito por quê.
5. Cole a curva final no editor visual, compare com `ease-out` keyword lado a lado, e ajuste até a inclinação inicial dar a "energia" que você quer.

## Por que cai em entrevista

"Por que ease-out na entrada e ease-in na saída?" é a pergunta-filtro de motion: tem resposta objetiva (percepção de resposta imediata vs irrelevância do final da saída) e quase todo júnior responde "porque fica mais bonito". Springs vs bezier testa se você entende interrupção e gesto — assunto de pleno.

> **P:** "Como você escolhe easing e duração de uma animação?"
>
> **R (30s):** "Easing pelo papel: ease-out pra entrada, porque a parte rápida acontece primeiro e o elemento responde na hora; ease-in pra saída, porque o final de quem sai não importa; linear só pra opacidade ou spinner. Duração pelo porte: 100–150ms pra micro-interação, até 400ms pra transição de tela — acima disso o usuário está esperando a UI. E se a interação é um gesto interrompível, tipo drag, eu troco bezier por spring, porque spring preserva a velocidade quando o usuário intervém no meio."

> **P:** "Cubic-bezier tem quatro números. O que eles são, e por que uma curva autoral parece mais 'cara' que ease-out?"
>
> **R (30s):** "Os extremos da curva são fixos em (0,0) e (1,1); os quatro números são os dois pontos de controle. O eixo x é o tempo, o y é o progresso, e a inclinação da curva é a velocidade instantânea. Uma curva tipo quint-out, cubic-bezier(0.22, 1, 0.36, 1), sobe o progresso pra perto de 100% quase de imediato e depois assenta longo — então o elemento responde instantâneo e acomoda devagar, que é a sensação premium. Ease-out keyword é morno, cubic-bezier(0, 0, 0.58, 1), sobe mais devagar. Não é magia, é ler a inclinação inicial da curva."

## Checkpoint

- [ ] Sei explicar ease-out/entrada e ease-in/saída pelo mecanismo (slow-in/out da Disney + percepção), não por gosto
- [ ] Sei ler os 4 números de um cubic-bezier como pontos de controle e associar inclinação a velocidade
- [ ] Sei a tabela de durações por porte de cabeça e por que o teto de ~400ms é perceptual (zona sub-1s)
- [ ] Sei quando spring vence bezier (gesto interrompível) e o custo de cada (JS/main thread vs compositor)
- [ ] Montei tokens de easing/duração e testei a mesma curva em dois portes diferentes, vendo a diferença

## Recursos

- **Thomas, Frank & Johnston, Ollie — *The Illusion of Life* (1981), cap. 3, princípio "Slow In and Slow Out":** a origem do easing como distribuição de tempo
- **MDN — CSS `easing-function` / `animation-timing-function`:** definição de cubic-bezier, `steps()` e `linear()` — [developer.mozilla.org/en-US/docs/Web/CSS/easing-function](https://developer.mozilla.org/en-US/docs/Web/CSS/easing-function)
- **Card, Robertson & Mackinlay (1991), "The Information Visualizer, an Information Workspace" (Proc. CHI '91):** as constantes de tempo que fundamentam o teto de duração (via módulo 05)
- **Josh Comeau — "A Friendly Introduction to Spring Physics" (joshwcomeau.com):** o oscilador amortecido explicado pra quem faz UI
- **cubic-bezier.com (Lea Verou)** e **easings.net:** editores/catálogos visuais de curvas — ferramenta de calibração, não de decoração
- Módulo-irmão `06-performance-de-animacao` — por que bezier (compositor) é mais barato que spring (JS)
