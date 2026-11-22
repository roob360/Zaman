"""Membuat ikon aplikasi (SVG + PNG). Jalankan: python3 tools/make_icon.py
PNG dirender dengan Playwright (Chromium). Ubah palet di bagian atas bila ingin ganti tampilan."""
import math, os, sys
OUT = os.path.join(os.path.dirname(__file__), '..', 'icons')
N = 14                      # jumlah sel per sisi bola
OCEAN = ['#1d4f91', '#2563a8']
LAND = ['#4f9d3a', '#3f8a31', '#6bb04a']
SAND, SNOW = '#d9c58a', '#f2f6fa'

def noise(x, y):
    return (math.sin(x * 1.7 + 0.8) + math.sin(y * 2.1 - 0.4) + math.sin((x + y) * 1.1 + 2.0) + math.sin(x * 3.1 - y * 2.3)) / 4

def cells(size, pad, mask_pad=0):
    cx = cy = size / 2
    r = size / 2 - pad
    cell = 2 * r / N
    out = []
    for j in range(N):
        for i in range(N):
            x0, y0 = cx - r + i * cell, cy - r + j * cell
            mx, my = x0 + cell / 2 - cx, y0 + cell / 2 - cy
            d = math.hypot(mx, my)
            if d > r - cell * 0.2: continue
            v = noise(i * 0.55, j * 0.55)
            lat = abs(my) / r
            if lat > 0.86: col = SNOW
            elif v > 0.18: col = LAND[(i * 7 + j * 3) % 3]
            elif v > 0.08: col = SAND
            else: col = OCEAN[(i + j) % 2]
            shade = 1 - 0.25 * max(0, (mx + my) / (2 * r))   # bayangan sisi kanan bawah
            out.append((x0, y0, cell, col, shade))
    return out, cx, cy, r

def svg(size=1024, maskable=False):
    pad = size * (0.27 if maskable else 0.2)
    cs, cx, cy, r = cells(size, pad)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}">']
    o.append('<defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2f4a"/><stop offset="1" stop-color="#0d1020"/></linearGradient>'
             f'<clipPath id="g"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath></defs>')
    rad = 0 if maskable else size * 0.2237
    o.append(f'<rect width="{size}" height="{size}" rx="{rad}" fill="url(#bg)"/>')
    # bintang kecil
    for k, (sx, sy) in enumerate([(0.16, 0.2), (0.84, 0.16), (0.12, 0.74), (0.88, 0.8), (0.5, 0.07)]):
        s = size * 0.012
        o.append(f'<rect x="{sx * size:.1f}" y="{sy * size:.1f}" width="{s:.1f}" height="{s:.1f}" fill="#fff" opacity="{0.35 + 0.1 * k:.2f}"/>')
    o.append('<g clip-path="url(#g)">')
    for x0, y0, c, col, sh in cs:
        o.append(f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{c + 0.6:.2f}" height="{c + 0.6:.2f}" fill="{col}"/>')
        if sh < 0.97: o.append(f'<rect x="{x0:.2f}" y="{y0:.2f}" width="{c + 0.6:.2f}" height="{c + 0.6:.2f}" fill="#000" opacity="{(1 - sh):.2f}"/>')
    # pemukiman kecil (piksel kuning) dan cahaya kota
    for (i, j) in [(6, 6), (7, 8), (5, 9)]:
        x0 = cx - r + i * (2 * r / N); y0 = cy - r + j * (2 * r / N); c = 2 * r / N
        o.append(f'<rect x="{x0 + c * 0.25:.1f}" y="{y0 + c * 0.25:.1f}" width="{c * 0.5:.1f}" height="{c * 0.5:.1f}" fill="#ffd45a"/>')
    o.append('</g>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#9fc4ff" stroke-opacity=".35" stroke-width="{size * 0.006:.1f}"/>')
    o.append('</svg>')
    return '\n'.join(o)

os.makedirs(OUT, exist_ok=True)
files = {'icon.svg': svg(1024), 'icon-maskable.svg': svg(1024, True)}
for n, t in files.items(): open(os.path.join(OUT, n), 'w').write(t)

from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page()
    for src, name, sz in [('icon.svg', 'icon-512.png', 512), ('icon.svg', 'icon-192.png', 192), ('icon.svg', 'apple-touch-icon.png', 180),
                          ('icon.svg', 'favicon-32.png', 32), ('icon-maskable.svg', 'icon-maskable-512.png', 512)]:
        pg.set_viewport_size({'width': sz, 'height': sz})
        pg.set_content(f'<body style="margin:0;background:transparent"><img src="data:image/svg+xml;base64,{__import__("base64").b64encode(files[src].encode()).decode()}" width="{sz}" height="{sz}" style="display:block;image-rendering:auto">')
        pg.screenshot(path=os.path.join(OUT, name), omit_background=True)
    b.close()
print('ikon selesai')
