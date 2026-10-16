import Phaser from 'phaser';
import { AUDIO, WORLD } from '../config';
import type { Coin } from '../entities/Coin';
import { Player } from '../entities/Player';
import { ZoneScenery } from '../entities/ZoneScenery';
import { music } from '../systems/AudioSystem';
import { BiomeSystem, type ZoneState } from '../systems/BiomeSystem';
import { CoinSystem } from '../systems/CoinSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { InputSystem } from '../systems/InputSystem';
import { PORTRAIT_EVENT } from '../systems/OrientationGuard';
import { saveSystem } from '../systems/SaveSystem';
import { applyRunResult, ScoreSystem } from '../systems/ScoreSystem';
import { ShootingSystem } from '../systems/ShootingSystem';
import { ANIM_FPS, DEPTH, LAYOUT, SCREEN } from '../theme';
import { Announcer } from '../ui/Announcer';
import { Button } from '../ui/Button';
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
 * zones, music and scenery change along the way, and the score keeps the personal record.
 */
export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private player!: Player;
  private shooting!: ShootingSystem;
  private scenery!: ZoneScenery;
  private difficulty!: DifficultySystem;
  private biomes!: BiomeSystem;
  private score!: ScoreSystem;
  private coins!: CoinSystem;
  private hud!: Hud;
  private announcer!: Announcer;
  /** Meters run in this run. */
  private distance = 0;
  private coinCount = 0;
  private previousBest = 0;
  private ended = false;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);

    const { character, bestScore } = saveSystem.data;
    this.distance = 0;
    this.coinCount = 0;
    this.previousBest = bestScore;
    this.ended = false;

    this.difficulty = new DifficultySystem();
    this.biomes = new BiomeSystem();
    this.score = new ScoreSystem(bestScore);
    const start = this.biomes.update(this.distance) as ZoneState;
    this.scenery = new ZoneScenery(this, start.zone);
    this.player = new Player(this, character, SCREEN.groundY);
    this.shooting = new ShootingSystem(this, character.weapon);
    this.coins = new CoinSystem(this, this.distance);
    this.physics.add.overlap(this.player.sprite, this.coins.group, (_player, coin) => this.collect(coin as Coin));
    this.hud = new Hud(this, bestScore, () => this.openPause());
    this.announcer = new Announcer(this);
    addTouchControls(this, this.inputSystem);

    this.announcer.zone(start.zone, start.lap);
    music.play(this.zoneTrack(start.zone));

    // Temporary until death exists (Phase 4): lets us reach GameOver. Development builds only.
    if (import.meta.env.DEV) {
      new Button(this, LAYOUT.game.debugEnd, { label: 'FIN (DEBUG)', onClick: () => this.endRun() }).setDepth(
        DEPTH.hud,
      );
    }

    this.game.events.on(Phaser.Core.Events.BLUR, this.openPause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.openPause, this);
    this.game.events.on(PORTRAIT_EVENT, this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.openPause, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.openPause, this);
      this.game.events.off(PORTRAIT_EVENT, this.openPause, this);
    });
  }

  update(_time: number, delta: number): void {
    const input = this.inputSystem;
    input.update();
    if (input.justPressed('pause')) return this.openPause();
    if (import.meta.env.DEV && input.justPressed('debug')) this.toggleHitboxes();

    // Endless flat test floor until holes arrive (Phase 4).
    this.player.update(delta, input, SCREEN.groundY);

    this.shooting.update(delta);
    // Holding the button keeps firing at the cooldown rate; a tap shorter than a frame still fires.
    if (input.isDown('shoot') || input.justPressed('shoot')) {
      const { x, y } = this.player.muzzlePoint;
      if (this.shooting.tryFire(x, y)) this.player.onShot();
    }

    this.advanceWorld(delta);
  }

  /** Moves the world at the current speed and reacts to distance: score, zones, music, coins. */
  private advanceWorld(deltaMs: number): void {
    const speed = this.difficulty.speedAt(this.distance);
    const dx = (speed * deltaMs) / 1000;
    const meters = dx / WORLD.pxPerMeter;
    this.distance += meters;
    this.score.addDistance(meters);
    this.scenery.scroll(dx);
    this.coins.update(dx, this.distance);

    const zone = this.biomes.update(this.distance);
    if (zone) {
      this.scenery.changeTo(zone.zone);
      this.announcer.zone(zone.zone, zone.lap);
      music.play(this.zoneTrack(zone.zone), AUDIO.music.crossfadeMs);
    }
    const { fastRate, fastFromLevel } = AUDIO.music;
    music.setRate(this.difficulty.levelAt(this.distance) >= fastFromLevel ? fastRate : 1);

    this.refreshScore();
    this.hud.setDistance(Math.floor(this.distance));
  }

  private collect(coin: Coin): void {
    if (!coin.active) return;
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

  /** F1 in development builds: draws the Arcade bodies (player hitbox, projectiles). */
  private toggleHitboxes(): void {
    const world = this.physics.world;
    // The first call creates the graphic, which also turns drawing on.
    if (!world.debugGraphic) world.createDebugGraphic().setDepth(DEPTH.overlay);
    else world.drawDebug = !world.drawDebug;
    world.debugGraphic.clear().setVisible(world.drawDebug);
  }

  private openPause(): void {
    if (!this.scene.isActive()) return;
    this.scene.pause();
    this.scene.launch(SceneKey.Pause);
  }

  /** The run is over (death in Phase 4; FIN (DEBUG) for now): save the record and show GameOver. */
  private endRun(): void {
    if (this.ended) return;
    this.ended = true;
    const run = { score: this.score.score, distance: Math.floor(this.distance), enemies: 0 };
    let newRecord = false;
    saveSystem.update((data) => {
      newRecord = applyRunResult(data, run);
    });
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
