import {initializeApp} from 'firebase/app';
import {getAuth,signInAnonymously,connectAuthEmulator} from 'firebase/auth';
import {getDatabase,ref,get,set,onValue,onDisconnect,connectDatabaseEmulator,runTransaction,query,orderByChild,equalTo} from 'firebase/database';
import {initialState,applyAction} from './game/rules.js';
import {character,updateRoom} from './game/room.js';
const app=initializeApp({
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
});
const auth=getAuth(app),db=getDatabase(app);
if(import.meta.env.VITE_FIREBASE_EMULATORS==='true'){
  connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectDatabaseEmulator(db,'127.0.0.1',9000);
}
export const online={uid:null,profile:null,code:null,room:null,connected:false,pending:false};
let stops=[],presenceRef;
export async function connect(){
  await auth.authStateReady();
  if(!auth.currentUser)await signInAnonymously(auth);
  online.uid=auth.currentUser.uid;
  online.profile=(await get(ref(db,`profiles/${online.uid}`))).val();
  return online.profile;
}
export async function saveCharacter(profile){
  character(profile);
  await set(ref(db,`profiles/${online.uid}`),profile);online.profile=profile;
}
export async function command(command,data={}){
  if(!online.uid)throw Error('Connect before entering a room.');
  if(command==='create'){
    const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
    const profile=character(data.character),now=Date.now();
    const name=(data.name||`room-${String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0')}`).trim();
    if(!name||name.length>40)throw Error('Room names must contain 1–40 characters.');
    await set(ref(db,`games/makruk/rooms/${code}`),{name,host:online.uid,visibility:data.visibility==='private'?'private':'public',status:'waiting',createdAt:now,expiresAt:now+86400000,revision:0,turn:'white',players:{[online.uid]:{...profile,color:'white',ready:false}}});
    return {code};
  }
  const code=data.code||online.code;
  if(typeof code!=='string'||! /^[A-F0-9]{12}$/.test(code))throw Error('Enter a valid twelve-character room code.');
  const target=ref(db,`games/makruk/rooms/${code}`);
  await get(target);let failure;
  const result=await runTransaction(target,raw=>{
    if(!raw)return raw;
    try{
      failure=null;
      const room=decodeRoom(raw),next=updateRoom(room,online.uid,command,data);
      delete next.state;
      if(command==='action'){
        next.actions={...(raw.actions||{}),[raw.revision]:{...data.action,uid:online.uid}};
        next.turn=JSON.parse(updateRoom(room,online.uid,command,data).state).turn;
      }
      if(command==='leave'&&raw.status==='playing'){next.resigned=online.uid;next.revision=raw.revision;}
      return next;
    }catch(error){failure=error;return;}
  },{applyLocally:false});
  if(!result.committed||!result.snapshot.exists())throw failure||Error('Room unavailable. Please try again.');
  return {code};
}
export function decodeRoom(raw){
  let state=initialState();
  for(let i=0;i<raw.revision;i++){
    const action=raw.actions?.[i];
    if(!action||raw.players[action.uid]?.color!==state.turn)throw Error('Invalid match history. Leave this room and create another.');
    state=applyAction(state,action);
  }
  if(raw.resigned){const color=raw.players[raw.resigned]?.color;if(!color)throw Error('Invalid resignation.');state.result={winner:color==='white'?'black':'white',reason:'Opponent left the room'};}
  return {...raw,state:JSON.stringify(state)};
}
export function browse(onRooms,onError){return onValue(query(ref(db,'games/makruk/rooms'),orderByChild('visibility'),equalTo('public')),s=>onRooms(Object.entries(s.val()||{}).filter(([,r])=>r.status==='waiting'&&r.expiresAt>Date.now()&&Object.keys(r.players).length<2).map(([code,r])=>[code,{name:r.name||r.players[r.host].name,players:Object.keys(r.players).length}])),onError);}
export function watchRoom(code,onRoom,onConnection,onError){
  cleanup();online.code=code;
  try{localStorage.setItem('allboard-room',code);}catch{}
  presenceRef=ref(db,`games/makruk/presence/${code}/${online.uid}`);
  stops.push(onValue(ref(db,'.info/connected'),async s=>{
    online.connected=s.val()===true;onConnection(online.connected);
    if(online.connected)try{await onDisconnect(presenceRef).set(false);await set(presenceRef,true);}catch(error){onError(error);}
  }));
  stops.push(onValue(ref(db,`games/makruk/rooms/${code}`),s=>{try{online.room=s.exists()?decodeRoom(s.val()):null;onRoom(online.room);}catch(error){online.connected=false;onConnection(false);onError(error);}},onError));
  stops.push(onValue(ref(db,`games/makruk/presence/${code}`),s=>{online.presence=s.val()||{};if(online.room)onRoom(online.room);},onError));
}
export function cleanup(){stops.forEach(stop=>stop());stops=[];if(presenceRef){set(presenceRef,false).catch(()=>{});presenceRef=null;}online.room=null;online.code=null;online.connected=false;}
export async function leave(){await command('leave');cleanup();try{localStorage.removeItem('allboard-room');}catch{}}
