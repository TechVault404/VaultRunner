import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../src/systems/SaveSystem';
import { applyRunResult, ScoreSystem } from '../src/systems/ScoreSystem';

describe('ScoreSystem', () => {
  it('gives 1 point per meter, adding up fractions', () => {
    const score = new ScoreSystem(0);
    for (let i = 0; i < 10; i++) score.addDistance(0.25);
    expect(score.score).toBe(2);
    score.addDistance(0.5);
    expect(score.score).toBe(3);
  });

  it('awards the points of each event and returns them', () => {
    const score = new ScoreSystem(0);
    expect(score.award('coin')).toBe(10);
    expect(score.award('groundEnemy')).toBe(50);
    expect(score.award('flyingEnemy')).toBe(50);
    expect(score.award('turret')).toBe(100);
    expect(score.score).toBe(210);
  });

  it('applies the multiplier to everything, distance included', () => {
    const score = new ScoreSystem(0);
    score.multiplier = 2;
    score.addDistance(10);
    expect(score.award('coin')).toBe(20);
    expect(score.score).toBe(40);
  });

  it('reports beating the record once, and never against a record of 0', () => {
    const fresh = new ScoreSystem(0);
    fresh.addDistance(100);
    expect(fresh.checkRecordBeaten()).toBe(false);

    const score = new ScoreSystem(100);
    score.addDistance(100);
    expect(score.checkRecordBeaten()).toBe(false); // equal is not beaten
    score.addDistance(1);
    expect(score.checkRecordBeaten()).toBe(true);
    score.addDistance(50);
    expect(score.checkRecordBeaten()).toBe(false);
    expect(score.hasBeatenRecord).toBe(true);
  });
});

describe('applyRunResult', () => {
  it('saves a higher score and distance and counts the run', () => {
    const save = createDefaultSave();
    expect(applyRunResult(save, { score: 500, distance: 400, enemies: 3 })).toBe(true);
    expect(save.bestScore).toBe(500);
    expect(save.bestDistance).toBe(400);
    expect(save.stats).toEqual({ runs: 1, totalEnemiesKilled: 3 });
  });

  it('never overwrites the record with a lower or equal score', () => {
    const save = createDefaultSave();
    applyRunResult(save, { score: 500, distance: 400, enemies: 0 });
    expect(applyRunResult(save, { score: 300, distance: 450, enemies: 1 })).toBe(false);
    expect(applyRunResult(save, { score: 500, distance: 100, enemies: 0 })).toBe(false);
    expect(save.bestScore).toBe(500);
    expect(save.bestDistance).toBe(450); // the distance record is kept on its own
    expect(save.stats).toEqual({ runs: 3, totalEnemiesKilled: 1 });
  });
});
