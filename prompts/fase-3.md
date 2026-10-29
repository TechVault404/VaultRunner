# Fase 3 — Escenarios, sistema de puntuación y música

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Prompt de la fase

> See the new changes pulled from develop? We've completed up until phase 2, and now we are supposed to be able to implement phase 3. Is this correct?

(Equivale al prompt de la sección 14: *"Implementa la Fase 3 (sección 10): `BiomeSystem` con las 4 zonas, parallax de 3 capas y transición con cartel; `DifficultySystem` con la curva de velocidad; `ScoreSystem` como lógica pura con pruebas en Vitest; guardado del récord personal y de la distancia máxima con las reacciones de UI descritas; `AudioSystem` con música por zona, crossfade, jingles y los interruptores de sonido."*)

## Música

La IA notó que no había ninguna pista de música (solo los sonidos de interfaz) y preguntó cómo conseguirlas. Ante la pregunta *"What are the best ways to do this? Should I generate them in here or use Claude from web…?"*, comparó tres caminos: generarlas con código aquí (como el arte pixel, que también salió de scripts), usar una IA de música (más ricas, pero sin loops exactos y con licencias que revisar) o Claude en la web (que terminaría en uno de los dos anteriores). Se eligió generarlas aquí con código.

`tools/audio/music.py` compone chiptune con dos canales de pulso, un triángulo de bajo y ruido para la batería, al BPM de cada pista de §10.4. Cada loop dura un número exacto de compases y se renderiza en un búfer circular, así que no tiene cortes. Exporta `.ogg` y `.mp3`.

## Decisiones (preguntadas al usuario)

- **Vuelta:** la zona 4 dura hasta los 5,000 m; después, VUELTA 2 desde la zona 1.
- **Récord:** solo cuenta una partida que llega a GameOver; salir desde la pausa no guarda.
- **Etiquetas git:** no por ahora.

## Plan

- Lógica pura con pruebas: `DifficultySystem` (velocidad), `BiomeSystem` (zona y vuelta), `ScoreSystem` (puntos, multiplicador listo para la Fase 5, récord superado) y `applyRunResult` (guarda récord y distancia solo si son mayores).
- `MusicPlayer` en `AudioSystem`: una pista a la vez con fundidos que siguen entre escenas, 30 % en pausa, jingles, interruptor del menú y espera al desbloqueo de audio del navegador.
- Escena Game: velocidad y distancia reales, mezcla de fondos de 2 s al cambiar de zona, cartel de zona, aviso "¡RÉCORD SUPERADO!", línea de récord en ámbar, monedas sueltas con "+10".

## Verificación

Pruebas unitarias y build sin errores. En Chromium sin interfaz: las 4 zonas y la VUELTA 2 en sus distancias con cartel, mezcla de fondos y crossfade de música; velocidad 120 → 300 sin pasarse; monedas; récord guardado, que sobrevive a recargar y no se sobrescribe con uno menor; jingles; salir desde la pausa no guarda; música en pausa al 30 %. Además, cada pista decodificada mide exactamente lo mismo que la fuente (sin silencio extra en el loop). Falta que una persona escuche las pistas.
