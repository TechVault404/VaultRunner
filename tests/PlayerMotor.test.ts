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
});
