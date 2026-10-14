import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const url=process.env.TEST_URL||'http://127.0.0.1:8790',dir=process.env.SCREENSHOT_DIR||'test-results';await mkdir(dir,{recursive:true});
try{
 for(const [name,width,height,mobile] of [['laptop',1440,900,false],['phone',390,844,true]]){
  const page=await browser.newPage({viewport:{width,height},isMobile:mobile,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  console.log(name+': loading');await page.goto(url,{waitUntil:'domcontentloaded'});console.log(name+': starting');await page.locator('#practice').click();await page.locator('#hand .card').last().waitFor();console.log(name+': hand ready');if(await page.locator('#guideDialog[open]').count())await page.locator('#guideClose').click();
  const layout=await page.evaluate(()=>{const scene=document.querySelector('#sceneWrap').getBoundingClientRect(),turn=document.querySelector('#turnBar').getBoundingClientRect(),hand=document.querySelector('.hand-area').getBoundingClientRect(),cards=[...document.querySelectorAll('#hand .card')].map(e=>e.getBoundingClientRect());return {scene:{top:scene.top,bottom:scene.bottom,height:scene.height},turn:{top:turn.top,bottom:turn.bottom},hand:{top:hand.top,bottom:hand.bottom},cards:cards.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom})),bodyOverflow:getComputedStyle(document.body).overflow,scrollWidth:document.documentElement.scrollWidth,innerWidth}});
  assert.ok(layout.scene.height>height*.65,`${name}: larger board fills the game screen`);assert.ok(layout.turn.bottom<=height+1&&layout.hand.bottom<=height+1,`${name}: controls remain in viewport`);assert.equal(layout.scrollWidth<=layout.innerWidth,true,`${name}: no horizontal page overflow`);assert.equal(layout.bodyOverflow,'hidden',`${name}: game screen is locked without vertical scrolling`);
  assert.ok(layout.cards.length>=5,`${name}: hand rendered`);assert.ok(layout.cards.at(-1).right<=width+1&&layout.cards[0].left>=-1&&layout.cards.every(card=>card.bottom<=height+1),`${name}: complete stacked hand fits the viewport`);assert.match(await page.locator('#bankTotal').innerText(),/^Bank · \d+M$/,`${name}: live bank total is visible`);
  console.log(name+': layout checked');await page.locator('#hand .card').last().click();await page.locator('#modal').waitFor({state:'visible'});const inspected=await page.locator('.inspect>.card').boundingBox();assert.ok(inspected.width>=(mobile?200:240),`${name}: card inspector is large and readable`);await page.locator('#modal .modal-close').click();
  await page.screenshot({path:`${dir}/deal-${name}-rack.png`,fullPage:false});assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Layout checks passed: one-screen board, stacked hand, in-view controls, large card inspector, phone and laptop.');
}finally{await browser.close()}
