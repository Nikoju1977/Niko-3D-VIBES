// Studio Niko Design — local, bounded expression takes. No images or audio stored.
import {CHANNELS,mapTargets} from './expression-rig.js';
export const LIMIT_MS=60000, LIMIT_FRAMES=1800;
const sources=['manual','camera'];
const clean=v=>Object.fromEntries(CHANNELS.map(k=>[k,Math.min(1,Math.max(0,Number.isFinite(v?.[k])?v[k]:0))]));
export function validateTake(d){
 if(d?.schema!=='vibes-expression-take-v1'||!sources.includes(d.source)||!Array.isArray(d.frames)||d.frames.length<2||d.frames.length>LIMIT_FRAMES)throw Error('Prise incompatible ou vide');
 let last=-1;const frames=d.frames.map((f,i)=>{if(!Number.isFinite(f?.t_ms)||f.t_ms<0||f.t_ms>LIMIT_MS||f.t_ms<=last||(i===0&&f.t_ms!==0)||!CHANNELS.every(k=>Number.isFinite(f.values?.[k])&&f.values[k]>=0&&f.values[k]<=1))throw Error('Image de prise invalide');last=f.t_ms;return {t_ms:f.t_ms,values:clean(f.values)};});
 return {schema:'vibes-expression-take-v1',source:d.source,frames};
}
export function sampleTake(frames,t){if(!frames?.length||!Number.isFinite(t))return null;if(t<=0)return {...frames[0].values};if(t>=frames.at(-1).t_ms)return {...frames.at(-1).values};let lo=0,hi=frames.length-1;while(hi-lo>1){let m=(lo+hi)>>1;if(frames[m].t_ms<=t)lo=m;else hi=m;}const a=frames[lo],b=frames[hi],u=(t-a.t_ms)/(b.t_ms-a.t_ms);return Object.fromEntries(CHANNELS.map(k=>[k,a.values[k]+(b.values[k]-a.values[k])*u]));}
export class FaceTake{
 constructor(){this.clear();}
 clear(){this.frames=[];this.source=null;this.recording=false;this.start=null;this.last=null;this.reason='idle';}
 begin(source,now){if(!sources.includes(source)||!Number.isFinite(now))throw Error('Source invalide');this.clear();this.source=source;this.recording=true;this.start=now;this.reason='waiting';}
 add(values,now,source){if(!this.recording||source!==this.source||!Number.isFinite(now)||!values)return false;if(now<this.start||(this.last!==null&&now<=this.last))return false;if(now-this.start>LIMIT_MS){this.stop('limit');return false;}if(this.last!==null&&now-this.last<33)return false;if(source==='camera'&&this.last!==null&&now-this.last>600){this.stop('gap');return false;}const t=this.frames.length?now-this.first:0;if(!this.frames.length)this.first=now;this.frames.push({t_ms:t,values:clean(values)});this.last=now;this.reason='recording';if(this.frames.length>=LIMIT_FRAMES)this.stop('limit');return true;}
 expire(now){if(this.recording&&(now-this.start>LIMIT_MS||(this.source==='camera'&&this.last!==null&&now-this.last>600)))this.stop(now-this.start>LIMIT_MS?'limit':'gap');}
 stop(reason='stopped'){if(this.recording){this.recording=false;this.reason=reason;}}
 data(){return validateTake({schema:'vibes-expression-take-v1',source:this.source,frames:this.frames});}
 load(d){const v=validateTake(d);this.clear();this.source=v.source;this.frames=v.frames;this.reason='imported';}
}
export function expressionClip(T,root,take){const d=validateTake(take),byMesh=new Map();for(const b of mapTargets(root)){if(!b.mesh)continue;let list=byMesh.get(b.mesh);if(!list)byMesh.set(b.mesh,list=[]);list.push(b);}const times=d.frames.map(f=>f.t_ms/1000),tracks=[];for(const [mesh,bindings] of byMesh){const values=[];for(const f of d.frames){const row=Array.from(mesh.morphTargetInfluences);for(const b of bindings)row[b.index]=f.values[b.channel];values.push(...row);}tracks.push(new T.NumberKeyframeTrack(mesh.uuid+'.morphTargetInfluences',times,values));}if(!tracks.length)throw Error('Aucune cible GLB compatible');return new T.AnimationClip('Vibes Expressions',times.at(-1),tracks);}
