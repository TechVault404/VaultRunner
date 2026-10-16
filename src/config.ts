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
    /** Hitbox debug view (spec §9); development builds only. */
    debug: ['F1'],
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
// World (spec §10.1)
// ---------------------------------------------------------------------------
export const WORLD = {
  /** 1 meter = 10 px travelled. */
  pxPerMeter: 10,
} as const;

// ---------------------------------------------------------------------------
// Player (spec §9)
// ---------------------------------------------------------------------------
export const PLAYER = {
  /** The world scrolls; the player's frame left edge stays at this x (DISENO §3). */
  x: 64,
  /** px/s². */
  gravity: 900,
  /** px/s; max height ≈ 60 px. */
  jumpVelocity: -330,
  /** Vertical speed multiplier when the jump button is released before the peak. */
  jumpCutMultiplier: 0.5,
  /** A jump still works this long after leaving the ground (ms). */
  coyoteMs: 80,
  /** A jump pressed this long before landing still happens (ms). */
  jumpBufferMs: 100,
  /** px/s. */
  maxFallSpeed: 500,
  /** Vertical speed set by crouching in the air (px/s). */
  fastFallSpeed: 450,
  /** Jumps before touching the ground again; the double-jump powerup (Phase 5) raises it. */
  maxJumps: 1,
  /** Hitboxes inside the 16 × 24 frame: 2 px smaller than the sprite on each side. */
  hitbox: {
    stand: { dx: 2, dy: 2, w: 12, h: 20 },
    /** The crouch pose is the frame's bottom 14 rows. */
    crouch: { dx: 2, dy: 12, w: 12, h: 10 },
  },
} as const;

// ---------------------------------------------------------------------------
// Shooting (spec §9)
// ---------------------------------------------------------------------------
export const SHOOTING = {
  cooldownMs: 350,
  /** px/s, relative to the screen. */
  speed: 300,
  maxOnScreen: 3,
  /** Pooled projectiles; room for the triple shot (Phase 5, 9 on screen). */
  poolSize: 9,
  /** Weapon tip inside the 16 × 24 frame, per pose (measured on player_weapon_*.png). */
  muzzle: { x: 16, y: { run: 10, jump: 6, fall: 8, crouch: 18 } },
} as const;

// ---------------------------------------------------------------------------
// Audio (spec §10.4, §13.1)
// ---------------------------------------------------------------------------
export const AUDIO = {
  /** Music tracks (keys match public/assets/manifest.json "audio"). */
  music: {
    menu: 'music_menu',
    /** One per zone, index = zone − 1. */
    zones: ['music_zona1', 'music_zona2', 'music_zona3', 'music_zona4'],
    gameOver: 'jingle_gameover',
    record: 'jingle_record',
    volume: 0.5,
    jingleVolume: 0.6,
    /** Crossfade between zone tracks (ms). */
    crossfadeMs: 1500,
    /** Fade when changing track between scenes, e.g. menu → game (ms). */
    sceneFadeMs: 600,
    /** Music level while the game is paused (fraction of `volume`). */
    pausedLevel: 0.3,
    /** Fade-out when the run ends, before the jingle (ms). */
    endFadeMs: 300,
    /** Playback rate once the difficulty level reaches `fastFromLevel`. */
    fastRate: 1.05,
    fastFromLevel: 0.8,
  },
  /** Volume per sound effect key (keys match public/assets/manifest.json "audio"). */
  sfx: {
    ui_move: 0.35,
    ui_change: 0.45,
    ui_confirm: 0.5,
    ui_back: 0.45,
    ui_random: 0.5,
    ui_reset: 0.45,
    ui_type: 0.4,
  },
} as const;

// ---------------------------------------------------------------------------
// Difficulty (spec §10.2)
// ---------------------------------------------------------------------------
export const DIFFICULTY = {
  /** px/s at 0 m. */
  startSpeed: 120,
  /** +px/s every `stepEveryM` meters. */
  step: 4,
  stepEveryM: 50,
  /** px/s, never exceeded. */
  maxSpeed: 300,
} as const;

// ---------------------------------------------------------------------------
// Score (spec §10.3)
// ---------------------------------------------------------------------------
export const SCORE = {
  perMeter: 1,
  points: { coin: 10, groundEnemy: 50, flyingEnemy: 50, turret: 100 },
  /** Single coins (patterns arrive in Phase 4): one every min–max meters. */
  coins: {
    everyMinM: 30,
    everyMaxM: 60,
    /** Center y of a coin; all reachable (ground lane or within the ≈60 px jump). Repeats weight the pick. */
    heights: [140, 140, 140, 120, 104, 92],
    /** Spawn just past the right edge (px). */
    spawnX: 328,
    poolSize: 6,
  },
} as const;

// ---------------------------------------------------------------------------
// Biomes (spec §10.1)
// ---------------------------------------------------------------------------
export const BIOMES = {
  /** Start of each zone within a lap (m). */
  startsM: [0, 500, 1500, 3000],
  /** One lap of the 4 zones (m); then zone 1 again with the difficulty kept. */
  lapM: 5000,
} as const;

// ---------------------------------------------------------------------------
// Sections filled in later phases
// ---------------------------------------------------------------------------
export const SPAWN = {} as const; // Phase 4
export const POWERUPS = {} as const; // Phase 5
