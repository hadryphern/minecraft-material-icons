// Validação: package.json, tema JSON, todos os JSONs, SVGs referenciados,
// referências quebradas, prioridade Minecraft e caminhos absolutos.
import fs from 'node:fs';
import path from 'node:path';
import { XMLValidator, XMLParser } from 'fast-xml-parser';
import { ROOT, r, readJson, loadConfig, ids, THEME_FILE } from './lib.mjs';

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

// ---------- todos os JSONs do projeto ----------
const SKIP = new Set(['node_modules', '.git', 'dist']);
const jsonFiles = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else if (e.name.endsWith('.json')) jsonFiles.push(p);
  }
})(ROOT);
for (const f of jsonFiles) {
  try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { err(`JSON inválido: ${path.relative(ROOT, f)} — ${e.message}`); }
}

// ---------- package.json ----------
const pkg = readJson(r('package.json'));
for (const k of ['name', 'displayName', 'description', 'version', 'publisher', 'engines', 'contributes', 'license', 'icon'])
  if (!pkg[k]) err(`package.json: campo obrigatório ausente "${k}"`);
if (pkg.displayName !== 'Minecraft Material Icons') err('package.json: displayName deve ser "Minecraft Material Icons"');
if (!/^[a-z0-9][a-z0-9-]*$/.test(pkg.name ?? '')) err('package.json: "name" deve ser minúsculo, sem espaços');
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(pkg.version ?? '')) err('package.json: "version" não é semver');
if (!/^\^?\d+\.\d+\.\d+$/.test(pkg.engines?.vscode ?? '')) err('package.json: engines.vscode inválido');
if (pkg.icon) {
  const icon = r(pkg.icon);
  if (!fs.existsSync(icon)) err(`package.json: ícone ${pkg.icon} não existe`);
  else {
    const b = fs.readFileSync(icon);
    if (b.readUInt32BE(0) !== 0x89504e47) err('images/icon.png não é um PNG');
    else if (b.readUInt32BE(16) < 128 || b.readUInt32BE(20) < 128) err('images/icon.png deve ter ao menos 128x128');
  }
}
const themes = pkg.contributes?.iconThemes ?? [];
if (themes.length !== 2) err('package.json: deve haver 2 contributes.iconThemes (com e sem setas)');
for (const t of themes) {
  if (!t.id || !t.label || !t.path) err('package.json: iconThemes precisa de id, label e path');
  if (!t.label.startsWith('Minecraft Material Icons')) err('package.json: label do tema deve começar com "Minecraft Material Icons"');
  if (path.isAbsolute(t.path) || /^[a-zA-Z]:/.test(t.path)) err(`package.json: caminho absoluto em iconThemes: ${t.path}`);
  if (!fs.existsSync(r(t.path))) err(`package.json: tema não encontrado: ${t.path}`);
}

// ---------- tema ----------
const theme = readJson(THEME_FILE);
const noArrows = readJson(r('themes', 'minecraft-material-icons-no-arrows.json'));
if (noArrows.hidesExplorerArrows !== true) err('Tema sem setas deve ter hidesExplorerArrows: true');
if (theme.hidesExplorerArrows !== false) err('Tema padrão deve ter hidesExplorerArrows: false');
if (JSON.stringify({ ...noArrows, hidesExplorerArrows: false }) !== JSON.stringify(theme)) err('Os dois temas devem ser idênticos, exceto pelas setas');
const themeDir = path.dirname(THEME_FILE);
const defs = theme.iconDefinitions ?? {};
if (!Object.keys(defs).length) err('Tema sem iconDefinitions');
for (const k of ['file', 'folder', 'folderExpanded']) if (!theme[k] || !defs[theme[k]]) err(`Tema: padrão "${k}" ausente ou quebrado`);

const parser = new XMLParser({ ignoreAttributes: false });
const referencedFiles = new Set();
let svgChecked = 0;
for (const [id, def] of Object.entries(defs)) {
  const p = def.iconPath;
  if (!p) { err(`Definição sem iconPath: ${id}`); continue; }
  if (path.isAbsolute(p) || /^[a-zA-Z]:|^file:|^\/|\\/.test(p)) { err(`Caminho absoluto/não portável em ${id}: ${p}`); continue; }
  const abs = path.resolve(themeDir, p);
  if (!abs.startsWith(ROOT + path.sep)) { err(`Caminho fora da extensão em ${id}: ${p}`); continue; }
  if (!fs.existsSync(abs)) { err(`SVG referenciado não existe: ${id} -> ${p}`); continue; }
  referencedFiles.add(abs);
  if (!abs.endsWith('.svg')) { warn(`Não é SVG: ${p}`); continue; }
  const xml = fs.readFileSync(abs, 'utf8');
  const v = XMLValidator.validate(xml);
  if (v !== true) { err(`SVG inválido (${p}): ${v.err.msg}`); continue; }
  const svg = parser.parse(xml).svg;
  if (!svg) err(`Arquivo sem elemento <svg>: ${p}`);
  else if (!svg['@_viewBox']) warn(`SVG sem viewBox: ${p}`);
  svgChecked++;
}

const MAPS = ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded', 'rootFolderNames', 'rootFolderNamesExpanded'];
let refs = 0;
for (const [label, section] of [['', theme], ['light.', theme.light ?? {}], ['highContrast.', theme.highContrast ?? {}]]) {
  for (const k of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded'])
    if (section[k] && !defs[section[k]]) err(`Referência quebrada: ${label}${k} -> ${section[k]}`);
  for (const m of MAPS) for (const [name, id] of Object.entries(section[m] ?? {})) {
    refs++;
    if (!defs[id]) err(`Referência quebrada: ${label}${m}["${name}"] -> ${id}`);
    if (m !== 'languageIds' && name !== name.toLowerCase() && section[m][name.toLowerCase()])
      err(`Colisão de maiúsculas/minúsculas em ${label}${m}: "${name}" x "${name.toLowerCase()}"`);
  }
}

// SVGs empacotados mas não referenciados (pacote deve ter só o necessário)
for (const dir of ['icons/minecraft', 'icons/material']) {
  for (const f of fs.readdirSync(r(dir))) if (!referencedFiles.has(r(dir, f))) err(`SVG não referenciado no tema: ${dir}/${f}`);
}

// ---------- prioridade Minecraft ----------
const cfg = loadConfig();
let prio = 0;
const expect = (map, name, id) => {
  prio++;
  if (theme[map]?.[name] !== id) err(`Prioridade: ${map}["${name}"] deveria ser ${id}, é ${theme[map]?.[name]}`);
  if (theme.light?.[map]?.[name]) err(`Prioridade (claro): light.${map}["${name}"] sobrescreve o ícone Minecraft`);
  if (theme.highContrast?.[map]?.[name]) err(`Prioridade: highContrast.${map}["${name}"] sobrescreve o ícone Minecraft`);
};
const seen = new Set();
for (const [k, d] of Object.entries(cfg.folders)) {
  for (const n of d.names) { if (seen.has(n)) continue; seen.add(n); expect('folderNames', n, ids.folder(k)); expect('folderNamesExpanded', n, ids.folderOpen(k)); }
  for (const n of d.rootNames ?? []) { expect('rootFolderNames', n, ids.folder(k)); expect('rootFolderNamesExpanded', n, ids.folderOpen(k)); }
}
for (const [k, d] of Object.entries(cfg.files)) {
  for (const n of d.fileNames ?? []) expect('fileNames', n, ids.file(k));
  for (const e of d.fileExtensions ?? []) expect('fileExtensions', e, ids.file(k));
}
// ícones gerais do Material preservados
for (const e of ['java', 'json', 'js', 'ts', 'py', 'md', 'yml', 'yaml', 'xml', 'toml', 'gradle', 'properties', 'png', 'jpg', 'svg', 'gif', 'wav', 'ogg'])
  if (!theme.fileExtensions[e] && !theme.languageIds[e]) warn(`Extensão geral sem ícone do Material: .${e}`);
  else if (theme.fileExtensions[e]?.startsWith('mc-')) err(`.${e} deveria continuar com o ícone geral do Material`);

// ---------- .vscodeignore ----------
const ign = fs.existsSync(r('.vscodeignore')) ? fs.readFileSync(r('.vscodeignore'), 'utf8') : '';
for (const p of ['node_modules/**', 'scripts/**', 'src/**']) if (!ign.includes(p)) warn(`.vscodeignore deveria excluir ${p}`);

// ---------- resultado ----------
for (const w of warnings) console.warn('⚠ ' + w);
if (errors.length) {
  for (const e of errors.slice(0, 50)) console.error('✖ ' + e);
  if (errors.length > 50) console.error(`... e mais ${errors.length - 50} erros`);
  console.error(`\n✖ Validação falhou: ${errors.length} erro(s).`);
  process.exit(1);
}
console.log(`✔ Validação OK: ${jsonFiles.length} JSONs válidos, package.json OK, ${Object.keys(defs).length} definições, ${svgChecked} SVGs válidos e existentes, ${refs} associações sem referência quebrada, ${prio} regras de prioridade Minecraft conferidas.`);
