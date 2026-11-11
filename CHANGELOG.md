# Changelog

## 1.1.2 — 2026-11-11

### Changed
- Everything is now in English: README, changelog, credits, Marketplace description, theme labels and script messages.
- The no-arrows option is now called **Minecraft Material Icons (No Arrows)** (same theme ID, so existing settings keep working).

## 1.1.1 — 2026-11-11

### Changed
- The extension icon is back to the green pixel-art folder with the colorful grass block.

## 1.1.0 — 2026-11-11

### Added
- **No Arrows** variant, which hides the Explorer's expand/collapse arrows.
- README: how to hide the vertical tree lines (`workbench.tree.renderIndentGuides`).

## 1.0.0 — 2026-11-11

### Added
- Combined **Minecraft Material Icons** theme.
- 61 Minecraft folder categories (289 names, including version folders such as `1.20.1` and `fabric-1.21.1`), with closed and open icons in the Material Icon Theme style: Material's folder shape, one color per icon and a solid pixel-art symbol in a light tint of the same color. Includes names from the ChaoticDimensions project (`chaoticd`, `aurora`, `shadow`, `progression`, `registry`, `worldgen`, `mixin`, `compat`, `orespawn`, `dream_fluid_*`...), analyzed with `npm run scan`.
- 14 mod file categories with colorful pixel-art icons and a dark outline: `fabric.mod.json`, `quilt.mod.json`, `mods.toml`, `neoforge.mods.toml`, `*.mixins.json`, access wideners and transformers, `pack.mcmeta`, NBT and schematics, `*.mcfunction`, `.fsh`/`.vsh` shaders, `.bbmodel`, `sounds.json`, `.zs` and language files.
- General icons from Material Icon Theme 5.40.0 (MIT), with priority given to the Minecraft associations.
- Published under the `hadrykkxd` publisher; source code at https://github.com/hadryphern/minecraft-material-icons.
- `build`, `validate`, `package` (with `.vsix` check), `scan`, `add-folder` and `preview` scripts.
