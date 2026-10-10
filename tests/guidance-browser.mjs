import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {newGame,view} from '../server/engine.mjs';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const game=newGame([{name:'You'},{name:'Other'}],()=>.45);let revision=1;
 await page.addInitScript(()=>{sessionStorage.setItem('deal-session',JSON.stringify({code:'HELP23',token:'test-only'}));localStorage.removeItem('deal-tour-v1');localStorage.removeItem('deal-discard-help')});
 await page.route('**/api/rooms/HELP23',route=>route.fulfill({json:{code:'HELP23',you:0,revision,players:[{id:0,name:'You'},{id:1,name:'Other'}],game:view(game,0)}}));
 await page.goto(process.env.TEST_URL||'http://127.0.0.1:8793');await page.locator('#guideDialog[open] #lessonNext').waitFor();
 game.pending={kind:'payment',label:'Debt Collector',amount:5,actor:1,target:0,responder:0,queue:[0],stage:'response',blocked:false};revision++;
 await page.locator('#acceptAction').waitFor();assert.equal(await page.locator('#guideDialog').isVisible(),false,'Incoming action preempts tutorial');assert.equal(await page.locator('#modal').isVisible(),true);
 await page.locator('#modal .modal-close').click();game.pending=null;game.phase='discard';game.players[0].hand.push(game.deck.pop(),game.deck.pop());revision++;
 await page.locator('#understood').waitFor();assert.match(await page.locator('#guideContent').innerText(),/Click 2 card/);await page.locator('#understood').click();
 await page.locator('#backgroundButton').click();await page.locator('#tipsSetting').uncheck();await page.locator('#guideClose').click();assert.equal(await page.locator('#coachBar').isVisible(),false);
 await page.locator('#tourButton').click();await page.locator('#lessonNext').waitFor();await page.locator('#guideClose').press('Escape');assert.equal(await page.locator('#guideDialog').isVisible(),false);
 assert.deepEqual(errors,[]);console.log('Guidance checks passed: first-run tutorial, incoming-action priority, discard popup, hints toggle, replay and Escape.');
}finally{await browser.close()}
