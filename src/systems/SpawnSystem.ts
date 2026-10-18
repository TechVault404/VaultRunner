import Phaser from 'phaser';
import { SPAWN } from '../config';
import { Bug, Drone } from '../entities/Enemy';
import { EnemyBullet } from '../entities/EnemyBullet';
import { Glitch } from '../entities/Glitch';
import { Obstacle, type ObstacleKind } from '../entities/Obstacle';
import { Turret } from '../entities/Turret';
import type { WorldSprite, WorldTick } from '../entities/WorldSprite';
import { SCREEN } from '../theme';
import type { CoinSystem } from './CoinSystem';
import type { GroundSystem } from './GroundSystem';
import type { Rng } from './Rng';
import { SpawnPlanner, type PlannedCoin, type PlannedThreat, type SpeedCurve } from './SpawnPlanner';

type Pool = Phaser.Physics.Arcade.Group;

/**
 * The Phaser side of spawning (spec §11.3): asks the SpawnPlanner for the world ahead, brings
 * each planned threat and coin into play just past the right edge of the screen, runs their
 * behavior every frame and returns them to their pools once they are behind the player.
 */
export class SpawnSystem {
  readonly obstacles: Pool;
  readonly bugs: Pool;
  readonly drones: Pool;
  readonly turrets: Pool;
  readonly glitches: Pool;
  readonly bullets: Pool;
  private readonly planner: SpawnPlanner;
  private readonly threats: PlannedThreat[] = [];
  private readonly coinQueue: PlannedCoin[] = [];

  constructor(
    scene: Phaser.Scene,
    rng: Rng,
    curve: SpeedCurve,
    startX: number,
    private readonly ground: GroundSystem,
    private readonly coins: CoinSystem,
    /** Zone whose art new obstacles and holes get. */
    private readonly zone: () => number,
  ) {
    this.planner = new SpawnPlanner(rng, curve, startX);
    const pool = (classType: Function, maxSize: number): Pool =>
      scene.physics.add.group({ classType, maxSize, allowGravity: false, runChildUpdate: false });
    const { pools } = SPAWN;
    this.obstacles = pool(Obstacle, pools.obstacles);
    this.bugs = pool(Bug, pools.bugs);
    this.drones = pool(Drone, pools.drones);
    this.turrets = pool(Turret, pools.turrets);
    this.glitches = pool(Glitch, pools.glitches);
    this.bullets = pool(EnemyBullet, pools.bullets);
  }

  /** Everything shots can hurt. */
  get enemyPools(): Pool[] {
    return [this.bugs, this.drones, this.turrets, this.glitches];
  }

  /** Everything that hurts the player on contact. */
  get dangerPools(): Pool[] {
    return [this.obstacles, ...this.enemyPools, this.bullets];
  }

  update(world: WorldTick): void {
    const { scrolled } = world;
    const { threats, coins } = this.planner.planUntil(scrolled + SCREEN.w + SPAWN.lookaheadPx);
    this.threats.push(...threats);
    this.coinQueue.push(...coins);

    const enterX = scrolled + SCREEN.w + SPAWN.spawnMarginPx;
    while (this.threats.length > 0 && this.threats[0]!.x <= enterX) this.spawn(this.threats.shift()!, world);
    this.coinQueue.sort((a, b) => a.x - b.x);
    while (this.coinQueue.length > 0 && this.coinQueue[0]!.x <= enterX) {
      const coin = this.coinQueue.shift()!;
      this.coins.add(coin.x, coin.y, scrolled);
    }

    for (const pool of this.dangerPools) {
      for (const thing of pool.getChildren() as WorldSprite[]) {
        if (!thing.active) continue;
        thing.tick(world);
        thing.sync(scrolled);
      }
    }
    this.coins.update(scrolled);
    this.ground.update(scrolled);
  }

  private spawn(threat: PlannedThreat, world: WorldTick): void {
    const { kind, x } = threat;
    switch (kind) {
      case 'hole':
        this.ground.add(x, threat.tiles ?? SPAWN.hole.tiles[0], this.zone());
        return;
      case 'bug':
        return this.place(this.bugs, world, (bug: Bug) => bug.spawn(x));
      case 'drone':
        return this.place(this.drones, world, (drone: Drone) => drone.spawn(x, threat.phase ?? 0));
      case 'turret':
        return this.place<Turret>(this.turrets, world, (turret) =>
          turret.spawn(x, (right, centerY) => this.fire(right, centerY)),
        );
      case 'glitch':
        return this.place(this.glitches, world, (glitch: Glitch) => glitch.spawn(x, threat.lane ?? 'low'));
      default:
        return this.place(this.obstacles, world, (obstacle: Obstacle) => {
          obstacle.spawn(kind as ObstacleKind, this.zone(), x);
          if (kind === 'saw') {
            // Time its swing for when it gets to the player at the current speed.
            const ahead = obstacle.screenLeft(world.scrolled) - world.player.bounds.left;
            obstacle.timeSaw((Math.max(0, ahead) * 1000) / world.speed, threat.sawUp ?? true);
          }
        });
    }
  }

  private place<T extends WorldSprite>(pool: Pool, world: WorldTick, start: (thing: T) => void): void {
    const thing = pool.get() as T | null;
    if (!thing) return; // pool exhausted: skip it rather than stall the run
    start(thing);
    thing.sync(world.scrolled);
  }

  /** Turret shot; the bullets pool is updated after the turrets, so it is drawn this frame. */
  private fire(right: number, centerY: number): void {
    (this.bullets.get() as EnemyBullet | null)?.spawn(right, centerY);
  }
}
