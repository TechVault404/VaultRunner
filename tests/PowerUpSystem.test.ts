import { describe, expect, it } from 'vitest';
import { POWERUP_KINDS, POWERUPS, SHOOTING } from '../src/config';
import { pickPowerUp, PowerUpSystem } from '../src/systems/PowerUpSystem';

describe('PowerUpSystem', () => {
  it('runs each powerup for its duration, then reports it ended', () => {
    for (const kind of POWERUP_KINDS) {
      const powerUps = new PowerUpSystem();
      powerUps.activate(kind);
      expect(powerUps.update(POWERUPS.durationMs[kind] - 1)).toEqual([]);
      expect(powerUps.isActive(kind)).toBe(true);
      expect(powerUps.update(1)).toEqual([kind]);
      expect(powerUps.isActive(kind)).toBe(false);
    }
  });

  it('lets different powerups stack, in pickup order', () => {
    const powerUps = new PowerUpSystem();
    for (const kind of POWERUP_KINDS) expect(powerUps.activate(kind)).toBe(true);
    expect(powerUps.active.map((p) => p.kind)).toEqual([...POWERUP_KINDS]);
    expect(powerUps.scoreMultiplier).toBe(2);
    expect(powerUps.speedMultiplier).toBe(POWERUPS.turbo.speedMultiplier);
    expect(powerUps.maxJumps).toBe(2);
    expect(powerUps.fire).toEqual(POWERUPS.tripleshot);
    expect(powerUps.shotAngles).toEqual([-10, 0, 10]);
  });

  it('picking up an active one starts its time over and keeps its place', () => {
    const powerUps = new PowerUpSystem();
    powerUps.activate('magnet');
    powerUps.activate('x2');
    powerUps.update(9000);
    expect(powerUps.activate('magnet')).toBe(false);
    expect(powerUps.active.map((p) => p.kind)).toEqual(['magnet', 'x2']);
    expect(powerUps.active[0]!.leftMs).toBe(POWERUPS.durationMs.magnet);
    expect(powerUps.update(1000)).toEqual(['x2']);
    expect(powerUps.isActive('magnet')).toBe(true);
  });

  it('only counts the time it is updated with (a paused scene does not count)', () => {
    const powerUps = new PowerUpSystem();
    powerUps.activate('tripleshot');
    powerUps.update(3000);
    // Paused: no updates for a while.
    expect(powerUps.active[0]!.leftMs).toBe(POWERUPS.durationMs.tripleshot - 3000);
    expect(powerUps.update(POWERUPS.durationMs.tripleshot - 3000)).toEqual(['tripleshot']);
  });

  it('has no effect by default', () => {
    const powerUps = new PowerUpSystem();
    expect(powerUps.scoreMultiplier).toBe(1);
    expect(powerUps.speedMultiplier).toBe(1);
    expect(powerUps.maxJumps).toBe(1);
    expect(powerUps.fire).toEqual(SHOOTING);
    expect(powerUps.shotAngles).toEqual([0]);
    expect(powerUps.hit()).toBe('dead');
  });

  it('the shield saves exactly one hit, then 1 s of invulnerability', () => {
    const powerUps = new PowerUpSystem();
    powerUps.activate('shield');
    expect(powerUps.hit()).toBe('shielded');
    expect(powerUps.isActive('shield')).toBe(false);
    expect(powerUps.invulnerable).toBe(true);
    expect(powerUps.blinking).toBe(true);
    expect(powerUps.hit()).toBe('ignored');
    powerUps.update(POWERUPS.invulnMs - 1);
    expect(powerUps.hit()).toBe('ignored');
    powerUps.update(1);
    expect(powerUps.invulnerable).toBe(false);
    expect(powerUps.hit()).toBe('dead');
  });

  it('a shield that runs out of time leaves no invulnerability', () => {
    const powerUps = new PowerUpSystem();
    powerUps.activate('shield');
    expect(powerUps.update(POWERUPS.durationMs.shield)).toEqual(['shield']);
    expect(powerUps.invulnerable).toBe(false);
    expect(powerUps.hit()).toBe('dead');
  });

  it('the turbo is invulnerable for exactly 3 s, plus 1 s blinking after', () => {
    const powerUps = new PowerUpSystem();
    powerUps.activate('shield');
    powerUps.activate('turbo');
    expect(POWERUPS.durationMs.turbo).toBe(3000);
    expect(powerUps.hit()).toBe('ignored');
    expect(powerUps.isActive('shield')).toBe(true); // the turbo doesn't use up the shield
    expect(powerUps.blinking).toBe(false);
    expect(powerUps.update(3000)).toEqual(['turbo']);
    expect(powerUps.speedMultiplier).toBe(1);
    expect(powerUps.blinking).toBe(true);
    expect(powerUps.hit()).toBe('ignored');
    powerUps.update(POWERUPS.invulnMs);
    expect(powerUps.hit()).toBe('shielded');
  });
});

describe('pickPowerUp', () => {
  /** Share of each kind over evenly spread rolls. */
  function shares(meters: number): Record<string, number> {
    const n = 10000;
    const counts: Record<string, number> = {};
    for (let i = 0; i < n; i++) {
      const kind = pickPowerUp(meters, (i + 0.5) / n);
      counts[kind] = (counts[kind] ?? 0) + 1;
    }
    return Object.fromEntries(Object.entries(counts).map(([k, c]) => [k, c / n]));
  }

  it('follows the chances in config.ts', () => {
    const got = shares(1000);
    for (const kind of POWERUP_KINDS) expect(got[kind]).toBeCloseTo(POWERUPS.chance[kind] / 100, 3);
  });

  it('never gives the turbo before 800 m; the others share its chance', () => {
    const got = shares(799);
    expect(got.turbo).toBeUndefined();
    expect(got.shield).toBeCloseTo(25 / 90, 3);
    expect(shares(800).turbo).toBeCloseTo(0.1, 3);
  });
});
