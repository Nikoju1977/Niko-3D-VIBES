import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveCadence,SELECTED_TUNING,PRECISION_TUNING,DYNAMIC_TUNING,phaseRegression} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
function frame(t,c,r){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const phi=t*2*Math.PI*c.rate/120000,sign=c.mode==='simultaneous'?1:k?-1:1;
  const swing=c.mode==='still'||(c.mode==='unilateral'&&k)?0:c.amp*sign*(Math.sin(phi)+.13*Math.sin(2*phi+.3));
  const theta=(37+(k?0:c.bias)+swing)*Math.PI/180,x=k?.68:.32;
  const j=()=>c.noise*(r()-.5);
  a[23+k]=p(x+j(),.23+j());a[25+k]=p(x+j(),.48+j());a[27+k]=p(x+.21*Math.sin(theta)/c.aspect+j(),.48+.21*Math.cos(theta)+j());
 }
 return a;
}
function trial(c,tuning,seed){
 const m=new AdaptiveCadence(tuning),r=rng(seed);let accepted=0,n=0,abs=0;
 for(let t=0,i=0;t<31000;t+=[31,46,61,73,97][i++%5]){
  const v=m.update(frame(t,c,r),t,c.aspect);
  if(t<12000)continue;n++;
  if(v!==null){accepted++;abs+=Math.abs(v-c.rate);}
 }
 return {accepted,n,coverage:accepted/n,mae:accepted?abs/accepted:null};
}
test('phase regression separates phase-specific delay and estimates a common interval',()=>{
 const events=Array.from({length:12},(_,i)=>({t:1000+400*i+(i%2?70:0),phase:i%2?-1:1}));
 assert.ok(Math.abs(phaseRegression(events,401)-400)<1e-8);
 assert.equal(phaseRegression(events.slice(0,5),401),401);
 assert.equal(phaseRegression(events,100),100);
});
test('V6.2 independent synthetic benchmark must improve mean error without coverage regression',()=>{
 const rows=[];
 for(const [i,rate] of [95,115,145,175].entries())for(const aspect of [1,1.65])for(const noise of [.004,.011]){
  const c={rate,amp:[12,16,19,21][i],bias:[-9,15,-12,8][i],aspect,noise,mode:'alternating'};
  const seed=271923+i*100+Math.round(aspect*100)+Math.round(noise*10000),base=trial(c,SELECTED_TUNING,seed),candidate=trial(c,PRECISION_TUNING,seed);
  rows.push({c,base,candidate});
  assert.ok(candidate.coverage>=.90&&candidate.coverage>=base.coverage-.01&&candidate.mae<=3,JSON.stringify({c,base,candidate}));
 }
 for(const mode of ['still','unilateral','simultaneous']){
  const c={rate:145,amp:19,bias:11,aspect:1.65,noise:.011,mode};
  const base=trial(c,SELECTED_TUNING,271923),candidate=trial(c,PRECISION_TUNING,271923);
  rows.push({c,base,candidate});assert.equal(candidate.accepted,0);
 }
 const pos=rows.filter(x=>x.c.mode==='alternating'),average=k=>pos.reduce((a,x)=>a+x[k].mae,0)/pos.length;
 console.log('V62_PRECISION',JSON.stringify({cases:rows.length,baselineMeanMAE:average('base'),candidateMeanMAE:average('candidate'),rows}));
 assert.ok(average('candidate')<average('base'), 'Candidate must actually reduce mean error');
});

test('V6.3 application selection retains V6.2 precision on all 16 steady rhythm conditions',()=>{
 for(const [i,rate] of [95,115,145,175].entries())for(const aspect of [1,1.65])for(const noise of [.004,.011]){
  const c={rate,amp:[12,16,19,21][i],bias:[-9,15,-12,8][i],aspect,noise,mode:'alternating'};
  const seed=271923+i*100+Math.round(aspect*100)+Math.round(noise*10000),base=trial(c,PRECISION_TUNING,seed),candidate=trial(c,DYNAMIC_TUNING,seed);
  assert.ok(candidate.coverage>=base.coverage-.01&&candidate.mae<=base.mae+.02,JSON.stringify({c,base,candidate}));
 }
});
