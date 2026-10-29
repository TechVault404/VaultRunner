# Fase 2 — Acciones básicas: saltar, agacharse y disparar

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. El juego es responsivo: todo lo que hagas debe funcionar en celular (táctil, horizontal) y en PC (teclado y mouse), según la sección 3 "Diseño responsivo". Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Antes de la fase: corrección de un error de la Fase 1

> After editing you character, and clicking Guardar y Jugar, I see a black screen instead of going back to the menu or to whatever place it's trying to redirect me

La IA reprodujo el error en un Chromium sin interfaz: al cerrar el editor, `NameField` hacía su limpieza en el evento `SHUTDOWN` de la escena, cuando Phaser ya había destruido sus objetos (`this.scene` indefinido). La excepción detenía el cambio de escena y la pantalla se quedaba en el fundido a negro. También pasaba al salir con Esc. Se corrigió limpiando en el evento `DESTROY` del propio campo. Por indicación del usuario, la corrección es el primer commit de la rama de la Fase 2.

## Prompt de la fase

> Following the sequence, now we should implement phase 2.

(Equivale al prompt de la sección 14: *"Implementa la Fase 2 (sección 9): carrera automática sobre suelo infinito, salto con gravedad, salto variable, coyote time y jump buffer; agacharse con cambio de hitbox y caída rápida; disparo con cooldown, límite de proyectiles y pool de objetos. Agrega el modo debug de hitboxes con F1. Deja `maxJumps` configurable para el doble salto futuro."*)

## Plan y decisiones

La IA propuso un plan en modo plan y el usuario lo aprobó.

- **Lógica separada del render:** `PlayerMotor` (salto, gravedad, salto variable, coyote time, jump buffer, agacharse, caída rápida, `maxJumps`) y `FireControl` (cooldown y límite en pantalla) no dependen de Phaser y tienen pruebas en Vitest.
- **Hitbox:** el jugador lleva un cuerpo Arcade que no se mueve solo; sigue al sprite y cambia entre 12 × 20 y 12 × 10. Servirá para las colisiones de la Fase 4.
- **Proyectiles:** pool de 9 (lugar para el disparo triple de la Fase 5) con límite de 3 en pantalla. El sprite depende del arma del editor. La altura de salida se midió en los frames de `player_weapon_*`.
- **Pose de disparo:** los frames de disparo son de pie, así que solo se usan al correr; en el aire o agachado se ve el destello en el arma (§18).
- **Disparo sostenido:** mantener el botón sigue disparando al ritmo del cooldown (§18).
- **Táctil:** botones de agacharse (8, 140) y disparar (280, 140) solo en dispositivos táctiles; saltar es tocar la mitad izquierda.
- **Debug:** F1 (solo en desarrollo) dibuja los cuerpos Arcade.

## Verificación

Pruebas unitarias (46) y build sin errores. En Chromium sin interfaz: salto corto ≈ 22–28 px y largo ≈ 58 px, hitbox agachado 12 × 10, caída rápida a 450 px/s, como máximo 3 proyectiles con ≥ 350 ms entre disparos, disparo de pie, en el aire y agachado, clic del mouse, F1, y controles táctiles en 667 × 375 y 915 × 412.
