const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const legacy=require('./fixtures/legacy-layouts.json');
const septemberLayouts=require('./fixtures/september-26-layouts.json');

function load(cls) {
  const html=fs.readFileSync(path.join(__dirname,`../talents/${cls.toLowerCase()}.html`),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const context=vm.createContext({structuredClone});
  vm.runInContext(script.slice(0,script.indexOf("'use strict';")),context);
  const talents=vm.runInContext('TALENTS',context);
  return {talents,engine:vm.runInContext('createTalentEngine(TALENTS)',context),find:name=>talents.find(t=>t.name===name)};
}
function reach(engine,target,allowed) {
  let state=engine.empty();
  for(const t of [...engine.trees[target.tree]].sort((a,b)=>a.row-b.row)) {
    if(allowed && !allowed.has(t.id)) continue;
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

for(const [cls,layout] of [...Object.entries(legacy),...Object.entries(septemberLayouts)]) {
  const {talents,engine}=load(cls);
  test(`${cls} ${layout.prefix}: old full-tree codes preserve every surviving talent slot`,()=>{
    const allowed=new Set(layout.talents.map(t=>t.id));
    for(const target of talents.filter(t=>allowed.has(t.id))) {
      const state=reach(engine,target,allowed);
      const imported=engine.decode(oldCode(layout,state));
      assert.equal(engine.encode(imported),engine.encode(state),target.name);
      assert.notEqual(engine.encode(imported).split('-')[0],layout.prefix);
    }
  });
  test(`${cls} ${layout.prefix}: allocated removed slots reject with the talent name; empty slots migrate`,()=>{
    for(const removed of layout.talents.filter(t=>!engine.byId[t.id])) {
      const state=engine.empty();
      assert.equal(engine.total(engine.decode(oldCode(layout,state))),0);
      state.ranks[removed.id]=1;
      assert.throws(()=>engine.decode(oldCode(layout,state)),error=>error.message.includes(`${removed.name} was removed`));
    }
  });
}

test('Warrior retains September tuning with the current Protection positions',()=>{
  const {find,engine}=load('Warrior');
  assert.deepEqual([find('Focused Rage').row,find('Focused Rage').col],[4,2]);
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
  assert.match(mage.find('Heating Up').text,/within 20 sec/);
});

test('October 1 Druid talents enforce the complete Shifting Power chain and sourced mana cost',()=>{
  const {find,engine}=load('Druid');
  const shredding=find('Shredding Attacks'),power=find('Shifting Power'),improved=find('Improved Shifting Power');
  assert.equal(find('King of the Jungle'),undefined);
  assert.deepEqual([shredding.row,power.row,improved.row],[2,3,4]);
  assert.equal(power.prerequisite,shredding.id);
  assert.equal(improved.prerequisite,power.id);
  assert.equal(power.active,true);
  assert.match(power.meta,/55% of base mana.*16 sec cooldown.*Requires Cat Form/);
  assert.match(power.text,/55% of base mana into 40 Energy/);
  assert.deepEqual(Array.from(improved.rankDescriptions),[
    'Reduces the cooldown of your Shifting Power spell by 4 sec.',
    'Reduces the cooldown of your Shifting Power spell by 8 sec.'
  ]);
  assert.deepEqual([find('Predatory Instincts').row,find('Predatory Instincts').col],[4,3]);
  assert.match(find('Primal Bite').text,/high amount of threat/);
  assert.throws(()=>engine.decode('WFD1-38-2523002022132212000'),/King of the Jungle was removed/);
});

test('October 1 Warrior tree changes and official tuning supersede stale tooltip effects',()=>{
  const {find,engine}=load('Warrior');
  for(const name of ['Improved Cleave','Boundless Rage','Precision','Toughness']) assert.equal(find(name),undefined);
  assert.deepEqual([find('Iron Will').id,find('Iron Will').tree,find('Iron Will').row],['f3',2,0]);
  assert.equal(find('Lingering Rage').row,1);
  assert.match(engine.descriptionAtRank(find('Lingering Rage'),5),/10 sec/);
  assert.equal(find('Furious Precision').row,2);
  assert.deepEqual(Array.from(find('Furious Precision').rankDescriptions,t=>t.match(/\d+%/)[0]),['4%','7%','10%']);
  assert.equal(find('Flurry').prerequisite,find('Death Wish').id);
  assert.equal(find('Gore Drinker').prerequisite,find('Enrage').id);
  assert.equal(find('Bloodthirst').prerequisite,undefined);
  assert.equal(find('Last Stand').prerequisite,undefined);
  assert.match(find('Bloodthirst').text,/45% of your Attack Power/);
  assert.equal(find('Raging Blows').text,'Reduces the Rage cost of your Cleave and Whirlwind abilities by 3.');
  assert.equal(engine.descriptionAtRank(find('Dual Wield Specialization'),5),'Increases the damage done by your off-hand weapon by 25%.');
  assert.match(engine.descriptionAtRank(find('Booming Voice'),5),/50%.*Rage cost by 25%/);
  assert.doesNotMatch(find('Unbridled Wrath').text,/two-handed/);
  assert.doesNotMatch(find('Blood Craze').text,/Bloodthirst/);
  assert.match(find('Spearing Strike').meta,/Requires Battle Stance/);
  for(const [name,row] of [['Improved Berserker Rage',4],['Improved Bloodrage',0],['Anticipation',1],['Improved Revenge',1],['Improved Disarm',2],['Improved Shield Bash',3]])
    assert.equal(find(name).row,row,name);
});

test('Warrior imports move Iron Will by identity and leave all new Fury talents empty',()=>{
  const {find,engine}=load('Warrior'),layout=septemberLayouts.Warrior;
  const old=engine.empty();
  old.ranks[find('Iron Will').id]=5;
  const imported=engine.decode(oldCode(layout,old));
  assert.equal(engine.treeTotal(imported,1),0);
  assert.equal(engine.treeTotal(imported,2),5);
  for(const name of ['Lingering Rage','Furious Precision','Gore Drinker']) assert.equal(imported.ranks[find(name).id],0);
  // An old Fury build may lose the points that used to unlock later tiers when Iron Will moves.
  old.ranks[find('Booming Voice').id]=5;
  old.ranks[find('Piercing Howl').id]=1;
  assert.throws(()=>engine.decode(oldCode(layout,old)),/Piercing Howl requires 10 points/);
});

test('October 1 Hunter, Mage and Paladin effects match every revised rank',()=>{
  const hunter=load('Hunter'),mage=load('Mage'),paladin=load('Paladin');
  assert.match(hunter.find('Sniper Shot').meta,/8 - 45 yd range/);
  assert.match(hunter.find('Sniper Shot').text,/next 3 Shots by 10 yards for 10 sec/);
  assert.equal(hunter.find('Improved Stings').icon,'ability_hunter_quickshot');
  assert.equal(hunter.find("Predator's Edge").icon,'ability_dualwield');
  assert.deepEqual(Array.from(hunter.find('Deflection').rankDescriptions,t=>t.match(/\d+%/)[0]),['1%','2%','3%','4%','5%']);
  assert.equal(mage.find('Hot Streak'),undefined);
  assert.match(mage.find('Combustion').text,/3 non-periodic critical strikes/);
  assert.deepEqual(Array.from(paladin.find('Redoubt').rankDescriptions,t=>t.match(/block by (\d+)%/)[1]),['4','8','12','16','20']);
  assert.match(paladin.find('Holy Shield').text,/block by 30%/);
  assert.deepEqual(Array.from(paladin.find('Champion of the Light').rankDescriptions,t=>t.match(/\d+%/)[0]),['20%','40%','60%']);
  assert.doesNotMatch(paladin.find('Champion of the Light').text,/healing/i);
  assert.match(paladin.find('Holy Shock').meta,/Enemy: 20 yd range; Friendly: 40 yd range/);
});

test('October 1 Priest, Rogue and Warlock trigger conditions are current',()=>{
  const priest=load('Priest'),rogue=load('Rogue'),warlock=load('Warlock');
  assert.match(priest.find('Inner Focus').text,/non-periodic spell/);
  assert.ok(priest.find('Spirit Tap').rankDescriptions.every(t=>t.includes('Vampiric Embrace')));
  assert.ok(rogue.find('Setup').rankDescriptions.every(t=>t.includes('one of their attacks')));
  assert.equal(warlock.find('Soul Harvesting'),undefined);
  assert.match(warlock.find('Soul Harvest').text,/non-trivial target/);
  assert.match(warlock.engine.descriptionAtRank(warlock.find('Soul Harvest'),2),/100% for 10 sec.*100% of normal Mana regeneration/);
});
