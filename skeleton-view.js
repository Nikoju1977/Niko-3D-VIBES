// Studio Niko Design — display transforms only; captured coordinates remain untouched.
const valid=p=>Array.isArray(p)&&p.length>=2&&p.slice(0,3).every(Number.isFinite);
export function videoContain(sw,sh,w,h,mirror=false){
 if(![sw,sh,w,h].every(x=>Number.isFinite(x)&&x>0))return null;
 const s=Math.min(w/sw,h/sh),dw=sw*s,dh=sh*s,x=(w-dw)/2,y=(h-dh)/2;
 return {x,y,width:dw,height:dh,point:p=>[x+(mirror?1-p.x:p.x)*dw,y+p.y*dh]};
}
export function projectSkeleton(p,angle=0,perspective=false){
 if(!valid(p))return null;const [x,y,z=0]=p,co=Math.cos(angle),si=Math.sin(angle),depth=-x*si+z*co,k=perspective?3/(3+Math.max(-1.5,Math.min(1.5,depth))):1;
 return [(x*co+z*si)*k,-y*k,depth];
}
export function fitSkeleton(points,w,h,{padding=36,top=padding,bottom=padding,maxScale=900,previous=null}={}){
 const p=points.filter(valid);if(!p.length||![w,h,padding,top,bottom,maxScale].every(Number.isFinite)||w<=2*padding||h<=top+bottom||maxScale<=0)return null;
 const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const cx=(minX+maxX)/2,cy=(minY+maxY)/2,tx=w/2,ty=(top+h-bottom)/2;
 const ideal=Math.min(maxScale,(w-2*padding)/Math.max(.001,maxX-minX),(h-top-bottom)/Math.max(.001,maxY-minY));
 // Shrink immediately to avoid clipping; expand gradually to avoid zoom pumping.
 const scale=Number.isFinite(previous)&&previous>0?Math.min(ideal,previous+(ideal-previous)*.18):ideal;
 return {scale,center:[tx,ty],point:q=>valid(q)?[tx+(q[0]-cx)*scale,ty+(q[1]-cy)*scale,q[2]??0]:null};
}
