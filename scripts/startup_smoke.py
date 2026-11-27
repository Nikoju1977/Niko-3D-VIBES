"""Chromium fake camera device test: real MediaPipe initialization, no claim of hardware validation."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1]/'public-build'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}'
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        context=browser.new_context(viewport={'width':390,'height':844},permissions=['camera'])
        page=context.new_page()
        page.goto(url+'/?safe=1',wait_until='domcontentloaded')
        expect(page.locator('#bootStatus')).to_be_hidden()
        page.locator('[data-mode=avatar]').click()
        page.locator('#faceCamera').click()
        expect(page.locator('#backend')).to_have_text('Visage seul',timeout=15000)
        page.wait_for_function("document.getElementById('video').videoWidth>0")
        assert page.evaluate("document.getElementById('video').srcObject.getVideoTracks()[0].readyState")=='live'
        page.locator('#stop').click()
        expect(page.locator('#faceCamera')).to_be_enabled()
        assert page.evaluate("document.getElementById('video').srcObject===null")
        page.locator('[data-mode=holo]').click()
        page.locator('#camera').click()
        expect(page.locator('#status')).to_have_text('CAMÉRA ACTIVE',timeout=15000)
        page.wait_for_function("['Worker CPU','CPU principal'].includes(document.getElementById('backend').textContent)",timeout=70000)
        page.wait_for_function("document.getElementById('latency').textContent!=='— ms'",timeout=35000)
        page.locator('#stop').click()
        expect(page.locator('#camera')).to_be_enabled()
        page.goto(url+'/recover.html')
        expect(page.locator('#repair')).to_be_visible()
        page.locator('#repair').click()
        page.wait_for_url('**/live/?safe=1&repair=*')
        expect(page.locator('#bootStatus')).to_be_hidden()
        browser.close()
    print('Startup: simulated camera device, real MediaPipe inference, stop/restart, recovery: OK')
finally:
    server.shutdown();server.server_close()
