"""Utilidades de pixel art: paleta Endesga 32, lienzo por celdas, contornos y guardado."""
from PIL import Image
import math, random

HEX = {
    'rust': 'be4a2f', 'clay': 'd77643', 'sand': 'ead4aa', 'tan': 'e4a672', 'brown': 'b86f50',
    'dbrown': '733e39', 'ddbrown': '3e2731', 'dred': 'a22633', 'red': 'e43b44', 'orange': 'f77622',
    'amber': 'feae34', 'yellow': 'fee761', 'green': '63c74d', 'dgreen': '3e8948', 'ddgreen': '265c42',
    'dteal': '193c3e', 'dblue': '124e89', 'blue': '0099db', 'cyan': '2ce8f5', 'white': 'ffffff',
    'lgray': 'c0cbdc', 'gray': '8b9bb4', 'dgray': '5a6988', 'navy': '3a4466', 'dnavy': '262b44',
    'black': '181425', 'neon': 'ff0044', 'plum': '68386c', 'magenta': 'b55088', 'pink': 'f6757a',
    'peach': 'e8b796', 'skin': 'c28569',
}
ORDER = list(HEX.keys())
RGB = {k: tuple(int(v[i:i + 2], 16) for i in (0, 2, 4)) for k, v in HEX.items()}
OUT = 'black'


class Spr:
    """Lienzo de w×h celdas; cada celda guarda un nombre de color de la paleta o None."""

    def __init__(self, w, h):
        self.w, self.h = w, h
        self.px = [[None] * w for _ in range(h)]

    def inb(self, x, y):
        return 0 <= x < self.w and 0 <= y < self.h

    def set(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if self.inb(x, y):
            self.px[y][x] = c

    def get(self, x, y):
        return self.px[y][x] if self.inb(x, y) else None

    def rect(self, x0, y0, x1, y1, c):
        for y in range(int(y0), int(y1) + 1):
            for x in range(int(x0), int(x1) + 1):
                self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c, w=1):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
        for i in range(n):
            t = i / max(1, n - 1)
            x, y = round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t)
            for dx in range(w):
                self.set(x + dx, y, c)

    def circle(self, cx, cy, r, c, fill=True):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                d = math.hypot(x - cx, y - cy)
                if (fill and d <= r) or (not fill and r - 0.5 <= d <= r + 0.5):
                    self.set(x, y, c)

    def paste(self, other, ox, oy):
        for y in range(other.h):
            for x in range(other.w):
                c = other.px[y][x]
                if c is not None:
                    self.set(ox + x, oy + y, c)

    def outline(self, c=OUT, protect=None, diag=False):
        """Contorno de 1 px alrededor de lo pintado, sin escribir sobre celdas protegidas."""
        add = []
        nb = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        if diag:
            nb += [(1, 1), (-1, 1), (1, -1), (-1, -1)]
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x] is not None:
                    continue
                if protect and (x, y) in protect:
                    continue
                if any(self.get(x + dx, y + dy) not in (None, c) for dx, dy in nb):
                    add.append((x, y))
        for x, y in add:
            self.px[y][x] = c
        return self

    def filled(self):
        return {(x, y) for y in range(self.h) for x in range(self.w) if self.px[y][x] is not None}

    def flip(self):
        s = Spr(self.w, self.h)
        for y in range(self.h):
            s.px[y] = list(reversed(self.px[y]))
        return s

    def recolor(self, mapping):
        s = Spr(self.w, self.h)
        for y in range(self.h):
            s.px[y] = [mapping.get(c, c) if c else None for c in self.px[y]]
        return s

    def img(self, bg=None):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0) if bg is None else RGB[bg] + (255,))
        p = im.load()
        for y in range(self.h):
            for x in range(self.w):
                c = self.px[y][x]
                if c is not None:
                    p[x, y] = RGB[c] + (255,)
        return im


def sheet(frames):
    w, h = frames[0].w, frames[0].h
    s = Spr(w * len(frames), h)
    for i, f in enumerate(frames):
        s.paste(f, i * w, 0)
    return s


def save(spr_or_img, path):
    import os
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im = spr_or_img.img() if isinstance(spr_or_img, Spr) else spr_or_img
    im.save(path)
    return im


def from_rows(rows, key):
    """Sprite desde arte ASCII: cada carácter se traduce con `key` ('.' = transparente)."""
    h, w = len(rows), max(len(r) for r in rows)
    s = Spr(w, h)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in key and key[ch]:
                s.px[y][x] = key[ch]
    return s
