import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {writeIntegrity,verifyIntegrity} from './scripts/integrity.mjs';
test('SHA-256 inventory detects changed, missing and additional files',()=>{
 const dir=mkdtempSync(join(tmpdir(),'snd-integrity-'));
 try{
  const path=join(dir,'a.txt');writeFileSync(path,'abc');
  const r=writeIntegrity(dir);assert.equal(r.files[0].sha256,'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.deepEqual(verifyIntegrity(dir),r);
  writeFileSync(path,'changed');assert.throws(()=>verifyIntegrity(dir),/mismatch/);
  writeFileSync(path,'abc');writeFileSync(join(dir,'extra'),'x');assert.throws(()=>verifyIntegrity(dir),/mismatch/);
  rmSync(join(dir,'extra'));rmSync(path);assert.throws(()=>verifyIntegrity(dir),/mismatch/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
