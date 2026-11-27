import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AdaptiveCadence,DYNAMIC_TUNING,FRESHNESS_TUNING} from './niko-adaptive.js';
const p=(x,y)=>({x,y,visibility:1});
function frame(t,rate,stop,phaseOffset,noise=0,mode='alternating'){
 const a=Array.from({length:33},()=>p(.5,.5));
 const phase=(Math.min(t,stop)*rate*2*Math.PI/120000)+phaseOffset;
 for(let k=0;k<2;k++){
  const sign=mode==='simultaneous'?1:k?-1:1;
  const swing=mode==='still'||(mode==='unilateral'&&k)?0:20*sign*Math.sin(phase);
  const theta=(37+(k?0:8)+swing)*Math.PI/180,x=k?.68:.32;
  const j=Math.sin(t*.331+k*4)*noise;
  a[23+k]=p(x+j,.23);a[25+k]=p(x,.48+j);a[27+k]=p(x+.21*Math.sin(theta)+j,.48+.21*Math.cos(theta));
 }
 return a;
}
function trial(tuning,rate,offset,noise){
 const m=new AdaptiveCadence(tuning);let stale=0,valid=0,eligible=0,last=null,recovered=null;
 for(let t=0,i=0;t<31000;t+=[29,41,59,71,89][i++%5]){
  const stop=17000,restart=21000;
  const motionTime=t>restart?t-(restart-stop):t;
  const v=m.update(frame(motionTime,rate,t>restart?Infinity:stop,offset,noise),t);
  if(t>12000&&t<stop){eligible++;if(v!==null)valid++;}
  if(t>=stop&&t<restart&&v!==null){stale++;last=t-stop;}
  if(t>restart&&v!==null&&Math.abs(v-rate)<2&&recovered===null)recovered=t-restart;
 }
 return {stale,last,recovered,coverage:valid/eligible};
}
test('V6.4 freshness candidate reduces stale outputs after stopping, with coverage and recovery guardrails',()=>{
 const rows=[];
 for(const rate of [95,145,175])for(const offset of [0,1.3,2.6])for(const noise of [0,.001]){
  const base=trial(DYNAMIC_TUNING,rate,offset,noise),candidate=trial(FRESHNESS_TUNING,rate,offset,noise);
  rows.push({rate,offset,noise,base,candidate});
  assert.ok(candidate.coverage>=base.coverage-.01);
  assert.ok(candidate.stale<=base.stale);
  assert.ok(candidate.recovered!==null&&candidate.recovered<=6000);
 }
 const sum=(k,f)=>rows.reduce((s,x)=>s+x[k][f],0);
 console.log('V64_FRESHNESS',JSON.stringify({cases:rows.length,baseStale:sum('base','stale'),candidateStale:sum('candidate','stale'),rows}));
 assert.ok(sum('candidate','stale')<sum('base','stale'));
});
test('freshness candidate rejects missing landmarks and sustained negative controls',()=>{
 for(const mode of ['still','unilateral','simultaneous']){
  const m=new AdaptiveCadence(FRESHNESS_TUNING);
  for(let t=0;t<12000;t+=50)assert.equal(m.update(frame(t,145,Infinity,0,.001,mode),t),null);
 }
 const m=new AdaptiveCadence(FRESHNESS_TUNING);
 for(let t=0;t<12000;t+=50)m.update(frame(t,145,Infinity,0),t);
 assert.equal(m.update(null,12000),null);
 assert.equal(m.events.length,0);
});
