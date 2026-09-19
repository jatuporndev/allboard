import {allMoves,applyAction,inCheck,positionKey,pseudoMoves} from './rules.js';

const values={K:0,R:500,N:310,S:250,M:180,F:180,P:100};
const MATE=100000, STOP=Symbol('search budget');
const promotion=(s,m)=>s.board[m.from].type==='P'&&Math.floor(m.to/8)===(s.turn==='white'?5:2);
const same=(a,b)=>a&&b&&a.from===b.from&&a.to===b.to;

// Side-to-move score. A promoted Bia has Met strength, not queen strength.
export function evaluatePosition(s){
  let score=0;
  const material=s.board.reduce((n,p)=>n+(p?values[p.type]:0),0);
  for(let i=0;i<64;i++){
    const p=s.board[i];if(!p)continue;
    const x=i%8,y=Math.floor(i/8),advance=p.color==='white'?y:7-y;
    const center=7-Math.abs(x-3.5)-Math.abs(y-3.5);
    let value=values[p.type];
    if(p.type==='K')value+=material<1800?center*10:-center*5;
    else {
      value+=center*(p.type==='N'?10:5);
      value+=pseudoMoves(s.board,i).length*(p.type==='R'?2:3);
      if(['N','S','M'].includes(p.type)&&advance===0)value-=18;
    }
    if(p.type==='P'){
      value+=advance*10;
      const blocked=s.board[i+(p.color==='white'?8:-8)];
      if(advance===4&&!blocked)value+=35;
      const passed=!s.board.some((enemy,j)=>enemy?.type==='P'&&enemy.color!==p.color&&Math.abs(j%8-x)<=1&&(p.color==='white'?Math.floor(j/8)>y:Math.floor(j/8)<y));
      if(passed)value+=12+advance*5;
    }
    score+=(p.color===s.turn?1:-1)*value;
  }
  return score;
}

// Iterative deepening retains only completed iterations. All branches use the
// actual game rules, including threefold repetition and Makruk honor counting.
export function analyzeBotMove(state,{timeMs=1800,maxDepth=6,maxNodes=150000,quiescenceDepth=6}={}){
  const start=performance.now(),deadline=start+Math.max(0,timeMs);
  let nodes=0,depth=0,score=null;
  // Cache moves for ordering, never scores: identical boards can have different
  // repetition histories and counting limits, which affect their true value.
  const preferred=new Map();
  function tick(){if(nodes>=maxNodes||performance.now()>=deadline)throw STOP;nodes++;}
  function terminal(s,ply){return s.result.winner?(s.result.winner===s.turn?MATE-ply:-MATE+ply):0;}
  function ordered(s,moves,hint){
    const priority=m=>same(m,hint)?1000000:(s.board[m.to]?10000+values[s.board[m.to].type]*10-values[s.board[m.from].type]:0)+(promotion(s,m)?2000:0);
    return moves.map(m=>({m,p:priority(m)})).sort((a,b)=>b.p-a.p).map(v=>v.m);
  }
  function child(s,m){return applyAction(s,{type:'MOVE',...m});}
  function quiet(s,alpha,beta,remaining,ply){
    tick();if(s.result)return terminal(s,ply);
    const checked=inCheck(s.board,s.turn);
    // Check evasions must be searched even at the normal capture-depth limit.
    // For unusually long check sequences, discard the unfinished iteration.
    if(remaining<=-12)throw STOP;
    if(!checked){
      const value=evaluatePosition(s);
      if(remaining<=0||value>=beta)return value;
      alpha=Math.max(alpha,value);
    }
    const moves=allMoves(s);
    if(!moves.length)return checked?-MATE+ply:0;
    for(const m of ordered(s,checked?moves:moves.filter(m=>s.board[m.to]||promotion(s,m)))){
      const value=-quiet(child(s,m),-beta,-alpha,remaining-1,ply+1);
      if(value>=beta)return value;alpha=Math.max(alpha,value);
    }
    return alpha;
  }
  function search(s,remaining,alpha,beta,ply){
    tick();if(s.result)return terminal(s,ply);
    if(remaining<=0)return quiet(s,alpha,beta,quiescenceDepth,ply);
    const key=positionKey(s),moves=ordered(s,allMoves(s),preferred.get(key));
    if(!moves.length)return inCheck(s.board,s.turn)?-MATE+ply:0;
    let best=-Infinity,bestMove=moves[0];
    for(const m of moves){
      const value=-search(child(s,m),remaining-1,-beta,-alpha,ply+1);
      if(value>best){best=value;bestMove=m;}alpha=Math.max(alpha,value);
      if(alpha>=beta)break;
    }
    preferred.set(key,bestMove);return best;
  }
  const moves=ordered(state,allMoves(state));
  let move=moves[0]||null;
  if(move)for(let target=1;target<=maxDepth;target++){
    try{
      let iterationScore=-Infinity,iterationMove=move;
      for(const candidate of ordered(state,moves,move)){
        tick();
        const value=-search(child(state,candidate),target-1,-Infinity,-iterationScore,1);
        if(value>iterationScore){iterationScore=value;iterationMove=candidate;}
      }
      move=iterationMove;score=iterationScore===0?0:iterationScore;depth=target;
      if(Math.abs(score)>MATE-1000)break;
    }catch(error){if(error!==STOP)throw error;break;}
  }
  return {move,score,depth,nodes,elapsedMs:performance.now()-start};
}

export function chooseBotMove(state,options){return analyzeBotMove(state,options).move;}
