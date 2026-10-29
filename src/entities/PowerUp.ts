import Phaser from 'phaser';
import { POWERUPS, POWERUP_KINDS, type PowerUpKind } from '../config';
import { DEPTH, TIMING } from '../theme';
import { WorldSprite, type WorldTick } from './WorldSprite';

export const POWERUPS_KEY = 'powerups';

/**
 * A powerup to pick up (spec §12): its 12 × 12 icon floating ±2 px (DISENO §11) at short-jump
 * height. Pooled by SpawnSystem; it sits still in the world like the coins.
 */
export class PowerUp extends WorldSprite {
  kind: PowerUpKind = 'shield';
  private centerY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, POWERUPS_KEY);
    this.setDepth(DEPTH.pickups);
  }

  spawn(kind: PowerUpKind, left: number): this {
    const { size, hitbox, centerY } = POWERUPS.pickup;
    this.kind = kind;
    this.centerY = centerY;
    this.activate(POWERUPS_KEY, left, centerY - size / 2, hitbox);
    this.setFrame(POWERUP_KINDS.indexOf(kind));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    this.top = this.bobTop();
  }

  private bobTop(): number {
    const { amplitude, period } = TIMING.powerupBob;
    return this.centerY - POWERUPS.pickup.size / 2 + amplitude * Math.sin((2 * Math.PI * this.age) / period);
  }
}
