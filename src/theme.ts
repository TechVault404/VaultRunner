/**
 * Vault Runner — tokens visuales (fuente única de verdad del diseño).
 * Contraparte visual de config.ts: config.ts guarda balance de juego; este archivo guarda
 * colores, tipografía, medidas, capas, tiempos de animación y posiciones de UI.
 * Todo está en píxeles LÓGICOS (lienzo de 320 × 180). Ver DISENO.md.
 */

// ─── Paleta Endesga 32 (los únicos colores permitidos) ─────────────────────
export const PALETTE = {
  rust: 0xbe4a2f, clay: 0xd77643, sand: 0xead4aa, tan: 0xe4a672,
  brown: 0xb86f50, dbrown: 0x733e39, ddbrown: 0x3e2731, dred: 0xa22633,
  red: 0xe43b44, orange: 0xf77622, amber: 0xfeae34, yellow: 0xfee761,
  green: 0x63c74d, dgreen: 0x3e8948, ddgreen: 0x265c42, dteal: 0x193c3e,
  dblue: 0x124e89, blue: 0x0099db, cyan: 0x2ce8f5, white: 0xffffff,
  lgray: 0xc0cbdc, gray: 0x8b9bb4, dgray: 0x5a6988, navy: 0x3a4466,
  dnavy: 0x262b44, black: 0x181425, neon: 0xff0044, plum: 0x68386c,
  magenta: 0xb55088, pink: 0xf6757a, peach: 0xe8b796, skin: 0xc28569,
} as const;
export type PaletteName = keyof typeof PALETTE;

/** Convierte un color de la paleta a cadena CSS ('#rrggbb') para Text o estilos. */
export const css = (c: PaletteName): string => '#' + PALETTE[c].toString(16).padStart(6, '0');

// ─── Colores semánticos (usar ESTOS en el código, no los de la paleta) ─────
export const COLOR = {
  bg: PALETTE.black,            // fondo de escenas sin escenario
  surface: PALETTE.dnavy,       // paneles, bordes de panel
  surfaceRaised: PALETTE.navy,  // celdas, filas, vistas previas
  outline: PALETTE.black,       // contorno de sprites y sombra de texto

  textPrimary: PALETTE.white,   // puntaje, valores, botones
  textSecondary: PALETTE.lgray, // texto de apoyo
  textMuted: PALETTE.gray,      // etiquetas (RÉCORD, PIEL, PUNTAJE…)
  textDisabled: PALETTE.dgray,  // ayudas de teclado, deshabilitado

  accent: PALETTE.cyan,         // distancia, selección, foco, zona actual
  accentStrong: PALETTE.blue,   // botón normal
  accentDeep: PALETTE.dblue,    // botón presionado, sombra de texto en botón
  record: PALETTE.amber,        // récord, monedas, nombre del jugador
  points: PALETTE.yellow,       // textos flotantes de puntos (+10, +50)
  danger: PALETTE.neon,         // peligro, aviso de torreta, barra < 25 %
  enemyKill: PALETTE.pink,      // contador de enemigos
} as const;

// Rampa de 3 tonos por material: [luz, medio, sombra]
export const RAMP = {
  skin: [['sand', 'peach', 'skin'], ['peach', 'tan', 'brown'], ['tan', 'brown', 'dbrown'], ['brown', 'dbrown', 'ddbrown']],
  outfit: [['red', 'dred', 'ddbrown'], ['amber', 'orange', 'rust'], ['yellow', 'amber', 'clay'], ['green', 'dgreen', 'ddgreen'],
           ['cyan', 'blue', 'dblue'], ['blue', 'dblue', 'dnavy'], ['magenta', 'plum', 'ddbrown'], ['lgray', 'gray', 'dgray']],
  hair: [['navy', 'dnavy', 'black'], ['brown', 'dbrown', 'ddbrown'], ['yellow', 'amber', 'clay'], ['orange', 'rust', 'dbrown'],
         ['pink', 'magenta', 'plum'], ['cyan', 'blue', 'dblue']],
} as const satisfies Record<string, readonly (readonly [PaletteName, PaletteName, PaletteName])[]>;

// Identidad de cada zona: color principal y acento (carteles, partículas, flashes)
export const ZONE_COLORS = [
  { name: 'CIUDAD PIXEL', main: PALETTE.neon, accent: PALETTE.cyan },
  { name: 'BOSQUE GLITCH', main: PALETTE.dgreen, accent: PALETTE.magenta },
  { name: 'SERVIDOR ABANDONADO', main: PALETTE.dgray, accent: PALETTE.green },
  { name: 'NÚCLEO DE LA IA', main: PALETTE.cyan, accent: PALETTE.plum },
] as const;

// ─── Tipografía ──────────────────────────────────────────────────────────
export const FONT = {
  key: 'vault',            // BitmapFont (assets/fonts/vault5x7.png/.xml)
  size: 9,                 // tamaño nativo: glifo 5×7 + 2 filas para acentos
  lineHeight: 11,
  glyphHeight: 7,          // alto del glifo sin acentos (centrado vertical en botones)
  scale: { body: 1, title: 2, display: 3 }, // SOLO enteros
  shadowOffset: 1,         // sombra dura de 1 px abajo-derecha, color COLOR.outline
  ascent: 2,               // filas de acento sobre el glifo: la y de un texto es la parte superior del glifo
  uppercase: true,         // la fuente solo tiene mayúsculas: text.toUpperCase()
} as const;

// ─── Espaciado y medidas ─────────────────────────────────────────────────
export const SPACE = { xxs: 2, xs: 4, sm: 6, md: 8, lg: 12, xl: 16, xxl: 24 } as const;

export const SCREEN = { w: 320, h: 180, cx: 160, cy: 90, safe: 5, groundY: 148, tile: 16 } as const;

export const UI = {
  nineSlice: 5,                       // borde de button.png y panel.png
  button: { h: 16, hPrimary: 18, minW: 60, padX: 8, iconGap: 3, pressedOffsetY: 1, stackGap: 4 },
  panel: { pad: 8 },
  icon: 12,                           // icons.png, powerups.png
  touch: { size: 32, alpha: 0.55, margin: 8 },
  overlay: { menu: 0.25, editor: 0.45, banner: 0.6, pause: 0.65, gameOver: 0.7 },
  selector: { h: 13, labelDx: 2, labelDy: -8, valueDy: 3, arrowLeftDx: 2, arrowRightInset: 13, arrowDy: 1 },
  swatch: { light: 2, shade: 2, frame: 2 }, // filas de luz arriba, de sombra abajo, marco blanco de selección
} as const;

// ─── HUD (posiciones fijas) ──────────────────────────────────────────────
export const HUD = {
  score: { x: 5, y: 5, digits: 7 },         // blanco, 7 dígitos con ceros
  best: { x: 5, y: 15 },                    // gris; ámbar y parpadeo al superarlo
  distance: { x: 5, y: 25 },                // cian, "128 M"
  pause: { x: 299, y: 5, size: 16 },
  powerups: {
    right: 288, y: 4, step: 18,             // crecen hacia la izquierda desde x = 288
    box: { w: 16, h: 19, alpha: 0.55 },     // fondo negro
    bar: { dx: 2, dy: 15, w: 11, h: 2 },    // barra de tiempo dentro de la caja
    lowFraction: 0.25,                      // barra en COLOR.danger por debajo de esto
    blinkLastMs: 2000, blinkHz: 4,
  },
  banner: { y: 64, h: 29, lineColor: PALETTE.cyan }, // cartel de cambio de zona
  toast: { y: 30, h: 15 },                           // "¡RÉCORD SUPERADO!"
} as const;

// ─── Capas de dibujo (setDepth) ──────────────────────────────────────────
export const DEPTH = {
  bgFar: 0, bgMid: 1, bgNear: 2, ground: 10, obstacles: 20, pickups: 25,
  enemies: 30, enemyBullets: 35, player: 40, playerFx: 41, projectiles: 45,
  fx: 50, floatingText: 60, hud: 100, touch: 110, overlay: 200, transition: 300,
} as const;

// ─── Movimiento y tiempos ────────────────────────────────────────────────
export const PARALLAX = { far: 0.1, mid: 0.3, near: 0.6, ground: 1 } as const;

/** Patrón del suelo (tiles/zona{N}.png): la fila superior alterna top_a/top_b; el relleno usa fill_b cada `fillAltEvery` columnas. */
export const GROUND_TILES = { columns: 6, top: ['top_a', 'top_b'], fill: 'fill_a', fillAlt: 'fill_b', fillAltEvery: 3 } as const;

export const ANIM_FPS = {
  run: 12, crouch: 6, shoot: 12, death: 10, coin: 10, bug: 10, drone: 14,
  glitch: 10, explosion: 13, saw: 16, laser: 8, dust: 14, spark: 16, shield: 6, aura: 12, trail: 15,
} as const;

export const TIMING = {
  sceneFade: 200,
  buttonPress: 80,          // duración del estado presionado antes de ejecutar
  hitFlash: 80,             // parpadeo blanco al recibir daño (enemigos)
  hitStop: 40,
  explosion: 300,
  floatingText: { duration: 600, rise: 12 },
  zoneBanner: { in: 250, hold: 1500, out: 250 },
  recordToast: 1500,
  invulnBlinkHz: 10,
  cursorBlink: 400,         // medio periodo del cursor "_" del campo de nombre
  deathShake: 200, deathSlowMo: 600,
  powerupBob: { amplitude: 2, period: 1200 },
  menuIdleBob: { amplitude: 1, period: 800 },
} as const;

export const SHAKE = { light: { ms: 100, intensity: 0.004 }, heavy: { ms: 200, intensity: 0.012 } } as const;

// ─── Formato de números y textos ─────────────────────────────────────────
export const fmtScoreHud = (n: number) => String(Math.floor(n)).padStart(HUD.score.digits, '0');
export const fmtNumber = (n: number) => Math.floor(n).toLocaleString('es-MX'); // 12,480
export const fmtDistance = (m: number) => `${fmtNumber(m)} M`;

// ─── Composición de pantallas (coordenadas de screens/*.png) ──
type Box = { x: number; y: number; w: number; h: number };
const box = (x: number, y: number, w: number, h: number): Box => ({ x, y, w, h });

export const LAYOUT = {
  preload: { bar: box(110, 88, 100, 4) },
  menu: {
    scrollSpeed: 20,                              // px/s del fondo en movimiento lento
    logo: { y: 10 },
    character: { x: 56, scale: 2 },               // x = borde izquierdo del frame, pies en el suelo
    name: { x: 72, y: 98 },
    play: box(124, 74, 72, 18),
    characterButton: box(124, 96, 72, 16),
    record: { panel: box(112, 118, 96, 22), labelY: 122, valueY: 131 },
    settings: { x: 250, y: 6, step: 22, size: 18 }, // música, sonido, pantalla completa
  },
  editor: {
    title: { y: 6 },
    // Columna izquierda: selectores ◀ ▶ (piel, ropa, cabello, accesorio, arma)
    selectors: { x: 6, y: 30, w: 104, step: 22 },
    // Columna central: vista previa ×4 sobre una losa de suelo
    preview: { panel: box(118, 20, 84, 116), x: 128, feetY: 120, scale: 4, floor: box(122, 118, 76, 14) },
    name: { y: 124 },                             // nombre en ámbar bajo los pies
    // Columna derecha: muestras de color y nombre
    outfitColors: { x: 212, y: 31, w: 20, h: 10, cols: 4, colStep: 25, rowStep: 13 },
    hairColors: { x: 212, y: 71, w: 28, h: 10, cols: 3, colStep: 33, rowStep: 13 },
    swatchLabelDy: -9,
    nameField: { box: box(210, 110, 105, 15), labelDx: 2, labelDy: -8, textDx: 6, textDy: 4 },
    hint: { y: 140 },
    random: box(6, 150, 92, 18),
    reset: box(104, 150, 92, 18),
    save: box(202, 150, 113, 18),
  },
  game: {
    debugEnd: box(130, 5, 60, 16),               // temporal hasta la Fase 4
  },
  pause: {
    panel: box(104, 40, 112, 100),
    title: { y: 50 },
    buttons: { x: 116, y: 72, w: 88, h: 16, step: 20 },
  },
  gameOver: {
    banner: {
      area: box(70, 8, 181, 23), textY: 13, edge: 2, // filas de luz arriba y sombra abajo
      fill: PALETTE.amber, highlight: PALETTE.yellow, shade: PALETTE.clay, textShadow: PALETTE.rust,
      sparks: [{ x: 58, y: 14, frame: 0 }, { x: 254, y: 14, frame: 2 }],
    },
    panel: box(70, 38, 180, 96),
    character: { x: 78, feetY: 104, scale: 2 },
    name: { x: 94, y: 110 },
    rows: { labelX: 122, valueX: 242, y: 46, step: 16, separatorDy: 11 },
    retry: box(70, 146, 86, 18),
    menu: box(164, 146, 86, 18),
  },
} as const;
