// Merges the Material Icon Theme (MIT) with the Minecraft icons and writes
// themes/minecraft-material-icons.json (+ the no-arrows variant). Priority:
//   1. Minecraft folder  2. Minecraft file  3. Material Icon Theme  4. generic icon
import fs from 'node:fs';
import path from 'node:path';
import {
  r, readJson, writeJson, loadConfig, ids,
  MC_ICON_DIR, MATERIAL_ICON_DIR, THEME_FILE, MATERIAL_PKG
} from './lib.mjs';

// ---------- 1. Material Icon Theme (official npm package, pinned devDependency) ----------
const matPkgJson = path.join(MATERIAL_PKG, 'package.json');
if (!fs.existsSync(matPkgJson)) {
  console.error('✖ material-icon-theme not found in node_modules. Run "npm install".');
  process.exit(1);
}
const matPkg = readJson(matPkgJson);
if (matPkg.license !== 'MIT') throw new Error(`Unexpected Material Icon Theme license: ${matPkg.license}`);
const matThemePath = path.join(MATERIAL_PKG, 'dist', 'material-icons.json');
const matDir = path.dirname(matThemePath);
const theme = structuredClone(readJson(matThemePath));

const report = { materialVersion: matPkg.version, renamedIds: [], overrides: [], conflicts: [] };

// Rewrites Material SVG paths to ./../icons/material/<file>.svg
const materialSources = new Map(); // id -> source path
const usedBasenames = new Map();   // target name -> source
for (const [id, def] of Object.entries(theme.iconDefinitions)) {
  if (!def.iconPath) continue;
  const src = path.resolve(matDir, def.iconPath);
  let base = path.basename(src);
  if (usedBasenames.has(base) && usedBasenames.get(base) !== src) base = `${id}-${base}`;
  usedBasenames.set(base, src);
  materialSources.set(id, { src, base });
  def.iconPath = `./../icons/material/${base}`;
}

// ---------- 2. Minecraft definitions ----------
const cfg = loadConfig();
const idMap = new Map(); // logical id -> final id (after resolving collisions)
function defineMc(id) {
  let finalId = id, n = 2;
  while (theme.iconDefinitions[finalId]) finalId = `${id}-${n++}`;
  if (finalId !== id) report.renamedIds.push({ from: id, to: finalId, reason: 'ID already existed in Material Icon Theme' });
  const file = path.join(MC_ICON_DIR, `${id}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Missing SVG: icons/minecraft/${id}.svg (run "npm run icons")`);
  theme.iconDefinitions[finalId] = { iconPath: `./../icons/minecraft/${id}.svg` };
  idMap.set(id, finalId);
  return finalId;
}
for (const key of Object.keys(cfg.folders)) for (const id of [ids.folder(key), ids.folderOpen(key)]) defineMc(id);
for (const key of Object.keys(cfg.files)) defineMc(ids.file(key));
const mc = (id) => idMap.get(id);

// ---------- 3. Associations with Minecraft priority ----------
theme.light ??= {};
theme.highContrast ??= {};
const claimed = {}; // map -> name -> category (detects duplicates inside the Minecraft config)
function assign(map, name, darkId, category) {
  name = name.toLowerCase();
  claimed[map] ??= {};
  if (claimed[map][name]) {
    report.conflicts.push({ map, name, kept: claimed[map][name], ignored: category });
    return;
  }
  claimed[map][name] = category;
  theme[map] ??= {};
  // VS Code matches names case-insensitively: remove case variants (e.g. "META-INF")
  for (const section of [theme, theme.light, theme.highContrast]) {
    for (const k of Object.keys(section[map] ?? {})) {
      if (k !== name && k.toLowerCase() === name) {
        if (section === theme) report.overrides.push({ map, name: k, material: section[map][k], minecraft: darkId });
        delete section[map][k];
      }
    }
  }
  const previous = theme[map][name];
  if (previous && previous !== darkId) report.overrides.push({ map, name, material: previous, minecraft: darkId });
  theme[map][name] = darkId;
  // Light and high-contrast themes use the same Minecraft icon (as Material does for most icons)
  if (theme.light[map]) delete theme.light[map][name];
  if (theme.highContrast[map]) delete theme.highContrast[map][name];
}

// (1) Minecraft folders
for (const [key, def] of Object.entries(cfg.folders)) {
  const f = mc(ids.folder(key)), o = mc(ids.folderOpen(key));
  for (const n of def.names) {
    assign('folderNames', n, f, key);
    assign('folderNamesExpanded', n, o, key);
  }
  for (const n of def.rootNames ?? []) {
    assign('rootFolderNames', n, f, key);
    assign('rootFolderNamesExpanded', n, o, key);
  }
}
// (2) Minecraft files
for (const [key, def] of Object.entries(cfg.files)) {
  const d = mc(ids.file(key));
  for (const n of def.fileNames ?? []) assign('fileNames', n, d, key);
  for (const e of def.fileExtensions ?? []) assign('fileExtensions', e.replace(/^\./, ''), d, key);
}
// (3) everything else stays from Material Icon Theme; (4) generic = Material's file/folder/folderExpanded.

// ---------- 4. Remove unused definitions (package only what is needed) ----------
const MAPS = ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded', 'rootFolderNames', 'rootFolderNamesExpanded'];
const used = new Set(['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded'].map((k) => theme[k]).filter(Boolean));
for (const section of [theme, theme.light, theme.highContrast]) {
  for (const k of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded']) if (section[k]) used.add(section[k]);
  for (const m of MAPS) for (const v of Object.values(section[m] ?? {})) used.add(v);
}
let pruned = 0;
for (const id of Object.keys(theme.iconDefinitions)) if (!used.has(id)) { delete theme.iconDefinitions[id]; pruned++; }

// ---------- 5. Copy the required Material SVGs ----------
fs.rmSync(MATERIAL_ICON_DIR, { recursive: true, force: true });
fs.mkdirSync(MATERIAL_ICON_DIR, { recursive: true });
const copied = [];
for (const [id, { src, base }] of materialSources) {
  if (!theme.iconDefinitions[id]) continue;
  if (!fs.existsSync(path.join(MATERIAL_ICON_DIR, base))) {
    fs.copyFileSync(src, path.join(MATERIAL_ICON_DIR, base));
    copied.push(base);
  }
}
fs.mkdirSync(r('licenses'), { recursive: true });
fs.copyFileSync(path.join(MATERIAL_PKG, 'LICENSE'), r('licenses', 'material-icon-theme-LICENSE'));

// ---------- 6. Write themes and reports ----------
theme.hidesExplorerArrows = false;
writeJson(THEME_FILE, theme);
writeJson(r('themes', 'minecraft-material-icons-no-arrows.json'), { ...theme, hidesExplorerArrows: true });
fs.mkdirSync(r('dist'), { recursive: true });
report.counts = {
  iconDefinitions: Object.keys(theme.iconDefinitions).length,
  materialSvgsCopied: copied.length,
  minecraftSvgs: idMap.size,
  prunedUnusedMaterialDefinitions: pruned,
  folderNames: Object.keys(theme.folderNames).length,
  fileNames: Object.keys(theme.fileNames).length,
  fileExtensions: Object.keys(theme.fileExtensions).length,
  rootFolderNames: Object.keys(theme.rootFolderNames ?? {}).length
};
writeJson(r('reports', 'merge-report.json'), report);
fs.writeFileSync(r('reports', 'material-files.txt'), copied.sort().join('\n') + '\n');

// docs/FOLDERS.md: found vs. predicted folders
const scanFile = r('reports', 'project-scan.json');
const scan = fs.existsSync(scanFile) ? readJson(scanFile) : null;
const found = new Set((scan?.folders ?? []).map((f) => f.toLowerCase()));
let md = `# Folders with a Minecraft icon\n\n> Generated by \`npm run theme\`. ${scan ? `Last scan: \`${scan.projectName}\` on ${scan.date}.` : 'No project scanned yet: run `npm run scan -- "<path to your mod>"`.'}\n\n`;
md += '| Category | Folder names | Origin | Status |\n|---|---|---|---|\n';
for (const [key, def] of Object.entries(cfg.folders)) {
  const hit = def.names.filter((n) => found.has(n));
  const status = hit.length ? `✅ found: ${hit.map((n) => `\`${n}\``).join(', ')}` : '🔮 predicted';
  md += `| ${key} | ${def.names.map((n) => `\`${n}\``).join(' ')} | ${def.source === 'project' ? 'your project' : 'conventional'} | ${status} |\n`;
}
md += '\n## Mod files with a Minecraft icon\n\n| Category | Names | Extensions |\n|---|---|---|\n';
for (const [key, def] of Object.entries(cfg.files))
  md += `| ${key} | ${(def.fileNames ?? []).map((n) => `\`${n}\``).join(' ')} | ${(def.fileExtensions ?? []).map((n) => `\`.${n}\``).join(' ')} |\n`;
md += '\n## Material associations overridden by Minecraft icons\n\n| Map | Name | Material | Minecraft |\n|---|---|---|---|\n';
for (const o of report.overrides.filter((o) => !o.map.endsWith('Expanded'))) md += `| ${o.map} | \`${o.name}\` | ${o.material} | ${o.minecraft} |\n`;
fs.mkdirSync(r('docs'), { recursive: true });
fs.writeFileSync(r('docs', 'FOLDERS.md'), md);

// README: found vs. predicted folders section (between the markers)
{
  const readme = fs.readFileSync(r('README.md'), 'utf8');
  const userNames = Object.values(cfg.folders).filter((d) => d.source === 'project').map((d) => d.names[0]);
  let sec = '<!-- FOLDERS:START -->\n## Folders: found and predicted\n\n';
  sec += scan
    ? `Last scan: project \`${scan.projectName}\` (${scan.date}): Minecraft ${scan.minecraftVersion ?? '?'}, ${scan.loaders.join('/') || 'loader ?'}, ${scan.languages.java} Java / ${scan.languages.kotlin} Kotlin files.\n\n`
    : 'No project scanned yet. Run `npm run scan -- "<mod folder>"` and then `npm run package` to mark the folders that exist in your project.\n\n';
  sec += `Project-specific names: ${userNames.map((n) => `\`${n}\``).join(', ')}.\n\n`;
  sec += '| Category | Folder names | Origin | Status |\n|---|---|---|---|\n';
  for (const [key, def] of Object.entries(cfg.folders)) {
    const hit = def.names.filter((n) => found.has(n));
    const shown = def.names.length > 8 ? [...def.names.slice(0, 6).map((n) => `\`${n}\``), `… (+${def.names.length - 6}, see docs/FOLDERS.md)`] : def.names.map((n) => `\`${n}\``);
    sec += `| ${key} | ${shown.join(' ')} | ${def.source === 'project' ? 'project' : 'conventional'} | ${hit.length ? '✅ found' : '🔮 predicted'} |\n`;
  }
  sec += '<!-- FOLDERS:END -->';
  fs.writeFileSync(r('README.md'), readme.replace(/<!-- FOLDERS:START -->[\s\S]*?<!-- FOLDERS:END -->/, sec));
}

console.log(`✔ Themes generated: themes/minecraft-material-icons.json (+ no-arrows variant)`);
console.log(`  Material Icon Theme ${matPkg.version} (MIT): ${copied.length} SVGs copied, ${pruned} unused definitions removed`);
console.log(`  Minecraft: ${idMap.size} SVGs, ${report.overrides.length} Material associations overridden, ${report.renamedIds.length} IDs renamed, ${report.conflicts.length} internal conflicts`);
for (const c of report.conflicts) console.warn(`  ⚠ "${c.name}" (${c.map}) is in "${c.kept}" and "${c.ignored}"; kept "${c.kept}"`);
