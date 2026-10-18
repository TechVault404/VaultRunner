import { SPAWN } from '../config';
import { ANIM_FPS, DEPTH, SCREEN } from '../theme';
import { ensureAnim } from './anims';
import { WorldSprite, type WorldTick } from './WorldSprite';

export type ObstacleKind = 'low' | 'spikes' | 'air' | 'wall' | 'double' | 'saw';

/** Kinds drawn from a 2-frame sheet, with their animation. */
const ANIMATED: Partial<Record<ObstacleKind, { action: string; fps: number }>> = {
  air: { action: 'glow', fps: ANIM_FPS.laser },
  saw: { action: 'spin', fps: ANIM_FPS.saw },
};

/**
 * Obstacles (spec §11.1): they can't be destroyed, only dodged; shots stop on them. Each zone
 * dresses them with its own art (`zona{N}_{kind}`) over the same hitbox. The saw goes up and
 * down 40 px.
 */
export class Obstacle extends WorldSprite {
  kind: ObstacleKind = 'low';
  /** Close dodge (spec §10.3): smallest vertical gap to the player while passing it. */
  closestGap = Infinity;
  dodgeChecked = false;
  /** Saw: angle of its swing at age 0 (0 = down on the ground, π = at the top). */
  private sawPhase = 0;
  private baseTop = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'zona1_low');
    this.setDepth(DEPTH.obstacles);
  }

  spawn(kind: ObstacleKind, zone: number, left: number): this {
    const spec = SPAWN.kinds[kind];
    this.kind = kind;
    this.baseTop = kind === 'air' ? SPAWN.airY : SCREEN.groundY - spec.h;
    const texture = `zona${zone}_${kind}`;
    this.activate(texture, left, this.baseTop, spec.hitbox);
    this.closestGap = Infinity;
    this.dodgeChecked = false;
    const anim = ANIMATED[kind];
    if (anim) this.play(ensureAnim(this.scene, `${texture}_${anim.action}`, texture, anim.fps));
    return this;
  }

  /**
   * Saw only: sets the swing so it is at the top (`up`) or down on the ground when it reaches
   * the player, `arriveMs` from now. Either way it is passable: run under it or jump over it.
   */
  timeSaw(arriveMs: number, up: boolean): void {
    const { periodMs } = SPAWN.saw;
    this.sawPhase = (up ? Math.PI : 0) - (2 * Math.PI * arriveMs) / periodMs;
    this.top = this.sawTop();
  }

  tick(world: WorldTick): void {
    super.tick(world);
    if (this.kind === 'saw') this.top = this.sawTop();
  }

  private sawTop(): number {
    const { travel, periodMs } = SPAWN.saw;
    const angle = this.sawPhase + (2 * Math.PI * this.age) / periodMs;
    return this.baseTop - (travel / 2) * (1 - Math.cos(angle));
  }
}
