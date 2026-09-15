import test from 'node:test';
import assert from 'node:assert/strict';
import {letters,vertices,check,shadow,projectionColumns,compressForward,viewAngles} from '../site/walks.js';
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
test('display columns are the actual linear map in each dimension',()=>{
  for(const d of [3,4,5,6]){
    const columns=projectionColumns(d);
    assert.equal(columns.length,d);
    for(let j=0;j<d;j++)assert.deepEqual(shadow(Array.from({length:d},(_,k)=>Number(j===k))),columns[j]);
  }
  assert.deepEqual(projectionColumns(5)[4],[0,0,0]);
});
test('forward compression is display-only, linear and reversible',()=>{
  const points=[[0,0,0],[2,3,4],[10,0,0]],copy=structuredClone(points);
  const compressed=compressForward(points,10);
  assert.ok(Math.abs(compressed[1][0]-.2)<1e-12);
  assert.deepEqual(compressed[1].slice(1),[3,4]);
  assert.deepEqual(compressed.at(-1),[1,0,0]);
  assert.deepEqual(points,copy);
  assert.deepEqual(compressForward(points,1),points);
  assert.deepEqual(compressForward([[1,2,3]],16),[[1,2,3]]);
  assert.deepEqual(compressForward([],16),[]);
  assert.throws(()=>compressForward(points,0));
  assert.throws(()=>compressForward(points,NaN));
  for(const d of [3,4,5,6]){
    const original=vertices(d,256),snapshot=structuredClone(original),projected=original.map(shadow);
    const transformed=compressForward(projected,16);
    const axis=projected.at(-1),length=Math.hypot(...axis),u=axis.map(x=>x/length);
    transformed.forEach((p,i)=>{
      const along=p.reduce((sum,x,k)=>sum+x*u[k],0);
      p.forEach((x,k)=>assert.ok(Math.abs(x+15*along*u[k]-projected[i][k])<1e-9));
    });
    assert.deepEqual(original,snapshot);
  }
});
test('automatic camera frames a planar cloud face-on and stays finite',()=>{
  const points=[[0,0,0],[4,0,0],[0,3,0],[4,3,0]];
  const {yaw,pitch}=viewAngles(points);
  assert.ok(Number.isFinite(yaw));
  assert.ok(Math.abs(Math.sin(pitch))>.99);
  assert.deepEqual(viewAngles([]),{yaw:0,pitch:0});
  const single=viewAngles([[1,2,3]]);
  assert.ok(Number.isFinite(single.yaw)&&Number.isFinite(single.pitch));
  for(const d of [3,4,5,6]){
    const view=viewAngles(compressForward(vertices(d,256).map(shadow),d===6?1:16));
    assert.ok(Number.isFinite(view.yaw)&&Number.isFinite(view.pitch));
  }
});
test('displayed block-proportion criterion matches exact collinearity',()=>{
  const cases=[vertices(3,12),vertices(4,12),vertices(6,12),
    [[0,0,0],[1,0,0],[1,1,0],[2,1,0],[2,2,0],[3,2,0],[3,3,0]]];
  let unequalSpacingWitness=false;
  for(const points of cases)for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++)for(let c=b+1;c<points.length;c++){
    const first=points[b].map((x,j)=>x-points[a][j]);
    const second=points[c].map((x,j)=>x-points[b][j]);
    const proportionEqual=first.every((x,j)=>x*(c-b)===second[j]*(b-a));
    const axis=first.findIndex(x=>x!==0);
    const collinear=first.every((x,j)=>x*second[axis]===second[j]*first[axis]);
    assert.equal(proportionEqual,collinear);
    if(proportionEqual&&b-a!==c-b)unequalSpacingWitness=true;
  }
  assert.equal(unequalSpacingWitness,true);
});
test('return displacement columns and input bounds',()=>{
  assert.deepEqual(shadow([1,0,0,0]),[1,0,1]);
  assert.deepEqual(shadow([0,0,0,1]),[-2,0,4]);
  assert.throws(()=>letters(2,10));assert.throws(()=>letters(6,-1));assert.throws(()=>check(6,513));
});
