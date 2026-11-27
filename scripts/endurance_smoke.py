"""60-second actual MediaPipe session on simulated camera, repeated mode transitions, no hardware claim."""
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
        browser=p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        page=browser.new_context(viewport={'width':390,'height':844},permissions=['camera']).new_page()
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/?safe=1')
        expect(page.locator('#bootStatus')).to_be_hidden()
        page.locator('#camera').click()
        page.wait_for_function("['Worker CPU','CPU principal'].includes(document.getElementById('backend').textContent)",timeout=70000)
        page.wait_for_function("document.getElementById('latency').textContent!=='— ms'")
        start=page.evaluate("document.getElementById('video').currentTime")
        for i in range(6):
            page.locator('#quality').select_option(['eco','auto','fluid'][i%3])
            page.locator('[data-mode='+['holo','robot','bio','cinema','sound','holo'][i]+']').click()
            page.wait_for_timeout(10000)
            expect(page.locator('#status')).to_have_text('CAMÉRA ACTIVE')
            assert page.evaluate("document.getElementById('video').srcObject.getVideoTracks()[0].readyState")=='live'
        assert page.evaluate("document.getElementById('video').currentTime")-start>=50
        assert 'CPU' in page.locator('#renderCadence').inner_text()
        assert int(page.locator('#samples').inner_text())>20
        page.locator('#stop').click()
        assert page.evaluate("document.getElementById('video').srcObject===null")
        assert not errors,errors
        browser.close()
    print('Endurance: 60 seconds, real MediaPipe, six mode/quality changes, stop: OK')
finally:
    server.shutdown();server.server_close()
