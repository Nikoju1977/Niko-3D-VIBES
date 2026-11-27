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
            page.locator('#gestureEngine').select_option('niko')
            assert page.locator('#gestureEngine').input_value() == 'niko'
            page.locator('#gestureEngine').select_option('legacy')
            for mode in ['bio','robot','sound','cinema','dj','art','twin','agent','mocap','holo']:
                btn=page.locator(f'[data-mode={mode}]');btn.click()
                assert btn.get_attribute('aria-pressed')=='true', mode
            page.locator('[data-mode=art]').click()
            canvas=page.locator('#advCanvas');canvas.scroll_into_view_if_needed();box=canvas.bounding_box()
            x,y=box['x']+box['width']*.4,box['y']+box['height']*.4
            page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+30,y+20,steps=6);page.mouse.up()
            with page.expect_download() as info: page.locator('#artExport').click()
            data=Path(info.value.path()).read_text();assert '\nv ' in data and '\nl ' in data
            page.locator('#stop').click();assert 'ARRÊTÉ' in page.locator('#status').inner_text()
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
