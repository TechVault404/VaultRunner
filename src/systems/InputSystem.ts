import Phaser from 'phaser';
import { INPUT } from '../config';

/** Gameplay actions (spec §6) plus menu navigation actions. */
export type Action = keyof typeof INPUT.keys;

const ACTIONS = Object.keys(INPUT.keys) as Action[];

/** Kind of device the player used last; lets UI show keyboard hints only when they apply. */
export type InputDevice = 'keyboard' | 'mouse' | 'touch' | 'gamepad';

/**
 * Translates keyboard, touch, mouse and gamepad into abstract actions.
 * One instance per scene; call `update()` once at the start of the scene's `update`.
 * Nothing else in the game reads devices directly.
 *
 * Presses are latched until the next `update()`, so a tap shorter than a frame still
 * reports both `justPressed` and `justReleased`.
 */
export class InputSystem {
  /** Sources (key code, pointer id, gamepad…) currently holding each action. */
  private readonly holders = new Map<Action, Set<string>>();
  private pendingPressed = new Set<Action>();
  private pendingReleased = new Set<Action>();
  private pressed = new Set<Action>();
  private released = new Set<Action>();

  private readonly keyToActions = new Map<number, Action[]>();
  /** Touch pointers on the left half: their start Y and the action they hold. */
  private readonly touches = new Map<number, { startY: number; action: Action }>();
  private device: InputDevice;

  constructor(private readonly scene: Phaser.Scene) {
    this.device = scene.sys.game.device.input.touch ? 'touch' : 'keyboard';
    for (const action of ACTIONS) this.holders.set(action, new Set());
    this.bindKeyboard();
    this.bindPointer();

    // A paused scene misses key-up events; start clean when it comes back.
    scene.events.on(Phaser.Scenes.Events.RESUME, this.reset, this);
    scene.game.events.on(Phaser.Core.Events.BLUR, this.reset, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  update(): void {
    this.pollGamepad();
    this.pressed = this.pendingPressed;
    this.released = this.pendingReleased;
    this.pendingPressed = new Set();
    this.pendingReleased = new Set();
  }

  get lastDevice(): InputDevice {
    return this.device;
  }

  isDown(action: Action): boolean {
    return (this.holders.get(action)?.size ?? 0) > 0;
  }

  justPressed(action: Action): boolean {
    return this.pressed.has(action);
  }

  justReleased(action: Action): boolean {
    return this.released.has(action);
  }

  /** For on-screen buttons (shoot, crouch, pause) added in later phases. */
  press(action: Action, source: string): void {
    const holders = this.holders.get(action);
    if (!holders || holders.has(source)) return;
    if (holders.size === 0) this.pendingPressed.add(action);
    holders.add(source);
  }

  release(action: Action, source: string): void {
    const holders = this.holders.get(action);
    if (!holders?.delete(source)) return;
    if (holders.size === 0) this.pendingReleased.add(action);
  }

  /** Drops every held action without emitting releases. */
  reset(): void {
    for (const holders of this.holders.values()) holders.clear();
    this.touches.clear();
    this.pendingPressed.clear();
    this.pendingReleased.clear();
  }

  private bindKeyboard(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    for (const action of ACTIONS) {
      for (const name of INPUT.keys[action]) {
        const code = Phaser.Input.Keyboard.KeyCodes[name];
        const list = this.keyToActions.get(code) ?? [];
        list.push(action);
        this.keyToActions.set(code, list);
      }
    }
    keyboard.addCapture([...this.keyToActions.keys()]);

    keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);
    keyboard.on(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
  }

  private onKeyDown(event: KeyboardEvent): void {
    this.device = 'keyboard';
    for (const action of this.keyToActions.get(event.keyCode) ?? []) this.press(action, `key:${event.keyCode}`);
  }

  private onKeyUp(event: KeyboardEvent): void {
    for (const action of this.keyToActions.get(event.keyCode) ?? []) this.release(action, `key:${event.keyCode}`);
  }

  private bindPointer(): void {
    const input = this.scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    this.device = pointer.wasTouch ? 'touch' : 'mouse';
    // Pointers on interactive UI (buttons) are handled by the UI itself.
    if (over.length > 0) return;
    const source = `ptr:${pointer.id}`;

    if (!pointer.wasTouch) {
      if (pointer.leftButtonDown()) this.press('shoot', source);
      return;
    }
    // Touch: left half = jump on tap (immediate), becomes crouch if dragged down.
    if (pointer.x < this.scene.scale.gameSize.width / 2) {
      this.touches.set(pointer.id, { startY: pointer.y, action: 'jump' });
      this.press('jump', source);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    const touch = this.touches.get(pointer.id);
    if (!touch || touch.action === 'crouch') return;
    if (pointer.y - touch.startY >= INPUT.swipeDownThreshold) {
      const source = `ptr:${pointer.id}`;
      this.release('jump', source);
      this.press('crouch', source);
      touch.action = 'crouch';
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    const source = `ptr:${pointer.id}`;
    this.release('shoot', source);
    const touch = this.touches.get(pointer.id);
    if (touch) {
      this.release(touch.action, source);
      this.touches.delete(pointer.id);
    }
  }

  private pollGamepad(): void {
    const pad = this.scene.input.gamepad?.pad1;
    if (!pad) return;
    const { gamepad } = INPUT;
    const button = (index: number) => pad.buttons[index]?.pressed ?? false;
    const stickY = pad.leftStick.y;
    const stickX = pad.leftStick.x;
    const down = button(gamepad.dpadDown) || stickY > gamepad.axisDeadzone;
    const up = button(gamepad.dpadUp) || stickY < -gamepad.axisDeadzone;
    const left = button(gamepad.dpadLeft) || stickX < -gamepad.axisDeadzone;
    const right = button(gamepad.dpadRight) || stickX > gamepad.axisDeadzone;

    const states: [Action, boolean][] = [
      ['jump', button(gamepad.buttonA)],
      ['shoot', button(gamepad.buttonB)],
      ['crouch', down],
      ['pause', button(gamepad.buttonStart)],
      ['uiUp', up],
      ['uiDown', down],
      ['uiLeft', left],
      ['uiRight', right],
      ['uiConfirm', button(gamepad.buttonA)],
      ['uiBack', button(gamepad.buttonB)],
    ];
    if (states.some(([, isPressed]) => isPressed)) this.device = 'gamepad';
    for (const [action, isPressed] of states) {
      if (isPressed) this.press(action, 'pad');
      else this.release(action, 'pad');
    }
  }

  private destroy(): void {
    const input = this.scene.input;
    input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_DOWN, this.onKeyDown, this);
    input.keyboard?.off(Phaser.Input.Keyboard.Events.ANY_KEY_UP, this.onKeyUp, this);
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onPointerUp, this);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.reset, this);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.reset, this);
  }
}
