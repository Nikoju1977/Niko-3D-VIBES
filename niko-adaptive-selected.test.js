import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveCadence,SELECTED_TUNING} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function frame(t,c,r){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const phi=t*2*Math.PI*c.rate/120000,sign=c.mode==='simultaneous'?1:k?-1:1;
  const swing=c.mode==='still'||(c.mode==='unilateral'&&k)?0:c.amp*sign*(Math.sin(phi)+.10*Math.sin(2*phi));
  const theta=(35+(k?0:c.bias)+swing)*Math.PI/180,x=k?.68:.32;
  const j=()=>c.noise*(r()-.5);
  a[23+k]=p(x+j(),.23+j());a[25+k]=p(x+j(),.48+j());a[27+k]=p(x+.21*Math.sin(theta)/c.aspect+j(),.48+.21*Math.cos(theta)+j());
 }
 return a;
}
const BASE={tau:65,fraction:.22};
function trial(c,tuning,seed){
 const m=new AdaptiveCadence(tuning),r=rng(seed);let accepted=0,n=0,abs=0;
 for(let t=0,i=0;t<27000;t+=[29,41,57,79,103][i++%5]){
  const v=m.update(frame(t,c,r),t,c.aspect);
  if(t<10000)continue;n++;
  if(v!==null){accepted++;abs+=Math.abs(v-c.rate);}
 }
 return {accepted,n,coverage:accepted/n,mae:accepted?abs/accepted:null};
}
test('V6.1 selected tuning: new synthetic profiles, distorted aspect and deterministic independent seeds',()=>{
 const rows=[];
 for(const [i,rate] of [100,130,170].entries())for(const aspect of [1,1.6])for(const noise of [.003,.009]){
  const c={rate,amp:[11,15,18][i],bias:[-13,12,7][i],aspect,noise,mode:'alternating'};
  const seed=76423+i*100+Math.round(aspect*10)+Math.round(noise*10000),base=trial(c,BASE,seed),selected=trial(c,SELECTED_TUNING,seed);
  rows.push({c,base,selected});
  assert.ok(selected.coverage>=.90&&selected.mae<=3,JSON.stringify({c,base,selected}));
 }
 for(const mode of ['still','unilateral','simultaneous']){
  const c={rate:130,amp:18,bias:10,aspect:1.6,noise:.009,mode};
  const base=trial(c,BASE,54321),selected=trial(c,SELECTED_TUNING,54321);rows.push({c,base,selected});
  assert.equal(selected.accepted,0);
 }
 const positive=rows.filter(x=>x.c.mode==='alternating'),average=key=>positive.reduce((a,x)=>a+x[key].mae,0)/positive.length;
 console.log('V61_AUDIT',JSON.stringify({cases:rows.length,baselineMeanMAE:average('base'),selectedMeanMAE:average('selected'),rows}));
 // Safety envelope, not a promise that selected wins every independent scenario.
 assert.ok(average('selected')<=average('base')+.15);
});
test('selected tuning is immutable and old baseline remains reproducible',()=>{
 assert.ok(Object.isFrozen(SELECTED_TUNING));assert.equal(new AdaptiveCadence().fraction,.22);
 assert.equal(new AdaptiveCadence(SELECTED_TUNING).fraction,.18);
});
