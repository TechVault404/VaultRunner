import { describe, expect, it } from 'vitest';
import { PLAYER, SPAWN, WORLD } from '../src/config';
import { DifficultySystem } from '../src/systems/DifficultySystem';
import { PATTERNS, validatePattern } from '../src/systems/patterns';
import { Rng } from '../src/systems/Rng';
import { fairGap, movingGap, SpawnPlanner, type PlannedThreat } from '../src/systems/SpawnPlanner';
import { SCREEN } from '../src/theme';

const curve = new DifficultySystem();
const LAP_PX = 6000 * WORLD.pxPerMeter;

function plan(seed: number, startM = 0, untilPx = LAP_PX): PlannedThreat[] {
  const planner = new SpawnPlanner(new Rng(seed), curve, startM * WORLD.pxPerMeter);
  return planner.planUntil(untilPx).threats;
}

/** Threats grouped by step (same pattern step = overlapping x). */
function steps(threats: PlannedThreat[]): PlannedThreat[][] {
  const groups: PlannedThreat[][] = [];
  for (const t of threats) {
    const last = groups[groups.length - 1];
    const lastRight = last ? Math.max(...last.map((g) => g.x + g.w)) : -Infinity;
    if (last && t.x < lastRight) last.push(t);
    else groups.push([t]);
  }
  return groups;
}

const enterM = (x: number) => (x - SCREEN.w) / WORLD.pxPerMeter;
const metM = (x: number) => (x - PLAYER.x) / WORLD.pxPerMeter;

describe('patterns', () => {
  it('has at least 15 patterns over the three tiers', () => {
    expect(PATTERNS.length).toBeGreaterThanOrEqual(15);
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      expect(PATTERNS.filter((p) => p.tier === tier).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('are all valid (no impossible combinations)', () => {
    expect(PATTERNS.flatMap(validatePattern)).toEqual([]);
    expect(new Set(PATTERNS.map((p) => p.id)).size).toBe(PATTERNS.length);
  });

  it('rejects impossible steps', () => {
    const bad = (kinds: (keyof typeof SPAWN.kinds)[]) =>
      validatePattern({ id: 'x', tier: 'easy', minLevel: 0, steps: [{ kinds }] });
    expect(bad(['air', 'low'])).not.toEqual([]); // crouch and jump at once
    expect(bad(['low', 'wall'])).not.toEqual([]);
    expect(bad(['drone', 'wall'])).not.toEqual([]);
    expect(bad(['drone', 'low'])).toEqual([]);
  });
});

describe('SpawnPlanner', () => {
  it('keeps the first 100 m free of threats', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const first = plan(seed)[0]!;
      expect(enterM(first.x)).toBeGreaterThanOrEqual(SPAWN.safeM);
    }
  });

  it('never brings a threat before its own distance', () => {
    for (const seed of [11, 22, 33]) {
      for (const t of plan(seed)) expect(enterM(t.x)).toBeGreaterThanOrEqual(SPAWN.kinds[t.kind].minM);
    }
  });

  it('keeps the fairness gap between threats at the speed they are met', () => {
    for (const seed of [101, 202, 303, 404]) {
      const groups = steps(plan(seed));
      for (let i = 1; i < groups.length; i++) {
        const prevRight = Math.max(...groups[i - 1]!.map((t) => t.x + t.w));
        const next = groups[i]!;
        const x = Math.min(...next.map((t) => t.x));
        const speed = curve.speedAt(metM(x));
        const vRel = Math.max(...next.map((t) => SPAWN.kinds[t.kind].vRel));
        expect(x - prevRight).toBeGreaterThanOrEqual(fairGap(speed) + movingGap(vRel, speed) - 0.001);
      }
    }
  });

  it('is fair at top speed too (≥ 204 px at 300 px/s)', () => {
    const groups = steps(plan(9, 4000, 7000 * WORLD.pxPerMeter));
    expect(groups.length).toBeGreaterThan(20);
    for (let i = 1; i < groups.length; i++) {
      const prevRight = Math.max(...groups[i - 1]!.map((t) => t.x + t.w));
      expect(Math.min(...groups[i]!.map((t) => t.x)) - prevRight).toBeGreaterThanOrEqual(300 * 0.6 + 24);
    }
  });

  it('repeats the same world for the same seed', () => {
    expect(plan(77)).toEqual(plan(77));
    expect(plan(77)).not.toEqual(plan(78));
  });

  it('uses every kind and every pattern over a long run', () => {
    const threats = [123, 456, 789].flatMap((seed) => plan(seed, 0, 12000 * WORLD.pxPerMeter));
    expect(new Set(threats.map((t) => t.kind))).toEqual(new Set(Object.keys(SPAWN.kinds)));
    expect(new Set(threats.map((t) => t.pattern))).toEqual(new Set(PATTERNS.map((p) => p.id)));
  });

  it('puts holes on whole ground tiles', () => {
    const holes = plan(5, 0, 12000 * WORLD.pxPerMeter).filter((t) => t.kind === 'hole');
    expect(holes.length).toBeGreaterThan(0);
    for (const h of holes) {
      expect(h.x % SCREEN.tile).toBe(0);
      expect(h.w).toBeGreaterThanOrEqual(32);
      expect(h.w).toBeLessThanOrEqual(48);
    }
  });

  it('starts past the screen when a run starts further on', () => {
    const first = plan(3, 2250)[0]!;
    expect(first.x).toBeGreaterThan(2250 * WORLD.pxPerMeter + SCREEN.w);
  });
});
