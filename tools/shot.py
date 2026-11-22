"""Tangkapan layar UI dengan Playwright. Pakai: python3 tools/shot.py [lebar|ponsel] keluaran.png [tahun]"""
import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
mode = sys.argv[1] if len(sys.argv) > 1 else 'lebar'
out = sys.argv[2] if len(sys.argv) > 2 else '/tmp/shot.png'
years = int(sys.argv[3]) if len(sys.argv) > 3 else 300
root = os.path.join(os.path.dirname(__file__), '..')
srv = subprocess.Popen(['python3', '-m', 'http.server', '8123', '--bind', '127.0.0.1'], cwd=root, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 1440, 'height': 900} if mode == 'lebar' else {'width': 390, 'height': 800}, device_scale_factor=1 if mode == 'lebar' else 2, has_touch=mode != 'lebar', is_mobile=mode != 'lebar')
        pg = ctx.new_page(); errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.goto('http://127.0.0.1:8123/index.html'); pg.wait_for_timeout(1500)
        if years:
            pg.evaluate(f"document.querySelectorAll('.jump')[1].dataset.n='{years}';document.querySelectorAll('.jump')[1].click()")
            pg.wait_for_timeout(4000)
        pg.screenshot(path=out)
        print('galat konsol:', errs[:8])
        b.close()
finally:
    srv.terminate()
