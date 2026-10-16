import { SCORE } from '../config';
import type { SaveData } from './SaveSystem';

export type ScoreConfig = typeof SCORE;
export type ScoreEvent = keyof typeof SCORE.points;

/**
 * Points of one run (spec §10.3). Pure logic: the Game scene feeds it distance and events.
 * `multiplier` (×2 powerup, Phase 5) applies to everything, distance included.
 */
export class ScoreSystem {
  multiplier = 1;
  private points = 0;
  private recordBeaten = false;

  /** `best` = personal record before this run. */
  constructor(
    private readonly best: number,
    private readonly config: ScoreConfig = SCORE,
  ) {}

  /** Whole points so far. */
  get score(): number {
    return Math.floor(this.points);
  }

  addDistance(meters: number): void {
    this.points += meters * this.config.perMeter * this.multiplier;
  }

  /** Adds the points of an event and returns them (already multiplied) for the floating text. */
  award(event: ScoreEvent): number {
    const gained = this.config.points[event] * this.multiplier;
    this.points += gained;
    return gained;
  }

  /** True once, the first time the score passes a record above 0. */
  checkRecordBeaten(): boolean {
    if (this.recordBeaten || this.best <= 0 || this.score <= this.best) return false;
    this.recordBeaten = true;
    return true;
  }

  get hasBeatenRecord(): boolean {
    return this.recordBeaten;
  }
}

export interface RunResult {
  score: number;
  distance: number;
  enemies: number;
}

/**
 * Applies a finished run to the save: best score and distance only go up, stats add up.
 * Returns whether the score is a new personal record.
 */
export function applyRunResult(data: SaveData, run: RunResult): boolean {
  const newRecord = run.score > data.bestScore;
  if (newRecord) data.bestScore = run.score;
  data.bestDistance = Math.max(data.bestDistance, run.distance);
  data.stats.runs += 1;
  data.stats.totalEnemiesKilled += run.enemies;
  return newRecord;
}
