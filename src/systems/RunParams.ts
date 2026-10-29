import { SPAWN } from '../config';
import { randomSeed } from './Rng';

/** How a run starts: its seed, plus the development-only testing switches. */
export interface RunParams {
  seed: number;
  /** Distance the run starts at (m). Development builds only: `?startM=2250`. */
  startM: number;
  /** Nothing can kill the player. Development builds only: `?god=1`. */
  god: boolean;
  /** A run started with testing switches: it never saves the record or the stats. */
  debug: boolean;
}

/**
 * Reads the run parameters from the URL query (`location.search`). `?seed=N` works in every
 * build so a run can be replayed for the recordings (spec §11.3); the rest only in development.
 */
export function parseRunParams(search: string, dev: boolean, configSeed: number | null = SPAWN.seed): RunParams {
  const query = new URLSearchParams(search);
  const seedParam = toWhole(query.get('seed'));
  const seed = seedParam ?? configSeed ?? randomSeed();
  const startM = dev ? (toWhole(query.get('startM')) ?? 0) : 0;
  const god = dev && query.get('god') === '1';
  return { seed: seed >>> 0, startM, god, debug: startM > 0 || god };
}

function toWhole(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  return Number(value);
}
