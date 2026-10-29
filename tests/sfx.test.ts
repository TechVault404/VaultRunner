import { describe, expect, it } from 'vitest';
import { AUDIO } from '../src/config';
import { CoinStreak, jitterRate, maxInstances } from '../src/systems/sfx';

describe('sound effect rules', () => {
  it('has a volume for every sound of spec §13.1', () => {
    const keys = ['jump', 'double_jump', 'land', 'crouch', 'shoot_0', 'shoot_1', 'shoot_2', 'enemy_hit', 'enemy_explode',
      'turret_shot', 'coin', 'powerup_pickup', 'powerup_end', 'shield_break', 'zone_change', 'death', 'ui_move', 'ui_confirm'];
    for (const key of keys) expect(AUDIO.sfx).toHaveProperty(key);
  });

  it('plays one instance of each sound, except coins (up to 3)', () => {
    expect(maxInstances('jump')).toBe(1);
    expect(maxInstances('death')).toBe(1);
    expect(maxInstances('coin')).toBe(3);
  });

  it('varies the pitch ±5 % only on jumps, shots and impacts', () => {
    expect(jitterRate('jump', 0)).toBeCloseTo(0.95);
    expect(jitterRate('shoot_1', 0.5)).toBeCloseTo(1);
    expect(jitterRate('enemy_hit', 0.999999)).toBeCloseTo(1.05);
    for (const key of ['coin', 'death', 'zone_change', 'ui_move'] as const) expect(jitterRate(key, 0)).toBe(1);
  });
});

describe('CoinStreak', () => {
  const { step, max, windowMs } = AUDIO.sfxRules.coinStreak;

  it('raises the pitch for coins in a row, up to a cap', () => {
    const streak = new CoinStreak();
    expect(streak.next(0)).toBe(1);
    expect(streak.next(100)).toBeCloseTo(1 + step);
    expect(streak.next(200)).toBeCloseTo(1 + 2 * step);
    let rate = 1;
    for (let t = 300; t < 10000; t += 100) rate = streak.next(t);
    expect(rate).toBe(max);
  });

  it('starts over after a pause', () => {
    const streak = new CoinStreak();
    streak.next(0);
    streak.next(100);
    expect(streak.next(100 + windowMs + 1)).toBe(1);
  });
});
