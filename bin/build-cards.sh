#!/usr/bin/env bash
# Gera data/recall-cards.json a partir dos blocos P/R dos módulos da trilha.
# Espelha bin/build-trilha.sh: node parseia, valida, escreve em .tmp e move (atômico).
# Rodar sempre que módulos ganharem/perderem blocos "> **P:**".
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
OUT="$ROOT/data/recall-cards.json"
TMP="$OUT.tmp"
trap 'rm -f "$TMP"' EXIT

OUT_TMP="$TMP" node -e '
const fs = require("fs"), path = require("path");
const root = process.cwd();
const trilhaDir = path.join(root, "trilha");
const cards = [];

for (const dir of fs.readdirSync(trilhaDir).sort()) {
  const full = path.join(trilhaDir, dir);
  if (!fs.statSync(full).isDirectory()) continue;
  for (const f of fs.readdirSync(full).sort()) {
    if (!f.endsWith(".md") || f === "README.md" || f === "SYLLABUS.md") continue;
    // split CRLF-safe: linha com \r no fim mata "(.*)$" em regex JS (o "." não atravessa \r)
    const lines = fs.readFileSync(path.join(full, f), "utf8").split(/\r?\n/);
    const titulo = (lines.find(l => l.startsWith("# ")) || "# ?").slice(2).trim();

    // varre blockquotes: pares "> **P:** ..." até "> **R (30s):** ..." (R pode começar na linha seguinte)
    let i = 0, n = 0;
    while (i < lines.length) {
      const mP = lines[i].match(/^>\s*\*\*P:\*\*\s*(.*)$/);
      if (!mP) { i++; continue; }
      let pergunta = mP[1].trim();
      i++;
      // pergunta pode continuar em linhas "> ..." até achar o R
      while (i < lines.length && /^>\s*/.test(lines[i]) && !/\*\*R \(30s\):\*\*/.test(lines[i])) {
        const t = lines[i].replace(/^>\s?/, "").trim();
        if (t) pergunta += " " + t;
        i++;
      }
      if (i >= lines.length || !/\*\*R \(30s\):\*\*/.test(lines[i])) break; // P sem R: ignora
      let resposta = lines[i].replace(/^>\s*\*\*R \(30s\):\*\*\s*/, "").trim();
      i++;
      while (i < lines.length && /^>\s?\S/.test(lines[i])) {
        resposta += (resposta ? " " : "") + lines[i].replace(/^>\s?/, "").trim();
        i++;
      }
      if (pergunta && resposta) {
        n++;
        cards.push({
          id: `${dir}/${f}#${n}`,
          trilha: dir,
          modulo: `${dir}/${f}`,
          tituloModulo: titulo,
          pergunta: pergunta.replace(/^"|"$/g, ""),
          resposta: resposta.replace(/^"|"$/g, ""),
        });
      }
    }
  }
}

if (cards.length < 50) { console.error(`ERRO: só ${cards.length} cards extraídos — parser quebrou?`); process.exit(1); }
const out = { geradoEm: new Date().toISOString(), total: cards.length, cards };
JSON.parse(JSON.stringify(out)); // sanity
fs.writeFileSync(process.env.OUT_TMP, JSON.stringify(out, null, 1) + "\n");
console.log(`[cards] OK — ${cards.length} cards de recall extraídos da trilha`);
'

mv "$TMP" "$OUT"
trap - EXIT
echo "[cards] arquivo: $OUT"
