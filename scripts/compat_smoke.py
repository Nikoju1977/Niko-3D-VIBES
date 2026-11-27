"""Basic UI compatibility on browser engines, not physical Safari/iPhone certification."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]/'public-build'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        for engine in [p.firefox,p.webkit]:
            browser=engine.launch()
            page=browser.new_page(viewport={'width':390,'height':844})
            errors=[]
            page.on('pageerror',lambda e: errors.append(str(e)))
            page.goto(f'http://127.0.0.1:{server.server_port}/?safe=1')
            expect(page.locator('#bootStatus')).to_be_hidden(timeout=15000)
            for mode in ['holo','bio','robot','sound','cinema','dj','art','twin','agent','mocap','avatar']:
                b=page.locator(f'[data-mode={mode}]')
                b.click()
                expect(b).to_have_attribute('aria-pressed','true')
            page.locator('[data-mode=robot]').click()
            page.locator('#robotManual').select_option('SCAN')
            expect(page.locator('#robotState')).to_have_text('SCAN')
            page.locator('#stop').click()
            expect(page.locator('#status')).to_contain_text('ARRÊTÉ')
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
            assert not errors,errors
            browser.close()
            print(engine.name+': startup, 11 modes, robot and stop: OK')
finally:
    server.shutdown();server.server_close()
