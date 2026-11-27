const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
const itemCode=between(read('tools/nl_item_integration_v1.js'),'// === WIKI-TYPED-ITEMS ===','// === END WIKI-TYPED-ITEMS ===');
const eliteCode=between(read('tools/nl_content_c_runtime.js'),'// === WIKI-ELITE-SKILLS ===','// === END WIKI-ELITE-SKILLS ===');
const typed=new Function(itemCode+'\nreturn nlTypedWikiFallback')();
const plan=new Function("const mobileTextKey=x=>String(x).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/đ/g,'d').toLowerCase();"+eliteCode+'\nreturn mobileElitePlan')();
const source=JSON.parse(read('data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/data/item-detail.json')),elite=JSON.parse(read('data/ngoalong/modules/troops/mobile_elite_v1.json'));
test('20 appearances × 3 skill tracks, every source level compiles',()=>{let tracks=0,ranks=0;for(const f of elite.forces)for(const a of f.appearances)for(const [pos,skill] of a.skills.entries()){tracks++;for(const desc of skill.levels){const p=plan(a.id,pos,desc);assert.ok(p);assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));ranks++;}}assert.equal(tracks,60);assert.equal(ranks,256);});
test('27 gems and 9 child manuals resolve to specific wallets',()=>{for(const [g,n,w] of [['Ấn Thạch',27,'hero-gem'],['Bí Tịch',9,'child-manual']]){const rows=source.items.filter(x=>x.typeName===g);assert.equal(rows.length,n);for(const x of rows)assert.equal(typed(x,source,3)?.outputs[0].wallet,w);}});

test('horse growth uses source quantity and commander gate, keys remain materials',()=>{
 const get=id=>source.items.find(x=>String(x.id)===id);
 assert.equal(typed(get('res_79'),source,3).outputs[0].qty,700000);
 assert.equal(typed(get('res_122'),source,3).minCommander,400);
 assert.equal(typed(get('res_125'),source,3).material,true);
});
test('complete loot table preserves named stacks and quantities; partial tables never masquerade as exact',()=>{
 const fixture={items:[{id:'r1',name:'Vải Bạt'}]};
 const row={id:'r2',name:'Rương thử',typeName:'Rương',desc:'Mở nhận: Bạc x100, Vải Bạt x3'};
 const p=typed(row,fixture,2);
 assert.equal(p.route,'named-loot-all');
 assert.deepEqual(p.outputs.map(x=>[x.wallet,x.qty]),[['silver',100],['stack',3]]);
 assert.equal(p.outputs[1].itemId,'mobile-vng-item-r1');
 const incomplete=typed({...row,desc:'Mở nhận: Bạc x100, Vật chưa rõ x2'},fixture,2);
 assert.notEqual(incomplete?.route,'named-loot-all');
 assert.notEqual(incomplete?.route,'known-loot-bundle');
});

test('Tinh Nhuệ reset token is a material, not a generic reward box',()=>{
 const row=source.items.find(x=>String(x.id)==='856');
 assert.equal(typed(row,source,3).route,'elite-reset-token');
 assert.equal(typed(row,source,3).material,true);
});
test('Elite reset returns actual debits once, clears assignment and rejects missing history',()=>{
 const engine=require('../data/ngoalong/modules/inventory/consumables_engine.js');
 const material=(id,route)=>({id,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK'},effectRule:null,sourceTypedRoute:route});
 const token='mobile-vng-item-856',book='mobile-vng-item-mat_63';
 const api=engine.createModule({items:[material(token,'elite-reset-token'),material(book)]},{limits:{stacksKinds:10,quantityEach:100,receipts:100}});
 let s={nlItemsV1:{serial:0,receipts:{},stacks:{[token]:2,[book]:20}},nlContentC:{mobileEliteUnlocked:{'9':true},mobileEliteLevels:{'9':2},mobileEliteSkills:{},mobileElitePending:{},mobileEliteAssigned:{hero:'9'}}};
 assert.equal(api.resetElite(s,'9','bad').ok,false);
 s=api.consumeSourceMaterials(s,[{id:book,quantity:3}],'u1','mobile-elite:unlock:9:1').state;
 s=api.consumeSourceMaterials(s,[{id:book,quantity:4}],'u2','mobile-elite:upgrade:9:2').state;
 const q=api.quoteEliteReset(s,'9');assert.equal(q.refund[book],7);
 const r=api.resetElite(s,'9','reset1');assert.equal(r.ok,true);assert.equal(r.state.nlItemsV1.stacks[book],20);
 assert.equal(r.state.nlItemsV1.stacks[token],1);assert.equal(r.state.nlContentC.mobileEliteAssigned.hero,undefined);
 assert.equal(api.resetElite(r.state,'9','reset1').duplicate,true);
 assert.equal(api.resetElite(r.state,'9','reset2').ok,false);
});

test('three demotion tokens refund recorded rank costs at 60/80/100 percent only once',()=>{
 const engine=require('../data/ngoalong/modules/inventory/consumables_engine.js');
 for(const [id,rate] of [['560',60],['561',80],['562',100]]){
  const token='mobile-vng-item-'+id;
  assert.equal(typed(source.items.find(x=>String(x.id)===id),source,3).route,'hero-reset-token');
  const api=engine.createModule({items:[{id:token,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK'},effectRule:null,sourceTypedRoute:'hero-reset-token'}]},{limits:{stacksKinds:10,quantityEach:100,receipts:100}});
  const records=[{id:'a',system:'commander',heroId:'cao',level:1,currency:{silver:100,merit:10},materials:{commandManual:5}},{id:'b',system:'commander',heroId:'cao',level:2,currency:{silver:200,merit:10},materials:{commandManual:5}}];
  const s={silver:0,nlClassicA:{merit:0},roster:['cao'],hero:{cao:{level:40}},heroDevelopment:{heroes:{cao:{commanderLevel:2,inheritanceLevel:1}},materials:{commandManual:0},receipts:records,refundLedger:{cao:records}},nlItemsV1:{serial:0,receipts:{},stacks:{[token]:2}}};
  const q=api.heroDevelopmentRefundQuote(s,'cao',id);
  assert.equal(q.currency.silver,3*rate);assert.equal(q.materials.commandManual,rate/10);assert.equal(q.plan.length,1);
  const r=api.resetHeroDevelopment(s,'cao',id,'reset');assert.ok(r.ok);
  assert.equal(r.state.silver,3*rate);assert.equal(r.state.heroDevelopment.heroes.cao.commanderLevel,0);
  assert.equal(r.state.heroDevelopment.heroes.cao.inheritanceLevel,1);assert.equal(r.state.hero.cao.level,40);
  assert.equal(api.resetHeroDevelopment(r.state,'cao',id,'again').ok,false);
 }
});
