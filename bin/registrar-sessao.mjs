#!/usr/bin/env node
// Registra uma sessão de trabalho no seed do hub e propaga pra browsers já seedados.
//
// Sessão entra SÓ pelo seed: o mergeById do seed.js adiciona o que não existe quando
// agh_seed_v sobe, então "escrever no seed + bumpar a versão" é o caminho de propagação.
//
//   node bin/registrar-sessao.mjs \
//     --project pulsar-rh --type feature --date 2026-07-15 --impact alto \
//     --title "..." --notes "..."
//
// Aceita --dry pra checar sem gravar. Sai != 0 em vazamento, projeto órfão ou seed inválido.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SEED = join(dirname(fileURLToPath(import.meta.url)), '..', 'seed.js');

// O repo é PÚBLICO. Identificador de cliente aqui vira vazamento permanente no histórico.
const PROIBIDO = [
  /beto/i, /motobike/i, /betobike/i, /\bl[ií]der\b/i, /celulares/i,
  /tenfront/i, /servsoft/i, /\bautag\b/i, /dr\.?\s*pizza/i, /caruaru/i,
  /\b\d{2}\.\d{3}\.\d{3}(\/\d{4}-?\d{2})?\b/,          // CNPJ
  /\b\d{1,3}(\.\d{1,3}){3}\b/,                          // IP
  /[\w.+-]+@[\w-]+\.[\w.]+/,                            // e-mail
  /\b[a-z]{20}\b/,                                      // ref de projeto Supabase
];

const TIPOS = ['feature', 'bugfix', 'refactor', 'deploy', 'design', 'planning', 'data'];
const IMPACTOS = ['alto', 'medio', 'baixo'];

const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  const k = process.argv[i];
  if (!k.startsWith('--')) fatal(`argumento solto: ${k}`);
  if (k === '--dry') { args.dry = true; i -= 1; continue; }
  args[k.slice(2)] = process.argv[i + 1];
}

function fatal(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

for (const req of ['project', 'title', 'type', 'date', 'impact', 'notes']) {
  if (!args[req]) fatal(`falta --${req}`);
}
if (!TIPOS.includes(args.type)) fatal(`--type inválido: ${args.type} (use ${TIPOS.join('|')})`);
if (!IMPACTOS.includes(args.impact)) fatal(`--impact inválido: ${args.impact} (use ${IMPACTOS.join('|')})`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) fatal(`--date deve ser YYYY-MM-DD, veio: ${args.date}`);
if (args.title.length > 90) fatal(`--title tem ${args.title.length} chars (máx 90)`);
if (args.notes.length > 200) fatal(`--notes tem ${args.notes.length} chars (máx 200)`);

// Vazamento: barra ANTES de tocar no arquivo — texto publicado não volta atrás.
const alvo = `${args.title} ${args.notes}`;
const vazou = PROIBIDO.filter(re => re.test(alvo));
if (vazou.length) {
  fatal(`vazamento no texto — o repo é público. Padrões que casaram: ${vazou.map(String).join(', ')}\n` +
        `  Use codinome: cliente-varejo, cliente-oficina, ERP-externo.`);
}

const src = readFileSync(SEED, 'utf8');

// Projeto tem que existir, senão a sessão fica órfã e o card não acha o dono.
const projetos = new Set([...src.matchAll(/\{ id: '([a-z-]+)',\s+name:/g)].map(m => m[1]));
if (!projetos.has(args.project)) {
  fatal(`projeto "${args.project}" não existe no seed. Existem: ${[...projetos].join(', ')}\n` +
        `  Crie o projeto no array projects antes de registrar sessão nele.`);
}

const ids = [...src.matchAll(/id:'s-(\d+)'/g)].map(m => +m[1]);
const proxId = `s-${String(Math.max(0, ...ids) + 1).padStart(2, '0')}`;

const versaoAtual = +(src.match(/agh_seed_v'\)\s*===\s*'(\d+)'/) || [])[1];
if (!versaoAtual) fatal('não achei o gate de versão (agh_seed_v) no seed');
const novaVersao = versaoAtual + 1;

const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const linha = `    { id:'${proxId}', title:'${esc(args.title)}', projectId:'${args.project}', ` +
  `type:'${args.type}', date:'${args.date}', impact:'${args.impact}', notes:'${esc(args.notes)}', createdAt: now },`;

// Âncora estrutural: último `];` antes de `const studies` = fecho do array sessions.
// Não depender do comentário decorativo — ele muda e a âncora quebra sem avisar.
const iStudies = src.indexOf('const studies');
if (iStudies < 0) fatal('não achei `const studies` — a estrutura do seed mudou');
const iFecho = src.lastIndexOf('\n  ];', iStudies);
if (iFecho < 0) fatal('não achei o fecho do array sessions antes de `const studies`');
if (src.lastIndexOf('const sessions', iFecho) < 0) fatal('o fecho encontrado não pertence ao array sessions');

let out = src.slice(0, iFecho) + `\n${linha}` + src.slice(iFecho);
out = out.replace(/(agh_seed_v'\)\s*===\s*')\d+(')/, `$1${novaVersao}$2`);
out = out.replace(/(localStorage\.setItem\('agh_seed_v',\s*')\d+(')/, `$1${novaVersao}$2`);
out = out.replace(/(\[Ricaliff seed v)\d+( · merge\])/, `$1${novaVersao}$2`);
out = out.replace(/^\/\/ seed\.js v\d+ .*$/m, `// seed.js v${novaVersao} — v${versaoAtual} + sessão ${proxId} (${args.project}, ${args.date})`);

if (args.dry) {
  console.log(`[dry] ${proxId} · ${args.project} · seed v${versaoAtual} → v${novaVersao}`);
  console.log(linha.trim());
  process.exit(0);
}

writeFileSync(SEED, out);

try {
  execFileSync(process.execPath, ['--check', SEED], { stdio: 'pipe' });
} catch (e) {
  writeFileSync(SEED, src); // seed quebrado = hub em branco; reverte antes de propagar
  fatal(`seed ficou com sintaxe inválida — revertido. ${e.stderr?.toString().trim() ?? e.message}`);
}

console.log(`✓ ${proxId} registrada · ${args.project} · seed v${versaoAtual} → v${novaVersao}`);
console.log(`  ${args.title}`);
