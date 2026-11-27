"""Real local WAV decode, two decks, measured output and stop in Chromium."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright,expect
import io,wave,math,struct
root=Path(__file__).resolve().parents[1]/'public-build'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
def tone(hz):
    buf=io.BytesIO()
    with wave.open(buf,'wb') as w:
        w.setparams((1,2,16000,0,'NONE','not compressed'))
        w.writeframes(b''.join(struct.pack('<h',int(10000*math.sin(2*math.pi*hz*i/16000))) for i in range(16000*12)))
    return buf.getvalue()
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
        page=browser.new_page(viewport={'width':390,'height':844})
        page.goto(f'http://127.0.0.1:{server.server_port}/?safe=1')
        page.locator('[data-mode=dj]').click()
        for i,hz in enumerate([440,660]):
            page.locator(f'#deck{i}').set_input_files({'name':f'tone-{i}.wav','mimeType':'audio/wav','buffer':tone(hz)})
            expect(page.locator(f'#track{i}')).to_have_text(f'tone-{i}.wav',timeout=20000)
            expect(page.locator(f'#play{i}')).to_be_enabled()
        page.locator('#play0').click()
        page.locator('#play1').click()
        expect(page.locator('#play0')).to_have_text('Pause A')
        expect(page.locator('#play1')).to_have_text('Pause B')
        page.wait_for_function("document.getElementById('djPeak').value > -45")
        page.locator('#djMaster').fill('0')
        page.wait_for_function("document.getElementById('djPeak').value < -55")
        page.locator('#djMaster').fill('65')
        page.wait_for_function("document.getElementById('djPeak').value > -45")
        page.locator('#deckSeek0').fill('500')
        page.wait_for_function("document.getElementById('deckTime0').textContent.startsWith('0:06')")
        page.locator('#deckRate1').fill('110')
        page.locator('#mix').fill('100')
        page.locator('[data-mode=holo]').click()
        page.locator('[data-mode=dj]').click()
        expect(page.locator('#play0')).to_have_text('Lecture A')
        expect(page.locator('#play1')).to_have_text('Lecture B')
        page.wait_for_function("document.getElementById('djPeak').value < -55")
        page.locator('#deck0').set_input_files({'name':'invalid.wav','mimeType':'audio/wav','buffer':b'not audio'})
        expect(page.locator('#track0')).to_contain_text('Audio :',timeout=20000)
        expect(page.locator('#play0')).to_be_disabled()
        browser.close()
    print('DJ: two WAV decks, measured output, mute/recovery, seek, mode stop and invalid file: OK')
finally:
    server.shutdown();server.server_close()
