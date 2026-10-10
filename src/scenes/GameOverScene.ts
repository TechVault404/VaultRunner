import Phaser from 'phaser';
import { GAME, LAYOUT, UI } from '../config';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { ButtonList } from '../ui/ButtonList';
import { addText } from '../ui/text';
import { TextButton } from '../ui/TextButton';
import { fadeIn, fadeToScene } from '../ui/transitions';
import type { GameOverData } from './GameScene';
import { SceneKey } from './keys';

export class GameOverScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;
  private result: GameOverData = { score: 0, distance: 0 };

  constructor() {
    super(SceneKey.GameOver);
  }

  init(data: Partial<GameOverData>): void {
    this.result = { score: data.score ?? 0, distance: data.distance ?? 0 };
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    const centerX = GAME.width / 2;
    const layout = LAYOUT.gameOver;

    addText(this, centerX, layout.titleY, 'FIN DE LA PARTIDA', { size: UI.fontSizeTitle, color: UI.titleColor });
    const lines = [
      `Puntaje: ${this.result.score}`,
      `Distancia: ${this.result.distance} m`,
      `Récord: ${saveSystem.data.bestScore}`,
    ];
    lines.forEach((line, i) => addText(this, centerX, layout.statsY + layout.statsSpacing * i, line));

    this.buttons = new ButtonList(this.inputSystem, [
      new TextButton(this, centerX, layout.buttonsY, 'Reintentar', () => fadeToScene(this, SceneKey.Game)),
      new TextButton(this, centerX, layout.buttonsY + UI.buttonSpacing, 'Menú', () =>
        fadeToScene(this, SceneKey.Menu),
      ),
    ]);
  }

  update(): void {
    this.inputSystem.update();
    this.buttons.update();
  }
}
