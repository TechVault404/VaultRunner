import Phaser from 'phaser';
import { AUDIO } from '../config';
import { saveSystem } from './SaveSystem';
import { musicGain } from './volume';

export type SfxKey = keyof typeof AUDIO.sfx;

/**
 * Plays a sound effect if the "sfx" setting is on. Each key keeps a single instance that
 * restarts on replay, so repeated clicks never stack (spec §13.1).
 */
export function playSfx(scene: Phaser.Scene, key: SfxKey): void {
  if (!saveSystem.data.settings.sfx || !scene.cache.audio.exists(key)) return;
  const sound = scene.sound.get(key) ?? scene.sound.add(key, { volume: AUDIO.sfx[key] });
  sound.play();
}

interface Voice {
  key: string;
  sound: Phaser.Sound.BaseSound & { setVolume(v: number): unknown; setRate(r: number): unknown };
  /** Fade level 0–1 and where it is heading. */
  level: number;
  target: number;
  /** Level change per ms. */
  speed: number;
}

/**
 * Background music (spec §10.4): one looping track at a time with crossfades, a lower level
 * while paused, and one-shot jingles. Driven by the game's STEP event, so fades carry on
 * across scene changes and while the Game scene is paused. Follows `settings.musicVolume` (0 = off), and
 * waits for the browser to unlock audio (first interaction) before starting.
 */
export class MusicPlayer {
  private game: Phaser.Game | null = null;
  private voices: Voice[] = [];
  private wanted: string | null = null;
  private jingle: Phaser.Sound.BaseSound | null = null;
  private ducked = false;
  private rate = 1;

  attach(game: Phaser.Game): void {
    this.game = game;
    game.events.on(Phaser.Core.Events.STEP, (_time: number, delta: number) => this.step(delta));
    game.sound.once(Phaser.Sound.Events.UNLOCKED, () => this.refresh());
  }

  /** Plays `key` in a loop, fading in over `fadeMs` and fading out whatever else plays. Same key: keeps playing. */
  play(key: string, fadeMs: number = AUDIO.music.sceneFadeMs): void {
    if (key !== this.wanted) this.rate = 1;
    this.wanted = key;
    this.stopJingle();
    if (!this.canPlay()) return;
    for (const voice of this.voices) this.fade(voice, voice.key === key ? 1 : 0, fadeMs);
    if (!this.voices.some((voice) => voice.key === key)) this.startVoice(key, fadeMs);
  }

  /** Fades everything out; nothing plays until the next `play`. */
  stop(fadeMs: number): void {
    this.wanted = null;
    for (const voice of this.voices) this.fade(voice, 0, fadeMs);
  }

  /** One-shot track (game over, new record). */
  playJingle(key: string): void {
    this.stopJingle();
    const game = this.game;
    if (!game || !this.canPlay() || !game.cache.audio.exists(key)) return;
    this.jingle = game.sound.add(key, { volume: this.jingleGain() });
    this.jingle.once(Phaser.Sound.Events.COMPLETE, () => this.stopJingle());
    this.jingle.play();
  }

  /** Lower level while the game is paused. */
  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    this.applyVolumes();
  }

  get isDucked(): boolean {
    return this.ducked;
  }

  /** Playback rate of the current track (faster at high difficulty). */
  setRate(rate: number): void {
    if (rate === this.rate) return;
    this.rate = rate;
    this.voices.find((voice) => voice.key === this.wanted)?.sound.setRate(rate);
  }

  /** Call after the volume changes: applies it now, stops at 0, resumes the wanted track above 0. */
  refresh(): void {
    if (!this.canPlay()) {
      for (const voice of this.voices) this.fade(voice, 0, 0);
      this.stopJingle();
      return;
    }
    if (this.wanted) this.play(this.wanted);
    this.applyVolumes();
  }

  /** Key of the track that is (or will be) playing, for tests and debugging. */
  get current(): string | null {
    return this.wanted;
  }

  private canPlay(): boolean {
    return !!this.game && saveSystem.data.settings.musicVolume > 0 && !this.game.sound.locked;
  }

  private startVoice(key: string, fadeMs: number): void {
    const game = this.game;
    if (!game || !game.cache.audio.exists(key)) return;
    const sound = game.sound.add(key, { loop: true, volume: 0 }) as Voice['sound'];
    const voice: Voice = { key, sound, level: fadeMs > 0 ? 0 : 1, target: 1, speed: 0 };
    this.fade(voice, 1, fadeMs);
    this.voices.push(voice);
    sound.play();
    sound.setRate(this.rate);
    this.applyVolumes();
  }

  private fade(voice: Voice, target: number, fadeMs: number): void {
    voice.target = target;
    if (fadeMs <= 0) voice.level = target;
    voice.speed = fadeMs > 0 ? 1 / fadeMs : 0;
  }

  private step(deltaMs: number): void {
    if (this.voices.length === 0) return;
    for (const voice of this.voices) {
      const diff = voice.target - voice.level;
      const move = voice.speed * deltaMs;
      voice.level = Math.abs(diff) <= move ? voice.target : voice.level + Math.sign(diff) * move;
    }
    // Silent voices that are fading out are done.
    this.voices = this.voices.filter((voice) => {
      if (voice.level > 0 || voice.target > 0) return true;
      voice.sound.destroy();
      return false;
    });
    this.applyVolumes();
  }

  private applyVolumes(): void {
    const volume = musicGain(saveSystem.data.settings.musicVolume);
    const duck = this.ducked ? AUDIO.music.pausedLevel : 1;
    for (const voice of this.voices) voice.sound.setVolume(volume * voice.level * duck);
    (this.jingle as Voice['sound'] | null)?.setVolume(this.jingleGain());
  }

  private jingleGain(): number {
    return Math.min(1, musicGain(saveSystem.data.settings.musicVolume) * AUDIO.music.jingleBoost);
  }

  private stopJingle(): void {
    this.jingle?.destroy();
    this.jingle = null;
  }
}

/** Shared music player; attached to the game in PreloadScene. */
export const music = new MusicPlayer();
