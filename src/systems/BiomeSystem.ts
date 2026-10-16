import { BIOMES } from '../config';

export type BiomeConfig = typeof BIOMES;

/** Zone 1–4 and lap (1 = first) at a distance. */
export interface ZoneState {
  zone: number;
  lap: number;
}

/**
 * Zones by distance (spec §10.1): Ciudad Pixel, Bosque Glitch, Servidor Abandonado and
 * Núcleo de la IA, then the cycle repeats from zone 1 (lap 2, 3…).
 */
export class BiomeSystem {
  private current: ZoneState | null = null;

  constructor(private readonly config: BiomeConfig = BIOMES) {}

  zoneAt(distanceM: number): ZoneState {
    const { startsM, lapM } = this.config;
    const d = Math.max(0, distanceM);
    const lap = Math.floor(d / lapM) + 1;
    const inLap = d % lapM;
    let zone = 1;
    startsM.forEach((start, i) => {
      if (inLap >= start) zone = i + 1;
    });
    return { zone, lap };
  }

  get state(): ZoneState | null {
    return this.current;
  }

  /** Returns the new state when the zone or lap changes (and on the first call), otherwise null. */
  update(distanceM: number): ZoneState | null {
    const next = this.zoneAt(distanceM);
    if (this.current && this.current.zone === next.zone && this.current.lap === next.lap) return null;
    this.current = next;
    return next;
  }
}
