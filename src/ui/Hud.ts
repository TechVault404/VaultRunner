import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { COLOR, DEPTH, fmtDistance, fmtScoreHud, HUD } from '../theme';
import { pixelText, type PixelText } from './text';
import { setTouchArea } from './touch';

const PAUSE_KEY = 'touch_pause';

/** In-game HUD (DISENO §8). Powerups, banners and toasts arrive in later phases. */
export class Hud {
  private readonly score: PixelText;
  private readonly distance: PixelText;

  constructor(scene: Phaser.Scene, bestScore: number, onPause: () => void) {
    this.score = pixelText(scene, HUD.score.x, HUD.score.y, '').setDepth(DEPTH.hud);
    pixelText(scene, HUD.best.x, HUD.best.y, `RÉCORD ${fmtScoreHud(bestScore)}`, {
      color: COLOR.textMuted,
    }).setDepth(DEPTH.hud);
    this.distance = pixelText(scene, HUD.distance.x, HUD.distance.y, '', { color: COLOR.accent }).setDepth(DEPTH.hud);
    this.setScore(0).setDistance(0);

    const normal = frameIndex(scene, PAUSE_KEY, 'normal');
    const pressed = frameIndex(scene, PAUSE_KEY, 'pressed');
    const { x, y, size } = HUD.pause;
    const pause = scene.add
      .image(x, y, PAUSE_KEY, normal)
      .setOrigin(0)
      .setDisplaySize(size, size)
      .setDepth(DEPTH.hud);
    setTouchArea(pause);
    pause.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => pause.setFrame(pressed));
    pause.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => pause.setFrame(normal));
    pause.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
      pause.setFrame(normal);
      onPause();
    });
  }

  setScore(score: number): this {
    this.score.setText(fmtScoreHud(score));
    return this;
  }

  setDistance(meters: number): this {
    this.distance.setText(fmtDistance(meters));
    return this;
  }
}
