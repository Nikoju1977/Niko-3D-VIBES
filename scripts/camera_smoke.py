"""Chromium virtual camera (no physical camera), actual MediaPipe models, no personal data."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright, expect
root=Path(__file__).resolve().parents[1]/'public-build'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=browser.new_page(viewport={'width':390,'height':844},permissions=['camera'],service_workers='block')
        page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
        expect(page.locator('#runtimeState')).to_contain_text('initialisée')
        page.locator('[data-mode=avatar]').click()
        page.locator('#faceCamera').click()
        expect(page.locator('#status')).to_have_text('CAMÉRA VISAGE ACTIVE',timeout=20000)
        page.wait_for_function("document.getElementById('video').videoWidth>0 && document.getElementById('video').currentTime>0")
        assert page.locator('#backend').inner_text()=='Visage seul · local'
        page.locator('#stop').click()
        expect(page.locator('#status')).to_contain_text('ARRÊTÉ')
        assert page.locator('#video').evaluate('(v)=>v.srcObject===null')
        page.locator('[data-mode=holo]').click()
        page.locator('#camera').click()
        expect(page.locator('#status')).to_have_text('CAMÉRA ACTIVE',timeout=120000)
        page.wait_for_function("document.getElementById('fps').textContent!=='— FPS'",timeout=90000)
        expect(page.locator('#track')).to_contain_text('MAIN(S)')
        page.locator('#stop').click()
        assert page.locator('#video').evaluate('(v)=>v.srcObject===null')
        # Deterministic permission rejection, not a physical camera test.
        page.evaluate("navigator.mediaDevices.getUserMedia=()=>Promise.reject(new DOMException('Denied','NotAllowedError'))")
        page.locator('#camera').click()
        expect(page.locator('#notice')).to_contain_text('Autorisation caméra refusée')
        expect(page.locator('#camera')).to_be_enabled()
        browser.close()
    print('Camera smoke: virtual camera, face-only preview, actual hand/pose models, frame inference, permission recovery: OK')
finally:
    server.shutdown();server.server_close()
