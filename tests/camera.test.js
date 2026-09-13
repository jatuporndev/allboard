import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {CameraRig} from '../src/scene/camera.js';
function rig(keys=[]){return Object.assign(Object.create(CameraRig.prototype),{keys:new Set(keys),speed:5,camera:{position:new THREE.Vector3(10,12,10)},orbit:{enabled:true,target:new THREE.Vector3(0,.3,0)}});}
test('orbit WASD pans relative to view while preserving height and orbit offset',()=>{
 const r=rig(['KeyW']),before=r.camera.position.clone().sub(r.orbit.target);r.panOrbit(.2);
 assert.ok(r.orbit.target.x<0&&r.orbit.target.z<0);assert.equal(r.camera.position.y,12);
 assert.ok(r.camera.position.clone().sub(r.orbit.target).distanceTo(before)<1e-10);
});
test('diagonal orbit movement is normalized and Shift increases speed',()=>{
 const a=rig(['KeyW']),b=rig(['KeyW','KeyD']),c=rig(['KeyW','ShiftLeft']);
 const origin=a.orbit.target.clone();for(const r of [a,b,c])r.panOrbit(.2);
 assert.ok(Math.abs(a.orbit.target.distanceTo(origin)-b.orbit.target.distanceTo(origin))<1e-10);
 assert.ok(Math.abs(c.orbit.target.distanceTo(origin)-2.5)<1e-10);
});
test('disabled orbit and home transitions ignore movement; target stays within bounds',()=>{
 const r=rig(['KeyD']);r.orbit.enabled=false;r.panOrbit(1);assert.equal(r.orbit.target.x,0);
 r.orbit.enabled=true;r.transition={};r.panOrbit(1);assert.equal(r.orbit.target.x,0);
 r.transition=null;r.panOrbit(100);assert.ok(Math.abs(r.orbit.target.x)<=9&&Math.abs(r.orbit.target.z)<=12);
});

test('home remembers the online seat for desktop, mobile and recentering',()=>{
 const r=rig();r.camera=new THREE.PerspectiveCamera(43,1.5,.1,100);r.orbit.update=()=>{};
 for(const aspect of [1.5,390/844]) {
  r.camera.aspect=aspect;r.setSide('white');r.home({immediate:true});const white=r.camera.position.clone();
  r.setSide('black');r.home({immediate:true});
  assert.equal(r.camera.position.z,-white.z);assert.equal(r.camera.position.x,-white.x);assert.equal(r.camera.position.y,white.y);
  r.camera.position.set(3,4,5);r.home();assert(r.transition.end.z<0);
 }
 r.setSide('white');r.home({immediate:true});assert(r.camera.position.z>0);
});
