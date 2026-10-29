import { describe, expect, it } from 'vitest';
import { BiomeSystem } from '../src/systems/BiomeSystem';

describe('BiomeSystem', () => {
  const biomes = new BiomeSystem();

  it('places each zone at its distances', () => {
    expect(biomes.zoneAt(0)).toEqual({ zone: 1, lap: 1 });
    expect(biomes.zoneAt(499.9)).toEqual({ zone: 1, lap: 1 });
    expect(biomes.zoneAt(500)).toEqual({ zone: 2, lap: 1 });
    expect(biomes.zoneAt(1499)).toEqual({ zone: 2, lap: 1 });
    expect(biomes.zoneAt(1500)).toEqual({ zone: 3, lap: 1 });
    expect(biomes.zoneAt(2999)).toEqual({ zone: 3, lap: 1 });
    expect(biomes.zoneAt(3000)).toEqual({ zone: 4, lap: 1 });
    expect(biomes.zoneAt(4999)).toEqual({ zone: 4, lap: 1 });
  });

  it('starts lap 2 at zone 1 after 5,000 m', () => {
    expect(biomes.zoneAt(5000)).toEqual({ zone: 1, lap: 2 });
    expect(biomes.zoneAt(5500)).toEqual({ zone: 2, lap: 2 });
    expect(biomes.zoneAt(10_000)).toEqual({ zone: 1, lap: 3 });
  });

  it('reports a change only once', () => {
    const system = new BiomeSystem();
    expect(system.update(0)).toEqual({ zone: 1, lap: 1 });
    expect(system.update(10)).toBeNull();
    expect(system.update(500)).toEqual({ zone: 2, lap: 1 });
    expect(system.update(501)).toBeNull();
    expect(system.update(5000)).toEqual({ zone: 1, lap: 2 });
    expect(system.state).toEqual({ zone: 1, lap: 2 });
  });
});
