// Adiciona pastas/arquivos ao tema sem editar JSON à mão.
//
//   npm run add-folder -- --list
//   npm run add-folder -- <pasta> <categoria>                 usa o ícone de uma categoria existente
//   npm run add-folder -- <pasta> <categoria> --root          também quando for a pasta raiz do workspace
//   npm run add-folder -- <pasta> --new --glyph portal --color "#7a3fb0"   cria categoria nova
//   npm run add-folder -- --file <nome.ext> <categoriaArquivo>
//   npm run add-folder -- --ext <extensao> <categoriaArquivo>
//
// Depois rode: npm run package
import fs from 'node:fs';
import { r, loadConfig } from './lib.mjs';
import { GLYPHS } from '../src/glyphs.mjs';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const positional = args.filter((a, i) => !a.startsWith('--') && !['--glyph', '--color', '--file', '--ext'].includes(args[i - 1]));
const cfg = loadConfig();
const save = () => fs.writeFileSync(r('src', 'minecraft-icons.json'), JSON.stringify(cfg, null, 2) + '\n');
const die = (m) => { console.error('✖ ' + m); process.exit(1); };

if (flag('--list') || !args.length) {
  console.log('Categorias de pasta:\n' + Object.entries(cfg.folders).map(([k, d]) => `  ${k.padEnd(18)} glifo=${d.glyph.padEnd(12)} ${d.names.join(', ')}`).join('\n'));
  console.log('\nCategorias de arquivo:\n' + Object.entries(cfg.files).map(([k, d]) => `  ${k.padEnd(18)} ${[...(d.fileNames ?? []), ...(d.fileExtensions ?? []).map((e) => '*.' + e)].join(', ')}`).join('\n'));
  console.log('\nGlifos disponíveis:\n  ' + Object.keys(GLYPHS).join(', '));
  process.exit(0);
}

if (flag('--file') || flag('--ext')) {
  const value = (opt('--file') ?? opt('--ext'))?.toLowerCase().replace(/^\*?\./, '');
  const cat = positional.find((p) => p.toLowerCase() !== value);
  if (!value || !cat) die('Informe o nome/extensão e a categoria de arquivo.');
  if (!cfg.files[cat]) die(`Categoria de arquivo "${cat}" não existe. Veja --list.`);
  const key = flag('--file') ? 'fileNames' : 'fileExtensions';
  cfg.files[cat][key] ??= [];
  if (!cfg.files[cat][key].includes(value)) cfg.files[cat][key].push(value);
  save();
  console.log(`✔ ${key === 'fileNames' ? value : '*.' + value} → ${cat}. Agora rode: npm run package`);
  process.exit(0);
}

const [rawName, category] = positional;
if (!rawName) die('Informe o nome da pasta.');
const name = rawName.toLowerCase();
for (const [k, d] of Object.entries(cfg.folders)) if (d.names.includes(name) && k !== category) die(`"${name}" já está na categoria "${k}". Remova de lá antes (src/minecraft-icons.json).`);

if (flag('--new')) {
  const glyph = opt('--glyph'), color = opt('--color');
  if (cfg.folders[name]) die(`Categoria "${name}" já existe.`);
  if (!GLYPHS[glyph]) die(`Glifo "${glyph}" não existe. Opções: ${Object.keys(GLYPHS).join(', ')}`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color ?? '')) die('Use --color "#rrggbb".');
  cfg.folders[name] = { glyph, color, names: [name], source: 'project', ...(flag('--root') ? { rootNames: [name] } : {}) };
} else {
  if (!category || !cfg.folders[category]) die(`Categoria "${category}" não existe. Veja: npm run add-folder -- --list`);
  const d = cfg.folders[category];
  if (!d.names.includes(name)) d.names.push(name);
  if (flag('--root')) { d.rootNames ??= []; if (!d.rootNames.includes(name)) d.rootNames.push(name); }
}
save();
console.log(`✔ Pasta "${name}" adicionada${flag('--new') ? ' como nova categoria' : ` à categoria "${category}"`}. Agora rode: npm run package`);
