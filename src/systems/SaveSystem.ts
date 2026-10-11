import { CHARACTER, SAVE } from '../config';

/** Character built in the editor (spec §8). Each number is an option index. */
export interface CharacterConfig {
  skin: number;
  outfit: number;
  outfitColor: number;
  hair: number;
  hairColor: number;
  accessory: number;
  weapon: number;
  name: string;
}

export interface SaveData {
  version: typeof SAVE.version;
  character: CharacterConfig;
  bestScore: number;
  bestDistance: number;
  stats: { runs: number; totalEnemiesKilled: number };
  settings: { music: boolean; sfx: boolean };
}

/** Minimal storage surface so tests can inject an in-memory implementation. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createDefaultCharacter(): CharacterConfig {
  return { skin: 1, outfit: 1, outfitColor: 4, hair: 2, hairColor: 0, accessory: 3, weapon: 0, name: '' };
}

/** Number of options per index field of CharacterConfig. */
const CHARACTER_OPTION_COUNTS: Record<Exclude<keyof CharacterConfig, 'name'>, number> = {
  skin: CHARACTER.skins,
  outfit: CHARACTER.outfits,
  outfitColor: CHARACTER.outfitColors,
  hair: CHARACTER.hairs,
  hairColor: CHARACTER.hairColors,
  accessory: CHARACTER.accessories,
  weapon: CHARACTER.weapons,
};

export function createDefaultSave(): SaveData {
  return {
    version: SAVE.version,
    character: createDefaultCharacter(),
    bestScore: 0,
    bestDistance: 0,
    stats: { runs: 0, totalEnemiesKilled: 0 },
    settings: { music: true, sfx: true },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIndex(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function isCharacter(value: unknown): value is CharacterConfig {
  if (!isRecord(value)) return false;
  const counts = Object.entries(CHARACTER_OPTION_COUNTS);
  return (
    counts.every(([key, count]) => isIndex(value[key]) && (value[key] as number) < count) &&
    typeof value.name === 'string' &&
    value.name.length <= SAVE.nameMaxLength
  );
}

function isSaveData(value: unknown): value is SaveData {
  if (!isRecord(value)) return false;
  const { stats, settings } = value;
  return (
    value.version === SAVE.version &&
    isCharacter(value.character) &&
    isNonNegative(value.bestScore) &&
    isNonNegative(value.bestDistance) &&
    isRecord(stats) &&
    isIndex(stats.runs) &&
    isIndex(stats.totalEnemiesKilled) &&
    isRecord(settings) &&
    typeof settings.music === 'boolean' &&
    typeof settings.sfx === 'boolean'
  );
}

/**
 * Parses a raw stored string. Anything missing, corrupt, malformed or from another
 * schema version yields the defaults instead of throwing (spec §7).
 */
export function parseSave(raw: string | null): SaveData {
  if (raw === null) return createDefaultSave();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSaveData(parsed) ? parsed : createDefaultSave();
  } catch {
    return createDefaultSave();
  }
}

function createMemoryStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

/** localStorage when usable (it can throw in private modes), otherwise an in-memory fallback. */
function resolveStorage(): KeyValueStorage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    // Access denied — fall through.
  }
  return createMemoryStorage();
}

export class SaveSystem {
  private current: SaveData;

  constructor(private readonly storage: KeyValueStorage = resolveStorage()) {
    this.current = this.load();
  }

  /** Current save data. Treat as read-only; change it through `update`. */
  get data(): Readonly<SaveData> {
    return this.current;
  }

  load(): SaveData {
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(SAVE.storageKey);
    } catch {
      raw = null;
    }
    this.current = parseSave(raw);
    return this.current;
  }

  /** Applies a change and persists immediately. */
  update(mutate: (data: SaveData) => void): void {
    mutate(this.current);
    this.persist();
  }

  reset(): void {
    this.current = createDefaultSave();
    this.persist();
  }

  private persist(): void {
    try {
      this.storage.setItem(SAVE.storageKey, JSON.stringify(this.current));
    } catch {
      // Quota exceeded or storage unavailable: keep playing with the in-memory copy.
    }
  }
}

/** Shared instance used by the scenes. */
export const saveSystem = new SaveSystem();
