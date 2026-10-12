import Phaser from 'phaser';
import { INPUT } from './config';
import { BootScene } from './scenes/BootScene';
import { CharacterEditorScene } from './scenes/CharacterEditorScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { PauseScene } from './scenes/PauseScene';
import { PreloadScene } from './scenes/PreloadScene';
import { COLOR, SCREEN } from './theme';

const game = new Phaser.Game({
  // WebGL: NineSlice (buttons, panels) and BitmapText tint require it.
  type: Phaser.WEBGL,
  parent: 'game',
  width: SCREEN.w,
  height: SCREEN.h,
  backgroundColor: COLOR.bg,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: false },
  },
  input: {
    gamepad: true,
    activePointers: INPUT.activePointers,
  },
  scene: [BootScene, PreloadScene, MenuScene, CharacterEditorScene, GameScene, PauseScene, GameOverScene],
});

// Letterbox bands around the canvas use the scene background color.
document.body.style.backgroundColor = `#${COLOR.bg.toString(16).padStart(6, '0')}`;

// Handy for debugging from the browser console during development.
if (import.meta.env.DEV) Object.assign(window, { game });
