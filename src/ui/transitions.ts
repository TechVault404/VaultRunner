import Phaser from 'phaser';
import { COLOR, TIMING } from '../theme';

const { r, g, b } = Phaser.Display.Color.IntegerToRGB(COLOR.bg);

/** Fades the scene's camera in. Call at the start of every scene's `create`. */
export function fadeIn(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(TIMING.sceneFade, r, g, b);
}

/** Fades out, then starts `key` (restarts the scene if it is the same key). Ignores repeated calls mid-fade. */
export function fadeToScene(scene: Phaser.Scene, key: string, data?: object): void {
  const camera = scene.cameras.main;
  // `direction` true = fading out. A fade-in in progress is overridden (force) so the switch always happens.
  if (camera.fadeEffect.isRunning && camera.fadeEffect.direction) return;
  camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => scene.scene.start(key, data));
  camera.fade(TIMING.sceneFade, r, g, b, true);
}
