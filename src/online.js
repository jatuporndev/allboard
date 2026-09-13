import {initializeApp} from 'firebase/app';
import {getAuth,signInAnonymously,connectAuthEmulator} from 'firebase/auth';
import {getDatabase,ref,get,set,onValue,onDisconnect,connectDatabaseEmulator,runTransaction,query,orderByChild,equalTo} from 'firebase/database';
import {getFirestore,doc,getDoc,setDoc,updateDoc,deleteField,runTransaction as runFirestoreTransaction,onSnapshot,collection,where,query as firestoreQuery,serverTimestamp,connectFirestoreEmulator} from 'firebase/firestore';
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
const auth=getAuth(app),db=getDatabase(app),firestore=getFirestore(app);
if(import.meta.env.VITE_FIREBASE_EMULATORS==='true'){
  connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectDatabaseEmulator(db,'127.0.0.1',9000);connectFirestoreEmulator(firestore,'127.0.0.1',8080);
}
export const online={uid:null,profile:null,code:null,room:null,connected:false,pending:false};
let stops=[],presenceRef;
export async function connect(){
  await auth.authStateReady();
  if(!auth.currentUser)await signInAnonymously(auth);
  online.uid=auth.currentUser.uid;
  const profile=await getDoc(doc(firestore,'profiles',online.uid));
  online.profile=profile.exists()?profile.data():null;
  return online.profile;
}
export async function saveCharacter(profile){
  character(profile);
  await setDoc(doc(firestore,'profiles',online.uid),{...profile,updatedAt:serverTimestamp()});online.profile=profile;
}
export async function command(command,data={}){
  if(!online.uid)throw Error('Connect before entering a room.');
  if(command==='create'){
    const code=Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();
    const profile=character(data.character),now=Date.now();
    const name=(data.name||`room-${String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0')}`).trim();
    if(!name||name.length>40)throw Error('Room names must contain 1–40 characters.');
    const room={name,host:online.uid,visibility:data.visibility==='private'?'private':'public',status:'waiting',createdAt:now,expiresAt:now+86400000,revision:0,turn:'white',players:{[online.uid]:{...profile,color:'white',ready:false}}};
    const lobby={name,host:online.uid,visibility:room.visibility,status:'waiting',createdAt:serverTimestamp(),expiresAt:room.expiresAt,players:room.players};
    await set(ref(db,`games/makruk/rooms/${code}`),room);
    try{await setDoc(doc(firestore,'games','makruk','rooms',code),lobby);}catch(error){await set(ref(db,`games/makruk/rooms/${code}`),null);throw error;}
    return {code};
  }
  const code=data.code||online.code;
  if(typeof code!=='string'||! /^[A-F0-9]{12}$/.test(code))throw Error('Enter a valid twelve-character room code.');
  const target=ref(db,`games/makruk/rooms/${code}`);
  if(command==='action')return realtimeCommand(code,target,command,data);
  if(!(await get(target)).exists())throw Error('Room unavailable.');
  const lobbyRef=doc(firestore,'games','makruk','rooms',code);
  let lobbyFailure;
  const lobbyResult=await runFirestoreTransaction(firestore,async tx=>{
    const snapshot=await tx.get(lobbyRef);if(!snapshot.exists())throw Error('Room unavailable.');
    const room=snapshot.data();if(room.expiresAt<Date.now())throw Error('This room has expired.');
    const players={...room.players},member=players[online.uid];
      if(command==='join'){
        if(member)return;
        if(room.status!=='waiting'||Object.keys(players).length>=2)throw Error('This room is full or already started.');
        players[online.uid]={...character(data.character),color:'black',ready:false};
        tx.update(lobbyRef,{players,guest:online.uid});
    }else if(!member)throw Error('You are not a member of this room.');
    else if(command==='ready'){
      if(room.status!=='waiting')throw Error('The match has already started.');
      players[online.uid]={...member,ready:!!data.ready};tx.update(lobbyRef,{players});
    }else if(command==='start'){
      if(room.host!==online.uid||room.status!=='waiting'||Object.keys(players).length!==2||!Object.values(players).every(player=>player.ready))throw Error('Both players must be ready.');
      tx.update(lobbyRef,{status:'playing',startedAt:serverTimestamp()});
    }else if(command==='leave'){
      if(room.status==='playing')tx.update(lobbyRef,{status:'finished',resigned:online.uid,endedAt:serverTimestamp()});
      else if(room.host===online.uid)tx.update(lobbyRef,{status:'closed',endedAt:serverTimestamp()});
      else{delete players[online.uid];tx.update(lobbyRef,{players,...(room.guest===online.uid?{guest:deleteField()}:{})});}
    }else throw Error('Unknown room command.');
  }).catch(error=>{lobbyFailure=error;});
  if(lobbyFailure)throw lobbyFailure;
  let failure;
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
  if(!result?.committed||!result.snapshot?.exists()){
    if(command==='join')try{await runFirestoreTransaction(firestore,async tx=>{const snapshot=await tx.get(lobbyRef);if(snapshot.exists()&&snapshot.data().guest===online.uid){const players={...snapshot.data().players};delete players[online.uid];tx.update(lobbyRef,{players,guest:deleteField()});}});}catch{}
    throw failure||Error('Room unavailable. Please try again.');
  }
  if(command==='leave')try{await updateDoc(lobbyRef,{status:result.snapshot.val().status,resigned:result.snapshot.val().resigned||null,players:result.snapshot.val().players,endedAt:serverTimestamp()});}catch(error){console.error('Unable to sync lobby after leave',error);}
  return {code};
}
async function realtimeCommand(code,target,command,data){
  await get(target);let failure;
  const result=await runTransaction(target,raw=>{if(!raw)return;try{failure=null;const next=updateRoom(decodeRoom(raw),online.uid,command,data);delete next.state;next.actions={...(raw.actions||{}),[raw.revision]:{...data.action,uid:online.uid}};next.turn=JSON.parse(updateRoom(decodeRoom(raw),online.uid,command,data).state).turn;return next;}catch(error){failure=error;}} ,{applyLocally:false});
  if(!result.committed)throw failure||Error('Room changed. Please try again.');return {code};
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
export function browse(onRooms,onError){return onSnapshot(firestoreQuery(collection(firestore,'games','makruk','rooms'),where('visibility','==','public'),where('status','==','waiting')),s=>onRooms(s.docs.filter(d=>d.data().expiresAt>Date.now()&&Object.keys(d.data().players).length<2).map(d=>[d.id,{name:d.data().name,players:Object.keys(d.data().players).length}])),onError);}
export function watchRoom(code,onRoom,onConnection,onError){
  cleanup();online.code=code;
  try{localStorage.setItem('allboard-room',code);}catch{}
  presenceRef=ref(db,`games/makruk/presence/${code}/${online.uid}`);
  stops.push(onValue(ref(db,'.info/connected'),async s=>{
    online.connected=s.val()===true;onConnection(online.connected);
    if(online.connected)try{await onDisconnect(presenceRef).set(false);await set(presenceRef,true);}catch(error){onError(error);}
  }));
  let lobbyData=null,matchData=null,lobbyLoaded=false,matchLoaded=false;
  const deliver=()=>{try{if(!lobbyLoaded||!matchLoaded)return;if(!matchData||!lobbyData){online.room=null;onRoom(null);return;}const merged={...matchData,...lobbyData,revision:matchData.revision,turn:matchData.turn,actions:matchData.actions,resigned:matchData.resigned};online.room=decodeRoom({...merged,players:lobbyData.players});onRoom(online.room);}catch(error){online.connected=false;onConnection(false);onError(error);}};
  stops.push(onSnapshot(doc(firestore,'games','makruk','rooms',code),s=>{lobbyData=s.exists()?s.data():null;lobbyLoaded=true;deliver();},onError));
  stops.push(onValue(ref(db,`games/makruk/rooms/${code}`),s=>{matchData=s.val();matchLoaded=true;deliver();},onError));
  stops.push(onValue(ref(db,`games/makruk/presence/${code}`),s=>{online.presence=s.val()||{};if(online.room)onRoom(online.room);},onError));
}
export function cleanup(){stops.forEach(stop=>stop());stops=[];if(presenceRef){set(presenceRef,false).catch(()=>{});presenceRef=null;}online.room=null;online.code=null;online.connected=false;}
export async function leave(){await command('leave');cleanup();try{localStorage.removeItem('allboard-room');}catch{}}
