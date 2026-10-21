# Fase 5 — Powerups

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Prompt de la fase

> Haz una rama que salga de develop, implementa fase 5 y al terminar haz pr

(Equivale al prompt de la sección 14: *"Implementa la Fase 5 (sección 12): el `PowerUpSystem` con los 6 powerups, su generación con probabilidades configurables, efectos acumulables, reinicio de duración, iconos con barra en el HUD y efectos visuales en el personaje. Los temporizadores deben respetar la pausa."*)

## Decisiones (preguntadas al usuario)

- **Escudo y huecos:** el escudo también salva de caer en un hueco: se rompe y el personaje sale con un salto automático, con 1 s de invulnerabilidad.
- **Turbo:** destruye obstáculos (sin puntos) y enemigos (con sus puntos), y cruza los huecos: tienen piso mientras dura el Turbo y su segundo de invulnerabilidad.
- **Altura de los powerups:** siempre a altura de salto corto (no se toman corriendo de pie), en un espacio libre entre patrones.

Las demás decisiones (escudo que se agota sin romperse, HUD al recoger de nuevo, sonidos) están en la sección 18 de la especificación.

## Plan

- Lógica pura con pruebas: `PowerUpSystem` (temporizadores que solo avanzan con el delta de la escena, efectos acumulables, reinicio de duración, el escudo que salva un golpe, invulnerabilidad de 1 s, multiplicadores) y `pickPowerUp` (probabilidades de `config.ts`; el Turbo solo desde 800 m).
- `SpawnPlanner`: un powerup cada 250–400 m en un hueco propio entre patrones (distancia de justicia + 32 px de holgura a cada lado), con la misma semilla que el resto del mundo.
- Efectos: disparo triple en abanico (−10°, 0°, +10°; 200 ms; hasta 9 en pantalla), doble salto (`maxJumps = 2`), imán (monedas a 80 px vuelan al jugador), ×2 (`ScoreSystem.multiplier`), Turbo (×1.8, invulnerable, destruye lo que toca) y escudo.
- `PowerUp` (ícono flotando ±2 px), `PlayerEffects` (burbuja, aura, estela y parpadeo de invulnerabilidad), HUD con caja, ícono y barra por powerup, barra en rojo bajo el 25 % y parpadeo en los últimos 2 s.
- Sonidos de recoger y de terminar (`tools/audio/game_sfx.py`).

## Verificación

Pruebas unitarias (duración de cada powerup, acumulables, reinicio de duración, la pausa no cuenta, el escudo salva exactamente un golpe, invulnerabilidad tras el escudo y el Turbo, probabilidades y Turbo desde 800 m, cada 250–400 m, nunca junto a una amenaza, misma semilla = mismos powerups, rebote del escudo en un hueco, límites del disparo triple), typecheck y build sin errores. En Chromium sin interfaz: se recoge con un salto corto y no corriendo de pie; el disparo triple lanza 3 balas en abanico y llega a 9; los 6 activos a la vez con su HUD; la pausa no descuenta tiempo; el Turbo destruye un muro y mata un bug (cuenta y puntos); el escudo salva de un muro y de un hueco; el imán atrae 4 monedas; el doble salto funciona en el aire; sin protección un golpe termina la partida; powerups generados solos con `?startM=2000&god=1`. Falta jugarlo en un teléfono real.
