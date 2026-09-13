import {initializeApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {randomBytes} from 'node:crypto';
import {character,updateRoom} from './room.js';
initializeApp();
export const roomCommand=onCall({region:'asia-southeast1',maxInstances:10},async request=>{
  if(!request.auth)throw new HttpsError('unauthenticated','Sign in before entering the sanctuary.');
  const uid=request.auth.uid, data=request.data || {}, command=data.command;
  // Each game owns its own rooms, discovery index and versioned rules.
  if(data.game!=='makruk')throw new HttpsError('invalid-argument','Unsupported game.');
  const root=getDatabase().ref('games/makruk');
  let code=data.code;
  try {
    if(command==='create'){
      const profile=character(data.character);
      code=randomBytes(6).toString('hex').toUpperCase();
      const room={host:uid,visibility:data.visibility==='private'?'private':'public',status:'waiting',createdAt:Date.now(),expiresAt:Date.now()+86400000,revision:0,players:{[uid]:{...profile,color:'white',ready:false}}};
      await root.child(`rooms/${code}`).set(room);
    } else {
      if(typeof code!=='string'||! /^[A-F0-9]{12}$/.test(code))throw Error('Enter a valid twelve-character room code.');
      let failure;
      const result=await root.child(`rooms/${code}`).transaction(room=>{
        try {failure=null;return updateRoom(room,uid,command,data);}catch(error){failure=error;return;}
      });
      if(!result.committed)throw failure || Error('Room changed. Please try again.');
    }
    // Discovery contains no private rooms. Re-read to avoid publishing stale transaction data.
    const room=(await root.child(`rooms/${code}`).get()).val();
    await root.child(`publicRooms/${code}`).set(room?.visibility==='public'&&room.status==='waiting'?{name:room.players[room.host].name,players:Object.keys(room.players).length,expiresAt:room.expiresAt}:null);
    return {code};
  }catch(error){throw new HttpsError('failed-precondition',error.message);}
});
