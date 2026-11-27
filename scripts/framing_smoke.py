"""Actual canvas pixel bounds with deterministic synthetic landmark input (not hardware validation)."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from playwright.sync_api import sync_playwright,expect
root=Path(__file__).resolve().parents[1]/'public-build'
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
fixture="""export class VisionClient{async start(){return 'Fixture test';}async frame(){const p=Array.from({length:33},(_,i)=>({x:.77,y:.45,z:0,visibility:1}));for(const [i,x,y,z] of [[0,.77,.1,0],[11,.61,.27,0],[12,.93,.27,0],[13,.56,.45,.2],[14,.98,.45,-.2],[15,.52,.62,.3],[16,.99,.62,-.3],[23,.7,.52,0],[24,.84,.52,0],[25,.69,.73,0],[26,.85,.73,0],[27,.68,.94,0],[28,.86,.94,0],[29,.68,.94,0],[30,.86,.94,0],[31,.67,.95,0],[32,.87,.95,0]])p[i]={x,y,z,visibility:1};return {hands:[],labels:[],poses:[p],world:p.map(q=>({x:(q.x-.77)*2,y:(q.y-.52)*2,z:q.z,visibility:1}))};}close(){}}"""
try:
    with sync_playwright() as p:
        browser=p.chromium.launch(args=['--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream'])
        for size in [{'width':1280,'height':800},{'width':390,'height':844}]:
            page=browser.new_context(viewport=size,permissions=['camera']).new_page()
            page.route('**/vision-client.js',lambda route:route.fulfill(status=200,content_type='text/javascript',body=fixture))
            page.goto(f'http://127.0.0.1:{server.server_port}/?safe=1')
            expect(page.locator('#bootStatus')).to_be_hidden()
            page.locator('#camera').click()
            expect(page.locator('#track')).to_contain_text('1 CORPS',timeout=15000)
            # Orange overlay landmarks must remain at the detected, off-center position.
            overlay=page.locator('#overlay').evaluate("""c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let min=c.width,max=-1;for(let i=0;i<a.length;i+=4)if(a[i]>235&&a[i+1]>150&&a[i+1]<210&&a[i+2]<135&&a[i+3]>180){let x=(i/4)%c.width;min=Math.min(min,x);max=Math.max(max,x);}return {min,max,w:c.width};}""")
            assert overlay['min']<overlay['max'] and (overlay['min']+overlay['max'])/2<overlay['w']*.45,overlay
            page.locator('[data-mode=twin]').click()
            page.locator('#twinRig').select_option('landmarks')
            for rotation in ['0','90','-90']:
                page.locator('#twinRotate').fill(rotation)
                page.wait_for_timeout(400)
                b=page.locator('#advCanvas').evaluate("""c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let l=c.width,r=-1,t=c.height,b=-1;for(let i=0;i<a.length;i+=4)if(a[i]>240&&a[i+1]>170&&a[i+1]<210&&a[i+2]>90&&a[i+2]<140){let n=i/4,x=n%c.width,y=Math.floor(n/c.width);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {l,r,t,b,w:c.width,h:c.height};}""")
                assert b['l']<b['r'] and b['t']<b['b'],b
                assert b['l']>=30 and b['r']<=b['w']-30 and b['t']>=30 and b['b']<=b['h']-30,b
                assert abs((b['l']+b['r'])/2-b['w']/2)<8 and abs((b['t']+b['b'])/2-b['h']/2)<8,b
            page.locator('#stop').click()
            page.context.close()
        browser.close()
    print('Skeleton framing: camera alignment, centered rotated skeleton, desktop/mobile pixel bounds: OK')
finally:
    server.shutdown();server.server_close()
