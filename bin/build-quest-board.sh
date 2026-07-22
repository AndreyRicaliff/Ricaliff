#!/usr/bin/env bash
# Gera data/quest-board.json a partir dos módulos da trilha.
# Estado detalhado dos projetos vive fora deste repo (privado).
# Idempotente. Rodar sempre que módulos da trilha ou bounties mudarem.
#
# Arquitetura: espelha bin/build-trilha.sh — bash DESCOBRE (grep de menções +
# git log via mapa local), um único node monta/serializa/mergeia. Elimina a
# contagem-manual-de-vírgula, o spawn por campo e o snapshot .prev órfão.
# ultimaAtividade: git log real via bin/.projmap-local (gitignorado, codinome→pasta);
# sem o mapa OU com clone atrasado, mantém a data anterior (nunca regride).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRILHA="$ROOT/trilha"
OUT="$ROOT/data/quest-board.json"
MAP="$ROOT/bin/.projmap-local"

[ -d "$TRILHA" ] || { echo "ERRO: $TRILHA não existe. Rode bin/build-trilha.sh primeiro."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERRO: node não encontrado (necessário para gerar JSON)"; exit 1; }

echo "[quest-board] varrendo módulos da trilha..."

# Projetos AG e termos de busca (grep -i) para varrer as menções na trilha.
declare -A PROJ_GREP=(
  [PULSAR-RH]="PULSAR-RH"
  [cliente-varejo]="[Cc]liente [Vv]arejo\|CLIENTE VAREJO\|cliente-varejo"
  [cliente-oficina-backend]="[Cc]liente [Oo]ficina\|CLIENTE OFICINA\|cliente-oficina"
  [meet-hub]="[Mm]eet [Hh]ub\|meet-hub"
  [ag-evento]="AG [Cc]onverge\|ag-evento"
  [cafe_com_ag]="[Cc]afé com AG\|cafe_com_ag"
  [ag-hub]="AG [Hh]ub\|ag-hub\|[Rr]icaliff"
  [ifpb]="IFPB\|ifpb"
)
PROJETOS=(PULSAR-RH cliente-varejo cliente-oficina-backend meet-hub ag-evento cafe_com_ag ag-hub ifpb)

TMP="$OUT.tmp"; MATCHES="$OUT.matches"; ACT="$OUT.act"
trap 'rm -f "$TMP" "$MATCHES" "$ACT"' EXIT
: > "$MATCHES"; : > "$ACT"

# Coleta matches: proj_id \t rel \t trilha_id \t titulo
for proj_id in "${PROJETOS[@]}"; do
  termo="${PROJ_GREP[$proj_id]}"
  n=0
  while IFS= read -r f; do
    grep -qi "$termo" "$f" 2>/dev/null || continue
    rel="${f#"$TRILHA/"}"
    trilha_id="${rel%%/*}"
    titulo=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' || true)
    [ -z "$titulo" ] && titulo="$(basename "$f" .md)"
    printf '%s\t%s\t%s\t%s\n' "$proj_id" "$rel" "$trilha_id" "$titulo" >> "$MATCHES"
    n=$((n + 1))
  done < <(find "$TRILHA" -name "*.md" ! -name "README.md" ! -name "SYLLABUS.md" | sort)
  echo "[quest-board]   $proj_id: $n side quests" >&2
done

# Coleta ultimaAtividade real dos clones locais (mapa privado). Robusto a CRLF
# (editor Windows) — sem strip do \r, todo `[ -d ]` falharia e o loop seria no-op.
if [ -f "$MAP" ]; then
  while IFS='=' read -r pid ppath; do
    pid="${pid%$'\r'}"; ppath="${ppath%$'\r'}"
    [ -z "$pid" ] && continue
    case "$pid" in \#*) continue ;; esac
    [ -d "$ppath/.git" ] || continue
    last=$(git -C "$ppath" log -1 --format=%cI 2>/dev/null || true)
    [ -n "$last" ] && printf '%s\t%s\n' "$pid" "$last" >> "$ACT"
  done < "$MAP"
  echo "[quest-board] ultimaAtividade coletada via git log (.projmap-local)"
fi

# node monta tudo: META estático, matches/activity dos arquivos, merge do $OUT anterior.
MATCHES="$MATCHES" ACT="$ACT" PREV="$OUT" TMP="$TMP" node -e '
const fs = require("fs");
const META = {
  "PULSAR-RH":               ["PULSAR-RH", "📊", "alta"],
  "cliente-varejo":          ["Cliente Varejo", "📱", "alta"],
  "cliente-oficina-backend": ["CLIENTE OFICINA", "🏍️", "media"],
  "meet-hub":                ["Meet Hub", "🎥", "media"],
  "ag-evento":               ["AG Converge", "🎪", "media"],
  "cafe_com_ag":             ["Café com AG", "☕", "media"],
  "ag-hub":                  ["Ricaliff", "⚡", "media"],
  "ifpb":                    ["IFPB", "🎓", "baixa"],
};
const ORDER = Object.keys(META);
const readLines = p => (fs.existsSync(p) ? fs.readFileSync(p, "utf8").split("\n").filter(Boolean) : []);

const sq = new Map(ORDER.map(id => [id, []]));
for (const l of readLines(process.env.MATCHES)) {
  const [pid, rel, trilha, titulo] = l.split("\t");
  if (sq.has(pid)) sq.get(pid).push({ id: rel, titulo, trilha, moduloPath: `/trilha/${rel}`, xpBase: 40, xpBonus: 40, concluida: false });
}
const activity = new Map();
for (const l of readLines(process.env.ACT)) { const [pid, iso] = l.split("\t"); activity.set(pid, iso); }

const projetos = ORDER.map(id => {
  const [nome, icone, prioridade] = META[id];
  return { id, nome, icone, prioridade, hp: { atual: 5, max: 10, label: "5/10 DECISIONS" },
    stack: [], ultimaAtividade: null, sideQuests: sq.get(id), bounties: [] };
});

// Merge do arquivo anterior: preserva curadoria manual (bounties/hp/stack/concluida)
let kept = 0;
if (fs.existsSync(process.env.PREV)) {
  const old = Object.fromEntries(JSON.parse(fs.readFileSync(process.env.PREV, "utf8")).projetos.map(p => [p.id, p]));
  for (const p of projetos) {
    const o = old[p.id];
    if (!o) continue;
    if (o.bounties && o.bounties.length) { p.bounties = o.bounties; kept += o.bounties.length; }
    if (o.hp) p.hp = o.hp;
    if (o.stack && o.stack.length) p.stack = o.stack;
    if (o.ultimaAtividade) p.ultimaAtividade = o.ultimaAtividade;
    const feitas = new Set((o.sideQuests || []).filter(q => q.concluida).map(q => q.id));
    for (const q of p.sideQuests) if (feitas.has(q.id)) q.concluida = true;
  }
}
// ultimaAtividade do git log só AVANÇA a data — clone atrasado nunca regride o valor
for (const p of projetos) {
  const iso = activity.get(p.id);
  if (iso && (!p.ultimaAtividade || new Date(iso) > new Date(p.ultimaAtividade))) p.ultimaAtividade = iso;
}

const out = { geradoEm: new Date().toISOString(), projetos };
fs.writeFileSync(process.env.TMP, JSON.stringify(out, null, 2) + "\n");
const total = projetos.reduce((a, p) => a + p.sideQuests.length, 0);
console.log(`[quest-board] OK — ${projetos.length} projetos, ${total} side quests, ${kept} bounties preservados`);
'

mv "$TMP" "$OUT"
rm -f "$MATCHES" "$ACT"
trap - EXIT
echo "[quest-board] arquivo: $OUT"
echo "NOTA: bounties/hp/concluida editados à mão são preservados entre regenerações (merge automático)."
