import Phaser from 'phaser';
import { GAME, LAYOUT, UI } from '../config';
import { InputSystem } from '../systems/InputSystem';
import { ButtonList } from '../ui/ButtonList';
import { addText } from '../ui/text';
import { TextButton } from '../ui/TextButton';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

/** Character editor — implemented in Phase 1. */
export class CharacterEditorScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;

  constructor() {
    super(SceneKey.CharacterEditor);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    const centerX = GAME.width / 2;
    const layout = LAYOUT.characterEditor;

    addText(this, centerX, layout.titleY, 'PERSONAJE', { size: UI.fontSizeTitle, color: UI.titleColor });
    addText(this, centerX, layout.noteY, '(Editor: Fase 1)', { color: UI.mutedColor });

    const back = () => fadeToScene(this, SceneKey.Menu);
    this.buttons = new ButtonList(this.inputSystem, [new TextButton(this, centerX, layout.backY, 'Volver', back)]);
  }

  update(): void {
    this.inputSystem.update();
    this.buttons.update();
    if (this.inputSystem.justPressed('uiBack')) fadeToScene(this, SceneKey.Menu);
  }
}
