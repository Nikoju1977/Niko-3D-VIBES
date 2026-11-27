import {createVision,detect} from './vision-models.js';
let models;
self.onmessage=async({data:m})=>{if(m.type==='init'){try{models=await createVision();self.postMessage({type:'ready'});}catch(e){self.postMessage({type:'error',message:String(e.message||e)});}return;}if(m.type==='frame'){try{const result=detect(models,m.bitmap,m.timestamp);self.postMessage({type:'result',id:m.id,result});}catch(e){self.postMessage({type:'error',id:m.id,message:String(e.message||e)});}finally{m.bitmap.close();}}};
