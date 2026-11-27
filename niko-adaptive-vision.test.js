import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveCadence,FRESHNESS_TUNING,ROBUST_TUNING} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function frame(t,rate,aspect=1,noise=0){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const theta=(37+(k?0:8)+20*(k?-1:1)*Math.sin(t*2*Math.PI*rate/120000))*Math.PI/180,x=k?.68:.32;
  const j=Math.sin(t*.331+k*4)*noise;
  a[23+k]=p(x+j,.23);a[25+k]=p(x,.48+j);a[27+k]=p(x+.21*Math.sin(theta)/aspect+j,.48+.21*Math.cos(theta));
 }
 return a;
}
function trial(tuning,rate,aspect,noise,spikes){
 const m=new AdaptiveCadence(tuning);let n=0,accepted=0,abs=0,cost=0,bad=0,rejected=0;
 for(let t=0,i=0;t<31000;t+=40,i++){
  const a=frame(t,rate,aspect,noise),outlier=spikes&&t>10000&&i%23===0;
  if(outlier){a[27].x=.99;a[27].y=.96;}
  const v=m.update(a,t,aspect);
  if(t<10000)continue;n++;
  if(outlier){bad++;if(v===null)rejected++;}
  if(v!==null){accepted++;abs+=Math.abs(v-rate);cost+=Math.min(30,Math.abs(v-rate));}else cost+=30;
 }
 return {n,accepted,coverage:accepted/n,mae:accepted?abs/accepted:null,cost:cost/n,bad,rejected};
}
test('Robust Vision rejects all injected gross geometry outliers without fabricating outputs',()=>{
 const rows=[];
 for(const rate of [95,145,175])for(const aspect of [1,1.65])for(const noise of [.001,.006]){
  const base=trial(FRESHNESS_TUNING,rate,aspect,noise,true),candidate=trial(ROBUST_TUNING,rate,aspect,noise,true);
  rows.push({rate,aspect,noise,base,candidate});
  assert.equal(candidate.rejected,candidate.bad);
  assert.ok(candidate.coverage>=.90&&candidate.mae<=2,JSON.stringify({rate,aspect,noise,candidate}));
 }
 const mean=k=>rows.reduce((s,x)=>s+x[k].cost,0)/rows.length;
 console.log('V65_VISION',JSON.stringify({cases:rows.length,baseCost:mean('base'),candidateCost:mean('candidate'),rows}));
 // Report the coverage/error trade-off, including the cost of rejected frames.
 assert.ok(mean('candidate')<=mean('base')+1.5);
});
test('Robust Vision clean signals and missing observations stay fail-closed',()=>{
 for(const rate of [95,145,175])for(const aspect of [1,1.65]){
  const base=trial(FRESHNESS_TUNING,rate,aspect,.006,false),candidate=trial(ROBUST_TUNING,rate,aspect,.006,false);
  assert.equal(candidate.coverage,base.coverage);assert.ok(Math.abs(candidate.mae-base.mae)<1e-10);
 }
 const m=new AdaptiveCadence(ROBUST_TUNING);let v;
 for(let t=0;t<12000;t+=40)v=m.update(frame(t,145),t);
 assert.ok(v!==null);
 const f=frame(12000,145);f[27].visibility=.2;assert.equal(m.update(f,12000),null);assert.equal(m.reason,'invalid_landmarks');assert.equal(m.events.length,0);
 for(let t=12040;t<18000;t+=40)assert.equal(m.update(frame(t,145),t),null);
 assert.ok(m.geometry.length<=21);
});
test('outlier is not used as a new accepted sample; sustained dropout resets continuity',()=>{
 const m=new AdaptiveCadence(ROBUST_TUNING);
 for(let t=0;t<12000;t+=40)m.update(frame(t,145),t);
 const prior=m.last,events=m.events.length;
 const f=frame(12000,145);f[27].x=.99;f[27].y=.96;
 assert.equal(m.update(f,12000),null);assert.equal(m.reason,'geometry_outlier');assert.equal(m.last,prior);assert.equal(m.events.length,events);
 assert.equal(m.update(frame(12160,145),12160),null);assert.equal(m.reason,'sampling_gap');assert.equal(m.events.length,0);
});
