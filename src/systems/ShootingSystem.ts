import Phaser from 'phaser';
import { SHOOTING } from '../config';
import { Projectile, projectileAnim } from '../entities/Projectile';
import { FireControl, type FireConfig } from './FireControl';

/**
 * Player shooting (spec §9): an object pool of projectiles plus the cooldown and on-screen
 * limit from FireControl. The weapon chosen in the editor only changes the projectile sprite.
 */
export class ShootingSystem {
  /** Arcade group of every pooled projectile (the Game scene overlaps it with enemies). */
  readonly group: Phaser.Physics.Arcade.Group;
  private readonly fireControl = new FireControl();
  private readonly texture: string;
  private readonly anim: string;

  constructor(scene: Phaser.Scene, weapon: number) {
    this.texture = `projectile_${weapon}`;
    this.anim = projectileAnim(scene, weapon);
    this.group = scene.physics.add.group({
      classType: Projectile,
      maxSize: SHOOTING.poolSize,
      allowGravity: false,
      runChildUpdate: false,
    });
  }

  get activeCount(): number {
    return this.group.countActive(true);
  }

  /** `fire` = current cooldown and on-screen limit (the triple shot changes them, spec §12). */
  update(deltaMs: number, fire: FireConfig = SHOOTING): void {
    this.fireControl.setConfig(fire);
    this.fireControl.update(deltaMs);
  }

  /**
   * Fires from (x = weapon tip, y = shot center) if allowed: one shot per angle (degrees,
   * negative = up), as many as fit under the on-screen limit. Returns whether it fired.
   */
  tryFire(x: number, y: number, anglesDeg: readonly number[] = [0]): boolean {
    if (!this.fireControl.tryFire(this.activeCount)) return false;
    let fired = false;
    for (const angle of anglesDeg) {
      const shot = this.group.get(x, y, this.texture) as Projectile | null;
      if (!shot) break;
      shot.fire(x, y, this.anim, angle);
      fired = true;
    }
    return fired;
  }
}
