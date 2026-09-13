import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/.test(m.text()))errors.push(m.text());});
 // Exercise real application handlers with local room snapshots; never write to Firebase.
 await page.route('**/src/online.js*',route=>route.fulfill({contentType:'text/javascript',body:`
 export const online={uid:'tester',code:'local-test',connected:true,pending:false};window.__online=online;
 export const command=async()=>({}),leave=async()=>{},connect=async()=>{},saveCharacter=async()=>{},browse=()=>()=>{},watchRoom=()=>{},cleanup=()=>{};`}));
 await page.route('**/src/main.js*',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\nwindow.__game={world,rig,store,animator,receiveRoom,playMove};'});});
 await page.goto('http://127.0.0.1:5173');await page.waitForFunction(()=>window.__game);
 await page.click('#start-menu');await page.click('#local-game');await page.waitForTimeout(1400);
 const performance=await page.evaluate(async()=>{
  const w=__game.world;
  async function sample(){let last=performance.now(),times=[];for(let i=0;i<60;i++){await new Promise(requestAnimationFrame);const now=performance.now();times.push(now-last);last=now;}times.sort((a,b)=>a-b);return{drawCalls:w.renderer.info.render.calls,triangles:w.renderer.info.render.triangles,medianMs:times[30],p95Ms:times[57]};}
  const prepare=w.armyBatches.prepare;w.armyBatches.prepare=()=>{};w.armyBatches.batches.forEach(b=>b.mesh.visible=false);
  const separate=await sample();w.armyBatches.prepare=prepare;w.armyBatches.batches.forEach(b=>b.mesh.visible=true);
  const batched=await sample();return{separate,batched};
 });
 assert(performance.batched.drawCalls<performance.separate.drawCalls);
 await page.screenshot({path:'artifacts/models-board.png'});
 for(const side of ['black','white']) {
  await page.evaluate(async side=>{const {initialState}=await import('/src/game/rules.js');const room={players:{tester:{color:side,name:'Player'},rival:{color:side==='black'?'white':'black',name:'Rival'}},revision:0,status:'playing',state:JSON.stringify(initialState())};__online.code=side;__online.room=room;__game.receiveRoom(room);},side);
  assert.equal(await page.evaluate(()=>Math.sign(__game.rig.camera.position.z)),side==='black'?-1:1);
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1400);
  assert.equal(await page.evaluate(()=>Math.sign(__game.rig.camera.position.z)),side==='black'?-1:1);
  await page.evaluate(()=>{__game.rig.camera.position.set(3,4,5);__game.rig.home({immediate:true});});
  assert.equal(await page.evaluate(()=>Math.sign(__game.rig.camera.position.z)),side==='black'?-1:1);
  await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(1400);
 }
 // A real legal mating move arrives as the next online revision.
 await page.evaluate(async()=>{
  const {initialState,applyAction,positionKey}=await import('/src/game/rules.js');
  const state=initialState();state.board=Array(64).fill(null);
  [[0,'K','black'],[18,'K','white'],[9,'R','white'],[16,'R','white']].forEach(([i,type,color],id)=>state.board[i]={id,type,color});
  state.positions=[positionKey(state)];__online.code='mate';
  const room={...__online.room,revision:0,state:JSON.stringify(state)};__online.room=room;__game.receiveRoom(room);
  window.__mated=applyAction(state,{type:'MOVE',from:16,to:8});
  __online.room={...room,revision:1,state:JSON.stringify(__mated)};__game.receiveRoom(__online.room);
 });
 await page.waitForFunction(()=>__game.animator.active?.phase==='surrender',{},{timeout:15000});
 await page.waitForFunction(()=>!__game.animator.busy,{},{timeout:10000});
 assert(await page.evaluate(()=>[...__game.world.pieces.values()].find(p=>p.userData.piece.color==='black').userData.surrendered));
 await page.evaluate(()=>__game.receiveRoom(__online.room));assert.equal(await page.evaluate(()=>__game.animator.busy),false);
 await page.screenshot({path:'artifacts/checkmate-board.png'});
 assert.deepEqual(errors,[]);
 await writeFile('artifacts/visual-performance.json',JSON.stringify(performance,null,2)+'\n');
 console.log(JSON.stringify(performance,null,2));console.log('Passed: both online camera seats, mobile resize, recenter, mating move, crown surrender, duplicate snapshot and WebGL rendering.');
} finally {await browser.close();}
