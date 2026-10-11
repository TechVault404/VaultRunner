"""Enemigos, obstáculos por zona, monedas, powerups, partículas, tiles, fondos parallax y UI."""
import math, random
from pix import Spr, OUT, sheet, from_rows
from font import text_shadow, measure

# ───────────────────────────── ENEMIGOS ─────────────────────────────

def bug(frame):
    """Bug terrestre 16x16, mira a la izquierda (camina hacia el jugador). 4 frames de caminar."""
    s = Spr(16, 16)
    b = 1 if frame in (1, 3) else 0
    # caparazón
    for y in range(6, 13):
        for x in range(3, 14):
            if (x - 8.5) ** 2 / 30 + (y - 10.5) ** 2 / 14 <= 1:
                s.set(x, y - b, 'green')
    s.rect(5, 7 - b, 12, 7 - b, 'green')
    for y in range(7, 13):
        s.set(8, y - b, 'ddgreen')  # línea del caparazón
    s.set(6, 8 - b, 'yellow'); s.set(7, 8 - b, 'yellow'); s.set(10, 9 - b, 'yellow')
    s.rect(4, 11 - b, 13, 12 - b, 'dgreen')
    # cabeza (izquierda)
    s.rect(1, 9 - b, 4, 12 - b, 'dgreen')
    s.set(1, 10 - b, 'neon'); s.set(2, 10 - b, 'white')
    # antenas
    s.set(2, 8 - b, 'ddgreen'); s.set(1, 7 - b, 'ddgreen'); s.set(0, 6 - b, 'neon')
    s.set(4, 8 - b, 'ddgreen'); s.set(4, 7 - b, 'ddgreen'); s.set(5, 6 - b, 'neon')
    # patas alternadas
    legs = [(4, 6, 9), (5, 8, 11), (6, 10, 13)]
    for i, (_, a, c) in enumerate(legs):
        ph = (frame + i) % 2
        s.set(a + (1 if ph else 0), 13, 'ddgreen'); s.set(a - (0 if ph else 1), 14, 'ddgreen')
    # glitch: pixel corrupto
    s.set(12 - frame, 9 - b, 'cyan')
    return s.outline(OUT)


def drone(frame):
    """Dron volador 16x12, 2 frames (hélices)."""
    s = Spr(16, 12)
    s.rect(3, 4, 12, 8, 'gray')
    s.rect(4, 4, 11, 4, 'lgray')
    s.rect(3, 8, 12, 8, 'dgray')
    s.rect(1, 6, 2, 6, 'dgray'); s.rect(13, 6, 14, 6, 'dgray')
    # ojo rojo (mira a la izquierda)
    s.rect(4, 5, 6, 7, 'dnavy'); s.set(4, 6, 'neon'); s.set(5, 6, 'red')
    s.set(10, 6, 'green')
    # hélices
    if frame == 0:
        s.rect(0, 2, 4, 2, 'lgray'); s.rect(11, 2, 15, 2, 'lgray')
    else:
        s.rect(1, 2, 3, 2, 'gray'); s.rect(12, 2, 14, 2, 'gray')
    s.set(2, 3, 'dgray'); s.set(13, 3, 'dgray')
    # antena / patas
    s.set(5, 9, 'dgray'); s.set(10, 9, 'dgray'); s.set(4, 10, 'dgray'); s.set(11, 10, 'dgray')
    return s.outline(OUT)


def turret(state):
    """Torreta 16x16: 'idle', 'warn', 'fire', 'hit'."""
    s = Spr(16, 16)
    s.rect(2, 12, 13, 15, 'dgray'); s.rect(3, 12, 12, 12, 'gray')
    s.rect(4, 6, 11, 11, 'gray'); s.rect(5, 6, 10, 6, 'lgray'); s.rect(4, 11, 11, 11, 'dgray')
    s.rect(11, 13, 12, 13, 'amber'); s.rect(3, 13, 4, 13, 'amber')
    # cañón (izquierda)
    s.rect(0, 8, 4, 9, 'dnavy'); s.set(0, 8, 'navy')
    eye = {'idle': 'dred', 'warn': 'neon', 'fire': 'yellow', 'hit': 'white'}[state]
    s.rect(7, 8, 9, 9, eye)
    if state == 'warn':
        s.set(8, 4, 'neon'); s.set(8, 3, 'neon')
    if state == 'fire':
        s.set(0, 7, 'yellow'); s.set(0, 10, 'amber')
    if state == 'hit':
        s = s.recolor({k: 'white' for k in ['gray', 'lgray', 'dgray', 'dnavy', 'navy', 'amber']})
    return s.outline(OUT)


def enemy_bullet(frame):
    s = Spr(6, 4)
    s.rect(1, 1, 4, 2, 'neon'); s.rect(2, 1, 3, 2, 'white' if frame else 'pink')
    s.set(5, 1 + frame, 'red'); s.set(0, 2 - frame, 'dred')
    return s


def glitch(frame):
    """Glitch élite 16x16. frames 0-1 idle, 2-4 teletransporte (disolución)."""
    s = Spr(16, 16)
    rnd = random.Random(42 + frame)
    for y in range(2, 15):
        for x in range(3, 13):
            d = (x - 7.5) ** 2 / 25 + (y - 8.5) ** 2 / 42
            if d <= 1:
                c = 'plum'
                if d < 0.55:
                    c = 'magenta'
                if y in (5, 11) and frame == 1:
                    c = 'cyan'
                s.set(x, y, c)
    # ojos (mira izquierda)
    s.rect(4, 6, 5, 7, 'white'); s.set(4, 7, 'neon')
    s.rect(8, 6, 9, 7, 'white'); s.set(8, 7, 'neon')
    s.rect(5, 10, 9, 10, 'black'); s.set(6, 11, 'black'); s.set(8, 11, 'black')
    # desplazamiento de filas tipo glitch
    shift = {0: [(4, 1), (12, -1)], 1: [(3, -1), (9, 2)]}.get(frame, [])
    for row, dx in shift:
        line = s.px[row][:]
        s.px[row] = [line[(x - dx) % 16] for x in range(16)]
    if frame >= 2:
        k = frame - 1  # 1..3
        for y in range(16):
            if y % (4 - k + 1) != 0 and rnd.random() < 0.35 * k:
                s.px[y] = [None] * 16
            elif s.px[y].count(None) < 16:
                dx = rnd.randint(-k, k)
                line = s.px[y][:]
                s.px[y] = [line[(x - dx) % 16] for x in range(16)]
    s.outline(OUT)
    if frame >= 1:
        s.set(13, 4, 'cyan'); s.set(2, 12, 'neon')
    return s


def explosion(frame):
    """Explosión pixel 16x16, 4 frames (300 ms a ~13 fps)."""
    s = Spr(16, 16)
    r = [3, 6, 7, 7][frame]
    cols = [('white', 'yellow'), ('yellow', 'amber'), ('amber', 'orange'), ('dgray', 'gray')][frame]
    rnd = random.Random(7)
    s.circle(7.5, 7.5, r, cols[1])
    if frame < 3:
        s.circle(7.5, 7.5, r - 2, cols[0])
    if frame >= 2:
        s.circle(7.5, 7.5, r - 3 if frame == 2 else r - 1, None)
        for _ in range(10):
            a = rnd.random() * 6.28
            d = r - 1 + rnd.random() * 2
            s.set(7.5 + math.cos(a) * d, 7.5 + math.sin(a) * d, cols[0])
    if frame == 1:
        for a in range(0, 360, 45):
            s.set(7.5 + math.cos(math.radians(a)) * 7, 7.5 + math.sin(math.radians(a)) * 7, 'white')
    return s


# ─────────────────────────── OBSTÁCULOS ────────────────────────────

ZONES = [
    dict(key='zona1', name='Ciudad Pixel', main=('amber', 'clay', 'dbrown'), metal=('lgray', 'gray', 'dgray'),
         neon='neon', glow='pink', ground=('navy', 'dnavy', 'black'), top=('gray', 'dgray'), accent='cyan'),
    dict(key='zona2', name='Bosque Glitch', main=('brown', 'dbrown', 'ddbrown'), metal=('green', 'dgreen', 'ddgreen'),
         neon='magenta', glow='cyan', ground=('dbrown', 'ddbrown', 'black'), top=('green', 'dgreen'), accent='magenta'),
    dict(key='zona3', name='Servidor Abandonado', main=('gray', 'dgray', 'navy'), metal=('dgray', 'navy', 'dnavy'),
         neon='red', glow='green', ground=('dgray', 'navy', 'dnavy'), top=('lgray', 'gray'), accent='green'),
    dict(key='zona4', name='Núcleo de la IA', main=('cyan', 'blue', 'dblue'), metal=('magenta', 'plum', 'dnavy'),
         neon='cyan', glow='white', ground=('plum', 'dnavy', 'black'), top=('magenta', 'plum'), accent='cyan'),
]


def ob_low(z):
    s = Spr(16, 16)
    L, M, D = z['main']
    k = z['key']
    if k == 'zona1':  # caja de cartón con cinta
        s.rect(1, 3, 14, 15, M); s.rect(1, 3, 14, 4, L); s.rect(1, 14, 14, 15, D)
        s.rect(7, 3, 8, 15, 'sand'); s.rect(2, 9, 5, 9, D); s.set(12, 7, D)
    elif k == 'zona2':  # tocón con hongo glitch
        s.rect(2, 6, 13, 15, M); s.rect(2, 6, 13, 7, L); s.rect(2, 13, 13, 15, D)
        s.circle(7.5, 6.5, 3, 'sand', True); s.circle(7.5, 6.5, 1.5, L)
        s.rect(9, 1, 12, 3, 'magenta'); s.rect(10, 4, 11, 5, 'sand'); s.set(10, 1, 'pink'); s.set(12, 2, 'cyan')
        s.set(4, 10, D); s.set(5, 11, D); s.set(11, 11, D)
    elif k == 'zona3':  # UPS / caja de servidor
        s.rect(1, 2, 14, 15, M); s.rect(1, 2, 14, 3, L); s.rect(1, 14, 14, 15, D)
        for y in (6, 9, 12):
            s.rect(3, y, 12, y, D)
        s.set(12, 4, 'green'); s.set(10, 4, 'red'); s.set(3, 4, 'amber')
    else:  # bloque de datos (cristal)
        s.rect(2, 2, 13, 15, M); s.rect(2, 2, 13, 3, L); s.rect(2, 14, 13, 15, D)
        s.line(3, 13, 12, 4, L); s.line(4, 13, 12, 5, 'white')
        s.rect(6, 7, 9, 10, 'dblue'); s.set(7, 8, 'cyan')
    return s.outline(OUT)


def ob_spikes(z):
    """Variante 'pinchos' del obstáculo bajo (misma hitbox 16x16)."""
    s = Spr(16, 16)
    L, M, D = z['metal']
    s.rect(0, 13, 15, 15, D); s.rect(0, 13, 15, 13, M)
    for i in range(4):
        x0 = i * 4
        for h in range(9):
            hw = 2 - (h + 1) // 4
            if h == 8:
                s.set(x0 + 1, 12 - h, L)
                continue
            s.rect(x0 + 2 - hw, 12 - h, x0 + 1 + hw, 12 - h, M)
            s.set(x0 + 2 - hw, 12 - h, L)
    return s.outline(OUT)


def ob_air(z, frame=0):
    """Obstáculo aéreo 32x8 (barra/láser) a la altura de la cabeza."""
    s = Spr(32, 8)
    k = z['key']
    if k in ('zona1', 'zona4'):  # láser con emisores
        L, M, D = z['metal']
        s.rect(0, 0, 3, 7, M); s.rect(28, 0, 31, 7, M); s.rect(0, 0, 3, 0, L); s.rect(28, 0, 31, 0, L)
        beam = ('neon', 'pink') if k == 'zona1' else ('cyan', 'white')
        s.rect(4, 2, 27, 5, beam[0]); s.rect(4, 3 + frame % 2, 27, 3 + frame % 2, beam[1])
        if frame:
            s.set(10, 1, beam[0]); s.set(20, 6, beam[0])
    elif k == 'zona2':  # rama
        L, M, D = z['main']
        s.rect(0, 2, 31, 5, M); s.rect(0, 2, 31, 2, L); s.rect(0, 5, 31, 5, D)
        for x in (5, 14, 23):
            s.set(x, 1, 'green'); s.set(x + 1, 0, 'green'); s.set(x + 1, 1, 'dgreen')
        s.set(28, 6, 'magenta'); s.set(9, 6, 'cyan')
    else:  # bandeja de cables
        s.rect(0, 1, 31, 4, 'dgray'); s.rect(0, 1, 31, 1, 'gray')
        for x in range(1, 31, 4):
            s.set(x, 3, 'navy')
        for x, c in ((4, 'red'), (11, 'blue'), (19, 'amber'), (26, 'green')):
            s.line(x, 5, x + 1, 7, c)
    return s.outline(OUT) if k != 'zona4' else s


def ob_wall(z):
    """Muro 16x32."""
    s = Spr(16, 32)
    L, M, D = z['main']
    k = z['key']
    if k == 'zona1':  # pila de cajas
        for y0 in (0, 16):
            s.rect(1, y0 + 1, 14, y0 + 15, M); s.rect(1, y0 + 1, 14, y0 + 2, L); s.rect(1, y0 + 14, 14, y0 + 15, D)
            s.rect(7, y0 + 1, 8, y0 + 15, 'sand')
        s.rect(1, 15, 14, 16, OUT)
    elif k == 'zona2':  # tronco
        s.rect(3, 0, 12, 31, M); s.rect(3, 0, 4, 31, L); s.rect(11, 0, 12, 31, D)
        for y in (5, 13, 22):
            s.set(7, y, D); s.set(8, y + 1, D)
        s.rect(1, 0, 14, 2, 'green'); s.rect(2, 0, 13, 0, 'yellow')
        s.set(6, 17, 'magenta'); s.set(9, 9, 'cyan')
    elif k == 'zona3':  # rack de servidor
        s.rect(1, 0, 14, 31, 'dnavy'); s.rect(1, 0, 14, 1, 'gray'); s.rect(1, 0, 1, 31, 'dgray'); s.rect(14, 0, 14, 31, 'dgray')
        for y in range(3, 30, 4):
            s.rect(3, y, 12, y + 2, 'navy'); s.rect(3, y, 12, y, 'dgray')
            s.set(11, y + 1, 'green' if y % 8 == 3 else 'amber'); s.set(9, y + 1, 'green')
    else:  # pilar de circuitos
        L2, M2, D2 = z['metal']
        s.rect(2, 0, 13, 31, M2); s.rect(2, 0, 3, 31, L2); s.rect(12, 0, 13, 31, D2)
        s.line(7, 0, 7, 10, 'cyan'); s.line(7, 10, 10, 13, 'cyan'); s.line(10, 13, 10, 31, 'cyan')
        s.rect(6, 9, 8, 11, 'white'); s.rect(5, 20, 7, 22, 'cyan'); s.line(6, 22, 6, 31, 'blue')
    return s.outline(OUT)


def ob_double(z):
    s = Spr(32, 16)
    a = ob_low(z)
    s.paste(a, 0, 0); s.paste(a, 16, 0)
    return s


def saw(z, frame):
    """Sierra móvil 16x16, 2 frames de giro."""
    s = Spr(16, 16)
    L, M, D = z['metal'] if z['key'] != 'zona1' else ('lgray', 'gray', 'dgray')
    s.circle(7.5, 7.5, 5.5, M)
    for i in range(8):
        a = math.radians(i * 45 + frame * 22.5)
        s.set(7.5 + math.cos(a) * 7, 7.5 + math.sin(a) * 7, L)
        s.set(7.5 + math.cos(a) * 6.3, 7.5 + math.sin(a) * 6.3, L)
    s.circle(7.5, 7.5, 3.2, D)
    s.rect(7, 7, 8, 8, z['neon'])
    a = math.radians(frame * 45)
    s.set(7.5 + math.cos(a) * 4.5, 7.5 + math.sin(a) * 4.5, 'white')
    return s.outline(OUT)


# ───────────────────────────── TILES ─────────────────────────────

def ground_tiles(z, seed=1):
    """Tira de 8 tiles 16x16: top_a, top_b, fill_a, fill_b, edgeL_top, edgeR_top, edgeL_fill, edgeR_fill."""
    rnd = random.Random(seed)
    L, M, D = z['ground']
    T1, T2 = z['top']
    tiles = []

    def top(var):
        s = Spr(16, 16)
        s.rect(0, 0, 15, 15, M)
        s.rect(0, 0, 15, 1, T1); s.rect(0, 2, 15, 3, T2)
        k = z['key']
        if k == 'zona1':  # banqueta
            s.rect(0, 4, 15, 4, D); s.set(var * 8 + 3, 0, 'lgray')
            s.rect(0, 10, 15, 10, D); s.set(7 + var * 4, 11, D)
        elif k == 'zona2':  # pasto
            for x in range(0, 16, 3):
                s.set(x + var, 0, 'yellow' if x % 2 else T1)
                s.set(x + 1, 4, T2)
        elif k == 'zona3':  # piso técnico
            s.rect(0, 4, 15, 4, D); s.rect(15, 0, 15, 15, D); s.set(2, 6, L); s.set(13, 6, L)
            if var:
                s.rect(4, 8, 11, 9, 'dnavy'); s.set(5, 8, 'green')
        else:  # piso de circuito
            s.rect(0, 4, 15, 4, D); s.line(0, 8, 6, 8, 'cyan' if var else 'blue'); s.line(6, 8, 9, 11, 'blue'); s.line(9, 11, 15, 11, 'blue')
            s.set(6, 8, 'white')
        return s

    def fill(var):
        s = Spr(16, 16)
        s.rect(0, 0, 15, 15, D)
        for _ in range(4 + var * 2):
            x, y = rnd.randint(0, 14), rnd.randint(0, 14)
            s.set(x, y, M); s.set(x + 1, y, L if rnd.random() < 0.3 else M)
        if z['key'] == 'zona3':
            s.rect(0, 7, 15, 7, 'black')
        if z['key'] == 'zona4':
            s.set(3 + var * 6, 5, 'magenta'); s.set(11 - var * 4, 12, 'cyan')
        return s

    tiles = [top(0), top(1), fill(0), fill(1)]
    # bordes del hueco
    for base, side in ((top(0), 'L'), (top(0), 'R'), (fill(0), 'L'), (fill(0), 'R')):
        s = base
        xs = range(12, 16) if side == 'L' else range(0, 4)
        for y in range(16):
            for x in xs:
                s.px[y][x] = None
        edge = 11 if side == 'L' else 4
        for y in range(16):
            s.px[y][edge] = OUT
        tiles.append(s)
    return sheet(tiles)


# ─────────────────────────── FONDOS PARALLAX ───────────────────────────

BW, BH = 320, 180
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def dither_grad(s, y0, y1, cols):
    """Degradado vertical con dither ordenado entre colores de la paleta."""
    n = len(cols) - 1
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0 - 1)) * n
        i = min(int(t), n - 1)
        f = t - i
        for x in range(s.w):
            s.px[y][x] = cols[i + 1] if f * 16 > BAYER[y % 4][x % 4] else cols[i]


def wset(s, x, y, c):
    s.set(x % s.w, y, c)


def wrect(s, x0, y0, x1, y1, c):
    for y in range(int(y0), int(y1) + 1):
        for x in range(int(x0), int(x1) + 1):
            wset(s, x, y, c)


def bg_layers(zi):
    rnd = random.Random(100 + zi)
    far, mid, near = Spr(BW, BH), Spr(BW, BH), Spr(BW, BH)
    if zi == 0:  # Ciudad Pixel
        dither_grad(far, 0, BH, ['black', 'dnavy', 'plum', 'magenta'])
        for _ in range(60):
            far.set(rnd.randrange(BW), rnd.randrange(90), rnd.choice(['white', 'lgray', 'gray']))
        far.circle(250, 30, 9, 'sand'); far.circle(253, 27, 7, 'white'); far.set(247, 33, 'peach')
        x = 0
        while x < BW:
            w, h = rnd.randint(14, 30), rnd.randint(40, 95)
            wrect(mid, x, BH - h, x + w - 1, BH - 1, 'navy')
            wrect(mid, x, BH - h, x + w - 1, BH - h, 'dgray')
            for wy in range(BH - h + 4, BH - 10, 6):
                for wx in range(x + 3, x + w - 3, 5):
                    if rnd.random() < 0.35:
                        wrect(mid, wx, wy, wx + 1, wy + 2, rnd.choice(['amber', 'yellow', 'cyan']))
            if rnd.random() < 0.3:
                wset(mid, x + w // 2, BH - h - 1, 'dgray'); wset(mid, x + w // 2, BH - h - 2, 'neon')
            x += w + rnd.randint(0, 3)
        x = 0
        while x < BW:
            w, h = rnd.randint(30, 52), rnd.randint(55, 110)
            wrect(near, x, BH - h, x + w - 1, BH - 1, 'dnavy')
            wrect(near, x, BH - h, x + w - 1, BH - h + 1, 'black')
            for wy in range(BH - h + 6, BH - 6, 9):
                for wx in range(x + 4, x + w - 4, 7):
                    c = 'amber' if rnd.random() < 0.25 else 'navy'
                    wrect(near, wx, wy, wx + 3, wy + 4, c)
            if rnd.random() < 0.6:  # letrero neón
                sx, sy = x + 4, BH - h + 12
                col = rnd.choice(['neon', 'cyan', 'pink'])
                wrect(near, sx, sy, sx + 14, sy + 6, 'black')
                for i in range(15):
                    wset(near, sx + i, sy, col); wset(near, sx + i, sy + 6, col)
                for i in range(7):
                    wset(near, sx, sy + i, col); wset(near, sx + 14, sy + i, col)
                for i in range(3, 12, 3):
                    wrect(near, sx + i, sy + 2, sx + i + 1, sy + 4, col)
            x += w + rnd.randint(6, 20)
    elif zi == 1:  # Bosque Glitch
        dither_grad(far, 0, BH, ['dteal', 'ddgreen', 'dgreen', 'green'])
        for _ in range(14):  # cuadros glitch en el cielo
            x, y = rnd.randrange(BW), rnd.randrange(70)
            wrect(far, x, y, x + rnd.randint(2, 7), y + rnd.randint(0, 1), rnd.choice(['magenta', 'cyan', 'plum']))
        for x in range(BW):  # montañas
            h = 70 + 22 * math.sin(x / BW * 2 * math.pi * 2) + 12 * math.sin(x / BW * 2 * math.pi * 5 + 1)
            h = int(h)
            for y in range(BH - h, BH):
                mid.set(x, y, 'dteal' if y > BH - h + 2 else 'ddgreen')
            if x % 7 == 0:
                mid.set(x, BH - h + 3, 'dgreen')
        for k in range(9):
            tx = k * 36 + rnd.randint(0, 10)
            th = rnd.randint(60, 100)
            wrect(near, tx + 6, BH - th + 26, tx + 10, BH - 1, 'ddbrown')
            wrect(near, tx + 6, BH - th + 26, tx + 6, BH - 1, 'dbrown')
            for layer in range(3):  # copas en bloques "pixelados"
                ly = BH - th + layer * 10
                lw = 10 + layer * 5
                wrect(near, tx + 8 - lw // 2 - 2, ly, tx + 8 + lw // 2 + 2, ly + 11, 'ddgreen')
                wrect(near, tx + 8 - lw // 2 - 2, ly, tx + 8 + lw // 2, ly + 2, 'dgreen')
            if rnd.random() < 0.6:
                gy = BH - th + rnd.randint(4, 25)
                wrect(near, tx + rnd.randint(0, 12), gy, tx + 14, gy, rnd.choice(['magenta', 'cyan']))
        for _ in range(30):
            wset(near, rnd.randrange(BW), BH - rnd.randint(1, 20), rnd.choice(['green', 'dgreen']))
    elif zi == 2:  # Servidor Abandonado
        dither_grad(far, 0, BH, ['black', 'dnavy', 'navy'])
        for y in range(0, BH, 24):
            for x in range(BW):
                far.set(x, y, 'black')
        for x in range(0, BW, 32):
            for y in range(BH):
                far.set(x, y, 'black')
            for y in range(4, BH, 24):
                far.set(x + 2, y, 'dgray')
        for k in range(10):  # racks
            x = k * 32 + 4
            h = rnd.randint(80, 120)
            wrect(mid, x, BH - h, x + 21, BH - 1, 'dnavy')
            wrect(mid, x, BH - h, x + 21, BH - h, 'dgray')
            wrect(mid, x, BH - h, x, BH - 1, 'navy')
            for y in range(BH - h + 4, BH - 4, 5):
                wrect(mid, x + 3, y, x + 18, y + 2, 'navy')
                for lx in range(x + 13, x + 18, 2):
                    if rnd.random() < 0.5:
                        wset(mid, lx, y + 1, rnd.choice(['green', 'green', 'red', 'amber', 'cyan']))
        for k in range(14):  # cables colgantes
            x = rnd.randrange(BW)
            col = rnd.choice(['black', 'dnavy', 'dblue', 'dred', 'black'])
            sag = rnd.randint(18, 60)
            span = rnd.randint(30, 70)
            for i in range(span):
                y = int(sag * math.sin(math.pi * i / span))
                wset(near, x + i, y, col); wset(near, x + i, y + 1, col)
        for k in range(4):  # tubería
            pass
        wrect(near, 0, 0, BW - 1, 4, 'black'); wrect(near, 0, 5, BW - 1, 5, 'dgray')
        for x in range(0, BW, 40):
            wrect(near, x, 0, x + 3, 7, 'dgray')
    else:  # Núcleo de la IA
        dither_grad(far, 0, BH, ['black', 'black', 'dnavy', 'plum'])
        for _ in range(110):
            far.set(rnd.randrange(BW), rnd.randrange(BH), rnd.choice(['white', 'lgray', 'cyan', 'gray', 'gray']))
        hz = 120  # rejilla en perspectiva
        for x in range(BW):
            far.set(x, hz, 'magenta')
        for y in range(hz + 1, BH):
            if (y - hz) in (3, 8, 15, 25, 39, 57):
                for x in range(BW):
                    far.set(x, y, 'plum')
        for i in range(-20, 21):
            for y in range(hz, BH):
                x = int(BW / 2 + i * 16 * (y - hz) / 12)
                if 0 <= x < BW:
                    far.set(x, y, 'plum')
        for k in range(16):  # pistas de circuito
            x, y = rnd.randrange(BW), rnd.randint(20, 160)
            col = rnd.choice(['blue', 'dblue', 'cyan'])
            for _ in range(3):
                l = rnd.randint(10, 40)
                dx, dy = rnd.choice([(1, 0), (1, 1), (1, -1)])
                for i in range(l):
                    wset(mid, x, y, col); x += dx; y = max(10, min(170, y + dy))
            wrect(mid, x - 1, y - 1, x + 1, y + 1, 'cyan'); wset(mid, x, y, 'white')
        for k in range(26):  # partículas / bloques de datos
            x, y = rnd.randrange(BW), rnd.randint(10, 150)
            sz = rnd.choice([1, 1, 2, 3])
            col = rnd.choice(['cyan', 'magenta', 'white', 'blue'])
            wrect(near, x, y, x + sz - 1, y + sz - 1, col)
            if sz == 3:
                wset(near, x + 1, y + 1, 'white')
    return far, mid, near


# ───────────────────────── MONEDAS Y POWERUPS ─────────────────────────

def coin(frame):
    s = Spr(8, 8)
    w = [3, 2, 1, 2][frame]
    for y in range(8):
        for x in range(8):
            if ((x - 3.5) / (w + 0.01)) ** 2 + ((y - 3.5) / 3.5) ** 2 <= 1.05:
                s.set(x, y, 'amber')
    if frame == 0:
        s.rect(3, 2, 4, 5, 'yellow'); s.set(2, 1, 'white')
    elif frame == 2:
        s.rect(3, 1, 4, 6, 'clay')
    else:
        s.rect(3, 2, 3, 5, 'yellow')
    return s.outline(OUT)


POWERUPS = ['shield', 'magnet', 'doublejump', 'tripleshot', 'x2', 'turbo']
POWERUP_NAMES = ['Escudo', 'Imán', 'Doble salto', 'Disparo triple', 'Puntos ×2', 'Turbo']


def powerup_icon(kind):
    s = Spr(12, 12)
    if kind == 'shield':
        s.circle(5.5, 5.5, 5, 'blue'); s.circle(5.5, 5.5, 3.6, 'cyan')
        s.circle(5.5, 5.5, 2.4, 'blue'); s.rect(3, 2, 4, 3, 'white')
    elif kind == 'magnet':
        s.rect(1, 1, 3, 9, 'red'); s.rect(8, 1, 10, 9, 'red'); s.rect(1, 8, 10, 10, 'red')
        s.rect(4, 9, 7, 10, 'red'); s.rect(1, 1, 3, 2, 'lgray'); s.rect(8, 1, 10, 2, 'lgray')
        s.rect(2, 3, 2, 8, 'pink'); s.rect(4, 8, 7, 8, 'dred')
    elif kind == 'doublejump':
        s.rect(4, 4, 7, 9, 'amber'); s.rect(4, 9, 9, 10, 'clay'); s.rect(4, 4, 7, 4, 'yellow')
        s.rect(0, 2, 3, 3, 'white'); s.rect(1, 4, 3, 5, 'lgray'); s.rect(2, 6, 3, 6, 'lgray')
        s.rect(8, 2, 11, 3, 'white'); s.rect(8, 4, 10, 5, 'lgray')
    elif kind == 'tripleshot':
        for i, (y0, dy) in enumerate(((2, -1), (5, 0), (8, 1))):
            s.line(1, y0 + 1, 7, y0 + 1 + dy, 'green')
            s.rect(8, y0 + dy, 9, y0 + 2 + dy, 'yellow'); s.set(10, y0 + 1 + dy, 'yellow')
    elif kind == 'x2':
        s.circle(5.5, 5.5, 5.2, 'amber'); s.circle(5.5, 5.5, 4, 'yellow')
        s.set(2, 4, 'clay'); s.set(4, 4, 'clay'); s.set(3, 5, 'clay'); s.set(2, 6, 'clay'); s.set(4, 6, 'clay')
        s.rect(6, 3, 8, 3, 'clay'); s.set(8, 4, 'clay'); s.rect(6, 5, 8, 5, 'clay'); s.set(6, 6, 'clay'); s.rect(6, 7, 8, 7, 'clay')
        s.set(3, 2, 'white')
    elif kind == 'turbo':
        pts = [(7, 0), (6, 0), (2, 6), (5, 6), (3, 11), (4, 11), (9, 4), (6, 4), (8, 0)]
        rows = ['......##....', '.....##.....', '....##......', '...##.......', '..######....',
                '.....##.....', '....##......', '...##.......', '..##........', '.##.........', '............', '............']
        rows = ['.....####...', '....####....', '...####.....', '..####......', '.#######....',
                '....####....', '...###......', '..###.......', '.##.........', '.#..........', '............', '............']
        for y, r in enumerate(rows):
            for x, ch in enumerate(r):
                if ch == '#':
                    s.set(x + 1, y + 1, 'yellow')
        s.set(6, 1, 'white'); s.set(5, 2, 'white')
    return s.outline(OUT)


def shield_bubble(frame):
    """Burbuja del escudo 24x28 que envuelve al jugador (2 frames)."""
    s = Spr(24, 28)
    for y in range(28):
        for x in range(24):
            d = ((x - 11.5) / 11.5) ** 2 + ((y - 13.5) / 13.5) ** 2
            if 0.82 <= d <= 1.0:
                s.set(x, y, 'cyan' if (x + y + frame) % 3 else 'white')
    s.set(5, 6 + frame, 'white'); s.set(6, 5 + frame, 'white'); s.set(4, 8, 'cyan')
    return s


def aura(frame, col=('yellow', 'amber')):
    """Aura del Turbo / ×2: contorno parpadeante 20x28."""
    s = Spr(20, 28)
    rnd = random.Random(frame)
    for _ in range(26):
        a = rnd.random() * 6.28
        x = 9.5 + math.cos(a) * (8 + rnd.random() * 1.5)
        y = 14 + math.sin(a) * (12 + rnd.random() * 1.5)
        s.set(x, y, col[rnd.random() < 0.5])
    return s


def trail(frame):
    """Estela de velocidad 24x20 (va detrás del jugador)."""
    s = Spr(24, 20)
    for i, y in enumerate((3, 8, 13, 17)):
        l = 8 + ((i * 5 + frame * 3) % 12)
        s.rect(24 - l, y, 23, y, 'yellow' if i % 2 else 'white')
        s.rect(24 - l, y, 24 - l + 2, y, 'amber')
    return s


def dust(frame):
    s = Spr(8, 8)
    r = [1.2, 2.2, 3, 3.2][frame]
    col = ['lgray', 'lgray', 'gray', 'dgray'][frame]
    s.circle(3.5, 4.5, r, col)
    if frame >= 2:
        s.circle(3.5, 4.5, r - 1.3, None)
    return s


def spark(frame):
    s = Spr(8, 8)
    L = [1, 2, 3, 2][frame]
    c = ['white', 'yellow', 'amber', 'clay'][frame]
    for i in range(-L, L + 1):
        s.set(3 + i, 3, c); s.set(3, 3 + i, c)
    if frame == 1:
        for d in (2, -2):
            s.set(3 + d, 3 + d, 'yellow'); s.set(3 + d, 3 - d, 'yellow')
    return s


# ───────────────────────────── UI ─────────────────────────────

def button(state):
    """Botón 9-slice 16x16 (bordes de 5 px): normal, hover, presionado."""
    s = Spr(16, 16)
    face = {'normal': ('blue', 'cyan', 'dblue'), 'hover': ('cyan', 'white', 'blue'), 'pressed': ('dblue', 'blue', 'dnavy')}[state]
    off = 1 if state == 'pressed' else 0
    s.rect(1, 1 + off, 14, 14, face[0])
    s.rect(2, 1 + off, 13, 1 + off, face[1])
    s.rect(1, 14 - 2 + off, 14, 14, face[2]) if state != 'pressed' else None
    if state != 'pressed':
        s.rect(1, 13, 14, 14, face[2])
    s.outline(OUT)
    s.set(0, 0, None); s.set(15, 0, None); s.set(0, 15, None); s.set(15, 15, None)
    return s


def panel():
    """Panel 9-slice 16x16 (bordes de 5 px) para HUD y diálogos."""
    s = Spr(16, 16)
    s.rect(0, 0, 15, 15, 'dnavy')
    s.rect(1, 1, 14, 14, 'black')
    s.rect(1, 1, 14, 1, 'navy')
    s.set(0, 0, None); s.set(15, 0, None); s.set(0, 15, None); s.set(15, 15, None)
    s.set(2, 2, 'cyan'); s.set(13, 2, 'cyan')
    return s


ICON_ROWS = {
    'pause': ['..........', '.##...##..', '.##...##..', '.##...##..', '.##...##..', '.##...##..', '.##...##..', '..........'],
    'play': ['..#.......', '..###.....', '..#####...', '..#######.', '..#####...', '..###.....', '..#.......', '..........'],
    'sound_on': ['....#.....', '...##..#..', '####.#..#.', '####.#..#.', '####.#..#.', '...##..#..', '....#.....', '..........'],
    'sound_off': ['....#.....', '...##.....', '####.#...#', '####..#.#.', '####...#..', '...##.#.#.', '....##...#', '..........'],
    'music_on': ['...######', '...#....#', '...#....#', '...#....#', '.###..###', '####.####', '.##...##.', '.........'],
    'music_off': ['...######', '...#....#', '#..#....#', '.#.#....#', '.###..###', '####.####', '.##...##.', '.......#.'],
    'fullscreen': ['###..###', '#......#', '#......#', '........', '........', '#......#', '#......#', '###..###'],
    'retry': ['..###.#.', '.#...##.', '#...###.', '#.......', '#......#', '.#....#.', '..####..', '........'],
    'home': ['....#....', '...###...', '..#####..', '.#######.', '..#####..', '..##.##..', '..##.##..', '.........'],
    'dice': ['########', '#......#', '#.##.#.#', '#......#', '#.#..#.#', '#......#', '########', '........'],
    'arrow_l': ['....#...', '...##...', '..###...', '.####...', '..###...', '...##...', '....#...', '........'],
    'arrow_r': ['...#....', '...##...', '...###..', '...####.', '...###..', '...##...', '...#....', '........'],
    'reset': ['.#......', '.###....', '.#..##..', '.#....#.', '......#.', '.....#..', '..###...', '........'],
}


def icon(name, col='white'):
    rows = ICON_ROWS[name]
    s = Spr(12, 12)
    ox = (12 - max(len(r) for r in rows)) // 2
    oy = (12 - len(rows)) // 2 + 1
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch == '#':
                s.set(x + ox, y + oy, col)
    if name == 'dice':
        s.rect(ox + 1, oy + 1, ox + 6, oy + 5, 'white'); s.rect(ox, oy, ox + 7, oy, 'lgray')
        for (x, y) in ((2, 2), (5, 2), (2, 4), (5, 4)):
            s.set(ox + x, oy + y, 'red')
    return s.outline(OUT)


def touch_button(kind, pressed=False):
    """Botón táctil circular 32x32 semitransparente (el alfa lo aplica el juego: 0.5–0.6)."""
    s = Spr(32, 32)
    ring, fill = ('lgray', 'navy') if not pressed else ('white', 'dgray')
    s.circle(15.5, 15.5, 15, ring)
    s.circle(15.5, 15.5, 13.5, fill)
    g = 'white'
    if kind == 'jump':
        for i in range(6):
            s.rect(15 - i, 9 + i, 16 + i, 9 + i, g)
        s.rect(13, 15, 18, 22, g)
    elif kind == 'crouch':
        for i in range(6):
            s.rect(15 - i, 22 - i, 16 + i, 22 - i, g)
        s.rect(13, 9, 18, 16, g)
    elif kind == 'shoot':
        s.circle(15.5, 15.5, 7, 'neon', fill=False); s.circle(15.5, 15.5, 2, 'neon')
        for d in range(9, 13):
            s.set(15.5 + d, 15.5, 'neon'); s.set(15.5 - d, 15.5, 'neon'); s.set(15.5, 15.5 + d, 'neon'); s.set(15.5, 15.5 - d, 'neon')
    elif kind == 'pause':
        s.rect(10, 9, 13, 22, g); s.rect(18, 9, 21, 22, g)
    return s


def logo():
    """Logo 'VAULT RUNNER' 160x48 con la fuente propia a escala 3 y efecto cromático."""
    s = Spr(168, 52)
    t1, t2 = 'VAULT', 'RUNNER'
    w1, w2 = measure(t1, 4), measure(t2, 3)
    x1, x2 = (168 - w1) // 2, (168 - w2) // 2
    text_shadow(s, t1, x1 - 1, 4, 'cyan', None, 4)
    text_shadow(s, t1, x1 + 1, 4, 'neon', None, 4)
    text_shadow(s, t1, x1, 4, 'white', None, 4)
    # franjas de "glitch"
    for y in (10, 22):
        line = s.px[y][:]
        s.px[y] = [line[(x - 3) % 168] for x in range(168)]
    text_shadow(s, t2, x2, 33, 'amber', None, 3)
    for x in range(168):
        for y in range(33, 52):
            if s.px[y][x] == 'amber' and y >= 33 + 13:
                s.px[y][x] = 'orange'
    s.outline(OUT, diag=True)
    s.outline('dnavy')
    return s
