import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,allMoves,applyAction} from '../src/game/rules.js';
import {chooseBotMove} from '../src/game/bot.js';
test('bot chooses legal replies without mutating the match',()=>{
 let state=initialState();
 for(let i=0;i<6;i++){
  const before=JSON.stringify(state),move=chooseBotMove(state);
  assert.ok(allMoves(state).some(m=>m.from===move.from&&m.to===move.to));
  assert.equal(JSON.stringify(state),before);state=applyAction(state,{type:'MOVE',...move});
 }
});
test('bot does not play in a finished match',()=>{
 assert.equal(chooseBotMove({...initialState(),result:{winner:null,reason:'Draw'}}),null);
});
