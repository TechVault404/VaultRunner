import Phaser from 'phaser';
import { Backdrop } from '../entities/Backdrop';
import { CharacterSprite } from '../entities/CharacterSprite';
import { AUDIO } from '../config';
import { music } from '../systems/AudioSystem';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { COLOR, fmtNumber, LAYOUT, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { ButtonList } from '../ui/ButtonList';
import { addOverlay, addPanel } from '../ui/panels';
import { pixelText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

/** Reference: screens/01_menu.png */
export class MenuScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;
  private backdrop!: Backdrop;

  constructor() {
    super(SceneKey.Menu);
  }

  create(): void {
    fadeIn(this);
    music.play(AUDIO.music.menu);
    this.inputSystem = new InputSystem(this);
    const layout = LAYOUT.menu;
    const save = saveSystem.data;

    this.backdrop = new Backdrop(this, 1);
    addOverlay(this, UI.overlay.menu);

    const logo = this.add.image(0, layout.logo.y, 'logo').setOrigin(0);
    logo.x = Math.round(SCREEN.cx - logo.width / 2);

    new CharacterSprite(this, layout.character.x, SCREEN.groundY, save.character, layout.character.scale).play('run');
    if (save.character.name) pixelText(this, layout.name.x, layout.name.y, save.character.name, { align: 'center' });

    const { panel, labelY, valueY } = layout.record;
    addPanel(this, panel);
    pixelText(this, SCREEN.cx, labelY, 'RÉCORD', { color: COLOR.textMuted, align: 'center' });
    pixelText(this, SCREEN.cx, valueY, fmtNumber(save.bestScore), { color: COLOR.record, align: 'center' });

    const play = new Button(this, layout.play, {
      label: 'JUGAR',
      icon: 'play',
      onClick: () => fadeToScene(this, SceneKey.Game),
    });
    const character = new Button(this, layout.characterButton, {
      label: 'PERSONAJE',
      onClick: () => fadeToScene(this, SceneKey.CharacterEditor),
    });
    this.buttons = new ButtonList(this.inputSystem, [play, character, ...this.createSettingsButtons()]);
  }

  update(_time: number, delta: number): void {
    this.inputSystem.update();
    this.buttons.update();
    this.backdrop.scroll((LAYOUT.menu.scrollSpeed * delta) / 1000);
  }

  /** Music, sound and fullscreen icon buttons, top-right (DISENO §7.3). */
  private createSettingsButtons(): Button[] {
    const { x, y, step, size } = LAYOUT.menu.settings;
    const at = (i: number) => ({ x: x + i * step, y, w: size, h: size });
    const settings = () => saveSystem.data.settings;

    const musicButton: Button = new Button(this, at(0), {
      icon: settings().music ? 'music_on' : 'music_off',
      onClick: () => {
        saveSystem.update((data) => void (data.settings.music = !data.settings.music));
        musicButton.setIcon(settings().music ? 'music_on' : 'music_off');
        music.refresh();
      },
    });
    const sound: Button = new Button(this, at(1), {
      icon: settings().sfx ? 'sound_on' : 'sound_off',
      onClick: () => {
        saveSystem.update((data) => void (data.settings.sfx = !data.settings.sfx));
        sound.setIcon(settings().sfx ? 'sound_on' : 'sound_off');
      },
    });
    const fullscreen = new Button(this, at(2), { icon: 'fullscreen', onClick: () => this.scale.toggleFullscreen() });
    return [musicButton, sound, fullscreen];
  }
}
