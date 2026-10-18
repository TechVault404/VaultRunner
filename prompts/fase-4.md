# Fase 4 — Enemigos y obstáculos

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Prompt de la fase

> From the @especificaciones.md now it should have been implemented up until phase 3. What is needed to implement phase 4

Después de revisar el plan: *"Start implementing"*.

(Equivale al prompt de la sección 14: *"Implementa la Fase 4 (sección 11): los obstáculos y enemigos de las tablas con sus comportamientos, el `SpawnSystem` por patrones con niveles de dificultad, la regla de justicia de distancia mínima, semilla configurable, los primeros 100 m seguros y la secuencia de golpe y muerte. Crea al menos 15 patrones."*)

## Decisiones (preguntadas al usuario)

- **Bala de la torreta:** al empezar el aviso se fija al carril más cercano a la altura del jugador: bajo (se salta) o alto (se agacha). Siempre es esquivable.
- **Esquive cerrado (+5):** sí se incluye.
- **Botón FIN (DEBUG):** se quita; para probar quedan `?seed=`, `?startM=` y `?god=1`.
- **Monedas:** solo en patrones (filas y arcos); se quitan las monedas sueltas.

## Plan

- Lógica pura con pruebas: `Rng` (semilla), `patterns.ts` (22 patrones en tres niveles y su validación), `SpawnPlanner` (elige patrones por dificultad y distancia, respeta los 100 m seguros, la distancia mínima de cada amenaza y la regla de justicia a la velocidad con la que se va a encontrar), `holes.ts` (suelo bajo el jugador) y `RunParams` (parámetros de la URL).
- Entidades con *pools*: `Obstacle` (6 tipos, arte por zona, misma hitbox), `Bug`, `Drone`, `Turret`, `Glitch`, `EnemyBullet`. Todas guardan su posición en px de mundo y se dibujan donde va el suelo.
- `GroundSystem`: los huecos se recortan del suelo con una máscara geométrica invertida y se cierran con los tiles de borde de la zona.
- Escena Game: colisiones, puntos por enemigo, hit-stop de 40 ms y sacudida ligera al eliminar; golpe → sacudida fuerte, animación de muerte, cámara lenta 0.5× durante 600 ms y GameOver.

## Cambio adicional: volumen de la música

> Got it, then its good. I want you to add one change and is: For the music we actually need a volume control not just mute or unmute

Decisiones preguntadas al usuario: panel con − / + y barra de 5 bloques (en vez de un deslizador o de un ícono que cicla niveles), disponible en el menú y en la pausa. El volumen va de 0 a 100 % en pasos de 20 % (0 = apagada), se oye y se guarda al momento, y los guardados anteriores se convierten sin perder datos.

## Verificación

Pruebas unitarias (fairness a 120 y a 300 px/s, distancias mínimas, 100 m seguros, misma semilla = mismo mundo, todos los patrones válidos), typecheck y build sin errores. En Chromium sin interfaz: obstáculos con el arte de cada zona, huecos con sus bordes y arco de monedas, aviso de la torreta, aviso del Glitch con su silueta, muerte por bug y por hueco con GameOver y récord guardado, Esc ignorado durante la muerte, REINTENTAR sin cámara lenta pegada, puntos por enemigo (50/50/100/150) y el contador de enemigos. Falta jugarlo a 300 px/s (`?startM=2250&god=1`, F1) y probar en un teléfono real. Volumen: panel desde el menú (ratón) y desde la pausa (solo teclado), ganancia aplicada al momento, 0 % apaga la música y cambia el ícono, Esc cierra solo el panel y la pausa vuelve al 30 %.
