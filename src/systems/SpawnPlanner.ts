import { PLAYER, POWERUPS, SPAWN, WORLD, type PowerUpKind } from '../config';
import { SCREEN } from '../theme';
import { patternMinM, PATTERNS, type Lane, type Pattern, type PatternStep, type ThreatKind, type Tier } from './patterns';
import { pickPowerUp, type PowerUpConfig } from './PowerUpSystem';
import type { Rng } from './Rng';

export type SpawnConfig = typeof SPAWN;

/** A threat to put in the world. `x` = left edge in world px (world px = meters × pxPerMeter). */
export interface PlannedThreat {
  kind: ThreatKind;
  x: number;
  w: number;
  /** Glitch: the lane it starts in. */
  lane?: Lane;
  /** Hole: width in ground tiles. */
  tiles?: number;
  /** Drone: start of its wave (radians). Saw: true = at the top of its swing when it reaches the player. */
  phase?: number;
  sawUp?: boolean;
  /** Pattern it belongs to (debugging). */
  pattern: string;
}

/** A coin center in world px. */
export interface PlannedCoin {
  x: number;
  y: number;
}

/** A powerup pickup. `x` = left edge in world px. */
export interface PlannedPowerUp {
  kind: PowerUpKind;
  x: number;
}

/** What one call to `planUntil` adds to the world. */
export interface PlannedWorld {
  threats: PlannedThreat[];
  coins: PlannedCoin[];
  powerUps: PlannedPowerUp[];
}

export interface SpeedCurve {
  speedAt(distanceM: number): number;
  levelAt(distanceM: number): number;
}

/** Minimum gap between two threats at `speed` px/s (spec §11.3). */
export function fairGap(speed: number, config: SpawnConfig = SPAWN): number {
  return speed * config.fairness.reactionS + config.fairness.marginPx;
}

/**
 * Room a threat moving toward the player eats from the gap in front of it before it gets
 * there: it travels from the spawn point to the player at `speed + vRel`.
 */
export function movingGap(vRel: number, speed: number, config: SpawnConfig = SPAWN): number {
  if (vRel <= 0) return 0;
  const travel = SCREEN.w + config.spawnMarginPx - PLAYER.x;
  return (vRel * travel) / (speed + vRel);
}

/** Pattern tier weight at a difficulty level (linear between level 0 and 1). */
export function tierWeight(tier: Tier, level: number, config: SpawnConfig = SPAWN): number {
  const [at0, at1] = config.tierWeights[tier];
  const t = Math.min(1, Math.max(0, level));
  return at0 + (at1 - at0) * t;
}

/**
 * Builds the world ahead of the player out of patterns (spec §11.3), with no Phaser
 * dependency. Only patterns enabled for the current difficulty and distance are picked,
 * every threat waits for its own "from" distance, the first `safeM` meters are empty, and
 * consecutive threats always keep the fairness gap at the speed they will be met.
 */
export class SpawnPlanner {
  /** Right edge (world px) of the last threat placed. */
  private cursor: number;
  private lastPattern = '';
  private readonly patterns: readonly Pattern[];
  /** World px from which the next powerup is due. */
  private nextPowerUpX: number;

  /** `startX` = world px where the run starts (startM × pxPerMeter). */
  constructor(
    private readonly rng: Rng,
    private readonly curve: SpeedCurve,
    startX: number,
    private readonly config: SpawnConfig = SPAWN,
    patterns: readonly Pattern[] = PATTERNS,
    private readonly powerUpConfig: PowerUpConfig = POWERUPS,
  ) {
    this.patterns = patterns;
    // Nothing enters the screen before `safeM`, nor before the screen's right edge at the start.
    const firstEnter = Math.max(config.safeM * WORLD.pxPerMeter, startX) + SCREEN.w + config.spawnMarginPx;
    this.cursor = firstEnter - fairGap(curve.speedAt(firstEnter / WORLD.pxPerMeter), config);
    // The first powerup comes 250–400 m into the run (spec §12), like every next one.
    this.nextPowerUpX = startX + PLAYER.x + this.powerUpSpacing();
  }

  /** World px up to which the world has been planned. */
  get plannedTo(): number {
    return this.cursor;
  }

  /**
   * Keeps the world empty up to `enterX` (tutorial): the next threat can't come before it.
   * Only moves forward; what was already planned stays.
   */
  holdUntil(enterX: number): void {
    this.cursor = Math.max(this.cursor, enterX - fairGap(this.speedAtX(enterX), this.config));
  }

  /** Plans patterns (and powerups when due) until the world is covered up to `worldX`. */
  planUntil(worldX: number): PlannedWorld {
    const world: PlannedWorld = { threats: [], coins: [], powerUps: [] };
    while (this.cursor < worldX) {
      if (this.cursor >= this.nextPowerUpX) this.placePowerUp(world.powerUps);
      else this.placePattern(world.threats, world.coins);
    }
    return world;
  }

  /** Distance (m) at which something at world x enters the screen. */
  private entersAtM(x: number): number {
    return (x - SCREEN.w) / WORLD.pxPerMeter;
  }

  private choose(firstX: number): Pattern {
    const level = this.curve.levelAt(this.entersAtM(firstX));
    const meters = this.entersAtM(firstX);
    let options = this.patterns.filter((p) => level >= p.minLevel && meters >= patternMinM(p));
    if (options.length > 1) options = options.filter((p) => p.id !== this.lastPattern);
    const picked = this.rng.weighted(options, (p) => tierWeight(p.tier, level, this.config));
    return picked ?? options[0] ?? this.patterns[0]!;
  }

  private placePattern(threats: PlannedThreat[], coins: PlannedCoin[]): void {
    const { min, max } = this.config.chunkGapPx;
    const chunkExtra = this.rng.float(min, max);
    // Choose with the earliest possible position; every later threat only lies further on.
    const pattern = this.choose(this.cursor + fairGap(this.speedAtX(this.cursor), this.config));
    this.lastPattern = pattern.id;
    pattern.steps.forEach((step, i) => this.placeStep(pattern, step, i === 0 ? chunkExtra : 0, threats, coins));
  }

  private placeStep(
    pattern: Pattern,
    step: PatternStep,
    extra: number,
    threats: PlannedThreat[],
    coins: PlannedCoin[],
  ): void {
    const { kinds } = this.config;
    const gapStart = this.cursor;
    const vRel = Math.max(...step.kinds.map((k) => kinds[k].vRel));
    const holeTiles = step.kinds.includes('hole') ? this.rng.pick(this.config.hole.tiles) : 0;
    const widthOf = (k: ThreatKind) => (k === 'hole' ? holeTiles * SCREEN.tile : kinds[k].w);
    const stepW = Math.max(...step.kinds.map(widthOf));

    // The speed grows as the world goes by: size the gap with the speed the step will be met at.
    // Speed only grows with x, so a couple of rounds settle it.
    let speed = this.speedAtX(gapStart);
    let x = gapStart;
    for (let round = 0; round < 4; round++) {
      x = gapStart + fairGap(speed, this.config) + movingGap(vRel, speed, this.config) + (step.extraGap ?? 0) + extra;
      if (holeTiles > 0) x = Math.ceil(x / SCREEN.tile) * SCREEN.tile; // holes follow the ground tiles
      const met = this.speedAtX(x + stepW);
      if (met === speed) break;
      speed = met;
    }

    for (const kind of step.kinds) {
      const w = widthOf(kind);
      const threat: PlannedThreat = { kind, x: x + (stepW - w) / 2, w, pattern: pattern.id };
      if (kind === 'hole') threat.tiles = holeTiles;
      if (kind === 'glitch') threat.lane = this.rng.chance(0.5) ? 'low' : 'high';
      if (kind === 'drone') threat.phase = this.rng.float(0, Math.PI * 2);
      if (kind === 'saw') threat.sawUp = this.rng.chance(0.5);
      threats.push(threat);
    }

    if (step.coins === 'row') coins.push(...this.rowCoins(gapStart, x));
    if (step.coins === 'arc') coins.push(...this.arcCoins(x + stepW / 2, speed));
    this.cursor = x + stepW;
  }

  /**
   * A powerup in a slot of its own between two patterns (spec §12: never inside an obstacle):
   * the fairness gap plus some clearance on both sides, so jumping for it is always safe.
   */
  private placePowerUp(powerUps: PlannedPowerUp[]): void {
    const { size } = this.powerUpConfig.pickup;
    const clearance = this.powerUpConfig.clearancePx;
    const x = this.cursor + fairGap(this.speedAtX(this.cursor), this.config) + clearance;
    const kind = pickPowerUp(this.metersAtX(x), this.rng.next(), this.powerUpConfig);
    powerUps.push({ kind, x });
    // The next pattern keeps the clearance too (its own fairness gap starts from here).
    this.cursor = x + size + clearance;
    this.nextPowerUpX = x + this.powerUpSpacing();
  }

  /** Random room until the next powerup (px). */
  private powerUpSpacing(): number {
    const { min, max } = this.powerUpConfig.everyM;
    return this.rng.float(min, max) * WORLD.pxPerMeter;
  }

  /** Distance run (m) when the player reaches world x. */
  private metersAtX(x: number): number {
    return Math.max(0, (x - PLAYER.x) / WORLD.pxPerMeter);
  }

  private speedAtX(x: number): number {
    return this.curve.speedAt(this.metersAtX(x));
  }

  /** A row of coins on the ground lane, centered in the gap [from, to]. */
  private rowCoins(from: number, to: number): PlannedCoin[] {
    const { count, step, y } = this.config.coins.row;
    const start = (from + to) / 2 - ((count - 1) * step) / 2;
    return Array.from({ length: count }, (_, i) => ({ x: start + i * step, y }));
  }

  /** Coins along a full jump centered on `centerX`, at chest height (spec §10.3: arcs). */
  private arcCoins(centerX: number, speed: number): PlannedCoin[] {
    const { at, chestDy } = this.config.coins.arc;
    const air = (-2 * PLAYER.jumpVelocity) / PLAYER.gravity;
    return at.map((f) => {
      const t = f * air;
      const height = -PLAYER.jumpVelocity * t - (PLAYER.gravity * t * t) / 2;
      return { x: centerX + speed * (t - air / 2), y: SCREEN.groundY - chestDy - height };
    });
  }
}
