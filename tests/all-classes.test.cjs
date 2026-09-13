const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=require('./fixtures/forever-source.json');
const root=path.join(__dirname,'..');
const norm=name=>name.toLowerCase().replace(/[^a-z0-9]/g,'');
const plain=value=>JSON.parse(JSON.stringify(value));

function load(cls) {
  const html=fs.readFileSync(path.join(root,`talents/${cls.toLowerCase()}.html`),'utf8');
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const context=vm.createContext({structuredClone});
  vm.runInContext(script.slice(0,script.indexOf("'use strict';")),context);
  return {html,context,talents:vm.runInContext('TALENTS',context),engine:vm.runInContext('createTalentEngine(TALENTS)',context)};
}
function add(engine,state,t,amount=t.max) {
  const result=engine.change(state,t.id,amount);
  assert.equal(result.error,undefined,`${t.name}: ${result.error}`);
  return result.state;
}
function reach(engine,target) {
  let state=engine.empty();
  for(const t of [...engine.trees[target.tree]].sort((a,b)=>a.row-b.row)) {
    if(!engine.addReason(state,target.id)) break;
    if((t.row<target.row||t.id===target.prerequisite)&&!engine.addReason(state,t.id)) state=add(engine,state,t);
  }
  assert.equal(engine.addReason(state,target.id),'',target.name);
  return state;
}

test('directory links to all nine complete calculators',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.equal(Object.keys(source).length,9);
  assert.equal(Object.values(source).flatMap(c=>c.trees.flatMap(t=>t.talents)).length,470);
  assert.equal((html.match(/class="class-calculator" href="talents\//g)||[]).length,9);
  for(const cls of Object.keys(source)) assert.ok(html.includes(`href="talents/${cls.toLowerCase()}.html"`));
  assert.ok(!/Coming soon|reference-note|Source &amp; credits/.test(html));
});

for(const [cls,data] of Object.entries(source)) {
  const {html,context,talents,engine}=load(cls);
  test(`${cls}: positions, ranks, known effects, costs and prerequisites match supplied data`,()=>{
    assert.deepEqual(Array.from(engine.trees,t=>t.length),data.trees.map(t=>t.talents.length));
    assert.equal(new Set(talents.map(t=>t.id)).size,talents.length);
    assert.equal(new Set(talents.map(t=>`${t.tree}:${t.row}:${t.col}`)).size,talents.length);
    data.trees.forEach((tree,i)=>tree.talents.forEach(expected=>{
      const actual=talents.find(t=>norm(t.name)===norm(expected.name));
      assert.ok(actual,expected.name);
      assert.deepEqual([actual.tree,actual.row,actual.col,actual.max],[i,expected.row-1,expected.col-1,expected.max]);
      assert.equal(actual.active===true,expected.passive===false);
      assert.equal(engine.byId[actual.prerequisite]?.name,expected.req);
      const known=Array.isArray(expected.desc)?expected.desc.map((text,i)=>[i+1,text]):Object.entries(expected.desc);
      for(const [rank,text] of known) assert.deepEqual(plain(engine.effectAtRank(actual,Number(rank))),{text,rank:Number(rank),exact:true,estimated:false},`${expected.name} rank ${rank}`);
      if(expected.cost) assert.ok(actual.meta.includes(expected.cost.replace(/ \| /g,' · ')));
      if(expected.reqText) assert.ok(actual.meta.includes(expected.reqText));
      for(let rank=0;rank<=actual.max;rank++) {
        const effect=engine.effectAtRank(actual,rank);
        assert.ok(effect.text.length>0);
        assert.equal(effect.exact,effect.rank===Math.max(1,rank));
      }
    }));
  });
  test(`${cls}: every talent is reachable and prerequisite refunds/imports are enforced`,()=>{
    for(const target of talents) {
      let state=add(engine,reach(engine,target),target,1);
      assert.equal(engine.validate(state),'');
      if(target.prerequisite) {
        assert.ok(engine.change(state,target.prerequisite,-1).error,target.name);
        state.ranks[target.prerequisite]--;
        assert.ok(engine.validate(state));
        assert.throws(()=>engine.decode(engine.encode(state)),target.name);
      }
    }
  });
  test(`${cls}: point budgets, tree gates and class-specific build codes stay valid`,()=>{
    let state=engine.empty();
    for(const t of [...talents].sort((a,b)=>a.row-b.row)) if(!engine.addReason(state,t.id)) state=add(engine,state,t);
    assert.equal(engine.total(state),51);
    assert.equal(engine.validate(state),'');
    assert.ok(engine.validate({...state,level:59}));
    const code=engine.encode(state);
    assert.equal(engine.encode(engine.decode(code)),code);
    for(const invalid of [code.replace(/^[^-]+/,'FOREIGN'),code+'0',code.replace('-60-','-10-'),null,'<script>']) assert.throws(()=>engine.decode(invalid));
    const first=talents.find(t=>t.row===0);
    assert.equal(engine.total(add(engine,engine.empty(10),first,5)),1);
    const target=talents.find(t=>t.row===1);
    assert.ok(engine.change(engine.empty(),target.id,1).error);
    const gated=add(engine,reach(engine,target),target,1);
    const earlier=talents.find(t=>t.tree===target.tree&&t.row===0&&gated.ranks[t.id]);
    if(engine.below(gated,target)-gated.ranks[earlier.id]<5) assert.ok(engine.change(gated,earlier.id,-earlier.max).error);
  });
  test(`${cls}: assets are embedded and reference UI is absent`,()=>{
    const assets=vm.runInContext('ASSETS',context);
    assert.ok(talents.every(t=>assets[t.icon]?.startsWith('data:image/jpeg;base64,')));
    const readable=html.replace(/data:[^\s"')]+/g,'[asset]');
    assert.ok(!/<(?:img|script)[^>]+src="https?:/i.test(readable));
    assert.ok(!/<link[^>]+href="https?:/i.test(readable));
    const markup=readable.split('<script>')[0];
    assert.ok(!/reference|screenshot|supplied|source-strip|Calculator notes|load-video/i.test(markup));
    assert.ok(markup.includes('How to use'));
    assert.ok(readable.includes('SIL OPEN FONT LICENSE'));
  });
}
