import { describe, expect, it } from 'vitest';
import { SAVE } from '../src/config';
import {
  createDefaultSave,
  parseSave,
  SaveSystem,
  type KeyValueStorage,
} from '../src/systems/SaveSystem';

function memoryStorage(initial?: string): KeyValueStorage & { raw(): string | null } {
  let value: string | null = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
    raw: () => value,
  };
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error('denied');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('denied');
  },
};

describe('parseSave', () => {
  it('returns defaults when nothing is stored', () => {
    expect(parseSave(null)).toEqual(createDefaultSave());
  });

  it.each(['garbage', '', '{', 'null', '42', '[]', '"text"'])('returns defaults for corrupt data %j', (raw) => {
    expect(parseSave(raw)).toEqual(createDefaultSave());
  });

  it('returns defaults for another schema version', () => {
    const other = { ...createDefaultSave(), version: 99 };
    expect(parseSave(JSON.stringify(other))).toEqual(createDefaultSave());
  });

  it('returns defaults when a field has the wrong shape', () => {
    const cases: unknown[] = [
      { ...createDefaultSave(), bestScore: -1 },
      { ...createDefaultSave(), bestScore: '100' },
      { ...createDefaultSave(), settings: { music: 'yes', sfx: true } },
      { ...createDefaultSave(), stats: null },
      { ...createDefaultSave(), character: { ...createDefaultSave().character, skin: 1.5 } },
      { ...createDefaultSave(), character: { ...createDefaultSave().character, name: 'x'.repeat(SAVE.nameMaxLength + 1) } },
    ];
    for (const value of cases) {
      expect(parseSave(JSON.stringify(value))).toEqual(createDefaultSave());
    }
  });

  it('keeps valid data', () => {
    const valid = { ...createDefaultSave(), bestScore: 1234, settings: { music: false, sfx: true } };
    expect(parseSave(JSON.stringify(valid))).toEqual(valid);
  });
});

describe('SaveSystem', () => {
  it('persists updates and reloads them', () => {
    const storage = memoryStorage();
    const first = new SaveSystem(storage);
    first.update((data) => {
      data.bestScore = 500;
      data.character.name = 'Ana';
    });

    const second = new SaveSystem(storage);
    expect(second.data.bestScore).toBe(500);
    expect(second.data.character.name).toBe('Ana');
  });

  it('starts from defaults when stored data is garbage', () => {
    const system = new SaveSystem(memoryStorage('not json at all'));
    expect(system.data).toEqual(createDefaultSave());
  });

  it('survives a storage that throws on every call', () => {
    const system = new SaveSystem(throwingStorage);
    expect(system.data).toEqual(createDefaultSave());
    expect(() => system.update((data) => void (data.bestScore = 10))).not.toThrow();
    expect(system.data.bestScore).toBe(10);
  });

  it('reset writes the defaults back', () => {
    const storage = memoryStorage();
    const system = new SaveSystem(storage);
    system.update((data) => void (data.bestScore = 99));
    system.reset();
    expect(JSON.parse(storage.raw() ?? '')).toEqual(createDefaultSave());
  });
});
