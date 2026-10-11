import Phaser from 'phaser';
import { COLOR, SCREEN, UI } from '../theme';
import type { ButtonBox } from './Button';

/** 9-slice panel (DISENO §7.4). */
export function addPanel(scene: Phaser.Scene, { x, y, w, h }: ButtonBox): Phaser.GameObjects.NineSlice {
  const slice = UI.nineSlice;
  return scene.add.nineslice(x, y, 'panel', undefined, w, h, slice, slice, slice, slice).setOrigin(0);
}

/** Full-screen black overlay (DISENO §7.9); transparency is only allowed on UI layers. */
export function addOverlay(scene: Phaser.Scene, alpha: number): Phaser.GameObjects.Rectangle {
  return scene.add.rectangle(0, 0, SCREEN.w, SCREEN.h, COLOR.bg, alpha).setOrigin(0);
}
