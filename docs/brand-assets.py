#!/usr/bin/env python3
"""Cut the shipped brand PNGs from the Higgsfield background-removed renders.

Usage: python3 docs/brand-assets.py <lockup-cut.png> <mark-cut.png> <stacked-cut.png>
Writes into symbols/assets/brand/. Trims transparent margins (alpha > 8),
pads the mark to a square, and emits the favicon / app-icon sizes.
"""
import sys, pathlib
from PIL import Image

OUT = pathlib.Path(__file__).resolve().parent.parent / 'symbols' / 'assets' / 'brand'

def trim(im, thresh=8):
    im = im.convert('RGBA')
    a = im.split()[3].point(lambda v: 255 if v > thresh else 0)
    box = a.getbbox()
    return im.crop(box) if box else im

def square(im, pad=0.06):
    w, h = im.size
    side = int(max(w, h) * (1 + pad * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - w) // 2, (side - h) // 2), im)
    return canvas

def fit(im, max_w):
    w, h = im.size
    if w <= max_w: return im
    return im.resize((max_w, round(h * max_w / w)), Image.LANCZOS)

lockup, mark, stacked = (Image.open(p) for p in sys.argv[1:4])
OUT.mkdir(parents=True, exist_ok=True)

def save(im, name):
    # Three flat colours + antialiased edges: a 256-colour palette is lossless
    # to the eye and ~4x smaller than RGBA.
    q = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    q.save(OUT / name, optimize=True)

# Shipped at 2x their largest display size (hero 448 css px, nav 40 px).
save(fit(trim(lockup), 1200), 'logo-lockup.png')
save(fit(trim(stacked), 900), 'logo-stacked.png')
m = square(trim(mark))
for name, px in (('logo-mark.png', 1024), ('logo-mark-512.png', 512), ('logo-mark-192.png', 192), ('logo-mark-64.png', 64)):
    save(m.resize((px, px), Image.LANCZOS), name)

for p in sorted(OUT.glob('logo-*.png')):
    im = Image.open(p); print(f'{p.name:22s} {im.size[0]}x{im.size[1]} {p.stat().st_size//1024} KB')
