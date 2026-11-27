import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cadence} from './niko-native.js';
import {Cadence as Legacy} from './engine.js';
const p=(x,y)=>({x,y,visibility:1});
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function frame(t,rate,r,noise,mode){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const phase=t*2*Math.PI*rate/120000,sign=mode==='simultaneous'?1:k?-1:1;
  const theta=(35+(mode==='still'?0:20*sign*Math.sin(phase)))*Math.PI/180;
  const x=k?.65:.35,dx=(r()-.5)*noise,dy=(r()-.5)*noise;
  a[23+k]=p(x+dx,.23+dy);a[25+k]=p(x+(r()-.5)*noise,.48+(r()-.5)*noise);
  a[27+k]=p(x+.22*Math.sin(theta)+(r()-.5)*noise,.48+.22*Math.cos(theta)+(r()-.5)*noise);
 }
 return a;
}
function scenario({rate=150,noise=0,mode='alternating',seed=42,dt=[35,47,63,82]}){
 const native=new Cadence(),legacy=new Legacy(),r=rng(seed),stats={native:{n:0,abs:0},legacy:{n:0,abs:0}};let eligible=0;
 for(let t=0,i=0;t<24000;t+=dt[i++%dt.length]){
  const f=frame(t,rate,r,noise,mode),a=native.update(f,t),b=legacy.update(f,t);
  if(t<8000)continue;eligible++;
  for(const [key,value] of [['native',a],['legacy',b]])if(value!==null){stats[key].n++;stats[key].abs+=Math.abs(value-rate);}
 }
 return Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,{accepted:v.n,eligible,coverage:v.n/eligible,mae:mode==='alternating'&&v.n?v.abs/v.n:null}]));
}
test('benchmark known periodic signals: independent seeds, jitter and noise',()=>{
 for(const rate of [90,120,150,180])for(const noise of [0,.003,.008]){
  const result=scenario({rate,noise,seed:rate+Math.round(noise*1e5)});
  console.log('BENCH',JSON.stringify({rate,noise,mode:'alternating',...result}));
  assert.ok(result.native.coverage>=.75,JSON.stringify(result));
  assert.ok(result.native.mae<=5,JSON.stringify(result));
 }
});
test('benchmark simultaneous flexion and still poses are not cadence',()=>{
 for(const mode of ['simultaneous','still']){
  const result=scenario({rate:150,noise:.003,mode});console.log('BENCH',JSON.stringify({mode,...result}));
  assert.equal(result.native.accepted,0);
 }
});
test('sampling gap and invalid visibility invalidate estimates immediately',()=>{
 const c=new Cadence(),r=rng(5);let last;
 for(let t=0;t<=10000;t+=40)last=c.update(frame(t,150,r,0,'alternating'),t);
 assert.ok(last!==null);assert.equal(c.update(frame(10200,150,r,0,'alternating'),10200),null);assert.equal(c.reason,'sampling_gap');
 const f=frame(10240,150,r,0,'alternating');f[25].visibility=.1;assert.equal(c.update(f,10240),null);assert.equal(c.reason,'invalid_landmarks');
});
