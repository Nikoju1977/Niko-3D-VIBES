// Studio Niko Design — V6 adaptive bilateral phase estimator; not a medical device.
import {angle,clamp} from './niko-native.js';
export const ADAPTIVE_VERSION='6.4.0';
export const PRECISION_TUNING=Object.freeze({tau:65,fraction:.18,estimator:'phase_regression'});
export const SELECTED_TUNING=Object.freeze({tau:65,fraction:.18});
// V6.3 selection; retained V6.2 mode remains available for comparative tests.
export const DYNAMIC_TUNING=Object.freeze({tau:65,fraction:.18,estimator:'adaptive_regression'});
// V6.4 application candidate; earlier tuning retained for reproducibility.
export const FRESHNESS_TUNING=Object.freeze({tau:65,fraction:.18,estimator:'freshness_regression'});
const quantile=(values,q)=>{const a=[...values].sort((x,y)=>x-y),i=(a.length-1)*q,j=Math.floor(i);return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(i-j);};
const median=a=>quantile(a,.5);
// Fit a common time slope with separate intercepts for left and right phases.
// Retain the prior consistency gate; this estimator never rescues rejected data.
export function phaseRegression(events,fallback){
 if(!Array.isArray(events)||events.length<8||events.length>32||!Number.isFinite(fallback)||fallback<=0)return fallback;
 const groups=[[],[]];
 for(let i=0;i<events.length;i++){
  const e=events[i];if(!e||!Number.isFinite(e.t)||![1,-1].includes(e.phase)||(i&&(e.t<=events[i-1].t||e.phase===events[i-1].phase)))return fallback;
  groups[e.phase===1?0:1].push({x:i,y:e.t-events[0].t});
 }
 let numerator=0,denominator=0;
 for(const g of groups){
  if(g.length<4)return fallback;
  const mx=g.reduce((s,v)=>s+v.x,0)/g.length,my=g.reduce((s,v)=>s+v.y,0)/g.length;
  for(const v of g){numerator+=(v.x-mx)*(v.y-my);denominator+=(v.x-mx)**2;}
 }
 const period=numerator/denominator;
 // Reject a disagreement beyond 8%; revert to the pre-existing robust median.
 return Number.isFinite(period)&&Math.abs(period-fallback)<=.08*fallback?period:fallback;
}
// Compare recent and older same-phase intervals before evaluating the full window.
// A consistent new rhythm can reset only the history, never bypass landmark checks.
export function recentRhythmShift(events){
 if(!Array.isArray(events)||events.length<9||events.length>32)return false;
 const periods=[];
 for(let i=2;i<events.length;i++){
  const p=events[i],q=events[i-1],r=events[i-2];
  if(!p||!q||!r||![1,-1].includes(p.phase)||p.phase!==r.phase||p.phase===q.phase||!Number.isFinite(p.t)||!Number.isFinite(q.t)||!Number.isFinite(r.t)||p.t<=q.t||q.t<=r.t)return false;
  periods.push((p.t-r.t)/2);
 }
 const recent=periods.slice(-3),older=periods.slice(0,-3);
 const now=median(recent),before=median(older);
 if(!Number.isFinite(now)||!Number.isFinite(before)||now<250||now>1200||before<=0)return false;
 if(recent.some(x=>Math.abs(x-now)>.08*now))return false;
 return Math.abs(now-before)>.15*before;
}
function characterize(window,fraction){
 const n=window.length;if(n<16)return null;
 const l=window.map(x=>x.l),r=window.map(x=>x.r),d=window.map(x=>x.d);
 const mean=a=>a.reduce((s,v)=>s+v,0)/n,ml=mean(l),mr=mean(r);
 let ll=0,rr=0,lr=0;for(let i=0;i<n;i++){const a=l[i]-ml,b=r[i]-mr;ll+=a*a;rr+=b*b;lr+=a*b;}
 const corr=ll>0&&rr>0?lr/Math.sqrt(ll*rr):0;
 const al=quantile(l,.9)-quantile(l,.1),ar=quantile(r,.9)-quantile(r,.1);
 const lo=quantile(d,.1),hi=quantile(d,.9),range=hi-lo;
 if(al<8||ar<8||Math.max(al,ar)>4*Math.min(al,ar)||corr>-.65||range<16)return null;
 return {center:(hi+lo)/2,threshold:clamp(range*fraction,4,16),correlation:corr};
}
export class AdaptiveCadence{
 constructor({tau=65,fraction=.22,estimator='median'}={}){if(![45,65].includes(tau)||![.18,.22].includes(fraction)||!['median','phase_regression','adaptive_regression','freshness_regression'].includes(estimator))throw Error('Unsupported experimental tuning');this.tau=tau;this.fraction=fraction;this.estimator=estimator;this.reset();}
 reset(){this.total=0;this.clearWindow();}
 clearWindow(){this.last=null;this.start=null;this.filtered=null;this.window=[];this.events=[];this.phase=0;this.anchor=null;this.stats=null;this.lastAnalysis=-Infinity;this.reason='warmup';}
 update(p,t,aspect=1){
  if(!Array.isArray(p)||p.length!==33||!Number.isFinite(t)||t<0||!Number.isFinite(aspect)){this.clearWindow();this.reason='invalid_frame';return null;}
  const l=angle(p[23],p[25],p[27],aspect),r=angle(p[24],p[26],p[28],aspect);
  if(l===null||r===null){this.clearWindow();this.reason='invalid_landmarks';return null;}
  if(this.last!==null&&(t<=this.last||t-this.last>160)){this.clearWindow();this.reason='sampling_gap';return null;}
  const prev=this.filtered,dt=this.last===null?0:t-this.last;this.last=t;if(this.start===null)this.start=t;
  this.filtered=prev===null?l-r:prev+(1-Math.exp(-dt/this.tau))*(l-r-prev);
  this.window.push({t,l,r,d:this.filtered});
  while(this.window.length&&(this.window[0].t<t-3200||this.window.length>256))this.window.shift();
  if(t-this.lastAnalysis>=250){
   this.lastAnalysis=t;
   const next=this.window.length>=16&&t-this.window[0].t>=1800?characterize(this.window,this.fraction):null;
   if(!next){this.phase=0;this.anchor=null;this.events=[];}
   this.stats=next;
  }
  if(!this.stats){this.reason='insufficient_alternation';return null;}
  const {center,threshold}=this.stats,phase=this.filtered>=center+threshold?1:this.filtered<=center-threshold?-1:0;
  if(phase&&phase!==this.phase){
   const boundary=center+phase*threshold,crossing=prev===null||Math.abs(this.filtered-prev)<1e-8?t:t-dt+dt*clamp((boundary-prev)/(this.filtered-prev),0,1);
   if(this.phase){
    const interval=crossing-this.anchor;
    if(interval>=250&&interval<=1200){this.events.push({t:crossing,phase});this.total++;}
    else this.events=[];
   }
   this.phase=phase;this.anchor=crossing;
  }
  this.events=this.events.filter(v=>v.t>=t-8000).slice(-32);
  if(['adaptive_regression','freshness_regression'].includes(this.estimator)&&recentRhythmShift(this.events))this.events=this.events.slice(-5);
  if(t-this.start<6000||this.events.length<5){this.reason='warmup';return null;}
  if(t-this.events.at(-1).t>1200){this.reason='stale';return null;}
  const halves=this.events.slice(1).map((v,i)=>v.t-this.events[i].t);
  const periods=this.events.slice(2).map((v,i)=>v.phase===this.events[i].phase?(v.t-this.events[i].t)/2:NaN);
  if(periods.some(x=>!Number.isFinite(x))){this.reason='irregular';return null;}
  const m=median(periods),mad=median(periods.map(x=>Math.abs(x-m)));
  // Expire the last estimate relative to observed cycle length, not only a fixed timeout.
  // A new estimate requires five fresh events after expiry; no old timestamps are reused.
  if(this.estimator==='freshness_regression'&&t-this.events.at(-1).t>clamp(1.65*m,380,1200)){
   this.events=[];this.phase=0;this.anchor=null;this.reason='rhythm_expired';return null;
  }
  if(mad/m>.12||periods.some(x=>Math.abs(x-m)>.25*m)||halves.some(x=>x<.55*m||x>1.45*m)){this.reason='irregular';return null;}
  const period=this.estimator==='median'?m:phaseRegression(this.events,m);
  const spm=60000/period;if(spm<50||spm>240){this.reason='out_of_range';return null;}
  this.reason='accepted';return spm;
 }
}
