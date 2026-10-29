/** A hole's floorless span in screen px: [left, right). */
export interface Span {
  left: number;
  right: number;
}

/**
 * Whether there is floor under the player's hitbox [hitLeft, hitRight) (spec §11.1, holes).
 * Running, the player keeps their footing until the middle of the hitbox is over a hole;
 * in the air, any part of the hitbox over the floor is enough to land.
 */
export function hasFloor(hitLeft: number, hitRight: number, holes: readonly Span[], grounded: boolean): boolean {
  const middle = (hitLeft + hitRight) / 2;
  for (const hole of holes) {
    if (grounded && middle >= hole.left && middle < hole.right) return false;
    if (!grounded && hitLeft >= hole.left && hitRight <= hole.right) return false;
  }
  return true;
}
