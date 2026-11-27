"""Real browser UI smoke test (no camera/model inference). Run with Playwright installed."""
from pathlib import Path
import json
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright
root = Path(__file__).resolve().parents[1] / 'public-build'
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(root)))
Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
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
            page.locator('#gestureEngine').select_option('niko')
            assert page.locator('#gestureEngine').input_value() == 'niko'
            assert page.locator('#measurementQuality').inner_text() == 'Aucune mesure'
            page.locator('#gestureEngine').select_option('legacy')
            for mode in ['bio','robot','sound','cinema','dj','art','twin','agent','mocap','holo']:
                btn=page.locator(f'[data-mode={mode}]');btn.click()
                assert btn.get_attribute('aria-pressed')=='true', mode
            page.locator('[data-mode=twin]').click()
            page.locator('#twinRig').select_option('avatar')
            page.wait_for_function("document.getElementById('avatarStatus').textContent === 'Avatar : signal 3D insuffisant'")
            # Synthetic data verifies the actual module in the browser, not camera inference.
            result = page.evaluate("""async () => {
                const {retargetAvatar}=await import('./niko-avatar.js');
                const p=Array(33).fill(null);
                for(const [i,x,y] of [[11,.2,-.5],[12,-.2,-.5],[23,.12,0],[24,-.12,0],[13,.5,-.5],[15,.7,-.5]])p[i]={x,y,z:0,visibility:1};
                const r=retargetAvatar(p);return {count:r.bones.length,clinical:r.clinicalValidation};
            }""")
            assert result['count'] == 7 and result['clinical'] is False, result
            page.locator('#twinRig').select_option('landmarks')
            page.locator('[data-mode=holo]').click()
            page.locator('#renderer').select_option('gpu')
            page.wait_for_function("document.getElementById('rendererStatus').textContent === 'WebGL 2 · actif'")
            # Actual shader draw/readback on CI software WebGL, not physical GPU.
            pixels = page.evaluate("""async () => {
                const {SpatialRenderer}=await import('./niko-spatial.js');
                const canvas=document.createElement('canvas'),r=new SpatialRenderer(canvas);
                const ok=r.draw([{color:'#ff0000',dir:[0,0,0],points:[[0,0,0]]}],{yaw:0,pitch:0,zoom:1,explode:0},128,128,1);
                const pixel=new Uint8Array(4);r.gl.readPixels(64,64,1,1,r.gl.RGBA,r.gl.UNSIGNED_BYTE,pixel);r.dispose();
                return {ok,pixel:[...pixel]};
            }""")
            assert pixels['ok'] and pixels['pixel'][0] > 200 and pixels['pixel'][1] < 30, pixels
            page.evaluate("document.querySelector('.spatial-gpu').dispatchEvent(new Event('webglcontextlost',{cancelable:true}))")
            page.wait_for_function("document.getElementById('rendererStatus').textContent === 'Canvas 2D · repli GPU'")
            page.locator('#renderer').select_option('cpu')
            print('Spatial: WebGL2 shader readback and context-loss fallback OK')
            page.locator('[data-mode=art]').click()
            canvas=page.locator('#advCanvas');canvas.scroll_into_view_if_needed();box=canvas.bounding_box()
            x,y=box['x']+box['width']*.4,box['y']+box['height']*.4
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+30,y+20,steps=6);page.mouse.up()
            with page.expect_download() as info: page.locator('#artExport').click()
            data=Path(info.value.path()).read_text();assert '\nv ' in data and '\nl ' in data
            page.locator('#stop').click();assert 'ARRÊTÉ' in page.locator('#status').inner_text()
            page.locator('#exportPassword').fill('synthetic browser passphrase')
            with page.expect_download() as encrypted: page.locator('#exportEncrypted').click()
            envelope = json.loads(Path(encrypted.value.path()).read_text())
            assert envelope['cipher'] == 'AES-256-GCM' and 'measurements' not in envelope
            decrypted = page.evaluate("""async envelope => {
                const {decryptSession}=await import('./niko-precision-core.js');
                return JSON.parse(await decryptSession(envelope,'synthetic browser passphrase'));
            }""", envelope)
            assert decrypted['clinical_validation'] is False
            assert decrypted['precision_core'] == '1.0.0'
            assert page.locator('#exportPassword').input_value() == ''
            assert not errors, errors

            # V10 comparison with the same application scripts and two CSS variants.
            css = (root / 'style.css').read_text()
            marker = '/* Studio Niko UI Engine V10'
            assert marker in css
            original = css.split(marker, 1)[0]
            measurements = {}
            for variant in ['before','after']:
                probe = browser.new_page(viewport=viewport, service_workers='block', reduced_motion='reduce')
                probe.route('**/style.css', lambda route: route.fulfill(status=200, content_type='text/css', body=original if variant == 'before' else css))
                probe.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='domcontentloaded', timeout=15000)
                probe.wait_for_selector('#advCanvas', state='attached', timeout=10000)
                data = probe.evaluate("""() => {
                    const buttons = [...document.querySelectorAll('.tabs button')];
                    const controls = [...document.querySelectorAll('.tabs button,.actions button,.actions select')].filter(e => e.getBoundingClientRect().width > 0);
                    const rect = e => e.getBoundingClientRect();
                    return {overflow: Math.max(0,document.documentElement.scrollWidth-innerWidth), tabs: buttons.length,
                      visible: controls.length, small: controls.filter(e => rect(e).height < 44).length,
                      columns: getComputedStyle(document.querySelector('.tabs')).gridTemplateColumns,
                      active: getComputedStyle(document.querySelector('.tabs button.active')).backgroundColor};
                }""")
                measurements[variant] = data
                if variant == 'after':
                    assert data['tabs'] == 10 and data['small'] == 0, data
                    assert data['active'] == 'rgb(194, 187, 255)', data
                    probe.locator('[data-mode=robot]').focus()
                    assert probe.locator('[data-mode=robot]').evaluate("(e) => getComputedStyle(e).outlineStyle") == 'solid'
                probe.close()
            assert measurements['after']['overflow'] <= measurements['before']['overflow'], measurements
            assert measurements['after']['overflow'] == 0, measurements
            assert measurements['after']['visible'] >= measurements['before']['visible'], measurements
            print(f"UI Engine V10 {viewport['width']}px before/after: {measurements}")
            page.close()
        browser.close()
    print('Browser smoke: desktop/mobile viewport, 10 tabs, OBJ export, stop: OK')
finally:
    server.shutdown();server.server_close()
