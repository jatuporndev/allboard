// Preserve one set of gameplay controls and move them into the immersive HUD.
export function mountHUD(){
 const $=s=>document.querySelector(s),arena=$('.arena');
 arena.insertAdjacentHTML('beforeend',`<div class="battle-hud" aria-label="Match status"><div class="hud-player ivory"></div><div class="hud-turn" role="status" aria-live="polite"></div><div class="hud-player obsidian"></div></div><button id="pause-game" aria-label="Pause game" aria-haspopup="dialog"><span>Ⅱ</span><small>MENU</small></button>`);
 $('.ivory').append($('.player.white'));$('.obsidian').append($('.player.black'));$('.hud-turn').append($('.turn-card'));arena.append($('#selection'));
 $('#app').insertAdjacentHTML('beforeend',`<dialog id="pause-dialog" aria-labelledby="pause-title"><div class="pause-heading"><div class="eyebrow">CROWN OF EMBERS</div><h2 id="pause-title">A moment of stillness</h2><p>The kingdoms await your return.</p></div><button id="resume-game" class="menu-primary">Resume game <span>⟶</span></button><div class="pause-columns"><section class="pause-controls" aria-label="Match controls"><h3>The match</h3><div class="pause-match-actions"></div><h3>The sanctuary</h3><div class="pause-world-actions"></div></section><section class="pause-chronicle" aria-label="Move chronicle"><div class="pause-captures"><div><span>IVORY CAPTURES</span></div><div><span>OBSIDIAN CAPTURES</span></div></div></section></div><div class="pause-footnote">ESC TO RESUME <span>STRATEGY, CARVED IN STONE</span></div></dialog>`);
 $('.pause-match-actions').append($('.actions'),$('#count'),$('#accept-draw'),$('#rules'),$('#return-menu'));
 $('.pause-world-actions').append($('.view-tools'),$('.camera-bar'));
 $('.pause-captures>div:first-child').append($('#white-captured'));$('.pause-captures>div:last-child').append($('#black-captured'));
 $('.pause-chronicle').append($('.history-heading'),$('#history'));
 $('#home').innerHTML='⌂ <span>Reset view</span>';$('#fullscreen').innerHTML='⛶ <span>Fullscreen</span>';
 $('.topbar').remove();$('.sidebar').remove();$('.scene-bottom').remove();$('.scene-title').remove();
}
