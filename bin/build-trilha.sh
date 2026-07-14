#!/usr/bin/env bash
# Gera data/trilha-index.json a partir de trilha/ (fonte canônica, in-repo).
# Idempotente. Rodar sempre que módulos da trilha mudarem (o ag-hub-sync.ps1
# dispara automaticamente quando detecta trilha/*.md mais novo que o índice).
# Runtime JSON: node — python3 no Windows resolve pro stub da Microsoft Store,
# que "existe" no PATH mas não executa; node é o runtime garantido do toolchain.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TRILHA_DIR="$ROOT/trilha"
INDEX="$ROOT/data/trilha-index.json"

[ -d "$TRILHA_DIR" ] || { echo "ERRO: $TRILHA_DIR não existe"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERRO: node não encontrado (necessário para gerar JSON)"; exit 1; }

echo "[trilha] gerando $INDEX a partir de $TRILHA_DIR..."

# Definições estáticas de cada trilha (icone, prioridade, descrição)
# Mantém em sync com trilha/README.md
declare -A TRILHA_ICONE=(
  [00-fundamentos]="🎯"
  [10-codigo-limpo]="🧹"
  [15-git]="🔀"
  [20-arquitetura]="🏛️"
  [30-banco]="🗄️"
  [35-ia-ml]="🤖"
  [40-frontend]="🎨"
  [50-backend]="⚙️"
  [55-apis]="🔌"
  [60-seguranca]="🔒"
  [70-devops]="📦"
  [80-system-design]="🌐"
  [85-escala]="📈"
  [90-entrevista]="🎤"
  [95-diferencial]="⚡"
)

declare -A TRILHA_PRIORIDADE=(
  [00-fundamentos]="alta"
  [10-codigo-limpo]="alta"
  [15-git]="alta"
  [20-arquitetura]="media"
  [30-banco]="alta"
  [35-ia-ml]="maxima"
  [40-frontend]="media"
  [50-backend]="media"
  [55-apis]="alta"
  [60-seguranca]="alta"
  [70-devops]="baixa"
  [80-system-design]="baixa"
  [85-escala]="media"
  [90-entrevista]="alta"
  [95-diferencial]="maxima"
)

declare -A TRILHA_NOME=(
  [00-fundamentos]="Fundamentos"
  [10-codigo-limpo]="Código Limpo"
  [15-git]="Git"
  [20-arquitetura]="Arquitetura"
  [30-banco]="Banco de Dados"
  [35-ia-ml]="IA & Machine Learning"
  [40-frontend]="Frontend"
  [50-backend]="Backend"
  [55-apis]="APIs"
  [60-seguranca]="Segurança"
  [70-devops]="DevOps"
  [80-system-design]="System Design"
  [85-escala]="Cargas & Escala"
  [90-entrevista]="Entrevista"
  [95-diferencial]="Diferencial"
)

declare -A TRILHA_FOCO=(
  [00-fundamentos]="Base que TODA entrevista júnior cobra"
  [10-codigo-limpo]="Teoria por trás das regras do CLAUDE.md"
  [15-git]="Modelo mental, branches, rebase, desfazer, fluxo de PR"
  [20-arquitetura]="SOLID, camadas, ADRs, padrões"
  [30-banco]="Postgres, índices, N+1, transactions, RLS"
  [35-ia-ml]="ML do zero: aprendizado, dados, redes neurais, LLMs e usar IA na prática"
  [40-frontend]="React render cycle, hooks, performance"
  [50-backend]="Express, Prisma, queues, idempotência"
  [55-apis]="HTTP, REST, design, auth (JWT/OAuth), consumir e construir"
  [60-seguranca]="OWASP, LGPD, XSS, SQLi, secrets"
  [70-devops]="Docker, CI/CD, observabilidade"
  [80-system-design]="Cache, fila, replicação, CAP"
  [85-escala]="Throughput, latência, projeção, cache, filas, banco sob carga"
  [90-entrevista]="Banco de 40 perguntas + pitch dos 8 projetos AG + mock"
  [95-diferencial]="O que sobrevive ao Claude — prioridade máxima"
)

# Trilhas em ordem
TRILHAS=(00-fundamentos 10-codigo-limpo 15-git 20-arquitetura 30-banco 35-ia-ml 40-frontend 50-backend 55-apis 60-seguranca 70-devops 80-system-design 85-escala 90-entrevista 95-diferencial)

# Extrai título da 1ª linha "# X — Y" de um arquivo .md
# `|| true`: sob set -e + pipefail, um .md sem "# " matava o script e truncava o índice
extrair_titulo() {
  local f="$1"
  local linha
  linha=$(grep -m1 "^# " "$f" 2>/dev/null | sed 's/^# //' || true)
  [ -z "$linha" ] && linha=$(basename "$f" .md)
  echo "$linha"
}

# Escape JSON (stdin → string literal JSON)
esc_json() {
  printf '%s' "$1" | node -e 'let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>process.stdout.write(JSON.stringify(d)));'
}

# Gera em arquivo temporário: só substitui o índice commitado se o JSON validar
TMP="$INDEX.tmp"
trap 'rm -f "$TMP"' EXIT

{
  printf '{\n'
  printf '  "geradoEm": "%s",\n' "$(date -Iseconds)"
  printf '  "totalTrilhas": %d,\n' "${#TRILHAS[@]}"
  printf '  "trilhas": [\n'

  trilha_count=0
  trilha_total=${#TRILHAS[@]}

  for trilha in "${TRILHAS[@]}"; do
    trilha_count=$((trilha_count + 1))
    dir="$TRILHA_DIR/$trilha"
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
} > "$TMP"

# Valida JSON antes de substituir o arquivo bom
if ! node -e 'JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"))' "$TMP" >/dev/null 2>&1; then
  echo "ERRO: JSON gerado inválido em $TMP — índice anterior preservado"
  exit 1
fi
mv "$TMP" "$INDEX"
trap - EXIT

INDEX="$INDEX" node -e '
const d = JSON.parse(require("fs").readFileSync(process.env.INDEX, "utf8"));
const mods = d.trilhas.reduce((a, t) => a + t.totalModulos, 0);
console.log(`[trilha] OK — ${d.trilhas.length} trilhas, ${mods} módulos`);
'
echo "[trilha] arquivos .md: $(find "$TRILHA_DIR" -name "*.md" | wc -l)"
echo "[trilha] índice: $INDEX"
