import Phaser from 'phaser';
import { COLOR, PALETTE, UI, type PaletteName } from '../theme';
import { PixelText } from './text';

export interface SwatchGrid {
  x: number;
  y: number;
  w: number;
  h: number;
  cols: number;
  colStep: number;
  rowStep: number;
  /** Vertical band (relative to y) that the touch cells fill; keeps neighboring grids apart. */
  hitTop: number;
  hitBottom: number;
}

export interface SwatchesOptions {
  label: string;
  labelDy: number;
  /** One [light, mid, shade] ramp per color (theme RAMP). */
  ramps: readonly (readonly [PaletteName, PaletteName, PaletteName])[];
  onPick: (index: number) => void;
}

/**
 * Grid of color swatches (DISENO §7.6): each swatch shows its ramp (light rows on top,
 * shade rows at the bottom); the selected one gets a 2 px white frame. The label turns
 * `accent` while the grid has the keyboard focus.
 */
export class Swatches extends Phaser.GameObjects.Container {
  private readonly label: PixelText;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly positions: { x: number; y: number }[];

  constructor(scene: Phaser.Scene, grid: SwatchGrid, options: SwatchesOptions) {
    super(scene, grid.x, grid.y);
    const { w, h, cols, colStep, rowStep } = grid;
    const { light, shade, frame } = UI.swatch;

    this.label = new PixelText(scene, 0, options.labelDy, options.label, { color: COLOR.textMuted });
    this.frame = scene.add.rectangle(0, 0, w + frame * 2, h + frame * 2, COLOR.textPrimary).setOrigin(0);
    this.add([this.label, this.frame]);

    this.positions = options.ramps.map((_, i) => ({ x: (i % cols) * colStep, y: Math.floor(i / cols) * rowStep }));
    options.ramps.forEach(([lightColor, midColor, shadeColor], i) => {
      const { x, y } = this.positions[i] ?? { x: 0, y: 0 };
      const mid = scene.add.rectangle(x, y, w, h, PALETTE[midColor]).setOrigin(0);
      const top = scene.add.rectangle(x, y, w, light, PALETTE[lightColor]).setOrigin(0);
      const bottom = scene.add.rectangle(x, y + h - shade, w, shade, PALETTE[shadeColor]).setOrigin(0);
      this.add([mid, top, bottom]);
    });
    this.addTouchZones(grid, options);
    scene.add.existing(this);
  }

  /**
   * Swatch rows sit closer than UI.touchMin, so each swatch gets a touch cell larger than its
   * drawing: columns are at least touchMin wide, and the grid's [hitTop, hitBottom] band is
   * split between rows at the middle of each gap. Cells never overlap, within or across grids.
   */
  private addTouchZones({ w, h, cols, colStep, rowStep, hitTop, hitBottom }: SwatchGrid, options: SwatchesOptions): void {
    const rows = Math.ceil(options.ramps.length / cols);
    const cellW = Math.max(colStep, UI.touchMin);
    const gapMiddle = (row: number) => row * rowStep - (rowStep - h) / 2;
    const edge = (row: number) => (row === 0 ? hitTop : row === rows ? hitBottom : gapMiddle(row));
    options.ramps.forEach((_, i) => {
      const row = Math.floor(i / cols);
      const zone = this.scene.add
        .zone((i % cols) * colStep + (w - cellW) / 2, edge(row), cellW, edge(row + 1) - edge(row))
        .setOrigin(0)
        .setInteractive({ useHandCursor: true });
      zone.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => options.onPick(i));
      this.add(zone);
    });
  }

  setSelected(index: number): this {
    const position = this.positions[index];
    if (position) this.frame.setPosition(position.x - UI.swatch.frame, position.y - UI.swatch.frame);
    return this;
  }

  setFocused(focused: boolean): this {
    this.label.setColor(focused ? COLOR.accent : COLOR.textMuted);
    return this;
  }
}
