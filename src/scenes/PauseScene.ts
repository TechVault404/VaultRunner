import Phaser from 'phaser';
import { music } from '../systems/AudioSystem';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { FONT, LAYOUT, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { ButtonList } from '../ui/ButtonList';
import { addOverlay, addPanel } from '../ui/panels';
import { pixelText } from '../ui/text';
import { fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';
import { openVolume } from './VolumeScene';

/** Overlay over the frozen Game scene. Reference: screens/07_pausa.png */
export class PauseScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;

  constructor() {
    super(SceneKey.Pause);
  }

  create(): void {
    this.inputSystem = new InputSystem(this);
    music.setDucked(true);
    const layout = LAYOUT.pause;

    addOverlay(this, UI.overlay.pause);
    addPanel(this, layout.panel);
    pixelText(this, SCREEN.cx, layout.title.y, 'PAUSA', { scale: FONT.scale.title, align: 'center' });

    const { x, y, w, h, step } = layout.buttons;
    const at = (i: number) => ({ x, y: y + i * step, w, h });
    const musicIcon = () => (saveSystem.data.settings.musicVolume > 0 ? 'music_on' : 'music_off');
    this.buttons = new ButtonList(this.inputSystem, [
      new Button(this, at(0), { label: 'CONTINUAR', icon: 'play', onClick: () => this.resumeGame() }),
      new Button(this, at(1), { label: 'REINICIAR', icon: 'retry', onClick: () => this.leaveTo(SceneKey.Game) }),
      new Button(this, at(2), { label: 'MÚSICA', icon: musicIcon(), onClick: () => openVolume(this) }),
      new Button(this, at(3), { label: 'MENÚ', icon: 'home', onClick: () => this.leaveTo(SceneKey.Menu) }),
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
    music.setDucked(false);
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
