import Phaser from 'phaser';
import { Backdrop } from '../entities/Backdrop';
import { CharacterSprite } from '../entities/CharacterSprite';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { COLOR, LAYOUT, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { ButtonList } from '../ui/ButtonList';
import { addOverlay, addPanel } from '../ui/panels';
import { pixelText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

/** Reference: screens/02_editor.png — only the frame and preview for now; the editor arrives in Phase 1. */
export class CharacterEditorScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;

  constructor() {
    super(SceneKey.CharacterEditor);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    const layout = LAYOUT.editor;

    new Backdrop(this, 4, { layers: ['far'], ground: false });
    addOverlay(this, UI.overlay.editor);
    pixelText(this, SCREEN.cx, layout.title.y, 'TU PERSONAJE', { align: 'center' });

    const { panel, x, feetY, scale } = layout.preview;
    addPanel(this, panel);
    new CharacterSprite(this, x, feetY, saveSystem.data.character, scale).play('run');
    pixelText(this, SCREEN.cx, layout.note.y, 'EDITOR: FASE 1', {
      color: COLOR.textDisabled,
      shadow: null,
      align: 'center',
    });

    const back = new Button(this, layout.back, { label: 'MENÚ', icon: 'home', onClick: () => this.back() });
    this.buttons = new ButtonList(this.inputSystem, [back]);
  }

  update(): void {
    this.inputSystem.update();
    this.buttons.update();
    if (this.inputSystem.justPressed('uiBack')) this.back();
  }

  private back(): void {
    fadeToScene(this, SceneKey.Menu);
  }
}
