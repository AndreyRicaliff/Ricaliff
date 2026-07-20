# 05 — Caching e Invalidação

## O que é

"Há duas coisas difíceis em computação: invalidação de cache e nomear coisas" — a piada é velha porque o problema é real. Cache é cópia; toda cópia pode ficar defasada; a engenharia está em decidir QUANDO a defasagem é aceitável e COMO ela termina.

As camadas, do usuário ao dado:

1. **Browser (HTTP cache):** governado por `Cache-Control`. A mais barata e a mais perigosa — você não a controla mais depois que entregou o header.
2. **CDN/edge (Vercel, Netlify, Cloudflare):** compartilhada entre usuários; invalidável por deploy ou purge.
3. **Aplicação:** React Query/SWR, memoização — TTL curto, escopo por usuário/aba.
4. **Banco:** materialized view / tabela agregada (módulo 03) — cache com nome bonito e refresh manual.

Duas estratégias de expiração:

- **TTL:** o dado morre por idade. Simples e previsível, mas garante uma janela de dado velho.
- **Invalidação por evento:** a escrita derruba a cópia (revalidate por tag, purge de CDN, `refresh materialized view` pós-sync). Sempre fresco, porém exige que TODA escrita saiba avisar — um caminho de escrita esquecido = cache eternamente velho.

**Cache stampede:** o item popular expira e mil requests simultâneos vão ao banco regenerá-lo ao mesmo tempo — o cache que protegia o banco o derruba. Mitigações: single-flight/lock (um regenera, os demais esperam), stale-while-revalidate (serve o velho enquanto renova em background), TTL com jitter (não expirar tudo junto).

### O Cache-Control de SPA — o bug clássico

Build de SPA gera `index.html` + assets com hash no nome (`app-a1b2c3.js`). A regra canônica:

- `index.html` → `no-cache` (revalida sempre; é minúsculo);
- assets com hash → `public, max-age=31536000, immutable` (1 ano; se o conteúdo muda, muda o NOME).

Invertida, dá o pior dos mundos: um `index.html` cacheado aponta para chunks de hash antigo que o deploy novo apagou — tela branca ou app congelado até Ctrl+Shift+R. Foi um dos mecanismos no caso do dashboard "congelado" do CLIENTE OFICINA: o usuário via número velho não porque o dado atrasou, mas porque a casca do app estava presa no cache do browser. Diagnóstico sênior: antes de culpar o pipeline, DevTools → Network → conferir `cache-control`, `age` e de onde cada arquivo veio. Hipótese testada vence refresh supersticioso.

### Passo a passo (host estático — Netlify)

```toml
# netlify.toml
[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

```bash
# verificar de fato (evidência, não fé):
curl -sI https://SEU-APP/index.html | grep -i cache-control
curl -sI https://SEU-APP/assets/app-a1b2c3.js | grep -i cache-control
```

## Por que cai em entrevista

Caching aparece em duas frentes: performance em system design ("como você escala leitura?") e o bug relatável ("usuário vê dado velho"). Enumerar as camadas e apontar em QUAL delas o dado envelheceu é diagnóstico de quem já operou produção — e stampede é a pergunta favorita para testar profundidade.

> **P:** "Usuário diz que o dashboard só atualiza com Ctrl+Shift+R. Por onde você começa?"
>
> **R (30s):**
> "Enumero as camadas e testo da mais barata: Network no DevTools — o index.html veio do cache ou do servidor? Já peguei exatamente esse bug: SPA com index.html cacheado agressivamente apontando para assets de um deploy antigo. A regra é index no-cache e assets com hash immutable por um ano — invertida, congela o app. Se o HTTP está limpo, subo de camada: cache do React Query, depois materialized view sem refresh. Cada camada tem um teste barato antes de eu tocar em código — e stampede eu previno com stale-while-revalidate em vez de TTL seco."

## Checkpoint

- [ ] Enumero as 4 camadas de cache e o mecanismo de invalidação de cada uma
- [ ] Explico TTL vs invalidação por evento e o modo de falha de cada
- [ ] Descrevo cache stampede e cito 2 mitigações
- [ ] Recito a regra de Cache-Control de SPA e o bug de invertê-la
- [ ] Verifiquei com curl os headers reais de um app meu em produção

## Recursos

- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- [web.dev — HTTP cache](https://web.dev/articles/http-cache)
- [RFC 5861 — stale-while-revalidate](https://datatracker.ietf.org/doc/html/rfc5861)
- [TanStack Query](https://tanstack.com/query/latest) — TTL de camada de app (staleTime/gcTime)
