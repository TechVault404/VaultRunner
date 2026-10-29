import { POWERUPS, SHOOTING, type PowerUpKind } from '../config';
import type { FireConfig } from './FireControl';

export type PowerUpConfig = typeof POWERUPS;

/** One running effect: time left and its full duration (ms). */
export interface ActivePowerUp {
  kind: PowerUpKind;
  leftMs: number;
  totalMs: number;
}

/** What a hit does to the player (spec §11.4, §12). */
export type HitOutcome =
  /** Invulnerable (turbo, or the second after the shield or the turbo): nothing happens. */
  | 'ignored'
  /** The shield took it: it breaks and 1 s of invulnerability starts. */
  | 'shielded'
  /** No protection: the run ends. */
  | 'dead';

/**
 * The player's active powerups (spec §12), with no Phaser dependency so it can be tested.
 * Time only advances through `update`, which the Game scene calls with its own delta: a
 * paused scene (or the hit-stop) does not count. Different powerups stack; picking up one
 * that is already active starts its time over.
 */
export class PowerUpSystem {
  /** In pickup order: the first one picked is first (the HUD draws it rightmost). */
  private readonly running: ActivePowerUp[] = [];
  private invulnLeft = 0;

  constructor(private readonly config: PowerUpConfig = POWERUPS) {}

  get active(): readonly ActivePowerUp[] {
    return this.running;
  }

  /** Starts an effect, or starts its time over if it is already active. Returns true if it is new. */
  activate(kind: PowerUpKind): boolean {
    const totalMs = this.config.durationMs[kind];
    const current = this.running.find((p) => p.kind === kind);
    if (current) {
      current.leftMs = totalMs;
      return false;
    }
    this.running.push({ kind, leftMs: totalMs, totalMs });
    return true;
  }

  /** Advances the timers; returns the effects that just ran out. */
  update(deltaMs: number): PowerUpKind[] {
    this.invulnLeft = Math.max(0, this.invulnLeft - deltaMs);
    const ended: PowerUpKind[] = [];
    for (const p of this.running) {
      p.leftMs -= deltaMs;
      if (p.leftMs <= 0) ended.push(p.kind);
    }
    for (const kind of ended) this.end(kind);
    return ended;
  }

  isActive(kind: PowerUpKind): boolean {
    return this.running.some((p) => p.kind === kind);
  }

  /** Turbo, or the blinking second after the shield breaks or the turbo ends. */
  get invulnerable(): boolean {
    return this.isActive('turbo') || this.invulnLeft > 0;
  }

  /** The blinking second after the shield or the turbo (not the turbo itself). */
  get blinking(): boolean {
    return this.invulnLeft > 0 && !this.isActive('turbo');
  }

  /** Something hit the player: decides whether the run goes on. The shield saves exactly one hit. */
  hit(): HitOutcome {
    if (this.invulnerable) return 'ignored';
    if (!this.isActive('shield')) return 'dead';
    this.end('shield');
    // Breaking the shield leaves 1 s of invulnerability (running out of time does not).
    this.invulnLeft = this.config.invulnMs;
    return 'shielded';
  }

  get scoreMultiplier(): number {
    return this.isActive('x2') ? this.config.x2.multiplier : 1;
  }

  get speedMultiplier(): number {
    return this.isActive('turbo') ? this.config.turbo.speedMultiplier : 1;
  }

  get maxJumps(): number {
    return this.isActive('doublejump') ? this.config.doublejump.maxJumps : 1;
  }

  /** Cooldown and on-screen limit of the player's shots. */
  get fire(): FireConfig {
    return this.isActive('tripleshot') ? this.config.tripleshot : SHOOTING;
  }

  /** Shot angles (degrees) of one trigger pull. */
  get shotAngles(): readonly number[] {
    return this.isActive('tripleshot') ? this.config.tripleshot.anglesDeg : [0];
  }

  /** Ends an effect early (the shield breaking) or on time. */
  private end(kind: PowerUpKind): void {
    const index = this.running.findIndex((p) => p.kind === kind);
    if (index < 0) return;
    this.running.splice(index, 1);
    // The turbo always ends with 1 s of invulnerability (spec §12).
    if (kind === 'turbo') this.invulnLeft = this.config.invulnMs;
  }
}

/**
 * Picks the kind of the next powerup by its chance (spec §12), leaving out the kinds not
 * allowed yet at `meters`. `roll` is a number in [0, 1).
 */
export function pickPowerUp(meters: number, roll: number, config: PowerUpConfig = POWERUPS): PowerUpKind {
  const kinds = (Object.keys(config.chance) as PowerUpKind[]).filter((k) => meters >= config.minM[k]);
  const total = kinds.reduce((sum, k) => sum + config.chance[k], 0);
  let left = roll * total;
  for (const kind of kinds) {
    left -= config.chance[kind];
    if (left < 0) return kind;
  }
  return kinds[kinds.length - 1] ?? 'shield';
}
