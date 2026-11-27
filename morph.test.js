import {test} from 'node:test';import assert from 'node:assert/strict';import {parsePrompt,faceShape,faceSignals} from './morph-core.js';
test('French prompt selects ape and cyber color',()=>assert.deepEqual(parsePrompt('Transforme-moi en singe cyberpunk bleu'),{ok:true,kind:'ape',cyber:true,color:'#468bea'}));
test('unsupported and ambiguous prompts are rejected',()=>{assert.equal(parsePrompt('une voiture').ok,false);assert.equal(parsePrompt('chat loup').ok,false);assert.equal(parsePrompt('humain').kind,'human');});
test('face geometry rejects missing landmarks',()=>{assert.throws(()=>faceShape([],1));assert.equal(faceSignals([],1),null);});
test('face signals and shape use actual landmarks',()=>{const p=Array.from({length:468},()=>({x:.5,y:.5,z:0}));p[33]={x:.35,y:.4,z:0};p[263]={x:.65,y:.4,z:0};p[1]={x:.5,y:.5,z:-.05};p[13]={x:.5,y:.54,z:0};p[14]={x:.5,y:.57,z:0};assert.equal(faceShape(p,1).length,468);assert.ok(faceSignals(p,1).jaw>0);});
