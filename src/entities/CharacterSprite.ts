import Phaser from 'phaser';
import { getManifest, type PlayerAnim } from '../assets';
import type { CharacterConfig } from '../systems/SaveSystem';
import { ANIM_FPS } from '../theme';

const ANIM_SETTINGS: Record<PlayerAnim, { fps: number; loop: boolean }> = {
  run: { fps: ANIM_FPS.run, loop: true },
  jump: { fps: 0, loop: false },
  fall: { fps: 0, loop: false },
  crouch: { fps: ANIM_FPS.crouch, loop: true },
  shoot: { fps: ANIM_FPS.shoot, loop: false },
  death: { fps: ANIM_FPS.death, loop: false },
};

/** Texture keys of the layers to draw, bottom to top (ASSETS.md "Personaje"). */
export function characterLayers(config: CharacterConfig): string[] {
  const layers = [`player_body_${config.skin}`, `player_outfit_${config.outfit}_${config.outfitColor}`];
  if (config.hair > 0) layers.push(`player_hair_${config.hair}_${config.hairColor}`);
  if (config.accessory > 0) layers.push(`player_accessory_${config.accessory}`);
  layers.push(`player_weapon_${config.weapon}`);
  return layers;
}

/**
 * The player's look: a Container of layer sprites that always show the same frame index
 * (DISENO §10 — layers are never animated separately). Positioned by the frame's
 * left edge and the feet line.
 */
export class CharacterSprite extends Phaser.GameObjects.Container {
  private readonly ranges: Record<PlayerAnim, { start: number; end: number }>;
  private readonly frameHeight: number;
  private sprites: Phaser.GameObjects.Image[] = [];
  private anim: PlayerAnim = 'run';
  private elapsed = 0;

  constructor(scene: Phaser.Scene, x: number, feetY: number, config: CharacterConfig, scale = 1) {
    super(scene, Math.round(x), 0);
    const manifest = getManifest(scene);
    this.ranges = manifest.notes.player.animations;
    const body = manifest.spritesheets.find((sheet) => sheet.key === characterLayers(config)[0]);
    this.frameHeight = body?.frameHeight ?? 0;
    this.setScale(scale);
    this.setFeetY(feetY);
    this.setConfig(config);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.tick, this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => scene.events.off(Phaser.Scenes.Events.UPDATE, this.tick, this));
    scene.add.existing(this);
  }

  setFeetY(feetY: number): this {
    this.y = Math.round(feetY - this.frameHeight * this.scaleY);
    return this;
  }

  setConfig(config: CharacterConfig): this {
    this.removeAll(true);
    this.sprites = characterLayers(config).map((key) => this.scene.add.image(0, 0, key).setOrigin(0));
    this.add(this.sprites);
    return this.applyFrame();
  }

  play(anim: PlayerAnim): this {
    if (anim !== this.anim) {
      this.anim = anim;
      this.elapsed = 0;
    }
    return this.applyFrame();
  }

  private tick(_time: number, delta: number): void {
    if (ANIM_SETTINGS[this.anim].fps === 0) return;
    this.elapsed += delta;
    this.applyFrame();
  }

  private applyFrame(): this {
    const { start, end } = this.ranges[this.anim];
    const { fps, loop } = ANIM_SETTINGS[this.anim];
    const length = end - start + 1;
    const step = Math.floor((this.elapsed / 1000) * fps);
    const frame = start + (loop ? step % length : Math.min(step, length - 1));
    for (const sprite of this.sprites) sprite.setFrame(frame);
    return this;
  }
}
