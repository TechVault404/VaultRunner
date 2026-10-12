# Fase 1 — Editor de personaje

## Prompt de sistema / contexto

> Eres un desarrollador senior de videojuegos con Phaser 3 y TypeScript. Te adjunto el documento de especificaciones del juego; es la fuente de verdad. Trabajaremos una fase a la vez. No implementes nada de fases futuras salvo lo que la fase actual pida dejar preparado. Todas las constantes van en `src/config.ts`. Si algo del documento es ambiguo, pregúntame antes de asumir. Sigue `DISENO.md`. Todo color, posición de UI, capa y tiempo visual sale de `src/theme.ts`; no escribas valores hexadecimales ni coordenadas de UI sueltas. Al terminar, lista qué criterios de aceptación cumple el código y cómo probar cada uno.

## Prompt de la fase

> Implementa la fase 1, crea una rama para esto que salga de develop.

(Equivale al prompt de la sección 14: *"Implementa la Fase 1 (sección 8): el editor de personaje por capas con tinte de paleta, vista previa animada a escala ×4, botones Aleatorio, Restablecer y Guardar y jugar, y persistencia de `CharacterConfig`. El personaje de la escena Game debe construirse con la misma configuración."*)

## Plan y decisiones

La IA propuso un plan (rama `fase-1/editor-personaje`) y preguntó dos cosas:

- **Esc en el editor:** cancelar y volver al menú sin guardar; solo GUARDAR Y JUGAR guarda.
- **Al terminar:** commit, push y PR hacia `develop`.

Otras decisiones tomadas al implementar:

- **Colores pre-pintados en vez de tinte.** La especificación pide "tinte o intercambio de paleta"; `DISENO.md` prohíbe `setTint` en personajes y los assets ya traen cada variante pintada (`outfit_{estilo}_{color}`, `hair_{estilo}_{color}`). Es el intercambio de paleta hecho de antemano.
- **Nombre:** se escribe con un `<input>` HTML invisible para que en el teléfono se abra el teclado. Solo acepta los caracteres de la fuente pixel (A–Z, 0–9, ÁÉÍÓÚÜÑ y espacio), en mayúsculas, máximo 10.
- **Medidas:** las coordenadas salen de `screens/02_editor.png`. Los tres botones miden 18 px de alto, como en la referencia.

## Ajuste: sonidos de los controles

> agregale sonidos de controles (cuando se seleccionan o cambian caracteristicas, cuando se usa el aleatorio, etc)

La IA generó 7 sonidos chiptune de interfaz como `.wav` con un script propio (estilo sfxr), los registró en `manifest.json` y agregó `playSfx` en `systems/AudioSystem.ts`. Los sonidos respetan el interruptor de efectos del menú. Todos los botones del juego suenan al pulsarse, y mover el foco en cualquier menú hace un "bip". En el editor también suenan cambiar una opción o un color, ALEATORIO (dado), RESTABLECER, escribir el nombre y salir con Esc.

## Ajuste: requisito responsivo en la especificación

> un detalle importante que quiero agreues tambien en @especificaciones.md ya que para todas las fases se debe de considerar esto. El juego debe de ser responsivo ya que esta pensado para jugarse en celular o bien en pc

La IA agregó la sección "Diseño responsivo" en §3, con pantallas objetivo, reglas y criterios transversales de aceptación. También añadió la regla 5 en §1, una línea en el prompt de sistema (§14), una prueba final en §16 y la decisión en §18.
