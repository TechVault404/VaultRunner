import { describe, expect, it } from 'vitest';
import { CHARACTER, SAVE } from '../src/config';
import {
  CHARACTER_FIELDS,
  cycleOption,
  OPTION_COUNTS,
  randomCharacter,
  sanitizeName,
} from '../src/systems/CharacterOptions';
import { createDefaultCharacter, isCharacter } from '../src/systems/SaveSystem';

/** Small deterministic PRNG (mulberry32) so the test is repeatable. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe('randomCharacter', () => {
  it('always produces a valid combination', () => {
    const rng = seeded(1234);
    for (let i = 0; i < 1000; i++) expect(isCharacter(randomCharacter('ANA', rng))).toBe(true);
  });

  it.each([0, 0.5, 0.9999999, 1, -0.1])('stays in range with rng() = %d', (value) => {
    expect(isCharacter(randomCharacter('', () => value))).toBe(true);
  });

  it('reaches every option of every field', () => {
    const rng = seeded(42);
    const seen = new Map(CHARACTER_FIELDS.map((field) => [field, new Set<number>()]));
    for (let i = 0; i < 1000; i++) {
      const character = randomCharacter('', rng);
      for (const field of CHARACTER_FIELDS) seen.get(field)?.add(character[field]);
    }
    for (const field of CHARACTER_FIELDS) expect(seen.get(field)?.size).toBe(OPTION_COUNTS[field]);
  });

  it('keeps the name', () => {
    expect(randomCharacter('MIGUE').name).toBe('MIGUE');
  });
});

describe('cycleOption', () => {
  it('wraps forwards and backwards', () => {
    const base = { ...createDefaultCharacter(), skin: 0 };
    expect(cycleOption(base, 'skin', -1).skin).toBe(CHARACTER.skins - 1);
    expect(cycleOption({ ...base, skin: CHARACTER.skins - 1 }, 'skin', 1).skin).toBe(0);
  });

  it('changes only the given field', () => {
    const base = createDefaultCharacter();
    expect(cycleOption(base, 'hair', 1)).toEqual({ ...base, hair: (base.hair + 1) % CHARACTER.hairs });
  });
});

describe('sanitizeName', () => {
  it('upper-cases and keeps accents and Ñ', () => {
    expect(sanitizeName('peña josé')).toBe('PEÑA JOSÉ');
  });

  it('drops characters the font lacks', () => {
    expect(sanitizeName('a@b#c😀')).toBe('ABC');
  });

  it('trims to the max length', () => {
    expect(sanitizeName('x'.repeat(30))).toHaveLength(SAVE.nameMaxLength);
  });
});
