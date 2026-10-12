import Phaser from 'phaser';
import { SAVE } from '../config';
import { playSfx } from '../systems/AudioSystem';
import { sanitizeName } from '../systems/CharacterOptions';
import { COLOR, LAYOUT, TIMING } from '../theme';
import { addPanel } from './panels';
import { PixelText } from './text';
import { setTouchArea } from './touch';

export interface NameFieldOptions {
  onChange: (name: string) => void;
  onFocus: () => void;
  /** Editing ended (Enter, Esc, arrows or losing focus). */
  onStop: () => void;
}

/**
 * Name entry box. Typing goes through a hidden HTML <input> so the phone's keyboard opens
 * on touch and desktop typing works the same way. While editing, Phaser's keyboard is
 * switched off so game keys (W, S, Space…) type letters instead of navigating.
 */
export class NameField extends Phaser.GameObjects.Container {
  private readonly label: PixelText;
  private readonly text: PixelText;
  private readonly element: HTMLInputElement;
  private value = '';
  private cursorOn = false;
  private editingName = false;

  constructor(scene: Phaser.Scene, private readonly options: NameFieldOptions) {
    const { box, labelDx, labelDy, textDx, textDy } = LAYOUT.editor.nameField;
    super(scene, box.x, box.y);

    this.label = new PixelText(scene, labelDx, labelDy, 'NOMBRE', { color: COLOR.textMuted });
    const panel = addPanel(scene, { x: 0, y: 0, w: box.w, h: box.h });
    this.text = new PixelText(scene, textDx, textDy, '');
    this.add([this.label, panel, this.text]);

    // Focus inside the native pointer handler: mobile browsers only open the keyboard from a user gesture.
    setTouchArea(panel);
    panel.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      options.onFocus();
      this.startEditing();
    });

    this.element = createHiddenInput();
    this.element.addEventListener('input', this.onInput);
    this.element.addEventListener('keydown', this.onKeyDown);
    this.element.addEventListener('blur', this.onBlur);

    scene.time.addEvent({
      delay: TIMING.cursorBlink,
      loop: true,
      callback: () => {
        this.cursorOn = !this.cursorOn;
        this.render();
      },
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.dispose, this);
    scene.add.existing(this);
  }

  get editing(): boolean {
    return this.editingName;
  }

  setName(name: string): this {
    this.value = name;
    return this.render();
  }

  setFocused(focused: boolean): this {
    this.label.setColor(focused ? COLOR.accent : COLOR.textMuted);
    return this;
  }

  startEditing(): void {
    if (this.editingName) return;
    this.editingName = true;
    this.setKeyboardEnabled(false);
    this.element.value = this.value;
    this.element.focus();
    playSfx(this.scene, 'ui_confirm');
    this.cursorOn = true;
    this.render();
  }

  stopEditing(): void {
    if (!this.editingName) return;
    this.editingName = false;
    this.element.blur();
    // iOS can leave the page scrolled after the on-screen keyboard closes.
    window.scrollTo(0, 0);
    this.setKeyboardEnabled(true);
    const trimmed = this.value.trim();
    if (trimmed !== this.value) this.options.onChange(trimmed);
    this.render();
    this.options.onStop();
  }

  private render(): this {
    this.text.setText(this.value + (this.editingName && this.cursorOn ? '_' : ''));
    return this;
  }

  private setKeyboardEnabled(enabled: boolean): void {
    const keyboard = this.scene.input.keyboard;
    if (keyboard) keyboard.manager.enabled = enabled;
  }

  private readonly onInput = (): void => {
    const name = sanitizeName(this.element.value);
    if (this.element.value !== name) this.element.value = name;
    if (name !== this.value) playSfx(this.scene, 'ui_type');
    this.options.onChange(name);
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (['Enter', 'Escape', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      if (this.editingName) playSfx(this.scene, event.key === 'Escape' ? 'ui_back' : 'ui_confirm');
      this.stopEditing();
    }
  };

  private readonly onBlur = (): void => this.stopEditing();

  private dispose(): void {
    this.element.removeEventListener('input', this.onInput);
    this.element.removeEventListener('keydown', this.onKeyDown);
    this.element.removeEventListener('blur', this.onBlur);
    this.element.remove();
    this.setKeyboardEnabled(true);
  }
}

/** Invisible input; 16 px font keeps iOS from zooming in on focus. */
function createHiddenInput(): HTMLInputElement {
  const input = document.createElement('input');
  Object.assign(input, { type: 'text', maxLength: SAVE.nameMaxLength, autocomplete: 'off', spellcheck: false });
  input.setAttribute('autocapitalize', 'characters');
  input.setAttribute('aria-label', 'Nombre');
  Object.assign(input.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '1px',
    height: '1px',
    opacity: '0',
    fontSize: '16px',
    border: '0',
    padding: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(input);
  return input;
}
