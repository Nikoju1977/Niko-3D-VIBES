"""Regression: an old root service worker serves a deliberately stale app.js; isolated online path remains usable."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]/'public-build'
class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path=='/old-cache-fixture.js':
            body=b"""self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch',e=>{if(new URL(e.request.url).pathname==='/app.js')e.respondWith(new Response('throw Error("STALE_ROOT_SCRIPT")',{headers:{'Content-Type':'text/javascript'}}));});"""
            self.send_response(200);self.send_header('Content-Type','text/javascript');self.end_headers();self.wfile.write(body);return
        super().do_GET()
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Handler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch()
        page=browser.new_page(viewport={'width':390,'height':844})
        origin=f'http://127.0.0.1:{server.server_port}'
        page.goto(origin+'/recover.html')
        page.evaluate("navigator.serviceWorker.register('/old-cache-fixture.js')")
        page.wait_for_function("navigator.serviceWorker.controller!==null")
        page.goto(origin+'/?safe=1')
        expect(page.locator('#bootStatus')).to_contain_text('STALE_ROOT_SCRIPT',timeout=20000)
        page.goto(origin+'/live/?safe=1')
        expect(page.locator('#bootStatus')).to_be_hidden(timeout=15000)
        assert page.evaluate("navigator.serviceWorker.controller!==null")
        page.locator('[data-mode=robot]').click()
        page.locator('#robotManual').select_option('SCAN')
        expect(page.locator('#robotState')).to_have_text('SCAN')
        page.goto(origin+'/recover.html')
        page.locator('#repair').click()
        page.wait_for_url('**/live/?safe=1&repair=*')
        expect(page.locator('#bootStatus')).to_be_hidden()
        page.locator('[data-mode=holo]').click()
        expect(page.locator('[data-mode=holo]')).to_have_attribute('aria-pressed','true')
        assert page.evaluate("(awaitable=>awaitable)(navigator.serviceWorker.getRegistrations()).then(x=>x.length===0)")
        browser.close()
    print('Cache recovery: actual stale worker reproduced; isolated live app and repair validated')
finally:
    server.shutdown();server.server_close()
