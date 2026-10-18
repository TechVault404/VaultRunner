import Phaser from 'phaser';
import { getManifest } from '../assets';
import { PLAYER, SHOOTING } from '../config';
import type { InputSystem } from '../systems/InputSystem';
import type { CharacterConfig } from '../systems/SaveSystem';
import { ANIM_FPS, DEPTH } from '../theme';
import { CharacterSprite } from './CharacterSprite';
import { PlayerMotor, type MotorInput, type MotorPose } from './PlayerMotor';

const MUZZLE_KEY = 'muzzle';
const NO_INPUT: MotorInput = { jumpPressed: false, jumpHeld: false, crouchPressed: false, crouchHeld: false };
const MUZZLE_ANIM = 'muzzle_flash';

/**
 * The player in the Game scene (spec §9): the editor's CharacterSprite, moved by a
 * PlayerMotor, with an Arcade body as hitbox (12 × 20 standing, 12 × 10 crouched).
 * The body does not move on its own; it follows the sprite.
 */
export class Player {
  readonly sprite: CharacterSprite;
  readonly motor: PlayerMotor;
  private readonly body: Phaser.Physics.Arcade.Body;
  private readonly muzzle: Phaser.GameObjects.Sprite;
  private readonly shootDuration: number;
  private shootLeft = 0;
  private hitbox: keyof typeof PLAYER.hitbox | null = null;
  private dead = false;

  constructor(scene: Phaser.Scene, character: CharacterConfig, groundY: number) {
    this.motor = new PlayerMotor(groundY);
    this.sprite = new CharacterSprite(scene, PLAYER.x, groundY, character).setDepth(DEPTH.player).play('run');
    scene.physics.add.existing(this.sprite);
    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setAllowGravity(false);
    this.body.moves = false;
    this.setHitbox('stand');

    const { start, end } = getManifest(scene).notes.player.animations.shoot;
    this.shootDuration = ((end - start + 1) * 1000) / ANIM_FPS.shoot;

    if (!scene.anims.exists(MUZZLE_ANIM)) {
      scene.anims.create({
        key: MUZZLE_ANIM,
        frames: scene.anims.generateFrameNumbers(MUZZLE_KEY),
        frameRate: ANIM_FPS.muzzle,
      });
    }
    this.muzzle = scene.add.sprite(0, 0, MUZZLE_KEY).setOrigin(0, 0.5).setDepth(DEPTH.playerFx).setVisible(false);
    this.muzzle.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => this.muzzle.setVisible(false));
  }

  update(deltaMs: number, input: InputSystem, groundY: number | null): void {
    // Once dead, the controls are gone: the body only falls (to the ground, or down a hole).
    const controls = this.dead
      ? NO_INPUT
      : {
          jumpPressed: input.justPressed('jump'),
          jumpHeld: input.isDown('jump'),
          crouchPressed: input.justPressed('crouch'),
          crouchHeld: input.isDown('crouch'),
        };
    this.motor.step(deltaMs, controls, groundY);
    this.sprite.setFeetY(this.motor.feetY);
    if (!this.dead) this.setHitbox(this.motor.crouching ? 'crouch' : 'stand');
    this.body.updateFromGameObject();
    if (this.dead) return;

    this.shootLeft = Math.max(0, this.shootLeft - deltaMs);
    const pose = this.motor.pose;
    // The shoot frames are a standing pose: only used while running (decision in spec §18).
    this.sprite.play(pose === 'run' && this.shootLeft > 0 ? 'shoot' : pose);
    if (this.muzzle.visible) this.placeMuzzle();
  }

  /** Where a shot leaves the weapon right now: x of the tip and the shot's center y. */
  get muzzlePoint(): { x: number; y: number } {
    const pose: MotorPose = this.motor.pose;
    return { x: this.sprite.x + SHOOTING.muzzle.x, y: this.sprite.y + SHOOTING.muzzle.y[pose] };
  }

  /** Plays the shoot animation (when running) and the muzzle flash. */
  onShot(): void {
    this.shootLeft = this.shootDuration;
    this.placeMuzzle();
    this.muzzle.setVisible(true).play(MUZZLE_ANIM);
  }

  /** Hit (spec §11.4): plays the death animation and ignores the controls from now on. */
  die(): void {
    if (this.dead) return;
    this.dead = true;
    this.muzzle.setVisible(false);
    this.sprite.play('death');
  }

  get isDead(): boolean {
    return this.dead;
  }

  /** Hitbox rectangle in screen coordinates. */
  get bounds(): Phaser.Geom.Rectangle {
    const { x, y, width, height } = this.body;
    return new Phaser.Geom.Rectangle(x, y, width, height);
  }

  private placeMuzzle(): void {
    const { x, y } = this.muzzlePoint;
    this.muzzle.setPosition(x, y);
  }

  private setHitbox(kind: keyof typeof PLAYER.hitbox): void {
    if (kind === this.hitbox) return;
    this.hitbox = kind;
    const { dx, dy, w, h } = PLAYER.hitbox[kind];
    this.body.setSize(w, h, false).setOffset(dx, dy);
  }
}
