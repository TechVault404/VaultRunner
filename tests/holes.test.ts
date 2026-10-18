import { describe, expect, it } from 'vitest';
import { hasFloor } from '../src/systems/holes';

const hole = [{ left: 100, right: 132 }];

describe('hasFloor', () => {
  it('keeps a running player on the floor until the middle of the hitbox is over the hole', () => {
    expect(hasFloor(90, 102, hole, true)).toBe(true); // middle at 96
    expect(hasFloor(95, 107, hole, true)).toBe(false); // middle at 101
    expect(hasFloor(127, 139, hole, true)).toBe(true); // middle at 133, past the hole
  });

  it('lets a falling player land with any part of the hitbox over the floor', () => {
    expect(hasFloor(95, 107, hole, false)).toBe(true);
    expect(hasFloor(100, 112, hole, false)).toBe(false);
    expect(hasFloor(121, 133, hole, false)).toBe(true);
  });

  it('is solid everywhere without holes', () => {
    expect(hasFloor(0, 12, [], true)).toBe(true);
  });
});
