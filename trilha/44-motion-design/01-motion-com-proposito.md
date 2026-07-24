# 01 — Motion com Propósito

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Motion design em interface é **comunicação com dimensão temporal**, não decoração. Uma animação bem colocada responde perguntas que layout estático não consegue: *de onde isso veio?* (orientação), *minha ação funcionou?* (confirmação), *este produto é cuidado?* (encantamento). A herança teórica vem do cinema de animação — os 12 princípios da Disney (Thomas & Johnston, 1981) — mas UI usa um **subconjunto** deles, e importar os outros faz mais mal que bem. Este módulo estabelece o critério de corte antes de qualquer curva ou duração: **por que** uma animação existe. Sem ele, os módulos seguintes (easing, coreografia, FLIP) só deixam mais bonito o que não deveria estar lá.

---

## § BASE — o fundamento

**A tese contestada, declarada de saída.** "Animação melhora a usabilidade" é um enunciado que a literatura **não** sustenta como lei geral. O efeito é **contexto-dependente**: motion que estabelece continuidade espacial reduz carga cognitiva; motion decorativo em fluxo repetitivo a *aumenta*, e motion excessivo prejudica gente com sensibilidade vestibular (§ do módulo 07). Nielsen Norman Group é explícito ao alertar que animação mal-usada distrai e desacelera. Então o fundamento honesto não é "anime mais", é: **motion é uma aposta com custo de atenção, e a aposta só paga quando serve a um propósito perceptual.** O resto deste módulo é sobre quais propósitos são esses e por que o olho os lê.

**Por que o olho lê *causa* em movimento — Michotte (1946).** O psicólogo belga Albert Michotte, em *La perception de la causalité* (1946; trad. *The Perception of Causality*, 1963), fez o experimento fundador: um quadrado A desliza até encostar num quadrado B, e B parte imediatamente. O observador **não infere** que A empurrou B — ele **percebe** a causação diretamente, tão imediata quanto percebe a cor. Michotte chamou de **effet de lancement** (efeito de lançamento). A demonstração-chave: introduza um atraso de ~150ms entre o contato e a partida de B, e a percepção de causa **desaparece** — vira "dois eventos separados". Traduzido pra UI: quando o modal **cresce a partir do botão** que o abriu, o cérebro lê "o botão causou o modal" sem esforço consciente. Quando o modal teleporta, essa leitura some e o usuário reconstrói a relação na força bruta. **Orientação em motion é a engenharia da percepção de causalidade de Michotte** — e a janela temporal importa: causa percebida exige contiguidade, o que amarra motion de orientação ao limiar de resposta do próximo pilar.

**A herança Disney — e a tradução honesta pra UI (Thomas & Johnston, 1981).** *The Illusion of Life: Disney Animation*, capítulo 3 "The Principles of Animation", cataloga os 12 princípios. O instinto júnior é tratá-los como checklist de UI. Errado: eles foram destilados para **animação de personagem em cinema**, onde o público é passivo e assiste uma vez. UI tem o oposto: usuário no controle, com pressa, repetindo a interação 200 vezes. A tradução honesta:

| Princípio Disney | Transfere pra UI? |
|---|---|
| Slow In and Slow Out | **Sim, forte** — é o easing (módulo 02) |
| Staging (encenar, dirigir o olhar) | **Sim, forte** — é coreografia/stagger (módulo 03) |
| Timing (peso pela velocidade) | **Sim, forte** — duração por porte (módulo 02) |
| Anticipation (preparo antes da ação) | **Sim, sutil** — hint de loading, wind-up de botão |
| Follow Through / Overlapping Action | **Sim, com parcimônia** — assentar/overshoot leve, springs |
| Arcs (trajetória curva) | **Fraco** — UI plana quase só translada em reta |
| Secondary Action | **Fraco** — risco de poluir; atenção é serial |
| Squash & Stretch | **Quase não** — o `scale(0.97)` do press é primo distante; squash real é personagem |
| Exaggeration | **Não / nocivo** — overshoot pra tudo = brinquedo, não produto |
| Solid Drawing, Appeal | **Não** — volume 3D e carisma de personagem não existem em UI |
| Straight Ahead / Pose to Pose | **Não** — é técnica de *produção* de desenho, não de comunicação |

Verdito: dos 12, ~5 transferem, ~2 são **ativamente nocivos** se importados ingênuos (exaggeration, squash&stretch como bounce), e o resto é irrelevante. Quem cita "os 12 princípios" como se todos valessem em UI está repetindo folclore.

**O limiar de confirmação — 100ms (Card et al., 1991 / Nielsen).** O segundo propósito, confirmar, é regido por um número com dono: **0,1s é o limite da percepção de "instantâneo"**, derivado do tempo de ciclo do processador perceptual humano (Card, Moran & Newell, *The Psychology of Human-Computer Interaction*, 1983) e articulado como constante de tempo de interação por Card, Robertson & Mackinlay (1991) e popularizado por Nielsen (*Usability Engineering*, 1993, cap. 5, "Response Times: The 3 Important Limits"). Feedback de ação acima de ~100ms sem sinal visível → o usuário **clica de novo** → duplica a ação. O módulo 05 abre essa escala inteira (0,1 / 1 / 10s); aqui basta a consequência: confirmação é obrigatória e tem prazo perceptual.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os três propósitos não são iguais: têm **prioridade** e um deles **satura**. A estrutura:

```
                     PROPÓSITO         BASE CIENTÍFICA        SATURA?
   ┌───────────────┬───────────────┬─────────────────────┬──────────┐
   │ 1. ORIENTAR   │ relação/causa │ Michotte 1946        │ não      │
   │               │ espacial      │ (causalidade)        │          │
   ├───────────────┼───────────────┼─────────────────────┼──────────┤
   │ 2. CONFIRMAR  │ feedback de   │ Card 1991 / Nielsen  │ não      │
   │               │ ação (<100ms) │ (100ms perceptual)   │          │
   ├───────────────┼───────────────┼─────────────────────┼──────────┤
   │ 3. ENCANTAR   │ 1ª impressão  │ afeto / novidade     │ SIM      │
   │               │ (wow)         │ (habitua na 20ª vez) │          │
   └───────────────┴───────────────┴─────────────────────┴──────────┘
        ↑ obrigatórios quando a informação existe    ↑ raro e caro
```

Duas camadas transversais sustentam a decisão:

1. **Atenção é serial.** O olho acompanha **um** movimento por vez; cada animação simultânea compete pela mesma atenção. Isso faz de motion uma ferramenta de **hierarquia temporal** — ordem e duração dirigem o olhar como tamanho e cor dirigem no espaço. O que se move enquanto o resto está parado captura o foco, então movimento sem propósito **rouba** atenção do que importa. É a mesma razão pela qual coreografia (módulo 03) sequencia em vez de disparar tudo junto.
2. **Frequência de uso inverte o cálculo.** A mesma animação que encanta na landing (vista 1×) irrita no dashboard (vista 50×/dia). O propósito "encantar" mora nas bordas raras — boot, conquista, entrega — nunca no miolo de trabalho. Dashboards densos (padrão dos painéis comerciais de cliente) pedem motion quase zero no núcleo.

---

## § METODOLOGIA — o passo-a-passo replicável

O raciocínio sênior do domínio inteiro em uma frase: **animação é culpada até provar propósito.** O inverso do instinto júnior ("deixar mais vivo"). O procedimento:

**1. INVENTARIAR** tudo que se move — nada escapa por ser "só um detalhe".

**2. CLASSIFICAR** cada ocorrência em exatamente um bucket: **orienta | confirma | encanta | nenhum**. A hipótese default de cada uma é "nenhum" — o ônus da prova é da animação, não do revisor (módulo 05 do raciocínio: refutar é mais forte que confirmar).

**3. JULGAR por regra, não por gosto:**
   - `nenhum` → **deletar**. Ex. clássico: `pulse` infinito num card de KPI — rouba atenção do número e não comunica nada.
   - `encanta` em elemento **repetitivo** → rebaixar pra 1ª ocorrência só, ou cortar.
   - `orienta` / `confirma` → manter, e checar o **prazo**: confirmação chega em <100ms? Orientação preserva continuidade (o elemento persiste, não teleporta)?

**4. VERIFICAR removendo.** Tire a animação e reabra. Se ninguém sente falta, era ruído. **Evidência > gosto** — o teste mais barato que decide a questão (o copo d'água do Feynman, módulo 05 do raciocínio).

**Anti-padrões:**
- **Motion decorativo em fluxo repetitivo:** 300ms de transição a cada filtro numa tabela filtrada 50×/dia. Custo de atenção acumulado, zero informação nova.
- **Encantar onde deveria confirmar:** animação bonita de 600ms que atrasa o feedback além dos 100ms — bonito e disfuncional.
- **Motion que mente:** skeleton animado sobre request que já falhou (módulo 05). Confirmação falsa é pior que ausência.
- **"Os 12 princípios" como checklist:** aplicar exaggeration/squash a UI de trabalho porque "é princípio Disney". Folclore importado sem tradução.

---

## Passo-a-passo aplicado (faça agora, ~25min)

Pegue um artefato real com motion — um deck HTML de apresentação (arquivo único, vanilla JS, caso real) ou uma tela de um app seu:

```bash
# 1. Inventariar tudo que se move no arquivo
grep -nE "animation:|transition:|@keyframes|requestAnimationFrame" apresentacao.html
```

1. Para **cada** ocorrência, escreva numa tabela: elemento · bucket (orienta/confirma/encanta/nenhum) · justificativa em uma linha. Não deixe nenhuma sem julgamento.
2. Toda `nenhum` → **delete** e recarregue. Anote se sentiu falta (honestamente).
3. Toda `encanta` em elemento que repete → rebaixe pra 1ª vez ou corte.
4. Para cada `confirma`, meça: o feedback aparece em <100ms? (DevTools → Performance, ou olho treinado — se você percebe o atraso, já passou.)
5. Para cada `orienta`, pergunte: o elemento **persiste** (cresce/desliza) ou **teleporta**? Teleporte não orienta.
6. No fim, conte: quantas animações sobreviveram ao corte? (Num deck típico, metade era `nenhum`.)

## Por que cai em entrevista

Motion é onde entrevistador de front separa quem copia Dribbble de quem pensa produto. A pergunta nunca é "sabe animar?" — é "sabe **quando não** animar?". Júnior mostra efeito; pleno defende o critério de corte e cita o custo de atenção e o limiar de 100ms.

> **P:** "Quando você decide adicionar ou remover uma animação de uma interface?"
>
> **R (30s):** "Eu classifico por propósito: orientar, confirmar ou encantar. Se não faz nenhum dos três, removo — animação sem propósito rouba atenção, e atenção é serial. Confirmação de ação precisa chegar em menos de 100ms ou o usuário clica de novo. Encantamento eu reservo pra momentos raros, tipo intro de apresentação — nos dashboards de trabalho que fiz pra clientes, o miolo é quase estático de propósito, porque quem usa 50 vezes por dia não pode pagar 300ms por clique."

> **P:** "Você citou os 12 princípios da Disney. Todos se aplicam a interface?"
>
> **R (30s):** "Não, e achar que sim é o erro clássico. Eles foram feitos pra animação de personagem em cinema, público passivo, uma exibição. Uns cinco transferem bem: slow-in/slow-out virou easing, staging virou coreografia, timing virou duração por peso, anticipation e follow-through entram sutis. Mas exaggeration e squash-and-stretch, se você importa literalmente, viram aquele overshoot elástico em tudo que faz o produto parecer brinquedo. E solid drawing ou appeal nem existem em UI. Então eu uso o subconjunto e nomeio quais — não recito os 12 como se fossem checklist."

## Checkpoint

- [ ] Sei citar os 3 propósitos de motion, sua prioridade, e um exemplo de cada num projeto real
- [ ] Sei explicar o efeito de lançamento de Michotte (1946) e por que ele fundamenta motion que orienta
- [ ] Sei dizer quais princípios Disney transferem pra UI e quais são nocivos — sem recitar os 12 como checklist
- [ ] Sei que "animação melhora usabilidade" é contestado, e cito o custo (atenção serial, vestibular) e o de quem é o limiar de 100ms
- [ ] Rodei o grep de inventário num artefato real e classifiquei/removi cada animação por bucket
- [ ] Consigo explicar "hierarquia temporal" em uma frase

## Recursos

- **Thomas, Frank & Johnston, Ollie — *The Illusion of Life: Disney Animation* (1981), cap. 3 "The Principles of Animation":** origem dos 12 princípios (leia com a tradução honesta acima em mente)
- **Michotte, Albert — *The Perception of Causality* (orig. 1946; trad. inglesa 1963):** o efeito de lançamento — por que o olho percebe causa em movimento
- **Nielsen, Jakob — *Usability Engineering* (1993), cap. 5, "Response Times: The 3 Important Limits":** o limiar de 100ms e o alerta de que animação mal-usada distrai — [nngroup.com/articles/response-times-3-important-limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- **Material Design 3 — "Motion / Understanding motion":** o guideline de propósito (significado, foco, continuidade) mais maduro da indústria — [m3.material.io/styles/motion](https://m3.material.io/styles/motion/overview)
- **Val Head — *Designing Interface Animation* (A Book Apart, 2016):** motion de UI com critério de propósito
- Módulo-irmão `03-coreografia-stagger` — hierarquia temporal aplicada; `05-microinteracoes` — a escala 0,1/1/10s por extenso
