import Phaser from 'phaser';
import { COLOR, FONT } from '../theme';

export type Align = 'left' | 'center' | 'right';

export interface PixelTextStyle {
  color?: number;
  scale?: number;
  /** Shadow color, or null for no shadow (keyboard hints). */
  shadow?: number | null;
  align?: Align;
}

interface FontChars {
  chars: Record<number, { xAdvance: number }>;
}

/**
 * BitmapFont text with the game's hard 1 px shadow (DISENO §5).
 * `y` is the top of the glyphs (accent rows sit above it); `x` is the anchor for `align`.
 * Text is always upper-cased.
 */
export class PixelText extends Phaser.GameObjects.Container {
  private readonly main: Phaser.GameObjects.BitmapText;
  private readonly shade: Phaser.GameObjects.BitmapText | null;
  private readonly anchorX: number;
  private readonly align: Align;
  private readonly textScale: number;
  private message = '';

  constructor(scene: Phaser.Scene, x: number, y: number, msg: string, style: PixelTextStyle = {}) {
    super(scene, 0, Math.round(y));
    const { color = COLOR.textPrimary, scale = FONT.scale.body, shadow = COLOR.outline, align = 'left' } = style;
    this.anchorX = x;
    this.align = align;
    this.textScale = scale;

    const size = FONT.size * scale;
    const top = -FONT.ascent * scale;
    const offset = FONT.shadowOffset * scale;
    this.shade =
      shadow === null ? null : scene.add.bitmapText(offset, top + offset, FONT.key, '', size).setTint(shadow);
    this.main = scene.add.bitmapText(0, top, FONT.key, '', size).setTint(color);
    this.add(this.shade ? [this.shade, this.main] : [this.main]);
    this.setText(msg);
  }

  setText(msg: string): this {
    this.message = msg.toUpperCase();
    this.shade?.setText(this.message);
    this.main.setText(this.message);
    const width = this.measure();
    const shift = this.align === 'center' ? Math.floor(width / 2) : this.align === 'right' ? width : 0;
    this.x = Math.round(this.anchorX - shift);
    return this;
  }

  setColor(color: number): this {
    this.main.setTint(color);
    return this;
  }

  /** Width in px, summing glyph advances like the reference screen generator. */
  measure(): number {
    const font = this.scene.cache.bitmapFont.get(FONT.key)?.data as FontChars | undefined;
    if (!font) return 0;
    let width = 0;
    for (const ch of this.message) width += font.chars[ch.charCodeAt(0)]?.xAdvance ?? 0;
    return width * this.textScale;
  }
}

export function pixelText(scene: Phaser.Scene, x: number, y: number, msg: string, style?: PixelTextStyle): PixelText {
  return scene.add.existing(new PixelText(scene, x, y, msg, style));
}
