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
  /** Over a hole, feet this far below the ground surface mean a fall: the run ends (spec §11.4). */
  holeDeathDepth: 6,
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
    /** Gain at 100 % on the player's volume control. */
    maxVolume: 0.8,
    /** Jingles play this much louder than the music at the same setting. */
    jingleBoost: 1.2,
    /** Volume control (%): 0 = off; − / + move one step. */
    volumeStep: 20,
    defaultVolume: 60,
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
  points: { coin: 10, groundEnemy: 50, flyingEnemy: 50, turret: 100, glitch: 150, closeDodge: 5 },
  /** Close dodge: an obstacle passing within this many px of the player's hitbox (spec §10.3). */
  closeDodgePx: 4,
  coins: {
    /** Pooled coins; the spawn patterns place them in rows and arcs. */
    poolSize: 16,
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
// Spawning: obstacles and enemies (spec §11)
// ---------------------------------------------------------------------------
/** Hitbox inside the sprite frame (px from the frame's top-left). */
export interface Hitbox {
  dx: number;
  dy: number;
  w: number;
  h: number;
}
/** One threat kind: frame size, hitbox, and the distance (m) it can first appear at. */
interface ThreatSpec {
  w: number;
  h: number;
  hitbox: Hitbox;
  minM: number;
  /** px/s it moves toward the player on top of the world speed (it closes the gap in front). */
  vRel: number;
}

export const SPAWN = {
  /** Fixed seed to replay a run; null = a new one every run. `?seed=N` in the URL overrides it. */
  seed: null as number | null,
  /** No threats before this distance (m). */
  safeM: 100,
  /** Fairness rule: two threats are at least `speed × reactionS + marginPx` apart (edge to edge). */
  fairness: { reactionS: 0.6, marginPx: 24 },
  /** Extra random room between two patterns (px). */
  chunkGapPx: { min: 16, max: 72 },
  /** Patterns are planned up to this far past the right edge of the screen (px). */
  lookaheadPx: 320,
  /** Things enter play this far past the right edge, so nothing pops in on screen (px). */
  spawnMarginPx: 16,
  /** Weight of each pattern tier at difficulty level 0 and 1 (linear in between). */
  tierWeights: { easy: [1, 0.25], medium: [0.25, 1], hard: [0, 1] },
  /** Lanes (DISENO §3): center y of the turret bullets; top y of the Glitch's frame. */
  lanes: {
    bullet: { low: 140, high: 128 },
    glitch: { low: 132, high: 118 },
  },
  /** Top y of the air bar (head height, spec §11.1: y = 124–132). */
  airY: 124,
  kinds: {
    low: { w: 16, h: 16, hitbox: { dx: 2, dy: 4, w: 12, h: 12 }, minM: 0, vRel: 0 },
    spikes: { w: 16, h: 16, hitbox: { dx: 2, dy: 6, w: 12, h: 10 }, minM: 0, vRel: 0 },
    air: { w: 32, h: 8, hitbox: { dx: 1, dy: 1, w: 30, h: 6 }, minM: 150, vRel: 0 },
    wall: { w: 16, h: 32, hitbox: { dx: 2, dy: 2, w: 12, h: 30 }, minM: 300, vRel: 0 },
    double: { w: 32, h: 16, hitbox: { dx: 2, dy: 4, w: 28, h: 12 }, minM: 500, vRel: 0 },
    saw: { w: 16, h: 16, hitbox: { dx: 3, dy: 3, w: 10, h: 10 }, minM: 1500, vRel: 0 },
    /** `w` is set per hole (tiles × 16); the hitbox is unused (the ground has no floor there). */
    hole: { w: 32, h: 0, hitbox: { dx: 0, dy: 0, w: 0, h: 0 }, minM: 1500, vRel: 0 },
    bug: { w: 16, h: 16, hitbox: { dx: 2, dy: 6, w: 11, h: 10 }, minM: 100, vRel: 30 },
    drone: { w: 16, h: 12, hitbox: { dx: 2, dy: 3, w: 12, h: 7 }, minM: 400, vRel: 0 },
    /** vRel = its bullet's speed: the bullet closes the gap in front of the turret. */
    turret: { w: 16, h: 16, hitbox: { dx: 2, dy: 6, w: 12, h: 10 }, minM: 1000, vRel: 150 },
    glitch: { w: 16, h: 16, hitbox: { dx: 3, dy: 4, w: 10, h: 11 }, minM: 2000, vRel: 0 },
  } satisfies Record<string, ThreatSpec>,
  saw: { travel: 40, periodMs: 1600 },
  /**
   * Holes are whole ground tiles without floor (2 tiles = 32 px, 3 = 48 px). The edge tiles on
   * each side end 4 px early, so the gap looks 8 px wider than it is: a forgiving edge.
   */
  hole: { tiles: [2, 3] },
  bug: { hp: 1 },
  drone: { hp: 1, centerY: 96, amplitude: 20, periodMs: 1500 },
  turret: { hp: 3, warnMs: 600 },
  bullet: { w: 6, h: 4, hitbox: { dx: 0, dy: 1, w: 6, h: 2 }, speed: 150 },
  glitch: {
    hp: 2,
    warnMs: 400,
    /** The teleport warning starts this long (at the current speed) before it reaches the player (s). */
    teleportLeadS: 1,
  },
  /** Coins placed by the patterns. */
  coins: {
    /** Row on the ground lane, in the gap before a step. */
    row: { count: 4, step: 12, y: 140 },
    /** Arc over a step, following a full jump: points at these fractions of the airtime. */
    arc: { at: [0.1, 0.3, 0.5, 0.7, 0.9], chestDy: 12 },
  },
  pools: { obstacles: 12, bugs: 4, drones: 4, turrets: 2, glitches: 2, bullets: 4, holes: 3 },
} as const;

// ---------------------------------------------------------------------------
// Sections filled in later phases
// ---------------------------------------------------------------------------
export const POWERUPS = {} as const; // Phase 5
