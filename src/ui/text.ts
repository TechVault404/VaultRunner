import Phaser from 'phaser';
import { toCss, UI } from '../config';

type TextOptions = { size?: string; color?: number; originX?: number; originY?: number };

/** Adds a text with the game's UI style. */
export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  { size = UI.fontSizeSmall, color = UI.textColor, originX = 0.5, originY = 0.5 }: TextOptions = {},
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, { fontFamily: UI.fontFamily, fontSize: size, color: toCss(color) })
    .setOrigin(originX, originY);
}
