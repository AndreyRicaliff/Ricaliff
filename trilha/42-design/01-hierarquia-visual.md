# 01 — Hierarquia Visual

## O que é

Hierarquia visual é o controle deliberado da ordem em que o olho percorre a tela, usando quatro alavancas: **tamanho**, **peso**, **cor/contraste** e **espaço**. Sem hierarquia, todos os elementos gritam no mesmo volume e o usuário paga o custo cognitivo de decidir onde olhar. Com hierarquia, a tela responde "o que importa aqui?" antes da pergunta ser feita.

Base empírica: o Nielsen Norman Group documentou com eye-tracking (2006, revalidado em 2017) o **padrão em F** — em conteúdo denso, o olho varre duas faixas horizontais no topo e depois desce pela margem esquerda. Consequência prática: o título e o primeiro bloco à esquerda carregam quase todo o peso da tela; o canto inferior direito é quase invisível. Corolário: **o que importa vai no topo e à esquerda**, e parágrafos longos não são lidos — são escaneados.

A regra que separa amador de profissional: **um ponto focal por tela**. Dois elementos disputando o peso máximo = nenhum ponto focal. É por isso que dashboard bem-feito tem UM número-mestre em destaque (hero card) e o resto em segundo plano — não seis KPIs do mesmo tamanho.

### As quatro alavancas, em ordem de força

1. **Tamanho** — a mais óbvia e a mais abusada. Se tudo é grande, nada é.
2. **Peso** — `font-weight` 600/700 destaca sem ocupar mais espaço. Melhor alavanca para tabelas.
3. **Cor/contraste** — texto primário quase-preto, secundário cinza, terciário mais claro ainda. Três níveis bastam; cor saturada só no que exige ação ou atenção.
4. **Espaço** — whitespace ao redor de um elemento o promove (Gestalt: proximidade agrupa, isolamento destaca). É a alavanca mais barata e a menos usada por iniciante.

Teste rápido de bolso: **squint test** — aperte os olhos até a tela virar borrão. O que ainda se distingue é a sua hierarquia real, goste você ou não.

### Passo a passo: teste dos 5 segundos num dashboard AG

Caso real: no padrão dos dashboards comerciais AG (ex.: painel do dono do Cliente Varejo), o faturamento do período é o hero card — maior, no topo; os KPIs secundários vêm menores abaixo. Isso é uma **hipótese de hierarquia**, não um fato: "eu acho que o olho vai primeiro no hero" precisa de refutação possível.

```text
1. Screenshot da tela em estado cheio (com dados reais/seed).
2. Mostre por 5 segundos a alguém de fora do projeto. Feche.
3. Pergunte: (a) "do que se trata essa tela?"
            (b) "qual era a informação mais importante?"
4. Registre a resposta LITERAL, sem corrigir a pessoa.
5. Divergiu da intenção? A hierarquia falhou — não o usuário.
   Mexa em UMA alavanca por vez (ex.: só o tamanho do hero) e repita.
```

```css
/* hero vs secundário: as 4 alavancas aplicadas */
.kpi-hero  { font-size: 2.5rem; font-weight: 700; color: var(--text-1); }
.kpi-card  { font-size: 1.25rem; font-weight: 600; color: var(--text-2); }
.kpi-label { font-size: 0.75rem; font-weight: 500; color: var(--text-3);
             text-transform: uppercase; letter-spacing: 0.05em; }
```

Mexer em duas alavancas ao mesmo tempo destrói a evidência: se melhorou, você não sabe qual mudança causou.

## Por que cai em entrevista

Porque é o filtro mais rápido entre "sabe usar Tailwind" e "sabe desenhar interface". O entrevistador mostra uma tela e pergunta "o que você mudaria?" — quem responde com as alavancas pelo nome (tamanho, peso, contraste, espaço) e propõe um teste demonstra método; quem responde "deixaria mais bonito" não passa.

> **P:** "Como você decide o que destacar numa tela cheia de informação?"
>
> **R (30s):**
> "Primeiro defino o ponto focal — um só por tela. Num dashboard comercial que fiz, o número-mestre é um hero card e os KPIs secundários ficam menores, porque o dono abre a tela pra responder uma pergunta: 'como está o faturamento?'. Uso quatro alavancas em ordem: tamanho, peso, contraste e espaço — e valido com teste de 5 segundos: mostro a tela a alguém de fora e pergunto o que era mais importante. Se a resposta diverge da intenção, a hierarquia falhou e eu ajusto uma alavanca por vez."

## Checkpoint

- [ ] Consigo citar as 4 alavancas de hierarquia em ordem de força, com exemplo de cada
- [ ] Sei explicar o padrão em F e onde NÃO colocar informação crítica
- [ ] Rodei o squint test numa tela minha e anotei qual elemento domina de fato
- [ ] Rodei o teste dos 5 segundos com alguém de fora e registrei a resposta literal
- [ ] Identifiquei uma tela minha com 2+ pontos focais disputando e rebaixei um deles

## Recursos

- [F-Shaped Pattern of Reading — NN/g](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) — o estudo original de eye-tracking
- [Refactoring UI](https://www.refactoringui.com/) — livro de Adam Wathan e Steve Schoger; o capítulo de hierarquia vale o preço sozinho
- [Laws of UX](https://lawsofux.com/) — Gestalt, proximidade e atenção em cartões de 1 minuto
- Lyssna (ex-UsabilityHub) — ferramenta que formalizou o five second test
