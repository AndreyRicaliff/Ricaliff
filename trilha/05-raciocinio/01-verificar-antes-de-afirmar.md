# 01 — Verificar Antes de Afirmar

## O que é

A diferença mais mensurável entre júnior e sênior não é conhecimento — é a taxa de afirmações falsas. "Funciona", "corrigido", "deployado", "o banco tem essa coluna" são afirmações verificáveis; sênior só as faz depois de verificar, e quando não verificou, diz isso. O termo é **evidence-based engineering**: toda afirmação sobre o estado de um sistema carrega um de três selos — **verificado** (rodei E li o output), **acredito** (tenho base, não tenho prova), **não sei**. Inflar um selo no outro é o bug mais caro que existe.

O caso clássico: **Knight Capital (2012)**. Deploy de código novo em 8 servidores; o técnico esqueceu 1 dos 8. Ninguém verificou que o deploy chegou em todos — assumiram. O servidor com código velho reativou uma flag antiga e a firma perdeu **US$ 440 milhões em 45 minutos**. A empresa quebrou. O erro não foi o código — foi afirmar "deployado" sem prova. Mesmo padrão na **Mars Climate Orbiter (1999)**: ninguém verificou a suposição de unidade (newton vs libra-força) entre dois times; a sonda de US$ 327 milhões desintegrou em Marte.

### Os três selos

| Selo | Critério | Frase honesta |
|---|---|---|
| Verificado | Rodei o comando/teste E li o output | "Rodei X, o output mostra Y" |
| Acredito | Tenho base (doc, experiência) sem prova nesta instância | "Acredito que sim, pela doc — não confirmei aqui" |
| Não sei | Sem base suficiente | "Não sei. Verifico em N min fazendo X" |

"Não sei" e "não verifiquei" são respostas profissionais. Amador é a confiança artificial — porque quem ouve toma decisão em cima dela.

### A prova mínima

Prova mínima = o menor experimento que transforma "acho" em "sei": rodar o código, um `curl` no endpoint, um `select` no banco, ler o log. Regra: se a prova custa < 2 minutos, ela é obrigatória antes de afirmar.

### Passo a passo: provar um fix de sync (CLIENTE OFICINA)

Fix na edge function que sincroniza o ERP-externo. Antes de dizer "resolvido":

```bash
# 1. O deploy realmente subiu? (não assumir — Knight Capital)
npx supabase functions list --project-ref $PROJ
#    ler a coluna VERSION e o updated_at da função

# 2. A função executa e responde 200?
curl -s -i -X POST "$SUPABASE_URL/functions/v1/sync-erp" \
  -H "Authorization: Bearer $ANON_KEY"

# 3. O dado mudou no banco? (a prova final é o ESTADO, não o log)
#    select count(*), max(updated_at) from pedidos_erp;

# 4. Só agora: "verificado — sync rodou às HH:MM, 132 linhas,
#    max(updated_at) de hoje"
```

### Quando ler código engana

Caso real AG: a animação de um deck 3D "estava certa no código" — mas em máquina acessada via RDP o Windows força `prefers-reduced-motion` e a animação congela. Duas vezes o "funciona" foi afirmado lendo código; a verdade só apareceu lendo `matchMedia('(prefers-reduced-motion: reduce)').matches` **em runtime**. Código descreve intenção; só runtime descreve realidade.

## Por que cai em entrevista

Entrevistador experiente testa isso de propósito: faz uma pergunta cuja resposta você não sabe e observa se você inventa. Quem responde "não sei, mas verificaria assim" ganha ponto duplo — honestidade + método. Quem inventa e é pego perde a entrevista inteira, porque toda resposta anterior entra sob suspeita.

> **P:** "Como você sabe que o seu fix realmente resolveu o bug?"
>
> **R (30s):** "Só digo 'resolvido' com três provas: reproduzi o bug antes do fix, rodei a mesma reprodução depois e li o output mudar, e conferi o estado final no alvo certo — banco, não log; prod, não local. Se não deu tempo de rodar, falo 'implementei mas não verifiquei' — é informação diferente de 'resolvido', e quem decide o deploy precisa saber a diferença. O custo de assumir tem caso famoso: a Knight Capital perdeu 440 milhões de dólares em 45 minutos por um 'deployado' sem prova."

## Checkpoint

- [ ] Sei enunciar os três selos e usei os três em frases reais esta semana
- [ ] Respondi "não sei" pelo menos 1x sem completar com chute
- [ ] Provei um fix com a sequência reproduzir → rodar → ler output → conferir estado
- [ ] Sei contar Knight Capital em 30s como argumento pró-verificação
- [ ] Me peguei chamando leitura de código de "testado" — e corrigi para "acredito"

## Recursos

- SEC — ordem administrativa sobre a Knight Capital (2013) — buscar "SEC Knight Capital order 2013"
- NASA — Mars Climate Orbiter Mishap Investigation Board Report (1999)
- Debugging: The 9 Indispensable Rules — David J. Agans (regra-chave: "Quit thinking and look")
- [wizardzines.com](https://wizardzines.com/) — zines de debugging da Julia Evans, mindset de evidência
