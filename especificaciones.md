# Documento de especificaciones — Videojuego IA

**Nombre provisional:** Vault Runner
**Género:** Endless runner 2D de desplazamiento lateral (referencias: Jetpack Joyride, Monster Dash, el dinosaurio de Chrome)
**Estilo visual:** Pixel art
**Plataformas:** Navegador web en escritorio y móvil
**Propósito:** Juego construido íntegramente con IA para el skit "Hicimos un videojuego utilizando solo IA". Este documento es la fuente única de verdad: cada fase se le entrega a la IA junto con este documento como contexto.

---

## 1. Cómo usar este documento

1. Al iniciar cada sesión con la IA, pega o adjunta este documento completo y después el prompt de la fase correspondiente (sección 14).
2. Se trabaja **una fase a la vez**. No se avanza hasta cumplir todos los criterios de aceptación de la fase.
3. Flujo de git: cada fase se trabaja en una rama `fase-N/<nombre-corto>` creada desde `develop`. Al cumplir los criterios de aceptación se abre un PR hacia `develop`, se revisa y se fusiona; después se etiqueta `develop` con `fase-N` (`fase-0`, `fase-1`, …) para poder mostrar el progreso en el video y compartir el repositorio. `main` es solo para releases y se gestiona manualmente.
4. Todos los prompts usados se guardan en `/prompts` dentro del repositorio (sección 14), porque al final del video se ofrece compartir el repo y los prompts.
5. **El juego es responsivo: se juega en celular y en PC.** Además de sus propios criterios, cada fase debe cumplir los criterios transversales de la sección 3 ("Diseño responsivo"). Una fase no se fusiona si algo de lo que agrega solo funciona en escritorio o solo en el teléfono.

### Mapa de fases (alineado con el guion)

| Fase | Contenido | Momento del guion |
|---|---|---|
| 0 | Base del proyecto, escenas, resolución y controles | (soporte, no se menciona) |
| 1 | Editor de personaje | "Primero el editor de personaje que utilizarás para jugar" |
| 2 | Acciones básicas: saltar, agacharse y disparar | "Después le dimos acciones básicas al personaje…" |
| 3 | Escenarios, sistema de puntuación (con récord personal) y música que cambia al avanzar | "Luego definimos los escenarios, el sistema de puntuación y la música…" |
| 4 | Enemigos y obstáculos | "Algo muy importante, los enemigos y los obstáculos…" |
| 5 | Powerups | "…hay unos powerups que puedes recoger" |
| 6 | Efectos de sonido, pulido, móvil y publicación | "Y este fue el resultado final" |

---

## 2. Visión del juego

El personaje corre automáticamente hacia la derecha. El jugador solo decide **cuándo saltar, agacharse y disparar** para esquivar obstáculos y eliminar enemigos. La velocidad aumenta con la distancia, el escenario y la música cambian por zonas, y la partida termina al primer golpe (salvo que se tenga escudo). Al terminar se muestra el puntaje y se guarda el **mejor puntaje personal**.

**Pilares:**
- Partidas cortas (1–4 minutos) y reinicio inmediato.
- Controles de una mano en móvil.
- Muertes siempre justas: todo obstáculo debe ser esquivable con la velocidad actual.
- Personalización visible: el personaje que creas es el que juega.

### Fuera de alcance (para no complicarnos la vida)
- Multijugador, cuentas de usuario, backend o tablas de puntuación en línea.
- Compras, anuncios o monetización.
- Niveles diseñados a mano (todo es generación procedural por patrones).
- Guardado en la nube (solo `localStorage`).

---

## 3. Stack técnico

| Elemento | Decisión |
|---|---|
| Lenguaje | TypeScript (modo `strict`) |
| Motor | Phaser 3 (física Arcade) |
| Empaquetador | Vite |
| Persistencia | `localStorage` con versión de esquema |
| Gráficos | Pixel art generado con IA, limpiado/cuantizado a la paleta del juego |
| Música | Pistas chiptune generadas con IA (loops en `.ogg` + `.mp3` de respaldo) |
| Efectos de sonido | Generados con jsfxr/sfxr o con IA de audio, exportados a `.wav`/`.ogg` |
| Pruebas | Vitest para la lógica pura (puntaje, dificultad, guardado) |
| Publicación | GitHub Pages o Vercel (sitio estático) |

### Resolución y escalado
- Resolución lógica: **320 × 180 px** (16:9).
- Escalado entero (`pixelArt: true`, `roundPixels: true`, `Scale.FIT` + centrado). Sin suavizado.
- Unidad de tile: **16 × 16 px**. El suelo ocupa las 2 filas inferiores (y = 148 es la superficie del suelo).
- Objetivo de rendimiento: 60 FPS en un teléfono de gama media; `delta` siempre usado en el movimiento.

### Diseño responsivo (obligatorio en todas las fases)
El juego está pensado para jugarse **en celular o en PC** con la misma calidad. Todo lo que se agregue en cualquier fase (escenas, UI, controles, efectos) debe cumplir esto:

**Pantallas objetivo**
| Dispositivo | Tamaño de referencia (CSS px) | Orientación |
|---|---|---|
| Teléfono pequeño | 667 × 375 (iPhone SE 2.ª/3.ª gen.) | Horizontal |
| Teléfono moderno | 915 × 412 (Android), 932 × 430 (iPhone) | Horizontal |
| Tableta | 1024 × 768 | Horizontal |
| PC | 1280 × 720 hasta 2560 × 1440, ventana de cualquier tamaño | — |

**Reglas**
- **Un solo diseño que escala.** Toda la UI se compone sobre el lienzo lógico de 320 × 180 y se escala con `Scale.FIT`; no hay layouts separados para móvil y PC. En relaciones de aspecto distintas a 16:9 (19.5:9, 4:3, 16:10) aparecen bandas de `COLOR.bg`, pero nunca se recorta ni se deforma nada.
- **Redimensionar y girar en vivo.** Cambiar el tamaño de la ventana, girar el teléfono, entrar o salir de pantalla completa, o que aparezca la barra del navegador, se resuelve al momento, sin recargar y sin perder el estado.
- **Zonas seguras.** En teléfonos con notch o barra de inicio, el lienzo respeta `env(safe-area-inset-*)` (padding del `body` en `index.html`). Nada interactivo queda bajo el notch ni en los bordes del sistema.
- **Ayudas según el dispositivo.** Las ayudas de teclado ("ENTER ELEGIR", etc.) solo se muestran cuando el jugador usa teclado o gamepad (`InputSystem.lastDevice`).
- **Paridad de entrada.** Cada pantalla se puede usar completa **solo con el dedo** y **solo con teclado y mouse** (gamepad opcional). Nada depende del *hover*; todo lo que se haga con mouse funciona con un toque.
- **Áreas táctiles de al menos 22 × 22 px lógicos** (`UI.touchMin`), que son ≥ 44 × 44 px reales con el lienzo a ×2 o más (pantallas desde 640 × 360). Si un control se dibuja más chico, se amplía su área táctil con `setTouchArea` (`src/ui/touch.ts`), no el dibujo. Cuando los controles están más juntos que 22 px (p. ej., las muestras de color), el espacio disponible se reparte entre ellos sin solapes, aunque alguna área quede algo por debajo del mínimo (las muestras del editor quedan en 20–22 px lógicos).
- **Legibilidad.** Todo texto y todo icono se lee en el teléfono pequeño a distancia normal de juego.
- **Teclado del teléfono.** Cuando aparece el teclado virtual (p. ej., el nombre en el editor), la pantalla no se rompe ni queda desplazada al cerrarlo.
- **Sin comportamientos del navegador.** En el lienzo no hay zoom con doble toque ni pellizco, ni scroll, ni rebote, ni menú contextual, ni selección de texto.
- **Solo horizontal.** El juego se juega únicamente en horizontal; no hay diseño vertical. Siempre que el área disponible sea más alta que ancha (teléfono en vertical o ventana angosta), el `OrientationGuard` cambia el lienzo a 180 × 320 y muestra la escena "Gira tu teléfono" (`screens/10_gira_telefono`), que pausa todo; si había una partida en curso, se abre el menú de pausa. Al volver a horizontal se restaura el lienzo de 320 × 180 y se reanuda lo que estaba corriendo. En Android, al entrar a pantalla completa, se intenta además fijar la orientación horizontal. Toda escena nueva funciona con este mecanismo sin código extra.

**Criterios transversales de aceptación (en cada fase)**
- [ ] Lo nuevo de la fase funciona en una ventana de PC, incluso al redimensionarla mientras se usa.
- [ ] Lo nuevo de la fase funciona en la emulación de dispositivos de las DevTools con táctil, al menos en 667 × 375 y 915 × 412 en horizontal.
- [ ] Ningún control queda inaccesible solo con táctil ni solo con teclado y mouse.
- [ ] Cuando la fase toca UI o controles, también se prueba en un teléfono real.

### Estructura del repositorio
```
/src
  main.ts               configuración de Phaser
  config.ts             todas las constantes de balance (una sola fuente)
  /scenes               Boot, Preload, Menu, CharacterEditor, Game, Pause, GameOver
  /entities             Player, Projectile, Enemy*, Obstacle*, PowerUp, Coin
  /systems              InputSystem, SpawnSystem, ScoreSystem, DifficultySystem,
                        BiomeSystem, AudioSystem, PowerUpSystem, SaveSystem
  /ui                   HUD, botones, textos con fuente pixel
/public/assets
  /sprites /tiles /backgrounds /ui /audio/music /audio/sfx /fonts
/prompts                prompts usados en cada fase (fase-0.md … fase-6.md)
/tests
README.md
```

### Reglas de código para la IA
- Ningún número "mágico" fuera de `config.ts` (balance) y `src/theme.ts` (visual). Todo lo visual sigue `DISENO.md`.
- Cada sistema es una clase independiente que la escena `Game` orquesta.
- Lógica de juego separada del render cuando sea posible (para poder probarla).
- Usar *object pools* para proyectiles, enemigos, obstáculos y monedas.
- Si un asset no existe todavía, usar un rectángulo de color de su tamaño (placeholder) para no bloquear el avance.

---

## 4. Dirección de arte

- **Paleta:** máximo 32 colores (se recomienda una paleta pública tipo "Endesga 32" o similar). Todo sprite generado por IA se cuantiza a esta paleta.
- **Contorno:** 1 px oscuro en personajes, enemigos y powerups para que se lean sobre cualquier fondo.
- **Tamaños de referencia:**

| Elemento | Tamaño (px) |
|---|---|
| Jugador de pie | 16 × 24 |
| Jugador agachado | 16 × 14 |
| Proyectil | 6 × 3 |
| Enemigo terrestre | 16 × 16 |
| Enemigo volador | 16 × 12 |
| Torreta | 16 × 16 |
| Obstáculos | 16 × 16 a 16 × 48 |
| Powerup / moneda | 12 × 12 / 8 × 8 |

- **Animaciones del jugador** (frames a 10–12 fps): correr (6), saltar (1 subida + 1 caída), agacharse (2, en loop), disparar (2, superpuesta), golpe/muerte (4).
- **Fuente:** fuente pixel de licencia libre con acentos y ñ.
- **Prompt base para generar sprites** (adaptar en cada caso): *"pixel art sprite sheet, 16x24 character, side view facing right, transparent background, limited palette, 1px dark outline, no anti-aliasing, retro 16-bit style, [descripción]"*. Después: recortar, alinear a la cuadrícula y cuantizar a la paleta.

---

## 5. Escenas y flujo

```
Boot → Preload → Menu ─┬→ CharacterEditor → Menu
                       └→ Game ⇄ Pause
                            └→ GameOver → (Reintentar → Game | Menú → Menu)
```

| Escena | Contenido |
|---|---|
| Menu | Título, vista del personaje actual animado, récord personal, botones Jugar / Personaje / Sonido on-off |
| CharacterEditor | Ver Fase 1 |
| Game | Juego + HUD |
| Pause | Overlay: Continuar, Reiniciar, Menú. Se activa con Esc/P o al perder el foco de la pestaña |
| GameOver | Puntaje de la run, distancia, enemigos eliminados, récord, banner "¡NUEVO RÉCORD!" si aplica, Reintentar / Menú |

**HUD (durante la partida):** puntaje actual (arriba izquierda), récord (debajo, más pequeño), distancia en metros, iconos de powerups activos con barra de tiempo restante (arriba derecha), botón de pausa.

---

## 6. Controles

| Acción | Teclado | Táctil (móvil) |
|---|---|---|
| Saltar | Espacio / W / ↑ | Tap en mitad izquierda de la pantalla |
| Agacharse | S / ↓ (mantener) | Deslizar hacia abajo en mitad izquierda, o mantener botón ⬇ |
| Disparar | J / K / clic | Botón 🔫 en esquina inferior derecha |
| Pausa | Esc / P | Botón ⏸ arriba |

- El `InputSystem` traduce todos los dispositivos a acciones abstractas (`jump`, `crouch`, `shoot`, `pause`); el resto del código nunca lee teclas directamente.
- Soporte opcional de gamepad (A = saltar, B = disparar, abajo = agacharse).

---

## 7. Fase 0 — Base del proyecto

**Objetivo:** proyecto que compila, abre en el navegador y navega entre escenas vacías.

**Requisitos:**
- Proyecto Vite + TypeScript + Phaser 3 con la estructura de la sección 3.
- Configuración de resolución/escalado pixel-perfect.
- Escenas creadas con transiciones (fade de 200 ms).
- `config.ts` creado con secciones vacías para cada sistema.
- `SaveSystem` con esquema versionado:

```ts
interface SaveData {
  version: 1;
  character: CharacterConfig;   // Fase 1
  bestScore: number;            // Fase 3
  bestDistance: number;
  stats: { runs: number; totalEnemiesKilled: number };
  settings: { music: boolean; sfx: boolean };
}
```
- Si los datos guardados están corruptos o son de otra versión, se reemplazan por los valores por defecto sin romper el juego.
- `InputSystem` con las acciones abstractas de la sección 6.

**Criterios de aceptación:**
- [ ] `npm run dev` abre el juego; `npm run build` genera un sitio estático sin errores.
- [ ] Se puede ir de Menu a Game y volver.
- [ ] Al redimensionar la ventana el arte se ve nítido, sin pixeles borrosos.
- [ ] Borrar `localStorage` o guardar basura en la clave no rompe el juego.

---

## 8. Fase 1 — Editor de personaje

**Objetivo:** el jugador crea su personaje y ese mismo personaje es el que juega.

### Enfoque técnico
Personaje construido por **capas superpuestas** que comparten la misma rejilla de animación (16 × 24, mismos frames): así cualquier combinación funciona en todas las animaciones.

| Capa (orden de dibujo) | Opciones mínimas |
|---|---|
| 1. Cuerpo / tono de piel | 4 tonos |
| 2. Ropa (torso + piernas) | 4 estilos × color libre de la paleta (8 colores) |
| 3. Cabello / cabeza | 5 estilos (incluye "sin cabello") × 6 colores |
| 4. Accesorio | Ninguno, gorra, lentes, audífonos, casco |
| 5. Arma (visual del disparo) | Blaster, resortera, varita (solo cambia el sprite del proyectil, no el daño) |

- Los colores se aplican con **tinte o intercambio de paleta** sobre sprites en escala de grises, para no tener que generar un sprite por color.
- Campo de nombre opcional (máx. 10 caracteres, se muestra en GameOver).

```ts
interface CharacterConfig {
  skin: number; outfit: number; outfitColor: number;
  hair: number; hairColor: number; accessory: number;
  weapon: number; name: string;
}
```

### Interfaz
- Vista previa grande (escala ×4) del personaje **animado corriendo** en el centro.
- A cada lado, flechas ◀ ▶ por categoría; selector de colores como fila de muestras.
- Botones: **Aleatorio** (🎲), **Restablecer**, **Guardar y jugar**.
- Funciona igual con mouse, táctil y teclado (flechas para navegar, Enter para elegir).

### Criterios de aceptación
- [ ] Cada cambio se refleja al instante en la vista previa animada.
- [ ] La configuración se guarda en `localStorage` y se recupera al recargar.
- [ ] El personaje en la escena Game coincide exactamente con el del editor en todas sus animaciones.
- [ ] El botón Aleatorio nunca produce una combinación inválida.

**Material para el video:** grabar la pantalla cambiando opciones rápido y usando el botón Aleatorio.

---

## 9. Fase 2 — Acciones básicas: saltar, agacharse y disparar

**Objetivo:** el personaje corre solo y responde bien a las tres acciones sobre un suelo infinito de prueba.

### Movimiento automático
- El mundo se desplaza; el jugador se mantiene en x = 64 px. La velocidad del mundo la controla el `DifficultySystem` (Fase 3); en esta fase usar un valor fijo de `120 px/s`.

### Salto
| Parámetro | Valor inicial |
|---|---|
| Gravedad | 900 px/s² |
| Velocidad de salto | −330 px/s (altura máx. ≈ 60 px) |
| Salto variable | Si se suelta el botón antes del pico, la velocidad vertical se multiplica por 0.5 |
| Coyote time | 80 ms |
| Jump buffer | 100 ms |
| Velocidad máx. de caída | 500 px/s |

- Doble salto **solo** con el powerup correspondiente (Fase 5); dejar la lógica preparada (`maxJumps` configurable).

### Agacharse
- En el suelo: cambia a animación agachado (sprite 16 × 14) y la hitbox baja a **12 × 10** (anclada al suelo; ver regla de hitboxes). Se mantiene mientras se mantenga el botón.
- En el aire: **caída rápida** (velocidad vertical = +450 px/s inmediatamente). Al tocar el suelo, si se sigue manteniendo, queda agachado.
- No se puede saltar estando agachado sin soltar primero (o al presionar saltar se cancela el agachado y se salta; elegir esta segunda opción por fluidez).

### Disparo
| Parámetro | Valor inicial |
|---|---|
| Cooldown | 350 ms |
| Velocidad del proyectil | 300 px/s (relativa a la pantalla) |
| Máx. proyectiles en pantalla | 3 |
| Altura de salida | A la altura del pecho; si está agachado, a la altura agachada |

- Se puede disparar saltando y agachado.
- El proyectil se destruye al salir de la pantalla o al impactar.
- Los proyectiles dañan enemigos; **no** destruyen obstáculos (para que esquivar siga importando).

### Hitboxes
- La hitbox del jugador es 2 px más pequeña que el sprite por cada lado (perdona roces visuales): **12 × 20** de pie y **12 × 10** agachado.
- Modo debug (tecla F1 en desarrollo) que dibuja hitboxes.

### Criterios de aceptación
- [ ] Saltar se siente inmediato; tocar rápido = salto corto, mantener = salto alto.
- [ ] Agacharse reduce la hitbox (verificable en modo debug) y la caída rápida funciona.
- [ ] Disparo con cooldown y límite de 3 proyectiles, en todas las posturas.
- [ ] Los tres controles funcionan en teclado y en táctil.

**Material para el video:** clip del personaje haciendo saltar–agacharse–disparar en combo.

---

## 10. Fase 3 — Escenarios, sistema de puntuación y música

### 10.1 Escenarios (biomas)
El mundo avanza por zonas según la distancia. Al cambiar de zona hay una transición de 2 s (cartel con el nombre de la zona + mezcla de fondos).

| Zona | Distancia | Ambientación | Fondo (parallax) |
|---|---|---|---|
| 1. Ciudad Pixel | 0 – 499 m | Calles de noche, neón | Cielo, edificios lejanos, edificios cercanos |
| 2. Bosque Glitch | 500 – 1,499 m | Bosque con árboles "pixelados" | Cielo, montañas, árboles |
| 3. Servidor Abandonado | 1,500 – 2,999 m | Interior de data center, cables y LEDs | Pared lejana, racks, cables |
| 4. Núcleo de la IA | 3,000 m + | Espacio digital con circuitos | Estrellas/grid, circuitos, partículas |

- **Parallax:** 3 capas con factores 0.1, 0.3, 0.6 respecto a la velocidad del suelo; la capa de suelo usa tiles de 16 px.
- Cada zona tiene su set de tiles de suelo y su paleta dominante, pero todos con la paleta global.
- Al pasar la zona 4 se repite el ciclo desde la zona 1 con dificultad mantenida (contador de vuelta visible: "Vuelta 2").
- Conversión: **1 metro = 10 px** recorridos.

### 10.2 Dificultad (velocidad)
- Velocidad inicial: 120 px/s. Incremento: +4 px/s cada 50 m. Velocidad máxima: 300 px/s.
- El `DifficultySystem` expone un **nivel de dificultad 0–1** (`(velocidad − 120) / 180`) que usan el spawn de enemigos/obstáculos y la música.

### 10.3 Sistema de puntuación
| Fuente | Puntos |
|---|---|
| Distancia | 1 punto por metro |
| Moneda | +10 |
| Enemigo terrestre / volador eliminado | +50 |
| Torreta eliminada | +100 |
| Esquive cerrado (pasar a ≤ 4 px de un obstáculo) | +5 (opcional, con texto flotante) |

- Multiplicador por powerup ×2 (Fase 5) aplicado a **todo** lo ganado mientras dure, incluidos los puntos por distancia.
- Textos flotantes "+50" al ganar puntos por acciones.
- **Récord personal (requisito del guion):** al terminar cada run se compara con `bestScore`; si se supera, se guarda inmediatamente en `localStorage`, se muestra "¡NUEVO RÉCORD!" y se reproduce un jingle especial. También se guarda `bestDistance`.
- Durante la partida, cuando el puntaje actual supera al récord, el récord del HUD parpadea y aparece "¡Récord superado!" una sola vez.
- Las monedas aparecen en filas o arcos (patrones) entre obstáculos; en esta fase se implementan monedas sueltas para validar la puntuación.
- `ScoreSystem` debe ser lógica pura con pruebas unitarias.

### 10.4 Música que cambia conforme avanzas
| Pista | Uso | Estilo | BPM aprox. |
|---|---|---|---|
| menu.ogg | Menú y editor | Chiptune tranquilo | 100 |
| zona1.ogg | Ciudad Pixel | Synthwave chiptune | 120 |
| zona2.ogg | Bosque Glitch | Chiptune aventurero | 130 |
| zona3.ogg | Servidor Abandonado | Chiptune tenso, bajo marcado | 140 |
| zona4.ogg | Núcleo de la IA | Chiptune épico/rápido | 150 |
| gameover.ogg | Jingle no loop (3 s) | Descendente | — |
| record.ogg | Jingle no loop (3 s) | Ascendente, festivo | — |

- Todas las pistas de zona son **loops sin cortes** de 60–90 s.
- Al cambiar de zona: **crossfade de 1.5 s** entre pistas.
- Opcional: al superar dificultad 0.8, subir la velocidad de reproducción a 1.05× sin cambiar demasiado el tono.
- Al pausar, la música baja a 30 % de volumen; al morir se detiene con fade de 300 ms y suena el jingle.
- Respetar la política de autoplay del navegador: el audio se desbloquea con la primera interacción en el menú.
- Interruptores de música y efectos en el menú, guardados en `settings`.
- **Prompt base para la música:** *"8-bit chiptune loop, [estilo], [BPM] BPM, seamless loop, video game background music, no vocals, 60–90 seconds"*.

### Criterios de aceptación
- [ ] Las 4 zonas aparecen en las distancias indicadas con transición y cartel.
- [ ] El parallax se mueve a velocidades distintas y sin costuras.
- [ ] La velocidad crece hasta 300 px/s y no la supera.
- [ ] El puntaje suma correctamente (pruebas unitarias pasan).
- [ ] El récord se guarda, sobrevive a recargar la página y solo se sobrescribe si es mayor.
- [ ] La música cambia por zona con crossfade, sin silencios ni cortes en el loop.

**Material para el video:** clip de la transición entre zonas con cambio de música, y la pantalla de "¡NUEVO RÉCORD!".

---

## 11. Fase 4 — Enemigos y obstáculos

### 11.1 Obstáculos (no se pueden destruir; se esquivan)
| Obstáculo | Tamaño | Cómo se esquiva | Desde |
|---|---|---|---|
| Bajo (caja, pinchos) | 16 × 16 | Saltar | 0 m |
| Alto aéreo (barra, láser horizontal) | 32 × 8 a altura de cabeza (y = 124–132) | Agacharse | 150 m |
| Alto de suelo (muro) | 16 × 32 | Salto completo (mantener) | 300 m |
| Doble bajo (dos cajas juntas) | 32 × 16 | Salto completo | 500 m |
| Móvil (sierra que sube y baja) | 16 × 16, oscila 40 px | Leer el ritmo y pasar | 1,500 m |
| Hueco en el suelo | 32–48 px de ancho | Saltar (caer = muerte) | 1,500 m |

- Cada zona reviste los obstáculos con su propio arte (en la ciudad son cajas/conos; en el servidor son racks/cables), con la misma hitbox.

### 11.2 Enemigos (se pueden eliminar con disparos o esquivar)
| Enemigo | Vida | Comportamiento | Desde | Puntos |
|---|---|---|---|---|
| Bug terrestre | 1 disparo | Camina hacia el jugador a +30 px/s sobre la velocidad del mundo | 100 m | 50 |
| Dron volador | 1 disparo | Vuela en onda senoidal (amplitud 20 px, periodo 1.5 s) a altura media | 400 m | 50 |
| Torreta | 3 disparos | Fija en el suelo; dispara una bala lenta (150 px/s) a la altura del jugador, con aviso visual (parpadeo) 600 ms antes | 1,000 m | 100 |
| Glitch (élite) | 2 disparos | Se teletransporta una vez entre carril alto y bajo (bajo = a nivel del suelo, se esquiva saltando; alto = a la altura de la cabeza, se esquiva agachándose); aviso de 400 ms | 2,000 m | 150 |

- Al recibir daño: parpadeo blanco 80 ms. Al morir: explosión de partículas pixel de 300 ms.
- Las balas enemigas se esquivan saltando o agachándose; no se pueden destruir con disparos (versión 1).
- Tocar a un enemigo o su bala = golpe al jugador.

### 11.3 Generación (SpawnSystem)
- Generación por **patrones/chunks** predefinidos (p. ej., "caja – espacio – barra", "dron sobre caja") seleccionados al azar según la dificultad. Mínimo 15 patrones distribuidos en tres niveles: fácil, medio, difícil.
- Cada patrón declara su dificultad mínima; el sistema solo elige patrones habilitados para la dificultad actual.
- **Regla de justicia:** distancia mínima entre dos amenazas = `velocidad × 0.6 s` + 24 px. Nunca generar combinaciones imposibles (p. ej., barra aérea sobre caja baja).
- Los primeros 100 m son seguros (sin amenazas) para que el jugador se acomode.
- Semilla aleatoria configurable para depurar y para repetir una partida en las grabaciones.

### 11.4 Golpe y muerte
- Sin escudo: un golpe termina la partida. Cámara tiembla 200 ms, animación de muerte, cámara lenta 0.5× durante 600 ms, y luego GameOver.
- Caer en un hueco: muerte inmediata con la misma secuencia.

### Criterios de aceptación
- [ ] Todos los obstáculos y enemigos de las tablas existen con sus comportamientos.
- [ ] Ningún patrón generado es imposible a ninguna velocidad (validar jugando a 300 px/s con modo debug).
- [ ] Los enemigos aparecen solo a partir de su distancia mínima.
- [ ] Eliminar enemigos suma los puntos correctos y cuenta en estadísticas.
- [ ] La secuencia de muerte lleva a GameOver y guarda el récord.

**Material para el video:** clip disparándole a un dron, esquivando una torreta y agachándose bajo un láser.

---

## 12. Fase 5 — Powerups

"Para que no sea tan monótono, hay unos powerups que puedes recoger."

| Powerup | Icono | Efecto | Duración |
|---|---|---|---|
| Escudo | Burbuja azul | Absorbe 1 golpe; al romperse da 1 s de invulnerabilidad (parpadeo) | Hasta recibir un golpe o 15 s |
| Imán | Imán rojo | Atrae monedas en un radio de 80 px | 10 s |
| Doble salto | Botas con alas | Permite un segundo salto en el aire | 12 s |
| Disparo triple | Tres flechas | Cada disparo lanza 3 proyectiles en abanico (−10°, 0°, +10°), el cooldown baja a 200 ms y el máximo de proyectiles en pantalla sube de 3 a 9 | 8 s |
| Puntos ×2 | "×2" dorado | Duplica todos los puntos ganados | 10 s |
| Turbo | Rayo | Invulnerable, velocidad ×1.8 durante exactamente 3 s destruyendo lo que toca (los enemigos destruidos dan sus puntos normales, ×2 si aplica, y cuentan en estadísticas); al terminar, 1 s de invulnerabilidad | 3 s |

### Reglas
- Aparecen flotando con un leve movimiento vertical, en posiciones alcanzables, cada **250–400 m** (aleatorio), nunca dentro de un obstáculo.
- Probabilidad: Escudo 25 %, Imán 20 %, Doble salto 15 %, Disparo triple 15 %, ×2 15 %, Turbo 10 % (Turbo solo a partir de 800 m).
- Recoger el mismo powerup activo **reinicia** su duración; distintos powerups pueden estar activos a la vez.
- HUD: icono de cada powerup activo con barra de tiempo; cuando quedan 2 s, el icono parpadea.
- Efecto visual en el personaje mientras está activo (aura, burbuja, estela).
- Sonido al recoger y al terminar el efecto.

### Criterios de aceptación
- [ ] Los 6 powerups funcionan según la tabla y pueden coexistir.
- [ ] Los temporizadores y el HUD son correctos, incluso al pausar (el tiempo de pausa no cuenta).
- [ ] El escudo evita la muerte exactamente una vez.
- [ ] Las probabilidades y la frecuencia se ajustan desde `config.ts`.

**Material para el video:** clip recogiendo el disparo triple y limpiando una fila de drones, y el escudo salvando una muerte.

---

## 13. Fase 6 — Efectos de sonido, pulido y publicación

### 13.1 Efectos de sonido
| Evento | Descripción |
|---|---|
| Salto | "Bip" ascendente corto |
| Doble salto | Variante más aguda |
| Aterrizaje | Golpe suave |
| Agacharse / caída rápida | "Swoosh" descendente |
| Disparo | Láser corto (variante por arma del editor) |
| Impacto en enemigo | "Tick" |
| Enemigo eliminado | Explosión pixel |
| Disparo de torreta | Láser grave |
| Moneda | "Ding" (tono sube ligeramente si se recogen seguidas) |
| Recoger powerup | Arpegio ascendente |
| Powerup termina | Arpegio descendente corto |
| Escudo roto | Cristal |
| Cambio de zona | Whoosh + acorde |
| Golpe / muerte | Ruido + caída |
| Nuevo récord | Fanfarria corta (usa record.ogg) |
| UI: navegar / confirmar | Clics suaves |

- Máximo 1 instancia simultánea de cada sonido salvo monedas (hasta 3) para evitar saturación.
- Variación de tono aleatoria de ±5 % en salto, disparo e impactos.

### 13.2 Pulido ("game feel")
- Partículas de polvo al correr y al aterrizar.
- Sacudida de cámara ligera al eliminar enemigos y fuerte al morir.
- *Hit-stop* de 40 ms al eliminar un enemigo.
- Tutorial de 3 pasos en la primera partida (indicadores "Salta", "Agáchate", "Dispara") que no vuelve a mostrarse.
- Pausa automática al cambiar de pestaña o bloquear el teléfono.

### 13.3 Móvil
- Pantalla horizontal; si está en vertical, mostrar aviso "Gira tu teléfono" (ya implementado desde la Fase 1; ver "Diseño responsivo", sección 3).
- Botones táctiles semitransparentes de al menos 44 × 44 px reales.
- Evitar zoom, scroll y menú contextual en el lienzo; probar en Chrome Android y Safari iOS.
- Opción de pantalla completa en el menú.

### 13.4 Publicación y repositorio
- Build estático publicado en GitHub Pages o Vercel con URL pública.
- README con: descripción, cómo jugar, controles, cómo correrlo localmente, créditos de herramientas de IA y licencias de assets.
- Carpeta `/prompts` completa (sección 14) y etiquetas git por fase.

### Criterios de aceptación
- [ ] Todos los eventos de la tabla tienen sonido y respetan el interruptor de efectos.
- [ ] El juego corre a 60 FPS en un teléfono de gama media durante 3 minutos de partida.
- [ ] El juego está publicado y se puede jugar desde el teléfono para la grabación final.
- [ ] El repositorio está listo para compartir (para quienes comenten 🤖).

---

## 14. Prompts por fase

Cada prompt se envía **junto con este documento completo**. Guardar cada prompt usado (y sus correcciones) en `/prompts/fase-N.md`.

**Prompt de sistema / contexto (al iniciar cada sesión):**
> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

**Fase 0:**
> Implementa la Fase 0 (sección 7): crea el proyecto Vite + TypeScript + Phaser 3 con la estructura de carpetas de la sección 3, la configuración de resolución pixel-perfect, todas las escenas vacías con su navegación, el `SaveSystem` versionado y el `InputSystem` con acciones abstractas. Usa placeholders de color para todo.

**Fase 1:**
> Implementa la Fase 1 (sección 8): el editor de personaje por capas con tinte de paleta, vista previa animada a escala ×4, botones Aleatorio, Restablecer y Guardar y jugar, y persistencia de `CharacterConfig`. El personaje de la escena Game debe construirse con la misma configuración. Mientras no tengamos los sprites finales, genera las capas como rectángulos de colores alineados a la rejilla de 16 × 24.

**Fase 2:**
> Implementa la Fase 2 (sección 9): carrera automática sobre suelo infinito, salto con gravedad, salto variable, coyote time y jump buffer; agacharse con cambio de hitbox y caída rápida; disparo con cooldown, límite de proyectiles y pool de objetos. Agrega el modo debug de hitboxes con F1. Deja `maxJumps` configurable para el doble salto futuro.

**Fase 3:**
> Implementa la Fase 3 (sección 10): `BiomeSystem` con las 4 zonas, parallax de 3 capas y transición con cartel; `DifficultySystem` con la curva de velocidad; `ScoreSystem` como lógica pura con pruebas en Vitest; guardado del récord personal y de la distancia máxima con las reacciones de UI descritas; `AudioSystem` con música por zona, crossfade, jingles y los interruptores de sonido.

**Fase 4:**
> Implementa la Fase 4 (sección 11): los obstáculos y enemigos de las tablas con sus comportamientos, el `SpawnSystem` por patrones con niveles de dificultad, la regla de justicia de distancia mínima, semilla configurable, los primeros 100 m seguros y la secuencia de golpe y muerte. Crea al menos 15 patrones.

**Fase 5:**
> Implementa la Fase 5 (sección 12): el `PowerUpSystem` con los 6 powerups, su generación con probabilidades configurables, efectos acumulables, reinicio de duración, iconos con barra en el HUD y efectos visuales en el personaje. Los temporizadores deben respetar la pausa.

**Fase 6:**
> Implementa la Fase 6 (sección 13): conecta todos los efectos de sonido de la tabla, el pulido (partículas, sacudidas, hit-stop, tutorial de primera partida), la adaptación móvil y la configuración de build para GitHub Pages. Escribe el README.

**Prompts de assets** (uno por elemento, con el prompt base de la sección 4 o 10.4): personaje por capas, cada enemigo, cada obstáculo por zona, iconos de powerups, monedas, fondos de parallax por zona (*"pixel art parallax background layer, 320x180, side-scrolling, [zona], [capa lejana/media/cercana], limited palette, seamless horizontal tile"*), tiles de suelo, logo del juego, y las 7 pistas de música.

**Si algo falla, prompt de corrección:**
> Este es el comportamiento esperado según la sección X: […]. Este es el comportamiento actual: […]. Este es el error de consola: […]. Corrige solo lo necesario sin reescribir otros sistemas.

---

## 15. Inventario de assets (checklist)

**Sprites**
- [ ] Capas del personaje: 4 pieles, 4 ropas, 5 cabellos, 4 accesorios, 3 armas/proyectiles — todas con frames de correr, saltar, agacharse, disparar y muerte
- [ ] Bug terrestre (caminar 4 frames, muerte)
- [ ] Dron (volar 2 frames, muerte)
- [ ] Torreta (reposo, aviso, disparo, muerte) + bala enemiga
- [ ] Glitch (idle, teletransporte, muerte)
- [ ] Obstáculos × 4 zonas (bajo, aéreo, muro, doble, sierra)
- [ ] Moneda (giro 4 frames)
- [ ] 6 iconos de powerup + efectos (burbuja, aura, estela)
- [ ] Partículas (polvo, explosión, chispas)

**Escenarios**
- [ ] 4 zonas × 3 capas de parallax
- [ ] 4 sets de tiles de suelo + borde de hueco

**UI**
- [ ] Logo, botones (normal/presionado), marco del HUD, iconos de pausa/sonido/pantalla completa, controles táctiles, fuente pixel

**Audio**
- [ ] 7 pistas de música (sección 10.4)
- [ ] 16+ efectos de sonido (sección 13.1)

---

## 16. Pruebas finales (antes de grabar el resultado)

- [ ] Partida completa llegando a la zona 4 sin errores en consola.
- [ ] Récord: jugar 3 partidas, verificar que solo se guarda el mayor y que persiste al recargar.
- [ ] Editor: crear 3 personajes distintos y verificar que cada uno juega correctamente.
- [ ] Todos los powerups recogidos al menos una vez.
- [ ] Muerte por cada tipo de obstáculo y enemigo, y por hueco.
- [ ] Pausa con botón, con Esc y al cambiar de pestaña.
- [ ] Sonido apagado/encendido persiste.
- [ ] Prueba en teléfono real en horizontal, con pantalla completa.
- [ ] Recorrido completo (menú, editor, partida, pausa, Game Over) en un teléfono pequeño, un teléfono moderno y una PC, con los criterios de "Diseño responsivo" (sección 3).

---

## 17. Material para grabar (apoyo al guion)

| Momento del guion | Qué capturar del juego |
|---|---|
| Lista de "lo básico" | Capturas: editor, powerup activo, HUD con puntaje, obstáculo, enemigo, pantalla con música (zona), arte pixel en general |
| "Generamos un documento de especificaciones" | Este documento en pantalla mientras se escribe/hace scroll |
| "Primero el editor de personaje" | Grabación del editor en uso (tag `fase-1`) |
| "Acciones básicas…" | Personaje saltando, agachándose y disparando (tag `fase-2`) |
| "Escenarios, puntuación y música" | Transición de zona + "¡NUEVO RÉCORD!" (tag `fase-3`) |
| "Enemigos y obstáculos" | Combate y esquives (tag `fase-4`) |
| "Powerups" | Disparo triple y escudo (tag `fase-5`) |
| "Este fue el resultado final" | Partida real en el teléfono con la persona jugando (tag `fase-6`) |

---

## 18. Registro de decisiones

| Fecha | Tema | Decisión |
|---|---|---|
| 2026-10-10 | Flujo de git | Una rama `fase-N/<nombre>` por fase desde `develop`, PR hacia `develop`, etiqueta `fase-N` tras fusionar. `main` solo para releases manuales. |
| 2026-10-10 | Hitbox agachado | 12 × 10 (sprite 16 × 14 menos 2 px por lado). De pie: 12 × 20. |
| 2026-10-10 | Disparo triple | El máximo de proyectiles en pantalla sube de 3 a 9 mientras está activo (configurable). |
| 2026-10-10 | Turbo | Dura exactamente 3 s a velocidad ×1.8; se elimina la cifra de 150 m. |
| 2026-10-10 | Puntos con Turbo | Los enemigos destruidos por el Turbo dan sus puntos normales y cuentan en estadísticas. |
| 2026-10-10 | Multiplicador ×2 | Se aplica a todo, incluida la distancia. |
| 2026-10-10 | Carriles del Glitch | Bajo = nivel del suelo (se salta); alto = altura de la cabeza (se agacha). |
| 2026-10-10 | Idioma | Código e identificadores en inglés; textos del juego en español. |
| 2026-10-10 | Motor | Phaser 3 (última versión 3.x). |
| 2026-10-11 | Estándar de diseño | Se adopta `DISENO.md` + `src/theme.ts` (tokens visuales) y los assets de `public/assets/` (`manifest.json`). La pantalla de referencia en `screens/` manda en caso de duda. |
| 2026-10-11 | Posición del jugador | x = 64 es el borde izquierdo del frame del personaje (DISENO §3). |
| 2026-10-11 | Renderizador | WebGL obligatorio: NineSlice (botones, paneles) y el tinte de BitmapText lo requieren. |
| 2026-10-11 | Personaje por defecto | Piel 1, sudadera cian, cabello picudo negro, audífonos, blaster (el de las pantallas de referencia). |
| 2026-10-12 | Colores del personaje | Se usan las variantes ya pintadas de los assets (intercambio de paleta hecho de antemano) en lugar de tinte en tiempo real (DISENO §4). |
| 2026-10-12 | Salir del editor | Esc vuelve al menú sin guardar; solo GUARDAR Y JUGAR guarda el personaje. |
| 2026-10-12 | Sonidos de interfaz | Se adelantan a la Fase 1 los clics de UI de §13.1 (mover foco, cambiar opción, confirmar, cancelar, aleatorio, restablecer, escribir). Respetan el interruptor de efectos y hay una sola instancia por sonido. |
| 2026-10-12 | Diseño responsivo | Requisito transversal: el juego se juega en celular y en PC. Cada fase cumple las reglas y criterios de la sección 3 "Diseño responsivo" y el prompt de sistema lo recuerda. |
| 2026-10-12 | Orientación | Solo horizontal (como Jetpack Joyride). El aviso "Gira tu teléfono" se adelanta de la Fase 6 a la Fase 1, porque sin él el juego se ve diminuto en un teléfono en vertical. |
| 2026-10-12 | Áreas táctiles | Mínimo 22 px lógicos (≥ 44 px reales desde escala ×2). El teléfono pequeño de referencia es 667 × 375: en 568 × 320 las filas del editor, a 22 px como en la referencia, no alcanzan 44 px reales. |
| 2026-10-12 | Nombre del personaje | Solo caracteres de la fuente pixel (A–Z, 0–9, ÁÉÍÓÚÜÑ, espacio), en mayúsculas, máx. 10. |
