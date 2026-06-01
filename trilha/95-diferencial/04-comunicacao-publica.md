# 04 — Comunicação pública

## Tese

Reputação técnica é construída fora da entrevista. Quem só aparece quando manda CV chega tarde — a vaga foi preenchida por indicação de alguém que o recrutador já conhecia pelo GitHub, pelo LinkedIn, ou por uma talk. Você não está competindo só com quem sabe codar: está competindo com quem sabe codar E aparece. Se o seu trabalho é privado, ele não existe para o mercado. Visibilidade não é vaidade — é infraestrutura de carreira.

---

## Por que isso te diferencia

Você já tem projetos reais: PULSAR-RH, CLIENTE OFICINA, Meet Hub, AG Converge. A maioria dos júniores tem projetos tutoriais genéricos. Você tem diferencial — mas ele está invisível. Um README sério em PULSAR-RH, publicado, com o problema que resolve e as decisões técnicas, vale mais que 10 repos de "todo list" com estrela.

LinkedIn técnico com posts reais — bug que você resolveu, decisão que você tomou — chega antes do currículo. Recrutador que viu seu post já chega na entrevista sabendo que você pensa.

---

## Rotina/Método/Hábito

**Plataformas priorizadas:**

### 1. GitHub público (base de tudo)

Três repos públicos com README sério, pinados no perfil. Candidatos imediatos:
- **PULSAR-RH** — SaaS de People Analytics real, com cliente real
- **CLIENTE OFICINA** — migração Firebird → Supabase, problema técnico não-trivial
- **Meet Hub** — plataforma própria de gravação/transcrição, com teste end-to-end

README mínimo para ser sério:
```markdown
# Nome do Projeto

Uma frase do que resolve e pra quem.

## O problema
[Contexto real — não "é um sistema de gestão"]

## Decisões técnicas
[2-3 bullet points das escolhas que você fez e por quê]

## Stack
[Com razão de cada escolha, não só lista]

## Como rodar
[Funciona de verdade]
```

### 2. LinkedIn técnico (1 post/semana)

Template de 4 linhas que funciona:
```
Linha 1: Problema concreto (sem "feliz em compartilhar")
Linha 2: O que tentei e não funcionou
Linha 3: O que funcionou
Linha 4: O que aprendi — 1 frase
```

Exemplo real:
```
O sync do CLIENTE OFICINA ficava travado quando os dados do Firebird vinham com timestamp inconsistente.
Tentei validar no arrival — não adiantou porque o problema era na janela de overlap.
Resolvi com lockfile + retry com backoff exponencial.
Aprendi: sync incremental sem controle de idempotência é só questão de tempo pra duplicar dado.
```

Não escrever sobre:
- Certificados
- "Orgulhoso de anunciar"
- Conteúdo motivacional
- Repost de artigo sem opinião própria

### 3. Talks e meetups

IFPB tem eventos. AG Consultoria tem audiência. Apresentar uma vez para 10 pessoas vale mais que 100 horas de estudo privado — porque você é obrigado a organizar o pensamento pra explicar.

Formato de entrada: 15-20min sobre problema real que você resolveu. Não tutorial — problema, tentativas, solução, aprendizado.

Candidatos de talk com material pronto:
- "Como migrei um banco Firebird para Supabase sem parar a operação" (OFICINA)
- "O(n*m) em produção: como um loop dentro de loop derrubou a performance do PULSAR-RH"
- "Autenticação multi-portal sem conflito de sessão" (PULSAR-RH)

### 4. Open source contribution

1 PR mergeado em projeto com >1k stars antes de buscar emprego pleno. Não precisa ser feature — bug fix, melhoria de documentação, teste que faltava. O que importa é ter feito.

Como encontrar: `good first issue` no GitHub, `up-for-grabs.net`, repositórios que você usa nos projetos AG (Supabase, Drizzle, etc).

---

## Exercícios

**Semanal:**
- 1 post LinkedIn seguindo o template de 4 linhas
- 1 commit em repo público (não pode ser só update de README)
- 1 README revisado ou iniciado

**Mensal:**
- 1 issue ou PR aberto em projeto open source
- Revisar os 3 repos pinados no GitHub — ainda estão atualizados?

---

## Pergunta de entrevista esperada + resposta exemplar

**"Você tem alguma presença técnica online?"**

Resposta que passa:
> "Tenho 3 repos públicos no GitHub com projetos reais — um SaaS de People Analytics, uma migração de banco Firebird para Supabase, e uma plataforma de transcrição. Posto semanalmente no LinkedIn sobre problemas reais que resolvo. Apresentei uma vez no [evento] sobre [tema]. Aqui está o link."

O que diferencia: links reais, problemas reais, apresentação presencial. Nenhum júnior comum tem tudo isso.

---

## Checkpoint

- [ ] 3 repos públicos com README sério no GitHub, pinados no perfil
- [ ] 12 posts LinkedIn publicados em 12 semanas (1/semana)
- [ ] 0 posts com "feliz em compartilhar" ou conteúdo motivacional
- [ ] 1 PR mergeado em projeto open source com >1k stars
- [ ] 1 talk apresentada (IFPB, meetup, evento AG, ou gravada e publicada)
- [ ] GitHub profile README existe e está atualizado
- [ ] Todos os 3 repos pinados têm `DECISIONS.md`
- [ ] Último post foi há menos de 7 dias

---

## Recursos

- "Show Your Work" (Austin Kleon) — filosofia de aprendizado público
- GitHub Explore — encontrar projetos para contribuir
- up-for-grabs.net — issues marcadas para contribuição de novatos
- Speakerdeck.com — ver como talks técnicas são estruturadas
