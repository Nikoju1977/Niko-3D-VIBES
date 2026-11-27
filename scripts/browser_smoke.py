"""Real browser UI smoke test (no camera/model inference). Run with Playwright installed."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1] / 'public-build'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for viewport in [{'width':1280,'height':800},{'width':390,'height':844}]:
            page = browser.new_page(viewport=viewport, accept_downloads=True)
            errors=[]
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded', timeout=15000)
            page.wait_for_selector('#advCanvas', state='attached', timeout=10000)
            page.wait_for_function("window.StudioNikoCore?.version === '0.1.0'")
            assert page.locator('#coreDiag').is_enabled()
            diag=page.evaluate("window.StudioNikoCore.diagnostic()")
            assert 'Studio Niko Core: 0.1.0' in diag
            assert 'Aucune donnée de projet' in diag
            for mode in ['bio','robot','sound','cinema','dj','art','twin','agent','mocap','avatar','holo']:
                btn=page.locator(f'[data-mode={mode}]');btn.click()
                assert btn.get_attribute('aria-pressed')=='true', mode
            page.locator('[data-mode=avatar]').click()
            page.locator('#morphExample').click()
            assert 'singe' in page.locator('#morphPrompt').input_value()
            page.locator('#morphPrompt').fill('une voiture')
            page.locator('#morphApply').click()
            assert 'non reconnu' in page.locator('#morphStatus').inner_text()
            page.locator('#morphSelf').click()
            assert 'portrait' in page.locator('#morphStatus').inner_text()
            page.locator('#avatarStyle').select_option('robot')
            page.locator('#avatarName').fill('TEST AVATAR')
            with page.expect_download() as info: page.locator('#avatarJson').click()
            import json
            data=json.loads(Path(info.value.path()).read_text())
            assert data['config']['name']=='TEST AVATAR' and data['config']['style']=='robot' and data['frames']==[]
            with page.expect_download() as info: page.locator('#avatarPng').click()
            assert Path(info.value.path()).read_bytes()[:4]==bytes([137,80,78,71])
            page.locator('[data-mode=art]').click()
            canvas=page.locator('#advCanvas');canvas.scroll_into_view_if_needed();box=canvas.bounding_box()
            x,y=box['x']+box['width']*.4,box['y']+box['height']*.4
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+30,y+20,steps=6);page.mouse.up()
            with page.expect_download() as info: page.locator('#artExport').click()
            data=Path(info.value.path()).read_text();assert '\nv ' in data and '\nl ' in data
            page.locator('#stop').click();assert 'ARRÊTÉ' in page.locator('#status').inner_text()
            assert not errors, errors
            page.close()
        browser.close()
    print('Browser smoke: desktop/mobile viewport, 11 tabs, OBJ export, stop: OK')
finally:
    server.shutdown();server.server_close()
