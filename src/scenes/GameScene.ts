import Phaser from 'phaser';
import { WORLD } from '../config';
import { Backdrop } from '../entities/Backdrop';
import { Player } from '../entities/Player';
import { InputSystem } from '../systems/InputSystem';
import { PORTRAIT_EVENT } from '../systems/OrientationGuard';
import { saveSystem } from '../systems/SaveSystem';
import { ShootingSystem } from '../systems/ShootingSystem';
import { DEPTH, LAYOUT, SCREEN } from '../theme';
import { Button } from '../ui/Button';
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
 * Main gameplay scene; orchestrates the systems. Phase 2: the player runs over an endless
 * test floor at a fixed speed and can jump, crouch and shoot.
 */
export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private backdrop!: Backdrop;
  private player!: Player;
  private shooting!: ShootingSystem;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);

    const character = saveSystem.data.character;
    this.backdrop = new Backdrop(this, 1, { useDepth: true });
    this.player = new Player(this, character, SCREEN.groundY);
    this.shooting = new ShootingSystem(this, character.weapon);
    new Hud(this, saveSystem.data.bestScore, () => this.openPause());
    addTouchControls(this, this.inputSystem);

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

    this.backdrop.scroll((WORLD.speed * delta) / 1000);
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

  private endRun(): void {
    const best = saveSystem.data.bestScore;
    const data: GameOverData = { score: 0, distance: 0, enemies: 0, coins: 0, previousBest: best, newRecord: false };
    fadeToScene(this, SceneKey.GameOver, data);
  }
}
