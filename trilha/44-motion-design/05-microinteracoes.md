# 05 — Microinterações

## O que é

Microinteração é o feedback de menor escala da interface: hover, press, focus, toggle, o botão que confirma que salvou. É onde mora a sensação de "app sólido" — e é 100% regida por números de percepção, não por gosto:

- **< 100ms**: percebido como instantâneo (NNg). Todo feedback de input direto — hover, press, focus — tem que chegar aqui. Por isso essas transições usam 100–150ms no máximo e nunca têm delay.
- **100ms–1s**: o usuário percebe a espera mas mantém o fluxo de pensamento. Zona do loading otimista e do spinner curto.
- **> 1s**: o fluxo quebra; precisa de indicador de progresso. **> 10s**: o usuário troca de aba — precisa de estimativa ou notificação.

Os três estados de input que todo elemento interativo deve responder:

1. **Hover** — "isso é clicável" (só desktop; nunca esconda função atrás de hover em app usado em tablet). Elevação sutil, mudança de cor, 100–150ms ease-out.
2. **Press/active** — "estou clicando". O padrão que funciona: `transform: scale(0.97)` com ~80–100ms. Física intuitiva: o botão afunda.
3. **Focus-visible** — "estou aqui via teclado". Não é motion opcional, é acessibilidade: `outline` visível, sem `outline: none` órfão.

### Confirmação de ação: o botão que salvou

O caso canônico (formulários do PULSAR-RH): usuário clica em Salvar, o request leva 400ms — o que a UI diz nesses 400ms e depois? O padrão é uma **máquina de estados no próprio botão**: `idle → loading → success|error → idle`. O botão vira o canal de feedback, no lugar exato pra onde o usuário está olhando — melhor que toast no canto oposto da tela.

```tsx
type Estado = 'idle' | 'loading' | 'success' | 'error';

// no submit:
setEstado('loading');
try {
  await salvar(dados);
  setEstado('success');          // "✓ Salvo" — verde, ícone, 100ms de transição
  setTimeout(() => setEstado('idle'), 2000);
} catch (e) {
  setEstado('error');            // erro COM contexto, não "algo deu errado"
}
```

Regras do padrão: botão `disabled` durante `loading` (mata duplo-submit — bug real, não estética); largura estável entre estados (`min-width`) pra não pular layout; `success` volta pra `idle` sozinho.

### Loading e ansiedade percebida

Espera **percebida** ≠ espera medida — e dá pra projetar a percebida:

- **Skeleton > spinner** para conteúdo com forma conhecida: mostra estrutura chegando, reduz incerteza. Spinner comunica só "algo roda", skeleton comunica "isto está vindo, deste tamanho, neste lugar".
- **Spinner com delay de exibição (~150–300ms)**: se o request resolve em 120ms, spinner que piscou é ruído. E se apareceu, segure um mínimo (~300ms) — flash de loading parece bug.
- **Progresso determinado > indeterminado** quando há como estimar: barra que anda reduz ansiedade mesmo com a MESMA duração real.
- **Anti-padrão que já vetamos em revisão AG**: skeleton animado sobre request que já falhou. Loading eterno é a pior mensagem de erro que existe. Fail-closed visual: erro tem estado próprio, com causa e ação (os 5 estados de tela: vazio/carregando/erro/parcial/cheio).

Verificação honesta: teste com o network de verdade, não só localhost. DevTools → Network → throttling "Slow 4G", e clique em Salvar. É aqui que aparece o spinner que pisca, o duplo-submit e o botão que pula — em localhost com 15ms de latência, nada disso se manifesta, e "testei e funciona" era falso.

## Por que cai em entrevista

Microinteração é a pergunta prática favorita ("me descreve o que acontece quando o usuário clica em salvar") porque expõe em 1 minuto se o candidato pensa em estados — loading, erro, duplo-clique, latência — ou só no caminho feliz. Júnior descreve o sucesso; pleno descreve a máquina de estados e os números de percepção.

> **P:** "O usuário clica em 'Salvar' e a API leva meio segundo. O que sua UI faz?"
>
> **R (30s):** "O botão vira a máquina de estados: no clique ele desabilita — isso mata duplo-submit — e mostra loading; no sucesso, vira '✓ Salvo' por uns 2 segundos e volta sozinho; no erro, mostra o quê e o porquê, não 'algo deu errado'. Feedback visual do press em menos de 100ms, que é o limiar de instantâneo. E eu testo com throttling de rede, porque em localhost o loading nem aparece — foi assim que peguei um duplo-submit num formulário de RH que em rede rápida nunca se manifestava."

## Checkpoint

- [ ] Sei os limiares 100ms / 1s / 10s e o que cada um exige da UI
- [ ] Todo botão de ação dos meus projetos tem os 4 estados (idle/loading/success/error)
- [ ] Sei justificar skeleton vs spinner e o delay mínimo de exibição
- [ ] Testei um fluxo de submit com throttling Slow 4G e corrigi o que apareceu
- [ ] Nenhum elemento interativo meu está sem estado de focus-visible

## Recursos

- [Nielsen Norman Group — Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Nielsen Norman Group — Progress Indicators](https://www.nngroup.com/articles/progress-indicators/) — determinado vs indeterminado
- Dan Saffer — *Microinteractions* (O'Reilly) — o livro que nomeou a disciplina
- [MDN — :focus-visible](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible)
- Rauno Freiberg — *Invisible Details of Interaction Design* (rauno.me)
