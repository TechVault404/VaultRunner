# Fase 0 — Base del proyecto

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Revisión del documento (antes de implementar)

> See the specification in @especificaciones.md ? I want you to understand what we are going to try to build

La IA resumió el documento y señaló ambigüedades. Respuestas:

> 1. Are you able to shoot faster? Meaning, if there can only be at max 3 bullets at once, that means without the triple shot, I can shot with an enough cadence that allows 3 bullets to be on screen or is it always ensuring that you can only shoot when the bullet is out of the screen? Depending on this, I will decide
> 2. last exactly 3 seconds
> 3. let's go with 12x10
> 4. Agree
> 5. If the points is about distance, enemies should not give points (unless the .md says destroying enemies gives you points). But everything should be x2 as it says
> 6. Let's go back to this when we go onto this phase.
> 7. Fix the spec error
>
> Remember we are going to start phase by phase and the workflow should be done in branches and when everything is correct, we merge to develop. Main is only for releases

Decisiones posteriores (preguntas de opción múltiple):
- Disparo triple: el máximo de proyectiles sube a 9 mientras está activo.
- Enemigos destruidos por el Turbo: dan sus puntos normales.
- Fusión: PR de GitHub hacia `develop`.
- Releases a `main`: manuales, fuera del flujo de la IA.

Todas quedaron registradas en la sección 18 del documento.

## Prompt de la fase

> Implementa la Fase 0 (sección 7): crea el proyecto Vite + TypeScript + Phaser 3 con la estructura de carpetas de la sección 3, la configuración de resolución pixel-perfect, todas las escenas vacías con su navegación, el `SaveSystem` versionado y el `InputSystem` con acciones abstractas. Usa placeholders de color para todo.

## Ajuste: estándar de diseño

Después de la primera versión se agregaron `DISENO.md`, `src/theme.ts`, `ASSETS.md`, los assets en `public/assets/`, `screens/`, `docs/diseno/` y `tools/assets/`.

> See the things I added? I've also added a @DISENO.md. Follow the design for this phase 0

La IA rehízo las escenas de la Fase 0 con la BitmapFont, los botones y paneles 9-slice, el HUD y las coordenadas de `screens/*.png`, y movió todo valor visual a `src/theme.ts`.
