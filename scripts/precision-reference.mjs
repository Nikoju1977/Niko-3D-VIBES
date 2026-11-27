// Local reference evaluation. No network, no identifiers in the accepted schema.
import {open} from 'node:fs/promises';
import {evaluateReference,uncertaintyBudget,assessCalibration,reportDigest} from '../niko-precision-core.js';
try{
 if(process.argv.length!==3)throw Error('Usage: npm run precision:reference -- protocol.json');
 const f=await open(process.argv[2],'r');
 try{const st=await f.stat();if(!st.isFile()||st.size>16*1024*1024)throw Error('Invalid input size');const buffer=Buffer.alloc(st.size+1);const {bytesRead}=await f.read(buffer,0,buffer.length,0);if(bytesRead!==st.size)throw Error('Input changed or incomplete');const doc=JSON.parse(buffer.subarray(0,bytesRead).toString('utf8'));const report=doc.schema==='niko-uncertainty-v1'?uncertaintyBudget(doc):doc.schema==='niko-calibration-v1'?assessCalibration(doc):evaluateReference(doc);console.log(JSON.stringify({report,integrity:await reportDigest(report)},null,2));if(report.meetsSpecifiedCriteria===false||report.after?.meetsSpecifiedCriteria===false)process.exitCode=2;}finally{await f.close();}
}catch(e){console.error('Evaluation refused:',e.message);process.exitCode=1;}
