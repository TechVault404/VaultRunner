/**
 * Single source of truth for every tunable value in the game.
 * No magic numbers outside this file (spec §3, "Reglas de código para la IA").
 */

/** Endesga 32 — the global game palette (spec §4). */
export const PALETTE = {
  rust: 0xbe4a2f,
  orangeBrown: 0xd77643,
  sand: 0xead4aa,
  tan: 0xe4a672,
  brown: 0xb86f50,
  darkBrown: 0x733e39,
  plum: 0x3e2731,
  crimson: 0xa22633,
  red: 0xe43b44,
  orange: 0xf77622,
  gold: 0xfeae34,
  yellow: 0xfee761,
  green: 0x63c74d,
  darkGreen: 0x3e8948,
  forest: 0x265c42,
  deepTeal: 0x193c3e,
  navy: 0x124e89,
  blue: 0x0099db,
  cyan: 0x2ce8f5,
  white: 0xffffff,
  lightGray: 0xc0cbdc,
  gray: 0x8b9bb4,
  slate: 0x5a6988,
  darkSlate: 0x3a4466,
  midnight: 0x262b44,
  black: 0x181425,
  hotPink: 0xff0044,
  purple: 0x68386c,
  magenta: 0xb55088,
  pink: 0xf6757a,
  peach: 0xe8b796,
  clay: 0xc28569,
} as const;

/** Converts a palette value to a CSS hex string (for Phaser Text styles). */
export function toCss(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

// ---------------------------------------------------------------------------
// Core / rendering (spec §3 "Resolución y escalado")
// ---------------------------------------------------------------------------
export const GAME = {
  width: 320,
  height: 180,
  tileSize: 16,
  /** Y coordinate of the ground surface; the ground fills the 2 bottom tile rows. */
  groundY: 148,
  backgroundColor: PALETTE.black,
  /** Max simultaneous touch pointers (jump + crouch + shoot button). */
  activePointers: 3,
} as const;

// ---------------------------------------------------------------------------
// Scene transitions (spec §7)
// ---------------------------------------------------------------------------
export const TRANSITIONS = {
  fadeMs: 200,
  fadeColor: { r: 0, g: 0, b: 0 },
} as const;

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------
export const UI = {
  fontFamily: 'monospace',
  fontSizeTitle: '16px',
  fontSizeButton: '8px',
  fontSizeSmall: '8px',
  textColor: PALETTE.white,
  mutedColor: PALETTE.gray,
  focusColor: PALETTE.yellow,
  titleColor: PALETTE.cyan,
  buttonSpacing: 14,
  /** Prefix shown before the focused button label. */
  focusMarker: '> ',
  pauseOverlayColor: PALETTE.black,
  pauseOverlayAlpha: 0.7,
  margin: 6,
} as const;

/** Y positions (game px) of UI elements per scene. */
export const LAYOUT = {
  menu: { titleY: 24, recordY: 42, previewY: 76, buttonsY: 104 },
  characterEditor: { titleY: 24, noteY: 80, backY: 140 },
  game: { infoY: 12 },
  pause: { titleY: 50, buttonsY: 80 },
  gameOver: { titleY: 30, statsY: 56, statsSpacing: 12, buttonsY: 124 },
} as const;

// ---------------------------------------------------------------------------
// Save system (spec §7)
// ---------------------------------------------------------------------------
export const SAVE = {
  storageKey: 'vault-runner-save',
  version: 1,
  nameMaxLength: 10,
} as const;

// ---------------------------------------------------------------------------
// Input (spec §6)
// ---------------------------------------------------------------------------
export const INPUT = {
  /** Phaser KeyCodes names per abstract action. */
  keys: {
    jump: ['SPACE', 'W', 'UP'],
    crouch: ['S', 'DOWN'],
    shoot: ['J', 'K'],
    pause: ['ESC', 'P'],
    uiUp: ['UP', 'W'],
    uiDown: ['DOWN', 'S'],
    uiLeft: ['LEFT', 'A'],
    uiRight: ['RIGHT', 'D'],
    uiConfirm: ['ENTER', 'SPACE'],
    uiBack: ['ESC', 'BACKSPACE'],
  },
  /** Vertical drag (in game px) on the left half that turns a touch into "crouch". */
  swipeDownThreshold: 12,
  gamepad: {
    /** Standard mapping button indices. */
    buttonA: 0,
    buttonB: 1,
    buttonStart: 9,
    dpadUp: 12,
    dpadDown: 13,
    dpadLeft: 14,
    dpadRight: 15,
    axisDeadzone: 0.5,
  },
} as const;

// ---------------------------------------------------------------------------
// Placeholders (spec §3: colored rectangles until real assets exist)
// ---------------------------------------------------------------------------
export const PLACEHOLDERS = {
  player: { key: 'placeholder-player', width: 16, height: 24, color: PALETTE.orange },
  groundTop: { key: 'placeholder-ground-top', color: PALETTE.slate },
  groundFill: { key: 'placeholder-ground-fill', color: PALETTE.darkSlate },
} as const;

// ---------------------------------------------------------------------------
// Sections filled in later phases
// ---------------------------------------------------------------------------
export const PLAYER = {
  /** The world scrolls; the player stays at this x (spec §9). */
  x: 64,
} as const; // rest in Phase 2
export const SHOOTING = {} as const; // Phase 2
export const DIFFICULTY = {} as const; // Phase 3
export const SCORE = {} as const; // Phase 3
export const BIOMES = {} as const; // Phase 3
export const AUDIO = {} as const; // Phase 3
export const SPAWN = {} as const; // Phase 4
export const POWERUPS = {} as const; // Phase 5
