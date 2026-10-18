import Phaser from 'phaser';
import { SPAWN } from '../config';
import type { Lane } from '../systems/patterns';
import { ANIM_FPS, COLOR, DEPTH, TIMING } from '../theme';
import { ensureAnim } from './anims';
import { Enemy } from './Enemy';
import type { WorldTick } from './WorldSprite';

const IDLE = { start: 0, end: 1 };
const TELEPORT = { start: 2, end: 4 };

/**
 * Glitch, the elite (spec §11.2): 2 shots to kill. It teleports once between the low lane
 * (on the ground: jump it) and the high lane (head height: crouch under it). For the 400 ms
 * before, it plays its teleport frames and a red silhouette blinks where it will appear.
 */
export class Glitch extends Enemy {
  readonly points = 'glitch';
  private lane: Lane = 'low';
  private warnLeft = 0;
  private teleported = false;
  private readonly ghost: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_glitch');
    this.ghost = scene.add.image(0, 0, 'enemy_glitch', 0).setTintFill(COLOR.danger).setDepth(DEPTH.enemies).setVisible(false);
    this.once(Phaser.GameObjects.Events.DESTROY, () => this.ghost.destroy());
  }

  spawn(left: number, lane: Lane): this {
    this.lane = lane;
    this.activate('enemy_glitch', left, SPAWN.lanes.glitch[lane], SPAWN.kinds.glitch.hitbox);
    this.hp = SPAWN.glitch.hp;
    this.warnLeft = 0;
    this.teleported = false;
    this.play(this.anim('idle'));
    return this;
  }

  tick(world: WorldTick): void {
    super.tick(world);
    const { warnMs, teleportLeadS } = SPAWN.glitch;
    const ahead = this.screenLeft(world.scrolled) - world.player.bounds.right;
    if (!this.teleported && this.warnLeft <= 0 && ahead <= world.speed * teleportLeadS) {
      this.warnLeft = warnMs;
      this.play(this.anim('tp'));
    }
    if (this.warnLeft > 0) {
      this.warnLeft -= world.deltaMs;
      const elapsed = warnMs - this.warnLeft;
      this.ghost.setVisible(Math.floor((elapsed * TIMING.glitchGhostBlinkHz * 2) / 1000) % 2 === 0);
      if (this.warnLeft <= 0) {
        this.lane = this.otherLane();
        this.top = SPAWN.lanes.glitch[this.lane];
        this.teleported = true;
        this.ghost.setVisible(false);
        this.play(this.anim('idle'));
      }
    }
  }

  sync(scrolled: number): boolean {
    const visible = super.sync(scrolled);
    if (visible && this.ghost.visible) this.ghost.setPosition(this.x, SPAWN.lanes.glitch[this.otherLane()] + this.displayOriginY);
    return visible;
  }

  kill(): void {
    this.ghost.setVisible(false);
    super.kill();
  }

  private otherLane(): Lane {
    return this.lane === 'low' ? 'high' : 'low';
  }

  private anim(name: 'idle' | 'tp'): string {
    const key = `enemy_glitch_${name}`;
    if (name === 'idle') return ensureAnim(this.scene, key, 'enemy_glitch', ANIM_FPS.glitch, IDLE);
    // The three teleport frames fill the warning exactly.
    const fps = ((TELEPORT.end - TELEPORT.start + 1) * 1000) / SPAWN.glitch.warnMs;
    return ensureAnim(this.scene, key, 'enemy_glitch', fps, { ...TELEPORT, repeat: 0 });
  }
}
