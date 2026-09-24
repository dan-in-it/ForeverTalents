const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.join(__dirname, '..');
const common = require('../locales/ru.js');
const original = require('./fixtures/localization/original.json');
const runtime = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
const numbers = value => value.match(/\d+(?:\.\d+)?/g) || [];
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const plain = value => JSON.parse(JSON.stringify(value));
function loadI18n(extra = {}) {
  const context = vm.createContext({URLSearchParams, URL, ...extra});
  vm.runInContext(runtime, context);
  context.I18n.register(common);
  return context.I18n;
}
function loadClass(cls) {
  const html = fs.readFileSync(path.join(root, `talents/${cls}.html`), 'utf8').replace(/\r\n/g, '\n');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const context = vm.createContext({structuredClone});
  vm.runInContext(script.slice(0, script.indexOf("'use strict';")), context);
  return {html, script, talents:plain(vm.runInContext('TALENTS', context)), engine:vm.runInContext('createTalentEngine(TALENTS)', context)};
}
// These pages use static, quoted HTML attributes. Extract their display strings
// directly so coverage tracks edits without a duplicate inventory fixture.
function staticStrings(file) {
  const html = fs.readFileSync(path.join(root, file), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  const entities = {amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:'\u00a0',larr:'←',rarr:'→'};
  const decode = text => text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, key) => {
    if (key.startsWith('#x')) return String.fromCodePoint(parseInt(key.slice(2),16));
    if (key.startsWith('#')) return String.fromCodePoint(Number(key.slice(1)));
    return entities[key] ?? entity;
  }).trim();
  const values = [];
  for (const match of html.matchAll(/>([^<]+)</g)) values.push(decode(match[1]));
  for (const [tag] of html.matchAll(/<[a-z][^>]*>/gi)) {
    for (const [, name, value] of tag.matchAll(/([\w-]+)="([^"]*)"/g)) {
      if (['aria-label','aria-description','title','alt','placeholder'].includes(name) ||
          name === 'content' && /^<meta\b/i.test(tag) && /name="description"/.test(tag)) values.push(decode(value));
    }
  }
  return [...new Set(values.filter(value => /[A-Za-z]/.test(value)))];
}
test('EN default, explicit RU, stored preference, invalid locale and blocked storage', () => {
  const api = loadI18n();
  assert.deepEqual(Array.from(api.locales), ['en', 'ru']);
  assert.equal(api.locale, 'en');
  assert.equal(api.resolveLocale(''), 'en');
  assert.equal(api.resolveLocale('?lang=ru'), 'ru');
  assert.equal(api.resolveLocale('?lang=en', {getItem:() => 'ru'}), 'en');
  assert.equal(api.resolveLocale('?lang=xx', {getItem:() => 'ru'}), 'ru');
  assert.equal(api.resolveLocale('', {getItem:() => 'xx'}), 'en');
  assert.equal(api.resolveLocale('', {getItem:() => {throw Error('denied');}}), 'en');
});
test('switching persists only the locale key and preserves URL filters/hash', () => {
  const writes = [], urls = [];
  const api = loadI18n({localStorage:{setItem:(...args) => writes.push(args)},location:{href:'https://example.org/ForeverTalents/racials.html?class=mage#human'},history:{replaceState:(_, __, url) => urls.push(String(url))}});
  api.setLocale('ru');
  assert.equal(api.translate('Build code'), 'Код билда');
  assert.equal(api.translate('Missing future translation'), 'Missing future translation');
  api.setLocale('en');
  assert.equal(api.translate('Build code'), 'Build code');
  assert.deepEqual(writes, [['wowforever.locale','ru'], ['wowforever.locale','en']]);
  assert.equal(urls[0], 'https://example.org/ForeverTalents/racials.html?class=mage&lang=ru#human');
});
test('Russian plural forms cover teens, hundreds, negatives and fractions', () => {
  const api = loadI18n();
  for (const [n, index] of [[0,2],[1,0],[2,1],[4,1],[5,2],[11,2],[12,2],[14,2],[21,0],[22,1],[25,2],[101,0],[111,2],[-22,1],[1.5,1]]) {
    for (const [noun, forms] of Object.entries({talent:['талант','таланта','талантов'],point:['очко','очка','очков'],ability:['способность','способности','способностей'],race:['раса','расы','рас']}))
      assert.equal(api.count(n, noun, 'ru'), `${n} ${forms[index]}`);
  }
  assert.equal(api.count(1, 'ability', 'en'), '1 ability');
  assert.equal(api.count(2, 'ability', 'en'), '2 abilities');
});
test('every static string, metadata and accessibility label has an explicit translation', () => {
  const api = loadI18n(); api.setLocale('ru', false);
  const pages = ['index.html','racials.html',...Object.keys(original).map(cls => `talents/${cls}.html`)];
  for (const page of pages) for (const source of staticStrings(page)) {
    assert.ok(Object.hasOwn(common, source), source);
    assert.equal(api.translate(source), common[source], source);
    assert.deepEqual(numbers(common[source]), numbers(source), source);
  }
});
test('dynamic errors, counts, requirements, rank previews and screen reader labels translate', () => {
  const api = loadI18n(); api.setLocale('ru', false);
  assert.equal(api.translate('Reset Balance', 'ru'), 'Сбросить ветку «Баланс»');
  api.register({'Improved Wrath':'Улучшенный гнев', 'Known effect.':'Известный эффект.', 'Next effect.':'Следующий эффект.'});
  for (const text of ['Improved Wrath, rank 2 of 5, available','Improved Wrath, rank 5 of 5, maximum rank','Improved Wrath, rank 0 of 5, locked','Balance · Tier 2','Rank 2 / 5','AVAILABLE EFFECT · RANK 1','CURRENT EFFECT · RANK 2','Rank 2 effect is not available. Showing rank 1.','Known effect.\n\nNEXT RANK · RANK 2\nNext effect.','1 point','22 points','05 PTS','5 points required in earlier tiers','Reset Balance','Balance reset. Undo is available.','Invalid rank for Improved Wrath.','This build needs level 60 or higher.','Improved Wrath requires 5 points in earlier tiers.','Improved Wrath requires 5 ranks in Improved Wrath.','Requires 5 ranks in Improved Wrath.','Spend 21 more points in earlier tiers of this tree.','No talent points remaining. Refund points first.','Saved build needs attention: Unknown talent. The original save is preserved.','1 race · 4 abilities','0 races · 0 abilities · 1 racials TBD']) {
    const result = api.translate(text);
    assert.notEqual(result, text, text);
    assert.ok(!/[A-Za-z]/.test(result), `${text}: ${result}`);
    assert.deepEqual(numbers(result), numbers(text), text);
  }
  for (const text of ['Paste a valid WFD2 Druid build code or an original WFD1 Feral code.', 'Paste a valid WFS2 Shaman build code.']) {
    assert.ok(!/Paste|valid|build|code|Druid|Feral|Shaman/.test(api.translate(text)));
  }
});
for (const cls of Object.keys(original)) {
  test(`${cls}: every name, known rank and cost translated without numeric or layout changes`, () => {
    const {talents} = loadClass(cls), catalog = require(`../locales/ru-${cls}.js`);
    assert.deepEqual(Object.keys(catalog), talents.map(t => t.id));
    const api = loadI18n(); api.registerTalents(talents, catalog); api.setLocale('ru', false);
    for (const talent of talents) {
      const ru = catalog[talent.id];
      assert.deepEqual(Object.keys(ru).sort(), ['name','text','rankDescriptions', ...(talent.meta ? ['meta'] : [])].sort());
      assert.equal(ru.rankDescriptions.length, talent.rankDescriptions.length);
      const pairs = [[talent.name,ru.name],[talent.text,ru.text], ...talent.rankDescriptions.map((text, index) => [text,ru.rankDescriptions[index]]), ...(talent.meta ? [[talent.meta,ru.meta]] : [])];
      for (const [en, translated] of pairs) {
        if (en === null) {assert.equal(translated,null); continue;}
        assert.ok(/[А-Яа-яЁё]/.test(translated), `${cls} ${talent.id}`);
        assert.ok(!/[A-Za-z]/.test(translated), translated);
        assert.deepEqual(numbers(en), numbers(translated), `${talent.name}: ${en}`);
        assert.equal((translated.match(/%/g)||[]).length, (en.match(/%/g)||[]).length, talent.name);
        assert.equal(api.translate(en),translated,`${talent.name}: dictionary collision`);
      }
    }
  });
  test(`${cls}: original engine, talent IDs, rank arrays and entire calculator script are unchanged`, () => {
    const {talents, engine} = loadClass(cls);
    const raw = fs.readFileSync(path.join(root, `talents/${cls}.html`), 'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
    assert.equal(hash(raw), original[cls].scriptSha256);
    const layout = {ids:talents.map(t => t.id),ranks:talents.map(t => t.rankDescriptions)};
    assert.equal(hash(JSON.stringify(layout)), original[cls].layoutSha256);
    const api = loadI18n(); api.registerTalents(talents,require(`../locales/ru-${cls}.js`));
    let state = engine.empty();
    for (const talent of talents.filter(t => t.row === 0)) if (!engine.addReason(state,talent.id)) state = engine.change(state,talent.id,talent.max).state;
    const before = engine.encode(state);
    api.setLocale('ru',false);
    assert.equal(engine.encode(engine.decode(before)),before);
    api.setLocale('en',false);
    assert.equal(engine.encode(engine.decode(before)),before);
  });
  test(`${cls}: standalone offline bundle matches canonical source files`, () => {
    const {html} = loadClass(cls);
    for (const file of ['i18n.js','i18n.css','locales/ru.js',`locales/ru-${cls}.js`]) {
      const start = html.indexOf(`data-i18n-bundle="${file}">\n`) + `data-i18n-bundle="${file}">\n`.length;
      const source = fs.readFileSync(path.join(root,file),'utf8');
      assert.equal(html.slice(start,start+source.length),source,file);
    }
  });
}
