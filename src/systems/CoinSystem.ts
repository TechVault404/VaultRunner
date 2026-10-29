import Phaser from 'phaser';
import { POWERUPS, SCORE } from '../config';
import { Coin } from '../entities/Coin';

/**
 * Pool of the coins the spawn patterns place in rows and arcs (spec §10.3, §11.3).
 * Positions are in world px; `update` draws them where the ground has scrolled.
 */
export class CoinSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.group = scene.physics.add.group({
      classType: Coin,
      maxSize: SCORE.coins.poolSize,
      allowGravity: false,
      runChildUpdate: false,
    });
  }

  /** Adds a coin centered at world x / screen y (skipped if the pool is exhausted). */
  add(worldX: number, y: number, scrolled: number): void {
    const coin = this.group.get(0, y) as Coin | null;
    if (!coin) return;
    coin.spawn(worldX, y);
    coin.sync(scrolled);
  }

  update(scrolled: number): void {
    for (const coin of this.group.getChildren() as Coin[]) if (coin.active) coin.sync(scrolled);
  }

  /**
   * Magnet (spec §12): coins within `POWERUPS.magnet.radius` of the player's center (screen px)
   * fly to it, faster than the world moves so they catch up from behind too. Once caught, a
   * coin keeps flying until it is picked up, even if the magnet runs out (`catchNew` = false).
   */
  attract(target: { x: number; y: number }, scrolled: number, speed: number, deltaMs: number, catchNew: boolean): void {
    const { radius, pullSpeed } = POWERUPS.magnet;
    const step = ((speed + pullSpeed) * deltaMs) / 1000;
    for (const coin of this.group.getChildren() as Coin[]) {
      if (!coin.active) continue;
      if (!coin.magnetized && (!catchNew || Math.hypot(coin.x - target.x, coin.y - target.y) > radius)) continue;
      coin.magnetized = true;
      coin.pull(target.x + Math.round(scrolled), target.y, step);
      coin.sync(scrolled);
    }
  }
}
