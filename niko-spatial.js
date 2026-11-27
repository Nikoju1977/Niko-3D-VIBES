// Studio Niko Design — local WebGL2 point renderer; visualization, not measurement.
export const SPATIAL_VERSION='1.0.0';
const bounded=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
export function packGeometry(parts){
 if(!Array.isArray(parts)||parts.length<1||parts.length>32)throw Error('Invalid geometry parts');
 let count=0;for(const p of parts){
  if(!p||!Array.isArray(p.points)||!Array.isArray(p.dir)||p.dir.length!==3||!p.dir.every(v=>bounded(v,-100,100))||!/^#[0-9a-f]{6}$/i.test(p.color)||!p.points.length)throw Error('Invalid geometry');
  count+=p.points.length;if(count>30000)throw Error('Geometry budget exceeded');
 }
 const out=new Float32Array(count*9);let i=0;
 for(const p of parts){
  const rgb=[1,3,5].map(k=>parseInt(p.color.slice(k,k+2),16)/255);
  for(const v of p.points){if(!Array.isArray(v)||v.length!==3||!v.every(x=>bounded(x,-100,100)))throw Error('Invalid vertex');out.set([...v,...p.dir,...rgb],i);i+=9;}
 }
 return out;
}
export function cameraParameters({yaw,pitch,zoom,explode},width,height){
 if(![yaw,pitch].every(Number.isFinite)||!bounded(zoom,.5,2)||!bounded(explode,0,1)||!bounded(width,1,4096)||!bounded(height,1,4096))throw Error('Invalid camera');
 const scale=Math.min(width,height)*.15*zoom;
 return {rotation:[Math.cos(yaw),Math.sin(yaw),Math.cos(pitch),Math.sin(pitch)],scale:[12*scale/width,12*scale/height],explode,near:.1,far:100};
}
const VERT='#version 300 es\nprecision highp float;layout(location=0) in vec3 position;layout(location=1) in vec3 offset;layout(location=2) in vec3 color;uniform vec4 rotation;uniform vec2 scale;uniform float explode;uniform float pixelRatio;out vec3 tint;void main(){vec3 p=position+offset*explode;float a=p.x*rotation.x+p.z*rotation.y;float b=-p.x*rotation.y+p.z*rotation.x;float q=p.y*rotation.z-b*rotation.w;float k=p.y*rotation.w+b*rotation.z;float w=6.0+k;float z=(100.1/99.9)*w-20.0/99.9;gl_Position=vec4(a*scale.x,q*scale.y,z,w);gl_PointSize=clamp(2.4-k*.2,1.0,5.0)*pixelRatio;tint=color;}';
const FRAG='#version 300 es\nprecision mediump float;in vec3 tint;out vec4 fragment;void main(){vec2 p=gl_PointCoord-vec2(.5);if(dot(p,p)>.25)discard;fragment=vec4(tint,1.0);}';
function shader(gl,type,source){const s=gl.createShader(type);if(!s)throw Error('Shader allocation');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Shader compilation');}return s;}
export class SpatialRenderer{
 constructor(canvas){
  this.canvas=canvas;this.gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:true,powerPreference:'low-power'});
  if(!this.gl)throw Error('WebGL2 unavailable');
  this.lost=false;this.parts=null;this.count=0;this.program=null;this.buffer=null;this.vao=null;
  this.onLoss=e=>{e.preventDefault();this.lost=true;};canvas.addEventListener('webglcontextlost',this.onLoss);
  const gl=this.gl;let v,f;
  try{
   v=shader(gl,gl.VERTEX_SHADER,VERT);f=shader(gl,gl.FRAGMENT_SHADER,FRAG);
   this.program=gl.createProgram();if(!this.program)throw Error('Program allocation');
   gl.attachShader(this.program,v);gl.attachShader(this.program,f);gl.linkProgram(this.program);
   if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw Error('Program link');
   this.buffer=gl.createBuffer();this.vao=gl.createVertexArray();if(!this.buffer||!this.vao)throw Error('Buffer allocation');
   gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
   for(let i=0;i<3;i++){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,36,i*12);}
   gl.bindVertexArray(null);this.uniforms=Object.fromEntries(['rotation','scale','explode','pixelRatio'].map(k=>[k,gl.getUniformLocation(this.program,k)]));
  }catch(e){this.dispose();throw e;}finally{if(v)gl.deleteShader(v);if(f)gl.deleteShader(f);}
 }
 draw(parts,state,width,height,dpr=1){
  const gl=this.gl;if(this.lost||gl.isContextLost())return false;
  const w=Math.min(4096,Math.max(1,Math.round(width))),h=Math.min(4096,Math.max(1,Math.round(height)));
  const ratio=Math.min(2,Math.max(1,Number.isFinite(dpr)?dpr:1),4096/w,4096/h,Math.sqrt(4e6/(w*h)));
  const bw=Math.max(1,Math.round(w*ratio)),bh=Math.max(1,Math.round(h*ratio));
  if(this.canvas.width!==bw||this.canvas.height!==bh){this.canvas.width=bw;this.canvas.height=bh;}
  const camera=cameraParameters(state,w,h);
  if(this.parts!==parts){const packed=packGeometry(parts);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,packed,gl.STATIC_DRAW);this.count=packed.length/9;this.parts=parts;}
  gl.viewport(0,0,bw,bh);gl.clearColor(8/255,14/255,22/255,1);gl.clearDepth(1);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.uniform4fv(this.uniforms.rotation,camera.rotation);gl.uniform2fv(this.uniforms.scale,camera.scale);gl.uniform1f(this.uniforms.explode,camera.explode);gl.uniform1f(this.uniforms.pixelRatio,ratio);gl.drawArrays(gl.POINTS,0,this.count);gl.bindVertexArray(null);
  return gl.getError()===gl.NO_ERROR&&!gl.isContextLost();
 }
 dispose(){const gl=this.gl;this.canvas.removeEventListener('webglcontextlost',this.onLoss);if(!gl.isContextLost()){if(this.vao)gl.deleteVertexArray(this.vao);if(this.buffer)gl.deleteBuffer(this.buffer);if(this.program)gl.deleteProgram(this.program);}this.lost=true;}
}
