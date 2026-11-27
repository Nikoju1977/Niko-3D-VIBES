// Studio Niko Design — V5 experimental native motion runtime.
// General vector geometry and bilateral knee-phase crossings; non-clinical.
import {NikoGesture} from './niko-gesture.js';
export const NATIVE_VERSION='5.0.0';
export {NikoGesture as Gesture};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Connections describe the third-party MediaPipe landmark convention.
export const HAND=Object.freeze([[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]]);
export const POSE=Object.freeze([[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[27,29],[29,31],[24,26],[26,28],[28,30],[30,32]]);
const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1&&Number.isFinite(p.visibility)&&p.visibility>=.8&&p.visibility<=1;
export function angle(a,b,c,aspect=1){
 if(![a,b,c].every(valid)||!Number.isFinite(aspect)||aspect<.05||aspect>20)return null;
 const ux=(a.x-b.x)*aspect,uy=a.y-b.y,vx=(c.x-b.x)*aspect,vy=c.y-b.y;
 if(Math.hypot(ux,uy)<1e-6||Math.hypot(vx,vy)<1e-6)return null;
 return Math.atan2(Math.abs(ux*vy-uy*vx),ux*vx+uy*vy)*180/Math.PI;
}
const median=values=>{const a=[...values].sort((x,y)=>x-y),i=Math.floor(a.length/2);return a.length%2?a[i]:(a[i-1]+a[i])/2;};
export class Cadence{
 constructor(){this.reset();}
 reset(){this.total=0;this.clearWindow();}
 clearWindow(){this.last=null;this.start=null;this.phase=0;this.anchor=null;this.events=[];this.filtered=null;}
 update(p,t,aspect=1){
  if(!Array.isArray(p)||p.length!==33||!Number.isFinite(t)||t<0||!Number.isFinite(aspect)){this.clearWindow();return null;}
  const l=angle(p[23],p[25],p[27],aspect),r=angle(p[24],p[26],p[28],aspect);
  if(l===null||r===null){this.clearWindow();return null;}
  if(this.last!==null&&(t<=this.last||t-this.last>500)){this.clearWindow();return null;}
  const d=l-r,dt=this.last===null?0:t-this.last;this.last=t;if(this.start===null)this.start=t;
  this.filtered=this.filtered===null?d:this.filtered+(1-Math.exp(-dt/65))*(d-this.filtered);
  const phase=this.filtered>=12?1:this.filtered<=-12?-1:0;
  if(phase&&phase!==this.phase){
   if(this.phase){
    const interval=t-this.anchor;
    if(interval>=250&&interval<=1200){this.events.push(t);this.total++;}
    else this.events=[];
   }
   this.phase=phase;this.anchor=t;
  }
  this.events=this.events.filter(v=>v>=t-8000).slice(-32);
  if(t-this.start<6000||this.events.length<5||t-this.events.at(-1)>1200)return null;
  const intervals=this.events.slice(1).map((v,i)=>v-this.events[i]),m=median(intervals),mad=median(intervals.map(x=>Math.abs(x-m)));
  if(mad/m>.15||intervals.some(x=>Math.abs(x-m)>.30*m))return null;
  const spm=60000/m;return spm>=50&&spm<=240?spm:null;
 }
}
// UI compatibility commands only: virtual robot, no physical actuation.
export function robotAction(g){
 switch(g){case 'OPEN':return 'SCAN';case 'FIST':return 'POMPES';case 'POINT':return 'COURSE';case 'PEACE':return 'DÉPLOIEMENT';case 'PINCH':return 'COMPILE';default:return 'REPOS';}
}
