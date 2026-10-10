import type { InputSystem } from '../systems/InputSystem';
import type { TextButton } from './TextButton';

/** Vertical list of buttons navigable with up/down + confirm; pointer hover moves the focus. */
export class ButtonList {
  private index = 0;

  constructor(
    private readonly input: InputSystem,
    private readonly buttons: TextButton[],
  ) {
    buttons.forEach((button, i) => button.on('hover', () => this.focus(i)));
    this.focus(0);
  }

  /** Call after `input.update()` each frame. */
  update(): void {
    if (this.buttons.length === 0) return;
    if (this.input.justPressed('uiUp')) this.focus(this.index - 1);
    if (this.input.justPressed('uiDown')) this.focus(this.index + 1);
    if (this.input.justPressed('uiConfirm')) this.buttons[this.index]?.activate();
  }

  private focus(index: number): void {
    const count = this.buttons.length;
    if (count === 0) return;
    this.index = ((index % count) + count) % count;
    this.buttons.forEach((button, i) => button.setFocused(i === this.index));
  }
}
