import {initialState, applyAction} from './rules.js';
export function character(value) {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.trim().length > 24 || !['crown','flame','moon'].includes(value.emblem)) throw Error('Choose a name and emblem.');
  return {name:value.name.trim(),emblem:value.emblem};
}
export function updateRoom(room, uid, command, data = {}) {
  if (!room || room.expiresAt < Date.now()) throw Error('This room has expired.');
  const next = structuredClone(room), member = next.players[uid];
  if (command === 'join') {
    if(member)return next;
    if(next.status !== 'waiting' || Object.keys(next.players).length >= 2)throw Error('This room is full or already started.');
    next.players[uid]={...character(data.character),color:'black',ready:false};
    next.guest=uid;
  } else {
    if(!member)throw Error('You are not a member of this room.');
    if(command==='leave') {
      if(next.status==='playing'){next.status='finished';const state=JSON.parse(next.state);state.result={winner:member.color==='white'?'black':'white',reason:'Opponent left the room'};next.state=JSON.stringify(state);next.revision++;}
      else if(uid===next.host){next.status='closed';}else {delete next.players[uid];delete next.guest;}
    } else if(command==='ready') {
      if(next.status!=='waiting')throw Error('The match has already started.');
      member.ready=!!data.ready;
    } else if(command==='start') {
      if(uid!==next.host || next.status!=='waiting' || Object.keys(next.players).length!==2 || !Object.values(next.players).every(p=>p.ready))throw Error('Both players must be ready.');
      next.status='playing';next.state=JSON.stringify(initialState());next.revision=0;
    } else if(command==='action') {
      const state=JSON.parse(next.state || 'null');
      if(next.status!=='playing'||!state||state.turn!==member.color)throw Error('Wait for your turn.');
      if(data.revision!==next.revision)throw Error('The board changed. Try again.');
      const action=data.action;
      if(!action || !['MOVE','COUNT','DRAW'].includes(action.type))throw Error('Invalid action.');
      if(action.type==='MOVE'&&(!Number.isInteger(action.from)||!Number.isInteger(action.to)||action.from<0||action.from>63||action.to<0||action.to>63))throw Error('Invalid square.');
      const stateNext=applyAction(state,action);next.state=JSON.stringify(stateNext);next.revision++;
      if(stateNext.result)next.status='finished';
    } else throw Error('Unknown room command.');
  }
  return next;
}
