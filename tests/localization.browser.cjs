/* Optional real-browser suite: NODE_PATH=<playwright installation>/node_modules node tests/localization.browser.cjs */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const {pathToFileURL} = require('node:url');
const root = path.join(__dirname, '..');
const classes = ['druid','hunter','mage','paladin','priest','rogue','shaman','warlock','warrior'];
const shots = process.env.FT_SCREENSHOTS || path.join(os.tmpdir(), 'forever-localization-shots');
fs.mkdirSync(shots, {recursive:true});
const errors = [], remoteRequests = [];
let checks = 0;
const settle = page => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
async function audit(page) {
  await settle(page);
  const leaks = await page.evaluate(() => {
    const allowed = /HTML|Forever|Talents|WORLD|OF|WARCRAFT|WOW|FOREVER|WoW|GitHub|Blizzard|Entertainment|Warcraft|CLASSIC|EN|RU|Shift|Alt|Tab|Enter|Space|Minus|Backspace|Escape|Ctrl|Command|WFD\d|WFS\d|WFM\d|WFP\d|WFPR\d|WFWL\d|WFH\d|WFR\d|WF\d|C/g;
    const english = value => /[A-Za-z]/.test(value.replace(allowed,''));
    const values = [];
    const walker = document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.parentElement.closest('script,style,noscript,textarea,code') && english(node.nodeValue)) values.push(node.nodeValue.trim());
    }
    for(const element of document.querySelectorAll('[aria-label],[title],[alt],meta[name="description"]')) for(const attr of ['aria-label','title','alt','content']) {
      const value=element.getAttribute(attr); if(value && english(value)) values.push(attr+': '+value);
    }
    return [...new Set(values)];
  });
  assert.deepEqual(leaks, [], `${page.url()}: untranslated text`);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),true,`${page.url()}: horizontal overflow`);
  checks++;
}
(async () => {
  const server = http.createServer((req,res) => {
    const url = new URL(req.url,'http://localhost');
    if (!url.pathname.startsWith('/ForeverTalents/')) {res.writeHead(404);res.end();return;}
    const relative = decodeURIComponent(url.pathname.slice('/ForeverTalents/'.length));
    const file = path.join(root,relative || 'index.html');
    if(!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return;}
    try {
      const data = fs.readFileSync(file);
      const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf'}[path.extname(file)] || 'application/octet-stream';
      res.writeHead(200,{'Content-Type':type+'; charset=utf-8'});res.end(data);
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({executablePath:process.env.FT_BROWSER,headless:true});
    const base = `http://127.0.0.1:${server.address().port}/ForeverTalents/`;
    for(const mobile of [false,true]) {
      const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:1000},isMobile:mobile,hasTouch:mobile});
      const page = await context.newPage();
      page.on('pageerror',error=>errors.push(error.message));
      page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith(base))remoteRequests.push(request.url());});
      await page.goto(base);
      assert.equal(await page.locator('html').getAttribute('lang'),'en');
      await page.locator('[data-locale="ru"]').click();
      await audit(page);
      await page.screenshot({path:path.join(shots,`home-${mobile?'mobile':'desktop'}.png`),fullPage:true});
      await page.locator('a[href*="racials.html"]').first().click();
      await audit(page);
      await page.selectOption('#class-filter','mage');
      await page.selectOption('#faction-filter','horde');
      await audit(page);
      assert.match(await page.locator('#filter-summary').innerText(),/рас/);
      assert.match(page.url(),/class=mage/); assert.match(page.url(),/lang=ru/);
      await page.locator('[data-locale="en"]').click();
      assert.match(await page.locator('#filter-summary').innerText(),/races/);
      await page.locator('[data-locale="ru"]').click();
      await page.locator('#clear-filters').click();
      await audit(page);
      for(const cls of classes) {
        await page.goto(base+`talents/${cls}.html?lang=ru`);
        await audit(page);
        const initial = await page.evaluate(()=>engine.encode(state));
        const first = page.locator('.talent').first();
        if(mobile) {await first.tap();assert.equal(await page.evaluate(()=>engine.encode(state)),initial);await page.locator('#tip-add').tap();}
        else {await first.focus();await page.keyboard.press('Enter');}
        await audit(page);
        assert.equal(await page.evaluate(()=>engine.total(state)),1);
        assert.equal(await page.locator('#tree-spent-0').innerText(), '1 очко');
        assert.equal(await page.locator('#tree-spent-1').innerText(), '0 очков');
        const code = await page.evaluate(()=>engine.encode(state));
        await page.locator('[data-locale="en"]').click();
        assert.equal(await page.evaluate(()=>engine.encode(state)),code);
        assert.match(await first.getAttribute('aria-label'),/rank 1 of/);
        await page.locator('[data-locale="ru"]').click();
        await audit(page);
        assert.equal(await page.evaluate(()=>history.length),1);
        await page.locator('#undo').click();
        assert.equal(await page.evaluate(()=>engine.encode(state)),initial);
        await page.locator('#build-open').click();
        await page.fill('#build-code','invalid');
        await page.locator('#build-import').click();
        await audit(page);
        assert.match(await page.locator('#build-message').innerText(),/Вставьте/);
        await page.fill('#build-code',code);
        await page.locator('#build-import').click();
        assert.equal(await page.evaluate(()=>engine.encode(state)),code);
        await page.locator('#guide-open').click(); await audit(page); await page.keyboard.press('Escape');
        // Inspect every effect at every allocated rank, including fallback and next-rank copy.
        const effects = await page.evaluate(async()=>{
          const missing=[];
          for(const t of TALENTS) for(let rank=0;rank<=t.max;rank++) {
            const before=state.ranks[t.id];state.ranks[t.id]=rank;selected=t.id;updateTooltip();
            await new Promise(resolve=>queueMicrotask(resolve));
            for(const id of ['tip-title','tip-description','tip-footnote','tip-requirement','tip-meta']) {
              const value=document.getElementById(id).textContent;
              if(/[A-Za-z]/.test(value))missing.push(`${t.id}:${rank}:${id}:${value}`);
            }
            state.ranks[t.id]=before;
          }
          closeTooltip();render();return missing;
        });
        assert.deepEqual(effects,[],`${cls}: tooltip coverage`);
        await page.reload();assert.equal(await page.evaluate(()=>engine.encode(state)),code);
        await audit(page);
        if(['mage','druid'].includes(cls))await page.screenshot({path:path.join(shots,`${cls}-${mobile?'mobile':'desktop'}.png`),fullPage:true});
      }
      await context.close();
    }
    // Fresh origin with blocked storage; language still propagates through relative links.
    const blocked = await browser.newContext();
    await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage denied','SecurityError');}}));
    const page = await blocked.newPage();
    await page.goto(base+'?lang=ru');await audit(page);
    await page.locator('a[href*="talents/mage.html"]').click();await audit(page);
    await page.locator('[data-locale="en"]').click();await page.locator('[data-locale="ru"]').click();await audit(page);
    assert.match(await page.locator('[data-language-status]').innerText(),/Не удалось/);
    await blocked.close();
    const recovery = await browser.newContext();
    const recoveryPage = await recovery.newPage();
    await recoveryPage.goto(base+'talents/druid.html?lang=ru');
    await recoveryPage.evaluate(()=>localStorage.setItem(storageKey,'damaged-original-build'));
    await recoveryPage.reload();await audit(recoveryPage);
    assert.match(await recoveryPage.locator('#save-status').innerText(),/Исходный билд сохранен/);
    await recoveryPage.locator('#build-open').click();
    assert.equal(await recoveryPage.locator('#build-code').inputValue(),'damaged-original-build');
    await recoveryPage.fill('#build-code','WFD1-38-2523002022132212000');
    await recoveryPage.locator('#build-import').click();
    assert.equal(await recoveryPage.evaluate(()=>engine.encode(state)),'WFD2-38-00000000000000000-2523002022132212000-0000000000000000');
    assert.equal(await recoveryPage.evaluate(()=>localStorage.getItem(storageKey+'.backup')),'damaged-original-build');
    await audit(recoveryPage);await recovery.close();
    // A copied calculator must work with no siblings and network disabled.
    const offline = await browser.newContext({offline:true});
    const offlinePage = await offline.newPage();
    for(const cls of classes) {
      const temporary = path.join(shots,`${cls}-standalone.html`);
      fs.copyFileSync(path.join(root,`talents/${cls}.html`),temporary);
      await offlinePage.goto(pathToFileURL(temporary).href+'?lang=ru');await audit(offlinePage);
      await offlinePage.locator('.talent').first().click();
      assert.equal(await offlinePage.evaluate(()=>engine.total(state)),1);
      await offlinePage.locator('[data-locale="en"]').click();
      assert.equal(await offlinePage.locator('html').getAttribute('lang'),'en');
    }
    for(const file of ['index.html','racials.html']) {await offlinePage.goto(pathToFileURL(path.join(root,file)).href+'?lang=ru');await audit(offlinePage);}
    await offline.close();
    assert.deepEqual(errors,[]);assert.deepEqual(remoteRequests,[]);
    console.log(`PASS: ${checks} browser audits; nine desktop/mobile calculators, every rank tooltip, persistence, undo/import, filters, /ForeverTalents/, blocked storage and offline file://. Screenshots: ${shots}`);
  } finally {await browser?.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
