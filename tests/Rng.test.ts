import { describe, expect, it } from 'vitest';
import { Rng } from '../src/systems/Rng';

describe('Rng', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = new Rng(1234);
    const b = new Rng(1234);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(new Rng(1235).next()).not.toBe(seqA[0]);
  });

  it('stays inside its ranges', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(2, 3);
      expect([2, 3]).toContain(n);
    }
  });

  it('weights its picks and skips zero weights', () => {
    const rng = new Rng(99);
    const counts = { a: 0, b: 0, c: 0 };
    const weights = { a: 3, b: 1, c: 0 };
    for (let i = 0; i < 4000; i++) counts[rng.weighted(['a', 'b', 'c'] as const, (k) => weights[k])!]++;
    expect(counts.c).toBe(0);
    expect(counts.a / counts.b).toBeGreaterThan(2.5);
    expect(counts.a / counts.b).toBeLessThan(3.5);
    expect(rng.weighted(['x'], () => 0)).toBeNull();
  });
});
