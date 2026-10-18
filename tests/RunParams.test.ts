import { describe, expect, it } from 'vitest';
import { parseRunParams } from '../src/systems/RunParams';

describe('parseRunParams', () => {
  it('takes the seed from the URL in any build', () => {
    expect(parseRunParams('?seed=42', false).seed).toBe(42);
    expect(parseRunParams('?seed=42', true).seed).toBe(42);
  });

  it('falls back to the configured seed, then to a random one', () => {
    expect(parseRunParams('', false, 7).seed).toBe(7);
    expect(parseRunParams('?seed=abc', false, 7).seed).toBe(7);
    expect(Number.isInteger(parseRunParams('', false, null).seed)).toBe(true);
  });

  it('only honors the testing switches in development, and marks those runs', () => {
    expect(parseRunParams('?startM=2250&god=1', false, 1)).toEqual({ seed: 1, startM: 0, god: false, debug: false });
    expect(parseRunParams('?startM=2250&god=1', true, 1)).toEqual({ seed: 1, startM: 2250, god: true, debug: true });
    expect(parseRunParams('?seed=5', true, 1).debug).toBe(false);
  });
});
