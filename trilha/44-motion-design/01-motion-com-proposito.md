# 01 — Motion com Propósito

## O que é

Motion design em interface é **comunicação com dimensão temporal**, não decoração. Uma animação bem colocada responde perguntas que layout estático não consegue: *de onde isso veio?* (orientação), *minha ação funcionou?* (confirmação), *este produto é cuidado?* (encantamento). A herança teórica vem dos 12 princípios da Disney (Frank Thomas e Ollie Johnston, *The Illusion of Life*, 1981) — squash & stretch, antecipação, follow-through — mas UI usa um subconjunto pragmático deles, com restrições que cinema não tem: o usuário está no controle, tem pressa, e vai repetir a mesma interação 200 vezes.

Os três propósitos, em ordem de prioridade:

1. **Orientar** — mostrar relação espacial e causal. O modal que cresce a partir do botão que o abriu explica *de onde veio*; o item que desliza pra fora da lista explica *pra onde foi*. Sem isso, elementos teleportam e o usuário reconstrói o modelo mental na força bruta.
2. **Confirmar** — feedback de que a ação aconteceu. O limiar de percepção de "instantâneo" é **~100ms** (Nielsen Norman Group, *Response Times: The 3 Important Limits*); acima disso sem feedback, o usuário clica de novo — e duplica a ação.
3. **Encantar** — o efeito wow. É legítimo (intro de deck, primeira impressão de landing), mas é o único propósito que **satura**: encanta na 1ª vez, irrita na 20ª. Parcimônia: encantamento em momentos raros (boot, conquista, entrega), nunca em fluxo de trabalho repetitivo.

### Motion como hierarquia temporal

Tamanho, cor e posição criam hierarquia **espacial** — o que é mais importante é maior/mais contrastado. Ordem e duração criam hierarquia **temporal**: o que entra primeiro é lido primeiro; o que se move enquanto o resto está parado captura atenção. Isso é uma ferramenta de direção de olhar tão poderosa quanto tipografia — e igualmente perigosa: movimento sem propósito rouba atenção do que importa. Atenção visual é serial; cada animação simultânea compete pela mesma.

### Quando NÃO animar

- **Ação de alta frequência**: quem filtra uma tabela 50×/dia não pode esperar 300ms de transição a cada filtro. Dashboards densos (padrão dos painéis comerciais AG) pedem motion quase zero no miolo de trabalho.
- **Dado crítico chegando**: número de venda atualizando não precisa de fade — precisa aparecer.
- **Quando o motion mente**: skeleton animado sobre request que já falhou é confirmação falsa. Pior que nada.
- **Quando o usuário pediu pra reduzir**: `prefers-reduced-motion` (módulo 07 — inclusive a exceção RDP que já nos queimou).

### Passo a passo: auditoria de motion num deck AG

Aplicado aos decks de apresentação (HTML único, vanilla JS — caso real da AG):

```bash
# 1. Inventariar tudo que se move no arquivo
grep -nE "animation:|transition:|@keyframes|requestAnimationFrame" apresentacao.html
```

```text
# 2. Pra CADA ocorrência, classificar numa tabela: orienta | confirma | encanta | nenhum
#    Hipótese default: "essa animação não serve pra nada" — o ônus da prova é dela.
# 3. "nenhum" → deletar. Ex. clássico: pulse infinito num card KPI
#    (rouba atenção do número, não comunica nada).
# 4. "encanta" em elemento repetitivo → rebaixar pra 1ª ocorrência só
#    (intro roda uma vez; navegação entre slides fica sóbria).
# 5. Reabrir e comparar: se ninguém sente falta, a animação era ruído. Evidência > gosto.
```

Esse é o raciocínio sênior do domínio inteiro: **animação é culpada até provar propósito** — o inverso do instinto júnior de "deixar mais vivo".

## Por que cai em entrevista

Motion é onde entrevistador de front separa quem copia Dribbble de quem pensa produto. A pergunta nunca é "sabe animar?" — é "sabe **quando não** animar?". Júnior mostra efeito; pleno defende o critério de corte e cita o custo de atenção e o limiar de 100ms.

> **P:** "Quando você decide adicionar ou remover uma animação de uma interface?"
>
> **R (30s):** "Eu classifico por propósito: orientar, confirmar ou encantar. Se não faz nenhum dos três, removo — animação sem propósito rouba atenção, e atenção é serial. Confirmação de ação precisa chegar em menos de 100ms ou o usuário clica de novo. Encantamento eu reservo pra momentos raros, tipo intro de apresentação — nos dashboards de trabalho que fiz pra clientes, o miolo é quase estático de propósito, porque quem usa 50 vezes por dia não pode pagar 300ms por clique."

## Checkpoint

- [ ] Sei citar os 3 propósitos de motion e dar um exemplo de cada num projeto AG
- [ ] Sei explicar o limiar de 100ms e de quem é (NNg) sem consultar
- [ ] Rodei o grep de inventário num deck real e classifiquei cada animação
- [ ] Removi (ou justifiquei por escrito) pelo menos uma animação sem propósito
- [ ] Consigo explicar "hierarquia temporal" em uma frase

## Recursos

- [Nielsen Norman Group — Response Times: The 3 Important Limits](https://www.nngroup.com/articles/response-times-3-important-limits/)
- [Material Design — Motion](https://m3.material.io/styles/motion/overview) — o guideline de propósito mais maduro da indústria
- *The Illusion of Life* (Thomas & Johnston) — origem dos 12 princípios; o resumo "12 principles of animation" na Wikipedia basta
- Rauno Freiberg — *Invisible Details of Interaction Design* (rauno.me) — craft de motion com critério
- Val Head — *Designing Interface Animation* (livro, A Book Apart)
