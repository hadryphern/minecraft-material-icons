// Generates the Minecraft SVGs:
//   • folders in the Material Icon Theme style: Material's folder shape (closed/open) in one color,
//     with a solid monochrome pixel-art symbol in a light tint of the same color;
//   • mod files: colorful pixel art with a dark outline (src/file-glyphs.mjs).
// Sources: src/glyphs.mjs (folders), src/file-glyphs.mjs (files) + src/minecraft-icons.json. Also generates images/icon.png.
import fs from 'node:fs';
import path from 'node:path';
import { GLYPHS } from '../src/glyphs.mjs';
import { FILE_GLYPHS, PALETTE } from '../src/file-glyphs.mjs';
import { r, loadConfig, ids, MC_ICON_DIR } from './lib.mjs';

// Folder shapes from Material Icon Theme (MIT © Material Extensions) — see THIRD_PARTY_NOTICES.md
const FOLDER = 'm6.922 3.768-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232';
const FOLDER_OPEN = 'M14.483 6H4.721a1 1 0 0 0-.949.684L2 12V5h12a1 1 0 0 0-1-1H7.562a1 1 0 0 1-.64-.232l-.644-.536A1 1 0 0 0 5.638 3H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11l2.403-5.606A1 1 0 0 0 14.483 6';

const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));
const toHex = (rgb) => '#' + rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const tint = (c, t = 0.7) => toHex(hex(c).map((v) => v + (255 - v) * t));

function parseGlyph(name, set = GLYPHS, file = 'src/glyphs.mjs') {
  const rows = set[name];
  if (!rows) throw new Error(`Unknown glyph: "${name}" (see ${file})`);
  const w = Math.max(...rows.map((row) => row.length));
  if (w > 8 || rows.length > 8) throw new Error(`Glyph "${name}" is larger than 8x8`);
  for (const row of rows) if (/[^#.]/.test(row)) throw new Error(`Glyph "${name}" may only contain '#' and '.'`);
  return rows.map((row) => row.padEnd(w, '.'));
}

// Converts the glyph into ONE path (one rectangle per row run), on whole pixels
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

// Symbol in the bottom-right corner, in the same area Material uses (x 8–16, y 7–15)
function badge(rows) {
  const h = rows.length, w = rows[0].length;
  return glyphPath(rows, 16 - w - Math.floor((8 - w) / 2), 15 - h - Math.floor((8 - h) / 2));
}

const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${body}</svg>\n`;
const folderSvg = (shape, color, glyphColor, rows) =>
  svg(`<path id="folder" fill="${color}" d="${shape}"/><path id="motive" fill="${glyphColor}" shape-rendering="crispEdges" d="${badge(rows)}"/>`);

// ---------- generation ----------
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
// Mod files: COLORFUL 16x16 pixel art with a dark outline (viewBox 32, pixel = 2 units)
const OUTLINE = '#1d1d24';
function colorFileSvg(name) {
  const rows = FILE_GLYPHS[name];
  if (!rows) throw new Error(`Unknown file glyph: "${name}" (see src/file-glyphs.mjs)`);
  const w = Math.max(...rows.map((x) => x.length)), h = rows.length;
  if (w > 8 || h > 8) throw new Error(`File glyph "${name}" is larger than 8x8`);
  const N = 16, grid = Array.from({ length: N }, () => Array(N).fill(null));
  const ox = 8 - w, oy = 8 - h, cells = [];
  rows.forEach((row, y) => row.padEnd(w, '.').split('').forEach((ch, x) => {
    if (ch === '.') return;
    if (!PALETTE[ch]) throw new Error(`Unknown color "${ch}" in file glyph "${name}"`);
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

// ---------- extension icon (128x128 PNG): pixel-art folder + colorful grass block ----------
{
  const N = 16, g = Array.from({ length: N }, () => Array(N).fill(null));
  const fill = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < N && j < N) g[j][i] = c; };
  const mixc = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
  const base = '#6fbf4a', back = mixc(base, '#000000', 0.3);
  // pixel-art open folder
  fill(1, 2, 5, 1, back); fill(1, 3, 14, 10, back);
  for (const [y, a0, b0] of [[6, 4, 15], [7, 4, 15], [8, 3, 14], [9, 3, 14], [10, 2, 13], [11, 2, 13], [12, 1, 12]]) fill(a0, y, b0 - a0 + 1, 1, mixc(base, '#ffffff', 0.05));
  fill(4, 6, 12, 1, mixc(base, '#ffffff', 0.25)); fill(1, 12, 12, 1, mixc(base, '#000000', 0.1));
  // colorful grass block with outline, bottom-right corner
  const rows = FILE_GLYPHS.grassCube, h = rows.length, w = rows[0].length;
  const ox = N - w - Math.floor((8 - w) / 2), oy = N - h - Math.floor((8 - h) / 2), cells = [];
  rows.forEach((row, y) => row.split('').forEach((ch, x) => { if (ch !== '.') cells.push([ox + x, oy + y, PALETTE[ch]]); }));
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of cells) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (!set.has(`${x + dx},${y + dy}`)) fill(x + dx, y + dy, 1, 1, OUTLINE);
  for (const [x, y, c] of cells) fill(x, y, 1, 1, c);
  let rects = '';
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const c = g[y][x]; if (!c) continue;
    let e = x; while (e + 1 < N && g[y][e + 1] === c) e++;
    rects += `<rect x="${x * 2}" y="${y * 2}" width="${(e - x + 1) * 2}" height="2" fill="${c}"/>`; x = e;
  }
  const icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" shape-rendering="crispEdges">
<rect width="128" height="128" rx="20" fill="#2b2b33"/><rect x="6" y="6" width="116" height="116" rx="16" fill="#34343e"/>
<g transform="translate(16 12) scale(3)">${rects}</g></svg>`;
  fs.mkdirSync(r('images'), { recursive: true });
  fs.writeFileSync(r('images', 'icon.svg'), icon);
  try {
    const { Resvg } = await import('@resvg/resvg-js');
    fs.writeFileSync(r('images', 'icon.png'), new Resvg(icon, { fitTo: { mode: 'width', value: 128 } }).render().asPng());
  } catch (e) {
    if (!fs.existsSync(r('images', 'icon.png'))) throw new Error('Could not generate images/icon.png: ' + e.message);
    console.warn('Warning: @resvg/resvg-js unavailable; keeping the existing images/icon.png.');
  }
}

console.log(`✔ ${count} Minecraft SVGs generated in icons/minecraft/ + images/icon.png`);
