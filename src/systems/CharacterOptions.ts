import { CHARACTER, SAVE } from '../config';
import type { CharacterConfig } from './SaveSystem';

/** Index fields of CharacterConfig (everything but the name). */
export type CharacterField = Exclude<keyof CharacterConfig, 'name'>;

/** Number of options per index field (spec §8; matches public/assets/manifest.json). */
export const OPTION_COUNTS: Record<CharacterField, number> = {
  skin: CHARACTER.skins,
  outfit: CHARACTER.outfits,
  outfitColor: CHARACTER.outfitColors,
  hair: CHARACTER.hairs,
  hairColor: CHARACTER.hairColors,
  accessory: CHARACTER.accessories,
  weapon: CHARACTER.weapons,
};

export const CHARACTER_FIELDS = Object.keys(OPTION_COUNTS) as CharacterField[];

/** Moves a field `delta` options forward or back, wrapping around. */
export function cycleOption(config: CharacterConfig, field: CharacterField, delta: number): CharacterConfig {
  const count = OPTION_COUNTS[field];
  return { ...config, [field]: (((config[field] + delta) % count) + count) % count };
}

/** A random valid character; keeps the given name. `rng` returns [0, 1) like Math.random. */
export function randomCharacter(name = '', rng: () => number = Math.random): CharacterConfig {
  const pick = (field: CharacterField) => {
    const count = OPTION_COUNTS[field];
    return Math.min(count - 1, Math.max(0, Math.floor(rng() * count)));
  };
  return {
    skin: pick('skin'),
    outfit: pick('outfit'),
    outfitColor: pick('outfitColor'),
    hair: pick('hair'),
    hairColor: pick('hairColor'),
    accessory: pick('accessory'),
    weapon: pick('weapon'),
    name,
  };
}

/** Upper-cases, drops characters the pixel font lacks and trims to the max length. */
export function sanitizeName(raw: string): string {
  return [...raw.toUpperCase()]
    .filter((ch) => CHARACTER.nameCharset.includes(ch))
    .join('')
    .slice(0, SAVE.nameMaxLength);
}
