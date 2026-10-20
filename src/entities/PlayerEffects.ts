import Phaser from 'phaser';
import type { PowerUpSystem } from '../systems/PowerUpSystem';
import { ANIM_FPS, DEPTH, PLAYER_FX, TIMING } from '../theme';
import { ensureAnim } from './anims';
import type { Player } from './Player';

/**
 * What the active powerups look like on the player (spec §12, DISENO §10): the shield bubble,
 * the aura (turbo and ×2), the turbo trail, and the 10 Hz blink while invulnerable after the
 * shield breaks or the turbo ends.
 */
export class PlayerEffects {
  private readonly shield: Phaser.GameObjects.Sprite;
  private readonly aura: Phaser.GameObjects.Sprite;
  private readonly trail: Phaser.GameObjects.Sprite;
  /** ms spent blinking, for the blink phase. */
  private blinkMs = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Player,
  ) {
    const fx = (texture: string, fps: number, depth: number) =>
      scene.add
        .sprite(0, 0, texture)
        .setOrigin(0)
        .setDepth(depth)
        .setVisible(false)
        .play(ensureAnim(scene, `${texture}_loop`, texture, fps));
    this.shield = fx('fx_shield', ANIM_FPS.shield, DEPTH.playerFx);
    this.aura = fx('fx_aura', ANIM_FPS.aura, DEPTH.playerFxBack);
    this.trail = fx('fx_trail', ANIM_FPS.trail, DEPTH.playerFxBack);
  }

  update(deltaMs: number, powerUps: PowerUpSystem): void {
    const { x, y } = this.player.sprite;
    const show = (sprite: Phaser.GameObjects.Sprite, on: boolean, at: { dx: number; dy: number }) =>
      sprite.setVisible(on).setPosition(x + at.dx, y + at.dy);
    const turbo = powerUps.isActive('turbo');
    show(this.shield, powerUps.isActive('shield'), PLAYER_FX.shield);
    show(this.aura, turbo || powerUps.isActive('x2'), PLAYER_FX.aura);
    show(this.trail, turbo, PLAYER_FX.trail);

    // Invulnerable after the shield or the turbo: alternate visibility (DISENO §11), not alpha.
    if (powerUps.blinking) {
      this.blinkMs += deltaMs;
      const on = Math.floor((this.blinkMs * TIMING.invulnBlinkHz * 2) / 1000) % 2 === 0;
      this.player.sprite.setVisible(on);
    } else {
      this.blinkMs = 0;
      this.player.sprite.setVisible(true);
    }
  }

  /** The run ended: the player is shown as is, without effects. */
  clear(): void {
    for (const sprite of [this.shield, this.aura, this.trail]) sprite.setVisible(false);
    this.player.sprite.setVisible(true);
  }
}
