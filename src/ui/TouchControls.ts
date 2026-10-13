import Phaser from 'phaser';
import { frameIndex } from '../assets';
import type { Action, InputSystem } from '../systems/InputSystem';
import { DEPTH, LAYOUT, UI } from '../theme';
import { setTouchArea } from './touch';

/**
 * On-screen crouch and shoot buttons (DISENO §7.10), only on touch devices. Each one holds
 * its action through InputSystem while a finger is on it. Jumping is a tap on the free part
 * of the left half, handled by InputSystem itself.
 */
export function addTouchControls(scene: Phaser.Scene, input: InputSystem): void {
  if (!scene.sys.game.device.input.touch) return;
  const { crouch, shoot } = LAYOUT.game.touch;
  holdButton(scene, input, 'touch_crouch', crouch, 'crouch');
  holdButton(scene, input, 'touch_shoot', shoot, 'shoot');
}

function holdButton(
  scene: Phaser.Scene,
  input: InputSystem,
  key: string,
  { x, y }: { x: number; y: number },
  action: Action,
): void {
  const normal = frameIndex(scene, key, 'normal');
  const pressed = frameIndex(scene, key, 'pressed');
  const source = `button:${action}`;
  const image = scene.add.image(x, y, key, normal).setOrigin(0).setAlpha(UI.touch.alpha).setDepth(DEPTH.touch);
  setTouchArea(image, false);

  /** Finger currently holding the button. */
  let pointerId: number | null = null;
  const release = () => {
    if (pointerId === null) return;
    pointerId = null;
    image.setFrame(normal);
    input.release(action, source);
  };

  image.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, (pointer: Phaser.Input.Pointer) => {
    pointerId = pointer.id;
    image.setFrame(pressed);
    input.press(action, source);
  });
  // The finger may slide off the button or be lifted anywhere.
  image.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === pointerId) release();
  });
  const onUp = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id === pointerId) release();
  };
  scene.input.on(Phaser.Input.Events.POINTER_UP, onUp);
  scene.input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, onUp);
  // A paused scene misses the finger going up: the button starts released when it resumes.
  scene.events.on(Phaser.Scenes.Events.PAUSE, release);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.input.off(Phaser.Input.Events.POINTER_UP, onUp);
    scene.input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, onUp);
    scene.events.off(Phaser.Scenes.Events.PAUSE, release);
  });
}
