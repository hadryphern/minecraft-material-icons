// Shared helpers for the build scripts.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const r = (...p) => path.join(ROOT, ...p);

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const writeJson = (file, data) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
};

export const loadConfig = () => readJson(r('src', 'minecraft-icons.json'));

// Prefix for every Minecraft icon ID: avoids collisions with Material Icon Theme IDs.
export const MC_PREFIX = 'mc-';
export const ids = {
  folder: (k) => `${MC_PREFIX}folder-${k}`,
  folderOpen: (k) => `${MC_PREFIX}folder-${k}-open`,
  file: (k) => `${MC_PREFIX}file-${k}`
};

export const MC_ICON_DIR = r('icons', 'minecraft');
export const MATERIAL_ICON_DIR = r('icons', 'material');
export const THEME_FILE = r('themes', 'minecraft-material-icons.json');
export const MATERIAL_PKG = r('node_modules', 'material-icon-theme');
