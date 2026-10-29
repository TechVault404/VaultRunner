import Phaser from 'phaser';
import { SceneKey } from '../scenes/keys';
import { LAYOUT, SCREEN } from '../theme';

/** Game event emitted when the screen turns portrait, so gameplay can open its pause menu. */
export const PORTRAIT_EVENT = 'orientation-portrait';

/**
 * The game is landscape only (spec §3 "Diseño responsivo", §13.3). Whenever the available
 * area is taller than wide, the canvas switches to the portrait size and the Rotate scene
 * covers everything and pauses it; turning back restores the landscape size and resumes.
 * Start it once the assets are loaded (the Rotate scene uses the logo and the font).
 */
export function startOrientationGuard(game: Phaser.Game): void {
  let portrait = false;

  const check = () => {
    const { width, height } = game.scale.parentSize;
    const isPortrait = height > width;
    if (isPortrait === portrait) return;
    portrait = isPortrait;
    if (portrait) {
      game.events.emit(PORTRAIT_EVENT);
      game.scale.setGameSize(LAYOUT.rotate.size.w, LAYOUT.rotate.size.h);
      game.scene.start(SceneKey.Rotate);
    } else {
      game.scale.setGameSize(SCREEN.w, SCREEN.h);
      game.scene.stop(SceneKey.Rotate);
    }
  };

  game.scale.on(Phaser.Scale.Events.RESIZE, check);
  // Android can keep landscape while in fullscreen; iOS ignores this and the Rotate scene covers it.
  game.scale.on(Phaser.Scale.Events.ENTER_FULLSCREEN, lockLandscape);
  check();
}

function lockLandscape(): void {
  const orientation = screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> };
  orientation.lock?.('landscape').catch(() => {
    // Not supported or not allowed here: the Rotate scene still covers portrait.
  });
}
