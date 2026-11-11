// Analisa um projeto de mod Minecraft (SOMENTE LEITURA — nunca cria nem altera pastas no projeto).
// Suporta repositórios com vários loaders/versões (ex.: Fabric/1.20.1, NeoForge/1.21.1).
// Uso: npm run scan -- "C:\caminho\do\seu\mod"
// Gera reports/project-scan.md e reports/project-scan.json; depois rode `npm run package`
// para que o README e docs/FOLDERS.md marquem as pastas encontradas.
import fs from 'node:fs';
import path from 'node:path';
import { r, readJson, writeJson, loadConfig, MATERIAL_PKG } from './lib.mjs';

const target = process.argv[2];
if (!target || !fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
  console.error('Uso: npm run scan -- "<caminho do projeto de mod>"');
  process.exit(1);
}
const root = path.resolve(target);
const rel = (p) => path.relative(root, p).split(path.sep).join('/') || '.';
const readAt = (dir, ...p) => { const f = path.join(dir, ...p); return fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : null; };

// ---------- varredura ----------
const SKIP = new Set(['.git', '.gradle', '.idea', 'build', 'out', 'bin', 'node_modules', '.vscode']);
const NO_DESCEND = new Set(['run', 'runs', 'logs', 'crash-reports', 'saves']);
const GRADLE_MARKERS = ['settings.gradle', 'settings.gradle.kts', 'build.gradle', 'build.gradle.kts'];
const folderPaths = new Map();
const gradleDirs = [];
const metaFiles = [];
let javaFiles = 0, kotlinFiles = 0;
(function walk(dir, depth) {
  if (depth > 16) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  if (entries.some((e) => e.isFile() && GRADLE_MARKERS.includes(e.name))) gradleDirs.push(dir);
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      const key = e.name.toLowerCase();
      if (!folderPaths.has(key)) folderPaths.set(key, []);
      folderPaths.get(key).push(rel(p));
      if (!NO_DESCEND.has(key)) walk(p, depth + 1);
    } else if (e.name.endsWith('.java')) javaFiles++;
    else if (e.name.endsWith('.kt')) kotlinFiles++;
    else if (/^(fabric\.mod\.json|quilt\.mod\.json|mods\.toml|neoforge\.mods\.toml)$/.test(e.name)) metaFiles.push(p);
  }
})(root, 0);

// Projetos Gradle "raiz": ignora subprojetos de outro projeto que tenha settings.gradle
const settingsRoots = gradleDirs.filter((d) => ['settings.gradle', 'settings.gradle.kts'].some((f) => fs.existsSync(path.join(d, f))));
const projects = gradleDirs.filter((d) => settingsRoots.includes(d) || !settingsRoots.some((s) => d !== s && d.startsWith(s + path.sep)));

function analyze(dir) {
  const build = (readAt(dir, 'build.gradle') ?? '') + (readAt(dir, 'build.gradle.kts') ?? '');
  const settings = (readAt(dir, 'settings.gradle') ?? '') + (readAt(dir, 'settings.gradle.kts') ?? '');
  const props = readAt(dir, 'gradle.properties') ?? '';
  const prop = (...keys) => { for (const k of keys) { const m = props.match(new RegExp(`^\\s*${k}\\s*=\\s*(.+)$`, 'm')); if (m) return m[1].trim(); } return null; };
  const subprojects = [...settings.matchAll(/include\s*\(?\s*((?:["'][^"']+["']\s*,?\s*)+)/g)]
    .flatMap((m) => [...m[1].matchAll(/["']:?([^"']+)["']/g)].map((x) => x[1]));
  const allGradle = build + settings + subprojects.map((s) => (readAt(dir, s, 'build.gradle') ?? '') + (readAt(dir, s, 'build.gradle.kts') ?? '')).join('\n');
  const metas = metaFiles.filter((f) => f.startsWith(dir + path.sep));
  const loaders = new Set();
  if (metas.some((f) => f.endsWith('fabric.mod.json')) || /fabric-loom|net\.fabricmc/.test(allGradle)) loaders.add('Fabric');
  if (metas.some((f) => f.endsWith('quilt.mod.json')) || /org\.quiltmc/.test(allGradle)) loaders.add('Quilt');
  if (metas.some((f) => f.endsWith('neoforge.mods.toml')) || /net\.neoforged/.test(allGradle)) loaders.add('NeoForge');
  if (metas.some((f) => /[\\/]mods\.toml$/.test(f)) || /net\.minecraftforge/.test(allGradle)) loaders.add('Forge');
  let mc = prop('minecraft_version', 'mc_version', 'minecraftVersion', 'minecraft_version_range');
  const libs = readAt(dir, 'gradle', 'libs.versions.toml');
  if (!mc && libs) mc = libs.match(/^\s*minecraft\s*=\s*"([^"]+)"/m)?.[1] ?? null;
  let modId = prop('mod_id', 'modid', 'modId', 'archives_base_name');
  for (const f of metas) {
    const txt = fs.readFileSync(f, 'utf8');
    if (f.endsWith('.json')) {
      try { const j = JSON.parse(txt); modId ??= j.id ?? j.quilt_loader?.id; mc ??= j.depends?.minecraft ?? null; } catch { /* ignora */ }
    } else {
      modId ??= txt.match(/modId\s*=\s*"([^"]+)"/)?.[1];
      mc ??= txt.match(/modId\s*=\s*"minecraft"[\s\S]*?versionRange\s*=\s*"([^"]+)"/)?.[1] ?? null;
    }
  }
  const wrapper = readAt(dir, 'gradle', 'wrapper', 'gradle-wrapper.properties') ?? '';
  const sourceSets = new Set();
  for (const base of ['', ...subprojects]) {
    const src = path.join(dir, base, 'src');
    if (fs.existsSync(src)) for (const d of fs.readdirSync(src, { withFileTypes: true })) if (d.isDirectory()) sourceSets.add((base ? base + ':' : '') + d.name);
  }
  const ss = allGradle.match(/sourceSets\s*\{([\s\S]*?)\n\}/)?.[1] ?? '';
  for (const m of ss.matchAll(/^\s*(?:create\(\s*["'])?(\w+)["']?\)?\s*\{/gm)) sourceSets.add(m[1] + ' (gradle)');
  if (/splitEnvironmentSourceSets/.test(allGradle)) sourceSets.add('client (splitEnvironmentSourceSets)');
  return {
    path: rel(dir), loaders: [...loaders], architectury: /architectury/.test(allGradle), minecraftVersion: mc, modId,
    modVersion: prop('mod_version', 'version'), mavenGroup: prop('maven_group', 'group'),
    gradleFiles: [...GRADLE_MARKERS, 'gradle.properties', 'gradlew', 'gradlew.bat', 'gradle/wrapper/gradle-wrapper.properties', 'gradle/libs.versions.toml'].filter((f) => fs.existsSync(path.join(dir, f))),
    gradleWrapper: wrapper.match(/gradle-([\d.]+(?:-rc-\d+)?)-(bin|all)\.zip/)?.[1] ?? null,
    subprojects, sourceSets: [...sourceSets], modMetadata: metas.map(rel)
  };
}
const gradleProjects = projects.map(analyze);

// Pastas de loader sem projeto Gradle (ex.: Forge/ só com README)
const LOADER_DIRS = ['fabric', 'forge', 'neoforge', 'quilt'];
const placeholders = fs.readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && LOADER_DIRS.includes(e.name.toLowerCase()))
  .filter((e) => !gradleProjects.some((g) => g.path === e.name || g.path.startsWith(e.name + '/')))
  .map((e) => e.name);

// ---------- classificação ----------
const cfg = loadConfig();
const mcNames = new Map();
for (const [k, d] of Object.entries(cfg.folders)) for (const n of d.names) mcNames.set(n, k);
const material = readJson(path.join(MATERIAL_PKG, 'dist', 'material-icons.json'));
const matNames = new Set(Object.keys(material.folderNames).map((n) => n.toLowerCase()));
const found = [...folderPaths.keys()].sort();
const withMc = found.filter((n) => mcNames.has(n));
const withMaterial = found.filter((n) => !mcNames.has(n) && matNames.has(n));
const custom = found.filter((n) => !mcNames.has(n) && !matNames.has(n));
const predicted = Object.entries(cfg.folders).filter(([, d]) => !d.names.some((n) => folderPaths.has(n))).map(([k]) => k);
const all = (k) => gradleProjects.flatMap((g) => g[k] ?? []).filter(Boolean);
const uniq = (a) => [...new Set(a)];

const result = {
  projectName: path.basename(root), projectPath: root, date: new Date().toISOString().slice(0, 10),
  minecraftVersion: uniq(gradleProjects.map((g) => g.minecraftVersion).filter(Boolean)).join(', ') || null,
  loaders: uniq(all('loaders')), languages: { java: javaFiles, kotlin: kotlinFiles },
  gradleProjects, loaderPlaceholders: placeholders,
  folders: found, withMinecraftIcon: withMc, withMaterialIcon: withMaterial, customWithoutIcon: custom, predictedNotFound: predicted
};
writeJson(r('reports', 'project-scan.json'), result);

// ---------- relatório ----------
const lang = [javaFiles && `Java (${javaFiles} arquivos)`, kotlinFiles && `Kotlin (${kotlinFiles} arquivos)`].filter(Boolean).join(' + ') || 'nenhum código encontrado';
const list = (a) => (a.length ? a.map((n) => `\`${n}\``).join(', ') : '_nenhuma_');
let md = `# Scan do projeto \`${result.projectName}\` (${result.date})\n\nLinguagem: **${lang}**. Projetos Gradle: **${gradleProjects.length}**.`;
if (placeholders.length) md += ` Pastas de loader ainda sem projeto Gradle: ${list(placeholders)}.`;
md += '\n\n';
for (const g of gradleProjects) {
  md += `## Projeto Gradle \`${g.path}\`\n\n| Item | Resultado |\n|---|---|\n`;
  md += `| Versão do Minecraft | ${g.minecraftVersion ?? 'não identificada'} |\n`;
  md += `| Loader | ${g.loaders.join(', ') || 'não identificado'}${g.architectury ? ' (Architectury)' : ''} |\n`;
  md += `| Mod ID | ${g.modId ?? '—'}${g.modVersion ? ` (versão ${g.modVersion})` : ''}${g.mavenGroup ? `, grupo \`${g.mavenGroup}\`` : ''} |\n`;
  md += `| Gradle | ${g.gradleFiles.join(', ')}${g.gradleWrapper ? ` — wrapper ${g.gradleWrapper}` : ''} |\n`;
  md += `| Subprojetos | ${g.subprojects.join(', ') || '—'} |\n| Source sets | ${g.sourceSets.join(', ') || '—'} |\n`;
  md += `| Metadados | ${g.modMetadata.join(', ') || '—'} |\n\n`;
}
md += `## Pastas encontradas com ícone Minecraft (${withMc.length})\n${withMc.map((n) => `- \`${n}\` → ${mcNames.get(n)}`).join('\n') || '_nenhuma_'}\n\n`;
md += `## Pastas encontradas com ícone geral do Material (${withMaterial.length})\n${list(withMaterial)}\n\n`;
md += `## Nomes personalizados sem ícone específico (${custom.length})\n${custom.map((n) => `- \`${n}\` (${folderPaths.get(n)[0]}) — \`npm run add-folder -- ${n} <categoria>\``).join('\n') || '_nenhum_'}\n\n`;
md += `## Categorias apenas previstas (não existem no projeto) (${predicted.length})\n${list(predicted)}\n\n> Este scan é somente leitura: nenhuma pasta foi criada no seu projeto.\n`;
fs.writeFileSync(r('reports', 'project-scan.md'), md);
console.log(md);
console.log('✔ Relatório salvo em reports/project-scan.md. Rode "npm run package" para atualizar o README e docs/FOLDERS.md.');
