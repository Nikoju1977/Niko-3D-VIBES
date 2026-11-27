// Studio Niko Design — experimental measurement quality gate, not a medical device.
export const QUALITY_VERSION='niko-measurement-gate-1';
export const POLICY=Object.freeze({visibility:.8,minSegmentPx:20,maxGapMs:500,minCadenceWindowMs:6000,minSamples:3});
function pointOK(p){return p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&Number.isFinite(p.visibility)&&p.visibility>=POLICY.visibility&&p.visibility<=1;}
function assessSide(p,indices,w,h){
 if(!indices.every(i=>pointOK(p[i])))return {accepted:false,reason:'LANDMARK_INSUFFICIENT'};
 const [a,b,c]=indices.map(i=>p[i]);
 const distance=(x,y)=>Math.hypot((x.x-y.x)*w,(x.y-y.y)*h);
 if(Math.min(distance(a,b),distance(b,c))<POLICY.minSegmentPx)return {accepted:false,reason:'SEGMENT_TOO_SMALL'};
 return {accepted:true,reason:null};
}
export function assessPose(p,w,h){
 if(!Array.isArray(p)||p.length!==33||!Number.isFinite(w)||!Number.isFinite(h)||w<1||h<1||w>16384||h>16384){
  const side={accepted:false,reason:'FRAME_INVALID'};
  return {left:{...side},right:{...side}};
 }
 return {left:assessSide(p,[23,25,27],w,h),right:assessSide(p,[24,26,28],w,h)};
}
export class MeasurementGate{
 constructor(){this.reset();}
 reset(){this.last=null;this.start=null;this.count=0;}
 update(p,t,w,h){
  const sides=assessPose(p,w,h);
  const timeOK=Number.isFinite(t)&&t>=0;
  if(!timeOK){this.reset();return {left:{accepted:false,reason:'TIMESTAMP_INVALID'},right:{accepted:false,reason:'TIMESTAMP_INVALID'},cadence:false,continuity:false,reason:'TIMESTAMP_INVALID'};}
  const continuity=this.last!==null&&t>this.last&&t-this.last<=POLICY.maxGapMs;
  if(this.last!==null&&t<=this.last){this.reset();return {left:{accepted:false,reason:'TIMESTAMP_NON_MONOTONIC'},right:{accepted:false,reason:'TIMESTAMP_NON_MONOTONIC'},cadence:false,continuity:false,reason:'TIMESTAMP_NON_MONOTONIC'};}
  this.last=t;
  if(!sides.left.accepted||!sides.right.accepted){this.start=null;this.count=0;return {...sides,cadence:false,continuity:false,reason:'BILATERAL_SIGNAL_INSUFFICIENT'};}
  if(!continuity||this.start===null){this.start=t;this.count=1;}else this.count++;
  const cadence=this.count>=POLICY.minSamples&&t-this.start>=POLICY.minCadenceWindowMs;
  return {...sides,cadence,continuity,reason:cadence?null:'CADENCE_WARMUP'};
 }
}
