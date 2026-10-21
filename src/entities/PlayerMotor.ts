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

/** What happened during the last `step`, for sounds and dust (spec §13.1, §13.2). */
export interface MotorEvents {
  /** A jump started: from the ground (or coyote time) or in the air (double jump). */
  jumped: 'ground' | 'air' | null;
  landed: boolean;
  /** Started crouching on the ground, or a fast fall in the air. */
  ducked: boolean;
}

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
  /** Raised by the double-jump powerup (spec §12). */
  maxJumps: number;
  private jumpsUsed = 0;
  private coyoteLeft = 0;
  private bufferLeft = 0;
  /** True while rising from a jump whose button has not been released yet. */
  private canCut = false;
  /** Events of the last step. */
  readonly events: MotorEvents = { jumped: null, landed: false, ducked: false };

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
    const wasCrouching = this.crouching;
    this.events.jumped = null;
    this.events.landed = false;
    this.events.ducked = false;

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
        this.events.ducked = true;
      }
      this.vy = Math.min(this.vy + config.gravity * dt, config.maxFallSpeed);
      const before = this.feetY;
      this.feetY += this.vy * dt;
      // Only land when coming down onto the surface: feet already below it (in a hole) keep falling.
      if (groundY !== null && this.vy >= 0 && this.feetY >= groundY && before <= groundY) this.land(groundY);
    }

    this.crouching = this.grounded && input.crouchHeld;
    if (this.crouching && !wasCrouching && !this.events.landed) this.events.ducked = true;

    this.bufferLeft = Math.max(0, this.bufferLeft - deltaMs);
    if (this.coyoteLeft > 0) {
      this.coyoteLeft = Math.max(0, this.coyoteLeft - deltaMs);
      // Coyote time over without jumping: the ground jump is gone.
      if (this.coyoteLeft === 0 && !this.grounded && this.jumpsUsed === 0) this.jumpsUsed = 1;
    }
  }

  /**
   * Saved from a fall (shield or invulnerability over a hole, spec §12): a full jump straight
   * up from wherever the feet are. It is not a jump of the player's: it can't be cut short, and
   * the air jumps left (double jump) stay as they were.
   */
  bounce(): void {
    this.vy = this.config.jumpVelocity;
    this.grounded = false;
    this.crouching = false;
    this.canCut = false;
    this.coyoteLeft = 0;
    this.jumpsUsed = Math.max(this.jumpsUsed, 1);
  }

  private land(groundY: number): void {
    this.feetY = groundY;
    this.vy = 0;
    this.grounded = true;
    this.events.landed = true;
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
    this.events.jumped = fromGround ? 'ground' : 'air';
    this.vy = this.config.jumpVelocity;
    this.grounded = false;
    this.crouching = false;
    this.coyoteLeft = 0;
    this.bufferLeft = 0;
    this.canCut = true;
  }
}
