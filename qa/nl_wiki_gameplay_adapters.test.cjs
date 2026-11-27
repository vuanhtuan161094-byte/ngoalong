const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const between=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
const itemCode=between(read('tools/nl_item_integration_v1.js'),'// === WIKI-TYPED-ITEMS ===','// === END WIKI-TYPED-ITEMS ===');
const eliteCode=between(read('tools/nl_content_c_runtime.js'),'// === WIKI-ELITE-SKILLS ===','// === END WIKI-ELITE-SKILLS ===');
const typed=new Function(itemCode+'\nreturn nlTypedWikiFallback')();
const eliteRuntime=new Function("const mobileTextKey=x=>String(x).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('vi').replace(/đ/g,'d');"+eliteCode+'\nreturn {plan:mobileElitePlan,conditionalBonuses:mobileEliteConditionalBonuses}')();
const plan=eliteRuntime.plan;
const source=JSON.parse(read('data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/data/item-detail.json')),elite=JSON.parse(read('data/ngoalong/modules/troops/mobile_elite_v1.json'));
test('20 appearances × 3 skill tracks, every source level compiles',()=>{let tracks=0,ranks=0;for(const f of elite.forces)for(const a of f.appearances)for(const [pos,skill] of a.skills.entries()){tracks++;for(const desc of skill.levels){const p=plan(a.id,pos,desc);assert.ok(p);assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));ranks++;}}assert.equal(tracks,60);assert.equal(ranks,256);});
test('Giải Phiền Nhuệ switches Thiện Chiến from attack to defense at half troops',()=>{
 const appearance=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='5');
 const levels=appearance.skills[2].levels;
 for(const [i,description] of levels.entries()){
  const sourcePlan=plan('5',2,description),ratio=[.2,.3,.4,.5][i];
  assert.equal(sourcePlan.conditionalAttack,ratio);assert.equal(sourcePlan.conditionalDefense,ratio);
  const unit={hp:51,maxHp:100,nlMobileElite:{plans:[sourcePlan]}};
  assert.deepEqual(eliteRuntime.conditionalBonuses(unit),{attack:ratio,defense:0});
  unit.hp=50;assert.deepEqual(eliteRuntime.conditionalBonuses(unit),{attack:0,defense:ratio});
  unit.hp=49;assert.deepEqual(eliteRuntime.conditionalBonuses(unit),{attack:0,defense:ratio});
 }
 assert.deepEqual(eliteRuntime.conditionalBonuses({hp:50,maxHp:0,nlMobileElite:{plans:[{conditionalAttack:.2,conditionalDefense:.2}]}}),{attack:0,defense:0});
});
test('elite Hư Nhược descriptors reject buffs instead of reducing damage',()=>{
 const camPham=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='8');
 const hitLine=plan('8',1,camPham.skills[1].levels[0]);
 assert.equal(hitLine.noBuffsLine,true);assert.equal(hitLine.pattern,'column');assert.equal(hitLine.turns,2);
 assert.equal(hitLine.weakLine,undefined);
 const tuongTuong=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='26');
 const normal=plan('26',0,tuongTuong.skills[0].levels[0]);
 assert.equal(normal.pattern,'row');assert.equal(normal.trample,3);assert.equal(normal.extraDebuff,.05);
});
test('Hoàng Cân Lực Sĩ preserves each source rank of Tụ Nghĩa layers and its five-turn gate',()=>{
 const hoangCan=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='24');
 for(const [i,description] of hoangCan.skills[1].levels.entries()){
  const sourcePlan=plan('24',1,description);
  assert.equal(sourcePlan.vulnerabilityLayers,i+1);assert.equal(sourcePlan.first,5);
 }
});
test('Hãm Trận Doanh Tỏ Chí is a timed pre-action removable-debuff cleanse',()=>{
 const hamTran=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='16');
 for(const description of hamTran.skills[2].levels){
  const sourcePlan=plan('16',2,description);
  assert.equal(sourcePlan.cleanseBeforeAction,1);assert.equal(sourcePlan.cleanse,undefined);
  assert.equal(sourcePlan.first,Number(description.match(/duy trì (\d+) lượt/i)?.[1]));
 }
});
test('Bạch Mã Pháo Xạ parses its pre-action hit, capped stat stacks and two-turn duration',()=>{
 const baiMa=elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)==='27');
 for(const [i,description] of baiMa.skills[1].levels.entries()){
  const sourcePlan=plan('27',1,description);
  assert.equal(sourcePlan.allHitBeforeAction,.60);assert.equal(sourcePlan.allHit,undefined);
  assert.equal(sourcePlan.attributeBeforeAction,[6,8,10,12][i]);assert.equal(sourcePlan.attribute,undefined);
  assert.equal(sourcePlan.attributeStackCap,5);assert.equal(sourcePlan.turns,2);assert.equal(sourcePlan.undispellable,false);
 }
});
test('Tinh Nhuệ timed effects follow the source dispel clause for each distinct effect',()=>{
 const appearance=id=>elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)===String(id));
 const hoBao=appearance('9'),voVe=appearance('12'),baiMa=appearance('27');
 assert.equal(plan('9',1,hoBao.skills[1].levels[0]).undispellable,true);
 assert.equal(plan('12',2,voVe.skills[2].levels[0]).undispellable,false);
 assert.equal(plan('12',2,voVe.skills[2].levels[0]).highImmunityUndispellable,true);
 assert.equal(plan('27',1,baiMa.skills[1].levels[0]).undispellable,false);
});
test('Tinh Nhuệ distinguishes battle-start effects from repeated first-turn effects',()=>{
 const appearance=id=>elite.forces.flatMap(f=>f.appearances).find(a=>String(a.id)===String(id));
 const giaCat=appearance('1'),camPhan=appearance('8'),voVe=appearance('12'),nguyVu=appearance('23');
 assert.equal(plan('1',1,giaCat.skills[1].levels[0]).battleStart,true);
 assert.equal(plan('8',1,camPhan.skills[1].levels[0]).battleStart,true);
 assert.equal(plan('12',2,voVe.skills[2].levels[0]).battleStart,false);
 assert.equal(plan('12',2,voVe.skills[2].levels[3]).battleStart,true);
 assert.equal(plan('23',1,nguyVu.skills[1].levels[0]).battleStart,false);
});
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

test('demotion refunds complete illusion and ancient receipts and clears dependent modes',()=>{
 const engine=require('../data/ngoalong/modules/inventory/consumables_engine.js');
 const token='mobile-vng-item-562';
 const api=engine.createModule({items:[{id:token,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK'},effectRule:null,sourceTypedRoute:'hero-reset-token'}]},{limits:{stacksKinds:10,quantityEach:100,receipts:100}});
 const records=[
  {id:'commander-1',system:'commander',heroId:'cao',level:1,currency:{silver:100,merit:10},materials:{commandManual:2}},
  {id:'ancient-1',system:'ancient',heroId:'cao',level:1,currency:{silver:5000,merit:150},materials:{quynhTuong:1,xichQua:1,hoangTrungLy:1}},
  {id:'illusion-assault',system:'illusion:assault',heroId:'cao',level:1,currency:{silver:8000,merit:250},materials:{destinyJade:2,blank:2}}
 ];
 const s={silver:0,nlClassicA:{merit:0},roster:['cao'],hero:{cao:{level:40}},heroDevelopment:{heroes:{cao:{commanderLevel:1,ancientLevel:1,illusionUnlocked:['assault'],illusionMode:'assault'}},materials:{commandManual:0,quynhTuong:0,xichQua:0,hoangTrungLy:0,destinyJade:0,blank:0},receipts:records,refundLedger:{cao:records}},nlItemsV1:{serial:0,receipts:{},stacks:{[token]:1}}};
 const q=api.heroDevelopmentRefundQuote(s,'cao','562');
 assert.deepEqual(q.blocked,[]);assert.equal(q.currency.silver,13100);assert.equal(q.currency.merit,410);
 assert.equal(q.materials.commandManual,2);assert.equal(q.materials.destinyJade,2);assert.equal(q.plan.length,3);
 const r=api.resetHeroDevelopment(s,'cao','562','illusion-reset');assert.equal(r.ok,true);
 const h=r.state.heroDevelopment.heroes.cao;
 assert.equal(h.commanderLevel,0);assert.equal(h.ancientLevel,0);assert.deepEqual(h.illusionUnlocked,[]);assert.equal(h.illusionMode,null);
 assert.equal(r.state.silver,13100);assert.equal(r.state.nlClassicA.merit,410);assert.equal(r.state.heroDevelopment.materials.blank,2);
 assert.equal(r.state.heroDevelopment.receipts.length,0);
});

test('missing illusion proof keeps that mode and blocks ancient reset without blocking verified groups',()=>{
 const engine=require('../data/ngoalong/modules/inventory/consumables_engine.js');
 const token='mobile-vng-item-562';
 const api=engine.createModule({items:[{id:token,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK'},effectRule:null,sourceTypedRoute:'hero-reset-token'}]},{limits:{stacksKinds:10,quantityEach:100,receipts:100}});
 const records=[
  {id:'commander-1',system:'commander',heroId:'cao',level:1,currency:{silver:100,merit:10},materials:{commandManual:2}},
  {id:'illusion-assault',system:'illusion:assault',heroId:'cao',level:1,currency:{silver:8000,merit:250},materials:{destinyJade:2,blank:2}}
 ];
 const s={silver:0,nlClassicA:{merit:0},roster:['cao'],hero:{cao:{level:40}},heroDevelopment:{heroes:{cao:{commanderLevel:1,ancientLevel:1,illusionUnlocked:['assault','guardian'],illusionMode:'guardian'}},materials:{commandManual:0,destinyJade:0,blank:0},receipts:records,refundLedger:{cao:records}},nlItemsV1:{serial:0,receipts:{},stacks:{[token]:1}}};
 const q=api.heroDevelopmentRefundQuote(s,'cao','562');
 assert.ok(q.blocked.includes('illusion:guardian'));assert.ok(q.blocked.includes('ancientLevel'));
 assert.ok(!q.plan.some(p=>p.field==='ancientLevel'));assert.equal(q.currency.silver,8100);assert.equal(q.currency.merit,260);
 const r=api.resetHeroDevelopment(s,'cao','562','partial-illusion-reset');assert.equal(r.ok,true);
 const h=r.state.heroDevelopment.heroes.cao;
 assert.equal(h.commanderLevel,0);assert.equal(h.ancientLevel,1);assert.deepEqual(h.illusionUnlocked,['guardian']);assert.equal(h.illusionMode,'guardian');
 assert.equal(r.state.silver,8100);assert.equal(r.state.nlClassicA.merit,260);
 assert.equal(r.state.heroDevelopment.materials.destinyJade,2);assert.equal(r.state.heroDevelopment.materials.blank,2);
 assert.equal(r.state.heroDevelopment.receipts.length,0);
});

test('wiki lethal settlement caps hits, executes below threshold and consumes one life without negative HP',()=>{
 const code=between(read('tools/nl_content_c_runtime.js'),'function wikiHitLimits(','function mobileSingleHit(');
 const limit=new Function(code+'\nreturn wikiHitLimits')();
 assert.deepEqual(limit(100,100,80,.25,0,0),{damage:25,restored:0});
 assert.deepEqual(limit(40,100,30,0,.15,0),{damage:40,restored:0});
 assert.deepEqual(limit(40,100,100,0,0,.15),{damage:25,restored:15});
 assert.deepEqual(limit(40,100,0,0,.95,0),{damage:0,restored:0});
});
test('new Wiki statuses map to functional combat fields and keep undispellable variants separate',()=>{
 const code=between(read('tools/nl_content_c_runtime.js'),'function wikiExtraSourceApplications(','// === END WIKI-SHARED-STATUS-ADAPTER ===');
 const records=JSON.parse(read('data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/data/buff-map.json'));
 const data={statusEffects:{effects:{}}};
 const build=new Function('MOBILE_BUFFS','NL_GAME_DATA','mobileTextKey','clamp','MOBILE_SOURCE_CONFUSION',code+'\nreturn wikiExtraSourceApplications')({records},data,x=>String(x).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase(),(v,a,b)=>Math.max(a,Math.min(b,v)),'confused');
 const ids=['57','59','60','61','62','66','69','71','72','75','76','79','80','81','84','85','89','93','94','95','96','97','98'];
 const rows=build({desc:''},ids.map(id=>({id,detail:'20%'})),[]);
 assert.equal(rows.length,23);
 const find=id=>rows.find(r=>r.sourceId===id);
 assert.equal(find('57').values.wikiExecuteBelow,.2);
 assert.equal(find('59').values.wikiExtraHits,1);
 assert.equal(find('71').stack,true);
 assert.equal(find('71').dispelPolicy,'undispellable');
 assert.equal(data.statusEffects.effects[find('76').kind].skipActionChance,1);
 assert.equal(find('98').mechanic,'instant-dispel-limited');
});

test('39 level gifts retain the source sequence, commander gates and explicit substitutions',()=>{
 const rows=source.items.filter(x=>/^Quà Cấp \d+$/.test(x.name));
 assert.equal(rows.length,39);
 for(const row of rows){
  const p=typed(row,source,3),rank=Number(row.name.match(/\d+/)[0]);
  assert.equal(p.route,'level-gift-chain');assert.equal(p.levelGift,rank);
  assert.ok(p.minCommander>=10);
  assert.ok(p.outputs.some(x=>x.wallet==='silver'));
  if(rank<39)assert.equal(p.outputs[0].name,'Quà Cấp '+(rank+1));
  else assert.ok(p.substitutions.some(x=>x.includes('Quà Cấp 40')));
 }
 assert.equal(typed(rows.find(x=>x.name==='Quà Cấp 17'),source,3).minCommander,210);
 const p=typed(rows.find(x=>x.name==='Quà Cấp 38'),source,3);
 assert.ok(p.outputs.some(x=>x.wallet==='stack'&&x.itemId==='mobile-vng-item-res_16'&&x.qty===11000));
});
test('level gift sequence is one-time, gated and cannot be purchased out of order',()=>{
 const engine=require('../data/ngoalong/modules/inventory/consumables_engine.js');
 const gift=(id,rank,gate,outputs)=>({id,name:id,category:'consumable',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:gate,shopCost:{silver:10}},effectRule:{kind:'OPEN_SOURCE_BUNDLE',minCommander:gate,levelGift:rank,outputs}});
 const g1=gift('g1',1,10,[{name:'g2',qty:1,wallet:'stack',itemId:'g2'},{name:'Bạc',qty:100,wallet:'silver'}]),g2=gift('g2',2,20,[{name:'Bạc',qty:200,wallet:'silver'}]);
 const api=engine.createModule({items:[g1,g2]},{limits:{stacksKinds:10,quantityEach:999,receipts:100}});
 let s={silver:100,nlContentC:{mobileCommanderLevel:10},nlItemsV1:{serial:0,receipts:{},stacks:{g1:2}}};
 assert.equal(api.buySourceBundle(s,'g2','shop').ok,false);
 let r=api.use(s,'g1','one');assert.ok(r.ok);s=r.state;
 assert.equal(s.silver,200);assert.equal(s.nlItemsV1.stacks.g2,1);
 assert.equal(api.use(s,'g1','again').ok,false);assert.equal(api.use(s,'g2','low').ok,false);
 s.nlContentC.mobileCommanderLevel=20;r=api.use(s,'g2','two');assert.ok(r.ok);
 assert.equal(r.state.silver,400);assert.equal(r.state.nlContentC.levelGiftClaims[2],true);
});
test('festival gold keeps literal random-one amounts and exact fixed reward',()=>{
 const p=typed(source.items.find(x=>String(x.id)==='713'),source,3);
 assert.equal(p.random,true);assert.deepEqual(p.outputs.map(x=>x.qty),[138,158,188,588,1888]);
 assert.equal(typed(source.items.find(x=>String(x.id)==='811'),source,3).outputs[0].qty,999);
});

test('Wiki troop descriptions compile normal attacks, literal control chances and morale behavior',()=>{
 const code=between(read('tools/nl_content_c_runtime.js'),'// === WIKI-TROOP-DESCRIPTION-ADAPTER ===','// === END WIKI-TROOP-DESCRIPTION-ADAPTER ===');
 const compile=new Function("const mobileTextKey=x=>String(x).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('vi').replace(/đ/g,'d');"+code+'\nreturn wikiTroopPlan')();
 const {units}=JSON.parse(read('data/ngoalong/modules/troops/mobile_units_v1.json'));
 const plans=Object.values(units).map(compile);assert.equal(plans.length,408);
 assert.ok(plans.filter(p=>p.pattern!=='single'||p.control||p.moraleLock||p.drain||p.selfMorale||p.teamMorale||p.burn||p.poison||p.noMorale||p.extraMagic).length>80);
 assert.equal(compile(units['59']).control,.15);assert.equal(compile(units['3']).moraleLock,.05);
 assert.equal(compile(units['138']).selfMorale,50);assert.equal(compile(units['138']).noMorale,true);
 assert.equal(compile(units['164']).pattern,'row');assert.equal(compile(units['164']).burn,2);
 assert.equal(compile(units['172']).poison,2);assert.equal(compile(units['172']).control,.10);
 assert.equal(compile(units['228']).teamMorale,30);
});
