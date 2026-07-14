#!/usr/bin/env bash
# Gera data/trilha-index.json a partir de trilha/ (fonte canônica, in-repo).
# Idempotente. Rodar sempre que módulos da trilha mudarem (o ag-hub-sync.ps1
# dispara automaticamente quando detecta trilha/*.md mais novo que o índice).
#
# Arquitetura: o bash só DESCOBRE (lista módulos + extrai título da 1ª linha "# ")
# e emite TSV; um único processo node monta e serializa o JSON. Isso elimina a
# contagem-manual-de-vírgula (que gerava JSON inválido se faltasse um diretório)
# e o spawn de um node por campo escapado. Runtime JSON: node — python3 no Windows
# resolve pro stub da Microsoft Store, que "existe" no PATH mas não executa.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRILHA_DIR="$ROOT/trilha"
INDEX="$ROOT/data/trilha-index.json"

[ -d "$TRILHA_DIR" ] || { echo "ERRO: $TRILHA_DIR não existe"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERRO: node não encontrado (necessário para gerar JSON)"; exit 1; }

echo "[trilha] gerando $INDEX a partir de $TRILHA_DIR..."

# Ordem canônica das trilhas
TRILHAS=(00-fundamentos 10-codigo-limpo 15-git 20-arquitetura 30-banco 35-ia-ml 40-frontend 50-backend 55-apis 60-seguranca 70-devops 80-system-design 85-escala 90-entrevista 95-diferencial)

# Coleta TSV: trilha_id \t arquivo \t titulo  (uma linha por módulo, em ordem)
collect() {
  for trilha in "${TRILHAS[@]}"; do
    local dir="$TRILHA_DIR/$trilha"
    [ -d "$dir" ] || continue
    while IFS= read -r mod; do
      local arq titulo
      arq=$(basename "$mod")
      # `|| true`: sob set -e+pipefail, um .md sem "# " abortaria o script
      titulo=$(grep -m1 "^# " "$mod" 2>/dev/null | sed 's/^# //' || true)
      [ -z "$titulo" ] && titulo="${arq%.md}"
      printf '%s\t%s\t%s\n' "$trilha" "$arq" "$titulo"
    done < <(find "$dir" -maxdepth 1 -name "*.md" ! -name "README.md" | sort)
  done
}

TMP="$INDEX.tmp"
trap 'rm -f "$TMP"' EXIT

# node monta o JSON: META estático aqui (nome/foco/icone/prioridade), módulos do TSV.
collect | INDEX_TMP="$TMP" node -e '
const fs = require("fs");
const META = {
  "00-fundamentos":  ["Fundamentos", "Base que TODA entrevista júnior cobra", "🎯", "alta"],
  "10-codigo-limpo": ["Código Limpo", "Teoria por trás das regras do CLAUDE.md", "🧹", "alta"],
  "15-git":          ["Git", "Modelo mental, branches, rebase, desfazer, fluxo de PR", "🔀", "alta"],
  "20-arquitetura":  ["Arquitetura", "SOLID, camadas, ADRs, padrões", "🏛️", "media"],
  "30-banco":        ["Banco de Dados", "Postgres, índices, N+1, transactions, RLS", "🗄️", "alta"],
  "35-ia-ml":        ["IA & Machine Learning", "ML do zero: aprendizado, dados, redes neurais, LLMs e usar IA na prática", "🤖", "maxima"],
  "40-frontend":     ["Frontend", "React render cycle, hooks, performance", "🎨", "media"],
  "50-backend":      ["Backend", "Express, Prisma, queues, idempotência", "⚙️", "media"],
  "55-apis":         ["APIs", "HTTP, REST, design, auth (JWT/OAuth), consumir e construir", "🔌", "alta"],
  "60-seguranca":    ["Segurança", "OWASP, LGPD, XSS, SQLi, secrets", "🔒", "alta"],
  "70-devops":       ["DevOps", "Docker, CI/CD, observabilidade", "📦", "baixa"],
  "80-system-design":["System Design", "Cache, fila, replicação, CAP", "🌐", "baixa"],
  "85-escala":       ["Cargas & Escala", "Throughput, latência, projeção, cache, filas, banco sob carga", "📈", "media"],
  "90-entrevista":   ["Entrevista", "Banco de 40 perguntas + pitch dos 8 projetos AG + mock", "🎤", "alta"],
  "95-diferencial":  ["Diferencial", "O que sobrevive ao Claude — prioridade máxima", "⚡", "maxima"],
};
const ORDER = Object.keys(META);
const byTrilha = new Map();
for (const line of fs.readFileSync(0, "utf8").split("\n")) {
  if (!line) continue;
  const [tid, arquivo, titulo] = line.split("\t");
  if (!byTrilha.has(tid)) byTrilha.set(tid, []);
  byTrilha.get(tid).push({ id: `${tid}/${arquivo}`, arquivo, titulo, caminho: `/trilha/${tid}/${arquivo}` });
}
const trilhas = ORDER.filter(t => byTrilha.has(t)).map(t => {
  const [nome, foco, icone, prioridade] = META[t];
  const modulos = byTrilha.get(t);
  return { id: t, nome, foco, icone, prioridade, totalModulos: modulos.length, modulos };
});
const out = { geradoEm: new Date().toISOString(), totalTrilhas: trilhas.length, trilhas };
fs.writeFileSync(process.env.INDEX_TMP, JSON.stringify(out, null, 2) + "\n");
const mods = trilhas.reduce((a, t) => a + t.totalModulos, 0);
console.log(`[trilha] OK — ${trilhas.length} trilhas, ${mods} módulos`);
'

mv "$TMP" "$INDEX"
trap - EXIT
echo "[trilha] arquivos .md: $(find "$TRILHA_DIR" -name "*.md" | wc -l)"
echo "[trilha] índice: $INDEX"
