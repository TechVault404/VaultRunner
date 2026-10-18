import { AUDIO } from '../config';

/** Music volume setting after one − (dir −1) or + (dir 1) step, kept within 0–100 %. */
export function stepVolume(percent: number, dir: -1 | 1): number {
  return Math.min(100, Math.max(0, percent + dir * AUDIO.music.volumeStep));
}

/** Gain for the music at a volume setting (%). */
export function musicGain(percent: number): number {
  return (percent / 100) * AUDIO.music.maxVolume;
}

/** A valid volume setting: a whole step between 0 and 100 %. */
export function isVolume(value: unknown): value is number {
  if (!Number.isInteger(value)) return false;
  const percent = value as number;
  return percent >= 0 && percent <= 100 && percent % AUDIO.music.volumeStep === 0;
}
