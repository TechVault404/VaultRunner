import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { COLOR, FONT, TIMING, UI } from '../theme';
import { PixelText } from './text';

export interface ButtonBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ButtonOptions {
  label?: string;
  /** Frame name in the `icons` sheet. */
  icon?: string;
  onClick: () => void;
}

const BUTTON_KEY = 'button';
const ICONS_KEY = 'icons';

/**
 * 9-slice button (DISENO §7.1–7.3): normal → hover/focus → pressed.
 * Pressing shows the pressed frame for TIMING.buttonPress, then runs the action.
 */
export class Button extends Phaser.GameObjects.Container {
  private readonly bg: Phaser.GameObjects.NineSlice;
  private readonly content: Phaser.GameObjects.Container;
  private readonly frames: { normal: number; hover: number; pressed: number };
  private icon?: Phaser.GameObjects.Image;
  private focused = false;
  private pressed = false;
  private busy = false;

  constructor(
    scene: Phaser.Scene,
    { x, y, w, h }: ButtonBox,
    private readonly options: ButtonOptions,
  ) {
    super(scene, Math.round(x), Math.round(y));
    this.frames = {
      normal: frameIndex(scene, BUTTON_KEY, 'normal'),
      hover: frameIndex(scene, BUTTON_KEY, 'hover'),
      pressed: frameIndex(scene, BUTTON_KEY, 'pressed'),
    };
    const slice = UI.nineSlice;
    this.bg = scene.add.nineslice(0, 0, BUTTON_KEY, this.frames.normal, w, h, slice, slice, slice, slice).setOrigin(0);
    this.content = scene.add.container(0, 0);
    this.add([this.bg, this.content]);
    this.layoutContent(w, h);

    this.bg.setInteractive({ useHandCursor: true });
    this.bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => this.emit('hover', this));
    this.bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => this.setPressed(true));
    this.bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => !this.busy && this.setPressed(false));
    this.bg.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => this.pressed && this.activate());
    scene.add.existing(this);
  }

  setFocused(focused: boolean): this {
    this.focused = focused;
    return this.refresh();
  }

  setIcon(name: string): this {
    this.icon?.setFrame(frameIndex(this.scene, ICONS_KEY, name));
    return this;
  }

  /** Plays the press feedback, then runs the action once. */
  activate(): void {
    if (this.busy) return;
    this.busy = true;
    this.setPressed(true);
    this.scene.time.delayedCall(TIMING.buttonPress, () => {
      this.busy = false;
      this.setPressed(false);
      this.options.onClick();
    });
  }

  private setPressed(pressed: boolean): void {
    this.pressed = pressed;
    this.refresh();
  }

  private refresh(): this {
    const { normal, hover, pressed } = this.frames;
    this.bg.setFrame(this.pressed ? pressed : this.focused ? hover : normal);
    this.content.y = this.pressed ? UI.button.pressedOffsetY : 0;
    return this;
  }

  private layoutContent(w: number, h: number): void {
    const { label, icon } = this.options;
    const text = label
      ? new PixelText(this.scene, 0, Math.floor((h - FONT.glyphHeight) / 2), label, { shadow: COLOR.accentDeep })
      : undefined;
    const textWidth = text?.measure() ?? 0;
    const iconWidth = icon ? UI.icon + (label ? UI.button.iconGap : 0) : 0;
    const left = Math.floor((w - iconWidth - textWidth) / 2);

    if (icon) {
      this.icon = this.scene.add
        .image(left, Math.floor((h - UI.icon) / 2), ICONS_KEY, frameIndex(this.scene, ICONS_KEY, icon))
        .setOrigin(0);
      this.content.add(this.icon);
    }
    if (text) {
      text.x = left + iconWidth;
      this.content.add(text);
    }
  }
}
