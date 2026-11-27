"""Real Chromium WebGL integration, software GPU; no personal portrait or camera."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright, expect
import struct, json
from urllib.request import urlopen
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
        # Deterministic generated motion fixture; validates actual GLB animation playback, not camera capture.
        fixture=page.evaluate("""async()=>{const {retargetAvatar}=await import('/niko-avatar.js');const {MotionTake,exportMotionGLB}=await import('/niko-motion-studio.js');const p=Array(33).fill(null),coords={0:[0,-.8,0],11:[.2,-.5,0],12:[-.2,-.5,0],13:[.5,-.5,0],14:[-.5,-.5,0],15:[.7,-.5,0],16:[-.7,-.5,0],23:[.12,0,0],24:[-.12,0,0],25:[.12,.4,0],26:[-.12,.4,0],27:[.12,.8,0],28:[-.12,.8,0]};for(const [i,[x,y,z]] of Object.entries(coords))p[i]={x,y,z,visibility:1};const t=new MotionTake();t.begin('robot');for(let i=0;i<11;i++){p[15]={x:.7-i*.02,y:-.5+i*.025,z:0,visibility:1};t.add(retargetAvatar(p),i*100);}t.stop();return Array.from(exportMotionGLB(t.data()));}""")
        page.locator('#realAvatarFile').set_input_files({'name':'motion-fixture.glb','mimeType':'model/gltf-binary','buffer':bytes(fixture)})
        expect(page.locator('#assetPlay')).to_be_enabled(timeout=60000)
        page.locator('#assetPlay').click()
        expect(page.locator('#assetPlay')).to_have_text('Pause')
        page.wait_for_function("Number(document.getElementById('assetSeek').value)>0")
        page.locator('#assetPlay').click()
        page.locator('#assetReset').click()
        expect(page.locator('#assetSeek')).to_have_value('0')
        page.locator('#realAvatarClear').click()
        expect(page.locator('#assetPlay')).to_be_disabled()
        # Official public MediaPipe test portrait; never use a user's private photo.
        with urlopen('https://storage.googleapis.com/mediapipe-assets/portrait.jpg', timeout=30) as response:
            portrait=response.read(5*1024*1024)
        page.locator('#morphPhoto').set_input_files({'name':'portrait.jpg','mimeType':'image/jpeg','buffer':portrait})
        expect(page.locator('#morphStatus')).to_contain_text('Visage photographique 3D estimé',timeout=120000)
        with page.expect_download(timeout=60000) as info:
            page.locator('#morphExport').click()
        face=Path(info.value.path()).read_bytes()
        n,kind=struct.unpack_from('<II',face,12)
        doc=json.loads(face[20:20+n])
        assert doc.get('images') and doc.get('meshes'),doc.keys()
        page.locator('#morphClear').click()
        expect(page.locator('#realAvatarStage')).to_be_hidden()
        assert not errors,errors
        browser.close()
    print('WebGL: prompt -> real render -> PNG -> GLB -> reimport: OK')
finally:
    server.shutdown();server.server_close()
