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
    buttons.forEach((button, i) => button.on('hover', () => this.focus(i)));
    this.focus(initialIndex);
  }

  /** Call after `input.update()` each frame. */
  update(): void {
    if (this.input.justPressed('uiUp') || this.input.justPressed('uiLeft')) this.focus(this.index - 1);
    if (this.input.justPressed('uiDown') || this.input.justPressed('uiRight')) this.focus(this.index + 1);
    if (this.input.justPressed('uiConfirm')) this.buttons[this.index]?.activate();
  }

  private focus(index: number): void {
    const count = this.buttons.length;
    if (count === 0) return;
    this.index = ((index % count) + count) % count;
    this.buttons.forEach((button, i) => button.setFocused(i === this.index));
  }
}
