# Minecraft Material Icons

Tema de ícones para o VS Code que **combina**:

1. **Ícones Minecraft próprios** no estilo minimalista do Material (pasta numa cor e símbolo pixel-art num tom claro da mesma cor) para as pastas e arquivos típicos de mods: Fabric, Forge, NeoForge e Quilt, em Java ou Kotlin;
2. **Ícones gerais derivados do [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme)** (licença MIT) para todo o resto: JavaScript, TypeScript, Java, Python, JSON, YAML, XML, Markdown, imagens, fontes, Docker, Git, Gradle, npm, bancos de dados, pastas comuns etc.

Cada pasta Minecraft tem versão **fechada e aberta**. Como no Material Icon Theme, cada ícone tem **uma cor só**: a pasta usa o mesmo formato do Material, e o símbolo é uma forma cheia, monocromática, num tom claro dessa cor. Pastas que o Material já tinha (`src`, `config`, `test`, `java`, `gradle`...) mantêm as cores dele; as novas usam a mesma paleta Material Design. Os **arquivos de mod** (`fabric.mod.json`, `*.mixins.json`, `pack.mcmeta`...) usam ícones pixel-art coloridos com contorno escuro, para se destacarem. Os mesmos ícones funcionam nos temas escuro, claro e de alto contraste.

> Projeto não oficial. Não é afiliado à Mojang Studios nem à Microsoft. Nenhuma textura ou asset do Minecraft foi copiado: os ícones são conceituais (portal, bloco, engrenagem, mundo, banco de dados, espada, rede, código...).

![Prévia dos ícones Minecraft (tema escuro e claro)](https://raw.githubusercontent.com/hadryphern/minecraft-material-icons/main/images/preview.png)

## Instalação

**Pelo Marketplace:** procure **Minecraft Material Icons** na aba *Extensions* do VS Code, ou rode `ext install hadrykkxd.minecraft-material-icons` no Quick Open (`Ctrl+P`).

**Pelo .vsix:** abra o VS Code e vá em *Extensions* (`Ctrl+Shift+X`). Clique em `...` (canto superior direito), escolha **Install from VSIX...** e selecione `minecraft-material-icons-1.1.0.vsix`.

**Pelo terminal:**

```bash
code --install-extension "minecraft-material-icons-1.1.0.vsix"
```

**Ativar o tema:** `Ctrl+Shift+P` → **Preferences: File Icon Theme** → **Minecraft Material Icons**.

Há duas opções no seletor:
- **Minecraft Material Icons**: com as setinhas (›/⌄) ao lado das pastas.
- **Minecraft Material Icons (sem setas)**: esconde as setinhas do Explorer. O ícone de pasta aberta ou fechada indica o estado.

**Esconder as linhas verticais da árvore:** elas são uma configuração do VS Code, não do tema. Em `Ctrl+Shift+P` → **Preferences: Open User Settings (JSON)**, adicione:

```json
"workbench.tree.renderIndentGuides": "none"
```

A extensão é independente: ela **não altera** a instalação do Material Icon Theme. As duas podem ficar instaladas; vale o tema escolhido em *File Icon Theme*.

## Regras de prioridade

Quando um nome tem mais de uma associação, vale esta ordem:

1. Associação específica de **pasta Minecraft** (`folderNames`, `folderNamesExpanded`, `rootFolderNames`, `rootFolderNamesExpanded`)
2. Associação específica de **arquivo Minecraft** (`fileNames` e `fileExtensions` de mods)
3. Associação geral do **Material Icon Theme**
4. Ícone **genérico** (arquivo/pasta padrão do Material)

Extensões gerais continuam com o ícone do Material: `.java`, `.json`, `.js`, `.ts`, `.py`, `.md`, `.yml`, `.yaml`, `.xml`, `.toml`, `.gradle`, `.properties`, `.png`, `.jpg`, `.svg`, `.gif`, `.wav` e `.ogg`.

Arquivos de mod com ícone Minecraft: `fabric.mod.json`, `quilt.mod.json`, `mods.toml`, `neoforge.mods.toml`, `*.mixins.json`, `*.accesswidener`, `accesstransformer.cfg`, `pack.mcmeta`, `pack.png`, `*.mcmeta`, `*.nbt`, `*.snbt`, `*.schem`, `*.litematic`, `*.mcfunction`, `*.fsh`, `*.vsh`, `*.bbmodel`, `sounds.json`, `*.zs`, `*.lang` e arquivos de idioma (`en_us.json`, `pt_br.json`...).

O VS Code compara nomes sem diferenciar maiúsculas de minúsculas: `META-INF` e `meta-inf` usam o mesmo ícone.

<!-- FOLDERS:START -->
## Pastas: encontradas e previstas

Último scan: projeto `chaoticdimensions` (2026-11-11): Minecraft 1.20.1, Fabric, Java 134 / Kotlin 0 arquivos.

Nomes específicos do seu projeto: `registry`, `chaoticdimensions`, `worldgen`, `mixin`, `compat`, `versions`, `progression`.

| Categoria | Nomes de pasta | Origem | Status |
|---|---|---|---|
| src | `src` | convencional | ✅ encontrada |
| main | `main` | convencional | ✅ encontrada |
| client | `client` | convencional | ✅ encontrada |
| common | `common` | convencional | 🔮 prevista |
| server | `server` `dedicatedserver` | convencional | 🔮 prevista |
| java | `java` | convencional | ✅ encontrada |
| kotlin | `kotlin` | convencional | 🔮 prevista |
| com | `com` `net` `org` `blue` | convencional | ✅ encontrada |
| api | `api` | convencional | 🔮 prevista |
| core | `core` `gameplay` | convencional | ✅ encontrada |
| init | `init` | convencional | 🔮 prevista |
| registry | `registry` `registries` | projeto | ✅ encontrada |
| blocks | `blocks` `block` | convencional | ✅ encontrada |
| items | `items` `item` `armor` `ingots` | convencional | ✅ encontrada |
| entities | `entities` `entity` `mobs` `mob` `entity_types` | convencional | ✅ encontrada |
| blockentities | `blockentities` `blockentity` `block_entity` `block_entities` `tileentities` `tileentity` | convencional | 🔮 prevista |
| fluids | `fluids` `fluid` `water` | convencional | ✅ encontrada |
| biomes | `biomes` `biome` `tree` `trees` | convencional | ✅ encontrada |
| dimensions | `dimensions` `dimension` `dimension_type` `dimension_types` `aurora` `shadow` | convencional | ✅ encontrada |
| chaoticdimensions | `chaoticdimensions` `chaotic_dimensions` `chaotic-dimensions` `chaoticd` | projeto | ✅ encontrada |
| worldgen | `worldgen` `configured_feature` `placed_feature` `noise_settings` `density_function` `carver` `carvers` `noise` | projeto | ✅ encontrada |
| structures | `structures` `structure` `template_pool` `processor_list` `structure_set` `dream_fluid_cavern` `dream_fluid_island` `dream_fluid_sky_lake` | convencional | ✅ encontrada |
| recipes | `recipes` `recipe` `crafting` | convencional | ✅ encontrada |
| loot | `loot` `loot_tables` `loot_table` `loottables` `loot_modifiers` `trade` `trades` | convencional | ✅ encontrada |
| commands | `commands` `command` | convencional | ✅ encontrada |
| events | `events` `event` | convencional | 🔮 prevista |
| networking | `networking` `network` `netcode` | convencional | ✅ encontrada |
| packets | `packets` `packet` | convencional | 🔮 prevista |
| mixin | `mixin` `mixins` `accessor` `accessors` `injection` | projeto | ✅ encontrada |
| compat | `compat` `compatibility` `jei` `rei` `emi` | projeto | 🔮 prevista |
| config | `config` `configs` | convencional | 🔮 prevista |
| datagen | `datagen` `data_gen` | convencional | 🔮 prevista |
| test | `test` `tests` | convencional | ✅ encontrada |
| gametest | `gametest` `gametests` `game_test` | convencional | 🔮 prevista |
| resources | `resources` `resource` `orespawn` `ores` | convencional | ✅ encontrada |
| assets | `assets` | convencional | ✅ encontrada |
| data | `data` | convencional | ✅ encontrada |
| minecraft | `minecraft` | convencional | ✅ encontrada |
| versions | `versions` `version` `mc-versions` `1.7.10` `1.8.9` `1.12.2` … (+20, veja docs/FOLDERS.md) | projeto | ✅ encontrada |
| lang | `lang` `langs` | convencional | ✅ encontrada |
| textures | `textures` `texture` | convencional | ✅ encontrada |
| models | `models` `geo` | convencional | ✅ encontrada |
| blockstates | `blockstates` `blockstate` | convencional | ✅ encontrada |
| sounds | `sounds` `sound` | convencional | 🔮 prevista |
| shaders | `shaders` `shader` `post_effect` | convencional | 🔮 prevista |
| particles | `particles` `particle` | convencional | 🔮 prevista |
| tags | `tags` `tag` `mineable` `c` | convencional | ✅ encontrada |
| advancements | `advancements` `advancement` `achievements` | convencional | ✅ encontrada |
| progression | `progression` | projeto | ✅ encontrada |
| enchantments | `enchantments` `enchantment` `enchant` | convencional | ✅ encontrada |
| effects | `effects` `effect` `potions` `potion` `mob_effect` `mob_effects` | convencional | ✅ encontrada |
| gui | `gui` `screen` `screens` `menu` | convencional | ✅ encontrada |
| render | `render` `renderer` `renderers` `rendering` `visual` | convencional | ✅ encontrada |
| gradle | `gradle` `buildsrc` `buildlogic` `build-logic` `wrapper` | convencional | ✅ encontrada |
| run | `run` `runs` `run-client` `run-server` `rundata` | convencional | 🔮 prevista |
| generated | `generated` | convencional | 🔮 prevista |
| meta-inf | `meta-inf` | convencional | 🔮 prevista |
| fabric | `fabric` `fabric-1.7.10` `fabric-1.8.9` `fabric-1.12.2` `fabric-1.16.5` `fabric-1.18.2` … (+18, veja docs/FOLDERS.md) | convencional | ✅ encontrada |
| forge | `forge` `forge-1.7.10` `forge-1.8.9` `forge-1.12.2` `forge-1.16.5` `forge-1.18.2` … (+18, veja docs/FOLDERS.md) | convencional | ✅ encontrada |
| neoforge | `neoforge` `neoforged` `neoforge-1.7.10` `neoforge-1.8.9` `neoforge-1.12.2` `neoforge-1.16.5` … (+19, veja docs/FOLDERS.md) | convencional | ✅ encontrada |
| quilt | `quilt` `quilt-1.7.10` `quilt-1.8.9` `quilt-1.12.2` `quilt-1.16.5` `quilt-1.18.2` … (+18, veja docs/FOLDERS.md) | convencional | ✅ encontrada |
<!-- FOLDERS:END -->

## Desenvolvimento

Requisitos: Node.js 18 ou superior.

```bash
npm install        # instala vsce, o Material Icon Theme oficial (npm, MIT) e utilitários
npm run package    # gera ícones, funde o tema, valida e cria dist/minecraft-material-icons-<versão>.vsix
```

| Script | O que faz |
|---|---|
| `npm run icons` | Gera os SVGs Minecraft em `icons/minecraft/` e o ícone `images/icon.png` |
| `npm run theme` | Funde o Material Icon Theme com os ícones Minecraft em `themes/minecraft-material-icons.json` e copia só os SVGs do Material que são usados |
| `npm run validate` | Valida `package.json`, todos os JSONs, todos os SVGs, as referências quebradas, os caminhos absolutos e as regras de prioridade |
| `npm run build` | `icons` + `theme` + `validate` |
| `npm run package` | `build` + `vsce package` + verificação do conteúdo do `.vsix` |
| `npm run scan -- "<pasta do mod>"` | Analisa um projeto de mod (somente leitura) |
| `npm run add-folder -- ...` | Adiciona pastas e arquivos ao tema |
| `npm run preview` | Gera `images/preview.png` com todos os ícones Minecraft |

### Estrutura

```
package.json                     manifesto da extensão
themes/minecraft-material-icons.json   tema gerado (não editar à mão)
icons/minecraft/                 SVGs Minecraft gerados (personalizados)
icons/material/                  SVGs copiados do Material Icon Theme (MIT)
images/icon.png                  ícone da extensão
src/minecraft-icons.json         ← configuração: categorias, cores, nomes de pastas e arquivos
src/glyphs.mjs                   ← símbolos das pastas (pixel-art cheia, uma cor)
src/file-glyphs.mjs              ← ícones de arquivo de mod (pixel-art colorida + PALETTE)
scripts/                         build, validação, scan, add-folder, verificação do .vsix
licenses/, THIRD_PARTY_NOTICES.md   licença e créditos do Material Icon Theme
```

## Adicionar novas pastas depois

```bash
npm run add-folder -- --list                              # categorias e glifos disponíveis
npm run add-folder -- dimensoes dimensions                # "dimensoes" usa o ícone de portal
npm run add-folder -- meumod chaoticdimensions --root     # também quando for raiz do workspace
npm run add-folder -- quests --new --glyph trophy --color "#8a6a1a"   # categoria nova
npm run add-folder -- --file mymod.mixins.json mixin-config
npm run add-folder -- --ext mcpack pack-meta
npm run package
```

Você também pode editar `src/minecraft-icons.json` diretamente. Para um desenho novo, adicione um glifo em `src/glyphs.mjs` (pastas) ou `src/file-glyphs.mjs` (arquivos): uma grade de até 8×8 com `#` (pixel) e `.` (vazio). A cor da pasta vem de `color` em `src/minecraft-icons.json`, e o símbolo usa automaticamente um tom claro dela (ou `glyphColor`, se você definir).

## Analisar o seu projeto de mod

```bash
npm run scan -- "C:\caminho\do\seu\mod"
npm run package
```

O scan identifica a versão do Minecraft, o loader (Fabric, Forge, NeoForge, Quilt ou Architectury), Java e/ou Kotlin, os arquivos Gradle, o wrapper, os subprojetos e os source sets. Ele também lista as pastas encontradas (com ícone Minecraft, com ícone do Material ou sem ícone) e as categorias apenas previstas. Ele **nunca cria nem altera pastas** no seu projeto. Depois do `npm run package`, a tabela de pastas deste README passa a marcar as pastas encontradas.

## Atualizar a extensão no futuro

1. Faça as mudanças (`add-folder`, `src/minecraft-icons.json` ou `src/glyphs.mjs`).
2. Aumente a versão: `npm version patch --no-git-tag-version` (ou `minor`/`major`).
3. Registre a mudança no `CHANGELOG.md`.
4. Rode `npm run package` para gerar o novo `dist/minecraft-material-icons-<versão>.vsix`.
5. Publique: em marketplace.visualstudio.com/manage, abra a extensão → **Update** → envie o novo `.vsix`. Ou instale o novo `.vsix` pelo mesmo procedimento. Como o ID é o mesmo (`hadrykkxd.minecraft-material-icons`), ele substitui a versão anterior. Recarregue a janela se pedido.

**Atualizar os ícones gerais do Material:**

```bash
npm install material-icon-theme@latest --save-dev --save-exact
npm run package
```

O build copia de novo apenas os SVGs necessários, reaplica a prioridade Minecraft e valida tudo.

## Créditos e licença

- Ícones Minecraft, scripts e configuração: © hadryphern, MIT. Veja `LICENSE`. Código-fonte: https://github.com/hadryphern/minecraft-material-icons
- Formato das pastas (fechada/aberta) e ícones gerais: [Material Icon Theme](https://github.com/material-extensions/vscode-material-icon-theme) © Material Extensions, licença MIT. A cópia da licença original está em `licenses/material-icon-theme-LICENSE` e os detalhes em `THIRD_PARTY_NOTICES.md`. Os SVGs vêm do pacote oficial `material-icon-theme` no npm e não foram modificados.
- Minecraft é marca registrada da Mojang Studios/Microsoft. Esta extensão não é oficial.
