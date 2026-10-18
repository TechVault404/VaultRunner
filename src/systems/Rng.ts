/**
 * Seeded random numbers (mulberry32), so a seed replays the same run (spec §11.3).
 * Pure logic: no Phaser, no Math.random once seeded.
 */
export class Rng {
  private state: number;

  constructor(readonly seed: number) {
    this.state = seed >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  float(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /** Integer in [min, max] (both included). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    const item = items[Math.floor(this.next() * items.length)];
    if (item === undefined) throw new Error('Rng.pick on an empty list');
    return item;
  }

  /** Picks an item with probability proportional to its weight; null if every weight is 0. */
  weighted<T>(items: readonly T[], weight: (item: T) => number): T | null {
    const total = items.reduce((sum, item) => sum + Math.max(0, weight(item)), 0);
    if (total <= 0) return null;
    let roll = this.next() * total;
    for (const item of items) {
      roll -= Math.max(0, weight(item));
      if (roll < 0) return item;
    }
    return items[items.length - 1] ?? null;
  }
}

/** A fresh random 32-bit seed. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967296) >>> 0;
}
