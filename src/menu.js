export function mountMenu(){
 document.body.classList.add('in-menu');
 document.querySelector('#app').insertAdjacentHTML('beforeend',`
 <section id="main-menu" aria-label="Main menu">
  <div class="menu-border"></div><div class="menu-top">A GAME OF KINGS <span>THE SANCTUARY · I</span></div>
  <div class="menu-content">
   <svg class="crest" viewBox="0 0 120 120" aria-label="Crown of Embers crest" role="img"><path d="M60 3 108 31v57l-48 29L12 88V31Z M60 13 99 36v47l-39 24-39-24V36Z"/><path d="m30 44 14 13 16-30 16 30 14-13-7 35H37Z M36 86h48 M45 94h30"/><path d="m60 45-7 19 7 10 7-10Z"/></svg>
   <div class="menu-kicker">AN ANCIENT RIVALRY. REAWAKENED.</div>
   <h1>Crown<span>of</span>Embers</h1><div class="menu-subtitle">THE MAKRUK CHRONICLES</div>
   <p class="menu-verse">Kingdoms fall. The fire remembers.</p>
   <div id="menu-home" class="menu-options"><button id="start-menu" class="menu-primary">Start Game <span>⟶</span></button><button id="character-menu">Create Character <small>YOUR LEGEND</small></button><button id="multiplayer-menu">Multiplayer <small>ONLINE</small></button><button id="settings-menu">Settings <span>⚙</span></button></div>
   <div id="mode-menu" class="menu-options" hidden><div class="menu-kicker">CHOOSE YOUR OPPONENT</div><button id="solo-game" class="menu-primary">Solo <small>VS BOT</small></button><button id="local-game">Local 2 Player <small>SHARED DEVICE</small></button><button id="mode-back" class="menu-back">← Back</button></div>
   <div id="difficulty-menu" class="menu-options" role="group" aria-labelledby="difficulty-title" hidden>
    <div id="difficulty-title" class="menu-kicker">CHOOSE YOUR CHALLENGE</div>
    <button id="casual-game" class="difficulty-card casual-card"><strong>Casual</strong><small>5/10</small><span>A thoughtful rival. Room to learn.</span></button>
    <button id="devil-game" class="difficulty-card devil-card"><strong>Devil</strong><small>10/10</small><span>Deeper calculation. A tougher fight.</span><em>Takes more time to think.</em></button>
    <button id="difficulty-back" class="menu-back">← Back</button>
   </div>
  </div><div class="menu-bottom"><span>หมากรุกไทย · THE ART OF THAI CHESS</span><span>STRATEGY, CARVED IN STONE</span></div>
 </section>
 <dialog id="settings-dialog"><div class="eyebrow">SHAPE YOUR SANCTUARY</div><h2>Settings</h2><label class="setting-row">Battle sounds <input id="setting-sound" type="checkbox"></label><label class="setting-row">Cinematic menu motion <input id="setting-motion" type="checkbox" checked></label><p>Sound accompanies moves and captures. Your preferences are saved on this device.</p><button id="settings-close" class="menu-primary">Return</button></dialog>`);
 document.querySelector('.brand').innerHTML='<span class="brand-mark">♜</span><span>CROWN OF EMBERS<small>THE MAKRUK CHRONICLES</small></span>';
 document.querySelector('.brand').removeAttribute('href');
 document.querySelector('nav').insertAdjacentHTML('afterbegin','<button id="return-menu">Main menu</button>');
 document.title='Crown of Embers — The Makruk Chronicles';
}
