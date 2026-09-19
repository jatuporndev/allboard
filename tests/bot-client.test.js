import test from 'node:test';
import assert from 'node:assert/strict';
import {BotClient} from '../src/game/bot-client.js';

function fixture(){
 const workers=[],results=[],errors=[];
 const client=new BotClient(()=>{
  const worker={terminated:false,postMessage(data){this.data=data;},terminate(){this.terminated=true;}};
  workers.push(worker);return worker;
 });
 const request=(state,difficulty)=>client.request(state,r=>results.push(r),()=>errors.push(true),difficulty);
 return {client,workers,results,errors,request};
}
test('cancel and replacement terminate searches and ignore stale replies',()=>{
 const f=fixture();f.request({ply:1});const old=f.workers[0];
 f.client.cancel();assert.equal(old.terminated,true);
 old.onmessage({data:{analysis:{move:{from:1,to:2}}}});assert.equal(f.results.length,0);
 f.request({ply:3});const replaced=f.workers[1];f.request({ply:5});
 assert.equal(replaced.terminated,true);
 replaced.onerror();assert.equal(f.errors.length,0);
 replaced.onmessage({data:{analysis:{move:{from:1,to:2}}}});assert.equal(f.results.length,0);
 const active=f.workers[2];assert.deepEqual(active.data,{state:{ply:5},difficulty:'casual'});
 active.onmessage({data:{analysis:{move:{from:3,to:4},depth:4}}});
 assert.equal(active.terminated,true);assert.equal(f.client.worker,null);
 assert.deepEqual(f.results,[{move:{from:3,to:4},depth:4}]);
});
test('selected difficulty follows each request, including after cancellation',()=>{
 const f=fixture();f.request({ply:1},'devil');
 assert.equal(f.workers[0].data.difficulty,'devil');
 f.client.cancel();f.request({ply:1},'devil');
 assert.equal(f.workers[1].data.difficulty,'devil');
 f.request({ply:1},'casual');
 assert.equal(f.workers[2].data.difficulty,'casual');
 assert.equal(f.workers[1].terminated,true);
});
test('worker startup and search errors release resources and allow retry',()=>{
 const f=fixture();
 f.request({});f.workers[0].onerror();
 assert.equal(f.workers[0].terminated,true);assert.equal(f.client.worker,null);
 f.request({});f.workers[1].onmessage({data:{error:'failed'}});
 assert.equal(f.workers[1].terminated,true);assert.equal(f.errors.length,2);
 let errors=0;
 new BotClient(()=>{throw Error('Worker unavailable');}).request({},()=>assert.fail(),()=>errors++);
 assert.equal(errors,1);
});
