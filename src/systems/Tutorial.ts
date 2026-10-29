/** The three steps of the first-run tutorial (spec §13.2), in order. */
export const TUTORIAL_STEPS = ['jump', 'crouch', 'shoot'] as const;
export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

/**
 * First-run tutorial (spec §13.2): each step waits until the player does it. Pure logic; the
 * Game scene shows the notices, holds the threats back until it is done and saves that it was seen.
 */
export class Tutorial {
  private index = 0;

  /** The step being asked for, or null once all are done. */
  get step(): TutorialStep | null {
    return TUTORIAL_STEPS[this.index] ?? null;
  }

  get done(): boolean {
    return this.step === null;
  }

  /** The player did `action`: returns true if it was the step being asked for (it moves on). */
  perform(action: string): boolean {
    if (action !== this.step) return false;
    this.index += 1;
    return true;
  }
}
