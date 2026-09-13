import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5173');
  await page.waitForFunction(()=>document.documentElement.lang==='th'&&document.querySelector('#start-menu')?.textContent.includes('เริ่มเกม'));
  await page.locator('#settings-menu').click();
  assert.equal(await page.locator('[data-language=th]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-language=en]').click();
  assert.equal(await page.locator('#settings-dialog h2').textContent(),'Settings');
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  await page.reload();await page.waitForSelector('#settings-menu');
  assert.ok((await page.locator('#start-menu').textContent()).includes('Start Game'));
  await page.locator('#settings-menu').click();await page.locator('[data-language=th]').click();
  await page.screenshot({path:'artifacts/settings-th-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.locator('#settings-close').click();await page.locator('#start-menu').click();await page.locator('#local-game').click();
  await page.waitForFunction(()=>document.querySelector('#turn-title').textContent==='ตาฝ่ายขาว');
  await page.locator('#pause-game').click();assert.equal(await page.locator('#pause-title').textContent(),'พักศึกชั่วคราว');
  assert.deepEqual(errors,[]);
  console.log('Language checks passed: Thai default, English switch, persistence, Thai HUD, mobile settings.');
}finally{await browser.close();}
