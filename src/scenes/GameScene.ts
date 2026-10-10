import Phaser from 'phaser';
import { GAME, LAYOUT, PLACEHOLDERS, PLAYER, UI } from '../config';
import { InputSystem } from '../systems/InputSystem';
import { addText } from '../ui/text';
import { TextButton } from '../ui/TextButton';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

export interface GameOverData {
  score: number;
  distance: number;
}

/** Main gameplay scene; orchestrates the systems. Placeholder content in Phase 0. */
export class GameScene extends Phaser.Scene {
  private inputSystem!: InputSystem;

  constructor() {
    super(SceneKey.Game);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);

    const { tileSize, groundY, width } = GAME;
    this.add.tileSprite(0, groundY, width, tileSize, PLACEHOLDERS.groundTop.key).setOrigin(0);
    this.add.tileSprite(0, groundY + tileSize, width, tileSize, PLACEHOLDERS.groundFill.key).setOrigin(0);
    this.add.image(PLAYER.x, groundY, PLACEHOLDERS.player.key).setOrigin(0.5, 1);

    const { infoY } = LAYOUT.game;
    addText(this, UI.margin, infoY, 'Fase 0', { color: UI.mutedColor, originX: 0 });
    new TextButton(this, width - UI.margin * 2, infoY, 'II', () => this.openPause());
    // Temporary until death exists (Phase 4): lets us reach GameOver.
    new TextButton(this, width / 2, infoY, '[debug] Terminar', () => this.endRun());

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
    const data: GameOverData = { score: 0, distance: 0 };
    fadeToScene(this, SceneKey.GameOver, data);
  }
}
