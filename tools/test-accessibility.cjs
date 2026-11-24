// Read-only accessibility regression checks. Requires an existing playwright-core and axe-core.
// Blocks third-party requests except public font downloads; Supabase responses are mocked.
// PLAYWRIGHT_MODULE=/path/to/playwright-core AXE_PATH=/path/to/axe.min.js node tools/test-accessibility.cjs
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
const fs = require('fs'), path = require('path');
const root=path.resolve(__dirname, '..');
const axePath=process.env.AXE_PATH;
if (!axePath) throw new Error('Set AXE_PATH to a local axe-core 4.10.3 axe.min.js');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage();
 let mockStatus = null;
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.route('**/*',async r=>{
 const u=new URL(r.request().url());
 if(['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)) return r.continue();
 if(u.hostname.endsWith('.supabase.co') && mockStatus) return r.fulfill({status:mockStatus,contentType:'application/json',body:mockStatus===201?'{}':'{"error":"simulated"}'});
 if(u.hostname!=='audit.test') return r.abort();
 let f=path.join(root,decodeURIComponent(u.pathname));
 if(fs.existsSync(f)&&fs.statSync(f).isDirectory()) f=path.join(f,'index.html');
 if(!fs.existsSync(f)) f+='.html';
 if(!fs.existsSync(f)) return r.fulfill({status:404,body:'Not found'});
 const ext=path.extname(f); return r.fulfill({body:fs.readFileSync(f),contentType:({'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'})[ext]||'application/octet-stream'});
 });
 const results=[];
 async function scan(label) {
  await page.evaluate(async()=>{await document.fonts.ready; await Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{})));});
  if(!await page.evaluate(()=>!!window.axe)) await page.addScriptTag({path:axePath});
  const a=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
  const v=a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));
  results.push({route:label,violations:v});
 }
 const assert=require('assert/strict');

 for(const route of ['/','/quienes-somos','/comunidad','/privacidad','/en/','/en/about','/en/community','/en/privacy','/hello','/diagnostico/']){
 await page.goto('http://audit.test'+route); await page.addScriptTag({path:axePath});
 const a=await page.evaluate(async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa','wcag22aa']}}));
 results.push({route,violations:a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
 }

 await page.goto('http://audit.test/diagnostico/');
 await page.locator('#start').focus(); await page.keyboard.press('Enter');
 for(let i=0;i<13;i++) {
  assert.equal(await page.locator('h2.q').evaluate(el=>el===document.activeElement),true,'question focus '+i);
  await scan('diagnostico/question-'+(i+1));
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.classList.contains('option')),true);
  await page.keyboard.press('Enter');
 }
 assert.equal(await page.locator('h1.claim').evaluate(el=>el===document.activeElement),true);
 await scan('diagnostico/result');
 await page.locator('#optin button[type=submit]').click(); assert.equal(await page.evaluate(()=>document.activeElement.id),'email');
 await page.locator('#email').fill('audit@example.com');
 await page.locator('#optin button[type=submit]').click(); assert.equal(await page.evaluate(()=>document.activeElement.id),'btype');
 await page.locator('#btype').selectOption({index:1}); await page.locator('#invest').selectOption({index:1});
 mockStatus=500; await page.locator('#optin button[type=submit]').click(); await page.locator('#stubnote').filter({hasText:'Algo se rompió'}).waitFor();
 assert.equal(await page.locator('#optin button[type=submit]').isEnabled(),true);
 mockStatus=201; await page.locator('#optin button[type=submit]').click(); await page.locator('#agenda').waitFor();
 assert.equal(await page.evaluate(()=>document.activeElement.id),'agenda'); await scan('diagnostico/success');
 mockStatus=null;
 await page.locator('#restart').click(); assert.equal(await page.locator('h1').evaluate(el=>el===document.activeElement),true);
 for(const route of ['/','/en/','/comunidad','/en/community','/hello']) {
  await page.goto('http://audit.test'+route);
  await page.locator('form button[type=submit]').click();
  assert.ok(['email','pOrg'].includes(await page.evaluate(()=>document.activeElement.id)),route+' invalid focus');
 }
 for(const width of [320,375,640,1280]) {
  await page.setViewportSize({width,height:800});
  for(const route of ['/','/en/','/comunidad','/en/community','/quienes-somos','/en/about','/privacidad','/en/privacy','/hello','/diagnostico/']) {
   await page.goto('http://audit.test'+route); await scan(route+' width '+width);
   const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0 && s.position!=='absolute' && (r.right>innerWidth+2 || r.left < -2) && !el.closest('svg') && !el.matches('.skip-link,.rc');}).map(el=>({tag:el.tagName,cls:el.className})).slice(0,15));
   if(overflow.length) results.push({route,width,overflow});
  }
 }
 await page.setViewportSize({width:375,height:800}); await page.goto('http://audit.test/');
 await page.locator('.menu-btn').click(); await page.locator('#menu-panel a').first().focus(); await page.keyboard.press('Escape');
 assert.equal(await page.locator('.menu-btn').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('.menu-btn').evaluate(el=>el===document.activeElement),true);
 await page.clock.install(); await page.goto('http://audit.test/'); await page.clock.fastForward(11000);
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await page.locator('.pop-diag.abierto').waitFor(); await scan('popup/mobile');
 await page.locator('.pop-x').focus(); await page.keyboard.press('Escape'); await page.clock.fastForward(500);
 assert.equal(await page.locator('.pop-diag').count(),0); assert.equal(await page.evaluate(()=>document.activeElement.tagName),'MAIN');
 await page.screenshot({path:'/tmp/kapuy-mobile-corrected.png',fullPage:true});
 console.log('Keyboard, invalid form focus, restart and popup checks passed');
 fs.writeFileSync('/tmp/kapuy-audit-'+(process.argv[2]||'baseline')+'.json',JSON.stringify(results,null,2)); console.log(JSON.stringify(results,null,2)); await browser.close();
 assert.equal(results.filter(r=>(r.violations||[]).length || (r.overflow||[]).length).length,0,'Accessibility or overflow findings remain');
})();
