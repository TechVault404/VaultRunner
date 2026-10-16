import Phaser from 'phaser';
import { TIMING } from '../theme';
import { Backdrop } from './Backdrop';

/**
 * The Game scene's scenery: the current zone's Backdrop, and the 2 s blend into the next
 * zone's (spec §10.1). Both keep scrolling together during the blend.
 */
export class ZoneScenery {
  private current: Backdrop;
  private leaving: Backdrop | null = null;
  private blend: Phaser.Tweens.Tween | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    zone: number,
  ) {
    this.current = new Backdrop(scene, zone, { useDepth: true });
  }

  scroll(dx: number): void {
    this.current.scroll(dx);
    this.leaving?.scroll(dx);
  }

  changeTo(zone: number): void {
    this.finishBlend();
    const next = new Backdrop(this.scene, zone, { useDepth: true }).setOffset(this.current.scrolled).setAlpha(0);
    this.leaving = this.current;
    this.current = next;
    const leaving = this.leaving;
    this.blend = this.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration: TIMING.zoneBlend,
      ease: 'Linear',
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        next.setAlpha(t);
        leaving.setAlpha(1 - t);
      },
      onComplete: () => this.finishBlend(),
    });
  }

  /** True while two zones are blending. */
  get blending(): boolean {
    return this.leaving !== null;
  }

  private finishBlend(): void {
    this.blend?.stop();
    this.blend = null;
    this.current.setAlpha(1);
    this.leaving?.destroy();
    this.leaving = null;
  }
}
