# Fase 6 — Efectos de sonido, pulido y publicación

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Prompt de la fase

> ya hice merge a develop, continua con fase 6

(Equivale al prompt de la sección 14: *"Implementa la Fase 6 (sección 13): conecta todos los efectos de sonido de la tabla, el pulido (partículas, sacudidas, hit-stop, tutorial de primera partida), la adaptación móvil y la configuración de build para GitHub Pages. Escribe el README."*)

## Decisiones (preguntadas al usuario)

- **Publicación:** GitHub Pages con un workflow de GitHub Actions. El repositorio es privado: para publicar hay que hacerlo público (o tener plan de pago) y elegir "GitHub Actions" como fuente en *Settings › Pages*.
- **Tutorial:** cada aviso espera a que el jugador haga la acción; no aparecen amenazas hasta terminar los tres pasos; se guarda como visto al completarlo.

## Lo que ya estaba hecho de fases anteriores

Sacudidas y hit-stop (Fase 4), pausa automática al cambiar de pestaña o bloquear el teléfono, botones táctiles, aviso "Gira tu teléfono", sin zoom ni scroll en el lienzo (Fases 0–2) y los sonidos de interfaz (Fase 1).

## Plan

- `tools/audio/game_sfx.py` genera los 16 efectos de §13.1 (con una variante de disparo por arma).
- `playSfx`: una instancia por sonido salvo monedas (hasta 3), tono aleatorio ±5 % en salto, disparo e impactos, racha de monedas que sube el tono. Lógica pura en `systems/sfx.ts` con pruebas.
- `PlayerMotor` informa saltos, dobles saltos, aterrizajes y agachadas para los sonidos y el polvo.
- `Dust`: nubes de polvo al correr y dos al aterrizar, que se quedan en el mundo.
- `Tutorial` (lógica pura) + aviso fijo en el `Announcer` + `SpawnSystem` que retiene las amenazas mientras dura.
- Botón de pantalla completa solo donde existe.
- `.github/workflows/deploy.yml` y README.

## Verificación

Pruebas unitarias (reglas de sonido, racha de monedas, tutorial, eventos del motor, guardado con `tutorialDone`, retención del planificador), typecheck y build sin errores. En Chromium sin interfaz, con el guardado vacío: el tutorial espera cada acción sin amenazas, se guarda como visto y no vuelve a salir; después llegan las amenazas; suenan salto, aterrizaje, agacharse, disparo, muerte y monedas con varias instancias; polvo en los pies; sin errores en consola. Falta: 60 FPS durante 3 minutos en un teléfono de gama media, probar en Chrome Android y Safari iOS, y publicar.
