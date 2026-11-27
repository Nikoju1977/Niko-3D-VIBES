import {test} from 'node:test';import assert from 'node:assert/strict';import {normalizePose,neutralPose,PoseDisplayFilter} from './avatar.js';
test('avatar normalizes real landmarks around hips',()=>{let p=neutralPose();let q=normalizePose(p);assert.equal(q.length,33);assert.deepEqual(q[23].map((x,i)=>x+q[24][i]),[0,0,0]);assert.equal(q[1],null);});
test('avatar rejects insufficient or degenerate landmarks',()=>{assert.equal(normalizePose([]),null);let p=neutralPose();p[11]=p[12]=[0,.02,0];assert.equal(normalizePose(p),null);});


test('adaptive display filter smooths but never invents missing joints or stale samples',()=>{
 const f=new PoseDisplayFilter(),pose=x=>Array.from({length:33},()=>[x,0,0]);
 assert.equal(f.update(pose(0),0)[0][0],0);
 const q=f.update(pose(.1),33);assert.ok(q[0][0]>0&&q[0][0]<.1);
 q[0][0]=42;const bad=pose(.2);bad[0]=null;
 assert.equal(f.update(bad,66)[0],null);
 assert.equal(f.update(pose(.4),99)[0][0],.4);
 assert.equal(f.update(pose(1),900)[0][0],1);
 assert.equal(f.update(pose(.5),899)[0][0],.5);
 assert.equal(f.update(null,999),null);
});
