import Phaser from 'phaser';
import { ANIM_FPS, DEPTH } from '../theme';

const COIN_KEY = 'coin';
const COIN_ANIM = 'coin_spin';

/**
 * 8 × 8 spinning coin (spec §10.3), pooled by CoinSystem. It moves with the ground; its body
 * follows the sprite (no physics movement) so it lines up exactly with the scrolling floor.
 */
export class Coin extends Phaser.Physics.Arcade.Sprite {
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

  spawn(x: number, y: number): void {
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.moves = false;
    this.play(COIN_ANIM);
  }

  /** Moves left by `dx` ground pixels; returns false once it has left the screen. */
  advance(dx: number): boolean {
    this.x -= dx;
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    if (this.x < -this.width) {
      this.kill();
      return false;
    }
    return true;
  }

  kill(): void {
    this.stop();
    this.disableBody(true, true);
  }
}
