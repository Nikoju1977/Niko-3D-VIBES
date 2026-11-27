import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Cadence} from './niko-native.js';
import {AdaptiveCadence} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function frame(t,{rate=120,amplitude=20,bias=0,noise=.002,mode='alternating'}={},r=()=>.5){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const phase=t*2*Math.PI*rate/120000,sign=mode==='simultaneous'?1:k?-1:1;
  const swing=mode==='still'||(mode==='unilateral'&&k)?0:amplitude*sign*Math.sin(phase);
  const theta=(35+(k?0:bias)+swing)*Math.PI/180,x=k?.64:.32;
  const jitter=()=>noise*(r()-.5);
  a[23+k]=p(x+jitter(),.23+jitter());a[25+k]=p(x+jitter(),.48+jitter());a[27+k]=p(x+.22*Math.sin(theta)+jitter(),.48+.22*Math.cos(theta)+jitter());
 }
 return a;
}
function scenario(params,seed=1){
 const r=rng(seed),old=new Cadence(),next=new AdaptiveCadence(),stats={v51:{n:0,abs:0},v6:{n:0,abs:0}};let eligible=0;
 for(let t=0,i=0;t<28000;t+=[35,47,63,82][i++%4]){
  const f=frame(t,params,r),a=old.update(f,t),b=next.update(f,t);
  if(t<10000)continue;eligible++;
  for(const [key,value] of [['v51',a],['v6',b]])if(value!==null){stats[key].n++;stats[key].abs+=Math.abs(value-(params.rate??120));}
 }
 return Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,{accepted:v.n,eligible,coverage:v.n/eligible,mae:params.mode&&params.mode!=='alternating'?null:v.n?v.abs/v.n:null}]));
}
test('V6 preserves standard periodic performance and rejects false signal',()=>{
 for(const rate of [90,120,150,180])for(const noise of [0,.003,.008]){
  const result=scenario({rate,noise},rate+Math.round(noise*100000));console.log('V6BENCH',JSON.stringify({rate,noise,mode:'standard',...result}));
  assert.ok(result.v6.coverage>=.95&&result.v6.mae<=2,JSON.stringify(result));
 }
 for(const mode of ['still','simultaneous','unilateral']){
  const result=scenario({mode,noise:.003});console.log('V6BENCH',JSON.stringify({mode,...result}));assert.equal(result.v6.accepted,0);
 }
});
test('V6 adaptive center improves coverage on biased low-amplitude synthetic motion',()=>{
 for(const rate of [90,120,150])for(const bias of [0,18]){
  const result=scenario({rate,amplitude:8,bias,noise:.002},rate+bias);console.log('V6BENCH',JSON.stringify({rate,bias,mode:'low_amplitude',...result}));
  assert.ok(result.v6.coverage>=.85&&result.v6.mae<=3,JSON.stringify(result));
  if(bias)assert.ok(result.v6.coverage>result.v51.coverage+.5,JSON.stringify(result));
 }
});
test('V6 rejects invalid frames and bounds history',()=>{
 const c=new AdaptiveCadence();let v;
 for(let t=0;t<=12000;t+=40)v=c.update(frame(t),t);
 assert.ok(v!==null);assert.ok(c.window.length<=256&&c.events.length<=32);
 assert.equal(c.update(frame(12200),12200),null);assert.equal(c.reason,'sampling_gap');
 const f=frame(12240);f[25].visibility=.1;assert.equal(c.update(f,12240),null);assert.equal(c.reason,'invalid_landmarks');
});
