// Studio Niko Design — local artistic motion studio; no clinical measurements.
import {directionQuaternion} from './niko-avatar.js';
export const MORPH_VERSION='1.0.0';
export const PROFILES=Object.freeze({
 human:Object.freeze({label:'Humain',spine:1,head:1,shoulder:1,arm:1,hip:1,leg:1,radius:.045,color:'#c2bbff'}),
 robot:Object.freeze({label:'Robot',spine:1.10,head:1.15,shoulder:1.25,arm:1.05,hip:1.1,leg:1.05,radius:.065,color:'#56e6ce'}),
 creature:Object.freeze({label:'Créature',spine:.85,head:1.25,shoulder:1.35,arm:1.45,hip:.85,leg:.82,radius:.055,color:'#ffbd75'})
});
const names=['spine','head','leftShoulder','leftElbow','leftWrist','rightShoulder','rightElbow','rightWrist','leftHip','leftKnee','leftAnkle','rightHip','rightKnee','rightAnkle'];
const parents=['root','spine','spine','leftShoulder','leftElbow','spine','rightShoulder','rightElbow','root','leftHip','leftKnee','root','rightHip','rightKnee'];
const finiteVec=v=>Array.isArray(v)&&v.length===3&&v.every(x=>Number.isFinite(x)&&Math.abs(x)<=10);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k);
function factor(name,p){return name==='spine'?p.spine:name==='head'?p.head:name.endsWith('Shoulder')?p.shoulder:name.endsWith('Elbow')||name.endsWith('Wrist')?p.arm:name.endsWith('Hip')?p.hip:p.leg;}
export function morphPose(pose,profile='human'){
 if(!Object.hasOwn(PROFILES,profile)||pose?.schema!=='niko-avatar-pose-v1'||!finiteVec(pose.joints?.root)||!Array.isArray(pose.bones)||pose.bones.length>14)return null;
 const p=PROFILES[profile],joints={root:[0,0,0]},bones=[],seen=new Set();
 for(const b of pose.bones){
  const i=names.indexOf(b?.name);
  if(i<0||b.parent!==parents[i]||seen.has(b.name)||!joints[b.parent]||!finiteVec(pose.joints[b.name])||!finiteVec(pose.joints[b.parent]))return null;
  seen.add(b.name);const delta=sub(pose.joints[b.name],pose.joints[b.parent]),len=Math.hypot(...delta);
  if(len<.01||len>2)return null;
  const length=len*factor(b.name,p),v=mul(delta,length/len),q=directionQuaternion([0,1,0],v);if(!q)return null;
  joints[b.name]=add(joints[b.parent],v);bones.push({name:b.name,parent:b.parent,length,rotation:q});
 }
 return {schema:'niko-morph-pose-v1',profile,joints,bones,coverage:bones.length/14,clinicalValidation:false};
}
export class MotionTake{
 constructor(limit=1800){if(!Number.isInteger(limit)||limit<2||limit>1800)throw Error('Invalid capture budget');this.limit=limit;this.clear();}
 clear(){this.frames=[];this.profile=null;this.recording=false;this.reason='idle';this.start=null;this.last=null;}
 begin(profile){if(!Object.hasOwn(PROFILES,profile))throw Error('Unknown morphology');this.clear();this.profile=profile;this.recording=true;this.reason='waiting';}
 stop(reason='stopped'){if(this.recording){this.recording=false;this.reason=reason;}}
 add(pose,t){
  if(!this.recording)return false;
  if(!Number.isFinite(t)||t<0||(this.last!==null&&t<=this.last)){this.stop('invalid_time');return false;}
  if(this.last!==null&&t-this.last>500){this.stop('gap');return false;}
  const frame=morphPose(pose,this.profile);
  if(!frame||frame.bones.length!==14){if(this.frames.length)this.stop('tracking_lost');return false;}
  if(this.last!==null&&t-this.last<66)return false;
  if(this.start===null)this.start=t;
  this.frames.push({t_ms:t-this.start,pose:frame});this.last=t;this.reason='recording';
  if(this.frames.length===this.limit)this.stop('limit');return true;
 }
 expire(now){if(this.recording&&this.last!==null&&Number.isFinite(now)&&now-this.last>500)this.stop('gap');}
 data(){return {schema:'niko-motion-take-v1',engine:MORPH_VERSION,profile:this.profile,clinicalValidation:false,reason:this.reason,frames:this.frames};}
}
// GLB 2.0: visible procedural cylinders animated by translation and quaternion.
// Each segment is a root node, not a skinned mesh. No external URI or executable payload.
export function exportMotionGLB(take){
 if(take?.schema!=='niko-motion-take-v1'||!Object.hasOwn(PROFILES,take.profile)||!Array.isArray(take.frames)||take.frames.length<2||take.frames.length>1800)throw Error('Need 2–1800 complete frames');
 const profile=PROFILES[take.profile],frames=take.frames;let last=-Infinity;
 for(const f of frames){
  if(!Number.isFinite(f?.t_ms)||f.t_ms<0||f.t_ms<=last||(last>=0&&f.t_ms-last>500)||f.pose?.profile!==take.profile||f.pose.bones?.length!==14)throw Error('Invalid frame sequence');
  last=f.t_ms;
  if(!names.every((n,i)=>finiteVec(f.pose.joints?.[n])&&finiteVec(f.pose.joints?.[parents[i]])))throw Error('Invalid joint');
 }
 const times=frames.map(f=>f.t_ms/1000);if(times[0]!==0)throw Error('Invalid start');
 const chunks=[],views=[],accessors=[];let total=0;
 function accessor(array,type,componentType,count,min,max,target){
  const bytes=new Uint8Array(array.buffer,array.byteOffset,array.byteLength),pad=(4-bytes.length%4)%4;
  const view={buffer:0,byteOffset:total,byteLength:bytes.length};if(target)view.target=target;
  const idx=views.push(view)-1;chunks.push(bytes,new Uint8Array(pad));total+=bytes.length+pad;
  const a={bufferView:idx,componentType,count,type};if(min)a.min=min;if(max)a.max=max;return accessors.push(a)-1;
 }
 const v=[],idx=[];const sides=12;
 for(let y of [0,1])for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides;v.push(Math.cos(a),y,Math.sin(a));}
 v.push(0,0,0,0,1,0);
 for(let i=0;i<sides;i++){const j=(i+1)%sides;idx.push(i,i+sides,j,j,i+sides,j+sides,2*sides,i,j,2*sides+1,j+sides,i+sides);}
 const pos=accessor(new Float32Array(v),'VEC3',5126,v.length/3,[-1,0,-1],[1,1,1],34962);
 const indices=accessor(new Uint16Array(idx),'SCALAR',5123,idx.length,undefined,undefined,34963);
 const time=accessor(new Float32Array(times),'SCALAR',5126,times.length,[times[0]],[times.at(-1)]);
 const nodes=[],samplers=[],channels=[];
 for(let i=0;i<names.length;i++){
  const name=names[i],parent=parents[i],translations=[],rotations=[];let length0=null,previous=null;
  for(const f of frames){
   const a=f.pose.joints[parent],delta=sub(f.pose.joints[name],a),len=Math.hypot(...delta);
   if(len<.01||len>3||(length0!==null&&Math.abs(len-length0)>1e-5))throw Error('Inconsistent segment length');
   if(length0===null)length0=len;
   let q=directionQuaternion([0,1,0],delta);if(!q)throw Error('Invalid rotation');
   if(previous&&q.reduce((n,x,k)=>n+x*previous[k],0)<0)q=mul(q,-1);previous=q;
   translations.push(...a);rotations.push(...q);
  }
  nodes.push({name,mesh:0,translation:translations.slice(0,3),rotation:rotations.slice(0,4),scale:[profile.radius,length0,profile.radius]});
  for(const [path,data,type] of [['translation',translations,'VEC3'],['rotation',rotations,'VEC4']]){
   const output=accessor(new Float32Array(data),type,5126,frames.length);
   const sampler=samplers.push({input:time,output,interpolation:'LINEAR'})-1;channels.push({sampler,target:{node:i,path}});
  }
 }
 const rgb=[1,3,5].map(i=>parseInt(profile.color.slice(i,i+2),16)/255);
 const doc={asset:{version:'2.0',generator:'Studio Niko Design / Motion Studio 1.0'},scene:0,scenes:[{nodes:nodes.map((_,i)=>i)}],nodes,meshes:[{primitives:[{attributes:{POSITION:pos},indices,material:0}]}],materials:[{pbrMetallicRoughness:{baseColorFactor:[...rgb,1],metallicFactor:.1,roughnessFactor:.7},doubleSided:true}],animations:[{name:'Niko Motion',samplers,channels}],buffers:[{byteLength:total}],bufferViews:views,accessors,extras:{profile:take.profile,artisticOnly:true,clinicalValidation:false}};
 const json=new TextEncoder().encode(JSON.stringify(doc)),jp=(4-json.length%4)%4,jl=json.length+jp,all=new Uint8Array(12+8+jl+8+total),dv=new DataView(all.buffer);
 dv.setUint32(0,0x46546c67,true);dv.setUint32(4,2,true);dv.setUint32(8,all.length,true);dv.setUint32(12,jl,true);dv.setUint32(16,0x4e4f534a,true);all.set(json,20);all.fill(32,20+json.length,20+jl);
 let off=20+jl;dv.setUint32(off,total,true);dv.setUint32(off+4,0x004e4942,true);off+=8;for(const c of chunks){all.set(c,off);off+=c.length;}
 return all;
}
