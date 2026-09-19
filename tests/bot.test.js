import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,allMoves,applyAction,positionKey,inCheck} from '../src/game/rules.js';
import {chooseBotMove,analyzeBotMove} from '../src/game/bot.js';
import {getBotDifficulty} from '../src/game/bot-difficulty.js';
test('bot chooses legal replies without mutating the match',()=>{
 let state=initialState();
 for(let i=0;i<6;i++){
  const before=JSON.stringify(state),move=chooseBotMove(state,{timeMs:10000,maxNodes:3000});
  assert.ok(allMoves(state).some(m=>m.from===move.from&&m.to===move.to));
  assert.equal(JSON.stringify(state),before);state=applyAction(state,{type:'MOVE',...move});
 }
});
test('bot does not play in a finished match',()=>{
 assert.equal(chooseBotMove({...initialState(),result:{winner:null,reason:'Draw'}}),null);
});

const searchOptions={timeMs:10000,maxDepth:3,maxNodes:50000};
function position(entries,turn='white'){
 const s={...initialState(),board:Array(64).fill(null),turn};
 for(const [i,type,color] of entries)s.board[i]={id:i,type,color};
 s.positions=[positionKey(s)];return s;
}
const mateEntries=[[5,'K','black'],[14,'R','white'],[16,'K','white'],[24,'P','black'],[36,'R','white']];
test('Casual preserves existing budgets and Devil enables deeper search',()=>{
 const casual=getBotDifficulty('casual'),devil=getBotDifficulty('devil');
 assert.deepEqual(casual.options,{timeMs:1800,maxDepth:6,maxNodes:150000,quiescenceDepth:6});
 assert.ok(devil.options.timeMs>casual.options.timeMs);
 assert.ok(devil.options.maxDepth>casual.options.maxDepth);
 assert.ok(devil.options.maxNodes>casual.options.maxNodes);
 assert.ok(devil.options.quiescenceDepth>casual.options.quiescenceDepth);
 assert.equal(devil.options.useOrderingHeuristics,true);
 assert.equal(getBotDifficulty('unknown'),casual);
 assert.equal(getBotDifficulty('__proto__'),casual);
});
test('Devil move ordering preserves tactical outcomes and does not mutate positions',()=>{
 for(const entries of [mateEntries,[[0,'K','white'],[63,'K','black'],[24,'R','white'],[32,'P','black'],[40,'R','black']]]){
  const state=position(entries),before=JSON.stringify(state);
  const casual=analyzeBotMove(state,searchOptions);
  const devil=analyzeBotMove(state,{...searchOptions,useOrderingHeuristics:true});
  assert.equal(devil.depth,casual.depth);assert.equal(devil.score,casual.score);
  assert.ok(allMoves(state).some(m=>m.from===devil.move.from&&m.to===devil.move.to));
  assert.equal(JSON.stringify(state),before);
 }
});
test('finds a forced mate in two for either color, beyond the old two-ply horizon',()=>{
 for(const color of ['white','black']){
  const entries=color==='white'?mateEntries:mateEntries.map(([i,t,c])=>[63-i,t,c==='white'?'black':'white']);
  const state=position(entries,color),analysis=analyzeBotMove(state,searchOptions);
  assert.equal(analysis.score,99997);assert.equal(analysis.depth,3);
  const next=applyAction(state,{type:'MOVE',...analysis.move});
  assert.equal(next.result,null);
  const replies=allMoves(next);assert.ok(replies.length);
  for(const reply of replies){
   const response=applyAction(next,{type:'MOVE',...reply});
   assert.ok(allMoves(response).some(m=>applyAction(response,{type:'MOVE',...m}).result?.winner===color));
  }
 }
});
test('capture search rejects a poisoned pawn even at nominal depth one',()=>{
 const state=position([[0,'K','white'],[63,'K','black'],[24,'R','white'],[32,'P','black'],[40,'R','black']]);
 const analysis=analyzeBotMove(state,{...searchOptions,maxDepth:1});
 assert.equal(analysis.depth,1);
 assert.notDeepEqual(analysis.move,{from:24,to:32});
});
test('takes a rook with a pawn and correctly promotes to Bia Ngai',()=>{
 const state=position([[0,'K','white'],[63,'K','black'],[32,'P','white'],[41,'R','black'],[54,'P','black']]);
 const move=chooseBotMove(state,searchOptions);
 assert.deepEqual(move,{from:32,to:41});
 assert.equal(applyAction(state,{type:'MOVE',...move}).board[41].type,'F');
});
test('escapes check and prefers immediate checkmate',()=>{
 const checked=position([[3,'K','white'],[59,'R','black'],[63,'K','black']]);
 const move=chooseBotMove(checked,searchOptions);
 assert.equal(inCheck(applyAction(checked,{type:'MOVE',...move}).board,'white'),false);
 const mate=position([[0,'K','black'],[18,'K','white'],[9,'R','white'],[16,'R','white']]);
 const analysis=analyzeBotMove(mate,searchOptions);
 assert.equal(analysis.score,99999);
 assert.equal(applyAction(mate,{type:'MOVE',...analysis.move}).result.winner,'white');
});
test('search respects repetition history and honor-count draws',()=>{
 const s=position([[0,'K','white'],[63,'K','black'],[8,'R','white'],[55,'M','black']]);
 const repeated=allMoves(s).flatMap(move=>{const key=positionKey(applyAction(s,{type:'MOVE',...move}));return [key,key];});
 const repetition={...s,positions:[...s.positions,...repeated]};
 const analysis=analyzeBotMove(repetition,searchOptions);
 assert.equal(analysis.score,0);
 assert.equal(applyAction(repetition,{type:'MOVE',...analysis.move}).result.reason,'Threefold repetition');
 const counting={...s,count:{kind:'board',color:'white',value:64,limit:64}};
 const counted=analyzeBotMove(counting,searchOptions);
 assert.equal(counted.score,0);
 assert.equal(applyAction(counting,{type:'MOVE',...counted.move}).result.reason,'Honor count exhausted');
 assert.ok(analyzeBotMove(s,searchOptions).score>0);
});
test('budget exhaustion returns a legal move from the last completed iteration',()=>{
 const state=initialState();
 for(const budget of [{maxNodes:0},{timeMs:0}]){
  const result=analyzeBotMove(state,{...searchOptions,...budget});
  assert.equal(result.depth,0);assert.equal(result.nodes,0);
  assert.ok(allMoves(state).some(m=>m.from===result.move.from&&m.to===result.move.to));
 }
 const complete=analyzeBotMove(state,{...searchOptions,maxDepth:1});
 const interrupted=analyzeBotMove(state,{...searchOptions,maxNodes:complete.nodes+1});
 assert.equal(interrupted.depth,1);assert.deepEqual(interrupted.move,complete.move);
 assert.equal(interrupted.score,complete.score);
});
