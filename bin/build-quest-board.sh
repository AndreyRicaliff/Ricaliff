#!/usr/bin/env bash
# Gera data/quest-board.json a partir dos módulos da trilha + PROJECTS.md
# Idempotente. Rodar sempre que módulos da trilha ou bounties mudarem.
# Padrão: espelha bin/build-trilha.sh

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRILHA="$ROOT/trilha"
OUT="$ROOT/data/quest-board.json"

[ -d "$TRILHA" ] || { echo "ERRO: $TRILHA não existe. Rode bin/build-trilha.sh primeiro."; exit 1; }

# Preserva curadoria manual (bounties, hp, concluida) do arquivo anterior
PREV=""
if [ -f "$OUT" ]; then
  PREV="$OUT.prev"
  cp "$OUT" "$PREV"
fi

echo "[quest-board] varrendo módulos da trilha..."

esc_json() {
  printf '%s' "$1" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'
}

# Projetos AG com seus termos de busca (nome_id:termo_grep)
declare -A PROJ_GREP=(
  [PULSAR-RH]="PULSAR-RH"
  [cliente-varejo]="[Ll]ider [Cc]elulares\|cliente-varejo"
  [cliente-oficina-backend]="[Bb]ETO\|cliente-oficina"
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
} > "$OUT"

if ! python3 -m json.tool "$OUT" > /dev/null 2>&1; then
  echo "ERRO: JSON gerado inválido em $OUT"
  exit 1
fi

# Merge: reinjeta bounties/hp/stack/ultimaAtividade e concluida do arquivo anterior
if [ -n "$PREV" ]; then
  python3 - "$PREV" "$OUT" <<'PYMERGE'
import json, sys
prev_path, out_path = sys.argv[1], sys.argv[2]
old = {p['id']: p for p in json.load(open(prev_path))['projetos']}
new = json.load(open(out_path))
kept = 0
for proj in new['projetos']:
    o = old.get(proj['id'])
    if not o:
        continue
    if o.get('bounties'):
        proj['bounties'] = o['bounties']
        kept += len(o['bounties'])
    for campo in ('hp', 'stack', 'ultimaAtividade'):
        if o.get(campo):
            proj[campo] = o[campo]
    feitas = {q['id'] for q in o.get('sideQuests', []) if q.get('concluida')}
    for q in proj['sideQuests']:
        if q['id'] in feitas:
            q['concluida'] = True
json.dump(new, open(out_path, 'w'), ensure_ascii=False, indent=2)
print(f"[quest-board] merge: {kept} bounties preservados do arquivo anterior")
PYMERGE
  rm -f "$PREV"
fi

total_sq=$(python3 -c "
import json
d = json.load(open('$OUT'))
print(sum(len(p['sideQuests']) for p in d['projetos']))
")

echo "[quest-board] OK — ${#PROJETOS[@]} projetos, $total_sq side quests totais"
echo "[quest-board] arquivo: $OUT"
echo ""
echo "NOTA: bounties/hp/concluida editados à mão são preservados entre regenerações (merge automático)."
