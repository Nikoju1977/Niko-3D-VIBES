import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handFeatures,classify,NikoGesture,AdaptiveAxis} from './niko-gesture.js';
import {HandTracker} from './neuro.js';
function hand(flags=[true,true,true,true]){
 const p=Array.from({length:21},()=>({x:.5,y:.65,z:0}));p[0]={x:.5,y:.8,z:0};
 for(const [j,start] of [5,9,13,17].entries()){
  const x=.38+j*.065;p[start]={x,y:.60,z:0};p[start+1]={x,y:.52,z:0};
  p[start+2]=flags[j]?{x,y:.44,z:0}:{x:x+.065,y:.52,z:0};
  p[start+3]=flags[j]?{x,y:.36,z:0}:{x:x+.065,y:.59,z:0};
 }
 p[4]={x:.25,y:.70,z:0};return p;
}
test('angles classify synthetic open, fist, peace and point',()=>{
 for(const [flags,gesture] of [[[true,true,true,true],'OPEN'],[[false,false,false,false],'FIST'],[[true,true,false,false],'PEACE'],[[true,false,false,false],'POINT']]){
  assert.equal(classify(handFeatures(hand(flags))).gesture,gesture);
 }
});
test('pinch and ambiguity do not create stale activation',()=>{
 const p=hand();p[4]={...p[8]};const g=new NikoGesture();
 assert.equal(g.update(p,0).gesture,'NONE');assert.equal(g.update(p,80).gesture,'PINCH');
 assert.equal(g.update(hand([false,true,false,true]),100).gesture,'NONE');
 assert.equal(g.update(null,120),null);assert.equal(g.update(p,140).gesture,'NONE');
});
test('timestamp reversal and gaps restart activation',()=>{
 const g=new NikoGesture(),p=hand();g.update(p,0);assert.equal(g.update(p,150).gesture,'OPEN');
 assert.equal(g.update(p,100).gesture,'NONE');assert.equal(g.update(p,600).gesture,'NONE');
});
test('filter reduces stationary alternating jitter and follows motion',()=>{
 const f=new AdaptiveAxis();let raw=0,filtered=0;
 for(let i=0;i<100;i++){const x=.5+(i%2?.01:-.01),y=f.update(x,i*33);if(i>10){raw+=(x-.5)**2;filtered+=(y-.5)**2;}}
 assert.ok(filtered<raw*.5);for(let i=100;i<120;i++)f.update(.8,i*33);assert.ok(Math.abs(f.value-.8)<.01);
 console.log('Synthetic stationary jitter RMS ratio:',Math.sqrt(filtered/raw).toFixed(3));
});
test('new recognizer is selectable via tracker; default legacy unaffected',()=>{
 const h=new HandTracker({gestureFactory:()=>new NikoGesture()});
 h.update([hand()],[],0);assert.equal(h.update([hand()],[],150).primary.g.gesture,'OPEN');
 assert.equal(h.update([],[],200).primary,undefined);
 assert.equal(handFeatures([{x:0,y:0}]),null);
});
