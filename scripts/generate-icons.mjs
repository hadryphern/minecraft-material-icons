// Gera os SVGs Minecraft no estilo do Material Icon Theme:
//   • pasta com o mesmo formato do Material (fechada/aberta) numa cor;
//   • símbolo pixel-art monocromático num tom claro da mesma cor (sem contorno).
// Arquivos de mod: pixel-art colorida com contorno (src/file-glyphs.mjs).
// Fonte: src/glyphs.mjs (pastas), src/file-glyphs.mjs (arquivos) + src/minecraft-icons.json. Também gera images/icon.png.
import fs from 'node:fs';
import path from 'node:path';
import { GLYPHS } from '../src/glyphs.mjs';
import { FILE_GLYPHS, PALETTE } from '../src/file-glyphs.mjs';
import { r, loadConfig, ids, MC_ICON_DIR } from './lib.mjs';

// Formatos de pasta do Material Icon Theme (MIT © Material Extensions) — ver THIRD_PARTY_NOTICES.md
const FOLDER = 'm6.922 3.768-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232';
const FOLDER_OPEN = 'M14.483 6H4.721a1 1 0 0 0-.949.684L2 12V5h12a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232l-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11l2.403-5.606A1 1 0 0 0 14.483 6';

const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const tint = (c, t = 0.7) => toHex(hex(c).map((v) => v + (255 - v) * t));

function parseGlyph(name, set = GLYPHS, file = 'src/glyphs.mjs') {
  const rows = set[name];
  if (!rows) throw new Error(`Glifo inexistente: "${name}" (veja ${file})`);
  const w = Math.max(...rows.map((row) => row.length));
  if (w > 8 || rows.length > 8) throw new Error(`Glifo "${name}" maior que 8x8`);
  for (const row of rows) if (/[^#.]/.test(row)) throw new Error(`Glifo "${name}" só pode ter '#' e '.'`);
  return rows.map((row) => row.padEnd(w, '.'));
}

// Converte o glifo em UM path (retângulos por linha), em pixels inteiros
function glyphPath(rows, ox, oy, s = 1) {
  let d = '';
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] !== '#') continue;
      let e = x;
      while (row[e + 1] === '#') e++;
      d += `M${ox + x * s} ${oy + y * s}h${(e - x + 1) * s}v${s}h${-(e - x + 1) * s}z`;
      x = e;
    }
  });
  return d;
}

// Símbolo no canto inferior direito, na mesma área usada pelo Material (x 8–16, y 7–15)
function badge(rows) {
  const h = rows.length, w = rows[0].length;
  return glyphPath(rows, 16 - w - Math.floor((8 - w) / 2), 15 - h - Math.floor((8 - h) / 2));
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${body}</svg>\n`;
const folderSvg = (shape, color, glyphColor, rows) =>
  svg(`<path id="folder" fill="${color}" d="${shape}"/><path id="motive" fill="${glyphColor}" shape-rendering="crispEdges" d="${badge(rows)}"/>`);

// ---------- geração ----------
const cfg = loadConfig();
fs.rmSync(MC_ICON_DIR, { recursive: true, force: true });
fs.mkdirSync(MC_ICON_DIR, { recursive: true });
let count = 0;
const write = (id, content) => { fs.writeFileSync(path.join(MC_ICON_DIR, `${id}.svg`), content); count++; };

for (const [key, def] of Object.entries(cfg.folders)) {
  const rows = parseGlyph(def.glyph);
  const g = def.glyphColor ?? tint(def.color);
  write(ids.folder(key), folderSvg(FOLDER, def.color, g, rows));
  write(ids.folderOpen(key), folderSvg(FOLDER_OPEN, def.color, g, rows));
}
// Arquivos de mod: pixel-art COLORIDA 16x16 com contorno escuro (viewBox 32, pixel = 2 unidades)
const OUTLINE = '#1d1d24';
function colorFileSvg(name) {
  const rows = FILE_GLYPHS[name];
  if (!rows) throw new Error(`Glifo de arquivo inexistente: "${name}" (veja src/file-glyphs.mjs)`);
  const w = Math.max(...rows.map((x) => x.length)), h = rows.length;
  if (w > 8 || h > 8) throw new Error(`Glifo de arquivo "${name}" maior que 8x8`);
  const N = 16, grid = Array.from({ length: N }, () => Array(N).fill(null));
  const ox = 8 - w, oy = 8 - h, cells = [];
  rows.forEach((row, y) => row.padEnd(w, '.').split('').forEach((ch, x) => {
    if (ch === '.') return;
    if (!PALETTE[ch]) throw new Error(`Cor "${ch}" inexistente no glifo de arquivo "${name}"`);
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) cells.push([ox + x * 2 + sx, oy + y * 2 + sy, PALETTE[ch]]);
  }));
  const filled = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const X = x + dx, Y = y + dy;
    if (X >= 0 && Y >= 0 && X < N && Y < N && !filled.has(`${X},${Y}`)) grid[Y][X] = OUTLINE;
  }
  for (const [x, y, c] of cells) grid[y][x] = c;
  let rects = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = grid[y][x]; if (!c) continue;
    let e = x; while (e + 1 < N && grid[y][e + 1] === c) e++;
    rects += `<rect x="${x * 2}" y="${y * 2}" width="${(e - x + 1) * 2}" height="2" fill="${c}"/>`;
    x = e;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">${rects}</svg>\n`;
}
for (const [key, def] of Object.entries(cfg.files)) write(ids.file(key), colorFileSvg(def.glyph));

// ---------- ícone da extensão (128x128 PNG) ----------
{
  const rows = parseGlyph('grassCube');
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
<rect width="128" height="128" rx="24" fill="#263238"/>
<g transform="translate(8 6) scale(7)"><path fill="#7cb342" d="${FOLDER_OPEN}"/><path fill="${tint('#7cb342')}" shape-rendering="crispEdges" d="${badge(rows)}"/></g></svg>`;
  fs.mkdirSync(r('images'), { recursive: true });
  fs.writeFileSync(r('images', 'icon.svg'), icon);
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    fs.writeFileSync(r('images', 'icon.png'), new Resvg(icon, { fitTo: { mode: 'width', value: 128 } }).render().asPng());
  } catch (e) {
    if (!fs.existsSync(r('images', 'icon.png'))) throw new Error('Não foi possível gerar images/icon.png: ' + e.message);
    console.warn('Aviso: @resvg/resvg-js indisponível; mantendo images/icon.png existente.');
  }
}

console.log(`✔ ${count} SVGs Minecraft gerados em icons/minecraft/ + images/icon.png`);
