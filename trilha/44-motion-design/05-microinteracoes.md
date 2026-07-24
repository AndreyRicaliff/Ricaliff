# 05 — Microinterações

> **Formato expandido (v2.1):** este módulo tem §Base (o fundamento com lastro
> científico), §Estruturação (como o conhecimento se organiza) e §Metodologia (o
> passo-a-passo replicável) — além da prática, P/R e checkpoint. Padrão-ouro:
> `05-raciocinio/02-hipotese-e-refutacao`.

## O que é

Microinteração é o feedback de menor escala da interface: hover, press, focus, toggle, o botão que confirma que salvou. É onde mora a sensação de "app sólido" — e é **100% regida por números de percepção**, não por gosto. Este módulo abre a escala inteira de tempo de resposta humana (os três limites de 0,1s / 1s / 10s), mostra por que cada elemento interativo precisa de estados de input, e por que o botão que salva é uma máquina de estados, não um `onClick`.

---

## § BASE — o fundamento

**Os três limites de tempo de resposta — a base científica real (Miller 1968; Card et al. 1991).** Os números que governam microinteração não saíram de guideline de design; saíram da psicologia cognitiva. Robert B. Miller, em "Response Time in Man-Computer Conversational Transactions" (AFIPS Fall Joint Computer Conference, 1968), mapeou os limiares de resposta aceitável por tipo de tarefa. Card, Robertson & Mackinlay ("The Information Visualizer, an Information Workspace", Proc. CHI '91, 1991) articularam três **constantes de tempo** ancoradas no Model Human Processor (Card, Moran & Newell, *The Psychology of Human-Computer Interaction*, 1983 — o processador perceptual cicla a ~100ms). Nielsen (*Usability Engineering*, 1993, cap. 5) consolidou os três como "The 3 Important Limits":

- **0,1s (100ms) — instantâneo.** É o tempo de ciclo do processador perceptual: abaixo dele, causa e efeito fundem-se num evento único (é o mesmo limiar da contiguidade de Michotte, módulo 01). **Todo feedback de input direto — hover, press, focus — tem que chegar aqui.** Por isso essas transições usam 100–150ms no máximo e **nunca** têm delay: um press que responde em 200ms já se sente atrasado.
- **1s — fluxo de pensamento.** Até ~1s o usuário percebe a espera mas **mantém o fluxo** ininterrupto; não precisa de feedback especial além de uma resposta chegando. Zona do loading otimista e do spinner curto. Acima de 1s, o fluxo começa a quebrar.
- **10s — limite de atenção.** Passou de ~10s, o usuário **desengaja** — troca de aba, vai fazer outra coisa. Operações que passam disso precisam de progresso determinado e/ou notificação ao terminar.

Esses três não são convenção de mercado — são os mesmos números que aparecem no módulo 02 (teto de duração) e no módulo 01 (100ms da confirmação). Toda microinteração é uma decisão sobre em qual das três faixas a resposta cai.

**Percepção de espera ≠ espera medida — e a percebida é projetável.** Aqui entra a parte contra-intuitiva: **a mesma latência real pode ser sentida como rápida ou lenta dependendo do que a UI mostra.** Progresso determinado (uma barra que anda) reduz a ansiedade em relação a indeterminado (spinner girando) mesmo com **duração idêntica** — porque incerteza é o que dói, não o tempo. Skeleton (mostra a forma do que vem) reduz incerteza mais que spinner (mostra só "algo roda"). Nielsen Norman Group ("Progress Indicators") documenta isso: comunicar *estrutura* e *progresso* baixa a espera percebida sem tocar na medida.

**A máquina de estados como fundamento, não como enfeite.** Um botão de ação não tem dois estados (parado/clicado) — tem no mínimo quatro: `idle → loading → success|error → idle`. Ignorar isso não é "menos animação", é **bug**: sem o `disabled` no `loading`, o usuário clica de novo antes da resposta e **duplica a ação** (submit duplo — bug real de produção, não questão estética). Os estados de input (hover/press/focus) e os estados de request (loading/success/error) são a mesma disciplina: a interface deve responder a **toda** transição que o usuário consegue provocar.

---

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Duas dimensões: **escala de tempo** (qual limite perceptual) × **tipo de estado** (input direto ou resposta de request).

```
                     < 0,1s               0,1–1s              > 1s / > 10s
   ┌───────────────┬────────────────────┬──────────────────┬──────────────────┐
   │ INPUT DIRETO  │ hover / press /    │  —               │  —               │
   │ (do usuário)  │ focus: 100–150ms,  │                  │                  │
   │               │ sem delay          │                  │                  │
   ├───────────────┼────────────────────┼──────────────────┼──────────────────┤
   │ RESPOSTA de   │ (resolve tão rápido│ spinner curto /   │ progresso        │
   │ REQUEST       │ que nem mostra      │ loading otimista │ determinado +    │
   │               │ loading)           │ skeleton         │ notificação      │
   └───────────────┴────────────────────┴──────────────────┴──────────────────┘
      base: Miller 1968 · Card/Robertson/Mackinlay 1991 · Nielsen 1993 (cap. 5)
```

Os três estados de **input** que todo elemento interativo deve responder:

1. **Hover** — "isso é clicável" (só desktop; **nunca** esconda função atrás de hover em app usado em tablet). Elevação sutil / mudança de cor, 100–150ms ease-out.
2. **Press/active** — "estou clicando". Padrão que funciona: `transform: scale(0.97)`, ~80–100ms. Física intuitiva: o botão afunda.
3. **Focus-visible** — "estou aqui via teclado". **Não é motion opcional, é acessibilidade:** `outline` visível, nada de `outline: none` órfão.

E a máquina de estados de **request**, que se conecta aos 5 estados de tela da trilha de frontend (vazio/carregando/erro/parcial/cheio): o `error` tem estado **próprio**, com causa e ação — nunca loading eterno mascarando falha.

---

## § METODOLOGIA — o passo-a-passo replicável

**1. CLASSIFIQUE a interação por faixa de tempo.** É input direto (<100ms obrigatório) ou resposta de request (qual faixa: <1s, <10s, >10s)? Isso decide o tipo de feedback.

**2. GARANTA os 3 estados de input** em todo elemento clicável: hover (desktop), press (scale), focus-visible (acessibilidade). Nenhum sem focus.

**3. MODELE a ação assíncrona como máquina de estados:** `idle → loading → success|error → idle`. No `loading`, **desabilite** (mata duplo-submit) e trave a largura (`min-width`) pra não pular layout. `success` volta pra `idle` sozinho (~2s). `error` mostra **o quê e o porquê**.

**4. PROJETE a espera percebida:** conteúdo com forma conhecida → skeleton; operação estimável → progresso determinado; spinner só com **delay de exibição** (~150–300ms, senão pisca) e **mínimo de permanência** (~300ms, senão o flash parece bug).

**5. VERIFIQUE com rede real, não localhost.** DevTools → Network → throttling **Slow 4G**, e clique em Salvar. É aqui que aparece o spinner que pisca, o duplo-submit e o botão que pula — em localhost com 15ms de latência, nada disso se manifesta, e "testei e funciona" era **falso** (módulo 05 do raciocínio: verificar no alvo certo).

**Anti-padrões:**
- **Só o caminho feliz** — codar o `success` e esquecer loading, error e duplo-clique. É o que separa júnior de pleno na prática.
- **Loading eterno mascarando erro** — skeleton animado sobre request que já falhou. A pior mensagem de erro que existe; fail-closed visual exige estado de erro próprio.
- **Feedback de press acima de 100ms** — passou do limiar de instantâneo, o botão parece "solto".
- **`outline: none` sem substituto** — quebra navegação por teclado; acessibilidade, não estilo.
- **Verificar só em localhost** — a latência que expõe os bugs de estado não existe lá.

---

## Passo-a-passo aplicado (faça agora, ~30min)

O caso canônico (formulários do PULSAR-RH, produto próprio): usuário clica Salvar, o request leva ~400ms. O botão vira o canal de feedback — no lugar exato pra onde o usuário olha, melhor que toast no canto oposto.

```tsx
type Estado = 'idle' | 'loading' | 'success' | 'error';

// no submit:
setEstado('loading');                    // botão disabled + spinner
try {
  await salvar(dados);
  setEstado('success');                  // "✓ Salvo" — 100ms de transição
  setTimeout(() => setEstado('idle'), 2000);
} catch (e) {
  setEstado('error');                    // erro COM contexto, não "algo deu errado"
}
```

1. Implemente os 4 estados num botão. Garanta `disabled` no `loading` e `min-width` estável entre estados (senão o layout pula quando o texto muda de "Salvar" pra "✓ Salvo").
2. Abra DevTools → Network → **Slow 4G**. Clique Salvar rápido, duas vezes. Sem o `disabled`, você dispara dois requests — reproduza o duplo-submit e depois corrija.
3. Force o `catch` (desligue a rede). Confirme que o erro tem **causa e ação**, não loading infinito nem "algo deu errado".
4. Troque um spinner por skeleton num carregamento de lista. Compare a espera *percebida* com a mesma latência real.
5. Adicione delay de exibição (~200ms) ao spinner e permanência mínima (~300ms). Num request de 120ms, confirme que o spinner **não pisca**.
6. Tab pelos elementos: todo interativo tem `:focus-visible` visível? Cace qualquer `outline: none` órfão.

## Por que cai em entrevista

Microinteração é a pergunta prática favorita ("me descreve o que acontece quando o usuário clica em salvar") porque expõe em 1 minuto se o candidato pensa em estados — loading, erro, duplo-clique, latência — ou só no caminho feliz. Júnior descreve o sucesso; pleno descreve a máquina de estados e os números de percepção.

> **P:** "O usuário clica em 'Salvar' e a API leva meio segundo. O que sua UI faz?"
>
> **R (30s):** "O botão vira a máquina de estados: no clique ele desabilita — isso mata duplo-submit — e mostra loading; no sucesso, vira '✓ Salvo' por uns 2 segundos e volta sozinho; no erro, mostra o quê e o porquê, não 'algo deu errado'. Feedback visual do press em menos de 100ms, que é o limiar de instantâneo. E eu testo com throttling de rede, porque em localhost o loading nem aparece — foi assim que peguei um duplo-submit num formulário de RH que em rede rápida nunca se manifestava."

> **P:** "Como você reduz a sensação de lentidão de um carregamento sem deixá-lo mais rápido de verdade?"
>
> **R (30s):** "Espera percebida não é espera medida — dá pra projetar a percebida. Três alavancas: skeleton em vez de spinner, porque mostra a estrutura chegando e reduz incerteza, que é o que realmente incomoda; progresso determinado em vez de indeterminado quando dá pra estimar, porque uma barra que anda baixa a ansiedade mesmo com a mesma duração; e delay de exibição no spinner, pra request rápido não piscar um loading que parece bug. Os limites vêm da psicologia cognitiva — Miller e Card: até 1 segundo o usuário mantém o fluxo, acima de 10 ele troca de aba. Então eu decido o feedback pela faixa em que a latência cai."

## Checkpoint

- [ ] Sei os limiares 0,1s / 1s / 10s, de quem são (Miller 1968; Card et al. 1991; Nielsen) e o que cada um exige da UI
- [ ] Todo botão de ação dos meus projetos tem os 4 estados (idle/loading/success/error), com `disabled` no loading
- [ ] Sei explicar por que espera percebida ≠ medida, e as alavancas (skeleton, progresso determinado, delay de exibição)
- [ ] Testei um fluxo de submit com throttling Slow 4G e corrigi o duplo-submit / spinner que pisca que apareceram
- [ ] Nenhum elemento interativo meu está sem estado de focus-visible

## Recursos

- **Miller, Robert B. — "Response Time in Man-Computer Conversational Transactions" (AFIPS FJCC, 1968):** a fonte primária dos limiares de tempo de resposta
- **Card, Robertson & Mackinlay — "The Information Visualizer, an Information Workspace" (Proc. CHI '91, 1991):** as três constantes de tempo ancoradas no Model Human Processor
- **Nielsen, Jakob — *Usability Engineering* (1993), cap. 5, "Response Times: The 3 Important Limits":** a consolidação dos 0,1/1/10s — [nngroup.com/articles/response-times-3-important-limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- **Nielsen Norman Group — "Progress Indicators Make a Slow System Less Insufferable":** determinado vs indeterminado e espera percebida
- **Dan Saffer — *Microinteractions* (O'Reilly, 2013):** trigger / rules / feedback / loops — o livro que nomeou a disciplina
- **MDN — CSS `:focus-visible`:** o estado de foco por teclado — [developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
