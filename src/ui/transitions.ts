import Phaser from 'phaser';
import { TRANSITIONS } from '../config';

const { r, g, b } = TRANSITIONS.fadeColor;

/** Fades the scene's camera in. Call at the start of every scene's `create`. */
export function fadeIn(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(TRANSITIONS.fadeMs, r, g, b);
}

/** Fades out, then starts `key` (restarts the scene if it is the same key). Ignores repeated calls mid-fade. */
export function fadeToScene(scene: Phaser.Scene, key: string, data?: object): void {
  const camera = scene.cameras.main;
  if (camera.fadeEffect.isRunning && camera.fadeEffect.direction === false) return;
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
  camera.fadeOut(TRANSITIONS.fadeMs, r, g, b);
}
