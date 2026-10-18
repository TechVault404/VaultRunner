import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { SPAWN } from '../config';
import { SCREEN, TIMING } from '../theme';
import { Enemy } from './Enemy';
import type { WorldTick } from './WorldSprite';

type TurretStage = 'idle' | 'warn' | 'fired';

/**
 * Turret (spec §11.2): fixed on the ground, 3 shots to kill. Once fully on screen it blinks
 * its warning for 600 ms, then fires one slow bullet. At the warning it locks the bullet to the
 * lane closest to the player's height: low (jump it) or high (crouch under it).
 */
export class Turret extends Enemy {
  readonly points = 'turret';
  private stage: TurretStage = 'idle';
  private timer = 0;
  private laneY = 0;
  private onFire: (right: number, centerY: number) => void = () => {};

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_turret');
  }

  spawn(left: number, onFire: (right: number, centerY: number) => void): this {
    const spec = SPAWN.kinds.turret;
    this.activate('enemy_turret', left, SCREEN.groundY - spec.h, spec.hitbox);
    this.hp = SPAWN.turret.hp;
    this.stage = 'idle';
    this.timer = 0;
    this.onFire = onFire;
    this.setFrame(this.frameOf('idle'));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    if (this.stage === 'idle' && this.screenLeft(world.scrolled) + this.width <= SCREEN.w) {
      this.stage = 'warn';
      this.timer = SPAWN.turret.warnMs;
      this.laneY = closestLane(world.player.bounds.centerY);
    }
    if (this.stage === 'warn') {
      this.timer -= world.deltaMs;
      const elapsed = SPAWN.turret.warnMs - this.timer;
      const on = Math.floor((elapsed * TIMING.turretWarnBlinkHz * 2) / 1000) % 2 === 0;
      this.setFrame(this.frameOf(on ? 'warn' : 'idle'));
      if (this.timer <= 0) {
        this.stage = 'fired';
        this.timer = TIMING.turretFireFrame;
        this.setFrame(this.frameOf('fire'));
        this.onFire(this.left, this.laneY);
      }
    } else if (this.stage === 'fired' && this.timer > 0) {
      this.timer -= world.deltaMs;
      if (this.timer <= 0) this.setFrame(this.frameOf('idle'));
    }
  }

  private frameOf(name: 'idle' | 'warn' | 'fire'): number {
    return frameIndex(this.scene, 'enemy_turret', name);
  }
}

/** The bullet lane whose center is closest to `y` (ties go to the low lane). */
export function closestLane(y: number): number {
  const { low, high } = SPAWN.lanes.bullet;
  return Math.abs(y - low) <= Math.abs(y - high) ? low : high;
}
