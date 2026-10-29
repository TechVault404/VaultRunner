import { describe, expect, it } from 'vitest';
import { PLAYER } from '../src/config';
import { PlayerMotor, type MotorInput } from '../src/entities/PlayerMotor';

const GROUND = 148;
const FRAME = 1000 / 60;
const idle: MotorInput = { jumpPressed: false, jumpHeld: false, crouchPressed: false, crouchHeld: false };

/** Runs `frames` steps with the same input; returns the highest point reached (smallest feet y). */
function run(motor: PlayerMotor, frames: number, input: Partial<MotorInput> = {}, ground: number | null = GROUND) {
  let top = motor.feetY;
  for (let i = 0; i < frames; i++) {
    motor.step(FRAME, { ...idle, ...input }, ground);
    top = Math.min(top, motor.feetY);
  }
  return top;
}

/** Height of a jump whose button is held for `holdFrames` frames. */
function jumpHeight(holdFrames: number): number {
  const motor = new PlayerMotor(GROUND);
  let top = run(motor, 1, { jumpPressed: true, jumpHeld: holdFrames > 0 });
  top = Math.min(top, run(motor, Math.max(0, holdFrames - 1), { jumpHeld: true }));
  top = Math.min(top, run(motor, 120));
  expect(motor.grounded).toBe(true);
  return GROUND - top;
}

describe('PlayerMotor', () => {
  it('starts running on the ground', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 10);
    expect(motor.feetY).toBe(GROUND);
    expect(motor.pose).toBe('run');
  });

  it('jumps on the same frame the button is pressed', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    expect(motor.grounded).toBe(false);
    expect(motor.feetY).toBeLessThan(GROUND);
    expect(motor.pose).toBe('jump');
  });

  it('holding gives the full ≈60 px jump; a tap gives a short one', () => {
    const full = jumpHeight(60);
    expect(full).toBeGreaterThan(56);
    expect(full).toBeLessThanOrEqual(61);
    const tap = jumpHeight(1);
    expect(tap).toBeLessThan(full / 2);
    expect(jumpHeight(10)).toBeGreaterThan(tap);
  });

  it('caps the fall speed', () => {
    const motor = new PlayerMotor(0);
    run(motor, 1, {}, null);
    run(motor, 200, {}, null);
    expect(motor.vy).toBe(PLAYER.maxFallSpeed);
  });

  it('allows a jump within the coyote time after leaving the ground', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 3, {}, null); // 50 ms over a hole
    run(motor, 1, { jumpPressed: true, jumpHeld: true }, null);
    expect(motor.vy).toBeLessThan(0);
  });

  it('refuses the jump once the coyote time is over', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 6, {}, null); // 100 ms over a hole
    run(motor, 1, { jumpPressed: true, jumpHeld: true }, null);
    expect(motor.vy).toBeGreaterThan(0);
  });

  it('falls through a hole instead of landing back up on its far edge', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 12, {}, null); // 200 ms over a hole: coyote time over, feet below the surface
    expect(motor.feetY).toBeGreaterThan(GROUND);
    run(motor, 30); // the floor is back under the player
    expect(motor.grounded).toBe(false);
    expect(motor.feetY).toBeGreaterThan(GROUND + 20);
  });

  it('still lands on the far edge when the jump comes down onto it', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { jumpPressed: true, jumpHeld: true }, null);
    run(motor, 20, { jumpHeld: true }, null);
    run(motor, 60, { jumpHeld: true });
    expect(motor.grounded).toBe(true);
    expect(motor.feetY).toBe(GROUND);
  });

  it('buffers a jump pressed shortly before landing', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    // Fall until a few frames from the ground, then press again (the button is still down).
    while (motor.vy < 0 || motor.feetY < GROUND - 15) run(motor, 1, { jumpHeld: true });
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    expect(motor.grounded).toBe(false);
    run(motor, 10, { jumpHeld: true });
    expect(motor.vy).toBeLessThan(0); // landed and jumped again without a new press
  });

  it('forgets a jump pressed too early before landing', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    run(motor, 20, { jumpHeld: true }); // still near the peak
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    run(motor, 120);
    expect(motor.grounded).toBe(true);
  });

  it('crouches only while the button is held on the ground', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { crouchPressed: true, crouchHeld: true });
    run(motor, 5, { crouchHeld: true });
    expect(motor.pose).toBe('crouch');
    run(motor, 1);
    expect(motor.pose).toBe('run');
  });

  it('crouching in the air is a fast fall, and keeps crouching on landing if held', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    run(motor, 5, { jumpHeld: true });
    motor.step(FRAME, { ...idle, crouchPressed: true, crouchHeld: true }, GROUND);
    expect(motor.vy).toBeGreaterThanOrEqual(PLAYER.fastFallSpeed);
    expect(motor.crouching).toBe(false);
    run(motor, 30, { crouchHeld: true });
    expect(motor.grounded).toBe(true);
    expect(motor.pose).toBe('crouch');
  });

  it('jumping cancels the crouch', () => {
    const motor = new PlayerMotor(GROUND);
    run(motor, 5, { crouchHeld: true });
    run(motor, 1, { crouchHeld: true, jumpPressed: true, jumpHeld: true });
    expect(motor.crouching).toBe(false);
    expect(motor.pose).toBe('jump');
    // Still holding crouch does not turn the jump into a fast fall.
    run(motor, 3, { crouchHeld: true, jumpHeld: true });
    expect(motor.vy).toBeLessThan(0);
  });

  it('has no air jump by default, but maxJumps = 2 gives one', () => {
    const single = new PlayerMotor(GROUND);
    run(single, 1, { jumpPressed: true, jumpHeld: true });
    run(single, 25, { jumpHeld: true });
    const vyBefore = single.vy;
    run(single, 1, { jumpPressed: true, jumpHeld: true });
    expect(single.vy).toBeGreaterThan(vyBefore);

    const double = new PlayerMotor(GROUND);
    double.maxJumps = 2;
    run(double, 1, { jumpPressed: true, jumpHeld: true });
    run(double, 25, { jumpHeld: true });
    run(double, 1, { jumpPressed: true, jumpHeld: true });
    expect(double.vy).toBeLessThan(0);
    run(double, 1, { jumpPressed: true, jumpHeld: true });
    run(double, 1, { jumpHeld: true });
    expect(double.vy).toBeGreaterThan(PLAYER.jumpVelocity); // third jump refused
  });

  it('bounces out of a hole (shield) and lands back on the ground', () => {
    const motor = new PlayerMotor(GROUND);
    // Walks off into a hole until the feet are deep enough to count as a fall.
    while (motor.feetY <= GROUND + PLAYER.holeDeathDepth) run(motor, 1, {}, null);
    motor.bounce();
    const top = run(motor, 120); // the floor is back (invulnerable)
    expect(top).toBeLessThan(GROUND - 40);
    expect(motor.grounded).toBe(true);
    expect(motor.feetY).toBe(GROUND);
  });

  it('a bounce keeps the double jump available', () => {
    const motor = new PlayerMotor(GROUND);
    motor.maxJumps = 2;
    while (motor.feetY <= GROUND + PLAYER.holeDeathDepth) run(motor, 1, {}, null);
    motor.bounce();
    run(motor, 10);
    const vyBefore = motor.vy;
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    expect(motor.vy).toBeLessThan(vyBefore);
    expect(motor.vy).toBe(PLAYER.jumpVelocity + (PLAYER.gravity * FRAME) / 1000);
  });

  it('reports jumps, air jumps, landings and ducks for the sounds and dust', () => {
    const motor = new PlayerMotor(GROUND);
    motor.maxJumps = 2;
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    expect(motor.events.jumped).toBe('ground');
    run(motor, 1, { jumpHeld: true });
    expect(motor.events.jumped).toBeNull();
    run(motor, 10);
    run(motor, 1, { jumpPressed: true, jumpHeld: true });
    expect(motor.events.jumped).toBe('air');
    run(motor, 1, { crouchPressed: true, crouchHeld: true });
    expect(motor.events.ducked).toBe(true); // fast fall
    let landed = 0;
    for (let i = 0; i < 120; i++) {
      run(motor, 1);
      if (motor.events.landed) landed += 1;
    }
    expect(landed).toBe(1);
    run(motor, 1, { crouchPressed: true, crouchHeld: true });
    expect(motor.events.ducked).toBe(true); // crouch on the ground
    run(motor, 1, { crouchHeld: true });
    expect(motor.events.ducked).toBe(false); // only when it starts
  });

  it('a bounce out of a hole is not a jump of the player (no jump sound)', () => {
    const motor = new PlayerMotor(GROUND);
    while (motor.feetY <= GROUND + PLAYER.holeDeathDepth) run(motor, 1, {}, null);
    motor.bounce();
    run(motor, 1);
    expect(motor.events.jumped).toBeNull();
  });
});
