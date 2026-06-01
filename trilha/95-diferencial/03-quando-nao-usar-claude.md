# 03 — Quando não usar Claude

## Tese

Claude é cadeira de rodas — usa todo dia e perde a perna. Tem horas em que você tem que andar no pé, mesmo sendo mais devagar, mesmo doendo. Não porque a cadeira seja ruim — ela é excelente. Mas porque perna atrofia quando não usa, e você vai precisar dela quando a cadeira não estiver disponível, e no dia que mais importar: entrevista, problema de produção às 3h, reunião sem computador. Quem nunca treina sem IA não perde gradualmente — perde de vez, sem perceber.

---

## Por que isso te diferencia

Entrevistador sênior percebe quando candidato trava sem autocompletar. Não é teoria. Em live coding, a primeira hesitação longa diz mais que 30 minutos de execução fluida. Quem treina sem IA chega com vocabulário, digita com ritmo, hipoteciza em voz alta. Quem não treina fica olhando pra tela.

Além disso: debug sem IA treina hipotetizar. Debug com IA treina pedir. São habilidades opostas. A segunda tem validade de 18 meses enquanto o modelo melhorar. A primeira dura a carreira inteira.

---

## Rotina/Método/Hábito

**Regras de quando NÃO usar Claude:**

| Situação | Por que não usar | O que fazer |
|---|---|---|
| Algoritmo de treino | Uso mata o aprendizado | Implementar, travar, tentar, só então abrir |
| Debug — primeiros 20min | Você precisa aprender a hipoteizar | Anotar hipóteses, testar uma a uma, chamar Claude como último recurso |
| Ler código de outros | Claude resume — você precisa entender | Ler linha a linha, comentar mentalmente, só perguntar o que não entendeu após 10min |
| Escrever testes | Testes ensinam onde o código pode quebrar | Você precisa pensar nos casos extremos, não o Claude |
| 1ª implementação de conceito novo | Claude vai dar solução antes de você entender o problema | Implementar torto primeiro. Depois pede review. |

**A hora sagrada — protocolo diário:**

1 hora por dia sem nenhuma IA. Sem Claude, sem Copilot, sem ChatGPT. Pode usar documentação estática (MDN, docs oficiais sem chat).

Não precisa ser consecutiva se sua rotina não permite — 2 blocos de 30min funciona. O que não funciona é pular.

Registrar diariamente no arquivo `_sem-ia.md` do projeto atual ou no geral em `~/projetos/estudos/trilha/95-diferencial/_sem-ia.md`:

```markdown
## 2026-06-01
- Hora: 09:00–10:00
- O que fiz: implementei debounce do zero, travei no tipo genérico
- O que aprendi: ReturnType<typeof setTimeout> é necessário pra compatibilidade cross-env
- O que não consegui sem IA: escrever o tipo genérico correto — pesquisei na documentação TypeScript
```

---

## Exercícios

**Diário:**
1 hora sagrada. Registrar em `_sem-ia.md`.

**Semanal:**
1 LeetCode Easy ou Medium, primeiro round sem IA. Após tentativa (mesmo errada), abrir Claude e pedir review do raciocínio — não da solução. Diferença importante: "meu raciocínio faz sentido?" vs "me dá a resposta".

**Mensal:**
1 dia inteiro de coding sem Claude. Registrar:
- O que travou
- Quanto tempo perdeu
- O que aprendeu sobre suas lacunas reais
- O que vai estudar na próxima semana por causa disso

Este exercício vai ser desconfortável. É o ponto.

---

## Pergunta de entrevista esperada + resposta exemplar

**"Como você programa quando o Claude está fora? O que você não consegue fazer?"**

Essa pergunta existe. Recrutador técnico faz isso pra ver se você tem consciência das suas lacunas ou vai fingir que é autossuficiente.

Resposta honesta e que passa:
> "Fico mais lento em boilerplate e em sintaxe que não uso todo dia. Mas algoritmo, debug e decisão de design faço sem IA — treino isso deliberadamente porque sei que é onde a muleta machuca. Tenho registro das minhas horas sem IA e consigo dizer exatamente onde ainda trava."

O que não passa:
> "Consigo fazer tudo tranquilo" — entrevistador não acredita e você perdeu credibilidade.
> "Fico perdido, preciso muito do Claude" — honesto mas você eliminou a si mesmo.

O que diferencia a resposta boa: consciência + evidência de treino intencional.

---

## Checkpoint

- [ ] `_sem-ia.md` existe com entradas de pelo menos 3 semanas diferentes
- [ ] Fiz >=1 dia inteiro sem Claude e documentei
- [ ] Fiz >=10 LeetCode Easy/Medium com primeiro round sem IA
- [ ] Consigo debugar um erro de TypeScript sem abrir Claude nos primeiros 20min
- [ ] Consigo ler código de projeto desconhecido por 30min e montar hipótese do que faz
- [ ] Sei responder honestamente "o que você não consegue sem IA" com exemplos reais
- [ ] Hora sagrada virou hábito — não é esforço, é rotina

---

## Recursos

- Exercism.io com mentor humano (sem hint de IA)
- LeetCode sem IDE integrado (modo texto puro)
- "A Mind for Numbers" (Barbara Oakley) — como o cérebro aprende com dificuldade
- Pomodoro Technique — estrutura pra 25min de foco sem distração
