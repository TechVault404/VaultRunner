"""Compone pantallas de referencia a 320x180 usando los assets reales."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageEnhance
from pix import Spr, RGB
import font as F
import character as C

A = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'screens')
os.makedirs(OUT, exist_ok=True)
GROUND = 148
_cache = {}


def load(p):
    if p not in _cache:
        _cache[p] = Image.open(os.path.join(A, p)).convert('RGBA')
    return _cache[p]


def frame(p, fw, fh, i):
    return load(p).crop((i * fw, 0, i * fw + fw, fh))


class Screen:
    def __init__(self, w=320, h=180):
        self.im = Image.new('RGBA', (w, h), RGB['black'] + (255,))

    def put(self, im, x, y, scale=1, alpha=None):
        if scale != 1:
            im = im.resize((im.width * scale, im.height * scale), Image.NEAREST)
        if alpha is not None:
            im = im.copy()
            a = im.getchannel('A').point(lambda v: int(v * alpha))
            im.putalpha(a)
        layer = Image.new('RGBA', self.im.size)
        layer.paste(im, (int(x), int(y)))
        self.im = Image.alpha_composite(self.im, layer)

    def text(self, msg, x, y, color='white', scale=1, shadow='black', align='left'):
        w = F.measure(msg, scale)
        if align == 'center':
            x -= w // 2
        elif align == 'right':
            x -= w
        s = Spr(self.im.width, self.im.height)
        F.text_shadow(s, msg, int(x), int(y), color, shadow, scale)
        self.put(s.img(), 0, 0)
        return w

    def rect(self, x0, y0, x1, y1, color, alpha=1.0):
        layer = Image.new('RGBA', self.im.size)
        r = Image.new('RGBA', (x1 - x0 + 1, y1 - y0 + 1), RGB[color] + (int(255 * alpha),))
        layer.paste(r, (x0, y0))
        self.im = Image.alpha_composite(self.im, layer)

    def nine(self, path, fi, x, y, w, h, b=5, fw=16):
        src = frame(path, fw, 16, fi) if fi is not None else load(path)
        S = 16
        cuts = [(0, b), (b, S - b), (S - b, S)]
        xs = [(x, b), (x + b, w - 2 * b), (x + w - b, b)]
        ys = [(y, b), (y + b, h - 2 * b), (y + h - b, b)]
        for j, (sy0, sy1) in enumerate(cuts):
            for i, (sx0, sx1) in enumerate(cuts):
                piece = src.crop((sx0, sy0, sx1, sy1))
                dw, dh = xs[i][1], ys[j][1]
                if dw > 0 and dh > 0:
                    self.put(piece.resize((dw, dh), Image.NEAREST), xs[i][0], ys[j][0])

    def button(self, label, x, y, w, h=16, state=0, icon=None):
        self.nine('ui/button.png', state, x, y, w, h)
        off = 1 if state == 2 else 0
        tx = x + w // 2
        if icon is not None:
            iw = 12 + 3 + F.measure(label)
            self.put(frame('ui/icons.png', 12, 12, ICONS.index(icon)), x + (w - iw) // 2, y + (h - 12) // 2 + off)
            tx = x + (w - iw) // 2 + 15 + F.measure(label) // 2
        self.text(label, tx, y + (h - 7) // 2 + off, 'white', align='center', shadow='dblue')

    def bg(self, zone, darken=None, ox=0, ground=True):
        for l in ('far', 'mid', 'near'):
            im = load(f'backgrounds/zona{zone}_{l}.png')
            fac = {'far': 0.1, 'mid': 0.3, 'near': 0.6}[l]
            sh = int(ox * fac) % 320
            im = Image.fromarray(__import__('numpy').roll(__import__('numpy').array(im), -sh, axis=1))
            self.put(im, 0, 0)
        if ground:
            self.ground(zone, ox)

    def ground(self, zone, ox=0, gap=None):
        t = f'tiles/zona{zone}.png'
        for i, x in enumerate(range(-(ox % 16), 320, 16)):
            tx = x
            if gap and gap[0] <= x < gap[1]:
                continue
            ti_top, ti_fill = (i % 2, 2 + (i % 3 == 0))
            if gap and x + 16 == gap[0]:
                ti_top, ti_fill = 4, 6
            if gap and x == gap[1]:
                ti_top, ti_fill = 5, 7
            self.put(frame(t, 16, 16, ti_top), tx, GROUND)
            self.put(frame(t, 16, 16, ti_fill), tx, GROUND + 16)

    def player(self, cfg, fname, x, y_feet, scale=1):
        """x = esquina izquierda del frame, y_feet = coordenada de los pies."""
        spr = C.compose(fname, cfg)
        self.put(spr.img(), x, y_feet - 24 * scale, scale)

    def save(self, name, scale=1):
        im = self.im if scale == 1 else self.im.resize((self.im.width * scale, self.im.height * scale), Image.NEAREST)
        im.save(os.path.join(OUT, name))
        return im


ICONS = ['pause', 'play', 'sound_on', 'sound_off', 'music_on', 'music_off', 'fullscreen', 'retry', 'home', 'dice', 'arrow_l', 'arrow_r', 'reset']
PU = ['shield', 'magnet', 'doublejump', 'tripleshot', 'x2', 'turbo']
HERO = dict(skin=1, outfit=1, outfitColor=4, hair=2, hairColor=0, accessory=3, weapon=0, name='MIGUE')


def hud(s, score, best, dist, pus=(), beaten=False):
    s.text(f'{score:07d}', 5, 5, 'white', 1)
    s.text(f'RÉCORD {best:07d}', 5, 15, 'amber' if beaten else 'gray', 1)
    s.text(f'{dist} M', 5, 25, 'cyan')
    x = 288
    for k, frac in pus:
        x -= 18
        s.rect(x - 1, 4, x + 14, 22, 'black', 0.55)
        s.put(frame('sprites/pickups/powerups.png', 12, 12, PU.index(k)), x + 1, 5)
        s.rect(x + 1, 19, x + 12, 20, 'dnavy')
        s.rect(x + 1, 19, x + 1 + int(11 * frac), 20, 'cyan' if frac > 0.25 else 'neon')
    s.put(frame('ui/touch_pause.png', 32, 32, 0).resize((16, 16), Image.NEAREST), 299, 5)


def coins(s, pts):
    for (x, y), f in zip(pts, [0, 1, 2, 3] * 10):
        s.put(frame('sprites/pickups/coin.png', 8, 8, f), x, y)


def floating(s, msg, x, y, col='yellow'):
    s.text(msg, x, y, col, shadow='black', align='center')


def touch(s):
    s.put(frame('ui/touch_shoot.png', 32, 32, 0), 280, 140, alpha=0.6)
    s.put(frame('ui/touch_crouch.png', 32, 32, 0), 8, 140, alpha=0.6)
    s.rect(20, 52, 140, 66, 'black', 0.6)
    s.text('TOCA AQUÍ: SALTAR', 80, 56, 'white', align='center', shadow='black')
    s.rect(176, 52, 300, 66, 'black', 0.6)
    s.text('BOTÓN: DISPARAR', 238, 56, 'white', align='center', shadow='black')
    for y in range(40, 175, 4):
        s.rect(159, y, 159, y + 1, 'lgray', 0.35)


# ── 1. Menú
def menu():
    s = Screen()
    s.bg(1)
    s.rect(0, 0, 319, 179, 'black', 0.25)
    s.put(load('ui/logo.png'), 160 - 84, 10)
    s.player(HERO, 'run2', 56, GROUND, 2)
    s.put(frame('sprites/fx/dust.png', 8, 8, 1), 50, GROUND - 7)
    s.button('JUGAR', 124, 74, 72, 18, 1, 'play')
    s.button('PERSONAJE', 124, 96, 72, 16, 0)
    s.nine('ui/panel.png', None, 112, 118, 96, 22)
    s.text('RÉCORD', 160, 122, 'gray', align='center')
    s.text('12,480', 160, 131, 'amber', align='center')
    for i, ic in enumerate(['music_on', 'sound_on', 'fullscreen']):
        s.nine('ui/button.png', 0, 250 + i * 22, 6, 18, 18)
        s.put(frame('ui/icons.png', 12, 12, ICONS.index(ic)), 253 + i * 22, 9)
    s.text('MIGUE', 72, 98, 'white', align='center')
    return s


# ── 2. Editor de personaje
def editor(cfg=HERO, sel=1):
    s = Screen()
    s.put(load('backgrounds/zona4_far.png'), 0, 0)
    s.rect(0, 0, 319, 179, 'black', 0.45)
    s.text('TU PERSONAJE', 160, 6, 'white', 1, align='center')
    # vista previa ×4
    s.nine('ui/panel.png', None, 118, 20, 84, 116)
    s.rect(122, 118, 197, 131, 'navy', 0.6)
    s.player(cfg, 'run1', 128, 128, 4)
    s.text(cfg['name'], 160, 124, 'amber', align='center')
    rows = [('PIEL', C.SKIN_NAMES[cfg['skin']]), ('ROPA', C.OUTFITS[cfg['outfit']]), ('CABELLO', C.HAIRS[cfg['hair']]),
            ('ACCESORIO', C.ACCESSORIES[cfg['accessory']]), ('ARMA', C.WEAPONS[cfg['weapon']])]
    for i, (lab, val) in enumerate(rows):
        y = 22 + i * 22
        s.text(lab, 8, y, 'gray')
        on = i == sel
        s.nine('ui/panel.png', None, 6, y + 8, 104, 13)
        if on:
            s.rect(7, y + 9, 108, y + 19, 'dblue', 0.9)
        s.put(frame('ui/icons.png', 12, 12, ICONS.index('arrow_l')), 7, y + 9)
        s.put(frame('ui/icons.png', 12, 12, ICONS.index('arrow_r')), 97, y + 9)
        s.text(val, 58, y + 11, 'white' if on else 'lgray', align='center')
    # colores
    from character import OUTFIT_COLORS, HAIR_COLORS
    s.text('COLOR DE ROPA', 212, 22, 'gray')
    for i, (l, m, d) in enumerate(OUTFIT_COLORS):
        x, y = 212 + (i % 4) * 25, 31 + (i // 4) * 13
        if i == cfg['outfitColor']:
            s.rect(x - 2, y - 2, x + 21, y + 11, 'white')
        s.rect(x, y, x + 19, y + 9, m); s.rect(x, y, x + 19, y + 1, l); s.rect(x, y + 8, x + 19, y + 9, d)
    s.text('COLOR DE CABELLO', 212, 62, 'gray')
    for i, (l, m, d) in enumerate(HAIR_COLORS):
        x, y = 212 + (i % 3) * 33, 71 + (i // 3) * 13
        if i == cfg['hairColor']:
            s.rect(x - 2, y - 2, x + 29, y + 11, 'white')
        s.rect(x, y, x + 27, y + 9, m); s.rect(x, y, x + 27, y + 1, l); s.rect(x, y + 8, x + 27, y + 9, d)
    s.text('NOMBRE', 212, 102, 'gray')
    s.nine('ui/panel.png', None, 210, 110, 104, 15)
    s.text(cfg['name'] + '_', 216, 114, 'white')
    s.button('ALEATORIO', 6, 150, 92, 18, 0, 'dice')
    s.button('RESTABLECER', 104, 150, 92, 18, 0, 'reset')
    s.button('GUARDAR Y JUGAR', 202, 150, 112, 18, 1)
    s.text('← → CAMBIAR   ↑ ↓ CATEGORÍA   ENTER ELEGIR', 160, 140, 'dgray', align='center', shadow=None)
    return s


# ── 3. Juego: Ciudad Pixel (tutorial + bug + monedas)
def game1(mobile=False):
    s = Screen()
    s.bg(1, ox=40)
    s.put(load('sprites/obstacles/zona1/low.png'), 150, GROUND - 16)
    s.put(frame('sprites/enemies/bug.png', 16, 16, 1), 248, GROUND - 16)
    coins(s, [(100 + i * 12, 112 - (6 if 0 < i < 4 else 0)) for i in range(5)])
    s.player(HERO, 'jump', 64, GROUND - 34)
    s.put(frame('sprites/player/projectile_0.png', 6, 3, 0), 112, GROUND - 52)
    s.put(frame('sprites/fx/dust.png', 8, 8, 2), 60, GROUND - 8)
    hud(s, 1284, 12480, 128)
    if not mobile:
        s.rect(96, 52, 224, 72, 'black', 0.6)
        s.text('¡SALTA!', 160, 55, 'yellow', 1, align='center')
        s.text('ESPACIO / W / ↑', 160, 64, 'lgray', align='center', shadow=None)
    else:
        touch(s)
    floating(s, '+10', 108, 96)
    return s


# ── 4. Juego: Bosque Glitch (powerups, drones, disparo triple, récord superado)
def game2():
    s = Screen()
    s.bg(2, ox=120)
    s.put(frame('sprites/obstacles/zona2/air.png', 32, 8, 0), 208, 124)
    for i, (x, y) in enumerate([(176, 80), (230, 96), (270, 70)]):
        s.put(frame('sprites/enemies/drone.png', 16, 12, i % 2), x, y)
    s.put(frame('sprites/fx/explosion.png', 16, 16, 1), 150, 92)
    floating(s, '+100', 158, 80, 'yellow')
    for dy in (-5, 0, 5):
        s.put(frame('sprites/player/projectile_0.png', 6, 3, 0), 96 + abs(dy) * 4, 128 + dy * 2)
    s.put(frame('sprites/fx/shield_bubble.png', 24, 28, 0), 60, GROUND - 26)
    s.player(HERO, 'shoot0', 64, GROUND)
    s.put(frame('sprites/fx/muzzle.png', 6, 6, 0), 80, GROUND - 16)
    s.put(frame('sprites/pickups/powerups.png', 12, 12, 5), 300, 108)
    hud(s, 13020, 12480, 812, pus=[('shield', 0.8), ('tripleshot', 0.45), ('x2', 0.2)], beaten=True)
    s.rect(98, 30, 222, 44, 'black', 0.6)
    s.text('¡RÉCORD SUPERADO!', 160, 34, 'amber', align='center')
    s.text('×2', 254, 26, 'yellow')
    return s


# ── 5. Juego: Servidor Abandonado (torreta, agacharse, hueco, sierra)
def game3():
    s = Screen()
    s.bg(3, ox=200, ground=False)
    s.ground(3, 0, gap=(192, 224))
    s.rect(192, GROUND + 2, 223, 179, 'black')
    s.put(frame('sprites/obstacles/zona3/air.png', 32, 8, 0), 58, 124)
    s.player(HERO, 'crouch0', 64, GROUND)
    s.put(frame('sprites/enemies/turret.png', 16, 16, 1), 260, GROUND - 16)
    s.put(frame('sprites/enemies/enemy_bullet.png', 6, 4, 0), 150, GROUND - 10)
    s.put(frame('sprites/enemies/enemy_bullet.png', 6, 4, 1), 210, GROUND - 10)
    s.put(frame('sprites/obstacles/zona3/saw.png', 16, 16, 0), 140, 104)
    s.rect(147, 92, 148, 132, 'dgray', 0.5)
    s.put(load('sprites/obstacles/zona3/wall.png'), 300, GROUND - 32)
    coins(s, [(196 + i * 10, 118 - [0, 8, 10, 8][i]) for i in range(4)])
    hud(s, 2210, 12480, 1690, pus=[('magnet', 0.6)])
    return s


# ── 6. Juego: Núcleo de la IA (glitch, turbo, transición de zona)
def game4():
    s = Screen()
    s.bg(4, ox=60)
    s.put(load('sprites/obstacles/zona4/low.png'), 220, GROUND - 16)
    s.put(frame('sprites/enemies/glitch.png', 16, 16, 1), 168, GROUND - 26)
    s.put(frame('sprites/enemies/glitch.png', 16, 16, 3), 250, 112)
    s.put(frame('sprites/fx/trail.png', 24, 20, 1), 42, GROUND - 22)
    s.put(frame('sprites/fx/aura.png', 20, 28, 0), 62, GROUND - 26)
    s.player(HERO, 'run3', 64, GROUND)
    hud(s, 4890, 12480, 3012, pus=[('turbo', 0.7)])
    s.rect(0, 64, 319, 92, 'black', 0.7)
    s.rect(0, 64, 319, 64, 'cyan'); s.rect(0, 92, 319, 92, 'cyan')
    s.text('ZONA 4', 160, 68, 'cyan', align='center')
    s.text('NÚCLEO DE LA IA', 160, 78, 'white', 1, align='center')
    return s


# ── 7. Pausa
def pause():
    s = game2()
    s.rect(0, 0, 319, 179, 'black', 0.65)
    s.nine('ui/panel.png', None, 104, 40, 112, 100)
    s.text('PAUSA', 160, 50, 'white', 2, align='center')
    s.button('CONTINUAR', 116, 72, 88, 16, 1, 'play')
    s.button('REINICIAR', 116, 92, 88, 16, 0, 'retry')
    s.button('MENÚ', 116, 112, 88, 16, 0, 'home')
    return s


# ── 8. Game Over con nuevo récord
def gameover():
    s = Screen()
    s.bg(2, ox=300)
    s.rect(0, 0, 319, 179, 'black', 0.7)
    s.rect(70, 8, 250, 30, 'amber')
    s.rect(70, 8, 250, 9, 'yellow'); s.rect(70, 29, 250, 30, 'clay')
    s.text('¡NUEVO RÉCORD!', 160, 13, 'white', 2, align='center', shadow='rust')
    for x, f in ((58, 0), (254, 2)):
        s.put(frame('sprites/fx/spark.png', 8, 8, f), x, 14)
    s.nine('ui/panel.png', None, 70, 38, 180, 96)
    s.player(HERO, 'jump', 78, 104, 2)
    s.text('MIGUE', 94, 110, 'amber', align='center')
    rows = [('PUNTAJE', '13,020', 'white'), ('DISTANCIA', '1,012 M', 'cyan'), ('ENEMIGOS', '14', 'pink'),
            ('MONEDAS', '62', 'amber'), ('RÉCORD PREVIO', '12,480', 'gray')]
    for i, (k, v, c) in enumerate(rows):
        y = 46 + i * 16
        s.text(k, 122, y, 'gray')
        s.text(v, 242, y, c, align='right')
        if i < 4:
            s.rect(122, y + 11, 242, y + 11, 'dnavy')
    s.button('REINTENTAR', 70, 146, 86, 18, 1, 'retry')
    s.button('MENÚ', 164, 146, 86, 18, 0, 'home')
    return s


# ── 9. Móvil en vertical
def rotate():
    s = Screen(180, 320)
    s.put(load('backgrounds/zona1_far.png').crop((70, 0, 250, 180)).resize((180, 180), Image.NEAREST), 0, 70)
    s.rect(0, 0, 179, 319, 'black', 0.55)
    s.put(load('ui/logo.png'), 6, 40)
    # teléfono girando
    s.rect(70, 140, 109, 199, 'lgray'); s.rect(73, 144, 106, 193, 'dnavy'); s.rect(86, 196, 93, 197, 'gray')
    s.put(frame('ui/icons.png', 12, 12, ICONS.index('retry')), 112, 128, 2)
    s.text('GIRA TU', 90, 220, 'white', 2, align='center')
    s.text('TELÉFONO', 90, 240, 'white', 2, align='center')
    s.text('VAULT RUNNER SE JUEGA', 90, 268, 'gray', align='center')
    s.text('EN HORIZONTAL', 90, 278, 'gray', align='center')
    return s


if __name__ == '__main__':
    shots = {'01_menu': menu, '02_editor': editor, '03_juego_zona1': game1, '04_juego_zona2': game2,
             '05_juego_zona3': game3, '06_juego_zona4': game4, '07_pausa': pause, '08_gameover': gameover,
             '09_movil_controles': lambda: game1(True), '10_gira_telefono': rotate}
    for name, fn in shots.items():
        sc = fn()
        sc.save(name + '.png', 1)
        sc.save(name + '@4x.png', 4)
    print('ok')
