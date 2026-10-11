# Vault Runner — Assets

Pixel art generado por código (`/tools/assets/*.py`) con la paleta **Endesga 32**. Las reglas para usarlo están en **`DISENO.md`** y sus valores en `src/theme.ts`. Todo está a resolución nativa (320 × 180 lógico); el juego escala con `pixelArt: true`.

## Cómo integrarlo

1. Copia `public/assets/` dentro de `/public/assets` del repo.
2. Copia `src/theme.ts` a `/src`, y `DISENO.md` y `docs/` a la raíz del repo.
3. Copia `tools/assets/` al repo si quieres regenerar o ajustar el arte (`python3 tools/assets/build.py`, requiere Pillow).
4. `public/assets/manifest.json` lista cada spritesheet (key, url, frameWidth, frameHeight, frames) e imagen. La escena `Preload` puede recorrerlo:

```ts
const m = this.cache.json.get('manifest');
m.spritesheets.forEach((s) => this.load.spritesheet(s.key, s.url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight }));
m.images.forEach((i) => this.load.image(i.key, i.url));
m.bitmapFonts.forEach((f) => this.load.bitmapFont(f.key, f.textureURL, f.fontDataURL));
```

## Personaje (Fase 1)

Capas ya coloreadas (sin tinte en tiempo real), apiladas en este orden y con la misma rejilla:

| Capa | Archivo | Opciones |
|---|---|---|
| Cuerpo | `sprites/player/body_skin{0-3}.png` | 4 pieles |
| Ropa | `outfit_{estilo 0-3}_{color 0-7}.png` | Playera, Sudadera, Overol, Chamarra × 8 colores |
| Cabello | `hair_{estilo 1-4}_{color 0-5}.png` | estilo 0 = sin cabello (no se dibuja capa) |
| Accesorio | `accessory_{1-4}.png` | 0 = ninguno; gorra, lentes, audífonos, casco |
| Arma | `weapon_{0-2}.png` + `projectile_{0-2}.png` | Blaster, resortera, varita |

Cada hoja tiene 16 frames de 16 × 24: `0-5` correr, `6` subida, `7` caída, `8-9` agachado, `10-11` disparo, `12-15` muerte. Los pies están en la fila 23; el agachado ocupa las 14 filas inferiores. Las animaciones y frameRates sugeridos están en `manifest.notes.player`.

En Phaser, un `Container` con 5 sprites que reproducen la misma animación (misma key de frame) mantiene todas las capas sincronizadas.

## Resto del inventario

- **Enemigos** (miran a la izquierda): `bug` (4), `drone` (2), `turret` (idle, warn, fire, hit), `enemy_bullet` (2), `glitch` (idle ×2, teletransporte ×3).
- **Obstáculos por zona** `sprites/obstacles/zona{1-4}/`: `low`, `spikes` (16×16), `double` (32×16), `wall` (16×32), `air` (32×8, 2 frames), `saw` (16×16, 2 frames). Misma hitbox en todas las zonas.
- **Suelo** `tiles/zona{1-4}.png`: 8 tiles — `top_a, top_b, fill_a, fill_b, edgeL_top, edgeR_top, edgeL_fill, edgeR_fill` (bordes para los huecos).
- **Fondos** `backgrounds/zona{N}_{far|mid|near}.png`: 320 × 180, repetibles en horizontal; factores de parallax 0.1 / 0.3 / 0.6. Usar como `TileSprite`.
- **Pickups**: `coin` (4 frames), `powerups` (orden: escudo, imán, doble salto, disparo triple, ×2, turbo).
- **Efectos**: `explosion`, `muzzle`, `dust`, `spark`, `shield_bubble` (24×28), `aura` (20×28), `trail` (24×20).
- **UI**: `logo`, `button` (normal/hover/presionado, 9-slice de 5 px), `panel` (9-slice), `icons` (pausa, play, sonido on/off, música on/off, pantalla completa, reintentar, menú, dado, flechas, restablecer), `touch_{jump,crouch,shoot,pause}` (32×32, usar alpha ≈ 0.55).
- **Fuente** `fonts/vault5x7.png/.xml`: BitmapFont propia, solo mayúsculas, con ÁÉÍÓÚÜÑ ¡ ¿ × y flechas. Usar `text.toUpperCase()`.
- **Paleta** `palette/endesga32.{png,hex,gpl}` para cuantizar cualquier arte nuevo hecho con IA.

`screens/` contiene las pantallas de referencia (×1 y ×4) armadas con estos mismos archivos.

## Pendiente

Audio (7 pistas y 16 efectos) no está incluido.

## Licencia

Arte original creado para este proyecto; la paleta Endesga 32 es de uso libre.
