import Phaser from 'phaser';
import { PLAYER } from '../config';
import { Backdrop } from '../entities/Backdrop';
import { CharacterSprite } from '../entities/CharacterSprite';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { DEPTH, LAYOUT, SCREEN } from '../theme';
import { Button } from '../ui/Button';
import { Hud } from '../ui/Hud';
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

/** Main gameplay scene; orchestrates the systems. Static scenery in Phase 0 (movement arrives in Phase 2). */
export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);

    new Backdrop(this, 1, { useDepth: true });
    new CharacterSprite(this, PLAYER.x, SCREEN.groundY, saveSystem.data.character).setDepth(DEPTH.player).play('run');
    new Hud(this, saveSystem.data.bestScore, () => this.openPause());

    // Temporary until death exists (Phase 4): lets us reach GameOver. Development builds only.
    if (import.meta.env.DEV) {
      new Button(this, LAYOUT.game.debugEnd, { label: 'FIN (DEBUG)', onClick: () => this.endRun() }).setDepth(
        DEPTH.hud,
      );
    }

    this.game.events.on(Phaser.Core.Events.BLUR, this.openPause, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.openPause, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.game.events.off(Phaser.Core.Events.BLUR, this.openPause, this);
      this.game.events.off(Phaser.Core.Events.HIDDEN, this.openPause, this);
    });
  }

  update(): void {
    this.inputSystem.update();
    if (this.inputSystem.justPressed('pause')) this.openPause();
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
