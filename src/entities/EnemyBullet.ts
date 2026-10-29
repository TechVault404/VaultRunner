import { SPAWN } from '../config';
import { ANIM_FPS, DEPTH } from '../theme';
import { ensureAnim } from './anims';
import { WorldSprite, type WorldTick } from './WorldSprite';

/**
 * Turret bullet (spec §11.2): slow (150 px/s over the world speed), in the low lane (jump it)
 * or the high lane (crouch under it). Shots can't destroy it.
 */
export class EnemyBullet extends WorldSprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_bullet');
    this.setDepth(DEPTH.enemyBullets);
  }

  /** `right` = world px it leaves from (the turret's muzzle), `centerY` = its lane. */
  spawn(right: number, centerY: number): this {
    const { w, h, hitbox } = SPAWN.bullet;
    this.activate('enemy_bullet', right - w, centerY - h / 2, hitbox);
    this.play(ensureAnim(this.scene, 'enemy_bullet_fly', 'enemy_bullet', ANIM_FPS.projectile));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    this.left -= (SPAWN.bullet.speed * world.deltaMs) / 1000;
  }
}
