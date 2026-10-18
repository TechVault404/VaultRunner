import Phaser from 'phaser';
import { AUDIO, PLAYER, SCORE, WORLD } from '../config';
import type { Coin } from '../entities/Coin';
import type { Enemy } from '../entities/Enemy';
import type { Obstacle } from '../entities/Obstacle';
import { Player } from '../entities/Player';
import type { Projectile } from '../entities/Projectile';
import { ZoneScenery } from '../entities/ZoneScenery';
import { music } from '../systems/AudioSystem';
import { BiomeSystem, type ZoneState } from '../systems/BiomeSystem';
import { CoinSystem } from '../systems/CoinSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { GroundSystem } from '../systems/GroundSystem';
import { hasFloor } from '../systems/holes';
import { InputSystem } from '../systems/InputSystem';
import { PORTRAIT_EVENT } from '../systems/OrientationGuard';
import { Rng } from '../systems/Rng';
import { parseRunParams, type RunParams } from '../systems/RunParams';
import { saveSystem } from '../systems/SaveSystem';
import { applyRunResult, ScoreSystem } from '../systems/ScoreSystem';
import { ShootingSystem } from '../systems/ShootingSystem';
import { SpawnSystem } from '../systems/SpawnSystem';
import { ANIM_FPS, DEPTH, SCREEN, SHAKE, TIMING } from '../theme';
import { Announcer } from '../ui/Announcer';
import { floatingText } from '../ui/FloatingText';
import { Hud } from '../ui/Hud';
import { addTouchControls } from '../ui/TouchControls';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

export interface GameOverData {
  score: number;
  distance: number;
  enemies: number;
  coins: number;
  previousBest: number;
  newRecord: boolean;
}

/**
 * Main gameplay scene; orchestrates the systems. The world speeds up with the distance,
 * zones, music and scenery change along the way, obstacles and enemies come in patterns,
 * and the first hit ends the run (spec §11.4) and keeps the personal record.
 */
export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private params!: RunParams;
  private player!: Player;
  private shooting!: ShootingSystem;
  private scenery!: ZoneScenery;
  private difficulty!: DifficultySystem;
  private biomes!: BiomeSystem;
  private score!: ScoreSystem;
  private coins!: CoinSystem;
  private ground!: GroundSystem;
  private spawner!: SpawnSystem;
  private hud!: Hud;
  private announcer!: Announcer;
  /** Meters run in this run. */
  private distance = 0;
  private zone = 1;
  private coinCount = 0;
  private enemiesKilled = 0;
  private previousBest = 0;
  /** Hit: the death sequence is playing. */
  private dying = false;
  private ended = false;
  /** Hit-stop left (ms): everything holds still. */
  private freezeMs = 0;
  /** Game time per real time (slow motion while dying). */
  private timeScale = 1;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    this.params = parseRunParams(window.location.search, import.meta.env.DEV);
    if (import.meta.env.DEV) console.info(`[Vault Runner] seed ${this.params.seed} (replay with ?seed=${this.params.seed})`);

    const { character, bestScore } = saveSystem.data;
    this.distance = this.params.startM;
    this.coinCount = 0;
    this.enemiesKilled = 0;
    this.previousBest = bestScore;
    this.dying = false;
    this.ended = false;
    this.freezeMs = 0;
    this.timeScale = 1;
    // The physics world outlives a restart: undo a previous run's slow motion or hit-stop.
    this.physics.world.timeScale = 1;
    this.physics.world.resume();

    this.difficulty = new DifficultySystem();
    this.biomes = new BiomeSystem();
    this.score = new ScoreSystem(bestScore);
    const start = this.biomes.update(this.distance) as ZoneState;
    this.zone = start.zone;
    this.scenery = new ZoneScenery(this, start.zone);
    // World px = meters × pxPerMeter, so the ground tiles line up with the planned holes.
    const startX = this.distance * WORLD.pxPerMeter;
    this.scenery.scroll(startX);
    this.player = new Player(this, character, SCREEN.groundY);
    this.shooting = new ShootingSystem(this, character.weapon);
    this.coins = new CoinSystem(this);
    this.ground = new GroundSystem(this, this.scenery);
    this.spawner = new SpawnSystem(
      this,
      new Rng(this.params.seed),
      this.difficulty,
      startX,
      this.ground,
      this.coins,
      () => this.zone,
    );

    this.physics.add.overlap(this.player.sprite, this.coins.group, (_player, coin) => this.collect(coin as Coin));
    this.physics.add.overlap(this.player.sprite, this.spawner.dangerPools, () => this.hitPlayer());
    this.physics.add.overlap(this.shooting.group, this.spawner.enemyPools, (shot, enemy) =>
      this.shotHits(shot as Projectile, enemy as Enemy),
    );
    // Shots stop on obstacles without hurting them (spec §9).
    this.physics.add.overlap(this.shooting.group, this.spawner.obstacles, (shot) => (shot as Projectile).kill());

    this.hud = new Hud(this, bestScore, () => this.openPause());
    this.announcer = new Announcer(this);
    addTouchControls(this, this.inputSystem);

    this.announcer.zone(start.zone, start.lap);
    music.play(this.zoneTrack(start.zone));

    this.game.events.on(Phaser.Core.Events.BLUR, this.openPause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.openPause, this);
    this.game.events.on(PORTRAIT_EVENT, this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.openPause, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.openPause, this);
      this.game.events.off(PORTRAIT_EVENT, this.openPause, this);
    });
  }

  update(_time: number, rawDelta: number): void {
    const input = this.inputSystem;
    input.update();
    if (!this.dying && input.justPressed('pause')) return this.openPause();
    if (import.meta.env.DEV && input.justPressed('debug')) this.toggleHitboxes();

    // Hit-stop after a kill: hold everything still for a moment.
    if (this.freezeMs > 0) {
      this.freezeMs -= rawDelta;
      if (this.freezeMs > 0) return;
      this.physics.world.resume();
    }
    const delta = rawDelta * this.timeScale;

    this.player.update(delta, input, this.floorUnderPlayer());
    const { motor } = this.player;
    if (!motor.grounded && motor.feetY > SCREEN.groundY + PLAYER.holeDeathDepth) this.hitPlayer();

    if (!this.dying) {
      this.shooting.update(delta);
      // Holding the button keeps firing at the cooldown rate; a tap shorter than a frame still fires.
      if (input.isDown('shoot') || input.justPressed('shoot')) {
        const { x, y } = this.player.muzzlePoint;
        if (this.shooting.tryFire(x, y)) this.player.onShot();
      }
    }

    this.advanceWorld(delta);
    if (!this.dying) this.checkCloseDodges();
  }

  /** Moves the world at the current speed and reacts to distance: score, zones, music, spawns. */
  private advanceWorld(deltaMs: number): void {
    const speed = this.difficulty.speedAt(this.distance);
    const dx = (speed * deltaMs) / 1000;
    this.scenery.scroll(dx);
    // A hit freezes the run's distance and score; the world only coasts in slow motion.
    if (!this.dying) {
      const meters = dx / WORLD.pxPerMeter;
      this.distance += meters;
      this.score.addDistance(meters);
    }
    this.spawner.update({ deltaMs, scrolled: this.scenery.scrolled, speed, player: { bounds: this.player.bounds } });
    if (this.dying) return;

    const zone = this.biomes.update(this.distance);
    if (zone) {
      this.zone = zone.zone;
      this.scenery.changeTo(zone.zone);
      this.announcer.zone(zone.zone, zone.lap);
      music.play(this.zoneTrack(zone.zone), AUDIO.music.crossfadeMs);
    }
    const { fastRate, fastFromLevel } = AUDIO.music;
    music.setRate(this.difficulty.levelAt(this.distance) >= fastFromLevel ? fastRate : 1);

    this.refreshScore();
    this.hud.setDistance(Math.floor(this.distance));
  }

  /** Ground y under the player, or null over a hole. */
  private floorUnderPlayer(): number | null {
    if (this.params.god) return SCREEN.groundY;
    const { left, right } = this.player.bounds;
    const holes = this.ground.spans(this.scenery.scrolled);
    return hasFloor(left, right, holes, this.player.motor.grounded) ? SCREEN.groundY : null;
  }

  private collect(coin: Coin): void {
    if (!coin.active || this.dying) return;
    const { x, y } = coin;
    coin.kill();
    this.coinCount += 1;
    const points = this.score.award('coin');
    floatingText(this, x, y - coin.height, `+${points}`);
    const spark = this.add.sprite(x, y, 'fx_spark').setDepth(DEPTH.fx);
    spark.play(sparkAnim(this));
    spark.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => spark.destroy());
    this.refreshScore();
  }

  private shotHits(shot: Projectile, enemy: Enemy): void {
    if (!shot.active || !enemy.active || this.dying) return;
    shot.kill();
    if (!enemy.hit()) return;
    const { x, y } = enemy.getCenter();
    enemy.die();
    this.enemiesKilled += 1;
    const points = this.score.award(enemy.points);
    floatingText(this, x, y - enemy.height, `+${points}`);
    // Kill feedback (DISENO §10): light shake and a 40 ms hit-stop.
    this.cameras.main.shake(SHAKE.light.ms, SHAKE.light.intensity);
    this.freezeMs = TIMING.hitStop;
    this.physics.world.pause();
    this.refreshScore();
  }

  /** Close dodge (spec §10.3): an obstacle passed within a few px of the player gives points. */
  private checkCloseDodges(): void {
    const p = this.player.bounds;
    for (const obstacle of this.spawner.obstacles.getChildren() as Obstacle[]) {
      if (!obstacle.active || obstacle.dodgeChecked) continue;
      const body = obstacle.body as Phaser.Physics.Arcade.Body;
      if (body.right < p.left) {
        obstacle.dodgeChecked = true;
        // A negative gap was an overlap: a hit, not a dodge (only possible with ?god=1).
        if (obstacle.closestGap >= 0 && obstacle.closestGap <= SCORE.closeDodgePx) {
          const points = this.score.award('closeDodge');
          floatingText(this, p.centerX, p.top - SCREEN.tile / 2, `+${points}`);
          this.refreshScore();
        }
      } else if (body.x < p.right) {
        const gap = Math.max(body.y - p.bottom, p.top - body.bottom);
        obstacle.closestGap = Math.min(obstacle.closestGap, gap);
      }
    }
  }

  /** Touching an enemy, its bullet or an obstacle, or falling in a hole (spec §11.4). */
  private hitPlayer(): void {
    if (this.dying || this.ended || this.params.god) return;
    // Phase 5: the shield absorbs the hit here.
    this.dying = true;
    this.player.die();
    this.cameras.main.shake(SHAKE.heavy.ms, SHAKE.heavy.intensity);
    this.timeScale = TIMING.deathSlowMoScale;
    this.physics.world.timeScale = 1 / TIMING.deathSlowMoScale; // Arcade: larger = slower
    this.time.delayedCall(TIMING.deathSlowMo, () => this.endRun());
  }

  private refreshScore(): void {
    const score = this.score.score;
    this.hud.setScore(score);
    if (this.score.checkRecordBeaten()) {
      this.hud.markRecordBeaten();
      this.announcer.toast('¡RÉCORD SUPERADO!');
    }
    // Once beaten, the record line follows the score: this run is the record now.
    if (this.score.hasBeatenRecord) this.hud.setBest(score);
  }

  private zoneTrack(zone: number): string {
    return AUDIO.music.zones[zone - 1] ?? AUDIO.music.zones[0];
  }

  /** F1 in development builds: draws the Arcade bodies (player, shots, obstacles, enemies). */
  private toggleHitboxes(): void {
    const world = this.physics.world;
    // The first call creates the graphic, which also turns drawing on.
    if (!world.debugGraphic) world.createDebugGraphic().setDepth(DEPTH.overlay);
    else world.drawDebug = !world.drawDebug;
    world.debugGraphic.clear().setVisible(world.drawDebug);
  }

  private openPause(): void {
    // The death sequence is short and leads to GameOver: no pause menu over it.
    if (!this.scene.isActive() || this.dying) return;
    this.scene.pause();
    this.scene.launch(SceneKey.Pause);
  }

  /** The run is over: save the record (not for test runs) and show GameOver. */
  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const run = { score: this.score.score, distance: Math.floor(this.distance), enemies: this.enemiesKilled };
    let newRecord = false;
    if (!this.params.debug) {
      saveSystem.update((data) => {
        newRecord = applyRunResult(data, run);
      });
    }
    music.stop(AUDIO.music.endFadeMs);
    const data: GameOverData = { ...run, coins: this.coinCount, previousBest: this.previousBest, newRecord };
    fadeToScene(this, SceneKey.GameOver, data);
  }
}

const SPARK_ANIM = 'fx_spark_burst';

function sparkAnim(scene: Phaser.Scene): string {
  if (!scene.anims.exists(SPARK_ANIM)) {
    scene.anims.create({ key: SPARK_ANIM, frames: scene.anims.generateFrameNumbers('fx_spark'), frameRate: ANIM_FPS.spark });
  }
  return SPARK_ANIM;
}
