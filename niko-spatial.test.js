import {test} from 'node:test';
import assert from 'node:assert/strict';
import {packGeometry,cameraParameters} from './niko-spatial.js';
const part={color:'#ff8000',dir:[1,0,0],points:[[0,1,2],[3,4,5]]};
test('positions, explosion vectors and RGB are interleaved without mutating geometry',()=>{const p=packGeometry([part]);assert.equal(p.length,18);assert.deepEqual([...p.slice(0,6)],[0,1,2,1,0,0]);assert.equal(p[6],1);assert.ok(Math.abs(p[7]-128/255)<1e-7);assert.equal(p[8],0);assert.deepEqual(part.points[0],[0,1,2]);});
test('reject malformed, non-finite and oversize geometry',()=>{assert.throws(()=>packGeometry([{...part,points:[[NaN,0,0]]}]));assert.throws(()=>packGeometry([{...part,color:'url(x)'}]));assert.throws(()=>packGeometry([{...part,points:Array(30001).fill([0,0,0])}]));});
test('camera projection preserves aspect and bounds inputs',()=>{const c=cameraParameters({yaw:0,pitch:0,zoom:1,explode:0},800,400);assert.deepEqual(c.rotation,[1,0,1,0]);assert.equal(c.scale[1],2*c.scale[0]);assert.throws(()=>cameraParameters({yaw:NaN,pitch:0,zoom:1,explode:0},800,400));});
