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
const video = () => ({level:38,ranks:Object.fromEntries(talents.map(t => [t.id,t.videoRank]))});
function add(state,id,amount=1) {
  const result = engine.change(state,id,amount);
  assert.equal(result.error,undefined,`${id}: ${result.error}`);
  return result.state;
}

test('video transcription has 19 talents in unique slots, recorded effects, and a valid 29-point build',() => {
  assert.equal(talents.length,19);
  assert.equal(new Set(talents.map(t => `${t.row}:${t.col}`)).size,19);
  assert.equal(new Set(talents.map(t => t.id)).size,19);
  assert.equal(engine.total(video()),29);
  assert.equal(engine.budget(video()),29);
  assert.equal(engine.validate(video()),'');
  for(const t of talents) {
    assert.equal(t.tree,1);
    assert.ok(t.timestamp);
    assert.ok(t.effects[Math.max(t.videoRank,1)]);
    assert.ok(Object.keys(t.effects).every(rank => +rank >= 1 && +rank <= t.max));
  }
  assert.match(talents.find(t => t.id==='f6').effects[1],/0\.67 base Armor/);
  assert.equal(talents.find(t => t.id==='f11').meta.split(' · ')[0],'18 Rage');
});

test('tier gates need earlier-tier points and prevent invalid refunds',() => {
  let state=engine.empty();
  assert.match(engine.change(state,'f3',1).error,/earlier tiers/);
  state=add(state,'f1',5);
  state=add(state,'f3',2);
  assert.match(engine.change(state,'f1',-1).error,/earlier tiers/);
  assert.equal(state.ranks.f1,5);
  assert.match(engine.change(state,'f7',1).error,/earlier tiers/);
});

test('all four arrows require max parent rank and block parent refunds',() => {
  const links={f11:'f7',f13:'f9',f18:'f12',f19:'f15'};
  assert.deepEqual(Object.fromEntries(talents.filter(t=>t.prerequisite).map(t=>[t.id,t.prerequisite])),links);
  for(const [child,parent] of Object.entries(links)) {
    let state=engine.empty(60);
    const target=talents.find(t=>t.id===child);
    // Fill earlier tiers to meet the child's point gate, then remove its parent.
    for(const t of talents.filter(t=>t.row<target.row)) {
      if(engine.total(state) >= target.row*5+5 && state.ranks[parent]) break;
      if(!engine.addReason(state,t.id)) state=add(state,t.id,t.max);
    }
    if(!state.ranks[parent]) state=add(state,parent,engine.byId[parent].max);
    state=add(state,child);
    assert.ok(engine.change(state,parent,-1).error,`${parent} refund should fail`);
    const invalid=structuredClone(state);
    invalid.ranks[parent]=0;
    assert.match(engine.validate(invalid),/requires/);
    invalid.ranks[child]=0;
    assert.ok(engine.addReason(invalid,child));
    assert.throws(()=>engine.decode(engine.encode({...invalid,ranks:{...invalid.ranks,[child]:1}})));
  }
});

test('budget caps fills, validates levels and blocks spending at the video budget',() => {
  let state=engine.empty(10);
  state=add(state,'f1',5);
  assert.equal(state.ranks.f1,1);
  assert.match(engine.change(state,'f2',1).error,/No talent points/);
  assert.match(engine.change(video(),'f1',1).error,/No talent points/);
  assert.ok(engine.validate({...video(),level:37}));
  for(const level of [9,61,38.5,'38']) assert.ok(engine.validate({...video(),level}));
});

test('Druid codes round-trip and reject Warrior, malformed, over-cap and invalid builds',() => {
  const code=engine.encode(video());
  assert.equal(code,'WFD1-38-2523002022132212000');
  assert.equal(engine.encode(engine.decode(code)),code);
  assert.equal(engine.encode(engine.decode(`  ${code}\n`)),code);
  for(const bad of ['WF1-38-000-000-000',code.replace('WFD1','WF1'),code+'0',code.replace('2523','9523'),code.replace('-38-','-10-'),'WFD1-60-0000000000000000001','WFD1-60-<script>',null])
    assert.throws(()=>engine.decode(bad),String(bad));
});

test('Berserk is reachable at level 40 and its point and parent gates are enforced',() => {
  let state={...video(),level:40};
  assert.match(engine.change(state,'f19',1).error,/earlier tiers/);
  state=add(state,'f1');
  state=add(state,'f19');
  assert.equal(engine.total(state),31);
  assert.equal(engine.validate(state),'');
  assert.ok(engine.change(state,'f15',-1).error);
});

test('assets are embedded and missing specializations stay explicitly unavailable',() => {
  const assets=vm.runInContext('ASSETS',context);
  assert.ok(talents.every(t=>assets[t.icon]?.startsWith('data:image/jpeg;base64,')));
  assert.ok(!/<(?:img|script)[^>]+src="https?:/i.test(html));
  assert.ok(!/<link[^>]+href="https?:/i.test(html));
  assert.match(html,/wowforever\.druid\.feral\.v1/);
  assert.match(html,/Balance.*?unavailable:true/s);
  assert.match(html,/Restoration.*?unavailable:true/s);
  const readable=html.replace(/data:[^\s"')]+/g,'[asset]');
  assert.ok(!/rank-one descriptions come|YOUR WARRIOR|Arms|wowforever\.warrior/.test(readable));
});
