import Phaser from 'phaser';
import { COLOR, DEPTH, HUD, SCREEN, TIMING, UI, ZONE_COLORS } from '../theme';
import { PixelText } from './text';

interface Message {
  kind: 'banner' | 'toast';
  build: () => Phaser.GameObjects.Container;
  /** Infinity = stays until dismissed (tutorial). */
  holdMs: number;
}

/**
 * Temporary in-game messages (DISENO §7.8): the zone banner and short notices such as
 * "¡RÉCORD SUPERADO!" or the tutorial's. One at a time; the zone banner has priority, so a
 * notice that is showing gives way to it and shows again afterwards.
 */
export class Announcer {
  private readonly queue: Message[] = [];
  private current: { message: Message; container: Phaser.GameObjects.Container; tween: { stop(): unknown } } | null =
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
    // (A notice already fading out after being dismissed is not shown again.)
    if (this.current?.message.kind === 'toast' && this.current.message.holdMs > 0) this.queue.unshift(this.current.message);
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

  /**
   * Tutorial notice (DISENO §7.8, §13): the title in `record` and a hint line under it, in a
   * black box at the notice spot. It stays until the returned function is called.
   */
  prompt(title: string, hint: string): () => void {
    const message: Message = {
      kind: 'toast',
      holdMs: Infinity,
      build: () => {
        const { y, padX, textDy } = HUD.toast;
        const { h, hintDy } = HUD.tutorial;
        const label = new PixelText(this.scene, SCREEN.cx, y + textDy, title, { color: COLOR.record, align: 'center' });
        const help = new PixelText(this.scene, SCREEN.cx, y + hintDy, hint, { color: COLOR.textSecondary, align: 'center' });
        const w = Math.max(label.measure(), help.measure()) + 2 * padX;
        const box = this.scene.add
          .rectangle(Math.round(SCREEN.cx - w / 2), y, w, h, COLOR.bg, UI.overlay.banner)
          .setOrigin(0);
        return this.scene.add.container(0, 0, [box, label, help]);
      },
    };
    this.queue.push(message);
    this.next();
    return () => this.dismiss(message);
  }

  /** Takes a lasting notice away: fades it out if showing, or drops it from the queue. */
  private dismiss(message: Message): void {
    const queued = this.queue.indexOf(message);
    if (queued >= 0) this.queue.splice(queued, 1);
    const current = this.current;
    if (current?.message !== message) return;
    current.tween.stop();
    // Mark it gone right away; the fade-out finishes on its own.
    current.message = { ...message, holdMs: 0 };
    current.tween = this.scene.tweens.add({
      targets: current.container,
      alpha: 0,
      duration: TIMING.zoneBanner.out,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.clearCurrent();
        this.next();
      },
    });
  }

  private next(): void {
    if (this.current) return;
    const message = this.queue.shift();
    if (!message) return;
    const container = message.build().setDepth(DEPTH.hud).setAlpha(0);
    const { in: fadeIn, out: fadeOut } = TIMING.zoneBanner;
    if (message.holdMs === Infinity) {
      const tween = this.scene.tweens.add({ targets: container, alpha: 1, duration: fadeIn, ease: 'Quad.easeOut' });
      this.current = { message, container, tween };
      return;
    }
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
