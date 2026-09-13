import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|shader|WebGL/i.test(m.text()))errors.push(m.text());});
await page.goto('http://127.0.0.1:5173');await page.waitForSelector('#scene');await page.waitForTimeout(1800);
await mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/desktop.png',fullPage:true});
async function squarePoint(i){return page.evaluate(async i=>{const THREE=await import('/node_modules/three/build/three.module.js');const rect=document.getElementById('scene').getBoundingClientRect();const camera=new THREE.PerspectiveCamera(43,rect.width/rect.height,.1,100);camera.position.set(10,12.8,13.8);camera.lookAt(0,.3,0);camera.updateMatrixWorld();const p=new THREE.Vector3((i%8-3.5)*1.12,.43,(3.5-Math.floor(i/8))*1.12).project(camera);return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};},i);}
async function clickSquare(i){const p=await squarePoint(i);await page.mouse.click(p.x,p.y);}
await clickSquare(20);await page.waitForTimeout(100);if(!(await page.locator('#selection').innerText()).includes('Bia'))throw Error('Piece selection failed');
await clickSquare(28);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='01 MOVES')throw Error('White move failed');
await clickSquare(43);await clickSquare(35);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='02 MOVES')throw Error('Black move failed');
await clickSquare(28);await clickSquare(35);await page.waitForFunction(()=>!document.querySelector('#new-game').disabled);if(await page.locator('#move-number').innerText()!=='03 MOVES')throw Error('Capture failed');if(!(await page.locator('#white-captured').innerText()).includes('♙'))throw Error('Capture tray failed');
await page.locator('#undo').click();if(await page.locator('#move-number').innerText()!=='02 MOVES')throw Error('Undo failed');
await page.locator('#new-game').click();await page.locator('#confirm-new').click();if(await page.locator('#move-number').innerText()!=='00 MOVES')throw Error('Reset failed');
await page.locator('#rules').click();if(!await page.locator('#guide').isVisible())throw Error('Guide failed');await page.locator('.close').click();
await page.locator('#fly').click();await page.keyboard.down('KeyW');await page.waitForTimeout(350);await page.keyboard.up('KeyW');if(!await page.locator('#look').isVisible())throw Error('Free flight failed');await page.locator('#home').click();await page.waitForTimeout(1300);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(700);await page.screenshot({path:'artifacts/mobile.png',fullPage:true});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(overflow)throw Error('Mobile horizontal overflow');
await browser.close();if(errors.length)throw Error(errors.join('\n'));console.log('Browser passed: WebGL render, selection, both turns, cinematic capture, undo, reset, guide, free-flight controls, mobile layout.');
