import { DIFFICULTY } from '../config';

export type DifficultyConfig = typeof DIFFICULTY;

/**
 * World speed from the distance run (spec §10.2): starts at 120 px/s, +4 px/s every 50 m,
 * capped at 300 px/s. `level` (0–1) drives spawning and the music.
 */
export class DifficultySystem {
  constructor(private readonly config: DifficultyConfig = DIFFICULTY) {}

  speedAt(distanceM: number): number {
    const { startSpeed, step, stepEveryM, maxSpeed } = this.config;
    return Math.min(maxSpeed, startSpeed + step * Math.floor(Math.max(0, distanceM) / stepEveryM));
  }

  levelAt(distanceM: number): number {
    const { startSpeed, maxSpeed } = this.config;
    return (this.speedAt(distanceM) - startSpeed) / (maxSpeed - startSpeed);
  }
}
