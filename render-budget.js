// Adaptive paint budget — measures actual CPU submission time, not GPU completion.
export class RenderBudget {
 constructor(){this.reset();}
 reset(){this.cost=0;this.samples=0;this.interval=32;}
 next(mode){const floor=mode==='eco'?66:mode==='fluid'?16:32;return Math.min(125,Math.max(floor,this.interval));}
 observe(ms,mode){if(!Number.isFinite(ms)||ms<0)return;this.cost=this.samples?this.cost*.85+Math.min(ms,250)*.15:Math.min(ms,250);this.samples++;const floor=mode==='eco'?66:mode==='fluid'?16:32;const target=Math.max(floor,Math.min(125,Math.ceil(this.cost*2.5)));this.interval=target>this.interval?target:Math.max(target,this.interval-1);}
}
export class FreshSignal{
 constructor(limit=500){this.limit=limit;this.reset();}
 reset(){this.last=null;this.expired=false;}
 accept(t){if(!Number.isFinite(t)||(this.last!==null&&t<=this.last))return;this.last=t;this.expired=false;}
 expire(t){if(this.last===null||this.expired||!Number.isFinite(t)||t-this.last<=this.limit)return false;this.expired=true;return true;}
}
