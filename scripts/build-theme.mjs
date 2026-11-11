// Funde o Material Icon Theme (MIT) com os ícones Minecraft e grava
// themes/minecraft-material-icons.json. Prioridade:
//   1. pasta Minecraft  2. arquivo Minecraft  3. Material Icon Theme  4. ícone genérico
import fs from 'node:fs';
import path from 'node:path';
import {
  r, readJson, writeJson, loadConfig, ids,
  MC_ICON_DIR, MATERIAL_ICON_DIR, THEME_FILE, MATERIAL_PKG
} from './lib.mjs';

// ---------- 1. Material Icon Theme (pacote oficial do npm, devDependency fixa) ----------
const matPkgJson = path.join(MATERIAL_PKG, 'package.json');
if (!fs.existsSync(matPkgJson)) {
  console.error('✖ material-icon-theme não encontrado em node_modules. Rode "npm install".');
  process.exit(1);
}
const matPkg = readJson(matPkgJson);
if (matPkg.license !== 'MIT') throw new Error(`Licença inesperada do Material Icon Theme: ${matPkg.license}`);
const matThemePath = path.join(MATERIAL_PKG, 'dist', 'material-icons.json');
const matDir = path.dirname(matThemePath);
const theme = structuredClone(readJson(matThemePath));

const report = { materialVersion: matPkg.version, renamedIds: [], overrides: [], conflicts: [] };

// Reescreve caminhos dos SVGs do Material para ./../icons/material/<arquivo>.svg
const materialSources = new Map(); // id -> caminho de origem
const usedBasenames = new Map();   // nome destino -> origem
for (const [id, def] of Object.entries(theme.iconDefinitions)) {
  if (!def.iconPath) continue;
  const src = path.resolve(matDir, def.iconPath);
  let base = path.basename(src);
  if (usedBasenames.has(base) && usedBasenames.get(base) !== src) base = `${id}-${base}`;
  usedBasenames.set(base, src);
  materialSources.set(id, { src, base });
  def.iconPath = `./../icons/material/${base}`;
}

// ---------- 2. Definições Minecraft ----------
const cfg = loadConfig();
const idMap = new Map(); // id lógico -> id final (após resolver colisões)
function defineMc(id) {
  let finalId = id, n = 2;
  while (theme.iconDefinitions[finalId]) finalId = `${id}-${n++}`;
  if (finalId !== id) report.renamedIds.push({ from: id, to: finalId, reason: 'ID já existia no Material Icon Theme' });
  const file = path.join(MC_ICON_DIR, `${id}.svg`);
  if (!fs.existsSync(file)) throw new Error(`SVG ausente: icons/minecraft/${id}.svg (rode "npm run icons")`);
  theme.iconDefinitions[finalId] = { iconPath: `./../icons/minecraft/${id}.svg` };
  idMap.set(id, finalId);
  return finalId;
}
for (const key of Object.keys(cfg.folders)) for (const id of [ids.folder(key), ids.folderOpen(key)]) defineMc(id);
for (const key of Object.keys(cfg.files)) defineMc(ids.file(key));
const mc = (id) => idMap.get(id);

// ---------- 3. Associações com prioridade Minecraft ----------
theme.light ??= {};
theme.highContrast ??= {};
const claimed = {}; // mapa -> nome -> categoria (detecta duplicatas dentro da config Minecraft)
function assign(map, name, darkId, category) {
  name = name.toLowerCase();
  claimed[map] ??= {};
  if (claimed[map][name]) {
    report.conflicts.push({ map, name, kept: claimed[map][name], ignored: category });
    return;
  }
  claimed[map][name] = category;
  theme[map] ??= {};
  // O VS Code compara nomes sem diferenciar maiúsculas: remove variantes (ex.: "META-INF")
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
  // Tema claro e alto contraste usam o mesmo ícone Minecraft (como o Material faz na maioria dos ícones)
  if (theme.light[map]) delete theme.light[map][name];
  if (theme.highContrast[map]) delete theme.highContrast[map][name];
}

// (1) pastas Minecraft
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
// (2) arquivos Minecraft
for (const [key, def] of Object.entries(cfg.files)) {
  const d = mc(ids.file(key));
  for (const n of def.fileNames ?? []) assign('fileNames', n, d, key);
  for (const e of def.fileExtensions ?? []) assign('fileExtensions', e.replace(/^\./, ''), d, key);
}
// (3) tudo o mais permanece do Material Icon Theme; (4) genéricos = file/folder/folderExpanded do Material.

// ---------- 4. Remover definições não usadas (só empacota o necessário) ----------
const MAPS = ['fileExtensions', 'fileNames', 'languageIds', 'folderNames', 'folderNamesExpanded', 'rootFolderNames', 'rootFolderNamesExpanded'];
const used = new Set(['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded'].map((k) => theme[k]).filter(Boolean));
for (const section of [theme, theme.light, theme.highContrast]) {
  for (const k of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded']) if (section[k]) used.add(section[k]);
  for (const m of MAPS) for (const v of Object.values(section[m] ?? {})) used.add(v);
}
let pruned = 0;
for (const id of Object.keys(theme.iconDefinitions)) if (!used.has(id)) { delete theme.iconDefinitions[id]; pruned++; }

// ---------- 5. Copiar SVGs do Material necessários ----------
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

// ---------- 6. Gravar tema e relatórios ----------
writeJson(THEME_FILE, theme);
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

// docs/FOLDERS.md: pastas encontradas x previstas
const scanFile = r('reports', 'project-scan.json');
const scan = fs.existsSync(scanFile) ? readJson(scanFile) : null;
const found = new Set((scan?.folders ?? []).map((f) => f.toLowerCase()));
let md = `# Pastas com ícone Minecraft\n\n> Gerado por \`npm run theme\`. ${scan ? `Último scan: \`${scan.projectName}\` em ${scan.date}.` : 'Nenhum projeto escaneado ainda: rode `npm run scan -- "<caminho do mod>"`.'}\n\n`;
md += '| Categoria | Nomes de pasta | Origem | Status |\n|---|---|---|---|\n';
for (const [key, def] of Object.entries(cfg.folders)) {
  const hit = def.names.filter((n) => found.has(n));
  const status = hit.length ? `✅ encontrada: ${hit.map((n) => `\`${n}\``).join(', ')}` : '🔮 prevista';
  md += `| ${key} | ${def.names.map((n) => `\`${n}\``).join(' ')} | ${def.source === 'project' ? 'nome do seu projeto' : 'convencional'} | ${status} |\n`;
}
md += '\n## Arquivos de mod com ícone Minecraft\n\n| Categoria | Nomes | Extensões |\n|---|---|---|\n';
for (const [key, def] of Object.entries(cfg.files))
  md += `| ${key} | ${(def.fileNames ?? []).map((n) => `\`${n}\``).join(' ')} | ${(def.fileExtensions ?? []).map((n) => `\`.${n}\``).join(' ')} |\n`;
md += '\n## Associações do Material substituídas pelo Minecraft\n\n| Mapa | Nome | Material | Minecraft |\n|---|---|---|---|\n';
for (const o of report.overrides.filter((o) => !o.map.endsWith('Expanded'))) md += `| ${o.map} | \`${o.name}\` | ${o.material} | ${o.minecraft} |\n`;
fs.mkdirSync(r('docs'), { recursive: true });
fs.writeFileSync(r('docs', 'FOLDERS.md'), md);

// README: seção de pastas encontradas x previstas (entre os marcadores)
{
  const readme = fs.readFileSync(r('README.md'), 'utf8');
  const userNames = Object.values(cfg.folders).filter((d) => d.source === 'project').map((d) => d.names[0]);
  let sec = '<!-- FOLDERS:START -->\n## Pastas: encontradas e previstas\n\n';
  sec += scan
    ? `Último scan: projeto \`${scan.projectName}\` (${scan.date}): Minecraft ${scan.minecraftVersion ?? '?'}, ${scan.loaders.join('/') || 'loader ?'}, Java ${scan.languages.java} / Kotlin ${scan.languages.kotlin} arquivos.\n\n`
    : 'Nenhum projeto escaneado ainda (a pasta analisada estava vazia). Rode `npm run scan -- "<pasta do mod>"` e depois `npm run package` para marcar aqui as pastas que existem no seu projeto.\n\n';
  sec += `Nomes específicos do seu projeto: ${userNames.map((n) => `\`${n}\``).join(', ')}.\n\n`;
  sec += '| Categoria | Nomes de pasta | Origem | Status |\n|---|---|---|---|\n';
  for (const [key, def] of Object.entries(cfg.folders)) {
    const hit = def.names.filter((n) => found.has(n));
    const shown = def.names.length > 8 ? [...def.names.slice(0, 6).map((n) => `\`${n}\``), `… (+${def.names.length - 6}, veja docs/FOLDERS.md)`] : def.names.map((n) => `\`${n}\``);
    sec += `| ${key} | ${shown.join(' ')} | ${def.source === 'project' ? 'projeto' : 'convencional'} | ${hit.length ? '✅ encontrada' : '🔮 prevista'} |\n`;
  }
  sec += '<!-- FOLDERS:END -->';
  fs.writeFileSync(r('README.md'), readme.replace(/<!-- FOLDERS:START -->[\s\S]*?<!-- FOLDERS:END -->/, sec));
}

console.log(`✔ Tema gerado: themes/minecraft-material-icons.json`);
console.log(`  Material Icon Theme ${matPkg.version} (MIT): ${copied.length} SVGs copiados, ${pruned} definições não usadas removidas`);
console.log(`  Minecraft: ${idMap.size} SVGs, ${report.overrides.length} associações do Material substituídas, ${report.renamedIds.length} IDs renomeados, ${report.conflicts.length} conflitos internos`);
for (const c of report.conflicts) console.warn(`  ⚠ "${c.name}" (${c.map}) está em "${c.kept}" e "${c.ignored}"; mantido "${c.kept}"`);
