import Phaser from 'phaser';
import { frameIndex } from '../assets';
import type { ZoneScenery } from '../entities/ZoneScenery';
import { DEPTH, PALETTE, SCREEN } from '../theme';
import type { Span } from './holes';

interface Hole {
  /** Left edge of the floorless span, world px (always on a tile boundary). */
  left: number;
  tiles: number;
  /** Edge tiles: the last ground column before the hole and the first one after it. */
  edges: Phaser.GameObjects.Image[];
}

/**
 * Holes in the ground (spec §11.1): whole tiles without floor. The ground TileSprites are cut
 * with an inverted geometry mask (WebGL), and the zone's edge tiles close the ground on both
 * sides. The edge art ends 4 px before the tile does, so the visible gap is 8 px wider than
 * the real one: falling in always looks deserved.
 */
export class GroundSystem {
  private readonly holes: Hole[] = [];
  private readonly shape: Phaser.GameObjects.Graphics;

  constructor(
    private readonly scene: Phaser.Scene,
    scenery: ZoneScenery,
  ) {
    this.shape = scene.make.graphics({}, false);
    const mask = this.shape.createGeometryMask();
    mask.setInvertAlpha(true);
    scenery.setGroundMask(mask);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shape.destroy());
  }

  /** Adds a hole `tiles` wide whose floorless span starts at world x `left`, in `zone`'s art. */
  add(left: number, tiles: number, zone: number): void {
    const sheet = `zona${zone}_tiles`;
    const edge = (name: string) =>
      this.scene.add.image(0, 0, sheet, frameIndex(this.scene, sheet, name)).setOrigin(0).setDepth(DEPTH.ground);
    const edges = [edge('edgeL_top'), edge('edgeL_fill'), edge('edgeR_top'), edge('edgeR_fill')];
    this.holes.push({ left, tiles, edges });
  }

  /** Redraws the cut and the edges where the ground is now; forgets holes left behind. */
  update(scrolled: number): void {
    const shift = Math.round(scrolled);
    const tile = SCREEN.tile;
    const depth = SCREEN.h - SCREEN.groundY;
    this.shape.clear().fillStyle(PALETTE.white); // mask shape: only its coverage matters, never drawn
    for (let i = this.holes.length - 1; i >= 0; i--) {
      const hole = this.holes[i]!;
      const x = hole.left - shift;
      const right = x + hole.tiles * tile;
      if (right + tile < 0) {
        for (const image of hole.edges) image.destroy();
        this.holes.splice(i, 1);
        continue;
      }
      // Cut the hole plus one column each side, where the edge tiles go.
      this.shape.fillRect(x - tile, SCREEN.groundY, (hole.tiles + 2) * tile, depth);
      const [lTop, lFill, rTop, rFill] = hole.edges;
      lTop?.setPosition(x - tile, SCREEN.groundY);
      lFill?.setPosition(x - tile, SCREEN.groundY + tile);
      rTop?.setPosition(right, SCREEN.groundY);
      rFill?.setPosition(right, SCREEN.groundY + tile);
    }
  }

  /** Floorless spans in screen px. */
  spans(scrolled: number): Span[] {
    const shift = Math.round(scrolled);
    return this.holes.map(({ left, tiles }) => ({ left: left - shift, right: left - shift + tiles * SCREEN.tile }));
  }
}
