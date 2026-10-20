import { SHOOTING } from '../config';

export interface FireConfig {
  cooldownMs: number;
  maxOnScreen: number;
}

/**
 * Cooldown and on-screen limit of the player's shots (spec §9). Pure logic: time only
 * advances through `update`, so a paused scene does not count.
 */
export class FireControl {
  private sinceShot = Infinity;

  constructor(private config: FireConfig = SHOOTING) {}

  /** Switches the limits (triple shot on/off); the cooldown already running is kept. */
  setConfig(config: FireConfig): void {
    this.config = config;
  }

  update(deltaMs: number): void {
    this.sinceShot += deltaMs;
  }

  /** Fires (and restarts the cooldown) if the cooldown is over and there is room on screen. */
  tryFire(activeShots: number): boolean {
    if (this.sinceShot < this.config.cooldownMs || activeShots >= this.config.maxOnScreen) return false;
    this.sinceShot = 0;
    return true;
  }
}
