import Phaser from 'phaser';
import { ANIM_FPS, DEPTH } from '../theme';
import { ensureAnim } from './anims';

/** Enemy death (DISENO §10): the 300 ms pixel explosion, centered on (x, y). */
export function explode(scene: Phaser.Scene, x: number, y: number): void {
  const anim = ensureAnim(scene, 'explosion_burst', 'explosion', ANIM_FPS.explosion, { repeat: 0 });
  const blast = scene.add.sprite(Math.round(x), Math.round(y), 'explosion').setDepth(DEPTH.fx);
  blast.play(anim);
  blast.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => blast.destroy());
}
