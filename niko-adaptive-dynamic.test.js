import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveCadence,PRECISION_TUNING,DYNAMIC_TUNING,recentRhythmShift} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function frame(t,c,r){
 const phaseAt=ms=>2*Math.PI*ms/120000;
 const phase=phaseAt(Math.min(t,16000)*c.from+Math.max(0,t-16000)*c.to);
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const sign=c.mode==='simultaneous'?1:k?-1:1;
  const swing=c.mode==='still'||(c.mode==='unilateral'&&k)?0:c.amp*sign*(Math.sin(phase)+.09*Math.sin(2*phase+.2));
  const theta=(37+(k?0:c.bias)+swing)*Math.PI/180,x=k?.68:.32;
  const j=()=>c.noise*(r()-.5);
  a[23+k]=p(x+j(),.23+j());a[25+k]=p(x+j(),.48+j());a[27+k]=p(x+.21*Math.sin(theta)/c.aspect+j(),.48+.21*Math.cos(theta)+j());
 }
 return a;
}
function trial(c,tuning,seed){
 const m=new AdaptiveCadence(tuning),r=rng(seed);
 let accepted=0,n=0,abs=0,penalty=0,settled=0,settleMs=null;
 for(let t=0,i=0;t<31000;t+=[29,41,59,71,89][i++%5]){
  const v=m.update(frame(t,c,r),t,c.aspect);
  if(t<16000)continue;
  const error=v===null?null:Math.abs(v-c.to);
  // Require 5 consecutive accurate samples before reporting recovery.
  settled=error!==null&&error<=2?settled+1:0;
  if(settled===5&&settleMs===null)settleMs=t-16000;
  if(t<18000||t>25000)continue;
  n++;
  if(error!==null){accepted++;abs+=error;penalty+=Math.min(error,30);}
  else penalty+=30;
 }
 return {accepted,n,coverage:accepted/n,mae:accepted?abs/accepted:null,penalizedError:penalty/n,settleMs};
}
test('rhythm-shift detector requires consistent new same-phase periods',()=>{
 let t=1000;const ev=Array.from({length:15},(_,i)=>{if(i)t+=i<9?500:333;return {t,phase:i%2?-1:1};});
 assert.equal(recentRhythmShift(ev),true);
 assert.equal(recentRhythmShift(ev.slice(0,8)),false);
 assert.equal(recentRhythmShift(Array.from({length:15},(_,i)=>({t:i*500,phase:i%2?-1:1}))),false);
});
test('experimental dynamic window reduces transition cost while preserving stationary rhythm',()=>{
 const rows=[];
 for(const [i,[from,to]] of [[95,145],[145,95],[115,175],[175,115],[110,160],[160,110]].entries())for(const noise of [.003,.008]){
  const c={from,to,amp:19,bias:i%2?11:-9,aspect:i%2?1.6:1,noise,mode:'alternating'};
  const seed=561271+i*100+Math.round(noise*1e4),base=trial(c,PRECISION_TUNING,seed),candidate=trial(c,DYNAMIC_TUNING,seed);
  rows.push({c,base,candidate});
 }
 const mean=k=>rows.reduce((s,x)=>s+x[k].penalizedError,0)/rows.length;
 console.log('V63_DYNAMIC',JSON.stringify({cases:rows.length,baselineCost:mean('base'),candidateCost:mean('candidate'),rows}));
 assert.ok(mean('candidate')<mean('base'),'dynamic candidate must lower transition error including abstention');
 for(const rate of [95,145,175]){
  const c={from:rate,to:rate,amp:19,bias:10,aspect:1.6,noise:.008,mode:'alternating'};
  const base=trial(c,PRECISION_TUNING,2371+rate),candidate=trial(c,DYNAMIC_TUNING,2371+rate);
  assert.ok(candidate.coverage>=base.coverage-.01&&candidate.penalizedError<=base.penalizedError+.1);
 }
 for(const mode of ['still','unilateral','simultaneous']){
  const c={from:145,to:175,amp:19,bias:11,aspect:1.6,noise:.008,mode};
  assert.equal(trial(c,DYNAMIC_TUNING,81727).accepted,0);
 }
});
