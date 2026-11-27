// Studio Niko Design: finite experimental QAOA comparison, not clinical optimization.
import {AdaptiveCadence} from '../niko-adaptive.js';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
export const OPTIONS=Object.freeze(Array.from({length:4},(_,i)=>Object.freeze({state:i.toString(2).padStart(2,'0'),tau:i&1?45:65,fraction:i&2?.18:.22})));
function rng(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
const p=(x,y)=>({x,y,visibility:1});
function frame(t,{rate=120,amp=12,bias=0,noise=.006,mode='alternate'},r){
 const a=Array.from({length:33},()=>p(.5,.5));
 for(let k=0;k<2;k++){
  const phi=t*2*Math.PI*rate/120000,sign=mode==='simultaneous'?1:k?-1:1;
  const swing=mode==='still'||(mode==='unilateral'&&k)?0:amp*sign*Math.sin(phi);
  const theta=(35+(k?0:bias)+swing)*Math.PI/180,x=k?.64:.32,j=()=>noise*(r()-.5);
  a[23+k]=p(x+j(),.23+j());a[25+k]=p(x+j(),.48+j());a[27+k]=p(x+.22*Math.sin(theta)+j(),.48+.22*Math.cos(theta)+j());
 }
 return a;
}
export function evaluate(option,holdout=false){
 const cases=holdout?[{rate:105,amp:9,bias:11,noise:.009},{rate:165,amp:15,bias:-9,noise:.012},{rate:135,amp:20,noise:.01}]:[{rate:90,amp:8,bias:18,noise:.006},{rate:120,amp:12,bias:8,noise:.012},{rate:180,amp:20,noise:.01}];
 for(const mode of ['still','unilateral','simultaneous'])cases.push({mode,noise:holdout?.009:.005});
 let eligible=0,accepted=0,negative=0,falseAccepted=0,abs=0;
 for(const [i,c] of cases.entries()){
  const m=new AdaptiveCadence(option),r=rng((holdout?9811:441)+i*127);
  for(let t=0,j=0;t<24000;t+=[37,53,71,91][j++%4]){
   const v=m.update(frame(t,c,r),t);
   if(t<10000)continue;
   if(c.mode){negative++;if(v!==null)falseAccepted++;}
   else{eligible++;if(v!==null){accepted++;abs+=Math.abs(v-c.rate);}}
  }
 }
 const coverage=accepted/eligible,mae=accepted?abs/accepted:null,falseRate=falseAccepted/negative;
 // Predeclared score: error plus penalties for abstention and false positives.
 return {coverage,mae,falseRate,cost:(mae??30)+10*(1-coverage)+100*falseRate};
}
export function buildCircuit(costs){
 if(!Array.isArray(costs)||costs.length!==4||costs.some(x=>!Number.isFinite(x)||x<0))throw Error('Four finite nonnegative costs required');
 const min=Math.min(...costs),span=Math.max(...costs)-min,normalized=costs.map(x=>span?(x-min)/span:0);
 // Diagonal Hamiltonian with exact Walsh coefficients for two binary variables.
 const [a,b,c,d]=normalized,h0=(a-b+c-d)/4,h1=(a+b-c-d)/4,j=(a-b-c+d)/4;
 const gamma=Math.PI/2,beta=Math.PI/4;
 const gates=[{gate:'H',target:0},{gate:'H',target:1},{gate:'RZ',target:0,theta:2*gamma*h0},{gate:'RZ',target:1,theta:2*gamma*h1},{gate:'CX',control:0,target:1},{gate:'RZ',target:1,theta:2*gamma*j},{gate:'CX',control:0,target:1},{gate:'RX',target:0,theta:2*beta},{gate:'RX',target:1,theta:2*beta}];
 return {qubits:2,gates};
}
export function experiment(){
 const results=OPTIONS.map(option=>({...option,train:evaluate(option),holdout:evaluate(option,true)}));
 const optimum=[...results].sort((a,b)=>a.train.cost-b.train.cost||a.state.localeCompare(b.state))[0];
 return {schema:'niko-quantum-tuning-v1',clinicalValidation:false,hardwareExecuted:false,method:'classical exhaustive four-state baseline; fixed-angle p=1 QAOA candidate',results,optimum:optimum.state,circuit:buildCircuit(results.map(x=>x.train.cost))};
}
export function decodeCounts(report,counts){
 if(!counts||typeof counts!=='object'||Array.isArray(counts)||Object.entries(counts).some(([k,v])=>!/^[01]{2}$/.test(k)||!Number.isSafeInteger(v)||v<0))throw Error('Invalid 2-qubit counts');
 const shots=Object.values(counts).reduce((a,b)=>a+b,0);if(shots<1||shots>1024)throw Error('Invalid shot count');
 const rows=report.results.filter(x=>counts[x.state]>0).sort((a,b)=>a.train.cost-b.train.cost||a.state.localeCompare(b.state));
 const best=rows[0];return {shots,bestSampled:best.state,classicalOptimum:report.optimum,matchedExactOptimum:best.train.cost===report.results.find(x=>x.state===report.optimum).train.cost,train:best.train,holdout:best.holdout,hardwareProvenance:'counts alone do not prove physical execution'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=experiment(),args=process.argv.slice(2);
 if(!args.length)console.log(JSON.stringify(report,null,2));
 else if(args.length===1&&args[0]==='--circuit')console.log(JSON.stringify(report.circuit,null,2));
 else if(args.length===2&&args[0]==='--decode'){const raw=JSON.parse(readFileSync(args[1],'utf8'));console.log(JSON.stringify(decodeCounts(report,raw.counts),null,2));}
 else throw Error('Usage: node scripts/quantum-tune.mjs [--circuit | --decode result.json]');
}
