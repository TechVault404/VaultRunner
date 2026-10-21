import { AUDIO } from '../config';

export type SfxKey = keyof typeof AUDIO.sfx;
type SfxRules = typeof AUDIO.sfxRules;

/** How many copies of a sound may play at once (spec §13.1: 1, coins up to 3). */
export function maxInstances(key: SfxKey, rules: SfxRules = AUDIO.sfxRules): number {
  return (rules.maxInstances as Partial<Record<string, number>>)[key] ?? 1;
}

/** Playback rate with the ±5 % random pitch of jumps, shots and impacts; 1 for the rest. `random` ∈ [0, 1). */
export function jitterRate(key: SfxKey, random: number, rules: SfxRules = AUDIO.sfxRules): number {
  if (!(rules.jittered as readonly string[]).includes(key)) return 1;
  return 1 + (random * 2 - 1) * rules.pitchJitter;
}

/**
 * Coin pitch (spec §13.1): each coin picked up soon after the previous one sounds a little
 * higher, up to a cap; a pause longer than the window starts over. Pure logic: time comes in.
 */
export class CoinStreak {
  private count = 0;
  private lastAt = -Infinity;

  constructor(private readonly rules: SfxRules['coinStreak'] = AUDIO.sfxRules.coinStreak) {}

  /** A coin at time `nowMs`: returns its playback rate. */
  next(nowMs: number): number {
    this.count = nowMs - this.lastAt <= this.rules.windowMs ? this.count + 1 : 0;
    this.lastAt = nowMs;
    return Math.min(this.rules.max, 1 + this.count * this.rules.step);
  }
}
