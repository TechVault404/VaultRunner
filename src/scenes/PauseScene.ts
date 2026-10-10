import Phaser from 'phaser';
import { GAME, LAYOUT, UI } from '../config';
import { InputSystem } from '../systems/InputSystem';
import { ButtonList } from '../ui/ButtonList';
import { addText } from '../ui/text';
import { TextButton } from '../ui/TextButton';
import { fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

/** Overlay launched on top of the paused Game scene. */
export class PauseScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;

  constructor() {
    super(SceneKey.Pause);
  }

  create(): void {
    this.inputSystem = new InputSystem(this);
    const { width, height } = GAME;
    const centerX = width / 2;
    const layout = LAYOUT.pause;

    this.add.rectangle(0, 0, width, height, UI.pauseOverlayColor, UI.pauseOverlayAlpha).setOrigin(0);
    addText(this, centerX, layout.titleY, 'PAUSA', { size: UI.fontSizeTitle, color: UI.titleColor });

    this.buttons = new ButtonList(this.inputSystem, [
      new TextButton(this, centerX, layout.buttonsY, 'Continuar', () => this.resumeGame()),
      new TextButton(this, centerX, layout.buttonsY + UI.buttonSpacing, 'Reiniciar', () =>
        this.leaveTo(SceneKey.Game),
      ),
      new TextButton(this, centerX, layout.buttonsY + UI.buttonSpacing * 2, 'Menú', () =>
        this.leaveTo(SceneKey.Menu),
      ),
    ]);
  }

  update(): void {
    this.inputSystem.update();
    if (this.inputSystem.justPressed('pause')) {
      this.resumeGame();
      return;
    }
    this.buttons.update();
  }

  private resumeGame(): void {
    this.scene.resume(SceneKey.Game);
    this.scene.stop();
  }

  /** Resumes Game so its camera can fade out, then switches scene from there. */
  private leaveTo(key: string): void {
    const game = this.scene.get(SceneKey.Game);
    this.resumeGame();
    fadeToScene(game, key);
  }
}
