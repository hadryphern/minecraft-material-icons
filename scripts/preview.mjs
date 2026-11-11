// Generates images/preview.png: a sheet with every Minecraft icon (dark and light backgrounds).
import fs from 'node:fs';
import path from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { r, loadConfig, ids, MC_ICON_DIR } from './lib.mjs';

const cfg = loadConfig();
const entries = [
  ...Object.keys(cfg.folders).map((k) => ({ label: k, icons: [ids.folder(k), ids.folderOpen(k)] })),
  ...Object.keys(cfg.files).map((k) => ({ label: 'file:' + k, icons: [ids.file(k)] }))
];
const S = 32, COLW = 300, ROWH = 40, COLS = 3;
const rows = Math.ceil(entries.length / COLS);
const W = COLW * COLS * 2, H = rows * ROWH + 20;
const vb = (id) => Number(fs.readFileSync(path.join(MC_ICON_DIR, id + '.svg'), 'utf8').match(/viewBox="0 0 (\d+)/)[1]);
const inner = (id) => fs.readFileSync(path.join(MC_ICON_DIR, id + '.svg'), 'utf8').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
let body = '';
entries.forEach((e, i) => {
  const col = i % COLS, row = Math.floor(i / COLS);
  for (const [half, suffix, fg] of [[0, '', '#ccc'], [1, '', '#333']]) {
    const x0 = half * COLW * COLS + col * COLW + 10, y0 = row * ROWH + 14;
    e.icons.forEach((id, j) => {
      body += `<g transform="translate(${x0 + j * (S + 6)} ${y0}) scale(${S / vb(id + suffix)})">${inner(id + suffix)}</g>`;
      body += `<g transform="translate(${x0 + 2 * (S + 6) + j * 20} ${y0 + 8}) scale(${16 / vb(id + suffix)})">${inner(id + suffix)}</g>`;
    });
    body += `<text x="${x0 + 2 * (S + 6) + 46}" y="${y0 + 21}" font-family="sans-serif" font-size="13" fill="${fg}">${e.label}</text>`;
  }
});
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W / 2}" height="${H}" fill="#1f1f1f"/><rect x="${W / 2}" width="${W / 2}" height="${H}" fill="#ffffff"/>${body}</svg>`;
fs.mkdirSync(r('reports'), { recursive: true });
fs.writeFileSync(r('images', 'preview.png'), new Resvg(svg, { font: { loadSystemFonts: true } }).render().asPng());
console.log('✔ images/preview.png');
