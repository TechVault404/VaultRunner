import Phaser from 'phaser';
import { UI } from '../theme';

type Touchable = Phaser.GameObjects.GameObject &
  Phaser.GameObjects.Components.ComputedSize &
  Phaser.GameObjects.Components.Transform;

/**
 * Makes `target` interactive with a hit area of at least UI.touchMin logical px per side,
 * centered on it, without changing how it looks (spec §3 "Diseño responsivo").
 * Hit areas live in the object's local, unscaled space, so the minimum is divided by its scale.
 */
export function setTouchArea(target: Touchable, useHandCursor = true): Touchable {
  const { width, height } = target;
  const hitW = Math.max(width, UI.touchMin / Math.abs(target.scaleX || 1));
  const hitH = Math.max(height, UI.touchMin / Math.abs(target.scaleY || 1));
  return target.setInteractive({
    hitArea: new Phaser.Geom.Rectangle((width - hitW) / 2, (height - hitH) / 2, hitW, hitH),
    hitAreaCallback: Phaser.Geom.Rectangle.Contains,
    useHandCursor,
  });
}
