import Phaser from 'phaser';
import { SPAWN } from '../config';
import type { ScoreEvent } from '../systems/ScoreSystem';
import { ANIM_FPS, DEPTH, PALETTE, SCREEN, TIMING } from '../theme';
import { ensureAnim } from './anims';
import { explode } from './effects';
import { WorldSprite, type WorldTick } from './WorldSprite';

/**
 * Enemies (spec §11.2): shots hurt them, touching them hurts the player. A hit that doesn't
 * kill flashes white for 80 ms; the last one explodes.
 */
export abstract class Enemy extends WorldSprite {
  /** Score event its kill is worth. */
  abstract readonly points: ScoreEvent;
  protected hp = 1;
  private flashTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    this.setDepth(DEPTH.enemies);
  }

  /** Takes one shot; returns true when it dies from it. */
  hit(): boolean {
    this.hp -= 1;
    if (this.hp <= 0) return true;
    this.setTintFill(PALETTE.white);
    this.flashTimer?.remove();
    this.flashTimer = this.scene.time.delayedCall(TIMING.hitFlash, () => this.clearTint());
    return false;
  }

  /** Explodes and goes back to the pool. */
  die(): void {
    const { x, y } = this.getCenter();
    explode(this.scene, x, y);
    this.kill();
  }

  kill(): void {
    this.flashTimer?.remove();
    this.flashTimer = null;
    super.kill();
  }
}

/** Ground bug: walks toward the player 30 px/s faster than the world. */
export class Bug extends Enemy {
  readonly points = 'groundEnemy';

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_bug');
  }

  spawn(left: number): this {
    const spec = SPAWN.kinds.bug;
    this.activate('enemy_bug', left, SCREEN.groundY - spec.h, spec.hitbox);
    this.hp = SPAWN.bug.hp;
    this.play(ensureAnim(this.scene, 'enemy_bug_walk', 'enemy_bug', ANIM_FPS.bug));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    this.left -= (SPAWN.kinds.bug.vRel * world.deltaMs) / 1000;
  }
}

/** Flying drone: a sine wave (20 px, 1.5 s) at mid height. */
export class Drone extends Enemy {
  readonly points = 'flyingEnemy';
  private phase = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_drone');
  }

  spawn(left: number, phase: number): this {
    this.phase = phase;
    this.activate('enemy_drone', left, 0, SPAWN.kinds.drone.hitbox);
    this.top = this.waveTop();
    this.hp = SPAWN.drone.hp;
    this.play(ensureAnim(this.scene, 'enemy_drone_fly', 'enemy_drone', ANIM_FPS.drone));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    this.top = this.waveTop();
  }

  private waveTop(): number {
    const { centerY, amplitude, periodMs } = SPAWN.drone;
    const wave = Math.sin(this.phase + (2 * Math.PI * this.age) / periodMs);
    return centerY - SPAWN.kinds.drone.h / 2 + amplitude * wave;
  }
}
