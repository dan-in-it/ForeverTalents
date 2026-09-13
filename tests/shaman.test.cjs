const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../talents/shaman.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const context=vm.createContext({structuredClone});
vm.runInContext(script.slice(0,script.indexOf("'use strict';")),context);
const talents=vm.runInContext('TALENTS',context);
const engine=vm.runInContext('createTalentEngine(TALENTS)',context);

test('Shaman adds Improved Healing Wave with all five effects',()=>{
  assert.equal(talents.length,50);
  assert.deepEqual(Array.from(engine.trees,t=>t.length),[16,18,16]);
  const added=talents.find(t=>t.name==='Improved Healing Wave');
  assert.deepEqual([added.tree,added.row,added.col,added.max],[2,0,1,5]);
  assert.match(engine.descriptionAtRank(added,5),/0\.5 sec/);
  assert.equal(talents.filter(t=>t.prerequisite).length,7);
});
test('WFS1 imports preserve original talent positions and leave the added talent empty',()=>{
  const old='WFS1-60-5000000000000000-030000000000000000-500000000000000';
  const state=engine.decode(old);
  assert.equal(state.ranks.e1,5);
  assert.equal(state.ranks.h2,3);
  assert.equal(state.ranks.r1,5);
  assert.equal(state.ranks.t2_0,0);
  assert.equal(engine.total(state),13);
  const upgraded=engine.encode(state);
  assert.equal(upgraded,'WFS2-60-5000000000000000-030000000000000000-5000000000000000');
  assert.equal(engine.encode(engine.decode(upgraded)),upgraded);
  const result=engine.change(state,'t2_0',5);
  assert.equal(result.error,undefined);
  assert.equal(engine.decode(engine.encode(result.state)).ranks.t2_0,5);
});
test('incomplete rank data is not scaled into unsupported effects',()=>{
  const storm=talents.find(t=>t.name==='Improved Stormstrike');
  const rank1=engine.effectAtRank(storm,1),rank2=engine.effectAtRank(storm,2);
  assert.ok(rank1.exact);
  assert.equal(rank2.exact,false);
  assert.equal(rank2.rank,1);
  assert.equal(rank2.text,rank1.text);
  assert.equal(rank2.estimated,false);
});
