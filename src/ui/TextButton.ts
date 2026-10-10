import Phaser from 'phaser';
import { toCss, UI } from '../config';

/** Text button usable with mouse/touch (tap) and keyboard/gamepad focus (via ButtonList). */
export class TextButton extends Phaser.GameObjects.Text {
  private label: string;
  private focused = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    label: string,
    private readonly onActivate: () => void,
  ) {
    super(scene, x, y, label, {
      fontFamily: UI.fontFamily,
      fontSize: UI.fontSizeButton,
      color: toCss(UI.textColor),
    });
    this.label = label;
    this.setOrigin(0.5);
    this.setInteractive({ useHandCursor: true });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.emit('hover', this));
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => this.activate());
    scene.add.existing(this);
  }

  setLabel(label: string): this {
    this.label = label;
    return this.refresh();
  }

  setFocused(focused: boolean): this {
    this.focused = focused;
    return this.refresh();
  }

  activate(): void {
    this.onActivate();
  }

  private refresh(): this {
    this.setText(this.focused ? `${UI.focusMarker}${this.label}` : this.label);
    this.setColor(toCss(this.focused ? UI.focusColor : UI.textColor));
    return this;
  }
}
