# Vault Runner

Endless runner 2D en pixel art para navegador, en celular y en PC. Tu personaje corre solo; tú decides cuándo **saltar**, **agacharte** y **disparar** para esquivar obstáculos y eliminar enemigos a través de cuatro zonas, cada una con su música, mientras la velocidad sube. Recoge powerups, supera tu récord personal y vuelve a intentarlo.

El juego se hizo de principio a fin con IA para el video *"Hicimos un videojuego utilizando solo IA"*. El documento de especificaciones ([`especificaciones.md`](especificaciones.md)) fue la fuente de verdad y todos los prompts usados están en [`/prompts`](prompts).

**Jugar:** https://techvault404.github.io/VaultRunner/ (en el teléfono, en horizontal)

## Cómo se juega

- Crea tu personaje en el editor (piel, ropa, cabello, accesorio, arma y nombre) y dale a **JUGAR**.
- Un golpe termina la partida, salvo que tengas escudo. Caer en un hueco también.
- Puntos: 1 por metro, +10 por moneda, +50 por bug o dron, +100 por torreta, +150 por Glitch y +5 por pasar muy cerca de un obstáculo.
- Zonas: Ciudad Pixel (0 m), Bosque Glitch (500 m), Servidor Abandonado (1,500 m) y Núcleo de la IA (3,000 m); después, otra vuelta.
- La primera partida empieza con un tutorial de tres pasos.

| Powerup | Efecto |
|---|---|
| Escudo | Aguanta un golpe (o una caída en un hueco) |
| Imán | Atrae las monedas cercanas |
| Doble salto | Un segundo salto en el aire |
| Disparo triple | Tres disparos en abanico, más rápido |
| Puntos ×2 | Duplica todo lo que ganas |
| Turbo | Velocidad ×1.8, invulnerable y destruyendo lo que toca |

## Controles

| Acción | Teclado | Táctil | Control |
|---|---|---|---|
| Saltar (mantén para saltar más alto) | Espacio, W, ↑ | Tocar la mitad izquierda | A |
| Agacharse / caída rápida | S, ↓ | Botón ↓ o deslizar hacia abajo | ↓ |
| Disparar (mantén para seguir) | J, K o clic | Botón de disparo | B |
| Pausa | Esc, P | Botón de pausa | Start |

En los menús: flechas o WASD para moverte, Enter o Espacio para elegir, Esc para volver. Todo se puede usar también con el mouse o con el dedo. El juego se pausa solo si cambias de pestaña o bloqueas el teléfono.

## Correrlo localmente

Necesitas Node.js 20.19+ o 22.12+.

```bash
npm install
npm run dev
```

Abre la dirección que muestra Vite (por ejemplo, http://localhost:5173/).

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Pruebas unitarias (Vitest) de la lógica pura |
| `npm run typecheck` | Revisión de tipos |
| `npm run build` | Build estático en `dist/` |
| `npm run preview` | Sirve el build |

Para depurar, en el servidor de desarrollo:

- `?seed=N` repite el mismo mundo. Funciona también en el sitio publicado.
- `?startM=2000` empieza en ese metro.
- `?god=1` hace al personaje invencible.
- F1 muestra las hitboxes.

Las partidas con `startM` o `god` no guardan récord.

## Publicación

Cada push a `main` construye el juego y lo publica en GitHub Pages con [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). También se puede lanzar a mano desde la pestaña *Actions*. En *Settings › Pages*, la fuente debe ser **GitHub Actions**. El build usa rutas relativas, así que funciona en cualquier subcarpeta.

## Estructura

```
src/config.ts     constantes de juego (balance)
src/theme.ts      tokens visuales (colores, posiciones, capas, tiempos) — ver DISENO.md
src/scenes/       Boot, Preload, Menu, CharacterEditor, Game, Pause, GameOver, Volume, Rotate
src/entities/     jugador, enemigos, obstáculos, powerups, monedas, efectos
src/systems/      input, spawn, puntaje, dificultad, zonas, powerups, audio, guardado
src/ui/           HUD, botones, textos con la fuente pixel
public/assets/    sprites, tiles, fondos, UI, fuente y audio (manifest.json)
tests/            pruebas de la lógica pura
prompts/          prompts usados en cada fase
```

## Créditos de IA

- **Código, diseño y documentación:** [Claude](https://claude.com) (Anthropic) con Claude Code, a partir de [`especificaciones.md`](especificaciones.md) y [`DISENO.md`](DISENO.md). Los prompts de cada fase están en [`/prompts`](prompts).
- **Pixel art:** generado por código (scripts de Python escritos con IA) con la paleta Endesga 32. Ver [`ASSETS.md`](ASSETS.md).
- **Música y efectos de sonido:** chiptune sintetizado por código (scripts de Python escritos con IA, solo biblioteca estándar y `ffmpeg`).
- **Fuente:** Vault 5×7, fuente bitmap propia del proyecto.

## Licencias

- Arte, música, efectos de sonido y fuente: originales, creados para este proyecto.
- Paleta [Endesga 32](https://lospec.com/palette-list/endesga-32): de uso libre.
- [Phaser 3](https://phaser.io): licencia MIT.
