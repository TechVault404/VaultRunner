import Phaser from 'phaser';
import { getManifest } from '../assets';
import { Backdrop } from '../entities/Backdrop';
import { CharacterSprite } from '../entities/CharacterSprite';
import { playSfx } from '../systems/AudioSystem';
import { cycleOption, randomCharacter, type CharacterField } from '../systems/CharacterOptions';
import { InputSystem } from '../systems/InputSystem';
import { createDefaultCharacter, saveSystem, type CharacterConfig } from '../systems/SaveSystem';
import { COLOR, LAYOUT, RAMP, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { NameField } from '../ui/NameField';
import { addOverlay, addPanel } from '../ui/panels';
import { Selector } from '../ui/Selector';
import { Swatches } from '../ui/Swatches';
import { pixelText, type PixelText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';
import { SceneKey } from './keys';

const SELECTORS: { field: CharacterField; label: string }[] = [
  { field: 'skin', label: 'PIEL' },
  { field: 'outfit', label: 'ROPA' },
  { field: 'hair', label: 'CABELLO' },
  { field: 'accessory', label: 'ACCESORIO' },
  { field: 'weapon', label: 'ARMA' },
];

/** Keyboard focus rows, top to bottom: left column, right column, then the button bar. */
type FocusRow =
  | { kind: 'selector'; field: CharacterField }
  | { kind: 'swatches'; field: 'outfitColor' | 'hairColor' }
  | { kind: 'name' }
  | { kind: 'buttons' };

const ROWS: FocusRow[] = [
  ...SELECTORS.map(({ field }) => ({ kind: 'selector', field }) as const),
  { kind: 'swatches', field: 'outfitColor' },
  { kind: 'swatches', field: 'hairColor' },
  { kind: 'name' },
  { kind: 'buttons' },
];

/** Index of the primary button (GUARDAR Y JUGAR) in the button bar. */
const PRIMARY = 2;

/**
 * Character editor (spec §8). Reference: screens/02_editor.png.
 * Edits a draft; only GUARDAR Y JUGAR persists it. Esc goes back to the menu without saving.
 */
export class CharacterEditorScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private draft!: CharacterConfig;
  private optionNames!: Record<CharacterField, string[]>;
  private preview!: CharacterSprite;
  private previewName!: PixelText;
  private selectors!: Map<CharacterField, Selector>;
  private swatches!: Record<'outfitColor' | 'hairColor', Swatches>;
  private nameField!: NameField;
  private keyboardHint!: PixelText;
  private buttons!: Button[];
  private row = 0;
  private buttonIndex = PRIMARY;

  constructor() {
    super(SceneKey.CharacterEditor);
  }

  create(): void {
    fadeIn(this);
    this.inputSystem = new InputSystem(this);
    this.draft = { ...saveSystem.data.character };
    this.optionNames = getManifest(this).notes.player.options;
    this.row = 0;
    this.buttonIndex = PRIMARY;
    const layout = LAYOUT.editor;

    new Backdrop(this, 4, { layers: ['far'], ground: false });
    addOverlay(this, UI.overlay.editor);
    pixelText(this, SCREEN.cx, layout.title.y, 'TU PERSONAJE', { align: 'center' });

    this.createSelectors();
    this.createPreview();
    this.createColorsAndName();
    this.keyboardHint = pixelText(this, SCREEN.cx, layout.hint.y, '← → CAMBIAR   ↑ ↓ CATEGORÍA   ENTER ELEGIR', {
      color: COLOR.textDisabled,
      shadow: null,
      align: 'center',
    });
    this.createButtons();

    this.refresh();
    this.refreshFocus();
  }

  update(): void {
    this.inputSystem.update();
    // Keyboard hints make no sense on a phone; they show up as soon as a key or pad is used.
    this.keyboardHint.setVisible(this.inputSystem.lastDevice !== 'touch');
    if (this.nameField.editing) return;
    const input = this.inputSystem;
    if (input.justPressed('uiBack')) return this.back();
    if (input.justPressed('uiUp')) this.focusRow(this.row - 1);
    if (input.justPressed('uiDown')) this.focusRow(this.row + 1);
    if (input.justPressed('uiLeft')) this.step(-1);
    if (input.justPressed('uiRight')) this.step(1);
    if (input.justPressed('uiConfirm')) this.confirm();
  }

  // ─── Construction ────────────────────────────────────────────────────────

  private createSelectors(): void {
    const { x, y, w, step } = LAYOUT.editor.selectors;
    this.selectors = new Map();
    SELECTORS.forEach(({ field, label }, i) => {
      const selector = new Selector(this, x, y + i * step, w, {
        label,
        onStep: (delta) => this.change(cycleOption(this.draft, field, delta), true),
        onFocus: () => this.focusRow(i, false),
      });
      this.selectors.set(field, selector);
    });
  }

  private createPreview(): void {
    const { panel, floor, x, feetY, scale } = LAYOUT.editor.preview;
    addPanel(this, panel);
    this.add.rectangle(floor.x, floor.y, floor.w, floor.h, COLOR.surface).setOrigin(0);
    this.preview = new CharacterSprite(this, x, feetY, this.draft, scale).play('run');
    this.previewName = pixelText(this, SCREEN.cx, LAYOUT.editor.name.y, '', { color: COLOR.record, align: 'center' });
  }

  private createColorsAndName(): void {
    const layout = LAYOUT.editor;
    const swatchRow = (field: 'outfitColor' | 'hairColor') => ROWS.findIndex((r) => 'field' in r && r.field === field);
    this.swatches = {
      outfitColor: new Swatches(this, layout.outfitColors, {
        label: 'COLOR DE ROPA',
        labelDy: layout.swatchLabelDy,
        ramps: RAMP.outfit,
        onPick: (index) => {
          this.focusRow(swatchRow('outfitColor'), false);
          this.change({ ...this.draft, outfitColor: index }, true);
        },
      }),
      hairColor: new Swatches(this, layout.hairColors, {
        label: 'COLOR DE CABELLO',
        labelDy: layout.swatchLabelDy,
        ramps: RAMP.hair,
        onPick: (index) => {
          this.focusRow(swatchRow('hairColor'), false);
          this.change({ ...this.draft, hairColor: index }, true);
        },
      }),
    };
    this.nameField = new NameField(this, {
      onChange: (name) => this.change({ ...this.draft, name }),
      onFocus: () => this.focusRow(ROWS.findIndex((r) => r.kind === 'name'), false),
      // Phaser's keyboard was off while typing and missed key-ups: start clean.
      onStop: () => this.inputSystem.reset(),
    });
  }

  private createButtons(): void {
    const layout = LAYOUT.editor;
    this.buttons = [
      new Button(this, layout.random, {
        label: 'ALEATORIO',
        icon: 'dice',
        sound: 'ui_random',
        onClick: () => this.change(randomCharacter(this.draft.name)),
      }),
      new Button(this, layout.reset, {
        label: 'RESTABLECER',
        icon: 'reset',
        sound: 'ui_reset',
        onClick: () => this.change(createDefaultCharacter()),
      }),
      new Button(this, layout.save, { label: 'GUARDAR Y JUGAR', onClick: () => this.saveAndPlay() }),
    ];
    this.buttons.forEach((button, i) =>
      button.on('hover', () => {
        const moved = this.row !== ROWS.length - 1 || this.buttonIndex !== i;
        this.buttonIndex = i;
        this.focusRow(ROWS.length - 1, false);
        if (moved) playSfx(this, 'ui_move');
      }),
    );
  }

  // ─── State ───────────────────────────────────────────────────────────────

  /** Applies a new draft and updates every view at once (preview included). Buttons play their own sound. */
  private change(next: CharacterConfig, audible = false): void {
    this.draft = next;
    this.refresh();
    if (audible) playSfx(this, 'ui_change');
  }

  private refresh(): void {
    this.preview.setConfig(this.draft);
    for (const [field, selector] of this.selectors) {
      selector.setValue(this.optionNames[field][this.draft[field]] ?? '');
    }
    this.swatches.outfitColor.setSelected(this.draft.outfitColor);
    this.swatches.hairColor.setSelected(this.draft.hairColor);
    this.nameField.setName(this.draft.name);
    this.previewName.setText(this.draft.name);
  }

  // ─── Focus and navigation ────────────────────────────────────────────────

  /** `audible`: ui_move when the row changes (keyboard); pointer actions play their own sound. */
  private focusRow(index: number, audible = true): void {
    const next = Phaser.Math.Wrap(index, 0, ROWS.length);
    if (audible && next !== this.row) playSfx(this, 'ui_move');
    this.row = next;
    this.refreshFocus();
  }

  private refreshFocus(): void {
    const current = ROWS[this.row];
    for (const [field, selector] of this.selectors) {
      selector.setSelected(current?.kind === 'selector' && current.field === field);
    }
    this.swatches.outfitColor.setFocused(current?.kind === 'swatches' && current.field === 'outfitColor');
    this.swatches.hairColor.setFocused(current?.kind === 'swatches' && current.field === 'hairColor');
    this.nameField.setFocused(current?.kind === 'name');
    // Outside the button bar the primary button keeps the hover frame (DISENO §7.1).
    const focusedButton = current?.kind === 'buttons' ? this.buttonIndex : PRIMARY;
    this.buttons.forEach((button, i) => button.setFocused(i === focusedButton));
  }

  /** ← / → : change the focused option, color or button. */
  private step(delta: number): void {
    const current = ROWS[this.row];
    if (!current) return;
    switch (current.kind) {
      case 'selector':
      case 'swatches':
        this.change(cycleOption(this.draft, current.field, delta), true);
        break;
      case 'buttons':
        this.buttonIndex = Phaser.Math.Wrap(this.buttonIndex + delta, 0, this.buttons.length);
        playSfx(this, 'ui_move');
        this.refreshFocus();
        break;
      case 'name':
        break;
    }
  }

  /** Enter: next row on options, type on the name, activate on buttons. */
  private confirm(): void {
    const current = ROWS[this.row];
    if (!current) return;
    switch (current.kind) {
      case 'selector':
      case 'swatches':
        this.focusRow(this.row + 1);
        break;
      case 'name':
        this.nameField.startEditing();
        break;
      case 'buttons':
        this.buttons[this.buttonIndex]?.activate();
        break;
    }
  }

  private saveAndPlay(): void {
    const character = { ...this.draft, name: this.draft.name.trim() };
    saveSystem.update((data) => void (data.character = character));
    fadeToScene(this, SceneKey.Game);
  }

  private back(): void {
    playSfx(this, 'ui_back');
    fadeToScene(this, SceneKey.Menu);
  }
}
