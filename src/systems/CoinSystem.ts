import Phaser from 'phaser';
import { SCORE } from '../config';
import { Coin } from '../entities/Coin';

/**
 * Single coins to validate scoring (spec §10.3); rows and arcs between obstacles arrive with
 * the Phase 4 patterns. One coin every 30–60 m, at a height the player can reach.
 */
export class CoinSystem {
  readonly group: Phaser.Physics.Arcade.Group;
  private nextAtM: number;

  constructor(scene: Phaser.Scene, startM: number) {
    this.group = scene.physics.add.group({
      classType: Coin,
      maxSize: SCORE.coins.poolSize,
      allowGravity: false,
      runChildUpdate: false,
    });
    this.nextAtM = startM + this.gap();
  }

  /** `dx` = ground pixels moved this frame, `distanceM` = meters run so far. */
  update(dx: number, distanceM: number): void {
    for (const coin of this.group.getChildren() as Coin[]) if (coin.active) coin.advance(dx);
    if (distanceM < this.nextAtM) return;
    this.nextAtM = distanceM + this.gap();
    const y = Phaser.Utils.Array.GetRandom([...SCORE.coins.heights]) as number;
    const coin = this.group.get(SCORE.coins.spawnX, y) as Coin | null;
    coin?.spawn(SCORE.coins.spawnX, y);
  }

  private gap(): number {
    const { everyMinM, everyMaxM } = SCORE.coins;
    return Phaser.Math.FloatBetween(everyMinM, everyMaxM);
  }
}
