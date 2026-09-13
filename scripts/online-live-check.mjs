import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
import {updateRoom} from '../src/game/room.js';
const env=Object.fromEntries((await readFile('.env','utf8')).trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const accounts=[];
async function authCall(method,body){const response=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${env.VITE_FIREBASE_API_KEY}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const result=await response.json();if(!response.ok)throw Error(result.error.message);return result;}
async function request(user,path,method='GET',body,extra={}){const url=new URL(`${env.VITE_FIREBASE_DATABASE_URL}/${path}.json`);url.searchParams.set('auth',user.idToken);for(const [key,value]of Object.entries(extra))url.searchParams.set(key,value);const response=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});return {ok:response.ok,status:response.status,data:await response.json()};}
function check(result,label){assert.equal(result.ok,true,`${label}: ${JSON.stringify(result.data)}`);return result.data;}
try{
  for(let i=0;i<3;i++)accounts.push(await authCall('signUp',{returnSecureToken:true}));
  const [a,b,c]=accounts,profile={name:'Verification',emblem:'crown'},code=randomBytes(6).toString('hex').toUpperCase(),path=`games/makruk/rooms/${code}`;
  check(await request(a,`profiles/${a.localId}`,'PUT',profile),'save character');
  let room={name:'Verification room',host:a.localId,visibility:'private',status:'waiting',createdAt:Date.now(),expiresAt:Date.now()+600000,revision:0,turn:'white',players:{[a.localId]:{...profile,color:'white',ready:false}}};
  check(await request(a,path,'PUT',room),'create room');console.log('Character save and private room creation passed.');
  const publicRooms=check(await request(b,'games/makruk/rooms','GET',undefined,{orderBy:JSON.stringify('visibility'),equalTo:JSON.stringify('public')}),'public browser');assert.equal(publicRooms?.[code],undefined);
  assert.equal((await request(b,'games/makruk/rooms')).ok,false,'Private room collection must not be readable');
  room=updateRoom(room,b.localId,'join',{character:profile});check(await request(b,path,'PUT',room),'join room');
  assert.equal((await request(c,path,'PUT',{...room,name:'Intruder'})).ok,false);
  assert.equal((await request(a,path,'PUT',{...room,status:'playing'})).ok,false,'Cannot start unready');
  for(const user of [a,b]){room=updateRoom(room,user.localId,'ready',{ready:true});check(await request(user,path,'PUT',room),'ready');}
  const started=updateRoom(room,a.localId,'start');delete started.state;room=started;check(await request(a,path,'PUT',room),'start');
  for(const [user,from,to]of [[a,20,28],[b,43,35]]){const next={...room,revision:room.revision+1,turn:room.turn==='white'?'black':'white',actions:{...room.actions,[room.revision]:{type:'MOVE',uid:user.localId,from,to}}};check(await request(user,path,'PUT',next),'move');room=next;}
  assert.equal((await request(b,path,'PUT',{...room,revision:3,turn:'black',actions:{...room.actions,2:{type:'MOVE',uid:b.localId,from:35,to:27}}})).ok,false,'Wrong turn must be denied');
  check(await request(a,`games/makruk/presence/${code}/${a.localId}`,'PUT',true),'presence');
  check(await request(b,path,'PUT',{...room,status:'finished',resigned:b.localId}),'resign');
  console.log('Passed: private discovery isolation, joining, readiness, start, two turns, presence, resignation, outsider and wrong-turn rejection.');
}finally{for(const user of accounts)await authCall('delete',{idToken:user.idToken});console.log('Temporary authentication accounts removed.');}
