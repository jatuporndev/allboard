import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const env=Object.fromEntries((await readFile('.env','utf8')).trim().split(/\r?\n/).map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const accounts=[];const firestore='https://firestore.googleapis.com/v1/projects/'+env.VITE_FIREBASE_PROJECT_ID+'/databases/(default)/documents';
async function authCall(method,body){const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+method+'?key='+env.VITE_FIREBASE_API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw Error(data.error?.message||'Authentication check failed');return data;}
function fields(value){const result={};for(const [key,v]of Object.entries(value)){if(v===null||v===undefined)continue;if(typeof v==='string')result[key]={stringValue:v};else if(typeof v==='number')result[key]={integerValue:String(v)};else if(typeof v==='boolean')result[key]={booleanValue:v};else if(v instanceof Date)result[key]={timestampValue:v.toISOString()};else if(typeof v==='object')result[key]={mapValue:{fields:fields(v)}};}return result;}
function parse(value){if('stringValue'in value)return value.stringValue;if('integerValue'in value)return Number(value.integerValue);if('booleanValue'in value)return value.booleanValue;if('timestampValue'in value)return value.timestampValue;if('mapValue'in value)return Object.fromEntries(Object.entries(value.mapValue.fields||{}).map(([k,v])=>[k,parse(v)]));return null;}
async function request(user,path,method='GET',value,mask){const url=new URL(firestore+'/'+path);if(mask)for(const field of mask)url.searchParams.append('updateMask.fieldPaths',field);if(method==='POST'&&path==='games/makruk/rooms')url.searchParams.set('documentId',value.id);const body=value?.data?{fields:fields(value.data)}:value?{fields:fields(value)}:undefined;const response=await fetch(url,{method,headers:{Authorization:'Bearer '+user.idToken,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});let data;try{data=await response.json();}catch{data=null;}return {ok:response.ok,status:response.status,data};}
function check(r,label){assert.equal(r.ok,true,label+': '+JSON.stringify(r.data));return r.data;}
try{
 for(let i=0;i<3;i++)accounts.push(await authCall('signUp',{returnSecureToken:true}));
 const [a,b,c]=accounts,profile={name:'Verification',emblem:'crown'},code=randomBytes(6).toString('hex').toUpperCase(),path='games/makruk/rooms/'+code;
 check(await request(a,'profiles/'+a.localId,'PATCH',{...profile,updatedAt:new Date()},['name','emblem','updatedAt']),'Firestore profile');
 let room={id:code,name:'Verification room',host:a.localId,visibility:'private',status:'waiting',createdAt:new Date(),expiresAt:Date.now()+600000,players:{[a.localId]:{...profile,color:'white',ready:false}}};
 check(await request(a,'games/makruk/rooms','POST',room),'Firestore create room');
 const data=check(await request(b,path),'private room invitation read');assert.equal(data.fields.visibility.stringValue,'private');
 assert.equal((await request(c,path,'PATCH',{name:'Intruder'},['name'])).ok,false,'outsider mutation denied');
 room.guest=b.localId;room.players[b.localId]={...profile,color:'black',ready:false};check(await request(b,path,'PATCH',{guest:b.localId,players:room.players},['guest','players']),'guest joins lobby');
 for(const [user,uid,color]of [[a,a.localId,'white'],[b,b.localId,'black']]){room.players[uid]={...profile,color,ready:true};check(await request(user,path,'PATCH',{players:room.players},['players']),'ready state');}
 room.status='playing';check(await request(a,path,'PATCH',{status:'playing',startedAt:new Date()},['status','startedAt']),'host starts match');
 assert.equal(parse((await request(a,path)).data.fields.status),'playing');
 console.log('Firestore live checks passed: profile save, private room create/code access, outsider denial, guest join, readiness, host start.');
}finally{for(const user of accounts)try{await authCall('delete',{idToken:user.idToken});}catch{}console.log('Temporary anonymous accounts removed.');}