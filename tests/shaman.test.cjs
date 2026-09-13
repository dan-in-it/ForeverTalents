const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../talents/shaman.html'), 'utf8');
const talents = JSON.parse(html.match(/const TALENTS = ([\s\S]*?);\r?\nconst ASSETS/)[1]);
const assets = JSON.parse(html.match(/const ASSETS = ([\s\S]*?);\r?\n/)[1]);
const rules = html.slice(html.indexOf('function createTalentEngine('), html.indexOf("if (typeof module"));
const engine = vm.runInNewContext(rules + '\ncreateTalentEngine', {structuredClone})(talents);
const byName = name => talents.find(t => t.name === name);
function spend(state, talent, amount = 1) {
  const result = engine.change(state, talent.id, amount);
  assert.equal(result.error, undefined, `${talent.name}: ${result.error}`);
  return result.state;
}

test('reference layout has 49 unique talents, four columns and seven tiers', () => {
  assert.deepEqual(engine.trees.map(t => t.length).join(','), '16,18,15');
  assert.equal(new Set(talents.map(t => t.id)).size, 49);
  assert.equal(new Set(talents.map(t => `${t.tree}:${t.row}:${t.col}`)).size, 49);
  for (const t of talents) {
    assert.ok(t.row >= 0 && t.row <= 6 && t.col >= 0 && t.col <= 3);
    assert.ok(t.max >= 1 && t.max <= 5 && t.text.length > 20);
    assert.ok(assets[t.icon]?.startsWith('data:image/jpeg;base64,'), t.name);
  }
  assert.equal(byName('Call of Thunder').max, 1);
  assert.equal(byName('Mental Quickness').max, 2);
  assert.equal(byName('Tidal Mastery').row, 0);
  assert.equal(byName('Tidal Mastery').col, 2);
  assert.ok(html.includes('wowforever.shaman.reference.v1'));
  assert.ok(!html.includes('wowforever.warrior.reference.v1'));
});

test('each capstone can be reached with 30 earlier points and refunded safely', () => {
  for (let tree = 0; tree < 3; tree++) {
    let state = engine.empty();
    const capstone = engine.trees[tree].find(t => t.row === 6);
    assert.ok(engine.change(state, capstone.id, 1).error);
    for (const t of engine.trees[tree]) {
      if (engine.treeTotal(state, tree) >= 30) break;
      if (t.row < 6) state = spend(state, t, Math.min(t.max, 30 - engine.treeTotal(state, tree)));
    }
    assert.equal(engine.treeTotal(state, tree), 30);
    state = spend(state, capstone);
    const first = engine.trees[tree][0];
    assert.ok(engine.change(state, first.id, -1).error, 'refund must preserve capstone tier requirement');
    state = spend(state, capstone, -1);
    assert.equal(engine.total(state), 30);
    assert.equal(engine.validate(state), '');
  }
});

test('tier gates are per tree, ranks are capped, and level controls limit the budget', () => {
  let state = engine.empty(14);
  state = spend(state, byName('Convection'), 99);
  assert.equal(engine.total(state), 5);
  assert.ok(engine.change(state, byName('Convection').id, 1).error);
  assert.ok(engine.change(state, byName('Concussion').id, 1).error);
  state.level = 60;
  assert.ok(engine.change(state, byName('Mindfulness').id, 1).error);
  state = spend(state, byName('Reverberation'));
  assert.ok(engine.validate({...state, level: 14}));
  assert.ok(engine.change(state, byName('Convection').id, -1).error);
});

test('level 60 permits exactly 51 total points across the trees', () => {
  let state = engine.empty();
  for (const t of talents) {
    if (!engine.addReason(state, t.id)) state = spend(state, t, t.max);
  }
  assert.equal(engine.total(state), 51);
  assert.equal(engine.validate(state), '');
  assert.ok(engine.change(state, byName('Tidal Mastery').id, 1).error);
});

test('Shaman build codes round-trip and reject foreign, malformed or illegal builds', () => {
  let state = spend(engine.empty(), byName('Convection'), 5);
  state = spend(state, byName('Thundering Strikes'), 3);
  const code = engine.encode(state);
  assert.ok(code.startsWith('WFS1-60-'));
  assert.equal(engine.encode(engine.decode(code)), code);
  assert.throws(() => engine.decode(code.replace('WFS1', 'WF1')));
  assert.throws(() => engine.decode(code.replace('WFS1', 'WFD1')));
  assert.throws(() => engine.decode(code.replace('-60-', '-09-')));
  assert.throws(() => engine.decode(code.replace('-60-', '-10-')));
  assert.throws(() => engine.decode(code + '0'));
  assert.throws(() => engine.decode(code.replace('-500', '-900')));
  const invalid = engine.empty();
  invalid.ranks[byName('Riptide').id] = 1;
  assert.throws(() => engine.decode(engine.encode(invalid)));
});
