"""Valida que los assets cumplan el estándar de DISENO.md.

Uso:  python3 tools/assets/validate.py            (desde la raíz del repo)
Revisa: colores dentro de Endesga 32, alfa binario (sin semitransparencias),
tamaños de spritesheet contra manifest.json, y que todo PNG esté registrado.
Sale con código 1 si hay errores (sirve para CI o un pre-commit).
"""
import json, os, sys, glob
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets')
ROOT = os.path.abspath(ROOT)
errors, warnings = [], []

pal = set()
with open(os.path.join(ROOT, 'palette', 'endesga32.hex')) as f:
    for h in f.read().split():
        pal.add(tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)))

with open(os.path.join(ROOT, 'manifest.json'), encoding='utf-8') as f:
    m = json.load(f)
registered = set()
for s in m['spritesheets']:
    p = os.path.join(ROOT, '..', s['url'])
    registered.add(os.path.abspath(p))
    if not os.path.exists(p):
        errors.append(f"{s['key']}: no existe {s['url']}")
        continue
    w, h = Image.open(p).size
    if (w, h) != (s['frameWidth'] * s['frames'], s['frameHeight']):
        errors.append(f"{s['key']}: mide {w}×{h}, el manifest espera {s['frameWidth'] * s['frames']}×{s['frameHeight']}")
for i in m['images']:
    p = os.path.join(ROOT, '..', i['url'])
    registered.add(os.path.abspath(p))
    if not os.path.exists(p):
        errors.append(f"{i['key']}: no existe {i['url']}")
    elif Image.open(p).size != (i['width'], i['height']):
        errors.append(f"{i['key']}: tamaño distinto al del manifest")
for b in m.get('bitmapFonts', []):
    registered.add(os.path.abspath(os.path.join(ROOT, '..', b['textureURL'])))

for p in sorted(glob.glob(os.path.join(ROOT, '**', '*.png'), recursive=True)):
    rel = os.path.relpath(p, ROOT)
    im = Image.open(p).convert('RGBA')
    off, semi = set(), 0
    for count, (r, g, b, a) in im.getcolors(1 << 24):
        if a == 0:
            continue
        if a != 255:
            semi += count
        if (r, g, b) not in pal:
            off.add('#%02x%02x%02x' % (r, g, b))
    if off:
        errors.append(f"{rel}: {len(off)} colores fuera de la paleta (p. ej. {', '.join(sorted(off)[:4])})")
    if semi:
        errors.append(f"{rel}: {semi} píxeles semitransparentes (el alfa debe ser 0 o 255)")
    if os.path.abspath(p) not in registered:
        warnings.append(f"{rel}: no está en manifest.json")

for w in warnings:
    print('AVISO ', w)
for e in errors:
    print('ERROR ', e)
print(f"\n{len(errors)} errores, {len(warnings)} avisos.")
sys.exit(1 if errors else 0)
