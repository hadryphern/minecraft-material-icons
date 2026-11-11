// Símbolos dos ÍCONES DE ARQUIVO de mod: pixel-art ORIGINAL e COLORIDA, com contorno escuro.
// Cada caractere é um pixel; '.' = transparente. As cores vêm de PALETTE. Máximo 8x8.
// Nenhum desenho copia texturas oficiais do Minecraft: são ícones conceituais.
// (Os símbolos das pastas, monocromáticos no estilo Material, ficam em src/glyphs.mjs.)

export const PALETTE = {
  k: '#1d1d24', // contorno / pupila
  w: '#f4f4f4', // branco
  l: '#c9ccd3', // cinza claro (metal)
  g: '#8e939c', // cinza (pedra)
  d: '#565b66', // cinza escuro
  r: '#e04848', // vermelho
  R: '#9e2a2a', // vermelho escuro
  o: '#f0903a', // laranja
  O: '#b85c1a', // laranja escuro
  y: '#f6d24a', // dourado
  Y: '#c2971f', // dourado escuro
  G: '#5cc24a', // verde (grama)
  E: '#2f8a3a', // verde escuro
  b: '#4aa3f0', // azul claro
  B: '#2f5fc4', // azul
  c: '#5fe0d8', // ciano
  C: '#2a9e9a', // turquesa
  p: '#b46cf0', // roxo
  P: '#5b2a9a', // roxo escuro
  m: '#f07ad0', // magenta
  n: '#a8743f', // madeira / terra
  N: '#6b4524', // madeira escura
  s: '#ecd29c'  // papel / areia
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
  speech: [ // arquivos de idioma
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
