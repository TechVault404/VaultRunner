import Phaser from 'phaser';
import { frameIndex } from '../assets';
import { POWERUP_KINDS, POWERUPS } from '../config';
import { POWERUPS_KEY } from '../entities/PowerUp';
import type { ActivePowerUp } from '../systems/PowerUpSystem';
import { COLOR, DEPTH, fmtDistance, fmtScoreHud, HUD } from '../theme';
import { pixelText, type PixelText } from './text';
import { setTouchArea } from './touch';

const PAUSE_KEY = 'touch_pause';

/** One powerup box of the HUD: black box, icon and time bar. */
interface PowerUpSlot {
  box: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  bar: Phaser.GameObjects.Rectangle;
}

/** In-game HUD (DISENO §8). Banners and notices live in Announcer. */
export class Hud {
  private readonly score: PixelText;
  private readonly best: PixelText;
  private readonly distance: PixelText;
  /** One per powerup kind at most; hidden while unused. */
  private readonly slots: PowerUpSlot[];
  private readonly multiplier: PixelText;

  constructor(
    private readonly scene: Phaser.Scene,
    bestScore: number,
    onPause: () => void,
  ) {
    this.score = pixelText(scene, HUD.score.x, HUD.score.y, '').setDepth(DEPTH.hud);
    this.best = pixelText(scene, HUD.best.x, HUD.best.y, '', { color: COLOR.textMuted }).setDepth(DEPTH.hud);
    this.setBest(bestScore);
    this.distance = pixelText(scene, HUD.distance.x, HUD.distance.y, '', { color: COLOR.accent }).setDepth(DEPTH.hud);
    this.setScore(0).setDistance(0);
    this.slots = POWERUP_KINDS.map(() => this.createSlot());
    this.multiplier = pixelText(scene, 0, 0, `×${POWERUPS.x2.multiplier}`, { color: COLOR.points })
      .setDepth(DEPTH.hud)
      .setVisible(false);

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

  setBest(best: number): this {
    this.best.setText(`RÉCORD ${fmtScoreHud(best)}`);
    return this;
  }

  /** The run passed the record: the line turns amber and blinks (DISENO §8). */
  markRecordBeaten(): void {
    this.best.setColor(COLOR.record);
    const { times, hz } = HUD.recordBlink;
    this.scene.time.addEvent({
      delay: 1000 / hz / 2,
      repeat: times * 2 - 1,
      callback: () => this.best.setVisible(!this.best.visible),
    });
  }

  setDistance(meters: number): this {
    this.distance.setText(fmtDistance(meters));
    return this;
  }

  /**
   * Active powerups (DISENO §8): a box per powerup in pickup order, growing to the left (the
   * newest is leftmost), with its time bar; the bar turns `danger` under 25 % and the icon
   * blinks at 4 Hz in the last 2 s. "×2" under the Puntos ×2 box.
   */
  setPowerUps(active: readonly ActivePowerUp[]): void {
    const { x, y, step, icon, bar, lowFraction, blinkLastMs, blinkHz, box, multiplierDy } = HUD.powerups;
    this.multiplier.setVisible(false);
    this.slots.forEach((slot, i) => {
      const powerUp = active[i];
      const shown = powerUp !== undefined;
      slot.box.setVisible(shown);
      slot.bar.setVisible(shown);
      slot.icon.setVisible(shown);
      if (!powerUp) return;
      const left = x - i * step;
      const fraction = Math.max(0, powerUp.leftMs / powerUp.totalMs);
      slot.box.setPosition(left, y);
      slot.icon.setPosition(left + icon.dx, y + icon.dy).setFrame(POWERUP_KINDS.indexOf(powerUp.kind));
      slot.bar
        .setPosition(left + bar.dx, y + bar.dy)
        .setSize(Math.ceil(bar.w * fraction), bar.h)
        .setFillStyle(fraction < lowFraction ? COLOR.danger : COLOR.accent);
      if (powerUp.leftMs <= blinkLastMs) {
        slot.icon.setVisible(Math.floor((powerUp.leftMs * blinkHz * 2) / 1000) % 2 === 0);
      }
      if (powerUp.kind === 'x2') {
        const centered = left + Math.floor((box.w - this.multiplier.measure()) / 2);
        this.multiplier.setPosition(centered, y + multiplierDy).setVisible(true);
      }
    });
  }

  private createSlot(): PowerUpSlot {
    const { box, bar } = HUD.powerups;
    const rect = (w: number, h: number, color: number, alpha = 1) =>
      this.scene.add.rectangle(0, 0, w, h, color, alpha).setOrigin(0).setDepth(DEPTH.hud).setVisible(false);
    return {
      box: rect(box.w, box.h, COLOR.outline, box.alpha),
      icon: this.scene.add.image(0, 0, POWERUPS_KEY).setOrigin(0).setDepth(DEPTH.hud).setVisible(false),
      bar: rect(bar.w, bar.h, COLOR.accent),
    };
  }
}
