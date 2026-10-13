import Phaser from 'phaser';
import { SHOOTING } from '../config';
import { ANIM_FPS, DEPTH, SCREEN } from '../theme';

/** Animation key of each weapon's projectile (`projectile_{weapon}` sheets, 2 frames). */
export function projectileAnim(scene: Phaser.Scene, weapon: number): string {
  const texture = `projectile_${weapon}`;
  const key = `${texture}_fly`;
  if (!scene.anims.exists(key)) {
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(texture),
      frameRate: ANIM_FPS.projectile,
      repeat: -1,
    });
  }
  return key;
}

/**
 * Player shot (spec §9), 6 × 3. Pooled by ShootingSystem: `fire` takes it out of the pool,
 * `kill` puts it back. It hurts enemies (Phase 4) but never obstacles.
 */
export class Projectile extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
    super(scene, x, y, texture, frame);
    this.setOrigin(0, 0.5).setDepth(DEPTH.projectiles);
  }

  /** `x` = left edge, `y` = center line of the shot. */
  fire(x: number, y: number, anim: string): void {
    this.enableBody(true, x, y, true, true);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    this.setVelocity(SHOOTING.speed, 0);
    this.play(anim);
  }

  kill(): void {
    this.stop();
    this.disableBody(true, true);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.active && this.x > SCREEN.w) this.kill();
  }
}
