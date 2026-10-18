import { PLAYER } from '../config';

/** Movement settings; defaults to PLAYER in config.ts (tests and powerups can override). */
export interface MotorConfig {
  gravity: number;
  jumpVelocity: number;
  jumpCutMultiplier: number;
  coyoteMs: number;
  jumpBufferMs: number;
  maxFallSpeed: number;
  fastFallSpeed: number;
  maxJumps: number;
}

/** What the player is asking for this frame (from InputSystem's abstract actions). */
export interface MotorInput {
  jumpPressed: boolean;
  jumpHeld: boolean;
  crouchPressed: boolean;
  crouchHeld: boolean;
}

export type MotorPose = 'run' | 'jump' | 'fall' | 'crouch';

/**
 * Vertical movement of the player (spec §9), with no Phaser dependency so it can be tested.
 * y grows downwards, like the screen. `groundY` is the surface under the player, or null over
 * a hole.
 */
export class PlayerMotor {
  feetY: number;
  vy = 0;
  grounded = true;
  crouching = false;
  /** Can be raised by the double-jump powerup (Phase 5). */
  maxJumps: number;
  private jumpsUsed = 0;
  private coyoteLeft = 0;
  private bufferLeft = 0;
  /** True while rising from a jump whose button has not been released yet. */
  private canCut = false;

  constructor(
    feetY: number,
    private readonly config: MotorConfig = PLAYER,
  ) {
    this.feetY = feetY;
    this.maxJumps = config.maxJumps;
  }

  get pose(): MotorPose {
    if (this.crouching) return 'crouch';
    if (!this.grounded) return this.vy < 0 ? 'jump' : 'fall';
    return 'run';
  }

  step(deltaMs: number, input: MotorInput, groundY: number | null): void {
    const { config } = this;
    const dt = deltaMs / 1000;

    if (input.jumpPressed) this.bufferLeft = config.jumpBufferMs;
    this.tryJump();

    // Variable jump: letting go before the peak cuts the rise, once.
    if (this.canCut && (this.vy >= 0 || this.grounded)) this.canCut = false;
    if (this.canCut && !input.jumpHeld) {
      this.vy *= config.jumpCutMultiplier;
      this.canCut = false;
    }

    if (this.grounded && groundY === null) {
      // Walked off the ground: coyote time starts.
      this.grounded = false;
      this.coyoteLeft = config.coyoteMs;
    }

    if (!this.grounded) {
      // Crouching in the air is a fast fall.
      if (input.crouchPressed) {
        this.vy = Math.max(this.vy, config.fastFallSpeed);
        this.canCut = false;
      }
      this.vy = Math.min(this.vy + config.gravity * dt, config.maxFallSpeed);
      const before = this.feetY;
      this.feetY += this.vy * dt;
      // Only land when coming down onto the surface: feet already below it (in a hole) keep falling.
      if (groundY !== null && this.vy >= 0 && this.feetY >= groundY && before <= groundY) this.land(groundY);
    }

    this.crouching = this.grounded && input.crouchHeld;

    this.bufferLeft = Math.max(0, this.bufferLeft - deltaMs);
    if (this.coyoteLeft > 0) {
      this.coyoteLeft = Math.max(0, this.coyoteLeft - deltaMs);
      // Coyote time over without jumping: the ground jump is gone.
      if (this.coyoteLeft === 0 && !this.grounded && this.jumpsUsed === 0) this.jumpsUsed = 1;
    }
  }

  private land(groundY: number): void {
    this.feetY = groundY;
    this.vy = 0;
    this.grounded = true;
    this.jumpsUsed = 0;
    this.coyoteLeft = 0;
    // A jump pressed just before landing happens now (jump buffer).
    this.tryJump();
  }

  /** Jumps if one is buffered and allowed. Jumping also cancels the crouch. */
  private tryJump(): void {
    if (this.bufferLeft <= 0) return;
    const fromGround = this.grounded || this.coyoteLeft > 0;
    if (!fromGround && this.jumpsUsed >= this.maxJumps) return;
    this.jumpsUsed = fromGround ? 1 : this.jumpsUsed + 1;
    this.vy = this.config.jumpVelocity;
    this.grounded = false;
    this.crouching = false;
    this.coyoteLeft = 0;
    this.bufferLeft = 0;
    this.canCut = true;
  }
}
