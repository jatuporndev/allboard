import {online,connect,saveCharacter,command,browse,watchRoom,leave,cleanup} from './online.js';
import './room-hall.css';
const emblems={crown:'♛',flame:'♜',moon:'☾'};
export function mountOnline({onMatch,onConnection,onExit,onPreview}){
  document.querySelector('#app').insertAdjacentHTML('beforeend',`<section id="multiplayer-stage" class="room-hall" hidden aria-label="Multiplayer">
    <button id="multiplayer-exit">← <span>Back</span></button>
    <div class="hall-heading"><div class="eyebrow">THE SANCTUARY · ONLINE</div><h1>Multiplayer</h1><p>Choose your rival. Write your legend.</p></div>
    <p id="hall-message" role="status" aria-live="polite"></p>
    <div class="hall-panels">
      <section class="hall-panel hall-create" aria-labelledby="create-title"><div class="hall-emblem" aria-hidden="true">♛</div><h2 id="create-title">Create Room</h2><p>Open your chamber to rivals or invite a friend.</p>
        <form id="create-room-form"><label for="room-name">Room name</label><div class="room-name-field"><input id="room-name" maxlength="40" required autocomplete="off" spellcheck="false"><button id="random-room-name" type="button" aria-label="Generate another room name">↻</button></div>
        <div class="hall-visibility" role="group" aria-label="Room visibility"><button type="button" data-visibility="public" aria-pressed="true">Public</button><button type="button" data-visibility="private" aria-pressed="false">Private</button></div>
        <div class="hall-game"><span aria-hidden="true">♜</span><div><strong>Makruk</strong><small>Thai chess · 2 players</small></div></div><button id="confirm-create-room" type="submit" class="menu-primary">Create Room</button></form>
      </section>
      <section class="hall-panel hall-join" aria-labelledby="join-title"><h2 id="join-title">Join by Code</h2><p>A friend's invitation opens the gate.</p><form id="join-room-form"><label for="private-room-code">Private room code</label><div class="hall-code-field"><input id="private-room-code" maxlength="12" minlength="12" required pattern="[a-fA-F0-9]{12}" placeholder="Private room code" autocomplete="off" spellcheck="false"><button type="submit" class="menu-primary">Join Room</button></div></form></section>
      <section class="hall-panel hall-public" aria-labelledby="public-title"><div class="hall-public-heading"><div><h2 id="public-title">Find Public Rooms</h2><p>Your next rival awaits.</p></div><button id="refresh-rooms" aria-label="Refresh rooms">↻</button></div><div id="public-room-list" aria-live="polite"><p>Calling the sanctuary…</p></div></section>
    </div>
  </section>`);
  document.querySelector('#app').insertAdjacentHTML('beforeend',`<dialog id="online-menu" aria-labelledby="online-title"><div class="eyebrow">THE SANCTUARY · ONLINE</div><h2 id="online-title">Gather your rivals</h2><p id="online-message" role="status" aria-live="polite"></p><div id="online-content"></div><button id="online-back">Return to sanctuary</button></dialog>`);
  const dialog=document.querySelector('#online-menu'),content=document.querySelector('#online-content'),message=document.querySelector('#online-message');
  const stage=document.querySelector('#multiplayer-stage');
  const hallMessage=document.querySelector('#hall-message');
  let stopBrowse,working=false,screen='hub',showCode=false,afterCharacter=null,discoveryVersion=0;
  const error=e=>{(dialog.open?message:hallMessage).textContent=e.message?.replace(/^Firebase: /,'')||'The sanctuary is unreachable. Please try again.';};
  async function task(fn){if(working)return;working=true;message.textContent=hallMessage.textContent='Calling the sanctuary…';content.inert=true;stage.querySelector('.hall-panels').inert=true;try{await fn();message.textContent=hallMessage.textContent='';}catch(e){error(e);}finally{working=false;content.inert=false;stage.querySelector('.hall-panels').inert=false;}}
  function button(text,fn,parent=content){const b=document.createElement('button');b.textContent=text;b.onclick=()=>task(fn);parent.append(b);return b;}
  function clear(title){stopBrowse?.();stopBrowse=null;content.replaceChildren();document.querySelector('#online-title').textContent=title;}
  function character(){screen='character';clear('Forge your legend');content.innerHTML=`<div class="character-seal" aria-hidden="true">♛</div><label for="character-name">Your name in the chronicles</label><input id="character-name" maxlength="24" autocomplete="nickname" placeholder="Name your champion"><div class="emblem-choices" role="group" aria-label="Choose an emblem"></div>`;
    let emblem=online.profile?.emblem||'crown';content.querySelector('input').value=online.profile?.name||'';
    const choices=content.querySelector('.emblem-choices');
    for(const [key,symbol]of Object.entries(emblems)){const b=button(`${symbol} ${key}`,()=>{emblem=key;content.querySelector('.character-seal').textContent=symbol;choices.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));},choices);b.setAttribute('aria-pressed',String(key===emblem));}
    button('Bind your character',async()=>{const name=content.querySelector('input').value.trim();if(!name)throw Error('Give your champion a name.');await saveCharacter({name,emblem});const next=afterCharacter;afterCharacter=null;if(next)await next();else hub();}).className='menu-primary';
  }
  function hub(){boardHub();}
  async function create(visibility,name){const result=await command('create',{visibility,name,character:online.profile});enter(result.code);}
  async function join(code){await command('join',{code,character:online.profile});enter(code);}
  function enter(code){showCode=false;stopBrowse?.();showPanel();watchRoom(code,room=>{
      if(!room||room.status==='closed'||room.expiresAt<Date.now()){cleanup();onExit();if(!dialog.open)dialog.showModal();hub();message.textContent='The host closed this room, or it expired.';return;}
      if(room.status==='playing'||room.status==='finished'){stage.hidden=true;document.body.classList.remove('multiplayer-preview');dialog.close();onMatch(room);return;}lobby(room);
    },connected=>{onConnection(connected);if(!connected)message.textContent='Connection lost. Reconnecting…';else message.textContent='';},error);}
  function lobby(room){screen='lobby';clear('The waiting chamber');
    if(room.name){const name=document.createElement('p');name.className='lobby-room-name';name.translate=false;name.textContent=room.name;content.append(name);}
    for(const [uid,p]of Object.entries(room.players)){const card=document.createElement('div');card.className='lobby-player';const seal=document.createElement('span');seal.className='portrait-seal';seal.textContent=emblems[p.emblem];const label=document.createElement('span');label.textContent=`${p.name} · ${p.color==='white'?'Ivory':'Obsidian'}${uid===room.host?' · Host':''} — ${p.ready?'Ready':'Preparing'}${online.presence?.[uid]?'':' · Away'}`;card.append(seal,label);content.append(card);}
    if(Object.keys(room.players).length<2){const empty=document.createElement('p');empty.textContent='An empty throne awaits your rival…';content.append(empty);}
    if(room.visibility==='private'){const code=document.createElement('p');code.className='room-code';code.textContent=showCode?online.code:'•••• •••• ••••';content.append(code);button(showCode?'Hide room code':'Show room code',()=>{showCode=!showCode;lobby(room);});button('Copy invitation code',async()=>{await navigator.clipboard.writeText(online.code);});}
    const me=room.players[online.uid];button(me.ready?'Stand down':'I am ready',()=>command('ready',{ready:!me.ready}));
    if(room.host===online.uid)button('Begin the match',()=>command('start')).disabled=Object.keys(room.players).length!==2||!Object.values(room.players).every(p=>p.ready);
    button('Leave room',async()=>{await leave();hub();});
  }
  function showPanel(){if(!dialog.open)dialog.showModal();}
  async function discover(){
    const version=++discoveryVersion;stopBrowse?.();stopBrowse=null;
    const list=document.querySelector('#public-room-list');list.innerHTML='<p>Calling the sanctuary…</p>';
    try{await connect();if(stage.hidden||version!==discoveryVersion)return;
      stopBrowse=browse(rooms=>{list.replaceChildren();
        if(!rooms.length){list.innerHTML='<div class="hall-empty"><span aria-hidden="true">◇</span><strong>No rooms yet</strong><p>Create a room and invite your first rival.</p></div>';return;}
        for(const [code,room] of rooms){const row=document.createElement('button');row.className='hall-room';
          const icon=document.createElement('span');icon.textContent='♜';icon.className='hall-room-icon';
          const name=document.createElement('strong');name.translate=false;name.textContent=room.name;
          const seats=document.createElement('small');seats.textContent=room.players+'/2';
          row.append(icon,name,seats);row.onclick=()=>task(()=>withCharacter(()=>join(code)));list.append(row);
        }
      },e=>{if(version===discoveryVersion){list.innerHTML='<p>Unable to load rooms. Try refreshing.</p>';error(e);}});
    }catch(e){if(version===discoveryVersion){list.innerHTML='<p>Unable to load rooms. Try refreshing.</p>';error(e);}}
  }
  function boardHub(){screen='hub';dialog.close();stage.hidden=false;document.body.classList.add('multiplayer-preview');onPreview(true);hallMessage.textContent='';discover();}
  async function withCharacter(next){await connect();if(!online.profile){afterCharacter=next;showPanel();character();}else await next();}
  let visibility='public';const roomName=document.querySelector('#room-name');
  function randomName(){roomName.value='room-'+String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');}
  randomName();document.querySelector('#random-room-name').onclick=randomName;
  stage.querySelectorAll('[data-visibility]').forEach(button=>button.onclick=()=>{visibility=button.dataset.visibility;stage.querySelectorAll('[data-visibility]').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));});
  document.querySelector('#create-room-form').onsubmit=e=>{e.preventDefault();const name=roomName.value.trim();task(async()=>{if(!name)throw Error('Give your room a name.');await withCharacter(()=>create(visibility,name));});};
  document.querySelector('#join-room-form').onsubmit=e=>{e.preventDefault();const code=document.querySelector('#private-room-code').value.trim().toUpperCase();task(()=>withCharacter(()=>join(code)));};
  document.querySelector('#refresh-rooms').onclick=discover;
  async function open(edit=false){if(!edit){boardHub();return;}showPanel();await task(async()=>{await connect();character();});}
  document.querySelector('#multiplayer-exit').onclick=()=>{discoveryVersion++;stopBrowse?.();stopBrowse=null;stage.hidden=true;document.body.classList.remove('multiplayer-preview');onPreview(false);};
  document.querySelector('#character-menu').onclick=()=>open(true);document.querySelector('#multiplayer-menu').onclick=()=>open();
  document.querySelector('#online-back').onclick=()=>task(async()=>{if(online.code)await leave();afterCharacter=null;if(stage.hidden)dialog.close();else hub();});
  dialog.addEventListener('cancel',e=>{e.preventDefault();document.querySelector('#online-back').click();});dialog.addEventListener('close',()=>{stopBrowse?.();stopBrowse=null;});
  return {error};
}
