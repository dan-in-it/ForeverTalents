const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname,'../talents/druid.html'),'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context = vm.createContext({structuredClone});
vm.runInContext(script.slice(0,script.indexOf("'use strict';")),context);
const talents = vm.runInContext('TALENTS',context);
const engine = vm.runInContext('createTalentEngine(TALENTS)',context);
const videoCode = 'WFD1-38-2523002022132212000';
const video = () => engine.decode(videoCode);
function add(state,id,amount=1) {
  const result = engine.change(state,id,amount);
  assert.equal(result.error,undefined,`${id}: ${result.error}`);
  return result.state;
}

test('Druid rank effects retain known values and mark retained estimates',() => {
  assert.equal(talents.length,52);
  assert.deepEqual(Array.from(engine.trees,tree=>tree.length),[17,19,16]);
  for (const talent of talents) {
    assert.equal(talent.rankDescriptions.length,talent.max);
    for (let rank=0;rank<=talent.max;rank++) assert.ok(engine.descriptionAtRank(talent,rank));
    assert.throws(()=>engine.descriptionAtRank(talent,-1));
    assert.throws(()=>engine.descriptionAtRank(talent,talent.max+1));
  }
  assert.match(engine.descriptionAtRank(engine.byId.b15,2),/0\.33 sec/);
  assert.match(engine.descriptionAtRank(engine.byId.r6,2),/33%/);
  assert.match(engine.byId.f11.meta,/^20 Rage/);
  assert.match(engine.byId.f8.text,/Feral Charge \(Cat\)/);
  assert.ok(engine.effectAtRank(engine.byId.b15,2).estimated);
});

test('original WFD1 Feral builds upgrade without moving ranks into the new trees',() => {
  const state=video();
  assert.equal(state.level,38);
  assert.equal(engine.total(state),29);
  assert.deepEqual([0,1,2].map(tree=>engine.treeTotal(state,tree)),[0,29,0]);
  assert.equal(engine.validate(state),'');
  assert.equal(engine.byId.f6.name,'Thick Hide');
  assert.equal(state.ranks.f6,0);
  assert.equal(state.ranks.f16,2);
  const code=engine.encode(state);
  assert.equal(code,'WFD2-38-00000000000000000-2523002022132212000-0000000000000000');
  assert.equal(engine.encode(engine.decode(code)),code);
});

test('tier points are independent across trees and refunds cannot invalidate deeper tiers',() => {
  let state=engine.empty();
  assert.match(engine.change(state,'b3',1).error,/earlier tiers/);
  state=add(state,'b1',5);
  state=add(state,'b3');
  assert.match(engine.change(state,'b1',-1).error,/earlier tiers/);
  assert.match(engine.change(state,'r3',1).error,/earlier tiers/);
  assert.match(engine.change(state,'f3',1).error,/earlier tiers/);
  assert.equal(state.ranks.b1,5);
});

test('all nine prerequisite links block invalid allocation, refunds, and imports',() => {
  const linked=talents.filter(t=>t.prerequisite);
  assert.equal(linked.length,9);
  for(const target of linked) {
    let state=engine.empty();
    const parent=target.prerequisite;
    for(const t of engine.trees[target.tree].filter(t=>t.row<target.row)) {
      if(engine.total(state)>=target.row*5+5&&state.ranks[parent]) break;
      if(!engine.addReason(state,t.id)) state=add(state,t.id,t.max);
    }
    if(!state.ranks[parent]) state=add(state,parent,engine.byId[parent].max);
    state=add(state,target.id);
    assert.ok(engine.change(state,parent,-1).error,`${target.name} parent refund`);
    const invalid=structuredClone(state);
    invalid.ranks[parent]--;
    assert.ok(engine.validate(invalid));
    assert.throws(()=>engine.decode(engine.encode(invalid)));
    invalid.ranks[target.id]=0;
    assert.match(engine.addReason(invalid,target.id),new RegExp(engine.byId[parent].name));
  }
});

test('all trees share the 51-point budget and short fills obey the selected level',() => {
  let state=engine.empty();
  for(const [id,amount] of [['b1',5],['b2',5],['r1',5],['r2',5],['f1',5],['f2',5],['b3',3],['f3',2],['r3',5],['r4',3],['r5',3],['f4',3],['f5',2]])
    state=add(state,id,amount);
  assert.equal(engine.total(state),51);
  assert.match(engine.change(state,'b4',1).error,/No talent points/);
  assert.equal(engine.encode(engine.decode(engine.encode(state))),engine.encode(state));
  assert.ok(engine.validate({...state,level:59}));
  const low=add(engine.empty(10),'r1',5);
  assert.equal(low.ranks.r1,1);
  assert.match(engine.change(low,'b1',1).error,/No talent points/);
  for(const level of [9,61,38.5,'38']) assert.ok(engine.validate({...video(),level}));
});

test('build decoding rejects wrong classes, layouts, ranks, point budgets, and prerequisites',() => {
  const code=engine.encode(video());
  assert.equal(engine.encode(engine.decode(`  ${code}\n`)),code);
  for(const bad of ['WF1-38-000-000-000',code.replace('WFD2','WFS1'),code+'0',code.replace('2523','9523'),code.replace('-38-','-10-'),
    'WFD1-60-0000000000000000001','WFD1-60-00000000000000000000','WFD2-60-<script>',null])
    assert.throws(()=>engine.decode(bad),String(bad));
});

test('the original video build can still reach Berserk at level 40',() => {
  let state={...video(),level:40};
  assert.match(engine.change(state,'f19',1).error,/earlier tiers/);
  state=add(state,'f1');
  state=add(state,'f19');
  assert.equal(engine.total(state),31);
  assert.equal(engine.validate(state),'');
  assert.ok(engine.change(state,'f15',-1).error);
});

test('Druid preserves original storage keys and removes the visible reference UI',() => {
  const assets=vm.runInContext('ASSETS',context);
  assert.ok(talents.every(t=>assets[t.icon]?.startsWith('data:image/jpeg;base64,')));
  const readable=html.replace(/data:[^\s"')]+/g,'[asset]');
  assert.match(readable,/wowforever\.druid\.reference\.v2/);
  assert.match(readable,/wowforever\.druid\.feral\.v1/);
  assert.ok(!/jvmes-wow|source-strip|reference-note|load-video|Calculator notes|Reference &amp; controls/.test(readable));
});
