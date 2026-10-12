import Phaser from 'phaser';
import { AUDIO } from '../config';
import { saveSystem } from './SaveSystem';

export type SfxKey = keyof typeof AUDIO.sfx;

/**
 * Plays a sound effect if the "sfx" setting is on. Each key keeps a single instance that
 * restarts on replay, so repeated clicks never stack (spec §13.1). Music arrives in Phase 3.
 */
export function playSfx(scene: Phaser.Scene, key: SfxKey): void {
  if (!saveSystem.data.settings.sfx || !scene.cache.audio.exists(key)) return;
  const sound = scene.sound.get(key) ?? scene.sound.add(key, { volume: AUDIO.sfx[key] });
  sound.play();
}
