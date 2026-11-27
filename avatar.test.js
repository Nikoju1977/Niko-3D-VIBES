import {test} from 'node:test';import assert from 'node:assert/strict';import {normalizePose,neutralPose} from './avatar.js';
test('avatar normalizes real landmarks around hips',()=>{let p=neutralPose();let q=normalizePose(p);assert.equal(q.length,33);assert.deepEqual(q[23].map((x,i)=>x+q[24][i]),[0,0,0]);assert.equal(q[1],null);});
test('avatar rejects insufficient or degenerate landmarks',()=>{assert.equal(normalizePose([]),null);let p=neutralPose();p[11]=p[12]=[0,.02,0];assert.equal(normalizePose(p),null);});
