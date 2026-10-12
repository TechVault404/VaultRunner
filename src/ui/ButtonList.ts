import { playSfx } from '../systems/AudioSystem';
import type { InputSystem } from '../systems/InputSystem';
import type { Button } from './Button';

/**
 * Keyboard/gamepad focus over a set of buttons (DISENO §7.2): up/left = previous,
 * down/right = next, confirm activates. Pointer hover moves the focus.
 */
export class ButtonList {
  private index = 0;

  constructor(
    private readonly input: InputSystem,
    private readonly buttons: Button[],
    initialIndex = 0,
  ) {
    buttons.forEach((button, i) => button.on('hover', () => this.focus(i, true)));
    this.focus(initialIndex, false);
  }

  /** Call after `input.update()` each frame. */
  update(): void {
    if (this.input.justPressed('uiUp') || this.input.justPressed('uiLeft')) this.focus(this.index - 1, true);
    if (this.input.justPressed('uiDown') || this.input.justPressed('uiRight')) this.focus(this.index + 1, true);
    if (this.input.justPressed('uiConfirm')) this.buttons[this.index]?.activate();
  }

  /** `audible`: play ui_move when the focus actually changes. */
  private focus(index: number, audible: boolean): void {
    const count = this.buttons.length;
    if (count === 0) return;
    const next = ((index % count) + count) % count;
    const target = this.buttons[next];
    if (audible && next !== this.index && target) playSfx(target.scene, 'ui_move');
    this.index = next;
    this.buttons.forEach((button, i) => button.setFocused(i === this.index));
  }
}
