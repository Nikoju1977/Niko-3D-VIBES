// Studio Niko Design — local directional skeletal retargeting, artistic only.
export const AVATAR_VERSION='1.0.0';
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a);return n>1e-8?mul(a,1/n):null;};
const midpoint=(a,b)=>mul(add(a,b),.5);
const validVec=p=>Array.isArray(p)&&p.length===3&&p.every(x=>Number.isFinite(x)&&Math.abs(x)<=100);
export function directionQuaternion(from,to){
 if(!validVec(from)||!validVec(to))return null;
 const a=unit(from),b=unit(to);if(!a||!b)return null;
 const d=Math.max(-1,Math.min(1,dot(a,b)));
 if(d>1-1e-10)return [0,0,0,1];
 if(d< -1+1e-10){const basis=Math.abs(a[0])<.8?[1,0,0]:[0,1,0];return [...unit(cross(a,basis)),0];}
 return unit([...cross(a,b),1+d]);
}
export function rotateVector(q,v){
 const u=q.slice(0,3),t=mul(cross(u,v),2);return add(v,add(mul(t,q[3]),cross(u,t)));
}
const skeleton=[
 ['spine','root','hips','shoulders',.48,[0,1,0]],
 ['head','spine','shoulders',0,.23,[0,1,0]],
 ['leftShoulder','spine','shoulders',11,.19,[1,0,0]],
 ['leftElbow','leftShoulder',11,13,.30,[1,0,0]],
 ['leftWrist','leftElbow',13,15,.26,[1,0,0]],
 ['rightShoulder','spine','shoulders',12,.19,[-1,0,0]],
 ['rightElbow','rightShoulder',12,14,.30,[-1,0,0]],
 ['rightWrist','rightElbow',14,16,.26,[-1,0,0]],
 ['leftHip','root','hips',23,.14,[1,0,0]],
 ['leftKnee','leftHip',23,25,.43,[0,-1,0]],
 ['leftAnkle','leftKnee',25,27,.42,[0,-1,0]],
 ['rightHip','root','hips',24,.14,[-1,0,0]],
 ['rightKnee','rightHip',24,26,.43,[0,-1,0]],
 ['rightAnkle','rightKnee',26,28,.42,[0,-1,0]]
];
function read(p){return p&&[p.x,p.y,p.z,p.visibility].every(Number.isFinite)&&p.visibility>=.8&&p.visibility<=1&&[p.x,p.y,p.z].every(x=>Math.abs(x)<=10)?[p.x,-p.y,-p.z]:null;}
export function retargetAvatar(world){
 if(!Array.isArray(world)||world.length!==33)return null;
 const source=world.map(read);
 if(![11,12,23,24].every(i=>source[i]))return null;
 const shoulders=midpoint(source[11],source[12]),hips=midpoint(source[23],source[24]);
 if(Math.hypot(...sub(shoulders,hips))<.08||Math.hypot(...sub(source[11],source[12]))<.04||Math.hypot(...sub(source[23],source[24]))<.04)return null;
 const get=i=>i==='hips'?hips:i==='shoulders'?shoulders:source[i];
 const joints={root:[0,0,0]},bones=[];
 for(const [name,parent,a,b,length,rest] of skeleton){
  const start=get(a),end=get(b),origin=joints[parent];if(!origin||!start||!end)continue;
  const delta=sub(end,start);if(Math.hypot(...delta)<.02)continue;
  const q=directionQuaternion(rest,delta);if(!q)continue;
  const position=add(origin,mul(rotateVector(q,rest),length));joints[name]=position;
  bones.push({name,parent,length,rotation:q});
 }
 return {schema:'niko-avatar-pose-v1',engine:AVATAR_VERSION,space:'artistic_rig_local',rotationSpace:'global_direction_only_xyzw',calibrated:false,clinicalValidation:false,joints,bones,coverage:bones.length/skeleton.length};
}
export class AvatarTracker{
 constructor(){this.clear();}
 clear(){this.frame=null;this.time=null;}
 update(world,now){if(!Number.isFinite(now)||(this.time!==null&&now<=this.time)){this.clear();return null;}this.frame=retargetAvatar(world);this.time=now;return this.frame;}
 current(now){return this.frame&&Number.isFinite(now)&&now>=this.time&&now-this.time<=500?this.frame:null;}
}
