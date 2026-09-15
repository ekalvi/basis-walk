import test from 'node:test';
import assert from 'node:assert/strict';
import {letters,vertices,check,shadow} from '../site/walks.js';
test('exact prefix scans and basis invariants',()=>{
  for(const d of [3,4,5,6]){
    assert.equal(check(d,128).status,'finite-prefix-pass');
    assert.equal(check(d,128).pairs,128*129/2);
    vertices(d,512).forEach((p,j)=>assert.equal(p.reduce((a,b)=>a+b,0),j));
  }
});
test('5D is exactly the 4D embedding',()=>{
  assert.deepEqual(vertices(5,512),vertices(4,512).map(p=>[...p,0]));
});
test('return displacement columns and input bounds',()=>{
  assert.deepEqual(shadow([1,0,0,0]),[1,0,1]);
  assert.deepEqual(shadow([0,0,0,1]),[-2,0,4]);
  assert.throws(()=>letters(2,10));assert.throws(()=>letters(6,-1));assert.throws(()=>check(6,513));
});
