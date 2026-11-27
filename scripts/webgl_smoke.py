"""Real Chromium WebGL integration, software GPU; no personal portrait or camera."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright, expect
import struct, json
root = Path(__file__).resolve().parents[1] / 'public-build'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl'])
        page = browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
        errors=[]
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/',wait_until='domcontentloaded')
        page.locator('[data-mode=avatar]').click()
        page.locator('#morphPrompt').fill('Transforme-moi en singe cyberpunk bleu')
        page.locator('#morphApply').click()
        expect(page.locator('#morphStatus')).to_contain_text('Créature 3D procédurale : ape',timeout=90000)
        expect(page.locator('#realAvatarStage canvas')).to_be_visible()
        assert page.locator('#realAvatarStage canvas').evaluate("(c)=>c.width>100&&c.height>100&&!!c.getContext('webgl2')")
        with page.expect_download(timeout=30000) as info:
            page.locator('#realAvatarPng').click()
        png=Path(info.value.path()).read_bytes()
        assert png[:4]==bytes([137,80,78,71]) and len(png)>1000
        with page.expect_download(timeout=60000) as info:
            page.locator('#morphExport').click()
        glb=Path(info.value.path()).read_bytes()
        magic,version,length=struct.unpack_from('<III',glb)
        assert magic==0x46546c67 and version==2 and length==len(glb)
        n,kind=struct.unpack_from('<II',glb,12)
        doc=json.loads(glb[20:20+n])
        assert kind==0x4e4f534a and len(doc['meshes'])>=5
        page.locator('#morphClear').click()
        expect(page.locator('#realAvatarStage')).to_be_hidden()
        page.locator('#realAvatarFile').set_input_files({'name':'test-avatar.glb','mimeType':'model/gltf-binary','buffer':glb})
        expect(page.locator('#realAvatarStatus')).to_contain_text('GLB : rendu 3D',timeout=60000)
        expect(page.locator('#realAvatarStage canvas')).to_be_visible()
        page.locator('#realAvatarClear').click()
        expect(page.locator('#realAvatarStage')).to_be_hidden()
        assert not errors,errors
        browser.close()
    print('WebGL: prompt -> real render -> PNG -> GLB -> reimport: OK')
finally:
    server.shutdown();server.server_close()
