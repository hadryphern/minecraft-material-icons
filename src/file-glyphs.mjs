// Mod FILE ICON symbols: ORIGINAL, COLORFUL pixel art with a dark outline.
// Each character is one pixel; '.' = transparent. Colors come from PALETTE. 8x8 max.
// No drawing copies official Minecraft textures: these are conceptual icons.
// (Folder symbols, monochrome in the Material style, live in src/glyphs.mjs.)

export const PALETTE = {
  k: '#1d1d24', // outline / pupil
  w: '#f4f4f4', // white
  l: '#c9ccd3', // light gray (metal)
  g: '#8e939c', // gray (stone)
  d: '#565b66', // dark gray
  r: '#e04848', // red
  R: '#9e2a2a', // dark red
  o: '#f0903a', // orange
  O: '#b85c1a', // dark orange
  y: '#f6d24a', // gold
  Y: '#c2971f', // dark gold
  G: '#5cc24a', // green (grass)
  E: '#2f8a3a', // dark green
  b: '#4aa3f0', // light blue
  B: '#2f5fc4', // blue
  c: '#5fe0d8', // cyan
  C: '#2a9e9a', // teal
  p: '#b46cf0', // purple
  P: '#5b2a9a', // dark purple
  m: '#f07ad0', // magenta
  n: '#a8743f', // wood / dirt
  N: '#6b4524', // dark wood
  s: '#ecd29c'  // paper / sand
};

export const FILE_GLYPHS = {
  spool: [ // fabric.mod.json
    'nnnnnnn',
    '.swsss.',
    '.sssss.',
    '.sssss.',
    '.sssss.',
    'nnnnnnn'
  ],
  patchwork: [ // quilt.mod.json
    'ppbbmm',
    'ppbbmm',
    'yyGGpp',
    'yyGGpp',
    'bbmmyy',
    'bbmmyy'
  ],
  anvil: [ // mods.toml (Forge)
    'llllllll',
    '..llllll',
    '...lll..',
    '...lll..',
    '..ggggg.',
    '.ggggggg'
  ],
  anvilOrange: [ // neoforge.mods.toml
    'oooooooo',
    '..oooooo',
    '...ooo..',
    '...ooo..',
    '..OOOOO.',
    '.OOOOOOO'
  ],
  potion: [ // *.mixins.json
    '..NN..',
    '..ll..',
    '.l..l.',
    'lmbmbl',
    'lwmbml',
    'lmbmbl',
    '.llll.'
  ],
  key: [ // access widener / transformer
    '.yyy....',
    'yy.yy...',
    'y...yyyy',
    'yy.yy.y.',
    '.yyy..y.'
  ],
  grassCube: [ // pack.mcmeta, pack.png
    '...GG...',
    '.GGGGGG.',
    'EGGGGGGE',
    'nEEGGEEN',
    'nnnnNNNN',
    'nnnnNNNN',
    '.nnnNNN.',
    '...nN...'
  ],
  tower: [ // .nbt, schematics
    'l.l.l.l',
    'lllllll',
    '.lllll.',
    '.lldll.',
    '.lllll.',
    '.llnll.',
    '.llnll.'
  ],
  terminal: [ // .mcfunction
    'llllllll',
    'lddddddl',
    'ldGddddl',
    'lddGdddl',
    'ldGdGGdl',
    'lddddddl',
    'llllllll'
  ],
  rainbow: [ // shaders .fsh/.vsh
    '..rrrr..',
    '.ryyyyr.',
    'rybbbbyr',
    'ryb..byr',
    'ryb..byr'
  ],
  wireCube: [ // .bbmodel
    '..bbbbbb',
    '.b....bb',
    'bbbbbb.b',
    'b.B..b.b',
    'b.BBBbbb',
    'bB...bb.',
    'bbbbbb..'
  ],
  note: [ // sounds.json
    '..bbbbb',
    '..b...b',
    '..b...b',
    '..b...b',
    'bbb.bbb',
    'bbb.bbb'
  ],
  craftGrid: [ // .zs
    'nnnnnnn',
    'nssnssn',
    'nssnssn',
    'nnnnnnn',
    'nssnssn',
    'nssnssn',
    'nnnnnnn'
  ],
  speech: [ // language files
    'wwwwwww',
    'wwwBwww',
    'wwBwBww',
    'wwBBBww',
    'wwBwBww',
    'wwwwwww',
    '.ww....',
    '.w.....'
  ]
};
