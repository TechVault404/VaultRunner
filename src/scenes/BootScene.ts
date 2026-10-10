import Phaser from 'phaser';
import { SceneKey } from './keys';

/** Engine-level setup before anything is loaded. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  create(): void {
    this.input.mouse?.disableContextMenu();
    this.scene.start(SceneKey.Preload);
  }
}
