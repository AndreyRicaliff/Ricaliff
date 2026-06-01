# 02 — Decisões em primeira pessoa

## Tese

O Claude pode escrever código por você, mas não pode ter o histórico das suas decisões. `DECISIONS.md` em cada projeto, datado, em primeira pessoa, é prova viva de que você pensou — e não só digitou prompt. Em entrevista, o que separa júnior de pleno não é o código na tela: é a capacidade de dizer "escolhi X porque Y, considerei Z, me arrependo de W". Quem só tem código tem nada. Quem tem decisões tem portfólio real.

---

## Por que isso te diferencia

Código envelhece. Decisões datadas mostram evolução. Um `DECISIONS.md` com entrada de janeiro e outra de junho, onde você mudou de opinião com razão, vale mais que 100 commits bem formatados. Recrutador de empresa séria pergunta "me conta uma escolha técnica que você tomou". Quem não tem historial próprio improvisa — e improviso sem base é detectado em 10 segundos.

Além disso: decisão datada em primeira pessoa é **diferenciável**. Claude não tem data, não tem "eu", não tem "o cliente reclamou de Y". Você tem. Use isso.

---

## Rotina/Método/Hábito

**Regra:** todo PR ou feature não-trivial vira entrada em `DECISIONS.md` do projeto. Não precisa ser longa. Precisa ser sua.

**Estrutura de uma entrada:**

```markdown
## 2026-06-01 — [título curto da decisão]

**Contexto:** o que estava acontecendo quando precisei decidir
**Opções consideradas:** X, Y, Z
**Escolha:** X
**Por quê:** [razão real, não teórica — idealmente inclui restrição de tempo, cliente, infra]
**Trade-off aceito:** [o que perdi ao escolher X]
**Revisão futura:** [quando faria diferente / o que observar]
```

**Anti-pattern a evitar:**
Copiar template do Claude e colar como decisão. Claude não sabe que o cliente de CLIENTE OFICINA ligou às 22h reclamando de dados atrasados. Você sabe. A decisão de fazer sync incremental a cada 5min com janela de 2 dias — essa escolha tem contexto que só você tem.

**Regra de ouro:** se a entrada não tiver "eu" ou "nós" e não citar restrição real, não é decisão — é documentação técnica genérica.

---

## Exercícios

**Por PR/feature:**
Antes de fechar o PR, abrir o `DECISIONS.md` do projeto e adicionar 1 entrada se a decisão foi não-trivial. Definição de não-trivial: se você hesitou mais de 5 minutos, vale registrar.

**Exercício de revisão (uma vez):**
Revisar 1 projeto AG e adicionar 3 entradas RETROATIVAS. Reconstruir com Claude se precisar lembrar os fatos — mas escrever em primeira pessoa, com o que VOCÊ pensou. Projetos candidatos: PULSAR-RH, CLIENTE OFICINA, Meet Hub.

Exemplo de entrada retroativa válida:
> "2026-05-08 — Sync incremental no OFICINA: escolhi janela de 2 dias porque o cliente tinha histórico de não perceber dado faltante por até 48h. Considerei 7 dias mas o volume de registro Firebird era grande demais pra rodar em background sem travar."

**Semanal:**
Revisar a última decisão registrada e adicionar campo "Revisão" se já passou 1 semana — mudou alguma coisa? Estava certo?

---

## Pergunta de entrevista esperada + resposta exemplar

**"Me conta uma decisão técnica que você se arrepende."**

Resposta recitável em 30s:
> "No PULSAR-RH deixei lógica de agrupamento de resultados em O(n*m) porque funcionava no volume inicial. Quando o número de respondentes cresceu, ficou lento. Devia ter mapeado por ID desde o início — O(n). Anotei no DECISIONS.md depois de corrigir pra não repetir o padrão."

O que o recrutador escuta: você analisa complexidade, você registra aprendizado, você não repete o erro. Três sinais de pleno num parágrafo.

**"Uma escolha que parecia errada e deu certo."**

Resposta recitável em 30s:
> "Escolhi Supabase em vez de banco próprio pro PULSAR-RH sendo que o cliente queria controle total. Parecia errado ceder no argumento técnico. Mas a velocidade de entrega e o RLS pronto economizaram 3 semanas de trabalho que usamos em feature. Cliente nunca mais questionou."

---

## Checkpoint

- [ ] PULSAR-RH tem `DECISIONS.md` com >=3 entradas datadas em primeira pessoa
- [ ] CLIENTE OFICINA tem `DECISIONS.md` com >=3 entradas datadas em primeira pessoa
- [ ] Meet Hub tem `DECISIONS.md` com >=3 entradas datadas em primeira pessoa
- [ ] Cliente Varejo tem `DECISIONS.md` com >=2 entradas
- [ ] AG Converge tem `DECISIONS.md` com >=2 entradas
- [ ] Café com AG tem `DECISIONS.md` com >=1 entrada
- [ ] AG Hub tem `DECISIONS.md` com >=2 entradas
- [ ] IFPB tem `DECISIONS.md` com >=1 entrada
- [ ] Consigo contar oralmente 2 decisões técnicas reais com contexto, trade-off e resultado
- [ ] Última entrada em qualquer DECISIONS.md foi há menos de 2 semanas

---

## Recursos

- Architecture Decision Records (ADR) — formato padrão de mercado, pesquisar "Michael Nygard ADR"
- "A Philosophy of Software Design" (John Ousterhout) — cap. sobre decisões de design
- Seus próprios projetos AG — fonte primária, não tem recurso melhor que o histórico real
