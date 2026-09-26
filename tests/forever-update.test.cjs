const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const legacy=require('./fixtures/legacy-layouts.json');

function load(cls) {
  const html=fs.readFileSync(path.join(__dirname,`../talents/${cls.toLowerCase()}.html`),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const context=vm.createContext({structuredClone});
  vm.runInContext(script.slice(0,script.indexOf("'use strict';")),context);
  const talents=vm.runInContext('TALENTS',context);
  return {talents,engine:vm.runInContext('createTalentEngine(TALENTS)',context),find:name=>talents.find(t=>t.name===name)};
}
function reach(engine,target) {
  let state=engine.empty();
  for(const t of [...engine.trees[target.tree]].sort((a,b)=>a.row-b.row)) {
    if(!engine.addReason(state,target.id)) break;
    if((t.row<target.row||t.id===target.prerequisite)&&!engine.addReason(state,t.id)) {
      const result=engine.change(state,t.id,t.max);
      assert.equal(result.error,undefined);
      state=result.state;
    }
  }
  const result=engine.change(state,target.id,1);
  assert.equal(result.error,undefined,target.name);
  return result.state;
}
function oldCode(layout,state) {
  return `${layout.prefix}-${state.level}-${[0,1,2].map(tree=>layout.talents.filter(t=>t.tree===tree).map(t=>state.ranks[t.id]||0).join('')).join('-')}`;
}

for(const [cls,layout] of Object.entries(legacy)) {
  const {talents,engine}=load(cls);
  test(`${cls}: old full-tree codes preserve every surviving talent slot`,()=>{
    for(const target of talents) {
      const state=reach(engine,target);
      const imported=engine.decode(oldCode(layout,state));
      assert.equal(engine.encode(imported),engine.encode(state),target.name);
      assert.notEqual(engine.encode(imported).split('-')[0],layout.prefix);
    }
  });
  test(`${cls}: allocated removed slots reject with the talent name; empty slots migrate`,()=>{
    for(const removed of layout.talents.filter(t=>!engine.byId[t.id])) {
      const state=engine.empty();
      assert.equal(engine.total(engine.decode(oldCode(layout,state))),0);
      state.ranks[removed.id]=1;
      assert.throws(()=>engine.decode(oldCode(layout,state)),error=>error.message.includes(`${removed.name} was removed`));
    }
  });
}

test('September 24 Warrior tuning and documented Protection tier swap are applied',()=>{
  const {find,engine}=load('Warrior');
  assert.deepEqual([find('Focused Rage').row,find('Focused Rage').col],[4,3]);
  assert.deepEqual([find('Bastion').row,find('Bastion').col],[5,2]);
  assert.equal(find('Vitality'),undefined);
  assert.match(engine.descriptionAtRank(find('Bloodthrill'),5),/Main Hand.*20% chance/);
  assert.match(engine.descriptionAtRank(find('Improved Slam'),2),/cooldown is reduced by 3.0 sec/);
});

test('Paladin removals and all September 24 talent tuning are applied',()=>{
  const {find,engine}=load('Paladin');
  for(const name of ['Improved Holy Strike','Crusade']) assert.equal(find(name),undefined);
  assert.match(find('Twist of Light').text,/Mana cost.*20%/);
  assert.match(find('Sacred Arbiter').text,/20%/);
  assert.match(engine.descriptionAtRank(find('Vengeance'),3),/non-periodic.*Stacks up to 3 times/s);
  assert.match(engine.descriptionAtRank(find('Two-Handed Weapon Specialization'),3),/6%/);
  assert.match(engine.descriptionAtRank(find('Holy Power'),5),/Holy Shock and Holy Strike.*15%/);
  assert.match(find("Light's Vigil").text,/enemy targets.*refund 75%.*or allied targets/s);
  assert.match(find('Divine Favor').meta,/4% of base mana/);
});

test('Shaman swaps preserve talent identities and use the current prerequisite chain',()=>{
  const {find,engine}=load('Shaman');
  const alacrity=find('Elemental Alacrity'),fury=find('Elemental Fury'),thunder=find('Call of Thunder');
  assert.equal(alacrity.row,2);
  assert.equal(alacrity.prerequisite,undefined);
  assert.equal(thunder.prerequisite,alacrity.id);
  assert.equal(fury.row,5);
  assert.equal(fury.prerequisite,thunder.id);
  assert.deepEqual([find('Totemic Focus').row,find('Totemic Focus').col],[0,2]);
  assert.deepEqual([find('Tidal Mastery').row,find('Tidal Mastery').col],[3,0]);
  assert.equal(find('Rage of the Farseer').text,'Increases your attack speed by 30% for 25 sec.');
  assert.ok(engine.change(engine.empty(),find('Tidal Mastery').id,1).error);
  assert.equal(engine.change(engine.empty(),find('Totemic Focus').id,1).error,undefined);
});

test('Rogue and Warlock replacements and dependency corrections are applied',()=>{
  const rogue=load('Rogue'),warlock=load('Warlock');
  assert.equal(rogue.find('Restless Blades'),undefined);
  assert.equal(rogue.find('Flawless Execution').id,'t1_10');
  assert.match(rogue.find('Flawless Execution').text,/Eviscerate.*10/);
  for(const [child,parent] of [['Riposte','Deflection'],['Dual Wield Specialization','Precision'],['Weapon Expertise','Blade Flurry'],['Quietus','Dirty Deeds']])
    assert.equal(rogue.find(child).prerequisite,rogue.find(parent).id);
  assert.equal(rogue.find('Aggression').prerequisite,undefined);
  assert.equal(warlock.find('Drain Hope'),undefined);
  assert.equal(warlock.find('Wrack').id,'t0_16');
  assert.match(warlock.find('Wrack').text,/every 1 sec.*10%.*6 sec/);
  assert.equal(warlock.find('Conflagrate').prerequisite,undefined);
});

test('Druid renames update dependent tooltips and Hunter/Mage buffs use current durations',()=>{
  const druid=load('Druid'),hunter=load('Hunter'),mage=load('Mage');
  assert.equal(druid.find('Balance of Nature'),undefined);
  assert.equal(druid.find('Primal Bite').id,'f11');
  assert.equal(druid.find('Blood Frenzy').id,'f13');
  assert.equal(druid.find('Blood Frenzy').icon,'ability_ghoulfrenzy');
  assert.ok(druid.talents.every(t=>!t.rankDescriptions.some(text=>/Mangle|Primal Fury/.test(text))));
  assert.match(hunter.find('Strider Kick').text,/30% for 3 sec/);
  assert.match(mage.find('Wake of Fire').text,/within 30 sec/);
  assert.match(mage.find('Hot Streak').text,/for 20 sec/);
});
