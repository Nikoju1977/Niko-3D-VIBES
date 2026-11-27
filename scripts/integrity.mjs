// Studio Niko Design — local integrity evidence, not a signature or ownership certificate.
import {createHash} from 'node:crypto';
import {readdirSync,readFileSync,writeFileSync,lstatSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const NAME='INTEGRITY.json';
function files(root){
 const out=[];
 function walk(dir,prefix=''){
  for(const name of readdirSync(dir).sort()){
   const path=join(dir,name),rel=prefix+name,s=lstatSync(path);
   if(s.isSymbolicLink())throw Error('Symlink refused: '+rel);
   if(s.isDirectory())walk(path,rel+'/');
   else if(s.isFile()){if(rel!==NAME)out.push(rel);}
   else throw Error('Unsupported file: '+rel);
  }
 }
 walk(root);return out.sort();
}
export function inventory(root){
 return {schema:'snd-integrity-v1',algorithm:'SHA-256',notice:'Integrity only; no signature, timestamp or ownership proof',files:files(root).map(path=>{
  const data=readFileSync(join(root,path));return {path,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')};
 })};
}
export function writeIntegrity(root){const report=inventory(root);writeFileSync(join(root,NAME),JSON.stringify(report,null,2)+'\n');return report;}
export function verifyIntegrity(root){
 const stored=JSON.parse(readFileSync(join(root,NAME),'utf8')),actual=inventory(root);
 if(JSON.stringify(stored)!==JSON.stringify(actual))throw Error('Integrity mismatch');
 return actual;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const report=verifyIntegrity(resolve(process.argv[2]??'public-build'));
 console.log('Integrity verified: '+report.files.length+' SHA-256 entries');
}
