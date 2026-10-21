import { describe, expect, it } from 'vitest';
import { Tutorial } from '../src/systems/Tutorial';

describe('Tutorial', () => {
  it('asks to jump, crouch and shoot, in order, waiting for each', () => {
    const tutorial = new Tutorial();
    expect(tutorial.step).toBe('jump');
    expect(tutorial.perform('shoot')).toBe(false);
    expect(tutorial.perform('crouch')).toBe(false);
    expect(tutorial.step).toBe('jump');
    expect(tutorial.perform('jump')).toBe(true);
    expect(tutorial.step).toBe('crouch');
    expect(tutorial.perform('crouch')).toBe(true);
    expect(tutorial.done).toBe(false);
    expect(tutorial.perform('shoot')).toBe(true);
    expect(tutorial.done).toBe(true);
    expect(tutorial.step).toBeNull();
    expect(tutorial.perform('jump')).toBe(false);
  });
});
