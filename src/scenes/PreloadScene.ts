import Phaser from 'phaser';
import { GAME, PLACEHOLDERS } from '../config';
import { SceneKey } from './keys';

/** Loads assets. Until real art exists, generates colored placeholder textures (spec §3). */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  create(): void {
    const { player, groundTop, groundFill } = PLACEHOLDERS;
    this.makeRect(player.key, player.width, player.height, player.color);
    this.makeRect(groundTop.key, GAME.tileSize, GAME.tileSize, groundTop.color);
    this.makeRect(groundFill.key, GAME.tileSize, GAME.tileSize, groundFill.color);
    this.scene.start(SceneKey.Menu);
  }

  private makeRect(key: string, width: number, height: number, color: number): void {
    if (this.textures.exists(key)) return;
    const graphics = this.make.graphics({}, false);
    graphics.fillStyle(color).fillRect(0, 0, width, height);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}
