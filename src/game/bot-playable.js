import {allMoves,applyAction} from './rules.js';

// Original two-ply bot: one move and the opponent's reply, without extensions.
const values={K:0,R:500,N:300,S:240,M:180,F:180,P:100};
function evaluate(state,color){
 if(state.result)return state.result.winner?(state.result.winner===color?100000:-100000):0;
 return state.board.reduce((sum,p,i)=>{
  if(!p)return sum;
  const y=Math.floor(i/8),advance=p.color==='white'?y:7-y;
  return sum+(p.color===color?1:-1)*(values[p.type]+(p.type==='P'?advance*9:0)+(p.type!=='K'?(3.5-Math.abs(i%8-3.5))*4:0));
 },0);
}
export function analyzePlayableMove(state){
 const start=performance.now(),color=state.turn;
 let move=null,score=-Infinity,nodes=0;
 for(const candidate of allMoves(state)){
  const next=applyAction(state,{type:'MOVE',...candidate});nodes++;
  let value=evaluate(next,color);
  if(!next.result){
   value=Infinity;
   for(const reply of allMoves(next)){
    value=Math.min(value,evaluate(applyAction(next,{type:'MOVE',...reply}),color));nodes++;
   }
  }
  if(value>score){score=value;move=candidate;}
 }
 return {move,score:move?score:null,depth:move?2:0,nodes,elapsedMs:performance.now()-start};
}
