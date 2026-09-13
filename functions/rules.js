export const NAMES = {K:'Khun',M:'Met',S:'Khon',N:'Ma',R:'Ruea',P:'Bia',F:'Bia Ngai'};
export const other = c => c === 'white' ? 'black' : 'white';
export const square = i => 'abcdefgh'[i%8]+(Math.floor(i/8)+1);
const inside = (x,y) => x>=0&&x<8&&y>=0&&y<8;
export function initialState(){
  const board=Array(64).fill(null); let id=0;
  for(const color of ['white','black']){
    const row=color==='white'?0:7, pawns=color==='white'?2:5;
    const back=color==='white'?'RNSKM SNR'.replaceAll(' ',''):'RNSMK SNR'.replaceAll(' ','');
    for(let x=0;x<8;x++){board[row*8+x]={id:id++,type:back[x],color};board[pawns*8+x]={id:id++,type:'P',color};}
  }
  const state={board,turn:'white',ply:0,history:[],count:null,result:null,positions:[]}; state.positions=[positionKey(state)]; return state;
}
export function pseudoMoves(board,from,attacks=false){
  const p=board[from];if(!p)return [];const x=from%8,y=Math.floor(from/8),d=p.color==='white'?1:-1,out=[];
  const add=(dx,dy)=>{const xx=x+dx,yy=y+dy;if(!inside(xx,yy))return;const t=yy*8+xx;if(attacks||board[t]?.color!==p.color)out.push(t);};
  const diag=[[1,1],[-1,1],[1,-1],[-1,-1]];
  if(p.type==='P') {if(inside(x,y+d)&&!board[(y+d)*8+x]&&!attacks)out.push((y+d)*8+x);for(const dx of [-1,1])if(inside(x+dx,y+d)&&(attacks||(board[(y+d)*8+x+dx]&&board[(y+d)*8+x+dx].color!==p.color)))out.push((y+d)*8+x+dx);}
  else if(p.type==='R'){for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let xx=x+dx,yy=y+dy;while(inside(xx,yy)){const t=yy*8+xx;if(attacks||board[t]?.color!==p.color)out.push(t);if(board[t])break;xx+=dx;yy+=dy;}}}
  else {let steps=diag;if(p.type==='S')steps=[...diag,[0,d]];if(p.type==='K')steps=[...diag,[0,1],[0,-1],[1,0],[-1,0]];if(p.type==='N')steps=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];steps.forEach(([dx,dy])=>add(dx,dy));}
  return out;
}
export function inCheck(board,color){const king=board.findIndex(p=>p?.type==='K'&&p.color===color);return king<0||board.some((p,i)=>p&&p.color!==color&&pseudoMoves(board,i,true).includes(king));}
export function legalMoves(state,from){const p=state.board[from];if(!p||p.color!==state.turn||state.result)return [];return pseudoMoves(state.board,from).filter(to=>{if(state.board[to]?.type==='K')return false;const b=state.board.slice();b[to]=p;b[from]=null;return !inCheck(b,p.color);});}
export function allMoves(state){return state.board.flatMap((p,from)=>p?.color===state.turn?legalMoves(state,from).map(to=>({from,to})):[]);}
export function positionKey(s){return s.turn+':'+s.board.map(p=>p?p.color[0]+p.type:'.').join('');}
function pieceCount(s){if(s.board.some(p=>p?.type==='P'))return null;for(const color of ['white','black'])if(s.board.filter(p=>p?.color===color).length===1){const army=s.board.filter(p=>p&&p.color!==color),n=t=>army.filter(p=>p.type===t).length;const limit=n('R')>=2?8:n('R')?16:n('S')>=2?22:n('N')>=2?32:n('S')?44:64;return {kind:'piece',color,value:s.board.filter(Boolean).length,limit};}return null;}
export function applyAction(state,action){
  if(state.result)throw Error('The game has ended.');
  if(action.type==='COUNT') {if(state.board.some(p=>p?.type==='P')||state.count?.kind==='piece')throw Error('Counting is not available.');return {...state,count:state.count?null:{kind:'board',color:state.turn,value:0,limit:64}};}
  if(action.type==='DRAW'){if(!state.count||state.count.color===state.turn)throw Error('No opposing count to accept.');return {...state,result:{winner:null,reason:'Draw accepted during counting'}};}
  const {from,to}=action;if(action.type!=='MOVE'||!legalMoves(state,from).includes(to))throw Error('Illegal move');
  const piece=state.board[from],captured=state.board[to];const board=state.board.slice();board[from]=null;const promoted=piece.type==='P'&&Math.floor(to/8)===(piece.color==='white'?5:2);board[to]={...piece,type:promoted?'F':piece.type};
  const next={...state,board,turn:other(state.turn),ply:state.ply+1,count:state.count?{...state.count}:null,history:[...state.history,{from,to,piece,captured,promoted,notation:`${NAMES[piece.type]} ${square(from)} ${captured?'×':'–'} ${square(to)}${promoted?' = Met':''}`}],result:null};
  if(next.count?.color===piece.color)next.count.value++;
  if(next.count?.kind!=='piece'){const count=pieceCount(next);if(count)next.count=count;}
  if(!allMoves(next).length)next.result=inCheck(board,next.turn)?{winner:next.count?.color===piece.color?null:piece.color,reason:next.count?.color===piece.color?'Counting side delivered mate — draw':'Checkmate'}:{winner:null,reason:'Stalemate'};
  if(!next.result&&board.filter(Boolean).length===2)next.result={winner:null,reason:'Bare kings'};
  if(!next.result&&next.count&&next.count.value>next.count.limit)next.result={winner:null,reason:'Honor count exhausted'};
  next.positions=[...state.positions,positionKey(next)];if(!next.result&&next.positions.filter(k=>k===positionKey(next)).length>=3)next.result={winner:null,reason:'Threefold repetition'};
  return next;
}
