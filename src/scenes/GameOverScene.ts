import Phaser from 'phaser';
import { Backdrop } from '../entities/Backdrop';
import { CharacterSprite } from '../entities/CharacterSprite';
import { AUDIO } from '../config';
import { music } from '../systems/AudioSystem';
import { InputSystem } from '../systems/InputSystem';
import { saveSystem } from '../systems/SaveSystem';
import { COLOR, FONT, fmtDistance, fmtNumber, LAYOUT, SCREEN, UI } from '../theme';
import { Button } from '../ui/Button';
import { ButtonList } from '../ui/ButtonList';
import { addOverlay, addPanel } from '../ui/panels';
import { pixelText } from '../ui/text';
import { fadeIn, fadeToScene } from '../ui/transitions';
import type { GameOverData } from './GameScene';
import { SceneKey } from './keys';

/** Reference: screens/08_gameover.png */
export class GameOverScene extends Phaser.Scene {
  private inputSystem!: InputSystem;
  private buttons!: ButtonList;
  private result!: GameOverData;

  constructor() {
    super(SceneKey.GameOver);
  }

  init(data: Partial<GameOverData>): void {
    this.result = {
      score: data.score ?? 0,
      distance: data.distance ?? 0,
      enemies: data.enemies ?? 0,
      coins: data.coins ?? 0,
      previousBest: data.previousBest ?? saveSystem.data.bestScore,
      newRecord: data.newRecord ?? false,
    };
  }

  create(): void {
    fadeIn(this);
    music.playJingle(this.result.newRecord ? AUDIO.music.record : AUDIO.music.gameOver);
    this.inputSystem = new InputSystem(this);
    const layout = LAYOUT.gameOver;
    const character = saveSystem.data.character;

    new Backdrop(this, 1);
    addOverlay(this, UI.overlay.gameOver);
    if (this.result.newRecord) this.addRecordBanner();

    addPanel(this, layout.panel);
    const pose = layout.character;
    new CharacterSprite(this, pose.x, pose.feetY, character, pose.scale).play('jump');
    if (character.name) {
      pixelText(this, layout.name.x, layout.name.y, character.name, { color: COLOR.record, align: 'center' });
    }
    this.addStatRows();

    this.buttons = new ButtonList(this.inputSystem, [
      new Button(this, layout.retry, { label: 'REINTENTAR', icon: 'retry', onClick: () => fadeToScene(this, SceneKey.Game) }),
      new Button(this, layout.menu, { label: 'MENÚ', icon: 'home', onClick: () => fadeToScene(this, SceneKey.Menu) }),
    ]);
  }

  update(): void {
    this.inputSystem.update();
    this.buttons.update();
  }

  /** Label left in textMuted, value right in its semantic color, 1 px separators (DISENO §7.4). */
  private addStatRows(): void {
    const { labelX, valueX, y, step, separatorDy } = LAYOUT.gameOver.rows;
    const { score, distance, enemies, coins, previousBest } = this.result;
    const rows: [string, string, number][] = [
      ['PUNTAJE', fmtNumber(score), COLOR.textPrimary],
      ['DISTANCIA', fmtDistance(distance), COLOR.accent],
      ['ENEMIGOS', fmtNumber(enemies), COLOR.enemyKill],
      ['MONEDAS', fmtNumber(coins), COLOR.record],
      ['RÉCORD PREVIO', fmtNumber(previousBest), COLOR.textMuted],
    ];
    rows.forEach(([label, value, color], i) => {
      const rowY = y + i * step;
      pixelText(this, labelX, rowY, label, { color: COLOR.textMuted });
      pixelText(this, valueX, rowY, value, { color, align: 'right' });
      if (i < rows.length - 1) {
        this.add.rectangle(labelX, rowY + separatorDy, valueX - labelX + 1, 1, COLOR.surface).setOrigin(0);
      }
    });
  }

  /** Amber "¡NUEVO RÉCORD!" banner (DISENO §9). */
  private addRecordBanner(): void {
    const { area, textY, edge, fill, highlight, shade, textShadow, sparks } = LAYOUT.gameOver.banner;
    this.add.rectangle(area.x, area.y, area.w, area.h, fill).setOrigin(0);
    this.add.rectangle(area.x, area.y, area.w, edge, highlight).setOrigin(0);
    this.add.rectangle(area.x, area.y + area.h - edge, area.w, edge, shade).setOrigin(0);
    pixelText(this, SCREEN.cx, textY, '¡NUEVO RÉCORD!', {
      scale: FONT.scale.title,
      shadow: textShadow,
      align: 'center',
    });
    for (const spark of sparks) this.add.image(spark.x, spark.y, 'fx_spark', spark.frame).setOrigin(0);
  }
}
