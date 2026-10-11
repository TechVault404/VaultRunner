"""Láminas de referencia del estándar de diseño (docs/diseno/*.png), a ×4.
Uso: python3 tools/assets/annotate.py  (desde la raíz del repo, después de build.py)"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageDraw
import screens as S
from pix import RGB

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'docs', 'diseno')
os.makedirs(OUT, exist_ok=True)
K = 4


def marker(d, n, x, y, col='neon'):
    """Número en un recuadro, dibujado sobre la imagen ×4 (coordenadas lógicas)."""
    s = S.Screen(12, 12)
    s.rect(0, 0, 11, 11, col)
    s.text(str(n), 6, 2, 'white', align='center', shadow=None)
    return s.im.resize((48, 48), Image.NEAREST), (x * K, y * K)


def box(d, x0, y0, x1, y1, col='neon'):
    d.rectangle([x0 * K, y0 * K, (x1 + 1) * K - 1, (y1 + 1) * K - 1], outline=RGB[col], width=2)


def hline(d, x0, x1, y, col='cyan'):
    d.line([x0 * K, y * K, x1 * K, y * K], fill=RGB[col], width=2)


def vline(d, x, y0, y1, col='cyan'):
    d.line([x * K, y0 * K, x * K, y1 * K], fill=RGB[col], width=2)


def stamp(im, marks):
    for m, pos in marks:
        im.alpha_composite(m, pos)


# ── 1. Anatomía del HUD y de la escena de juego
s = S.game2()
im = s.im.resize((320 * K, 180 * K), Image.NEAREST)
d = ImageDraw.Draw(im)
marks = []
box(d, 5, 5, 46, 11); marks.append(marker(d, 1, 48, 3))
box(d, 5, 15, 88, 21); marks.append(marker(d, 2, 90, 13))
box(d, 5, 25, 32, 31); marks.append(marker(d, 3, 34, 23))
box(d, 233, 4, 286, 22, 'amber'); marks.append(marker(d, 4, 219, 6, 'amber'))
box(d, 299, 5, 314, 20, 'amber'); marks.append(marker(d, 5, 300, 24, 'amber'))
box(d, 98, 30, 222, 44, 'green'); marks.append(marker(d, 6, 225, 32, 'green'))
hline(d, 0, 319, 148, 'cyan'); marks.append(marker(d, 7, 2, 135, 'blue'))
box(d, 66, 128, 77, 147, 'yellow'); marks.append(marker(d, 8, 80, 150, 'clay'))
vline(d, 5, 0, 179, 'magenta'); vline(d, 315, 0, 179, 'magenta')
stamp(im, marks)
im.save(os.path.join(OUT, 'hud_anatomia.png'))

# ── 2. Componentes de interfaz
s = S.Screen()
s.rect(0, 0, 319, 179, 'black')
s.text('BOTONES', 8, 6, 'gray')
s.button('JUGAR', 8, 18, 72, 18, 1, 'play')
s.button('MENÚ', 88, 19, 64, 16, 0, 'home')
s.button('MENÚ', 160, 19, 64, 16, 2, 'home')
s.nine('ui/button.png', 0, 232, 19, 18, 18)
s.put(S.frame('ui/icons.png', 12, 12, S.ICONS.index('sound_on')), 235, 22)
s.text('PANEL Y FILAS', 8, 46, 'gray')
s.nine('ui/panel.png', None, 8, 56, 140, 50)
for i, (k, v, c) in enumerate([('PUNTAJE', '13,020', 'white'), ('DISTANCIA', '1,012 M', 'cyan'), ('MONEDAS', '62', 'amber')]):
    y = 62 + i * 14
    s.text(k, 16, y, 'gray'); s.text(v, 140, y, c, align='right')
    if i < 2:
        s.rect(16, y + 11, 140, y + 11, 'dnavy')
s.text('SELECTOR', 160, 46, 'gray')
s.nine('ui/panel.png', None, 160, 56, 104, 13)
s.rect(161, 57, 262, 67, 'dblue')
s.put(S.frame('ui/icons.png', 12, 12, S.ICONS.index('arrow_l')), 161, 57)
s.put(S.frame('ui/icons.png', 12, 12, S.ICONS.index('arrow_r')), 251, 57)
s.text('SUDADERA', 212, 59, 'white', align='center')
s.nine('ui/panel.png', None, 160, 74, 104, 13)
s.text('PICUDO', 212, 77, 'lgray', align='center')
s.rect(268, 54, 289, 67, 'white'); s.rect(270, 56, 287, 65, 'blue')
s.rect(292, 56, 309, 65, 'red')
s.text('TEXTO', 8, 114, 'gray')
s.text('DISPLAY', 8, 124, 'white', 3)
s.text('TÍTULO', 150, 128, 'white', 2)
s.text('CUERPO', 8, 150, 'white')
s.text('+50', 52, 150, 'yellow')
s.text('RÉCORD', 76, 150, 'amber')
s.text('128 M', 120, 150, 'cyan')
s.text('ETIQUETA', 156, 150, 'gray')
s.text('AYUDA', 210, 150, 'dgray', shadow=None)
s.rect(8, 162, 311, 176, 'black', 0.6)
s.rect(8, 162, 311, 162, 'cyan'); s.rect(8, 176, 311, 176, 'cyan')
s.text('CARTEL / AVISO', 160, 166, 'cyan', align='center')
im = s.im.resize((320 * K, 180 * K), Image.NEAREST)
d = ImageDraw.Draw(im)
marks = []
for n, (x, y) in enumerate([(8, 37), (88, 37), (160, 37), (232, 39)], 1):
    marks.append(marker(d, n, x, y, 'neon'))
marks += [marker(d, 5, 136, 108, 'neon'), marker(d, 6, 160, 90, 'neon'), marker(d, 7, 296, 70, 'neon'),
          marker(d, 8, 230, 128, 'neon'), marker(d, 9, 250, 148, 'neon'), marker(d, 10, 296, 164, 'neon')]
stamp(im, marks)
im.save(os.path.join(OUT, 'componentes.png'))

# ── 3. Rejilla de la escena (tiles de 16, suelo y carriles)
s = S.game3()
im = s.im.resize((320 * K, 180 * K), Image.NEAREST)
base = im
im = Image.new('RGBA', base.size)
d = ImageDraw.Draw(im)
for x in range(0, 320, 16):
    d.line([x * K, 0, x * K, 180 * K], fill=RGB['white'] + (40,), width=1)
for y in range(4, 180, 16):
    d.line([0, y * K, 320 * K, y * K], fill=RGB['white'] + (40,), width=1)
hline(d, 0, 319, 148, 'cyan')
d.rectangle([0, 124 * K, 320 * K, 132 * K - 1], fill=RGB['neon'] + (70,))   # carril alto (cabeza)
d.rectangle([0, 132 * K, 320 * K, 148 * K - 1], fill=RGB['amber'] + (45,))  # carril bajo
vline(d, 64, 0, 179, 'green')
im = Image.alpha_composite(base, im)
im.save(os.path.join(OUT, 'rejilla_escena.png'))
print('ok', OUT)
