import {allMoves,applyAction} from './rules.js';
const values={K:0,R:500,N:300,S:240,M:180,F:180,P:100};
function score(s,color){
 if(s.result)return s.result.winner?(s.result.winner===color?100000:-100000):0;
 return s.board.reduce((sum,p,i)=>{if(!p)return sum;const y=Math.floor(i/8),advance=p.color==='white'?y:7-y;return sum+(p.color===color?1:-1)*(values[p.type]+(p.type==='P'?advance*9:0)+(p.type!=='K'?(3.5-Math.abs(i%8-3.5))*4:0));},0);
}
// Two-ply minimax uses the same immutable rules as human play, including draws.
export function chooseBotMove(state){
 const color=state.turn;let best=null,bestScore=-Infinity;
 for(const move of allMoves(state)){
  const next=applyAction(state,{type:'MOVE',...move});let value=score(next,color);
  if(!next.result){value=Infinity;for(const reply of allMoves(next))value=Math.min(value,score(applyAction(next,{type:'MOVE',...reply}),color));}
  if(value>bestScore){bestScore=value;best=move;}
 }
 return best;
}
