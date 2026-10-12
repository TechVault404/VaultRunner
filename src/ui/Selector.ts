import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { COLOR, UI } from '../theme';
import { addPanel } from './panels';
import { PixelText } from './text';

const ICONS_KEY = 'icons';

export interface SelectorOptions {
  label: string;
  /** Arrow pressed: -1 (◀) or +1 (▶). */
  onStep: (delta: number) => void;
  /** Any part of the selector was touched. */
  onFocus: () => void;
}

/**
 * ◀ VALUE ▶ selector (DISENO §7.5): 13 px panel, arrows at the ends, centered value and
 * the category label above. Selected: accentDeep fill and textPrimary value.
 */
export class Selector extends Phaser.GameObjects.Container {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly value: PixelText;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, options: SelectorOptions) {
    super(scene, Math.round(x), Math.round(y));
    const { h, labelDx, labelDy, valueDy, arrowLeftDx, arrowRightInset, arrowDy } = UI.selector;

    const label = new PixelText(scene, labelDx, labelDy, options.label, { color: COLOR.textMuted });
    const panel = addPanel(scene, { x: 0, y: 0, w, h });
    this.fill = scene.add.rectangle(1, 1, w - 2, h - 2, COLOR.accentDeep).setOrigin(0).setVisible(false);
    this.value = new PixelText(scene, Math.floor(w / 2), valueDy, '', { align: 'center' });
    const left = this.arrow(arrowLeftDx, arrowDy, 'arrow_l', () => options.onStep(-1));
    const right = this.arrow(w - arrowRightInset, arrowDy, 'arrow_r', () => options.onStep(1));
    this.add([label, panel, this.fill, this.value, left, right]);

    panel.setInteractive();
    panel.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, options.onFocus);
    for (const arrow of [left, right]) arrow.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, options.onFocus);
    scene.add.existing(this);
  }

  setValue(text: string): this {
    this.value.setText(text);
    return this;
  }

  setSelected(selected: boolean): this {
    this.fill.setVisible(selected);
    this.value.setColor(selected ? COLOR.textPrimary : COLOR.textSecondary);
    return this;
  }

  private arrow(x: number, y: number, icon: string, onClick: () => void): Phaser.GameObjects.Image {
    const image = this.scene.add
      .image(x, y, ICONS_KEY, frameIndex(this.scene, ICONS_KEY, icon))
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });
    image.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, onClick);
    return image;
  }
}
