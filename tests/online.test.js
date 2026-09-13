import test from 'node:test';
import assert from 'node:assert/strict';
import {updateRoom,character} from '../src/game/room.js';
const profile={name:'Ivory',emblem:'crown'};
const room=()=>({host:'a',visibility:'private',status:'waiting',expiresAt:Date.now()+60000,revision:0,players:{a:{...profile,color:'white',ready:false}}});
function start(){let r=updateRoom(room(),'b','join',{character:profile});r=updateRoom(r,'a','ready',{ready:true});r=updateRoom(r,'b','ready',{ready:true});return updateRoom(r,'a','start');}
test('room admission, character validation, host and readiness checks',()=>{
  assert.throws(()=>character({name:' ',emblem:'crown'}));assert.throws(()=>character({name:'name',emblem:'invalid'}));
  let r=room();assert.throws(()=>updateRoom(r,'outsider','ready',{ready:true}));assert.throws(()=>updateRoom(r,'a','start'));
  r=updateRoom(r,'b','join',{character:profile});assert.equal(Object.keys(r.players).length,2);assert.throws(()=>updateRoom(r,'c','join',{character:profile}));
  assert.throws(()=>updateRoom(r,'b','start'));assert.equal(room().players.a.ready,false);
});
test('server rejects out-of-turn, illegal, stale and unauthorized actions',()=>{
  const r=start(),action={type:'MOVE',from:20,to:28};
  assert.throws(()=>updateRoom(r,'b','action',{revision:0,action}));
  assert.throws(()=>updateRoom(r,'c','action',{revision:0,action}));
  assert.throws(()=>updateRoom(r,'a','action',{revision:0,action:{...action,to:60}}));
  assert.throws(()=>updateRoom(r,'a','action',{revision:0,action:{...action,from:-1}}));
  const next=updateRoom(r,'a','action',{revision:0,action});assert.equal(next.revision,1);assert.equal(JSON.parse(next.state).turn,'black');
  assert.throws(()=>updateRoom(next,'b','action',{revision:0,action:{type:'MOVE',from:43,to:35}}));
  const black=updateRoom(next,'b','action',{revision:1,action:{type:'MOVE',from:43,to:35}});assert.equal(JSON.parse(black.state).ply,2);
});
test('leaving closes a hosted lobby or resigns an active game; reconnect is idempotent',()=>{
  assert.equal(updateRoom(room(),'a','leave').status,'closed');const r=start();assert.deepEqual(updateRoom(r,'b','join'),r);
  const end=updateRoom(r,'b','leave');assert.equal(end.status,'finished');assert.equal(JSON.parse(end.state).result.winner,'white');
  assert.throws(()=>updateRoom({...room(),expiresAt:0},'b','join',{character:profile}));
});
