# 05 — Estados da Interface

## O que é

Toda tela que mostra dados existe em **cinco estados**, não em um: **vazio**, **carregando**, **erro**, **parcial** e **cheio** (ideal). O framework é o *UI Stack* de Scott Hurff. Júnior desenha só o estado cheio e os outros quatro "acontecem" por acidente em produção. Profissional enumera os cinco ANTES de codar, porque quatro deles são os que o usuário real encontra primeiro.

**Vazio é a primeira impressão.** Todo usuário novo encontra o produto vazio — zero pedidos, zero relatórios. Tela em branco comunica "produto quebrado ou abandonado". O estado vazio bem-feito é onboarding: diz o que essa área vai mostrar, como conseguir o primeiro dado e oferece o CTA. Caso real AG: num dashboard alimentado por sync de ERP-externo, o primeiro acesso acontece ANTES da primeira varredura terminar — a tela precisa dizer "sincronizando com o ERP, primeiros dados em instantes", porque a alternativa é mostrar zeros que parecem dados reais.

**Carregando: skeleton > spinner.** Skeleton (blocos cinza pulsando na forma do conteúdo) reduz percepção de espera e evita layout shift quando o dado chega — o esqueleto já reservou o espaço. Spinner centralizado é aceitável só para tela inteira inicial. Dois refinamentos: (1) atrasar o indicador ~200ms — resposta rápida não deve piscar um spinner; (2) skeleton deve ter a MESMA geometria do conteúdo real, senão o shift volta.

**Erro deve ser acionável:** o que aconteceu (em língua humana), o que fazer agora, e o caminho (retry, voltar, suporte). Beco sem saída é o pior estado possível. E a regra fail-closed dos dashboards AG: **erro explícito é melhor que zero silencioso**. Se o fetch falhou e a tela mostra R$ 0, o dono do negócio lê "não vendi nada" — a interface mentiu. Falhou → diga que falhou.

**Parcial:** 1 item numa lista desenhada pra 50, gráfico com 2 pontos, nome curto onde caberia longo. **Cheio:** o oposto — 10.000 linhas (paginação/virtualização), nome de 80 caracteres (truncamento com title), número de 12 dígitos estourando o card. Os dois quebram layouts testados só com seed "bonita".

### Passo a passo: tabela de estados + forçar cada um

```text
Antes de codar um componente de dados, preencha:

| Estado     | O que mostra                       | Como forçar no dev        |
|------------|------------------------------------|---------------------------|
| Vazio      | mensagem + como obter dados + CTA  | tenant novo / tabela vazia|
| Carregando | skeleton na geometria do conteúdo  | DevTools > Network > Slow |
| Erro       | msg humana + retry                 | DevTools > Offline        |
| Parcial    | layout com 1–2 itens               | seed com 1 registro       |
| Cheio      | paginação/truncamento              | seed com 500+ registros   |
```

```tsx
// A ordem dos ifs É a hierarquia de verdade dos estados:
if (error) return <ErrorState onRetry={refetch} />;   // erro > tudo
if (isLoading) return <TableSkeleton rows={8} />;
if (!data?.length) return <EmptyState cta="Conectar ERP" />;
return <Table data={data} />;                          // parcial e cheio
```

O raciocínio importa mais que o snippet: `error` vem antes de `isLoading` porque um refetch que falha costuma manter `isLoading` falso e `error` preenchido — inverter a ordem esconde erro atrás de skeleton eterno. Isso é hipótese verificável: force offline e observe qual branch renderiza. **Evidência antes de "pronto"**: o componente só está pronto quando você VIU os cinco estados renderizados, não quando o estado cheio compilou.

## Por que cai em entrevista

"O que você considera ao construir um componente de listagem?" é pergunta clássica justamente porque a resposta revela maturidade: quem descreve só o happy path nunca sustentou código em produção; quem enumera os cinco estados — e sabe que o vazio é onboarding e que erro silencioso mente — já apanhou de usuário real.

> **P:** "O design te entregou só a tela com dados. O que você faz?"
>
> **R (30s):**
> "Enumero os cinco estados antes de codar: vazio, carregando, erro, parcial e cheio. O vazio é o mais crítico — é a primeira impressão de todo usuário novo; num dashboard com sync de ERP que fiz, o primeiro acesso acontece antes da primeira sincronização, então a tela diz 'sincronizando' em vez de mostrar zeros que parecem dado real. Carregando é skeleton com a geometria do conteúdo pra evitar layout shift. Erro é acionável, com retry — e nunca zero silencioso, porque zero silencioso mente. Aí forço cada estado no DevTools antes de dar como pronto."

## Checkpoint

- [ ] Sei nomear os 5 estados e dar um exemplo concreto de cada num app meu
- [ ] Escrevi a tabela de estados de um componente ANTES de codar
- [ ] Forcei os 5 estados de um componente real (offline, throttle, seed vazia/gigante)
- [ ] Meu estado de erro tem retry e nenhum beco sem saída
- [ ] Sei explicar por que `if (error)` vem antes de `if (isLoading)` no meu código

## Recursos

- *The UI Stack* — Scott Hurff; o artigo/capítulo que nomeou os 5 estados (também no livro *Designing Products People Love*)
- [Refactoring UI](https://www.refactoringui.com/) — seção sobre empty states como oportunidade
- Empty States (galeria emptystat.es) — catálogo de estados vazios reais pra referência
- [Tailwind CSS docs](https://tailwindcss.com/docs) — `animate-pulse` pronto pra skeleton
