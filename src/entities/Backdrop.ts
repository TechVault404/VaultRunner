import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { DEPTH, GROUND_TILES, PARALLAX, SCREEN } from '../theme';

type Layer = 'far' | 'mid' | 'near';

const LAYERS: { name: Layer; depth: number; factor: number }[] = [
  { name: 'far', depth: DEPTH.bgFar, factor: PARALLAX.far },
  { name: 'mid', depth: DEPTH.bgMid, factor: PARALLAX.mid },
  { name: 'near', depth: DEPTH.bgNear, factor: PARALLAX.near },
];

/**
 * Zone scenery: 3 parallax layers plus the 2-row tiled ground (DISENO §3).
 * `useDepth` applies the DEPTH layers (gameplay); menus rely on creation order instead.
 */
export class Backdrop {
  private readonly layers: { sprite: Phaser.GameObjects.TileSprite; factor: number }[] = [];
  private offset = 0;

  constructor(
    scene: Phaser.Scene,
    zone: number,
    { layers = ['far', 'mid', 'near'] as Layer[], ground = true, useDepth = false } = {},
  ) {
    for (const layer of LAYERS.filter(({ name }) => layers.includes(name))) {
      const sprite = scene.add
        .tileSprite(0, 0, SCREEN.w, SCREEN.h, `zona${zone}_bg_${layer.name}`)
        .setOrigin(0)
        .setDepth(useDepth ? layer.depth : 0);
      this.layers.push({ sprite, factor: layer.factor });
    }
    if (ground) {
      const sprite = scene.add
        .tileSprite(0, SCREEN.groundY, SCREEN.w, SCREEN.h - SCREEN.groundY, groundTexture(scene, zone))
        .setOrigin(0)
        .setDepth(useDepth ? DEPTH.ground : 0);
      this.layers.push({ sprite, factor: PARALLAX.ground });
    }
  }

  /** Advances the scenery by `dx` ground pixels. */
  scroll(dx: number): void {
    this.offset += dx;
    for (const { sprite, factor } of this.layers) sprite.tilePositionX = Math.round(this.offset * factor);
  }
}

/** Builds (once) a repeatable ground texture from the zone's tile sheet. */
function groundTexture(scene: Phaser.Scene, zone: number): string {
  const key = `zona${zone}_ground`;
  if (scene.textures.exists(key)) return key;

  const sheet = `zona${zone}_tiles`;
  const tile = SCREEN.tile;
  const canvas = scene.textures.createCanvas(key, GROUND_TILES.columns * tile, tile * 2);
  if (!canvas) throw new Error(`Could not create ${key}`);
  for (let i = 0; i < GROUND_TILES.columns; i++) {
    const top = GROUND_TILES.top[i % GROUND_TILES.top.length] ?? GROUND_TILES.top[0];
    const fill = i % GROUND_TILES.fillAltEvery === 0 ? GROUND_TILES.fillAlt : GROUND_TILES.fill;
    canvas.drawFrame(sheet, frameIndex(scene, sheet, top), i * tile, 0);
    canvas.drawFrame(sheet, frameIndex(scene, sheet, fill), i * tile, tile);
  }
  canvas.refresh();
  return key;
}
