import { describe, expect, it } from 'vitest';
import { SHOOTING } from '../src/config';
import { FireControl } from '../src/systems/FireControl';

describe('FireControl', () => {
  it('fires right away the first time', () => {
    expect(new FireControl().tryFire(0)).toBe(true);
  });

  it('waits for the cooldown between shots', () => {
    const fire = new FireControl();
    expect(fire.tryFire(0)).toBe(true);
    fire.update(SHOOTING.cooldownMs - 1);
    expect(fire.tryFire(0)).toBe(false);
    fire.update(1);
    expect(fire.tryFire(0)).toBe(true);
  });

  it('never goes over the on-screen limit', () => {
    const fire = new FireControl();
    fire.update(SHOOTING.cooldownMs);
    expect(fire.tryFire(SHOOTING.maxOnScreen)).toBe(false);
    expect(fire.tryFire(SHOOTING.maxOnScreen - 1)).toBe(true);
  });

  it('a refused shot does not restart the cooldown', () => {
    const fire = new FireControl();
    fire.update(SHOOTING.cooldownMs);
    expect(fire.tryFire(SHOOTING.maxOnScreen)).toBe(false);
    expect(fire.tryFire(0)).toBe(true);
  });

  it('uses the given limits (triple shot in Phase 5)', () => {
    const fire = new FireControl({ cooldownMs: 200, maxOnScreen: 9 });
    expect(fire.tryFire(8)).toBe(true);
    fire.update(200);
    expect(fire.tryFire(8)).toBe(true);
  });
});
