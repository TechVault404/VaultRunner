import Phaser from 'phaser';
import { MANIFEST_KEY, MANIFEST_URL, queueManifest, type AssetManifest } from '../assets';
import { COLOR, LAYOUT } from '../theme';
import { SceneKey } from './keys';

/** Loads the manifest, then every asset it lists, with a progress bar. */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    const { x, y, w, h } = LAYOUT.preload.bar;
    this.add.rectangle(x, y, w, h, COLOR.surface).setOrigin(0);
    const fill = this.add.rectangle(x, y, 0, h, COLOR.accent).setOrigin(0);
    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      fill.width = Math.round(w * progress);
    });

    this.load.json(MANIFEST_KEY, MANIFEST_URL);
    this.load.once(
      `${Phaser.Loader.Events.FILE_KEY_COMPLETE}json-${MANIFEST_KEY}`,
      (_key: string, _type: string, manifest: AssetManifest) => queueManifest(this.load, manifest),
    );
  }

  create(): void {
    this.scene.start(SceneKey.Menu);
  }
}
