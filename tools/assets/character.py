"""Personaje por capas (16x24). Todas las capas comparten la misma rejilla de 16 frames:
0-5 correr · 6 subida · 7 caída · 8-9 agachado · 10-11 disparo · 12-15 muerte."""
import math
from pix import Spr, OUT

W, H = 16, 24
FRAMES = ['run0', 'run1', 'run2', 'run3', 'run4', 'run5', 'jump', 'fall',
          'crouch0', 'crouch1', 'shoot0', 'shoot1', 'death0', 'death1', 'death2', 'death3']

# Rampas (luz, medio, sombra) — todas de Endesga 32
SKINS = [('sand', 'peach', 'skin'), ('peach', 'tan', 'brown'),
         ('tan', 'brown', 'dbrown'), ('brown', 'dbrown', 'ddbrown')]
SKIN_NAMES = ['Claro', 'Medio claro', 'Medio', 'Oscuro']
OUTFIT_COLORS = [('red', 'dred', 'ddbrown'), ('amber', 'orange', 'rust'), ('yellow', 'amber', 'clay'),
                 ('green', 'dgreen', 'ddgreen'), ('cyan', 'blue', 'dblue'), ('blue', 'dblue', 'dnavy'),
                 ('magenta', 'plum', 'ddbrown'), ('lgray', 'gray', 'dgray')]
OUTFIT_COLOR_NAMES = ['Rojo', 'Naranja', 'Amarillo', 'Verde', 'Cian', 'Azul', 'Morado', 'Gris']
HAIR_COLORS = [('navy', 'dnavy', 'black'), ('brown', 'dbrown', 'ddbrown'), ('yellow', 'amber', 'clay'),
               ('orange', 'rust', 'dbrown'), ('pink', 'magenta', 'plum'), ('cyan', 'blue', 'dblue')]
HAIR_COLOR_NAMES = ['Negro', 'Castaño', 'Rubio', 'Pelirrojo', 'Rosa', 'Azul']
OUTFITS = ['Playera', 'Sudadera', 'Overol', 'Chamarra']
HAIRS = ['Sin cabello', 'Corto', 'Picudo', 'Largo', 'Afro']
ACCESSORIES = ['Ninguno', 'Gorra', 'Lentes', 'Audífonos', 'Casco']
WEAPONS = ['Blaster', 'Resortera', 'Varita']


def pose(name):
    """Esqueleto del frame: cabeza (esquina sup. izq. de 8x8), torso, piernas y brazos."""
    p = dict(eye='o', weapon=False, lean=0)
    if name.startswith('run'):
        i = int(name[3:])
        a = 2 * math.pi * i / 6
        bob = 1 if i in (0, 3) else 0
        hx, hy = 6, 1 + bob
        legs = []
        for ph in (a + math.pi, a):  # pierna trasera, delantera
            fx = 8 + round(4 * math.cos(ph))
            lift = max(0, round(3 * math.sin(ph)))
            fy = 22 - lift
            kx = (8 + fx) / 2 + (1 if math.sin(ph) > 0 else 0)
            ky = 18.5 + bob * 0.5 - (1 if lift > 1 else 0)
            legs.append(((7.5, 16 + bob), (kx, ky), (fx, fy)))
        arms = []
        for ph in (a, a + math.pi):  # brazo trasero opuesto a la pierna trasera
            arms.append(((8, 10 + bob), (8 + round(3 * math.cos(ph)), 13 + bob - max(0, round(1.5 * math.sin(ph))))))
        p.update(head=(hx, hy), torso=(6, 9 + bob, 10, 15 + bob), legs=legs, arms=arms)
    elif name == 'jump':
        p.update(head=(6, 0), torso=(6, 8, 10, 14),
                 legs=[((7, 15), (5, 17), (5, 20)), ((8, 15), (11, 16), (10, 19))],
                 arms=[((8, 9), (5, 7)), ((8, 9), (12, 7))])
    elif name == 'fall':
        p.update(head=(6, 1), torso=(6, 9, 10, 15),
                 legs=[((7, 16), (6, 19), (5, 22)), ((8, 16), (10, 19), (11, 21))],
                 arms=[((8, 10), (4, 9)), ((8, 10), (12, 9))])
    elif name.startswith('crouch'):
        b = int(name[-1])
        p.update(head=(7, 10 + b), torso=(6, 17 + b, 10, 20), crouch=True,
                 legs=[((7, 21), (4, 21), (4, 22)), ((8, 21), (12, 21), (11, 22))],
                 arms=[((8, 18 + b), (6, 20)), ((8, 18 + b), (12, 19 + b))])
    elif name.startswith('shoot'):
        b = int(name[-1])
        p.update(head=(6, 1), torso=(6, 9, 10, 15), weapon=True, recoil=b,
                 legs=[((7, 16), (6, 19), (5, 22)), ((8, 16), (10, 19), (11, 22))],
                 arms=[((8, 10), (11, 12)), ((8, 10), (13 - b, 11))])
    elif name.startswith('death'):
        i = int(name[-1])
        if i < 2:
            up = 2 * i
            p.update(head=(4, 2 - up), torso=(5, 10 - up, 9, 16 - up), eye='x',
                     legs=[((6, 17 - up), (6, 20 - up), (6, 22 - up)), ((7, 17 - up), (10, 19 - up), (12, 20 - up))],
                     arms=[((7, 11 - up), (4, 7 - up)), ((7, 11 - up), (11, 7 - up))])
        else:
            d = 2 * (i - 2)
            p.update(head=(2, 11 + d), torso=(6, 16 + d // 2, 10, 20), eye='x', crouch=True,
                     legs=[((10, 20), (12, 20), (14, 22)), ((10, 21), (13, 21), (15, 22))],
                     arms=[((7, 17), (4, 21)), ((8, 17), (10, 21))])
    return p


def _head_cells(hx, hy):
    cells = set()
    for y in range(8):
        for x in range(8):
            if (x, y) in ((0, 0), (7, 0), (0, 7), (7, 7)):
                continue
            if y == 7 and x < 2:
                continue
            cells.add((hx + x, hy + y))
    return cells


def _arm_cells(sh, hand):
    s = Spr(W, H)
    s.line(sh[0], sh[1], hand[0], hand[1], 'x')
    return [c for c in _ordered(sh, hand)]


def _ordered(a, b):
    n = int(max(abs(b[0] - a[0]), abs(b[1] - a[1]))) + 1
    out = []
    for i in range(n):
        t = i / max(1, n - 1)
        c = (round(a[0] + (b[0] - a[0]) * t), round(a[1] + (b[1] - a[1]) * t))
        if c not in out:
            out.append(c)
    return out


def _leg_cells(leg):
    hip, knee, foot = leg
    cells = []
    for a, b in ((hip, knee), (knee, foot)):
        for (x, y) in _ordered(a, b):
            cells += [(x, y), (x + 1, y)]
    return cells, (round(foot[0]), round(foot[1]))


def core(p):
    """Silueta base (cuerpo + ropa estándar) — el contorno solo se dibuja fuera de ella."""
    c = set(_head_cells(*p['head']))
    x0, y0, x1, y1 = p['torso']
    c |= {(x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)}
    for leg in p['legs']:
        cells, (fx, fy) = _leg_cells(leg)
        c |= set(cells)
        c |= {(fx + dx, fy + dy) for dx in range(-1, 3) for dy in range(0, 2)}
    for sh, hand in p['arms']:
        c |= set(_ordered(sh, hand))
    return c


def body_layer(fname, skin):
    p = pose(fname)
    L, M, S = SKINS[skin]
    s = Spr(W, H)
    hx, hy = p['head']
    # brazo trasero (sombra)
    for c in _ordered(*p['arms'][0]):
        s.set(*c, S)
    # cabeza
    for (x, y) in _head_cells(hx, hy):
        rx, ry = x - hx, y - hy
        col = M
        if rx <= 1:
            col = S
        elif ry <= 1 and rx >= 3:
            col = L
        s.set(x, y, col)
    s.set(hx + 7, hy + 5, S)  # mentón / nariz
    s.set(hx + 3, hy + 4, S)  # oreja
    if p['eye'] == 'o':
        s.set(hx + 6, hy + 3, OUT); s.set(hx + 6, hy + 4, OUT)
    else:
        s.set(hx + 5, hy + 3, OUT); s.set(hx + 7, hy + 3, OUT); s.set(hx + 6, hy + 4, OUT)
        s.set(hx + 5, hy + 5, OUT); s.set(hx + 7, hy + 5, OUT)
    # brazo delantero
    for c in _ordered(*p['arms'][1]):
        s.set(*c, M)
    s.outline(OUT, protect=core(p))
    return s


def front_exposed(p, sleeve_len):
    """Celdas del brazo delantero que muestran piel (no las tapa la ropa)."""
    arm = _ordered(*p['arms'][1])
    return set(arm[sleeve_len:])


def outfit_layer(fname, style, color):
    p = pose(fname)
    L, M, S = OUTFIT_COLORS[color]
    pants = {0: ('navy', 'dnavy'), 1: ('dgray', 'navy'), 2: (M, S), 3: ('dnavy', 'black')}[style]
    shoe = ('dnavy', 'black') if style != 3 else ('rust', 'dbrown')
    s = Spr(W, H)
    x0, y0, x1, y1 = p['torso']
    sleeve = {0: 2, 1: 4, 2: 0, 3: 4}[style]
    # brazo trasero (manga)
    back = _ordered(*p['arms'][0])
    for c in back[:sleeve]:
        s.set(*c, S)
    # pierna trasera y zapato
    for i, leg in enumerate(p['legs']):
        cells, (fx, fy) = _leg_cells(leg)
        col = pants[1] if i == 0 else pants[0]
        for c in cells:
            s.set(*c, col)
        s.rect(fx - 1, fy, fx + 2, fy + 1, shoe[1] if i == 0 else shoe[0])
        s.set(fx + 2, fy + 1, shoe[1])
    # torso
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            col = M
            if x == x0:
                col = S
            elif y == y0 and x > x0:
                col = L
            s.set(x, y, col)
    if style == 0:  # playera: cuello y dobladillo
        s.set(x1 - 1, y0, M)
    if style == 1:  # sudadera: capucha y bolsillo
        s.set(x0 - 1, y0, S); s.set(x0 - 1, y0 + 1, S); s.set(x0, y0 - 1, S)
        s.rect(x0 + 2, y1 - 2, x1 - 1, y1 - 2, S)
    if style == 2:  # overol: tirantes y cinturón
        s.set(x0 + 2, y0, L); s.set(x1, y0, L)
        s.rect(x0, y1 - 2, x1, y1 - 2, S)
        s.set(x1 - 1, y1 - 2, 'amber')
    if style == 3:  # chamarra: franja clara y cierre
        s.rect(x0 + 1, y0 + 2, x1, y0 + 2, 'white')
        s.line(x1, y0, x1, y1, S)
    # brazo delantero (manga)
    front = _ordered(*p['arms'][1])
    for c in front[:sleeve]:
        s.set(*c, L if style != 2 else M)
    protect = core(p)
    s.outline(OUT, protect=protect)
    return s


def hair_layer(fname, style, color):
    if style == 0:
        return Spr(W, H)
    p = pose(fname)
    L, M, S = HAIR_COLORS[color]
    hx, hy = p['head']
    s = Spr(W, H)
    if style == 1:  # corto
        s.rect(hx + 1, hy - 1, hx + 6, hy - 1, M)
        s.rect(hx, hy, hx + 7, hy + 1, M)
        s.rect(hx, hy + 2, hx + 2, hy + 4, S)
        s.set(hx + 3, hy - 1, L); s.set(hx + 4, hy - 1, L)
    elif style == 2:  # picudo
        s.rect(hx, hy, hx + 7, hy + 1, M)
        for i, x in enumerate(range(hx, hx + 8, 2)):
            s.set(x, hy - 1, M); s.set(x + 1, hy - 1, L)
            s.set(x, hy - 2, S if i % 2 else M)
        s.set(hx - 1, hy - 1, S)
        s.rect(hx, hy + 2, hx + 1, hy + 3, S)
    elif style == 3:  # largo
        s.rect(hx + 1, hy - 1, hx + 6, hy - 1, M)
        s.rect(hx, hy, hx + 7, hy + 1, M)
        s.rect(hx - 1, hy + 1, hx + 2, hy + 9, S)
        s.rect(hx, hy + 2, hx + 2, hy + 8, M)
        s.set(hx + 3, hy - 1, L); s.set(hx + 4, hy - 1, L)
    elif style == 4:  # afro
        s.circle(hx + 3.5, hy + 2, 5, M)
        s.circle(hx + 2.5, hy + 1, 2.2, L)
        # despejar la cara
        for (x, y) in _head_cells(hx, hy):
            if x - hx >= 4 and y - hy >= 2:
                s.px[y][x] = None if s.inb(x, y) else None
        s.rect(hx - 1, hy + 2, hx + 2, hy + 6, S)
    s.outline(OUT, protect=core(p))
    # nunca tapar ojo
    if s.inb(hx + 6, hy + 3):
        s.px[hy + 3][hx + 6] = None
        s.px[hy + 4][hx + 6] = None
    return s


def accessory_layer(fname, kind):
    if kind == 0:
        return Spr(W, H)
    p = pose(fname)
    hx, hy = p['head']
    s = Spr(W, H)
    if kind == 1:  # gorra
        s.rect(hx, hy - 1, hx + 6, hy + 1, 'red')
        s.rect(hx + 1, hy - 1, hx + 5, hy - 1, 'pink')
        s.rect(hx + 5, hy + 1, hx + 9, hy + 1, 'dred')
        s.set(hx + 3, hy, 'white')
    elif kind == 2:  # lentes
        s.rect(hx + 3, hy + 3, hx + 8, hy + 3, OUT)
        s.rect(hx + 5, hy + 3, hx + 7, hy + 4, 'dnavy')
        s.set(hx + 6, hy + 3, 'cyan')
    elif kind == 3:  # audífonos
        s.rect(hx + 1, hy - 1, hx + 6, hy - 1, 'dnavy')
        s.set(hx, hy, 'dnavy'); s.set(hx + 7, hy, 'dnavy')
        s.rect(hx + 2, hy + 2, hx + 4, hy + 5, 'neon')
        s.rect(hx + 3, hy + 3, hx + 3, hy + 4, 'red')
    elif kind == 4:  # casco
        s.rect(hx - 1, hy - 2, hx + 7, hy + 3, 'gray')
        s.rect(hx, hy - 2, hx + 6, hy - 2, 'lgray')
        s.rect(hx - 1, hy + 1, hx + 1, hy + 3, 'dgray')
        s.rect(hx + 4, hy + 2, hx + 8, hy + 4, 'blue')
        s.rect(hx + 5, hy + 2, hx + 7, hy + 2, 'cyan')
        s.set(hx + 2, hy - 3, 'neon')
    s.outline(OUT, protect=core(p))
    return s


def weapon_layer(fname, kind):
    p = pose(fname)
    s = Spr(W, H)
    if not p.get('weapon') and not fname.startswith(('run', 'jump', 'fall', 'crouch')):
        return s
    hand = p['arms'][1][1]
    hx, hy = hand
    if kind == 0:  # blaster
        s.rect(hx, hy - 1, hx + 3, hy - 1, 'gray')
        s.set(hx, hy, 'dgray'); s.set(hx + 3, hy - 1, 'cyan')
        s.set(hx + 1, hy - 2, 'lgray')
    elif kind == 1:  # resortera
        s.set(hx + 1, hy, 'brown'); s.set(hx + 1, hy - 1, 'brown')
        s.set(hx + 2, hy - 2, 'brown'); s.set(hx, hy - 2, 'brown')
        s.set(hx + 1, hy - 2, 'lgray')
    else:  # varita
        s.line(hx, hy, hx + 3, hy - 2, 'dbrown')
        s.set(hx + 3, hy - 2, 'yellow'); s.set(hx + 4, hy - 3, 'white')
    s.outline(OUT, protect=core(p))
    return s


def projectile(kind):
    """Proyectiles de 6x3 (más 2 frames)."""
    frames = []
    for f in range(2):
        s = Spr(6, 3)
        if kind == 0:
            s.rect(0, 1, 5, 1, 'cyan'); s.rect(2 - f, 0, 4, 2, 'blue'); s.set(5, 1, 'white')
            s.rect(1, 1, 4, 1, 'white' if f else 'cyan')
        elif kind == 1:
            s.rect(2, 0, 4, 2, 'gray'); s.set(3 + f, 0, 'lgray'); s.set(2, 2, 'dgray')
            s.set(0, 1, 'dgray'); s.set(1, 1 - f, 'dgray')
        else:
            s.rect(3, 0, 5, 2, 'magenta'); s.set(4, 1, 'white'); s.set(4, 0, 'yellow'); s.set(4, 2, 'yellow')
            s.set(1 + f, 1, 'pink'); s.set(0, f * 2, 'magenta')
        frames.append(s)
    return frames


def muzzle():
    frames = []
    for f in range(2):
        s = Spr(6, 6)
        if f == 0:
            s.rect(1, 2, 4, 3, 'yellow'); s.rect(2, 1, 3, 4, 'amber'); s.rect(2, 2, 3, 3, 'white')
        else:
            s.set(0, 2, 'amber'); s.set(5, 3, 'amber'); s.set(3, 0, 'amber'); s.set(2, 5, 'amber'); s.rect(2, 2, 3, 3, 'yellow')
        frames.append(s)
    return frames


def compose(fname, cfg):
    s = Spr(W, H)
    for lay in (body_layer(fname, cfg['skin']), outfit_layer(fname, cfg['outfit'], cfg['outfitColor']),
                hair_layer(fname, cfg['hair'], cfg['hairColor']), accessory_layer(fname, cfg['accessory']),
                weapon_layer(fname, cfg['weapon'])):
        s.paste(lay, 0, 0)
    return s
