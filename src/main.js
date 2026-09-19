import {online,command as roomCommand,leave as leaveOnline} from './online.js';
import {mountOnline} from './online-menu.js';
import {mountLanguage} from './i18n.js';
import './style.css';
import * as THREE from 'three';
import {GameStore} from './game/store.js';
import {legalMoves,inCheck,NAMES} from './game/rules.js';
import {World} from './scene/world.js';
import {CameraRig} from './scene/camera.js';
import {Effects} from './scene/effects.js';
import {Animator} from './scene/animation.js';
import {mount,renderUI} from './ui.js';
import {mountMenu} from './menu.js';
import {BotClient} from './game/bot-client.js';
import {getBotDifficulty} from './game/bot-difficulty.js';
import {mountHUD} from './hud.js';
mount();const $=id=>document.getElementById(id),store=new GameStore();let selected=null,moves=[],toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2800);}
mountMenu();mountHUD();let playing=false,gameMode='local',botTimer,menuMotion=true;
const bot=new BotClient();
let botDifficulty=getBotDifficulty('casual');
document.querySelector('.obsidian').insertAdjacentHTML('beforeend','<div id="solo-difficulty" class="difficulty-badge" hidden></div>');
function cancelBot(){clearTimeout(botTimer);bot.cancel();}
let world;
let multiplayerPreview=false;
try{world=new World($('scene'));}catch(error){$('status').textContent='WebGL is unavailable.';$('toast').textContent='Please enable hardware acceleration or use a WebGL-capable browser.';$('toast').classList.add('show');throw error;}
const rig=new CameraRig(world,locked=>{$('crosshair').hidden=!locked;$('look').textContent=locked?'Esc to release mouse':'Enter mouse look ↗';}),effects=new Effects(world.scene),animator=new Animator(world,effects,rig);
function refresh(){world.highlight(selected,moves,store.state);renderUI(store,selected,moves);if(gameMode==='solo'&&store.state.turn==='black'&&!store.state.result){$('status').textContent='The Ember King is thinking...';$('black-turn').textContent='BOT TURN';}const locked=animator.busy;$('undo').disabled=locked||!store.snapshots.length;$('new-game').disabled=locked;$('return-menu').disabled=locked;$('count').disabled=locked||(gameMode==='solo'&&store.state.turn==='black');$('accept-draw').disabled=$('count').disabled;if(gameMode==='online'){$('undo').disabled=true;$('new-game').disabled=true;$('count').disabled=!canPlayOnline();$('accept-draw').disabled=!canPlayOnline();if(!online.connected)$('status').textContent='Reconnecting to the sanctuary…';}}
function scheduleBot(){
 cancelBot();if(!playing||isPaused()||gameMode!=='solo'||store.state.turn!=='black'||store.state.result)return;
 botTimer=setTimeout(()=>{
  if(!playing||isPaused()||animator.busy)return;
  const state=store.state;
  bot.request(state,({move})=>{
   if(store.state!==state||!playing||isPaused()||gameMode!=='solo'||animator.busy)return;
   if(move&&legalMoves(state,move.from).includes(move.to))playMove(move.from,move.to);
  },()=>{if(store.state===state&&playing&&gameMode==='solo')toast('The bot could not finish thinking. Pause and resume to retry.');},botDifficulty.id);
 },250);
}
function playMove(from,to){if(gameMode==='online'){sendOnline({type:'MOVE',from,to});return;}const next=store.dispatch({type:'MOVE',from,to});animator.move(next.history.at(-1),()=>{world.sync(next);animator.checkmate(next,refresh);refresh();if(next.result)toast(next.result.winner?`${next.result.winner==='white'?'Ivory':'Obsidian'} wins: ${next.result.reason}`:`Draw: ${next.result.reason}`);else if(inCheck(next.board,next.turn))toast('Check - protect your Khun.');else if(next.history.at(-1).promoted)toast('Bia awakened - promoted to Bia Ngai.');scheduleBot();});refresh();}
store.subscribe((s,action)=>{selected=null;moves=[];if(action.type!=='MOVE'){effects.clear();world.sync(s,{resetFacing:action.type==='RESET'||action.type==='UNDO'});}refresh();});world.sync(store.state);refresh();world.resize();new ResizeObserver(()=>world.resize()).observe($('scene'));
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let down=null;
$('scene').addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};});
$('scene').addEventListener('pointerup',e=>{if(e.button!==0||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||performance.now()-down.time>500)return;down=null;if(!playing||isPaused()||animator.busy||(gameMode==='online'&&!canPlayOnline())||store.state.result||(gameMode==='solo'&&store.state.turn==='black'))return;const rect=$('scene').getBoundingClientRect();if(document.pointerLockElement)$('crosshair').hidden=false;mouse.set(document.pointerLockElement?0:(e.clientX-rect.left)/rect.width*2-1,document.pointerLockElement?0:-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,world.camera);
 const hits=raycaster.intersectObjects([...world.tiles,...world.pieces.values()],true);if(!hits.length){selected=null;moves=[];refresh();return;}let object=hits[0].object;while(object&&object.userData.square===undefined)object=object.parent;if(!object)return;const index=object.userData.square;
 if(selected!==null&&moves.includes(index)){playMove(selected,index);return;}
 const p=store.state.board[index];if(p?.color===store.state.turn){selected=index;moves=legalMoves(store.state,index);if(!moves.length)toast(`${NAMES[p.type]} has no legal moves.`);}else{selected=null;moves=[];if(p)toast(`It is ${store.state.turn==='white'?'Ivory':'Obsidian'}’s turn.`);}refresh();});
function cameraMode(mode){rig.setMode(mode);$('orbit').classList.toggle('active',mode==='orbit');$('fly').classList.toggle('active',mode==='fly');$('look').hidden=mode!=='fly';$('camera-hint').textContent=mode==='fly'?'WASD · Shift · Space / Ctrl':'WASD to move / Drag to orbit · Scroll to explore';if(mode==='fly')toast('WASD to fly · Space / Ctrl for height · Enter mouse look to explore.');}
$('orbit').onclick=()=>cameraMode('orbit');$('fly').onclick=()=>cameraMode('fly');$('look').onclick=()=>document.pointerLockElement?document.exitPointerLock():rig.lock();window.addEventListener('keydown',e=>{if(playing&&e.code==='KeyV'&&!e.repeat&&!document.querySelector('dialog[open]'))cameraMode(rig.mode==='orbit'?'fly':'orbit');});$('home').onclick=()=>{cameraMode('orbit');rig.home();};$('sound').onclick=()=>{effects.muted=!effects.muted;$('sound').innerHTML=effects.muted?'♫<span class="mute-slash">/</span>':'♫';$('sound').setAttribute('aria-label',effects.muted?'Enable sound':'Mute sound');if(!effects.muted)effects.sound();toast(effects.muted?'Sound muted':'Sound enabled');};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{toast('Fullscreen is unavailable in this browser.');}};
$('rules').onclick=()=>{document.exitPointerLock?.();rig.keys.clear();$('guide').showModal();};document.querySelector('.close').onclick=()=>$('guide').close();$('new-game').onclick=()=>{if(animator.busy)return;if(!store.state.ply){store.reset();toast('A new legend begins.');}else {cancelBot();$('new-dialog').showModal();}};$('confirm-new').onclick=()=>{cancelBot();store.reset();$('new-dialog').close();toast('A new legend begins.');};document.querySelector('.close-new').onclick=()=>$('new-dialog').close();$('undo').onclick=()=>{if(!animator.busy){cancelBot();store.undo();if(gameMode==='solo'&&store.state.turn==='black')store.undo();toast('Last turn undone.');}};$('count').onclick=()=>{if(gameMode==='online')sendOnline({type:'COUNT'});else if(!animator.busy)store.dispatch({type:'COUNT'});};$('accept-draw').onclick=()=>{if(gameMode==='online')sendOnline({type:'DRAW'});else if(!animator.busy)store.dispatch({type:'DRAW'});};
let last=performance.now(),elapsed=0;function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;elapsed+=dt;world.update(elapsed);if(!isPaused()||gameMode==='online'){animator.update(dt);effects.update(dt);}if(playing){if(!isPaused())rig.update(dt,elapsed);}else if(multiplayerPreview){rig.update(dt,elapsed);}else{const t=menuMotion?elapsed:0;world.camera.position.set(7+Math.sin(t*.09)*1.3,4.4+Math.sin(t*.12)*.25,12.5);world.camera.lookAt(0,3,-7);}world.render();requestAnimationFrame(frame);}requestAnimationFrame(frame);

function showModes(show){$('menu-home').hidden=show;$('mode-menu').hidden=!show;$('difficulty-menu').hidden=true;}
$('start-menu').onclick=()=>{showModes(true);$('solo-game').focus();};
$('mode-back').onclick=()=>{showModes(false);$('start-menu').focus();};
function startGame(mode,side='white',difficulty='casual'){
 rig.setSide(side);cancelBot();gameMode=mode;botDifficulty=getBotDifficulty(difficulty);
 $('solo-difficulty').hidden=mode!=='solo';
 $('solo-difficulty').textContent=botDifficulty.label;
 $('solo-difficulty').dataset.difficulty=botDifficulty.id;
 playing=true;document.body.classList.remove('in-menu');$('main-menu').hidden=true;
 store.reset();cameraMode('orbit');rig.home();
 document.querySelector('.live-label').textContent=mode==='solo'?'SOLO / VS THE EMBER KING':'LOCAL TWO-PLAYER';
 document.querySelector('.black h3').textContent=mode==='solo'?'The Ember King':'Obsidian dynasty';
 world.resize();rig.home({immediate:mode==='online'});$('pause-game').focus();
}
$('solo-game').onclick=()=>{$('mode-menu').hidden=true;$('difficulty-menu').hidden=false;$('playable-game').focus();};
$('difficulty-back').onclick=()=>{showModes(true);$('solo-game').focus();};
for(const id of ['playable','casual','devil'])$(id+'-game').onclick=()=>startGame('solo','white',id);
$('local-game').onclick=()=>startGame('local');
$('return-menu').onclick=async()=>{if(animator.busy)return;if(gameMode==='online'){try{await leaveOnline();}catch(error){toast(error.message);return;}}cancelBot();playing=false;$('pause-dialog').close();document.exitPointerLock?.();rig.keys.clear();rig.orbit.enabled=false;selected=null;moves=[];world.highlight(null,[],store.state);document.body.classList.add('in-menu');$('main-menu').hidden=false;showModes(false);world.resize();$('start-menu').focus();};
rig.orbit.enabled=false;
let preferences={};try{preferences=JSON.parse(localStorage.getItem('crown-settings')||'{}')||{};}catch{}
menuMotion=preferences.motion??!matchMedia('(prefers-reduced-motion: reduce)').matches;effects.muted=!(preferences.sound??false);
$('setting-sound').checked=!effects.muted;$('setting-motion').checked=menuMotion;
function saveSettings(){try{localStorage.setItem('crown-settings',JSON.stringify({sound:!effects.muted,motion:menuMotion}));}catch{}}
$('settings-menu').onclick=()=>$('settings-dialog').showModal();$('settings-close').onclick=()=>$('settings-dialog').close();
$('setting-sound').onchange=e=>{effects.muted=!e.target.checked;saveSettings();};$('setting-motion').onchange=e=>{menuMotion=e.target.checked;saveSettings();};
const toggleSound=$('sound').onclick;$('sound').onclick=()=>{toggleSound();$('setting-sound').checked=!effects.muted;saveSettings();};

for(const id of ['new-dialog','guide','settings-dialog'])$(id).addEventListener('close',scheduleBot);
// Dialogs can be opened by several menus; stop thinking whenever play pauses.
for(const dialog of document.querySelectorAll('dialog'))new MutationObserver(()=>{
 if(isPaused())cancelBot();
}).observe(dialog,{attributes:true,attributeFilter:['open']});

$('sound').setAttribute('aria-label',effects.muted?'Enable sound':'Mute sound');$('sound').innerHTML=effects.muted?'&#9835;<span class="mute-slash">/</span>':'&#9835;';

function isPaused(){return !!document.querySelector('dialog[open]');}
function pauseGame(){if(!playing||isPaused())return;cancelBot();document.exitPointerLock?.();rig.keys.clear();rig.orbit.enabled=false;$('pause-dialog').showModal();$('resume-game').focus();}
$('pause-game').onclick=pauseGame;
$('resume-game').onclick=()=>$('pause-dialog').close();
$('pause-dialog').addEventListener('close',()=>{rig.keys.clear();rig.orbit.enabled=playing&&rig.mode==='orbit';scheduleBot();});
window.addEventListener('keydown',e=>{if(e.code==='Escape'&&playing&&!isPaused()&&!e.repeat){e.preventDefault();pauseGame();}});
for(const id of ['home','orbit','fly']){const action=$(id).onclick;$(id).onclick=()=>{action();rig.orbit.enabled=false;};}
$('look').onclick=()=>{$('pause-dialog').close();rig.lock();};
window.addEventListener('resize',()=>{if((playing||multiplayerPreview)&&rig.mode==='orbit'){world.resize();rig.home();}});

function canPlayOnline(){return online.connected&&!online.pending&&!animator.busy&&online.room?.status==='playing'&&online.room?.players[online.uid]?.color===store.state.turn;}
async function sendOnline(action){if(!canPlayOnline())return;online.pending=true;refresh();try{await roomCommand('action',{action,revision:online.room.revision});}catch(error){toast(error.message);}finally{online.pending=false;refresh();}}
let appliedRevision=-1,appliedResignation=null,activeRoom=null,queuedRoom=null;
function receiveRoom(room){
  if(gameMode!=='online'||!playing||activeRoom!==online.code){startGame('online',room.players[online.uid]?.color);activeRoom=online.code;appliedRevision=-1;appliedResignation=null;}
  const me=room.players[online.uid];document.querySelector('.live-label').textContent='ONLINE / '+(me?.color==='white'?'IVORY':'OBSIDIAN');
  for(const p of Object.values(room.players))document.querySelector('.'+p.color+' h3').textContent=p.name;
  if(room.revision===appliedRevision&&(room.resigned||null)===appliedResignation)return;
  if(animator.busy){queuedRoom=room;return;}
  const next=JSON.parse(room.state),animate=appliedRevision>=0&&next.ply===store.state.ply+1;
  appliedRevision=room.revision;appliedResignation=room.resigned||null;selected=null;moves=[];store.state=next;store.snapshots=[];
  const finish=()=>{world.sync(next);animator.checkmate(next,()=>{refresh();if(queuedRoom){const room=queuedRoom;queuedRoom=null;receiveRoom(room);}});refresh();if(next.result)toast(next.result.winner?next.result.winner+' wins: '+next.result.reason:'Draw: '+next.result.reason);if(queuedRoom){const room=queuedRoom;queuedRoom=null;receiveRoom(room);}};
  if(animate){animator.move(next.history.at(-1),finish);refresh();}else finish();
}
mountOnline({onPreview:show=>{multiplayerPreview=show;playing=false;rig.keys.clear();rig.orbit.enabled=show;document.body.classList.toggle('in-menu',!show);$('main-menu').hidden=show;if(show){rig.setSide('white');cancelBot();document.exitPointerLock?.();cameraMode('orbit');store.reset();world.resize();rig.home({immediate:true});}else{$('multiplayer-menu').focus();}},onMatch:receiveRoom,onConnection:()=>refresh(),onExit:()=>{if(gameMode==='online'){playing=false;gameMode='local';document.body.classList.add('in-menu');$('main-menu').hidden=false;}}});
mountLanguage();
