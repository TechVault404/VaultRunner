import Phaser from 'phaser';
import { COLOR, DEPTH, TIMING } from '../theme';
import { pixelText } from './text';

/** "+10"-style points text (DISENO §7.7): rises and disappears where the points were won. */
export function floatingText(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const text = pixelText(scene, Math.round(x), Math.round(y), message, { color: COLOR.points, align: 'center' });
  text.setDepth(DEPTH.floatingText);
  const { duration, rise } = TIMING.floatingText;
  scene.tweens.add({
    targets: text,
    y: text.y - rise,
    duration,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      text.y = Math.round(text.y);
    },
    onComplete: () => text.destroy(),
  });
}
