#!/usr/bin/env bash
# Gera data/quest-board.json a partir dos módulos da trilha.
# Estado detalhado dos projetos vive fora deste repo (privado).
# Idempotente. Rodar sempre que módulos da trilha ou bounties mudarem.
# Padrão: espelha bin/build-trilha.sh (runtime JSON: node — ver nota lá).
# ultimaAtividade: calculada do git log real via bin/.projmap-local (gitignorado,
# mapeia codinome→pasta local); sem o mapa, preserva o valor anterior.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRILHA="$ROOT/trilha"
OUT="$ROOT/data/quest-board.json"
MAP="$ROOT/bin/.projmap-local"

[ -d "$TRILHA" ] || { echo "ERRO: $TRILHA não existe. Rode bin/build-trilha.sh primeiro."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERRO: node não encontrado (necessário para gerar JSON)"; exit 1; }

# Preserva curadoria manual (bounties, hp, concluida) do arquivo anterior
PREV=""
if [ -f "$OUT" ]; then
  PREV="$OUT.prev"
  cp "$OUT" "$PREV"
fi

echo "[quest-board] varrendo módulos da trilha..."

esc_json() {
  printf '%s' "$1" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>process.stdout.write(JSON.stringify(d)));'
}

# Projetos AG com seus termos de busca (nome_id:termo_grep)
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

declare -A PROJ_NOME=(
  [PULSAR-RH]="PULSAR-RH"
  [cliente-varejo]="Cliente Varejo"
  [cliente-oficina-backend]="CLIENTE OFICINA"
  [meet-hub]="Meet Hub"
  [ag-evento]="AG Converge"
  [cafe_com_ag]="Café com AG"
  [ag-hub]="Ricaliff"
  [ifpb]="IFPB"
)

declare -A PROJ_ICONE=(
  [PULSAR-RH]="📊"
  [cliente-varejo]="📱"
  [cliente-oficina-backend]="🏍️"
  [meet-hub]="🎥"
  [ag-evento]="🎪"
  [cafe_com_ag]="☕"
  [ag-hub]="⚡"
  [ifpb]="🎓"
)

declare -A PROJ_PRIO=(
  [PULSAR-RH]="alta"
  [cliente-varejo]="alta"
  [cliente-oficina-backend]="media"
  [meet-hub]="media"
  [ag-evento]="media"
  [cafe_com_ag]="media"
  [ag-hub]="media"
  [ifpb]="baixa"
)

PROJETOS=(PULSAR-RH cliente-varejo cliente-oficina-backend meet-hub ag-evento cafe_com_ag ag-hub ifpb)

# Gera em arquivo temporário: só substitui o board commitado se o JSON validar
TMP="$OUT.tmp"
trap 'rm -f "$TMP"' EXIT

{
  printf '{\n'
  printf '  "geradoEm": "%s",\n' "$(date -Iseconds)"
  printf '  "projetos": [\n'

  proj_count=0
  proj_total=${#PROJETOS[@]}

  for proj_id in "${PROJETOS[@]}"; do
    proj_count=$((proj_count + 1))
    termo="${PROJ_GREP[$proj_id]}"

    # Varre todos os .md da trilha por menção ao projeto (excluindo READMEs)
    mapfile -t matches < <(
      find "$TRILHA" -name "*.md" ! -name "README.md" | sort | while IFS= read -r f; do
        if grep -qi "$termo" "$f" 2>/dev/null; then
          printf '%s\n' "$f"
        fi
      done
    )

    printf '    {\n'
    printf '      "id": %s,\n' "$(esc_json "$proj_id")"
    printf '      "nome": %s,\n' "$(esc_json "${PROJ_NOME[$proj_id]}")"
    printf '      "icone": %s,\n' "$(esc_json "${PROJ_ICONE[$proj_id]}")"
    printf '      "prioridade": %s,\n' "$(esc_json "${PROJ_PRIO[$proj_id]}")"
    printf '      "hp": {"atual": 5, "max": 10, "label": "5/10 DECISIONS"},\n'
    printf '      "stack": [],\n'
    printf '      "ultimaAtividade": null,\n'
    printf '      "sideQuests": [\n'

    sq_count=0
    sq_total=${#matches[@]}

    for f in "${matches[@]}"; do
      sq_count=$((sq_count + 1))
      rel="${f#"$TRILHA/"}"
      trilha_id="${rel%%/*}"
      mod_titulo=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' || basename "$f" .md)

      printf '        {\n'
      printf '          "id": %s,\n' "$(esc_json "$rel")"
      printf '          "titulo": %s,\n' "$(esc_json "$mod_titulo")"
      printf '          "trilha": %s,\n' "$(esc_json "$trilha_id")"
      printf '          "moduloPath": %s,\n' "$(esc_json "/trilha/$rel")"
      printf '          "xpBase": 40,\n'
      printf '          "xpBonus": 40,\n'
      printf '          "concluida": false\n'

      if [ "$sq_count" -lt "$sq_total" ]; then
        printf '        },\n'
      else
        printf '        }\n'
      fi
    done

    printf '      ],\n'
    printf '      "bounties": []\n'

    if [ "$proj_count" -lt "$proj_total" ]; then
      printf '    },\n'
    else
      printf '    }\n'
    fi

    echo "[quest-board]   $proj_id: ${#matches[@]} side quests" >&2
  done

  printf '  ]\n'
  printf '}\n'
} > "$TMP"

if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$TMP" >/dev/null 2>&1; then
  echo "ERRO: JSON gerado inválido em $TMP — board anterior preservado"
  exit 1
fi

# Merge: reinjeta bounties/hp/stack e concluida do arquivo anterior
if [ -n "$PREV" ]; then
  PREV="$PREV" TMP="$TMP" node -e '
const fs = require("fs");
const old = Object.fromEntries(JSON.parse(fs.readFileSync(process.env.PREV, "utf8")).projetos.map(p => [p.id, p]));
const data = JSON.parse(fs.readFileSync(process.env.TMP, "utf8"));
let kept = 0;
for (const proj of data.projetos) {
  const o = old[proj.id];
  if (!o) continue;
  if (o.bounties && o.bounties.length) { proj.bounties = o.bounties; kept += o.bounties.length; }
  for (const campo of ["hp", "stack", "ultimaAtividade"]) {
    if (o[campo] && (!Array.isArray(o[campo]) || o[campo].length)) proj[campo] = o[campo];
  }
  const feitas = new Set((o.sideQuests || []).filter(q => q.concluida).map(q => q.id));
  for (const q of proj.sideQuests) if (feitas.has(q.id)) q.concluida = true;
}
fs.writeFileSync(process.env.TMP, JSON.stringify(data, null, 2) + "\n");
console.log(`[quest-board] merge: ${kept} bounties preservados do arquivo anterior`);
'
  rm -f "$PREV"
fi

# ultimaAtividade real via git log dos repos locais (mapa codinome→pasta, privado)
if [ -f "$MAP" ]; then
  while IFS='=' read -r pid ppath; do
    [ -z "$pid" ] && continue
    case "$pid" in \#*) continue ;; esac
    [ -d "$ppath/.git" ] || continue
    last=$(git -C "$ppath" log -1 --format=%cI 2>/dev/null || true)
    [ -z "$last" ] && continue
    TMP="$TMP" PID="$pid" LAST="$last" node -e '
const fs = require("fs");
const data = JSON.parse(fs.readFileSync(process.env.TMP, "utf8"));
const p = data.projetos.find(x => x.id === process.env.PID);
if (p) { p.ultimaAtividade = process.env.LAST; fs.writeFileSync(process.env.TMP, JSON.stringify(data, null, 2) + "\n"); }
'
  done < "$MAP"
  echo "[quest-board] ultimaAtividade atualizada via git log (.projmap-local)"
fi

mv "$TMP" "$OUT"
trap - EXIT

OUT="$OUT" node -e '
const d = JSON.parse(require("fs").readFileSync(process.env.OUT, "utf8"));
console.log(`[quest-board] OK — ${d.projetos.length} projetos, ${d.projetos.reduce((a,p)=>a+p.sideQuests.length,0)} side quests totais`);
'
echo "[quest-board] arquivo: $OUT"
echo ""
echo "NOTA: bounties/hp/concluida editados à mão são preservados entre regenerações (merge automático)."
