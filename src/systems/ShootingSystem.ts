import Phaser from 'phaser';
import { SHOOTING } from '../config';
import { Projectile, projectileAnim } from '../entities/Projectile';
import { FireControl } from './FireControl';

/**
 * Player shooting (spec §9): an object pool of projectiles plus the cooldown and on-screen
 * limit from FireControl. The weapon chosen in the editor only changes the projectile sprite.
 */
export class ShootingSystem {
  /** Arcade group of every pooled projectile (Phase 4 overlaps it with enemies). */
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

  update(deltaMs: number): void {
    this.fireControl.update(deltaMs);
  }

  /** Fires from (x = weapon tip, y = shot center) if allowed. Returns whether it fired. */
  tryFire(x: number, y: number): boolean {
    if (!this.fireControl.tryFire(this.activeCount)) return false;
    const shot = this.group.get(x, y, this.texture) as Projectile | null;
    if (!shot) return false;
    shot.fire(x, y, this.anim);
    return true;
  }
}
