# 05 — Estados da Interface

> **Formato expandido (v2.1):** este módulo tem §BASE (o fundamento científico), §ESTRUTURAÇÃO
> (como o conhecimento se organiza) e §METODOLOGIA (o passo-a-passo replicável) — além da prática,
> P/R e checkpoint. Segue o padrão de `05-raciocinio/02-hipotese-e-refutacao` e do contrato `FORMATO-V2`.

## O que é

Toda tela que mostra dados existe em **cinco estados**, não em um: **vazio**, **carregando**, **erro**, **parcial** e **cheio** (ideal). Júnior desenha só o estado cheio e os outros quatro "acontecem" por acidente em produção. Profissional enumera os cinco ANTES de codar, porque quatro deles são os que o usuário real encontra primeiro. O framework dos 5 estados é de Scott Hurff (*The UI Stack*) — mas o *porquê* de cada estado importar tem raiz mais funda, na psicologia da ação de Don Norman. A §BASE mostra essa raiz.

## § BASE — o fundamento

**Os dois golfos (Norman, *The Design of Everyday Things*).** Don Norman, no cap. 2 de *The Design of Everyday Things* (1988; ed. rev. 2013), descreve toda interação humano-máquina como a travessia de dois golfos:

- **Golfo de execução:** a distância entre o que o usuário quer fazer e como fazê-lo com o sistema. ("Como conecto meu ERP? O que essa tela espera de mim?")
- **Golfo de avaliação:** a distância entre o que o sistema fez e o que o usuário consegue *entender* que aconteceu. ("Isso está carregando ou travou? Deu certo ou deu erro? Esse zero é real ou é falha?")

Os cinco estados **são pontes sobre o golfo de avaliação**. Uma tela que mostra só o estado cheio deixa o golfo aberto em todos os outros momentos: o usuário não sabe se está vazio-porque-novo ou vazio-porque-quebrado; se está lento ou morto; se o R$ 0 é verdade ou mentira. Cada estado bem-feito é uma **resposta explícita** à pergunta "o que está acontecendo agora?".

**Feedback e visibilidade do estado do sistema.** Norman insiste: **feedback** — a comunicação imediata do resultado de uma ação — é o que fecha o golfo de avaliação, e sua ausência é a causa raiz de sistemas que "parecem quebrados". Jakob Nielsen destilou isso na primeira das *10 Usability Heuristics* (1994): **"Visibility of system status"** — o sistema deve sempre manter o usuário informado sobre o que está acontecendo, com feedback em tempo razoável. **Declare a natureza:** as heurísticas de Nielsen são **heurísticas de praticante derivadas empiricamente** (de análise de centenas de problemas de usabilidade), não leis experimentais como Fitts ou Gestalt — mas são o vocabulário canônico do campo, e "visibilidade do estado do sistema" é o princípio que justifica os cinco estados de uma vez.

**Modelo conceitual e a mentira do zero silencioso.** Norman: o usuário opera por um **modelo conceitual** — a história que ele conta a si mesmo sobre como o sistema funciona. A interface é a única evidência que ele tem para construir esse modelo. Daí a regra mais dura deste módulo, que é fail-closed dos dashboards AG: **erro explícito é melhor que zero silencioso**. Se o fetch falhou e a tela mostra R$ 0, o dono do negócio lê "não vendi nada" — a interface **alimentou um modelo conceitual falso**. A tela não só falhou em informar; ela *desinformou ativamente*. Falhou → diga que falhou. Este é o ponto onde design encontra a regra anti-alucinação da casa (`05-raciocinio`): não afirme "zero" quando o que você tem é "não sei".

**Percepção de tempo (o lastro do skeleton).** Skeleton (blocos cinza pulsando na forma do conteúdo) reduz a *percepção* de espera e evita *layout shift* quando o dado chega — o esqueleto já reservou o espaço, fechando o golfo de avaliação ("está vindo, e vai ter esse formato"). Dois refinamentos com base em percepção de latência: (1) **atrasar o indicador ~200ms** — resposta rápida não deve piscar um spinner (o flash é pior que a ausência); (2) o skeleton deve ter a **mesma geometria** do conteúdo real, senão o shift volta e reabre o golfo.

## § ESTRUTURAÇÃO — como esse conhecimento se organiza

Os cinco estados não têm prioridade igual de renderização. A ordem dos `if` no código **é** a hierarquia de verdade — e ela segue a lógica do golfo de avaliação (informar a pior/mais decisiva verdade primeiro):

```
   fetch()
     │
     ▼
  ┌───────────────┐  error?  ──sim──►  ERRO  (msg humana + retry)   ◄ ponte prioritária
  │  qual estado? │                    "falhou → diga que falhou"
  └───────────────┘
     │ não
     ▼
   loading? ──sim──►  CARREGANDO (skeleton com geometria do conteúdo)
     │ não
     ▼
   data vazio? ──sim──►  VAZIO (mensagem + como obter dado + CTA)  ◄ primeira impressão
     │ não
     ▼
   PARCIAL (1–2 itens) ─── CHEIO (paginação/truncamento/virtualização)
```

**Vazio é a primeira impressão** (e onboarding): todo usuário novo encontra o produto vazio. Tela em branco comunica "produto quebrado ou abandonado" — golfo de avaliação escancarado. Um vazio bem-feito diz o que a área vai mostrar, como conseguir o primeiro dado e oferece o CTA. **Parcial e cheio** são os extremos que quebram layout testado só com seed "bonita": 1 item numa lista desenhada pra 50; 10.000 linhas sem virtualização; nome de 80 caracteres sem truncamento; número de 12 dígitos estourando o card.

Dependências: a densidade do estado cheio vem do **módulo 04**; a validação "vi renderizar" é a evidência-antes-de-pronto de `01-verificar-antes-de-afirmar`; a auditoria dos 5 estados é um eixo da crítica (**módulo 08**).

## § METODOLOGIA — o passo-a-passo replicável

**1. ENUMERE os 5 estados numa tabela ANTES de codar.** Para cada: o que mostra + como forçá-lo em dev. Enumerar é o que impede o "aconteceu por acidente".

**2. ORDENE os `if` por prioridade de verdade:** `error` → `loading` → `vazio` → `dados`. Erro vem primeiro porque um refetch que falha costuma manter `isLoading` falso e `error` preenchido — inverter esconde erro atrás de skeleton eterno.

**3. FAÇA o vazio ensinar.** Nunca tela em branco: mensagem + caminho para o primeiro dado + CTA. É a ponte do primeiro acesso.

**4. TORNE o erro acionável:** o que aconteceu (língua humana), o que fazer agora, o caminho (retry/voltar/suporte). Beco sem saída é o pior estado. **Nunca** zero silencioso.

**5. USE skeleton com geometria real** e atraso de ~200ms. Spinner só para tela inteira inicial.

**6. FORCE os 5 no DevTools e VEJA renderizar.** Só está pronto quando você observou os cinco — não quando o cheio compilou.

**Anti-padrões:**
- **Só o happy path:** os 4 estados que faltam são os que o usuário encontra primeiro.
- **Zero silencioso:** interface que mente sobre falha, alimentando modelo conceitual falso (Norman).
- **`isLoading` antes de `error`:** skeleton eterno escondendo erro.
- **Skeleton de geometria errada:** o layout shift volta quando o dado chega.
- **Seed "bonita":** testar só com dado ideal esconde os estados parcial e cheio extremo.

### Passo a passo aplicado: tabela de estados + forçar cada um (faça agora, ~25min)

Caso real AG: num dashboard alimentado por sync de **ERP-externo**, o primeiro acesso acontece **antes** da primeira varredura terminar — a tela precisa dizer "sincronizando com o ERP, primeiros dados em instantes", porque a alternativa é mostrar zeros que parecem dados reais (golfo de avaliação → modelo conceitual falso).

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

"O que você considera ao construir um componente de listagem?" é pergunta clássica justamente porque a resposta revela maturidade: quem descreve só o happy path nunca sustentou código em produção; quem enumera os cinco estados — e sabe que o vazio é onboarding e que erro silencioso mente — já apanhou de usuário real. Ligar isso ao golfo de avaliação de Norman mostra que você entende o *princípio*, não só a checklist.

> **P:** "O design te entregou só a tela com dados. O que você faz?"
>
> **R (30s):**
> "Enumero os cinco estados antes de codar: vazio, carregando, erro, parcial e cheio. O vazio é o mais crítico — é a primeira impressão de todo usuário novo; num dashboard com sync de ERP que fiz, o primeiro acesso acontece antes da primeira sincronização, então a tela diz 'sincronizando' em vez de mostrar zeros que parecem dado real. Carregando é skeleton com a geometria do conteúdo pra evitar layout shift. Erro é acionável, com retry — e nunca zero silencioso, porque zero silencioso mente. Aí forço cada estado no DevTools antes de dar como pronto."

> **P:** "Por que mostrar 'erro' é melhor que mostrar zero quando o fetch falha?"
>
> **R (30s):**
> "Porque a interface é a única evidência que o usuário tem pra construir o modelo mental do sistema — é o golfo de avaliação do Norman. Se o fetch falha e eu mostro R$ 0, o dono lê 'não vendi nada': eu não só falhei em informar, eu desinformei ativamente, alimentei um modelo falso. Zero silencioso é a interface mentindo. A regra é fail-closed: falhou, diga que falhou, com uma mensagem humana e um retry. É a mesma disciplina anti-alucinação que eu uso em código — não afirmar 'zero' quando o que eu tenho é 'não sei se carregou'. E ordeno o `if (error)` antes do `if (isLoading)` justamente pra não esconder a falha atrás de um skeleton eterno."

## Checkpoint

- [ ] Sei nomear os 5 estados e ligar cada um ao golfo de avaliação de Norman
- [ ] Sei explicar por que "erro explícito > zero silencioso" em termos de modelo conceitual
- [ ] Escrevi a tabela de estados de um componente ANTES de codar
- [ ] Forcei os 5 estados de um componente real (offline, throttle, seed vazia/gigante) e VI renderizar
- [ ] Meu estado de erro tem retry e nenhum beco sem saída; meu vazio ensina (CTA)
- [ ] Sei explicar por que `if (error)` vem antes de `if (isLoading)` no meu código

## Recursos

- *The Design of Everyday Things* — Don Norman (1988; rev. 2013), cap. 2 "The Psychology of Everyday Actions": golfos de execução e avaliação, feedback, modelo conceitual — a raiz dos 5 estados
- *10 Usability Heuristics for User Interface Design* — Jakob Nielsen (1994), heurística #1 "Visibility of system status": o princípio que justifica os estados (heurística de praticante, declarada)
- *The UI Stack* — Scott Hurff (também em *Designing Products People Love*): o framework que nomeou os 5 estados (praticante)
- *Refactoring UI* — Wathan & Schoger, cap. "Finishing Touches": empty states como oportunidade de onboarding
- Módulo `01-verificar-antes-de-afirmar` (trilha 05): evidência antes de "pronto" — ver os 5 estados renderizarem
