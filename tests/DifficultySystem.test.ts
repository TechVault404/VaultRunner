import { describe, expect, it } from 'vitest';
import { DIFFICULTY } from '../src/config';
import { DifficultySystem } from '../src/systems/DifficultySystem';

describe('DifficultySystem', () => {
  const difficulty = new DifficultySystem();

  it('starts at 120 px/s and adds 4 px/s every 50 m', () => {
    expect(difficulty.speedAt(0)).toBe(120);
    expect(difficulty.speedAt(49.9)).toBe(120);
    expect(difficulty.speedAt(50)).toBe(124);
    expect(difficulty.speedAt(125)).toBe(128);
  });

  it('reaches 300 px/s at 2,250 m and never goes above', () => {
    expect(difficulty.speedAt(2249)).toBe(296);
    expect(difficulty.speedAt(2250)).toBe(DIFFICULTY.maxSpeed);
    expect(difficulty.speedAt(1_000_000)).toBe(DIFFICULTY.maxSpeed);
  });

  it('exposes a 0–1 level', () => {
    expect(difficulty.levelAt(0)).toBe(0);
    expect(difficulty.levelAt(1500)).toBeCloseTo(2 / 3); // 240 px/s
    expect(difficulty.levelAt(10_000)).toBe(1);
  });
});
