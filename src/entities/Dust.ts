import Phaser from 'phaser';
import { ANIM_FPS, DEPTH, PLAYER_FX, SCREEN, TIMING } from '../theme';
import { ensureAnim } from './anims';

interface Puff {
  sprite: Phaser.GameObjects.Sprite;
  /** Left edge, world px. */
  left: number;
}

/**
 * Dust at the player's feet (spec §13.2, DISENO §10): a puff every so often while running on
 * the ground and two on landing. Each puff stays where it was made and moves with the ground.
 */
export class Dust {
  private readonly puffs: Puff[] = [];
  private readonly anim: string;
  private sinceRunPuff = 0;

  constructor(scene: Phaser.Scene) {
    this.anim = ensureAnim(scene, 'fx_dust_puff', 'fx_dust', ANIM_FPS.dust, { repeat: 0 });
    for (let i = 0; i < PLAYER_FX.dust.pool; i++) {
      const sprite = scene.add.sprite(0, 0, 'fx_dust').setOrigin(0, 1).setDepth(DEPTH.playerFxBack).setVisible(false);
      sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => sprite.setVisible(false));
      this.puffs.push({ sprite, left: 0 });
    }
  }

  /**
   * `frameLeft` = the player's frame left edge on screen; `running` = on the ground this frame;
   * `landed` = touched down this frame.
   */
  update(deltaMs: number, scrolled: number, frameLeft: number, running: boolean, landed: boolean): void {
    const { runDx, landDx } = PLAYER_FX.dust;
    if (landed) for (const dx of landDx) this.puff(scrolled + frameLeft + dx);
    this.sinceRunPuff = running ? this.sinceRunPuff + deltaMs : 0;
    if (this.sinceRunPuff >= TIMING.dustRunEvery) {
      this.sinceRunPuff = 0;
      this.puff(scrolled + frameLeft + runDx);
    }
    for (const { sprite, left } of this.puffs) {
      if (sprite.visible) sprite.x = Math.round(left - Math.round(scrolled));
    }
  }

  private puff(worldLeft: number): void {
    const free = this.puffs.find((p) => !p.sprite.visible);
    if (!free) return;
    free.left = worldLeft;
    free.sprite.setVisible(true).setY(SCREEN.groundY).play(this.anim);
  }
}
