import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { COLOR, FONT, LAYOUT } from '../theme';
import { pixelText } from '../ui/text';
import { SceneKey } from './keys';

/**
 * "Gira tu teléfono" (DISENO §9, screens/10_gira_telefono.png), drawn on the portrait canvas.
 * While it runs it keeps every other scene paused and swallows input; when it stops
 * (OrientationGuard, back to landscape) it resumes exactly the scenes it paused.
 */
export class RotateScene extends Phaser.Scene {
  private readonly pausedByMe = new Set<string>();

  constructor() {
    super(SceneKey.Rotate);
  }

  create(): void {
    const layout = LAYOUT.rotate;
    const { w, h, cx } = layout.size;
    this.pausedByMe.clear();

    // Opaque background that also blocks pointers from reaching the scenes below.
    this.add.rectangle(0, 0, w, h, COLOR.bg).setOrigin(0).setInteractive();
    const sky = this.textures.getFrame('zona1_bg_far');
    this.add
      .tileSprite(0, layout.sky.bottom - sky.height, w, sky.height, 'zona1_bg_far')
      .setOrigin(0)
      .setTilePosition(layout.sky.scrollX, 0);

    const logo = this.add.image(0, layout.logo.y, 'logo').setOrigin(0);
    logo.x = Math.round(cx - logo.width / 2);

    const rect = (box: { x: number; y: number; w: number; h: number }, color: number) =>
      this.add.rectangle(box.x, box.y, box.w, box.h, color).setOrigin(0);
    rect(layout.phone, COLOR.textSecondary);
    rect(layout.phoneScreen, COLOR.surface);
    rect(layout.phoneButton, COLOR.textMuted);
    this.add.image(layout.icon.x, layout.icon.y, 'icons', frameIndex(this, 'icons', 'retry')).setOrigin(0);

    const { title, subtitle } = layout;
    pixelText(this, cx, title.y, 'GIRA TU', { scale: FONT.scale.title, align: 'center' });
    pixelText(this, cx, title.y + title.step, 'TELÉFONO', { scale: FONT.scale.title, align: 'center' });
    pixelText(this, cx, subtitle.y, 'VAULT RUNNER SE JUEGA', { color: COLOR.textMuted, align: 'center' });
    pixelText(this, cx, subtitle.y + subtitle.step, 'EN HORIZONTAL', { color: COLOR.textMuted, align: 'center' });

    this.scene.bringToTop();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.resumeOthers, this);
  }

  /** Checked every frame so scenes started or launched meanwhile (e.g. Pause) are caught too. */
  update(): void {
    for (const scene of this.scene.manager.getScenes(true)) {
      const key = scene.sys.settings.key;
      if (key === SceneKey.Rotate) continue;
      scene.scene.pause();
      this.pausedByMe.add(key);
    }
  }

  private resumeOthers(): void {
    for (const key of this.pausedByMe) this.scene.resume(key);
    this.pausedByMe.clear();
  }
}
