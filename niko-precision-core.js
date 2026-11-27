// Studio Niko Design — local, reusable experimental precision core.
export const PRECISION_VERSION='1.0.0';
const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const metrics=Object.freeze({angle_deg:[0,180],cadence_spm:[0,300]});
// One independent paired observation per row; null estimate = rejected.
export function evaluateReference(doc){
 if(!exact(doc,['schema','metric','protocol','criteria','pairs'])||doc.schema!=='niko-reference-v1'||!Object.hasOwn(metrics,doc.metric))throw Error('Schema or metric invalid');
 if(typeof doc.protocol!=='string'||!/^[A-Za-z0-9._-]{1,80}$/.test(doc.protocol))throw Error('Protocol identifier invalid');
 const c=doc.criteria,[lo,hi]=metrics[doc.metric];
 if(!exact(c,['minPairs','minCoverage','maxMAE','maxAbsBias','maxRMSE'])||!Number.isInteger(c.minPairs)||!finite(c.minPairs,2,100000)||!finite(c.minCoverage,0.01,1)||!['maxMAE','maxAbsBias','maxRMSE'].every(k=>finite(c[k],0,hi-lo)))throw Error('Criteria invalid');
 if(!Array.isArray(doc.pairs)||doc.pairs.length<2||doc.pairs.length>100000)throw Error('Sample count invalid');
 let n=0,mean=0,m2=0,absolute=0,squares=0;
 for(const p of doc.pairs){
  if(!exact(p,['reference','estimate'])||!finite(p.reference,lo,hi)||(p.estimate!==null&&!finite(p.estimate,lo,hi)))throw Error('Invalid paired measurement');
  if(p.estimate===null)continue;
  const e=p.estimate-p.reference;n++;const delta=e-mean;mean+=delta/n;m2+=delta*(e-mean);absolute+=Math.abs(e);squares+=e*e;
 }
 const coverage=n/doc.pairs.length,mae=n?absolute/n:null,rmse=n?Math.sqrt(squares/n):null,bias=n?mean:null,sd=n>1?Math.sqrt(Math.max(0,m2/(n-1))):null;
 const limits=sd===null?null:[mean-1.96*sd,mean+1.96*sd];
 const checks={sampleCount:n>=c.minPairs,coverage:coverage>=c.minCoverage,mae:mae!==null&&mae<=c.maxMAE,bias:bias!==null&&Math.abs(bias)<=c.maxAbsBias,rmse:rmse!==null&&rmse<=c.maxRMSE};
 return {schema:'niko-reference-report-v1',engine:PRECISION_VERSION,metric:doc.metric,protocol:doc.protocol,criteria:{...c},total:doc.pairs.length,accepted:n,rejected:doc.pairs.length-n,coverage,bias,mae,rmse,sd,agreement95:limits,checks,meetsSpecifiedCriteria:Object.values(checks).every(Boolean),clinicalValidation:false};
}
const enc=new TextEncoder(),dec=new TextDecoder('utf-8',{fatal:true});
const LIMIT=32*1024*1024,ITER=600000;
const toHex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
function fromHex(s,bytes){if(typeof s!=='string'||s.length!==bytes*2||!/^[0-9a-f]+$/.test(s))throw Error('Invalid encrypted envelope');return Uint8Array.from(s.match(/../g),x=>parseInt(x,16));}
function passwordOK(password){if(typeof password!=='string'||password.length<14||password.length>256)throw Error('Passphrase: 14 à 256 caractères');}
function cryptoAPI(){if(!globalThis.crypto?.subtle||!globalThis.crypto?.getRandomValues)throw Error('Web Crypto indisponible');return globalThis.crypto;}
async function keyFor(password,salt,usage){
 passwordOK(password);const api=cryptoAPI(),raw=enc.encode(password);
 try{const material=await api.subtle.importKey('raw',raw,'PBKDF2',false,['deriveKey']);return await api.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITER,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,[usage]);}finally{raw.fill(0);}
}
const aad=enc.encode('niko-encrypted-session-v1|PBKDF2-SHA256|600000|AES-256-GCM');
export async function encryptSession(text,password){
 passwordOK(password);if(typeof text!=='string'||text.length>LIMIT)throw Error('Session trop volumineuse');
 const api=cryptoAPI(),plain=enc.encode(text);if(plain.length>LIMIT){plain.fill(0);throw Error('Session trop volumineuse');}
 const salt=api.getRandomValues(new Uint8Array(16)),iv=api.getRandomValues(new Uint8Array(12));
 try{const key=await keyFor(password,salt,'encrypt');const bytes=new Uint8Array(await api.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,plain));
 return {schema:'niko-encrypted-session-v1',kdf:'PBKDF2-SHA256',iterations:ITER,cipher:'AES-256-GCM',salt:toHex(salt),iv:toHex(iv),ciphertext:toHex(bytes)};}finally{plain.fill(0);}
}
export async function decryptSession(doc,password){
 passwordOK(password);
 if(!exact(doc,['schema','kdf','iterations','cipher','salt','iv','ciphertext'])||doc.schema!=='niko-encrypted-session-v1'||doc.kdf!=='PBKDF2-SHA256'||doc.iterations!==ITER||doc.cipher!=='AES-256-GCM'||typeof doc.ciphertext!=='string'||doc.ciphertext.length<32||doc.ciphertext.length>(LIMIT+16)*2||doc.ciphertext.length%2)throw Error('Invalid encrypted envelope');
 const salt=fromHex(doc.salt,16),iv=fromHex(doc.iv,12),cipher=fromHex(doc.ciphertext,doc.ciphertext.length/2);
 const key=await keyFor(password,salt,'decrypt');
 const plain=new Uint8Array(await cryptoAPI().subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,cipher));
 try{return dec.decode(plain);}finally{plain.fill(0);}
}
