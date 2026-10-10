import Phaser from 'phaser';
import { GAME, LAYOUT, PLACEHOLDERS, UI } from '../config';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { ButtonList } from '../ui/ButtonList';
import { addText } from '../ui/text';
import { TextButton } from '../ui/TextButton';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

export class MenuScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;

  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    const centerX = GAME.width / 2;
    const layout = LAYOUT.menu;

    addText(this, centerX, layout.titleY, 'VAULT RUNNER', { size: UI.fontSizeTitle, color: UI.titleColor });
    addText(this, centerX, layout.recordY, `Récord: ${saveSystem.data.bestScore}`, { color: UI.mutedColor });

    // Character preview placeholder (animated preview arrives in Phase 1).
    this.add.image(centerX, layout.previewY, PLACEHOLDERS.player.key);

    const startY = layout.buttonsY;
    const soundButton = new TextButton(this, centerX, startY + UI.buttonSpacing * 2, '', () => {
      const enabled = !this.isSoundOn();
      saveSystem.update((data) => {
        data.settings.music = enabled;
        data.settings.sfx = enabled;
      });
      soundButton.setLabel(this.soundLabel());
    });
    soundButton.setLabel(this.soundLabel());

    this.buttons = new ButtonList(this.inputSystem, [
      new TextButton(this, centerX, startY, 'Jugar', () => fadeToScene(this, SceneKey.Game)),
      new TextButton(this, centerX, startY + UI.buttonSpacing, 'Personaje', () =>
        fadeToScene(this, SceneKey.CharacterEditor),
      ),
      soundButton,
    ]);
  }

  update(): void {
    this.inputSystem.update();
    this.buttons.update();
  }

  private isSoundOn(): boolean {
    const { music, sfx } = saveSystem.data.settings;
    return music && sfx;
  }

  private soundLabel(): string {
    return `Sonido: ${this.isSoundOn() ? 'Sí' : 'No'}`;
  }
}
