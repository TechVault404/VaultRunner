import Phaser from 'phaser';
import { COLOR, DEPTH, HUD, SCREEN, TIMING, UI, ZONE_COLORS } from '../theme';
import { PixelText } from './text';

interface Message {
  kind: 'banner' | 'toast';
  build: () => Phaser.GameObjects.Container;
  holdMs: number;
}

/**
 * Temporary in-game messages (DISENO §7.8): the zone banner and short notices such as
 * "¡RÉCORD SUPERADO!". One at a time; the zone banner has priority, so a notice that is
 * showing gives way to it and shows again afterwards.
 */
export class Announcer {
  private readonly queue: Message[] = [];
  private current: { message: Message; container: Phaser.GameObjects.Container; tween: Phaser.Tweens.TweenChain } | null =
    null;

  constructor(private readonly scene: Phaser.Scene) {}

  /** "ZONA N" (+ "- VUELTA N" from lap 2; the font has no "·") and the zone name, across the screen. */
  zone(zone: number, lap: number): void {
    const name = ZONE_COLORS[zone - 1]?.name ?? '';
    const title = lap > 1 ? `ZONA ${zone} - VUELTA ${lap}` : `ZONA ${zone}`;
    const message: Message = {
      kind: 'banner',
      holdMs: TIMING.zoneBanner.hold,
      build: () => {
        const { y, h, lineColor, zoneY, nameY } = HUD.banner;
        const container = this.scene.add.container(0, 0);
        container.add([
          this.scene.add.rectangle(0, y, SCREEN.w, h, COLOR.bg, UI.overlay.banner).setOrigin(0),
          this.scene.add.rectangle(0, y, SCREEN.w, 1, lineColor).setOrigin(0),
          this.scene.add.rectangle(0, y + h - 1, SCREEN.w, 1, lineColor).setOrigin(0),
          new PixelText(this.scene, SCREEN.cx, zoneY, title, { color: COLOR.accent, align: 'center' }),
          new PixelText(this.scene, SCREEN.cx, nameY, name, { align: 'center' }),
        ]);
        return container;
      },
    };
    // Priority: the newest zone replaces any other banner; a showing notice goes back to after this one.
    for (let i = this.queue.length - 1; i >= 0; i--) if (this.queue[i]?.kind === 'banner') this.queue.splice(i, 1);
    if (this.current?.message.kind === 'toast') this.queue.unshift(this.current.message);
    this.clearCurrent();
    this.queue.unshift(message);
    this.next();
  }

  /** Black box fitted to the text, centered at the top of the play area. */
  toast(text: string, color: number = COLOR.record): void {
    this.queue.push({
      kind: 'toast',
      holdMs: TIMING.recordToast,
      build: () => {
        const { y, h, padX, textDy } = HUD.toast;
        const label = new PixelText(this.scene, SCREEN.cx, y + textDy, text, { color, align: 'center' });
        const w = label.measure() + 2 * padX;
        const box = this.scene.add
          .rectangle(Math.round(SCREEN.cx - w / 2), y, w, h, COLOR.bg, UI.overlay.banner)
          .setOrigin(0);
        return this.scene.add.container(0, 0, [box, label]);
      },
    });
    this.next();
  }

  private next(): void {
    if (this.current) return;
    const message = this.queue.shift();
    if (!message) return;
    const container = message.build().setDepth(DEPTH.hud).setAlpha(0);
    const { in: fadeIn, out: fadeOut } = TIMING.zoneBanner;
    const tween = this.scene.tweens.chain({
      targets: container,
      tweens: [
        { alpha: 1, duration: fadeIn, ease: 'Quad.easeOut' },
        { alpha: 0, duration: fadeOut, delay: message.holdMs, ease: 'Quad.easeIn' },
      ],
      onComplete: () => {
        this.clearCurrent();
        this.next();
      },
    });
    this.current = { message, container, tween };
  }

  private clearCurrent(): void {
    if (!this.current) return;
    this.current.tween.stop();
    this.current.container.destroy();
    this.current = null;
  }
}
