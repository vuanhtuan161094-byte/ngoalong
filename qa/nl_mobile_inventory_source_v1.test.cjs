'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { createModule, validateCatalogue } = require('../data/ngoalong/modules/inventory/engine.js');
const base = require('../data/ngoalong/modules/inventory/catalogue.json');
const rules = require('../data/ngoalong/modules/inventory/rules.json');
const source = require('../data/ngoalong/modules/inventory/mobile_wiki_v1.json');
const pack = structuredClone(base);
pack.equipment.push(...source.runtimeEquipment);
pack.items.push(...source.runtimeMaterials);
const engine = createModule(pack, rules);
const fresh = () => ({version:5,hero:{liu:{level:60}},roster:['liu'],items:[],gear:{liu:{}},
  silver:1_000_000_000_000,iron:1_000_000,grain:1_000_000,prestige:0,
  nlContentC:{mobileCommanderLevel:1}});
const ok = result => {assert.equal(result.ok,true,result.code);return result.state;};

function wikiSilver(level, enhancement) {
  const G=1/600,e=level;
  let t=enhancement.inc*enhancement.coef*e*(.22+e*e*G)*enhancement.qualityCoef*G+5*e+3*enhancement.inc;
  if(e>=200)t*=2;
  return Math.floor(t);
}
function wikiNgoc(level) {
  if(level<=200)return 0;
  if(level>260)return level;
  return 40*Math.ceil((level-200)/10);
}

test('Mobile Wiki inventory source rows are exact, stable and separately playable only through mapped routes',()=>{
  assert.equal(source.sourceCounts.equipment,399);
  assert.equal(source.sourceCounts.items,746);
  assert.equal(source.sourceCounts.campaignDropRows,893);
  assert.deepEqual(source.equipmentUsageDropCounts,{total:680,matchedNpcAndDrop:618,matchedNpcDropAndRate:613,
    rateDrift:5,npcNotCaptured:29,npcFoundDropNotMatched:33});
  assert.equal(source.runtimeEquipment.length,36);
  assert.equal(source.runtimeMaterials.length,33);
  assert.equal(source.unresolvedCampaignDrops.length,12);
  const rows=validateCatalogue(pack);
  assert.equal(rows['mobile-vng-equipment-1'].sourceEdition,'CURRENT_VNG_MOBILE_WIKI');
  assert.equal(rows['mobile-vng-resource-res_16'].name,'Tranh ngọc');
});

test('source gear grant, equip, actual P2 bonus adapter and receipt survive Save v5 reload',()=>{
  const row=source.runtimeEquipment.find(x=>x.sourceId==='1');
  let state=ok(engine.grant(fresh(),[{id:row.id,quantity:1}],'mobile-drop:1'));
  const uid=state.items[0].uid;
  state=ok(engine.equip(state,'liu',uid,'mobile-equip:1'));
  const rawAtk=row.sourceStats.find(x=>x.label==='Vật Công');
  const rawHp=row.sourceStats.find(x=>x.label==='Lính');
  const toP2=value=>value>0?Math.max(1,Math.round(value*.001)):0;
  assert.equal(engine.bonuses(state,'liu').atk,toP2(rawAtk.base));
  assert.equal(engine.bonuses(state,'liu').hp,toP2(rawHp.base));
  const before=state.silver;
  const quote=engine.reinforcementCost(1,state,row.id,2);
  assert.equal(quote.silver,wikiSilver(2,row.mobileEnhancement));
  assert.equal(quote.sourceBaseExact,true);
  state=ok(engine.reinforce(state,uid,'mobile-reinforce:1',2));
  assert.equal(state.items[0].lv,2);
  assert.equal(state.silver,before-quote.silver);
  assert.equal(engine.bonuses(state,'liu').atk,toP2(rawAtk.base+rawAtk.growth));
  const saved=JSON.parse(JSON.stringify(state));
  assert.equal(engine.reinforce(saved,uid,'mobile-reinforce:1',2).duplicate,true);
  assert.equal(saved.version,5);
  assert.equal(engine.refine(saved,uid,'mobile-refine:1').code,'MOBILE_REFINE_MECHANICS_UNRESOLVED');
});

test('source batch quote follows every Wiki destination level and exact Tranh Ngọc thresholds',()=>{
  const row=source.runtimeEquipment.find(x=>x.sourceId==='1'),resource='mobile-vng-resource-res_16';
  const state=fresh();state.nlContentC.mobileCommanderLevel=200;
  const silver=[];for(let e=2;e<=261;e++)silver.push(Math.floor(wikiSilver(e,row.mobileEnhancement)*.95));
  const expectedNgoc=Array.from({length:260},(_,i)=>wikiNgoc(i+2)).reduce((a,b)=>a+b,0);
  const quote=engine.reinforcementCost(1,state,row.id,261);
  assert.equal(quote.silver,silver.reduce((a,b)=>a+b,0));
  assert.equal(quote.discount,.05);
  assert.equal(quote.discountClassification,'DERIVED_FROM_SOURCE');
  assert.equal(expectedNgoc,8661);
  assert.equal(Array.from({length:60},(_,i)=>wikiNgoc(i+201)).reduce((a,b)=>a+b,0),8400);
  assert.equal(quote.materials[0].quantity,expectedNgoc);
  assert.equal(wikiNgoc(200),0);
  assert.equal(wikiNgoc(201),40);
  assert.equal(wikiNgoc(260),240);
  assert.equal(wikiNgoc(261),261);
  assert.throws(()=>engine.reinforcementCost(1,state,row.id,426),/BAD_SOURCE_REINFORCE_TARGET/);
});

test('missing Tranh Ngọc and Bạc failures are atomic; valid late-game batch spends actual stacks',()=>{
  const row=source.runtimeEquipment.find(x=>x.sourceId==='1'),resource='mobile-vng-resource-res_16';
  let state=ok(engine.grant(fresh(),[{id:row.id,quantity:1}],'mobile-drop:2'));
  const uid=state.items[0].uid;
  state.items[0].lv=200;
  state.nlContentC.mobileCommanderLevel=300;
  const quote=engine.reinforcementCost(200,state,row.id,210);
  assert.equal(quote.materials[0].quantity,400);
  const missing={...state,silver:1_000_000_000_000};
  const noStone=engine.reinforce(missing,uid,'mobile-late:no-stone',210);
  assert.equal(noStone.code,'INSUFFICIENT_MATERIAL');
  assert.deepEqual(noStone.state,missing);
  let funded=ok(engine.grant(state,[{id:resource,quantity:400}],'mobile-resource:late'));
  const beforeSilver=funded.silver;
  funded=ok(engine.reinforce(funded,uid,'mobile-late:valid',210));
  assert.equal(funded.items[0].lv,210);
  assert.equal(funded.silver,beforeSilver-quote.silver);
  assert.equal(funded.nlItemsV1.stacks[resource],undefined);
  const poor={...funded,silver:0};
  const failure=engine.reinforce(poor,uid,'mobile-late:no-silver',211);
  assert.equal(failure.code,'INSUFFICIENT_RESOURCES');
  assert.deepEqual(failure.state,poor);
});
