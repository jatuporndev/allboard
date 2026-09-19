import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await page.addInitScript(()=>localStorage.setItem('crown-language','en'));
await page.addInitScript(()=>{
 const NativeWorker=window.Worker;
 window.botSearches=[];
 window.Worker=class extends NativeWorker{
  constructor(url,options){
   super(url,options);
   if(String(url).includes('bot-worker')){this.record={active:true};window.botSearches.push(this.record);}
  }
  terminate(){if(this.record)this.record.active=false;super.terminate();}
 };
});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
await page.goto('http://127.0.0.1:5173');await page.waitForSelector('#scene');await page.waitForTimeout(1800);
await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
await page.locator('#start-menu').click();await page.locator('#local-game').click();await page.waitForTimeout(1400);
if(await page.locator('.topbar').count()||await page.locator('.sidebar').count())throw Error('Website chrome remains');if(await page.locator('#history').isVisible()||await page.locator('#new-game').isVisible())throw Error('Secondary controls exposed');
async function squarePoint(i){return page.evaluate(async i=>{const THREE=await import('/node_modules/three/build/three.module.js');const rect=document.getElementById('scene').getBoundingClientRect();const camera=new THREE.PerspectiveCamera(43,rect.width/rect.height,.1,100);if(camera.aspect<.8)camera.position.set(0,Math.max(22,12/camera.aspect),9);else camera.position.set(10,12.8,13.8).multiplyScalar(Math.max(1,.95/camera.aspect));camera.lookAt(0,.3,0);camera.updateMatrixWorld();const p=new THREE.Vector3((i%8-3.5)*1.12,.43,(3.5-Math.floor(i/8))*1.12).project(camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};},i);}
async function clickSquare(i){const p=await squarePoint(i);await page.mouse.click(p.x,p.y);}
await clickSquare(20);await page.waitForTimeout(100);if(!(await page.locator('#selection').innerText()).includes('Bia'))throw Error('Piece selection failed');
await clickSquare(28);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='01 MOVES')throw Error('White move failed');
await clickSquare(43);await clickSquare(35);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='02 MOVES')throw Error('Black move failed');
await clickSquare(28);await clickSquare(35);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='03 MOVES')throw Error('Capture failed');if(!(await page.locator('#white-captured').innerText()).includes('♙'))throw Error('Capture tray failed');
await page.locator('#pause-game').click();await page.locator('#undo').click();if(await page.locator('#move-number').innerText()!=='02 MOVES')throw Error('Undo failed');
await page.locator('#new-game').click();await page.locator('#confirm-new').click();if(await page.locator('#move-number').innerText()!=='00 MOVES')throw Error('Reset failed');
await page.locator('#rules').click();if(!await page.locator('#guide').isVisible())throw Error('Guide failed');await page.locator('.close').click();
await page.locator('#fly').click();await page.locator('#resume-game').click();await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');await page.locator('#pause-game').click();if(!await page.locator('#look').isVisible())throw Error('Free flight failed');await page.locator('#home').click();await page.locator('#resume-game').click();await page.waitForTimeout(1300);await page.screenshot({path:'artifacts/hud-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1400);await page.screenshot({path:'artifacts/mobile.png',fullPage:true});await page.locator('#pause-game').click();await page.screenshot({path:'artifacts/pause-mobile.png'});await page.locator('#resume-game').click();const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile horizontal overflow');
if(!await page.locator('#pause-dialog').isVisible())await page.locator('#pause-game').click();await page.locator('#return-menu').click();await page.locator('#start-menu').click();await page.locator('#solo-game').click();await page.waitForTimeout(1400);
await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(1400);
await clickSquare(20);await clickSquare(28);await page.locator('#pause-game').click();await page.waitForTimeout(1800);if(await page.locator('#move-number').innerText()!=='01 MOVES')throw Error('Bot moved while paused');await page.screenshot({path:'artifacts/pause-desktop.png'});await page.keyboard.press('Escape');
await page.waitForFunction(()=>window.botSearches.some(s=>s.active),{},{timeout:20000});
await page.locator('#pause-game').click();
if(await page.evaluate(()=>window.botSearches.some(s=>s.active)))throw Error('Paused search worker is still active');
await page.waitForTimeout(2000);
if(await page.locator('#move-number').innerText()!=='01 MOVES')throw Error('Cancelled search moved a piece');
await page.keyboard.press('Escape');
await page.waitForFunction(()=>document.querySelector('#move-number').textContent==='02 MOVES'&&!document.querySelector('#new-game').disabled,{},{timeout:20000});
await page.locator('#pause-game').click();await page.locator('#undo').click();if(await page.locator('#move-number').innerText()!=='00 MOVES')throw Error('Solo undo failed');
if(!await page.locator('#pause-dialog').isVisible())await page.locator('#pause-game').click();await page.locator('#return-menu').click();if(!await page.locator('#multiplayer-menu').isEnabled()||!await page.locator('#character-menu').isEnabled())throw Error('Online menus unavailable');
await page.locator('#settings-menu').click();await page.locator('#setting-motion').uncheck();await page.locator('#settings-close').click();
await page.screenshot({path:'artifacts/menu-desktop.png'});
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/menu-mobile.png'});
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Menu overflow');
await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log('Browser passed: fullscreen HUD, pause/resume, paused bot, local and solo moves, capture, undo, reset, guide, camera controls, mobile layout.');
