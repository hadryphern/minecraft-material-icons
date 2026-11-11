// Validation: package.json, theme JSON, every JSON file, referenced SVGs,
// broken references, Minecraft priority and absolute paths.
import fs from 'node:fs';
import path from 'node:path';
import { XMLValidator, XMLParser } from 'fast-xml-parser';
import { ROOT, r, readJson, loadConfig, ids, THEME_FILE } from './lib.mjs';

const errors = [], warnings = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

// ---------- every JSON file in the project ----------
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
  try { JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { err(`Invalid JSON: ${path.relative(ROOT, f)} — ${e.message}`); }
}

// ---------- package.json ----------
const pkg = readJson(r('package.json'));
for (const k of ['name', 'displayName', 'description', 'version', 'publisher', 'engines', 'contributes', 'license', 'icon'])
  if (!pkg[k]) err(`package.json: missing required field "${k}"`);
if (pkg.displayName !== 'Minecraft Material Icons') err('package.json: displayName must be "Minecraft Material Icons"');
if (!/^[a-z0-9][a-z0-9-]*$/.test(pkg.name ?? '')) err('package.json: "name" must be lowercase without spaces');
if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(pkg.version ?? '')) err('package.json: "version" is not semver');
if (!/^\^?\d+\.\d+\.\d+$/.test(pkg.engines?.vscode ?? '')) err('package.json: invalid engines.vscode');
if (pkg.icon) {
  const icon = r(pkg.icon);
  if (!fs.existsSync(icon)) err(`package.json: icon ${pkg.icon} does not exist`);
  else {
    const b = fs.readFileSync(icon);
    if (b.readUInt32BE(0) !== 0x89504e47) err('images/icon.png is not a PNG');
    else if (b.readUInt32BE(16) < 128 || b.readUInt32BE(20) < 128) err('images/icon.png must be at least 128x128');
  }
}
const themes = pkg.contributes?.iconThemes ?? [];
if (themes.length !== 2) err('package.json: there must be 2 contributes.iconThemes (with and without arrows)');
for (const t of themes) {
  if (!t.id || !t.label || !t.path) err('package.json: iconThemes needs id, label and path');
  if (!t.label.startsWith('Minecraft Material Icons')) err('package.json: theme label must start with "Minecraft Material Icons"');
  if (path.isAbsolute(t.path) || /^[a-zA-Z]:/.test(t.path)) err(`package.json: absolute path in iconThemes: ${t.path}`);
  if (!fs.existsSync(r(t.path))) err(`package.json: theme not found: ${t.path}`);
}

// ---------- tema ----------
const theme = readJson(THEME_FILE);
const noArrows = readJson(r('themes', 'minecraft-material-icons-no-arrows.json'));
if (noArrows.hidesExplorerArrows !== true) err('No-arrows theme must have hidesExplorerArrows: true');
if (theme.hidesExplorerArrows !== false) err('Default theme must have hidesExplorerArrows: false');
if (JSON.stringify({ ...noArrows, hidesExplorerArrows: false }) !== JSON.stringify(theme)) err('Both themes must be identical except for the arrows');
const themeDir = path.dirname(THEME_FILE);
const defs = theme.iconDefinitions ?? {};
if (!Object.keys(defs).length) err('Theme has no iconDefinitions');
for (const k of ['file', 'folder', 'folderExpanded']) if (!theme[k] || !defs[theme[k]]) err(`Theme: default "${k}" missing or broken`);

const parser = new XMLParser({ ignoreAttributes: false });
const referencedFiles = new Set();
let svgChecked = 0;
for (const [id, def] of Object.entries(defs)) {
  const p = def.iconPath;
  if (!p) { err(`Definition without iconPath: ${id}`); continue; }
  if (path.isAbsolute(p) || /^[a-zA-Z]:|^file:|^\/|\\/.test(p)) { err(`Absolute/non-portable path in ${id}: ${p}`); continue; }
  const abs = path.resolve(themeDir, p);
  if (!abs.startsWith(ROOT + path.sep)) { err(`Path outside the extension in ${id}: ${p}`); continue; }
  if (!fs.existsSync(abs)) { err(`Referenced SVG does not exist: ${id} -> ${p}`); continue; }
  referencedFiles.add(abs);
  if (!abs.endsWith('.svg')) { warn(`Not an SVG: ${p}`); continue; }
  const xml = fs.readFileSync(abs, 'utf8');
  const v = XMLValidator.validate(xml);
  if (v !== true) { err(`Invalid SVG (${p}): ${v.err.msg}`); continue; }
  const svg = parser.parse(xml).svg;
  if (!svg) err(`File without an <svg> element: ${p}`);
  else if (!svg['@_viewBox']) warn(`SVG without viewBox: ${p}`);
  svgChecked++;
}

const MAPS = ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded', 'rootFolderNames', 'rootFolderNamesExpanded'];
let refs = 0;
for (const [label, section] of [['', theme], ['light.', theme.light ?? {}], ['highContrast.', theme.highContrast ?? {}]]) {
  for (const k of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded'])
    if (section[k] && !defs[section[k]]) err(`Broken reference: ${label}${k} -> ${section[k]}`);
  for (const m of MAPS) for (const [name, id] of Object.entries(section[m] ?? {})) {
    refs++;
    if (!defs[id]) err(`Broken reference: ${label}${m}["${name}"] -> ${id}`);
    if (m !== 'languageIds' && name !== name.toLowerCase() && section[m][name.toLowerCase()])
      err(`Case collision in ${label}${m}: "${name}" vs "${name.toLowerCase()}"`);
  }
}

// SVGs packaged but not referenced (the package must contain only what is needed)
for (const dir of ['icons/minecraft', 'icons/material']) {
  for (const f of fs.readdirSync(r(dir))) if (!referencedFiles.has(r(dir, f))) err(`SVG not referenced by the theme: ${dir}/${f}`);
}

// ---------- Minecraft priority ----------
const cfg = loadConfig();
let prio = 0;
const expect = (map, name, id) => {
  prio++;
  if (theme[map]?.[name] !== id) err(`Priority: ${map}["${name}"] should be ${id}, is ${theme[map]?.[name]}`);
  if (theme.light?.[map]?.[name]) err(`Priority (light): light.${map}["${name}"] overrides the Minecraft icon`);
  if (theme.highContrast?.[map]?.[name]) err(`Priority: highContrast.${map}["${name}"] overrides the Minecraft icon`);
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
// general Material icons are preserved
for (const e of ['java', 'json', 'js', 'ts', 'py', 'md', 'yml', 'yaml', 'xml', 'toml', 'gradle', 'properties', 'png', 'jpg', 'svg', 'gif', 'wav', 'ogg'])
  if (!theme.fileExtensions[e] && !theme.languageIds[e]) warn(`General extension without a Material icon: .${e}`);
  else if (theme.fileExtensions[e]?.startsWith('mc-')) err(`.${e} should keep the general Material icon`);

// ---------- .vscodeignore ----------
const ign = fs.existsSync(r('.vscodeignore')) ? fs.readFileSync(r('.vscodeignore'), 'utf8') : '';
for (const p of ['node_modules/**', 'scripts/**', 'src/**']) if (!ign.includes(p)) warn(`.vscodeignore should exclude ${p}`);

// ---------- result ----------
for (const w of warnings) console.warn('⚠ ' + w);
if (errors.length) {
  for (const e of errors.slice(0, 50)) console.error('✖ ' + e);
  if (errors.length > 50) console.error(`... and ${errors.length - 50} more errors`);
  console.error(`\n✖ Validation failed: ${errors.length} error(s).`);
  process.exit(1);
}
console.log(`✔ Validation OK: ${jsonFiles.length} valid JSON files, package.json OK, ${Object.keys(defs).length} definitions, ${svgChecked} valid existing SVGs, ${refs} associations with no broken reference, ${prio} Minecraft priority rules checked.`);
