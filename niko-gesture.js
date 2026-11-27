// Studio Niko Design — newly authored experimental motion processing module.
// Generic vector geometry and time-based low-pass filtering. See PROVENANCE.md.
const bound=(x,a,b)=>Math.max(a,Math.min(b,x));
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z??0);
const vector=(a,b,aspect)=>[(a.x-b.x)*aspect,a.y-b.y,((a.z??0)-(b.z??0))*aspect];
function length(a){return Math.hypot(...a);}
function joint(a,b,c,aspect){
 const u=vector(a,b,aspect),v=vector(c,b,aspect),n=length(u)*length(v);
 if(n<1e-10)return null;
 return Math.acos(bound(u.reduce((sum,x,i)=>sum+x*v[i],0)/n,-1,1))*180/Math.PI;
}
export function handFeatures(p,aspect=1){
 if(!Array.isArray(p)||p.length!==21||!p.every(valid)||!Number.isFinite(aspect)||aspect<=0)return null;
 const scale=length(vector(p[0],p[9],aspect));if(scale<.012)return null;
 const flex=[];
 for(const start of [5,9,13,17]){
  const a=joint(p[start],p[start+1],p[start+2],aspect),b=joint(p[start+1],p[start+2],p[start+3],aspect);
  if(a===null||b===null)return null;
  flex.push(bound((Math.min(a,b)-75)/90,0,1));
 }
 const pinchDistance=length(vector(p[4],p[8],aspect))/scale;
 const pinch=bound((.45-pinchDistance)/.25,0,1);
 return {flex,pinch,open:flex.reduce((a,b)=>a+b,0)/4,x:1-p[9].x,y:p[9].y,roll:Math.atan2((p[0].x-p[9].x)*aspect,p[0].y-p[9].y)};
}
export function classify(f){
 if(!f)return {gesture:'NONE',confidence:0};
 const [i,m,r,l]=f.flex,ext=x=>x>=.72,curl=x=>x<=.32;
 const certainty=x=>Math.abs(x-.5)*2;
 const min=(...v)=>Math.min(...v);
 if(f.pinch>=.75&&i>.32)return {gesture:'PINCH',confidence:min(f.pinch,Math.max(.5,i))};
 if(f.flex.every(ext))return {gesture:'OPEN',confidence:min(...f.flex.map(certainty))};
 if(f.flex.every(curl))return {gesture:'FIST',confidence:min(...f.flex.map(certainty))};
 if(ext(i)&&ext(m)&&curl(r)&&curl(l))return {gesture:'PEACE',confidence:min(...f.flex.map(certainty))};
 if(ext(i)&&curl(m)&&curl(r)&&curl(l))return {gesture:'POINT',confidence:min(...f.flex.map(certainty))};
 return {gesture:'NONE',confidence:0};
}
// Continuous-time filter; faster motion reduces smoothing, no extrapolated samples.
export class AdaptiveAxis{
 constructor(){this.reset();}
 reset(){this.value=null;this.raw=null;this.time=null;}
 update(value,t){
  if(!Number.isFinite(value)||!Number.isFinite(t)){this.reset();return null;}
  if(this.time===null||t<=this.time||t-this.time>350){this.value=this.raw=value;this.time=t;return value;}
  const dt=(t-this.time)/1000,speed=Math.abs(value-this.raw)/dt;
  const tau=.085/(1+Math.min(speed,8)*1.5),alpha=1-Math.exp(-dt/tau);
  this.value+=alpha*(value-this.value);this.raw=value;this.time=t;return this.value;
 }
}
export class NikoGesture{
 constructor(){this.x=new AdaptiveAxis();this.y=new AdaptiveAxis();this.open=new AdaptiveAxis();this.reset();}
 reset(){this.x.reset();this.y.reset();this.open.reset();this.stable='NONE';this.candidate='NONE';this.since=0;this.last=null;}
 update(points,t,aspect=1){
  const f=handFeatures(points,aspect);
  if(!f||!Number.isFinite(t)){this.reset();return null;}
  if(this.last!==null&&(t<=this.last||t-this.last>350))this.reset();
  this.last=t;
  const c=classify(f),kind=c.confidence>=.44?c.gesture:'NONE';
  if(kind!==this.candidate){this.candidate=kind;this.since=t;}
  // Fail closed on ambiguous or changed pose; require uninterrupted evidence for activation.
  if(kind!==this.stable)this.stable='NONE';
  const dwell={PINCH:70,OPEN:120,FIST:120,POINT:120,PEACE:300,NONE:0}[kind];
  if(t-this.since>=dwell)this.stable=kind;
  return {gesture:this.stable,confidence:this.stable==='NONE'?0:c.confidence,pinch:this.stable==='PINCH',open:this.open.update(f.open,t),x:this.x.update(f.x,t),y:this.y.update(f.y,t),roll:f.roll};
 }
}
