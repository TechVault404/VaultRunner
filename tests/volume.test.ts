import { describe, expect, it } from 'vitest';
import { AUDIO } from '../src/config';
import { isVolume, musicGain, stepVolume } from '../src/systems/volume';

describe('music volume', () => {
  it('moves one step at a time and stays within 0–100 %', () => {
    expect(stepVolume(60, 1)).toBe(80);
    expect(stepVolume(60, -1)).toBe(40);
    expect(stepVolume(100, 1)).toBe(100);
    expect(stepVolume(0, -1)).toBe(0);
  });

  it('maps the setting to a gain, 0 being silent', () => {
    expect(musicGain(0)).toBe(0);
    expect(musicGain(100)).toBe(AUDIO.music.maxVolume);
    expect(musicGain(50)).toBeCloseTo(AUDIO.music.maxVolume / 2);
  });

  it('only accepts whole steps', () => {
    expect([0, 20, 100].every(isVolume)).toBe(true);
    expect([-20, 30, 120, 60.5, '60', null].some(isVolume)).toBe(false);
  });
});
