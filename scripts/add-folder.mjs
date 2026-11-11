// Adds folders/files to the theme without editing JSON by hand.
//
//   npm run add-folder -- --list
//   npm run add-folder -- <folder> <category>                 use the icon of an existing category
//   npm run add-folder -- <folder> <category> --root          also when it is the workspace root folder
//   npm run add-folder -- <folder> --new --glyph portal --color "#7a3fb0"   create a new category
//   npm run add-folder -- --file <name.ext> <fileCategory>
//   npm run add-folder -- --ext <extension> <fileCategory>
//
// Then run: npm run package
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
  console.log('Folder categories:\n' + Object.entries(cfg.folders).map(([k, d]) => `  ${k.padEnd(18)} glyph=${d.glyph.padEnd(12)} ${d.names.join(', ')}`).join('\n'));
  console.log('\nFile categories:\n' + Object.entries(cfg.files).map(([k, d]) => `  ${k.padEnd(18)} ${[...(d.fileNames ?? []), ...(d.fileExtensions ?? []).map((e) => '*.' + e)].join(', ')}`).join('\n'));
  console.log('\nAvailable glyphs:\n  ' + Object.keys(GLYPHS).join(', '));
  process.exit(0);
}

if (flag('--file') || flag('--ext')) {
  const value = (opt('--file') ?? opt('--ext'))?.toLowerCase().replace(/^\*?\./, '');
  const cat = positional.find((p) => p.toLowerCase() !== value);
  if (!value || !cat) die('Provide the file name/extension and the file category.');
  if (!cfg.files[cat]) die(`File category "${cat}" does not exist. See --list.`);
  const key = flag('--file') ? 'fileNames' : 'fileExtensions';
  cfg.files[cat][key] ??= [];
  if (!cfg.files[cat][key].includes(value)) cfg.files[cat][key].push(value);
  save();
  console.log(`✔ ${key === 'fileNames' ? value : '*.' + value} → ${cat}. Now run: npm run package`);
  process.exit(0);
}

const [rawName, category] = positional;
if (!rawName) die('Provide the folder name.');
const name = rawName.toLowerCase();
for (const [k, d] of Object.entries(cfg.folders)) if (d.names.includes(name) && k !== category) die(`"${name}" is already in category "${k}". Remove it there first (src/minecraft-icons.json).`);

if (flag('--new')) {
  const glyph = opt('--glyph'), color = opt('--color');
  if (cfg.folders[name]) die(`Category "${name}" already exists.`);
  if (!GLYPHS[glyph]) die(`Glyph "${glyph}" does not exist. Options: ${Object.keys(GLYPHS).join(', ')}`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color ?? '')) die('Use --color "#rrggbb".');
  cfg.folders[name] = { glyph, color, names: [name], source: 'project', ...(flag('--root') ? { rootNames: [name] } : {}) };
} else {
  if (!category || !cfg.folders[category]) die(`Category "${category}" does not exist. See: npm run add-folder -- --list`);
  const d = cfg.folders[category];
  if (!d.names.includes(name)) d.names.push(name);
  if (flag('--root')) { d.rootNames ??= []; if (!d.rootNames.includes(name)) d.rootNames.push(name); }
}
save();
console.log(`✔ Folder "${name}" added${flag('--new') ? ' as a new category' : ` to category "${category}"`}. Now run: npm run package`);
