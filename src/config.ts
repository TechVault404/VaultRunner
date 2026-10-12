/**
 * Single source of truth for game balance and behavior.
 * Visual values (colors, UI positions, layers, visual timings) live in theme.ts.
 * No magic numbers outside these two files (spec §3 + DISENO.md).
 */

// ---------------------------------------------------------------------------
// Save system (spec §7)
// ---------------------------------------------------------------------------
export const SAVE = {
  storageKey: 'vault-runner-save',
  version: 1,
  nameMaxLength: 10,
} as const;

// ---------------------------------------------------------------------------
// Character options (spec §8; counts match public/assets/manifest.json)
// ---------------------------------------------------------------------------
export const CHARACTER = {
  skins: 4,
  outfits: 4,
  outfitColors: 8,
  /** Style 0 = no hair (no layer drawn). */
  hairs: 5,
  hairColors: 6,
  /** 0 = none (no layer drawn). */
  accessories: 5,
  weapons: 3,
  /** Characters allowed in the name (upper case; must exist in the pixel font). */
  nameCharset: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÁÉÍÓÚÜÑ ',
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
  /** Max simultaneous touch pointers (jump + crouch + shoot button). */
  activePointers: 3,
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
// Player (spec §9) — rest in Phase 2
// ---------------------------------------------------------------------------
export const PLAYER = {
  /** The world scrolls; the player's frame left edge stays at this x (DISENO §3). */
  x: 64,
} as const;

// ---------------------------------------------------------------------------
// Sections filled in later phases
// ---------------------------------------------------------------------------
export const SHOOTING = {} as const; // Phase 2
export const DIFFICULTY = {} as const; // Phase 3
export const SCORE = {} as const; // Phase 3
export const BIOMES = {} as const; // Phase 3
export const AUDIO = {} as const; // Phase 3
export const SPAWN = {} as const; // Phase 4
export const POWERUPS = {} as const; // Phase 5
