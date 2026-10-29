import Phaser from 'phaser';
import { AUDIO } from '../config';
import { music, playSfx } from '../systems/AudioSystem';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { stepVolume } from '../systems/volume';
import { COLOR, LAYOUT, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { addOverlay, addPanel } from '../ui/panels';
import { pixelText, type PixelText } from '../ui/text';
import { SceneKey } from './keys';

export interface VolumeSceneData {
  /** Scene underneath (Menu or Pause): paused while the panel is open, resumed on close. */
  parent: string;
}

/**
 * Music volume panel over the menu or the pause overlay: − / + in steps, a block bar and the
 * percentage. The change is heard and saved right away; 0 % turns the music off. Keyboard:
 * ← → change the volume, Enter or Esc close. While it is open over the pause, the music plays
 * at its real level instead of the paused 30 %, so you hear what you pick.
 */
export class VolumeScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private parent = '';
  private wasDucked = false;
  private blocks: Phaser.GameObjects.Rectangle[] = [];
  private value!: PixelText;
  private hint!: PixelText;
  private done!: Button;

  constructor() {
    super(SceneKey.Volume);
  }

  init(data: VolumeSceneData): void {
    this.parent = data.parent;
  }

  create(): void {
    this.inputSystem = new InputSystem(this);
    const layout = LAYOUT.volume;
    this.wasDucked = music.isDucked;
    music.setDucked(false);

    addOverlay(this, UI.overlay.volume);
    addPanel(this, layout.panel);
    pixelText(this, SCREEN.cx, layout.title.y, 'MÚSICA', { color: COLOR.textMuted, align: 'center' });

    new Button(this, layout.minus, { label: '-', sound: 'ui_change', onClick: () => this.change(-1) });
    new Button(this, layout.plus, { label: '+', sound: 'ui_change', onClick: () => this.change(1) });
    const { x, y, w, h, step } = layout.bar;
    const count = 100 / AUDIO.music.volumeStep;
    this.blocks = Array.from({ length: count }, (_, i) => this.add.rectangle(x + i * step, y, w, h).setOrigin(0));
    this.value = pixelText(this, SCREEN.cx, layout.value.y, '', { color: COLOR.accent, align: 'center' });
    this.done = new Button(this, layout.done, { label: 'LISTO', onClick: () => this.close() }).setFocused(true);
    this.hint = pixelText(this, SCREEN.cx, layout.hint.y, '← → VOLUMEN   ENTER LISTO', {
      color: COLOR.textDisabled,
      shadow: null,
      align: 'center',
    });
    this.refresh();
  }

  update(): void {
    const input = this.inputSystem;
    input.update();
    // Keyboard hints only make sense with a keyboard or pad (spec §3).
    this.hint.setVisible(input.lastDevice !== 'touch');
    if (input.justPressed('uiLeft')) this.change(-1, true);
    if (input.justPressed('uiRight')) this.change(1, true);
    if (input.justPressed('uiConfirm')) this.done.activate();
    else if (input.justPressed('uiBack')) this.close();
  }

  /** One step down (−1) or up (1). Buttons play their own sound; the keyboard asks for it. */
  private change(dir: -1 | 1, withSound = false): void {
    const current = saveSystem.data.settings.musicVolume;
    const next = stepVolume(current, dir);
    if (next === current) return;
    saveSystem.update((data) => void (data.settings.musicVolume = next));
    music.refresh();
    if (withSound) playSfx(this, 'ui_change');
    this.refresh();
  }

  private refresh(): void {
    const percent = saveSystem.data.settings.musicVolume;
    const filled = percent / AUDIO.music.volumeStep;
    this.blocks.forEach((block, i) => block.setFillStyle(i < filled ? COLOR.accent : COLOR.surfaceRaised));
    this.value.setText(percent === 0 ? 'APAGADA' : `${percent}%`);
  }

  private close(): void {
    music.setDucked(this.wasDucked);
    this.scene.resume(this.parent);
    this.scene.stop();
  }
}

/** Opens the volume panel over `scene` (Menu or Pause), which waits paused underneath. */
export function openVolume(scene: Phaser.Scene): void {
  const data: VolumeSceneData = { parent: scene.scene.key };
  scene.scene.launch(SceneKey.Volume, data);
  scene.scene.pause();
}
