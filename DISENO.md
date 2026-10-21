# Vault Runner — Estándar de diseño

Reglas para implementar cualquier pantalla, sistema o asset nuevo de forma que se vea como el resto del juego. Va junto al documento de especificaciones: la especificación dice **qué** hace el juego; este estándar dice **cómo se ve y cómo se siente**.

**Archivos que lo acompañan**

| Archivo | Para qué |
|---|---|
| `src/theme.ts` | Todos los valores de este documento como constantes (colores, tipografía, medidas, HUD, capas, tiempos). El código importa de aquí. |
| `docs/diseno/hud_anatomia.png` | HUD numerado (sección 8). |
| `docs/diseno/componentes.png` | Componentes numerados (sección 7). |
| `docs/diseno/rejilla_escena.png` | Rejilla de 16 px, suelo y carriles (sección 3). |
| `screens/*.png` | Pantallas de referencia (×1 y ×4). Cuando haya duda, la pantalla de referencia manda. |
| `tools/assets/validate.py` | Revisa que el arte nuevo cumpla la sección 12. |

> **Ajuste al documento de especificaciones.** La regla "ningún número mágico fuera de `config.ts`" se amplía a: *ningún número mágico fuera de `config.ts` (balance) y `theme.ts` (visual)*. Agrega esta línea al prompt de sistema de cada fase:
> *"Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas."*

---

## 1. Principios

1. **Pixel perfecto o nada.** Todo vive en una rejilla de 320 × 180 px lógicos. Posiciones enteras, escalas enteras, sin suavizado ni rotaciones libres.
2. **Una paleta.** Solo los 32 colores de Endesga 32. Si un color no está en `PALETTE`, no existe.
3. **Legible a 1×.** Cada sprite tiene contorno oscuro de 1 px y cada texto tiene sombra de 1 px. Todo debe leerse sobre cualquiera de las 4 zonas.
4. **El color comunica.** Cian = tu progreso / selección. Ámbar = récord y monedas. Amarillo = puntos ganados. Neón (rojo) = peligro. No se reutilizan para otra cosa.
5. **La acción manda.** La franja central (y 40–147) es para jugar; la UI vive en los bordes y nunca tapa el carril del jugador durante la partida.

---

## 2. Lienzo, escalado y unidades

- Resolución lógica **320 × 180**; Phaser con `pixelArt: true`, `roundPixels: true`, `Scale.FIT` y centrado.
- Todas las medidas de este documento están en **px lógicos**. Un botón táctil de 32 px lógicos mide ≥ 80 px reales en un teléfono horizontal típico.
- Margen seguro: **5 px** en los cuatro bordes (`SCREEN.safe`). Nada de UI fuera de él.
- Posiciones siempre enteras: usa `Math.round` al colocar UI y al terminar un tween.
- Escala de sprites: **×1** en el juego. Solo se amplían vistas previas (×2 en el menú, ×4 en el editor) y siempre por enteros.

## 3. Rejilla de la escena

Ver `docs/diseno/rejilla_escena.png`.

| Elemento | Valor |
|---|---|
| Tile | 16 × 16 |
| Superficie del suelo | y = 148 (las 2 filas de tiles inferiores son suelo) |
| Posición del jugador | x = 64 (borde izquierdo del frame), pies en y = 148 |
| Carril alto (se esquiva agachándose) | y 124–131: barras, láseres, Glitch alto |
| Carril bajo (se esquiva saltando) | y 132–147: cajas, pinchos, bugs, balas de torreta bajas |
| Zona de amenazas aéreas | y 70–120: drones, monedas en arco, powerups |
| Zona libre de UI en juego | y 40–147 (solo carteles temporales, sección 7.8) |

Obstáculos y enemigos se apoyan en el suelo con **origen abajo-centro** (`setOrigin(0.5, 1)` en y = 148). Los aéreos usan origen arriba-izquierda en su y de carril.

---

## 4. Color

Nunca escribas hexadecimales en el código: usa `COLOR.*` (semántico) y, si no existe el rol, `PALETTE.*`. Para estilos de texto usa `css('nombre')`.

| Rol (`COLOR.`) | Paleta | Uso |
|---|---|---|
| `bg` | black `#181425` | Fondo de escenas sin escenario |
| `surface` | dnavy `#262b44` | Paneles, separadores de filas |
| `surfaceRaised` | navy `#3a4466` | Celdas, vista previa, filas seleccionables |
| `outline` | black `#181425` | Contorno de sprites y sombra de texto |
| `textPrimary` | white | Puntaje, valores, texto de botones |
| `textSecondary` | lgray | Opciones no seleccionadas, texto de apoyo |
| `textMuted` | gray | Etiquetas: RÉCORD, PIEL, PUNTAJE |
| `textDisabled` | dgray | Ayudas de teclado, deshabilitado |
| `accent` | cyan | Distancia, selección, foco, cartel de zona, barras de tiempo |
| `accentStrong` / `accentDeep` | blue / dblue | Botón normal / presionado y sombra del texto de botón |
| `record` | amber | Récord, monedas, nombre del jugador, "¡NUEVO RÉCORD!" |
| `points` | yellow | Textos flotantes (+10, +50, ×2) |
| `danger` | neon `#ff0044` | Aviso de torreta, barra de powerup por agotarse |

**Reglas**
- **Transparencia solo en capas de UI**: overlays negros (`UI.overlay.*`) y botones táctiles (`UI.touch.alpha`). Los sprites tienen alfa 0 o 255, sin intermedios.
- **Tinte permitido solo para efectos**: destello de daño con `setTintFill(COLOR.textPrimary)` durante `TIMING.hitFlash`. No uses `setTint` para recolorear personajes: las variantes ya vienen pintadas.
- **Colores de zona** (`ZONE_COLORS`): solo para el cartel de zona, partículas y flashes de esa zona. No cambian la UI.
- **Nunca solo color**: todo estado que se comunica con color tiene una segunda señal (parpadeo, icono o texto).

## 5. Tipografía

Fuente única: **Vault 5×7** (`FONT.key = 'vault'`, BitmapFont). Solo mayúsculas: pasa todo texto por `toUpperCase()`.

| Estilo | Escala | Uso | Ejemplo |
|---|---|---|---|
| Display | ×3 | Logo y momentos únicos | (logo) |
| Título | ×2 | Título de overlay, banner de récord | PAUSA, ¡NUEVO RÉCORD! |
| Cuerpo | ×1 | Todo lo demás | botones, HUD, filas, avisos |

- Altura de línea **11 px** a ×1 (glifo de 7 px + acentos). Entre líneas de una lista: 14–16 px.
- **Sombra dura** de 1 px abajo-derecha en `COLOR.outline` para todo texto sobre escenario. Excepciones: texto dentro de botones (sombra `accentDeep`) y ayudas `textDisabled` (sin sombra).
- Escalas solo enteras; nunca `setFontSize` intermedio.
- Alineación: etiquetas a la izquierda, valores numéricos a la derecha, títulos y botones centrados.

**Números**
- HUD: 7 dígitos con ceros a la izquierda → `fmtScoreHud(1284)` = `0001284`.
- Menús y Game Over: separador de miles es-MX → `fmtNumber(12480)` = `12,480`.
- Distancia: `fmtDistance(812)` = `812 M`.

```ts
// Texto estándar con sombra (helper sugerido en /src/ui/text.ts)
export function pixelText(scene: Phaser.Scene, x: number, y: number, msg: string,
  color: number = COLOR.textPrimary, scale = FONT.scale.body, shadow: number | null = COLOR.outline) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const size = FONT.size * scale;
  if (shadow !== null) c.add(scene.add.bitmapText(FONT.shadowOffset * scale, FONT.shadowOffset * scale, FONT.key, msg.toUpperCase(), size).setTint(shadow));
  c.add(scene.add.bitmapText(0, 0, FONT.key, msg.toUpperCase(), size).setTint(color));
  return c;
}
```

## 6. Espaciado

Escala única (`SPACE`): **2 · 4 · 6 · 8 · 12 · 16 · 24**.

- Entre botones apilados: 4 px. Entre grupos: 12–16 px.
- Relleno interno de panel: 8 px.
- Ícono + texto dentro de un botón: 3 px.
- Separación entre elementos del HUD: 10 px en vertical (filas en y = 5, 15, 25).

---

## 7. Componentes

Numeración según `docs/diseno/componentes.png`.

### 7.1 Botón primario (1)
- `ui/button.png` en 9-slice (bordes de 5 px). Alto **18**, ancho mínimo 60.
- Se muestra con el frame **hover** (cian) porque tiene el foco por defecto. **Uno por pantalla**: la acción principal (JUGAR, GUARDAR Y JUGAR, CONTINUAR, REINTENTAR).
- Ícono opcional de 12 px a la izquierda del texto, separado 3 px; el conjunto va centrado.

### 7.2 Botón secundario (2) y presionado (3)
- Alto **16**, frame normal (azul). Mismo ancho que el primario de su grupo cuando van apilados.
- **Estados**: normal → hover/foco (frame 1) → presionado (frame 2, texto e ícono bajan 1 px). Al soltar, mantener presionado `TIMING.buttonPress` (80 ms) y luego ejecutar la acción.
- Teclado: ↑/↓ mueven el foco, Enter/Espacio confirma. El foco usa el mismo frame que hover.

### 7.3 Botón de ícono (4)
- 18 × 18, frame normal, ícono 12 × 12 centrado. Para música, sonido y pantalla completa (arriba a la derecha, separados 4 px).
- Interruptores: el ícono cambia (`sound_on` ↔ `sound_off`); el botón no cambia de color. El de música abre el panel de volumen (`LAYOUT.volume`) y muestra `music_off` cuando el volumen es 0.

### 7.4 Panel y filas de estadísticas (5)
- `ui/panel.png` en 9-slice. Relleno 8 px.
- Fila: etiqueta `textMuted` a la izquierda, valor a la derecha con su color semántico, separador de 1 px `surface` entre filas (no después de la última).

### 7.5 Selector ◀ ▶ (6)
- Panel de 13 px de alto, flechas `arrow_l`/`arrow_r` en los extremos, valor centrado.
- Seleccionado: relleno `accentDeep` y valor `textPrimary`. No seleccionado: valor `textSecondary`.
- Encima, la etiqueta de la categoría en `textMuted`.

### 7.6 Muestras de color (7)
- Rectángulo con la rampa del color (1 fila de luz arriba, 2 de sombra abajo).
- Seleccionada: marco blanco de 2 px alrededor. Separación entre muestras: 5 px.

### 7.7 Texto (8, 9)
- Ver sección 5. El texto flotante de puntos (`+50`) usa `points`, sube `TIMING.floatingText.rise` px y desaparece en `TIMING.floatingText.duration` ms. Si hay ×2 activo, muestra el valor ya duplicado.

### 7.8 Cartel y aviso (10)
- **Cartel de zona**: banda negra de lado a lado al 60–70 % (`HUD.banner`), líneas cian de 1 px arriba y abajo, "ZONA N" en `accent` y el nombre en `textPrimary`. Entra 250 ms, se queda 1.5 s, sale 250 ms.
- **Aviso** (¡RÉCORD SUPERADO!, tutorial): caja negra al 60 % ajustada al texto + 6 px por lado, centrada en x = 160, y = 30. Se muestra una vez, 1.5 s.
- Solo un cartel o aviso a la vez; si coinciden, el cartel de zona tiene prioridad.

### 7.9 Overlay modal
- Rectángulo negro de pantalla completa con `UI.overlay.pause` (0.65) o `gameOver` (0.7), luego panel centrado. Se congela el juego debajo, no se oculta.

### 7.10 Botones táctiles
- `ui/touch_*.png`, 32 × 32, alfa `UI.touch.alpha` (0.55), frame `pressed` mientras se toca.
- Agacharse abajo-izquierda (8, 140); disparar abajo-derecha (280, 140); pausa arriba-derecha. Saltar = tocar cualquier punto de la mitad izquierda que no sea un botón.
- Solo se crean en dispositivos táctiles (`this.sys.game.device.input.touch`).

---

## 8. HUD

Ver `docs/diseno/hud_anatomia.png`. Valores en `HUD.*`.

| # | Elemento | Posición | Estilo |
|---|---|---|---|
| 1 | Puntaje | (5, 5) | `textPrimary`, 7 dígitos |
| 2 | Récord | (5, 15) | `RÉCORD 0012480` en `textMuted`; al superarlo pasa a `record` y parpadea 3 veces |
| 3 | Distancia | (5, 25) | `accent`, `812 M` |
| 4 | Powerups activos | desde x = 288 hacia la izquierda, cada 18 px | Caja negra 55 %, ícono 12 px, barra de 11 × 2 px en `accent`; < 25 % → `danger`; últimos 2 s → el ícono parpadea a 4 Hz |
| 5 | Pausa | (299, 5), 16 × 16 | `touch_pause` reducido; también en escritorio |
| 6 | Aviso temporal | centro, y = 30 | Sección 7.8 |
| 7 | Suelo | y = 148 | Referencia de alineación |
| 8 | Hitbox del jugador | 12 × 20 | Solo visible en modo debug (F1) |

Las líneas magenta de la lámina marcan el margen seguro de 5 px. El orden de los powerups en el HUD es el orden en que se recogieron (el más reciente a la izquierda). El indicador "×2" junto a su ícono es opcional.

---

## 9. Pantallas

Construye cada escena copiando la composición de su pantalla de referencia en `screens/`.

| Escena | Referencia | Reglas clave |
|---|---|---|
| Menu | `01_menu` | Fondo de la Zona 1 en movimiento lento + overlay 0.25. Logo centrado arriba (y = 10). Personaje ×2 corriendo en x = 56. Botones centrados en x = 160 desde y = 74. Récord en panel bajo los botones. Íconos de ajustes arriba-derecha. |
| CharacterEditor | `02_editor` | Tres columnas: categorías (x 6–110), vista previa ×4 (x 118–202), colores y nombre (x 210–314). Botones abajo en y = 150. Foco inicial: la primera categoría. |
| Game | `03`–`06`, `09` | HUD (sección 8). Nada fijo en la franja de juego. |
| Pause | `07_pausa` | Overlay 0.65 sobre el juego congelado, panel 112 × 100 centrado, título ×2, 3 botones apilados (primario: CONTINUAR). |
| GameOver | `08_gameover` | Banner ámbar de récord arriba (solo si hay récord), panel con personaje ×2 y 5 filas de estadísticas, REINTENTAR (primario) y MENÚ abajo. |
| Vertical (móvil) | `10_gira_telefono` | Overlay HTML/canvas a pantalla completa que pausa el juego. |

Transición entre escenas: fade a negro de `TIMING.sceneFade` (200 ms).

---

## 10. Sprites en juego

**Origen y alineación**
- Jugador, enemigos de suelo y obstáculos de suelo: `setOrigin(0.5, 1)`, y = 148.
- Personaje = `Container` con hasta 5 sprites (cuerpo, ropa, cabello, accesorio, arma) que reproducen **la misma clave de frame** en cada actualización. Nunca animes las capas por separado.
- Enemigos miran a la **izquierda**; el jugador a la **derecha**. No uses `flipX` en ninguno.

**Capas de dibujo** (`DEPTH`): fondo lejano 0 → medio 1 → cercano 2 → suelo 10 → obstáculos 20 → pickups 25 → enemigos 30 → balas enemigas 35 → efectos detrás del jugador 39 (aura, estela) → jugador 40 → efectos del jugador 41 → proyectiles 45 → efectos 50 → textos flotantes 60 → HUD 100 → botones táctiles 110 → overlays 200 → transiciones 300.

**Animaciones**
- Claves: `<asset>_<acción>` → `player_run`, `enemy_drone_fly`, `zona3_saw_spin`.
- FPS en `ANIM_FPS` (correr 12, agachado 6, disparo 12, muerte 10…).
- El disparo es una animación de 2 frames que vuelve a la animación anterior al terminar.

**Efectos visuales**
| Efecto | Asset | Regla |
|---|---|---|
| Daño a enemigo | — | `setTintFill(blanco)` 80 ms |
| Muerte de enemigo | `explosion` | Centrada en el enemigo, 300 ms, + hit-stop 40 ms + sacudida ligera |
| Invulnerable | — | Alternar `visible` a 10 Hz |
| Escudo | `fx_shield` | Centrada en el jugador (−4, −2 px respecto al frame) |
| Turbo / ×2 | `fx_aura` | Centrada en el jugador |
| Turbo | `fx_trail` | Detrás del jugador, pegada a su borde izquierdo |
| Correr / aterrizar | `fx_dust` | En los pies, se queda en el mundo (se desplaza con el suelo) |
| Disparo | `muzzle` | En la punta del arma, 2 frames |
| Moneda recogida | `fx_spark` | En la posición de la moneda |

---

## 11. Movimiento y tiempos

Todos en `TIMING` y `SHAKE`.

- **Easing**: `Linear` para desplazamientos del mundo; `Quad.easeOut` para UI que entra; `Quad.easeIn` para UI que sale. Nada de `Back`, `Elastic` ni `Bounce`: rompen la estética.
- Los tweens de UI terminan en posiciones enteras (`onComplete` → `Math.round`).
- Parpadeos por alternar visibilidad, no por alfa.
- Sacudida ligera (100 ms) al eliminar un enemigo; fuerte (200 ms) al morir.
- Powerups flotando: ±2 px con periodo de 1.2 s.

---

## 12. Crear assets nuevos

Todo asset nuevo, hecho con IA o a mano, pasa por este proceso:

1. **Generar** con el prompt base de la especificación (sección 4), indicando el tamaño exacto en px.
2. **Reducir** a tamaño real con vecino más cercano. Nunca reescalar con suavizado.
3. **Cuantizar** a `public/assets/palette/endesga32.gpl` (Aseprite: *Sprite › Color Mode › Indexed*; GIMP: *Imagen › Modo › Indexado › Usar paleta personalizada*), sin dither.
4. **Pulir**: contorno exterior de 1 px en `black`, rampa de 3 tonos por material, luz desde arriba, extremidades traseras en el tono de sombra. Alfa solo 0 o 255.
5. **Medir y nombrar** según las tablas de abajo.
6. **Registrar** en `manifest.json` (o agregarlo a `tools/assets/build.py`).
7. **Validar**: `python3 tools/assets/validate.py` debe terminar con 0 errores.

| Tipo | Tamaño | Notas |
|---|---|---|
| Capa de personaje | 16 frames de 16 × 24 | Misma rejilla y pose que las capas existentes |
| Enemigo de suelo / torreta | 16 × 16 | Mira a la izquierda |
| Enemigo volador | 16 × 12 | |
| Obstáculo | 16 × 16 a 16 × 48; aéreo 32 × 8 | Una versión por zona, misma hitbox |
| Powerup / ícono de UI | 12 × 12 | Lectura en ×1 con contorno |
| Moneda / partícula | 8 × 8 | |
| Fondo parallax | 320 × 180 | Repetible en horizontal; capas mid/near con transparencia arriba |
| Tile | 16 × 16 | |

**Nombres de archivo**: minúsculas, sin acentos, `snake_case`. Variantes con sufijo numérico (`outfit_2_5.png`) o de zona por carpeta (`obstacles/zona3/air.png`). Claves de Phaser = nombre en el manifest.

---

## 13. Textos y tono

- Todo en español de México, en mayúsculas, corto. Exclamaciones con ¡ ! para logros y avisos.
- Verbos en imperativo informal (tú): SALTA, AGÁCHATE, DISPARA, GIRA TU TELÉFONO.
- Botones de 1–3 palabras.

| Contexto | Texto |
|---|---|
| Botones | JUGAR · PERSONAJE · CONTINUAR · REINICIAR · REINTENTAR · MENÚ · ALEATORIO · RESTABLECER · GUARDAR Y JUGAR |
| Tutorial | ¡SALTA! · ¡AGÁCHATE! · ¡DISPARA! |
| Récord | ¡RÉCORD SUPERADO! (en partida) · ¡NUEVO RÉCORD! (Game Over) |
| Zona | ZONA N + nombre · VUELTA 2 |
| Game Over | PUNTAJE · DISTANCIA · ENEMIGOS · MONEDAS · RÉCORD PREVIO |
| Editor | TU PERSONAJE · PIEL · ROPA · CABELLO · ACCESORIO · ARMA · COLOR DE ROPA · COLOR DE CABELLO · NOMBRE |

---

## 14. Accesibilidad y móvil

- Objetivos táctiles ≥ 44 px reales (los botones táctiles de 32 px lógicos lo cumplen desde escala ×1.4).
- Todo control interactivo tiene un área táctil de al menos `UI.touchMin` (22 px lógicos) aunque se dibuje más chico: usa `setTouchArea` (`src/ui/touch.ts`). Ver "Diseño responsivo" en la sección 3 de la especificación.
- Todo lo que se hace con mouse se puede hacer con teclado, con foco visible.
- Ningún parpadeo más rápido de 10 Hz ni destellos de pantalla completa.
- El aviso "Gira tu teléfono" aparece siempre que el alto sea mayor que el ancho.

## 15. No hacer

- Valores hexadecimales, coordenadas de UI o duraciones escritos a mano en el código.
- Fuentes del sistema o web dentro del juego (`this.add.text`). Solo la BitmapFont.
- Escalas, posiciones o rotaciones no enteras en sprites y UI.
- Sprites con colores fuera de la paleta, degradados suaves o semitransparencias.
- `setTint` para recolorear personajes, enemigos u obstáculos.
- UI fija dentro de la franja de juego (y 40–147) durante la partida.
- Más de un botón primario por pantalla.

## 16. Checklist de revisión (por PR)

- [ ] Ningún hexadecimal ni número de UI fuera de `theme.ts` / `config.ts`.
- [ ] La pantalla coincide con su referencia en `screens/` (comparar a ×4).
- [ ] Todo texto usa `pixelText` (BitmapFont, mayúsculas, sombra).
- [ ] Capas (`DEPTH`) y orígenes correctos; el jugador pisa y = 148.
- [ ] Botones con los 3 estados, foco por teclado y un solo primario.
- [ ] `validate.py` en 0 errores si se tocaron assets.
- [ ] Se ve bien a 1× (320 × 180) y en el teléfono en horizontal.
