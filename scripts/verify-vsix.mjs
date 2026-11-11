// Checks the generated .vsix: it exists, contains both themes and every referenced SVG,
// and contains no development files.
import fs from 'node:fs';
import path from 'node:path';
import yauzl from 'yauzl';
import { r, readJson } from './lib.mjs';

const pkg = readJson(r('package.json'));
const vsix = r('dist', `${pkg.name}-${pkg.version}.vsix`);
if (!fs.existsSync(vsix)) { console.error(`✖ .vsix not found: ${vsix}`); process.exit(1); }

const entries = new Map();
await new Promise((resolve, reject) => {
  yauzl.open(vsix, { lazyEntries: true }, (e, zip) => {
    if (e) return reject(e);
    zip.on('entry', (en) => {
      if (en.fileName === 'extension/themes/minecraft-material-icons.json' || en.fileName === 'extension/package.json') {
        zip.openReadStream(en, (e2, s) => {
          if (e2) return reject(e2);
          const chunks = []; s.on('data', (c) => chunks.push(c));
          s.on('end', () => { entries.set(en.fileName, Buffer.concat(chunks).toString('utf8')); zip.readEntry(); });
        });
      } else { entries.set(en.fileName, null); zip.readEntry(); }
    });
    zip.on('end', resolve); zip.on('error', reject); zip.readEntry();
  });
});

const errors = [];
const themeTxt = entries.get('extension/themes/minecraft-material-icons.json');
if (!themeTxt) errors.push('theme missing from the .vsix');
if (!entries.has('extension/themes/minecraft-material-icons-no-arrows.json')) errors.push('no-arrows theme missing from the .vsix');
const vpkg = entries.get('extension/package.json') ? JSON.parse(entries.get('extension/package.json')) : null;
if (vpkg?.displayName !== 'Minecraft Material Icons') errors.push('package.json inside the .vsix has the wrong displayName');
let svgs = 0;
if (themeTxt) {
  const theme = JSON.parse(themeTxt);
  for (const [id, d] of Object.entries(theme.iconDefinitions)) {
    const inZip = path.posix.normalize(path.posix.join('extension/themes', d.iconPath));
    if (!entries.has(inZip)) errors.push(`SVG missing from the .vsix: ${inZip} (${id})`); else svgs++;
  }
}
for (const name of entries.keys())
  if (/^extension\/(node_modules|scripts|src|reports|docs)\//.test(name)) errors.push(`Development file inside the .vsix: ${name}`);
for (const req of ['extension/LICENSE.txt', 'extension/THIRD_PARTY_NOTICES.md', 'extension/licenses/material-icon-theme-LICENSE', 'extension/images/icon.png'])
  if (!entries.has(req) && !entries.has(req.replace('.txt', ''))) errors.push(`Missing from the .vsix: ${req}`);

if (errors.length) { errors.slice(0, 30).forEach((e) => console.error('✖ ' + e)); process.exit(1); }
const size = (fs.statSync(vsix).size / 1024 / 1024).toFixed(2);
console.log(`✔ .vsix verified: ${path.relative(r(), vsix)} (${size} MB, ${entries.size} entries, all ${svgs} referenced SVGs present)`);
