#!/usr/bin/env bash
# Copia ~/projetos/estudos/trilha/ → ~/projetos/ag-hub/trilha/ e gera trilha-index.json
# Idempotente. Rodar sempre que módulos da trilha mudarem.

set -euo pipefail

SOURCE="${HOME}/projetos/estudos/trilha"
DEST="${HOME}/projetos/ag-hub/trilha"
INDEX="${HOME}/projetos/ag-hub/data/trilha-index.json"

[ -d "$SOURCE" ] || { echo "ERRO: $SOURCE não existe"; exit 1; }

echo "[trilha] limpando destino..."
rm -rf "$DEST"
mkdir -p "$DEST"

echo "[trilha] copiando markdown..."
cp -r "$SOURCE"/* "$DEST"/

echo "[trilha] gerando $INDEX..."

# Definições estáticas de cada trilha (icone, prioridade, descrição)
# Mantém em sync com trilha/README.md
declare -A TRILHA_ICONE=(
  [00-fundamentos]="🎯"
  [10-codigo-limpo]="🧹"
  [20-arquitetura]="🏛️"
  [30-banco]="🗄️"
  [40-frontend]="🎨"
  [50-backend]="⚙️"
  [60-seguranca]="🔒"
  [70-devops]="📦"
  [80-system-design]="🌐"
  [90-entrevista]="🎤"
  [95-diferencial]="⚡"
)

declare -A TRILHA_PRIORIDADE=(
  [00-fundamentos]="alta"
  [10-codigo-limpo]="alta"
  [20-arquitetura]="media"
  [30-banco]="alta"
  [40-frontend]="media"
  [50-backend]="media"
  [60-seguranca]="alta"
  [70-devops]="baixa"
  [80-system-design]="baixa"
  [90-entrevista]="alta"
  [95-diferencial]="maxima"
)

declare -A TRILHA_NOME=(
  [00-fundamentos]="Fundamentos"
  [10-codigo-limpo]="Código Limpo"
  [20-arquitetura]="Arquitetura"
  [30-banco]="Banco de Dados"
  [40-frontend]="Frontend"
  [50-backend]="Backend"
  [60-seguranca]="Segurança"
  [70-devops]="DevOps"
  [80-system-design]="System Design"
  [90-entrevista]="Entrevista"
  [95-diferencial]="Diferencial"
)

declare -A TRILHA_FOCO=(
  [00-fundamentos]="Base que TODA entrevista júnior cobra"
  [10-codigo-limpo]="Teoria por trás das regras do CLAUDE.md"
  [20-arquitetura]="SOLID, camadas, ADRs, padrões"
  [30-banco]="Postgres, índices, N+1, transactions, RLS"
  [40-frontend]="React render cycle, hooks, performance"
  [50-backend]="Express, Prisma, queues, idempotência"
  [60-seguranca]="OWASP, LGPD, XSS, SQLi, secrets"
  [70-devops]="Docker, CI/CD, observabilidade"
  [80-system-design]="Cache, fila, replicação, CAP"
  [90-entrevista]="Banco de 40 perguntas + pitch dos 8 projetos AG + mock"
  [95-diferencial]="O que sobrevive ao Claude — prioridade máxima"
)

# Trilhas em ordem
TRILHAS=(00-fundamentos 10-codigo-limpo 20-arquitetura 30-banco 40-frontend 50-backend 60-seguranca 70-devops 80-system-design 90-entrevista 95-diferencial)

# Extrai título da 1ª linha "# X — Y" de um arquivo .md
extrair_titulo() {
  local f="$1"
  local linha
  linha=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //')
  [ -z "$linha" ] && linha=$(basename "$f" .md)
  echo "$linha"
}

# Escape JSON
esc_json() {
  printf '%s' "$1" | python3 -c 'import sys,json; print(json.dumps(sys.stdin.read()))'
}

# Começa o JSON
{
  printf '{\n'
  printf '  "geradoEm": "%s",\n' "$(date -Iseconds)"
  printf '  "totalTrilhas": %d,\n' "${#TRILHAS[@]}"
  printf '  "trilhas": [\n'

  trilha_count=0
  trilha_total=${#TRILHAS[@]}

  for trilha in "${TRILHAS[@]}"; do
    trilha_count=$((trilha_count + 1))
    dir="$DEST/$trilha"
    [ -d "$dir" ] || continue

    # Pega módulos (exclui README)
    mapfile -t modulos < <(find "$dir" -maxdepth 1 -name "*.md" ! -name "README.md" | sort)

    printf '    {\n'
    printf '      "id": "%s",\n' "$trilha"
    printf '      "nome": %s,\n' "$(esc_json "${TRILHA_NOME[$trilha]}")"
    printf '      "foco": %s,\n' "$(esc_json "${TRILHA_FOCO[$trilha]}")"
    printf '      "icone": %s,\n' "$(esc_json "${TRILHA_ICONE[$trilha]}")"
    printf '      "prioridade": %s,\n' "$(esc_json "${TRILHA_PRIORIDADE[$trilha]}")"
    printf '      "totalModulos": %d,\n' "${#modulos[@]}"
    printf '      "modulos": [\n'

    mod_count=0
    mod_total=${#modulos[@]}

    for mod in "${modulos[@]}"; do
      mod_count=$((mod_count + 1))
      nome_arquivo=$(basename "$mod")
      titulo=$(extrair_titulo "$mod")
      caminho="/trilha/$trilha/$nome_arquivo"
      mod_id="$trilha/$nome_arquivo"

      printf '        {\n'
      printf '          "id": %s,\n' "$(esc_json "$mod_id")"
      printf '          "arquivo": %s,\n' "$(esc_json "$nome_arquivo")"
      printf '          "titulo": %s,\n' "$(esc_json "$titulo")"
      printf '          "caminho": %s\n' "$(esc_json "$caminho")"

      if [ $mod_count -lt $mod_total ]; then
        printf '        },\n'
      else
        printf '        }\n'
      fi
    done

    printf '      ]\n'

    if [ $trilha_count -lt $trilha_total ]; then
      printf '    },\n'
    else
      printf '    }\n'
    fi
  done

  printf '  ]\n'
  printf '}\n'
} > "$INDEX"

# Valida JSON
if ! python3 -m json.tool "$INDEX" > /dev/null 2>&1; then
  echo "ERRO: JSON gerado inválido em $INDEX"
  exit 1
fi

total_modulos=$(python3 -c "import json; d=json.load(open('$INDEX')); print(sum(t['totalModulos'] for t in d['trilhas']))")
total_trilhas=$(python3 -c "import json; d=json.load(open('$INDEX')); print(len(d['trilhas']))")

echo "[trilha] OK — $total_trilhas trilhas, $total_modulos módulos"
echo "[trilha] arquivos copiados: $(find "$DEST" -name "*.md" | wc -l)"
echo "[trilha] índice: $INDEX"
