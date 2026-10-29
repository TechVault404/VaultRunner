import Phaser from 'phaser';
import { ANIM_FPS, DEPTH } from '../theme';

const COIN_KEY = 'coin';
const COIN_ANIM = 'coin_spin';

/**
 * 8 × 8 spinning coin (spec §10.3), pooled by CoinSystem. It sits still in the world (world x
 * of its center) and is drawn where the ground has scrolled, so it moves exactly with the floor.
 */
export class Coin extends Phaser.Physics.Arcade.Sprite {
  /** Center, world px. */
  worldX = 0;
  /** Caught by the magnet (spec §12): it flies to the player until picked up. */
  magnetized = false;
  /** Center y before rounding, so slow magnet steps add up. */
  private exactY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, COIN_KEY);
    this.setDepth(DEPTH.pickups);
    if (!scene.anims.exists(COIN_ANIM)) {
      scene.anims.create({
        key: COIN_ANIM,
        frames: scene.anims.generateFrameNumbers(COIN_KEY),
        frameRate: ANIM_FPS.coin,
        repeat: -1,
      });
    }
  }

  spawn(worldX: number, y: number): void {
    this.worldX = worldX;
    this.magnetized = false;
    this.exactY = y;
    this.enableBody(true, 0, Math.round(y), true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.moves = false;
    this.play(COIN_ANIM);
  }

  /** Magnet: moves its center up to `stepPx` toward (world x, screen y). */
  pull(targetWorldX: number, targetY: number, stepPx: number): void {
    const dx = targetWorldX - this.worldX;
    const dy = targetY - this.exactY;
    const length = Math.hypot(dx, dy);
    const k = length <= stepPx ? 1 : stepPx / length;
    this.worldX += dx * k;
    this.exactY += dy * k;
    this.y = Math.round(this.exactY);
  }

  /** Draws it where the world is now; returns false (and frees it) once it left the screen. */
  sync(scrolled: number): boolean {
    this.x = Math.round(this.worldX - Math.round(scrolled));
    if (this.x < -this.width) {
      this.kill();
      return false;
    }
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    return true;
  }

  kill(): void {
    this.stop();
    this.disableBody(true, true);
  }
}
