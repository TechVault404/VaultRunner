import Phaser from 'phaser';
import type { Hitbox } from '../config';

/** What world things may need to know about the player each frame. */
export interface PlayerProbe {
  /** Player hitbox in screen px. */
  bounds: Phaser.Geom.Rectangle;
}

/** Shared per-frame state handed to every world thing. */
export interface WorldTick {
  /** ms since the last frame, already scaled by slow motion. */
  deltaMs: number;
  /** Ground px scrolled so far (world px of the screen's left edge). */
  scrolled: number;
  /** World speed (px/s). */
  speed: number;
  player: PlayerProbe;
}

/**
 * Something placed in the world (spec §11): it keeps its left edge in world px and is drawn at
 * `left − scrolled`, rounded like the ground tiles so it moves in step with the floor. The
 * Arcade body is only a hitbox (it never moves on its own). Pooled: `kill` puts it back.
 */
export abstract class WorldSprite extends Phaser.Physics.Arcade.Sprite {
  /** Left edge of the frame, world px. */
  left = 0;
  /** Top edge of the frame, screen px. */
  top = 0;
  /** ms alive (slow motion included). */
  protected age = 0;

  protected activate(texture: string, left: number, top: number, hitbox: Hitbox): void {
    this.setTexture(texture);
    this.left = left;
    this.top = top;
    this.age = 0;
    this.enableBody(true, 0, 0, true, true);
    this.clearTint();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.moves = false;
    body.setSize(hitbox.w, hitbox.h, false).setOffset(hitbox.dx, hitbox.dy);
  }

  /** Behavior for one frame (moving, animating); the default only ages. */
  tick(world: WorldTick): void {
    this.age += world.deltaMs;
  }

  /** Draws it where the world is now; returns false (and frees it) once it left the screen. */
  sync(scrolled: number): boolean {
    const screenLeft = Math.round(this.left - Math.round(scrolled));
    if (screenLeft + this.width < 0) {
      this.kill();
      return false;
    }
    this.setPosition(screenLeft + this.displayOriginX, Math.round(this.top) + this.displayOriginY);
    (this.body as Phaser.Physics.Arcade.Body).updateFromGameObject();
    return true;
  }

  /** Screen x of the left edge. */
  screenLeft(scrolled: number): number {
    return this.left - Math.round(scrolled);
  }

  kill(): void {
    this.stop();
    this.disableBody(true, true);
  }
}
