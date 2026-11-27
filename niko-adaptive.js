// Studio Niko Design — V6 adaptive bilateral phase estimator; not a medical device.
import {angle,clamp} from './niko-native.js';
export const ADAPTIVE_VERSION='6.0.0';
const quantile=(values,q)=>{const a=[...values].sort((x,y)=>x-y),i=(a.length-1)*q,j=Math.floor(i);return a[j]+(a[Math.min(j+1,a.length-1)]-a[j])*(i-j);};
const median=a=>quantile(a,.5);
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
 constructor({tau=65,fraction=.22}={}){if(![45,65].includes(tau)||![.18,.22].includes(fraction))throw Error('Unsupported experimental tuning');this.tau=tau;this.fraction=fraction;this.reset();}
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
  if(t-this.start<6000||this.events.length<5){this.reason='warmup';return null;}
  if(t-this.events.at(-1).t>1200){this.reason='stale';return null;}
  const halves=this.events.slice(1).map((v,i)=>v.t-this.events[i].t);
  const periods=this.events.slice(2).map((v,i)=>v.phase===this.events[i].phase?(v.t-this.events[i].t)/2:NaN);
  if(periods.some(x=>!Number.isFinite(x))){this.reason='irregular';return null;}
  const m=median(periods),mad=median(periods.map(x=>Math.abs(x-m)));
  if(mad/m>.12||periods.some(x=>Math.abs(x-m)>.25*m)||halves.some(x=>x<.55*m||x>1.45*m)){this.reason='irregular';return null;}
  const spm=60000/m;if(spm<50||spm>240){this.reason='out_of_range';return null;}
  this.reason='accepted';return spm;
 }
}
