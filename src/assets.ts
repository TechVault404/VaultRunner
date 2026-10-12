import Phaser from 'phaser';
import type { CharacterField } from './systems/CharacterOptions';

/** Shape of public/assets/manifest.json (see ASSETS.md). */
export interface AssetManifest {
  spritesheets: {
    key: string;
    url: string;
    frameWidth: number;
    frameHeight: number;
    frames: number;
    frameNames?: string[];
  }[];
  images: { key: string; url: string }[];
  bitmapFonts: { key: string; textureURL: string; fontDataURL: string }[];
  audio: { key: string; url: string }[];
  notes: {
    player: {
      animations: Record<PlayerAnim, { start: number; end: number }>;
      /** Display name of each option, per CharacterConfig index field. */
      options: Record<CharacterField, string[]>;
    };
  };
}

export type PlayerAnim = 'run' | 'jump' | 'fall' | 'crouch' | 'shoot' | 'death';

export const MANIFEST_KEY = 'manifest';
export const MANIFEST_URL = 'assets/manifest.json';

/** Queues every asset listed in the manifest on the given loader. */
export function queueManifest(load: Phaser.Loader.LoaderPlugin, manifest: AssetManifest): void {
  for (const sheet of manifest.spritesheets) {
    load.spritesheet(sheet.key, sheet.url, { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight });
  }
  for (const image of manifest.images) load.image(image.key, image.url);
  for (const font of manifest.bitmapFonts) load.bitmapFont(font.key, font.textureURL, font.fontDataURL);
  for (const sound of manifest.audio) load.audio(sound.key, sound.url);
}

export function getManifest(scene: Phaser.Scene): AssetManifest {
  return scene.cache.json.get(MANIFEST_KEY) as AssetManifest;
}

/** Frame index of a named frame (manifest `frameNames`), e.g. frameIndex(scene, 'icons', 'pause'). */
export function frameIndex(scene: Phaser.Scene, key: string, name: string): number {
  const index = getManifest(scene).spritesheets.find((sheet) => sheet.key === key)?.frameNames?.indexOf(name) ?? -1;
  if (index < 0) throw new Error(`Unknown frame "${name}" in "${key}"`);
  return index;
}
