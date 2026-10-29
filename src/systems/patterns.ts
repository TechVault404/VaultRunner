import { SPAWN } from '../config';

export type ThreatKind = keyof typeof SPAWN.kinds;
export type Tier = 'easy' | 'medium' | 'hard';
export type Lane = 'low' | 'high';

/** Ground threats: they block the low lane and are jumped over. */
const GROUND: readonly ThreatKind[] = ['low', 'spikes', 'wall', 'double', 'saw', 'hole', 'bug', 'turret', 'glitch'];
/** What a drone may fly over: you short-jump between them or shoot the drone first. */
const UNDER_DRONE: readonly ThreatKind[] = ['low', 'spikes'];

/**
 * One beat of a pattern: the threats that reach the player together. The SpawnPlanner puts
 * at least the fairness gap (spec §11.3) between two steps, so patterns never state distances.
 */
export interface PatternStep {
  kinds: readonly ThreatKind[];
  /** Coins: an arc over this step (full jump) or a row on the ground in the gap before it. */
  coins?: 'arc' | 'row';
  /** Extra room before this step on top of the fairness gap (px). */
  extraGap?: number;
}

export interface Pattern {
  id: string;
  tier: Tier;
  /** Lowest difficulty level (0–1) it can be picked at. */
  minLevel: number;
  steps: readonly PatternStep[];
}

const step = (kinds: ThreatKind[], extra: Omit<PatternStep, 'kinds'> = {}): PatternStep => ({ kinds, ...extra });

/** The chunks the world is built from (spec §11.3: at least 15, in three tiers). */
export const PATTERNS: readonly Pattern[] = [
  // Easy
  { id: 'caja', tier: 'easy', minLevel: 0, steps: [step(['low'], { coins: 'arc' })] },
  { id: 'pinchos', tier: 'easy', minLevel: 0, steps: [step(['spikes'], { coins: 'row' })] },
  { id: 'caja-pinchos', tier: 'easy', minLevel: 0, steps: [step(['low']), step(['spikes'])] },
  { id: 'bug', tier: 'easy', minLevel: 0, steps: [step(['bug'], { coins: 'row' })] },
  { id: 'barra', tier: 'easy', minLevel: 0, steps: [step(['air'], { coins: 'row' })] },
  { id: 'caja-espacio-barra', tier: 'easy', minLevel: 0, steps: [step(['low']), step(['air'], { extraGap: 24 })] },
  { id: 'muro', tier: 'easy', minLevel: 0, steps: [step(['wall'], { coins: 'arc' })] },
  // Medium
  { id: 'doble', tier: 'medium', minLevel: 0.1, steps: [step(['double'], { coins: 'arc' })] },
  { id: 'dron', tier: 'medium', minLevel: 0.1, steps: [step(['drone'], { coins: 'row' })] },
  { id: 'dron-sobre-caja', tier: 'medium', minLevel: 0.1, steps: [step(['low', 'drone'])] },
  { id: 'bug-barra', tier: 'medium', minLevel: 0.1, steps: [step(['bug']), step(['air'])] },
  { id: 'muro-barra-caja', tier: 'medium', minLevel: 0.15, steps: [step(['wall']), step(['air']), step(['low'])] },
  { id: 'torreta', tier: 'medium', minLevel: 0.1, steps: [step(['turret'], { coins: 'row' })] },
  { id: 'pinchos-dron-pinchos', tier: 'medium', minLevel: 0.15, steps: [step(['spikes']), step(['drone']), step(['spikes'])] },
  // Hard
  { id: 'sierra', tier: 'hard', minLevel: 0.3, steps: [step(['saw'])] },
  { id: 'hueco', tier: 'hard', minLevel: 0.3, steps: [step(['hole'], { coins: 'arc' })] },
  { id: 'hueco-sierra', tier: 'hard', minLevel: 0.4, steps: [step(['hole']), step(['saw'])] },
  { id: 'doble-torreta', tier: 'hard', minLevel: 0.3, steps: [step(['double']), step(['turret'])] },
  { id: 'glitch', tier: 'hard', minLevel: 0.3, steps: [step(['glitch'])] },
  { id: 'escalera', tier: 'hard', minLevel: 0.3, steps: [step(['low']), step(['wall']), step(['double'], { coins: 'arc' })] },
  { id: 'barra-hueco-barra', tier: 'hard', minLevel: 0.4, steps: [step(['air']), step(['hole']), step(['air'])] },
  { id: 'glitch-bug', tier: 'hard', minLevel: 0.5, steps: [step(['glitch']), step(['bug'])] },
];

/** Kinds that move relative to the ground, so coins can't be placed over them. */
const MOVING: readonly ThreatKind[] = ['bug', 'drone', 'turret', 'glitch', 'saw'];

/**
 * Problems that would make a pattern impossible or unfair (empty = valid). Inside one step:
 * the air bar (crouch) never shares a step with anything, there is at most one ground threat,
 * and a second threat can only be a drone over a box or spikes.
 */
export function validatePattern(pattern: Pattern): string[] {
  const errors: string[] = [];
  if (pattern.steps.length === 0) errors.push(`${pattern.id}: no steps`);
  pattern.steps.forEach(({ kinds, coins }, i) => {
    const where = `${pattern.id} step ${i + 1}`;
    if (kinds.length === 0) errors.push(`${where}: empty`);
    if (kinds.length > 2) errors.push(`${where}: more than 2 threats`);
    if (kinds.includes('air') && kinds.length > 1) errors.push(`${where}: air bar with something else`);
    if (kinds.filter((k) => GROUND.includes(k)).length > 1) errors.push(`${where}: two ground threats`);
    if (kinds.length === 2) {
      const [a, b] = kinds;
      const ok = (a === 'drone' && UNDER_DRONE.includes(b!)) || (b === 'drone' && UNDER_DRONE.includes(a!));
      if (!ok) errors.push(`${where}: only a drone over a box or spikes can share a step`);
    }
    if (coins === 'arc' && kinds.some((k) => MOVING.includes(k) || k === 'air')) {
      errors.push(`${where}: coin arcs only go over still ground obstacles`);
    }
  });
  return errors;
}

/** Distance (m) from which every kind in the pattern is allowed. */
export function patternMinM(pattern: Pattern): number {
  return Math.max(...pattern.steps.flatMap((s) => s.kinds.map((k) => SPAWN.kinds[k].minM)));
}
