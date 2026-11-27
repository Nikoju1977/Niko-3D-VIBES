import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cadence,Gesture,angle,robotAction} from './niko-native.js';
import {Cadence as LegacyCadence} from './engine.js';
import {HandTracker} from './neuro.js';
const p=(x,y)=>({x,y,visibility:1});
function frame(t,spm=150,amplitude=32){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const theta=(25+amplitude/2*(1+(k?-1:1)*Math.sin(t*2*Math.PI*spm/120000)))*Math.PI/180;
  const x=k?.65:.35;a[23+k]=p(x,.25);a[25+k]=p(x,.5);a[27+k]=p(x+.18*Math.sin(theta),.5+.18*Math.cos(theta));
 }
 return a;
}
test('native angle uses atan2 and rejects missing visibility and out-of-frame values',()=>{assert.equal(angle(p(.5,0),p(.5,.5),p(1,.5)),90);assert.equal(angle({x:.5,y:0},p(.5,.5),p(1,.5)),null);assert.equal(angle(p(1.1,0),p(.5,.5),p(1,.5)),null);});
test('native cadence synthetic 90, 150 and 180 cycles, irregular sample times',()=>{for(const expected of [90,150,180]){const c=new Cadence();let v;for(let t=0,i=0;t<20000;t+=[35,48,57,40][i++%4])v=c.update(frame(t,expected),t);assert.ok(v!==null&&Math.abs(v-expected)<6,'expected '+expected+' got '+v);}});
test('reject stationary pose, simultaneous flexion, insufficient visibility and time reversal',()=>{const c=new Cadence();for(let t=0;t<9000;t+=40){const f=frame(t);f[28]=p(.65+(f[27].x-.35),f[27].y);assert.equal(c.update(f,t),null);}assert.equal(c.total,0);for(let t=9000;t<18000;t+=40)c.update(frame(t),t);assert.equal(c.update(frame(18000),17900),null);const f=frame(18000);f[25].visibility=.1;assert.equal(c.update(f,18000),null);assert.equal(c.update(null,18100),null);});
test('synthetic comparison records both estimators without asserting clinical superiority',()=>{const a=new Cadence(),b=new LegacyCadence();let x,y;for(let t=0;t<20000;t+=40){const f=frame(t);x=a.update(f,t);y=b.update(f,t);}assert.ok(x!==null&&Math.abs(x-150)<6);console.log('Synthetic knee-phase fixture only: native='+x+', legacy='+y);});
test('native default tracker and virtual robot compatibility',()=>{const h=new HandTracker();assert.equal(h.gestureFactory() instanceof Gesture,true);assert.equal(robotAction('OPEN'),'SCAN');assert.equal(robotAction('__proto__'),'REPOS');assert.equal(h.update([[null]],[],0).found.length,0);});
