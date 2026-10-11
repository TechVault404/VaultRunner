"""Genera todos los assets de Vault Runner en out/public/assets + manifest.json."""
import json, os, sys, shutil
sys.path.insert(0, os.path.dirname(__file__))
from pix import Spr, sheet, save, HEX, ORDER, RGB
import character as C
import world as Wd
import font as F

ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'assets')
ROOT = os.path.abspath(ROOT)
if os.path.exists(ROOT):
    shutil.rmtree(ROOT)
manifest = {'spritesheets': [], 'images': [], 'bitmapFonts': [], 'notes': {}}


def ss(key, path, frames, fw, fh, **meta):
    save(sheet(frames), os.path.join(ROOT, path))
    manifest['spritesheets'].append(dict(key=key, url='assets/' + path, frameWidth=fw, frameHeight=fh, frames=len(frames), **meta))


def img(key, path, spr, **meta):
    save(spr, os.path.join(ROOT, path))
    manifest['images'].append(dict(key=key, url='assets/' + path, width=spr.w, height=spr.h, **meta))


# ── Paleta
pal = Spr(32, 1)
for i, k in enumerate(ORDER):
    pal.px[0][i] = k
img('palette', 'palette/endesga32.png', pal)
with open(os.path.join(ROOT, 'palette', 'endesga32.hex'), 'w') as f:
    f.write('\n'.join(HEX[k] for k in ORDER) + '\n')
with open(os.path.join(ROOT, 'palette', 'endesga32.gpl'), 'w') as f:
    f.write('GIMP Palette\nName: Endesga 32\nColumns: 8\n#\n')
    for k in ORDER:
        r, g, b = RGB[k]
        f.write(f'{r:3d} {g:3d} {b:3d}\t{k}\n')

# ── Personaje por capas (16 frames de 16x24 cada hoja)
anims = {'run': [0, 5, 12], 'jump': [6, 6, 1], 'fall': [7, 7, 1], 'crouch': [8, 9, 6],
         'shoot': [10, 11, 12], 'death': [12, 15, 10]}
manifest['notes']['player'] = {
    'frameOrder': C.FRAMES,
    'animations': {k: {'start': v[0], 'end': v[1], 'frameRate': v[2]} for k, v in anims.items()},
    'layerOrder': ['body_skin{skin}', 'outfit_{outfit}_{outfitColor}', 'hair_{hair}_{hairColor} (hair 0 = sin capa)',
                   'accessory_{accessory} (0 = sin capa)', 'weapon_{weapon}'],
    'origin': 'Pies en y=23 (fila inferior del frame). Agachado ocupa las 14 filas inferiores (sprite 16x14 alineado al suelo).',
    'options': {'skin': C.SKIN_NAMES, 'outfit': C.OUTFITS, 'outfitColor': C.OUTFIT_COLOR_NAMES,
                'hair': C.HAIRS, 'hairColor': C.HAIR_COLOR_NAMES, 'accessory': C.ACCESSORIES, 'weapon': C.WEAPONS},
}
for sk in range(4):
    ss(f'player_body_{sk}', f'sprites/player/body_skin{sk}.png', [C.body_layer(f, sk) for f in C.FRAMES], 16, 24)
for st in range(4):
    for col in range(8):
        ss(f'player_outfit_{st}_{col}', f'sprites/player/outfit_{st}_{col}.png', [C.outfit_layer(f, st, col) for f in C.FRAMES], 16, 24)
for st in range(1, 5):
    for col in range(6):
        ss(f'player_hair_{st}_{col}', f'sprites/player/hair_{st}_{col}.png', [C.hair_layer(f, st, col) for f in C.FRAMES], 16, 24)
for a in range(1, 5):
    ss(f'player_accessory_{a}', f'sprites/player/accessory_{a}.png', [C.accessory_layer(f, a) for f in C.FRAMES], 16, 24)
for w in range(3):
    ss(f'player_weapon_{w}', f'sprites/player/weapon_{w}.png', [C.weapon_layer(f, w) for f in C.FRAMES], 16, 24)
    ss(f'projectile_{w}', f'sprites/player/projectile_{w}.png', C.projectile(w), 6, 3, frameRate=12)
ss('muzzle', 'sprites/fx/muzzle.png', C.muzzle(), 6, 6, frameRate=20)

# ── Enemigos
ss('enemy_bug', 'sprites/enemies/bug.png', [Wd.bug(i) for i in range(4)], 16, 16, frameRate=10, faces='left')
ss('enemy_drone', 'sprites/enemies/drone.png', [Wd.drone(i) for i in range(2)], 16, 12, frameRate=14, faces='left')
ss('enemy_turret', 'sprites/enemies/turret.png', [Wd.turret(s) for s in ('idle', 'warn', 'fire', 'hit')], 16, 16,
   frameNames=['idle', 'warn', 'fire', 'hit'], faces='left')
ss('enemy_bullet', 'sprites/enemies/enemy_bullet.png', [Wd.enemy_bullet(i) for i in range(2)], 6, 4, frameRate=12)
ss('enemy_glitch', 'sprites/enemies/glitch.png', [Wd.glitch(i) for i in range(5)], 16, 16,
   frameNames=['idle0', 'idle1', 'tp0', 'tp1', 'tp2'], note='Teletransporte: reproducir 2→4, mover, luego 4→2')
ss('explosion', 'sprites/fx/explosion.png', [Wd.explosion(i) for i in range(4)], 16, 16, frameRate=13)

# ── Obstáculos y tiles por zona
for zi, z in enumerate(Wd.ZONES):
    k = z['key']
    img(f'{k}_low', f'sprites/obstacles/{k}/low.png', Wd.ob_low(z))
    img(f'{k}_spikes', f'sprites/obstacles/{k}/spikes.png', Wd.ob_spikes(z))
    ss(f'{k}_air', f'sprites/obstacles/{k}/air.png', [Wd.ob_air(z, f) for f in range(2)], 32, 8, frameRate=8)
    img(f'{k}_wall', f'sprites/obstacles/{k}/wall.png', Wd.ob_wall(z))
    img(f'{k}_double', f'sprites/obstacles/{k}/double.png', Wd.ob_double(z))
    ss(f'{k}_saw', f'sprites/obstacles/{k}/saw.png', [Wd.saw(z, f) for f in range(2)], 16, 16, frameRate=16)
    tiles = Wd.ground_tiles(z, zi)
    save(tiles, os.path.join(ROOT, f'tiles/{k}.png'))
    manifest['spritesheets'].append(dict(key=f'{k}_tiles', url=f'assets/tiles/{k}.png', frameWidth=16, frameHeight=16, frames=8,
                                         frameNames=['top_a', 'top_b', 'fill_a', 'fill_b', 'edgeL_top', 'edgeR_top', 'edgeL_fill', 'edgeR_fill']))
    far, mid, near = Wd.bg_layers(zi)
    for name, layer, fac in (('far', far, 0.1), ('mid', mid, 0.3), ('near', near, 0.6)):
        img(f'{k}_bg_{name}', f'backgrounds/{k}_{name}.png', layer, parallax=fac, seamless='horizontal')

# ── Monedas, powerups y efectos
ss('coin', 'sprites/pickups/coin.png', [Wd.coin(i) for i in range(4)], 8, 8, frameRate=10)
ss('powerups', 'sprites/pickups/powerups.png', [Wd.powerup_icon(p) for p in Wd.POWERUPS], 12, 12,
   frameNames=Wd.POWERUPS, labels=Wd.POWERUP_NAMES)
ss('fx_shield', 'sprites/fx/shield_bubble.png', [Wd.shield_bubble(i) for i in range(2)], 24, 28, frameRate=6)
ss('fx_aura', 'sprites/fx/aura.png', [Wd.aura(i) for i in range(4)], 20, 28, frameRate=12)
ss('fx_trail', 'sprites/fx/trail.png', [Wd.trail(i) for i in range(3)], 24, 20, frameRate=15)
ss('fx_dust', 'sprites/fx/dust.png', [Wd.dust(i) for i in range(4)], 8, 8, frameRate=14)
ss('fx_spark', 'sprites/fx/spark.png', [Wd.spark(i) for i in range(4)], 8, 8, frameRate=16)

# ── UI
img('logo', 'ui/logo.png', Wd.logo())
ss('button', 'ui/button.png', [Wd.button(s) for s in ('normal', 'hover', 'pressed')], 16, 16,
   frameNames=['normal', 'hover', 'pressed'], nineSlice=5)
img('panel', 'ui/panel.png', Wd.panel(), nineSlice=5)
icons = list(Wd.ICON_ROWS)
ss('icons', 'ui/icons.png', [Wd.icon(n) for n in icons], 12, 12, frameNames=icons)
for t in ('jump', 'crouch', 'shoot', 'pause'):
    ss(f'touch_{t}', f'ui/touch_{t}.png', [Wd.touch_button(t), Wd.touch_button(t, True)], 32, 32,
       frameNames=['normal', 'pressed'], alpha=0.55)
F.export(os.path.join(ROOT, 'fonts/vault5x7.png'), os.path.join(ROOT, 'fonts/vault5x7.xml'))
manifest['bitmapFonts'].append(dict(key='vault', textureURL='assets/fonts/vault5x7.png', fontDataURL='assets/fonts/vault5x7.xml',
                                    note='Solo mayúsculas; usar text.toUpperCase(). Incluye ÁÉÍÓÚÜÑ¡¿×.'))

manifest['spritesheets'] = [m for m in manifest['spritesheets'] if m]
with open(os.path.join(ROOT, 'manifest.json'), 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=1)
n = sum(len(fs) for _, _, fs in os.walk(ROOT))
print('archivos:', n, 'en', ROOT)
