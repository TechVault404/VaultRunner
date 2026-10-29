import Phaser from 'phaser';

/**
 * Creates (once) an animation over frames [start, end] of a sheet and returns its key.
 * Keys follow DISENO §10: `<asset>_<action>`, e.g. `enemy_drone_fly`.
 */
export function ensureAnim(
  scene: Phaser.Scene,
  key: string,
  texture: string,
  frameRate: number,
  { repeat = -1, start, end }: { repeat?: number; start?: number; end?: number } = {},
): string {
  if (!scene.anims.exists(key)) {
    // Phaser reads a present-but-undefined start/end as a value: only pass the ones given.
    const range = start === undefined || end === undefined ? undefined : { start, end };
    scene.anims.create({ key, frames: scene.anims.generateFrameNumbers(texture, range), frameRate, repeat });
  }
  return key;
}
