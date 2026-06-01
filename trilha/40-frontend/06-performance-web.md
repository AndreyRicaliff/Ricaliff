# 06 — Performance Web

## O que é

Performance web é mensurável. Sem métrica, "tá lento" é opinião — com métrica, é problema diagnosticável. O Google define Core Web Vitals como os indicadores principais de experiência real do usuário:

**LCP — Largest Contentful Paint:** tempo até o maior elemento visível da tela renderizar. Mede quando o usuário vê o conteúdo principal. Bom: < 2.5s.

**CLS — Cumulative Layout Shift:** quanto o layout muda depois de carregado. Imagens sem dimensões definidas empurram conteúdo para baixo quando carregam — CLS alto. Bom: < 0.1.

**INP — Interaction to Next Paint:** latência de resposta a interações (clique, teclado). Substituiu FID no Core Web Vitals. Bom: < 200ms.

**O que afeta LCP:**

```html
<!-- Imagem principal sem preload — browser descobre tarde -->
<img src="/hero.jpg" alt="Dashboard" />

<!-- Com preload — browser inicia download antes de parsear HTML -->
<link rel="preload" as="image" href="/hero.jpg" />
<img src="/hero.jpg" alt="Dashboard" />
```

**Bundle size e code splitting:**

```tsx
// RUIM — importa tudo, mesmo que o usuário nunca veja o modal
import { HeavyModal } from './HeavyModal'

// BOM — carrega só quando necessário
const HeavyModal = lazy(() => import('./HeavyModal'))
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      {showModal && <HeavyModal />}
    </Suspense>
  )
}
```

**O que vai no bundle e por que importa:**

Cada KB de JavaScript que o browser baixa precisa ser: baixado, descomprimido, parseado, compilado e executado. Em mobile 3G, 100KB de JS pode travar a thread por 500ms. Verificar o bundle:

```bash
# No projeto Vite
npx vite-bundle-analyzer  # ou vite-bundle-visualizer

# Ver tamanho atual
cd ~/projetos/meet-hub/apps/web && npm run build -- --report 2>/dev/null
```

**Lazy load de imagens:**

```html
<!-- Imagens abaixo do fold — carregar só quando visíveis -->
<img src="/thumbnail.jpg" alt="..." loading="lazy" />
```

**Por que CSS-in-JS pode ser custo:** bibliotecas como styled-components e Emotion geram estilos em runtime — parsing de JavaScript e injeção de `<style>` a cada render. Tailwind gera CSS estático em build time, sem custo de runtime. Para projetos AG que já usam Tailwind, não há problema.

**Prefetch vs preload:**
- `preload`: recurso **necessário na página atual** — browser baixa com alta prioridade (imagem hero, fonte crítica)
- `prefetch`: recurso **provável na próxima navegação** — browser baixa em idle time

**Armadilha comum de júnior:** otimizar sem medir. Adicionar `useMemo` aleatório, lazy loading em tudo, preload em recursos que já carregam rápido. O resultado é código mais complexo sem ganho real. Medir primeiro com Lighthouse ou WebPageTest.

---

## Por que cai em entrevista

Empresas com produto web cobram LCP porque é fator de ranqueamento no Google e afeta diretamente conversão. Variações:

- "O que é LCP e como você melhoraria em um site lento?"
- "Explique code splitting"
- "Como você reduziria o bundle size de uma aplicação React?"
- "O que é CLS e como você evitaria?"

---

## Trade-offs

| Técnica | Quando vale | Quando não vale |
|---|---|---|
| `React.lazy` + code splitting | Componente > 50KB, não visível na carga inicial | Componente pequeno, sempre visível |
| `loading="lazy"` em imagens | Imagens abaixo do fold | Imagem hero/LCP — vai atrasar |
| `rel="preload"` | Recurso crítico descoberto tarde no parse | Recurso já carregado cedo |
| Compressão de imagem (WebP/AVIF) | Sempre — ganho de 30–80% sem qualidade perceptível | — |
| Bundle analysis | Antes de qualquer otimização de tamanho | — |
| Tree shaking | Já ativo com Vite/Webpack por padrão | — |

---

## Exercício aplicado (projeto AG real)

```bash
# Iniciar PULSAR-RH localmente e medir com Lighthouse
# (PULSAR-RH é HTML puro — abrir no browser e rodar Lighthouse)
# DevTools → Lighthouse → Performance → Generate report

# Ver tamanho do bundle do Meet Hub web
cd ~/projetos/meet-hub/apps/web
npm run build 2>/dev/null && du -sh dist/

# Analisar com vite-bundle-visualizer (instalar se não tiver)
npx vite-bundle-visualizer 2>/dev/null
```

No relatório do Lighthouse, identificar:
1. **LCP atual:** está acima de 2.5s? Qual é o elemento LCP?
2. **CLS:** tem layout shift? Qual elemento muda?
3. **Largest resource:** qual arquivo pesa mais no bundle?

Propor 2 melhorias baseadas nos dados reais (não hipotéticas).

```markdown
## 2026-06-XX — [perf] otimização de performance no PULSAR-RH

**Medição inicial (Lighthouse):**
- LCP: 3.8s (vermelho — acima de 2.5s)
- CLS: 0.18 (amarelo — acima de 0.1)
- Causa LCP: imagem do logo AG sem preload
- Causa CLS: tabela de KPIs sem altura definida carrega depois do texto

**Melhorias propostas:**
1. Adicionar `<link rel="preload">` para a imagem do logo
2. Definir `min-height` na tabela de KPIs durante loading

**Resultado após:**
- LCP: 1.9s (verde)
- CLS: 0.03 (verde)

**Como explicar em entrevista (30s):**
> "Medi o PULSAR-RH com Lighthouse e encontrei LCP de 3.8s e CLS de 0.18 — ambos vermelhos. O LCP era a imagem do logo que o browser descobria tarde no parse. Adicionei preload e caiu para 1.9s. O CLS era a tabela carregando depois do texto e empurrando o layout. Defini min-height e CLS foi para 0.03."
```

---

## Pergunta de entrevista esperada + resposta exemplar

> **P:** "O que é LCP e como você melhoraria em uma página lenta?"
>
> **R (30s):**
> "LCP é o tempo que leva para o maior elemento visível renderizar — em geral a imagem hero ou o bloco de texto principal. É o principal indicador de quando o usuário vê conteúdo útil. Para melhorar: primeiro medir com Lighthouse para saber qual é o elemento LCP e por que tarda. Causas comuns: imagem hero sem preload (browser descobre tarde no parse), imagem não comprimida (download lento), fonte custom bloqueando texto (font-display: swap resolve). No PULSAR-RH o LCP era a imagem do logo sem preload — adicionei `<link rel="preload">` e caiu de 3.8s para 1.9s."

> **P:** "O que causa CLS e como evitar?"
>
> **R (30s):**
> "CLS acontece quando elementos mudam de posição depois de renderizados. Causas mais comuns: imagens sem `width` e `height` definidos — quando carregam, empurram o conteúdo abaixo. Ads ou embeds sem tamanho reservado. Fontes custom que causam reflow quando substituem a fallback. Para evitar: sempre definir dimensões em imagens, reservar espaço para conteúdo dinâmico com `min-height`, e usar `font-display: optional` ou `swap` com fallback de métricas similares."

---

## Checkpoint

- [ ] Sei explicar LCP, CLS e INP sem consultar
- [ ] Rodei Lighthouse no PULSAR-RH e registrei os scores
- [ ] Propus 2 melhorias baseadas em dados reais, não hipotéticos
- [ ] Sei a diferença entre `preload` e `prefetch`
- [ ] Recitei a resposta de entrevista em voz alta sem travar

Quando todos marcados: registrar em `~/.claude/neural/learning/history.md` com `## YYYY-MM-DD — Performance Web dominado`.

---

## Recursos

- web.dev — [Core Web Vitals](https://web.dev/vitals/)
- web.dev — [Optimize LCP](https://web.dev/optimize-lcp/)
- PageSpeed Insights — [pagespeed.web.dev](https://pagespeed.web.dev) (medir URL pública)
- Bundlephobia — [bundlephobia.com](https://bundlephobia.com) (custo de npm packages antes de instalar)
- Lighthouse CLI — `npm i -g lighthouse && lighthouse <url> --view`
