'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { createModule, validateCatalogue } = require('../data/ngoalong/modules/inventory/engine.js');
const base = require('../data/ngoalong/modules/inventory/catalogue.json');
const rules = require('../data/ngoalong/modules/inventory/rules.json');
const source = require('../data/ngoalong/modules/inventory/mobile_wiki_v1.json');
const { createModule: createConsumables } = require('../data/ngoalong/modules/inventory/consumables_engine.js');
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
  assert.equal(source.runtimeEquipment.length,114);
  assert.equal(source.runtimeMaterials.length,34);
  assert.deepEqual(source.equipmentSellAudit,{sourceRows:399,positiveValues:399,
    runtimeSellValues:114,runtimeCurrency:'silver',currencyClassification:'SIMULATED'});
  assert.deepEqual(source.runtimeCounts,{activeSourceEquipment:114,activeSourceMaterials:34,
    campaignDropEquipment:36,sourceExactShopEquipment:96,dropBoundMaterials:30,
    dropBoundResourceCurrencies:3,currencyWithUnresolvedEarningRoute:1});
  assert.deepEqual(source.equipmentPurchaseCostCounts,{total:118,sourceExactShopRows:96,
    unresolvedCostRows:22,byCostType:{'0':22,'1':50,'2':20,'15':10,'16':16}});
  assert.equal(source.unresolvedCampaignDrops.length,12);
  const rows=validateCatalogue(pack);
  assert.equal(rows['mobile-vng-equipment-1'].sourceEdition,'CURRENT_VNG_MOBILE_WIKI');
  assert.equal(rows['mobile-vng-resource-res_16'].name,'Tranh ngọc');
  assert.equal(rows['mobile-vng-resource-res_15'].name,'Tử Long Ngọc');
});

test('source shop purchases debit exact Bạc, Vàng and material prices atomically',()=>{
  const silver=source.runtimeEquipment.find(x=>x.sourceId==='1');
  const gold=source.runtimeEquipment.find(x=>x.sourceId==='187');
  const tranh=source.runtimeEquipment.find(x=>x.sourceId==='286');
  const tuLong=source.runtimeEquipment.find(x=>x.sourceId==='32');
  let state=fresh();state.gold=1000;
  const silverBefore=state.silver;
  state=ok(engine.buy(state,silver.id,'mobile-shop:silver'));
  assert.equal(state.silver,silverBefore-silver.acquisitionRule.shopCost.silver);
  const goldBefore=state.gold;
  state=ok(engine.buy(state,gold.id,'mobile-shop:gold'));
  assert.equal(state.gold,goldBefore-gold.acquisitionRule.shopCost.gold);
  state=ok(engine.grant(state,[{id:'mobile-vng-resource-res_16',quantity:999}], 'mobile-shop:tranh-fund'));
  const tranhCost=tranh.acquisitionRule.shopMaterials[0].quantity;
  state=ok(engine.buy(state,tranh.id,'mobile-shop:tranh'));
  assert.equal(state.nlItemsV1.stacks['mobile-vng-resource-res_16'],999-tranhCost);
  state=ok(engine.grant(state,[{id:'mobile-vng-resource-res_15',quantity:400}], 'mobile-shop:tulong-fund'));
  const tuLongCost=tuLong.acquisitionRule.shopMaterials[0].quantity;
  state=ok(engine.buy(state,tuLong.id,'mobile-shop:tulong'));
  assert.equal(state.nlItemsV1.stacks['mobile-vng-resource-res_15'],400-tuLongCost);
  const poor=JSON.parse(JSON.stringify(state));poor.gold=0;
  const failed=engine.buy(poor,gold.id,'mobile-shop:poor-gold');
  assert.equal(failed.code,'INSUFFICIENT_RESOURCES');
  assert.deepEqual(failed.state,poor);
});

test('source sale pays the exact Wiki amount, uses simulated Bạc mapping and forbids selling equipped gear',()=>{
  const row=source.runtimeEquipment.find(x=>x.sourceId==='1');
  const sourceRow=source.equipment.find(x=>String(x.id)==='1');
  assert.equal(row.mobileSale.amount,sourceRow.sell);
  let state=ok(engine.grant(fresh(),[{id:row.id,quantity:1}],'mobile-sale:grant'));
  const uid=state.items[0].uid,before=state.silver;
  const sold=engine.sell(state,uid,'mobile-sale:sell');
  assert.equal(sold.ok,true,sold.code);
  assert.equal(sold.detail.amount,sourceRow.sell);
  assert.equal(sold.detail.currencyClassification,'SIMULATED');
  assert.equal(sold.state.silver,before+sourceRow.sell);
  assert.equal(sold.state.items.length,0);
  assert.equal(engine.sell(sold.state,uid,'mobile-sale:sell').duplicate,true);

  let worn=ok(engine.grant(fresh(),[{id:row.id,quantity:1}],'mobile-sale:worn-grant'));
  const wornUid=worn.items[0].uid;worn=ok(engine.equip(worn,'liu',wornUid,'mobile-sale:equip'));
  const rejected=engine.sell(worn,wornUid,'mobile-sale:equipped');
  assert.equal(rejected.code,'EQUIPMENT_EQUIPPED');
  assert.deepEqual(rejected.state,worn);
});

test('gold item rewards settle through the shared currency Save v5 field',()=>{
  const pack={items:[{id:'qa-gold-bundle',name:'QA',category:'consumable',
    integration:'PLAYABLE',provenance:{classification:'SIMULATED'},
    effectRule:{kind:'GRANT_RESOURCE',resource:'gold',amount:15}}]};
  const api=createConsumables(pack,{limits:{stacksKinds:20,quantityEach:999,receipts:100}});
  const state={version:5,gold:5,hero:{},items:[],gear:{},
    nlItemsV1:{stacks:{'qa-gold-bundle':1},receipts:{},serial:0}};
  const result=api.use(state,'qa-gold-bundle','qa:gold');
  assert.equal(result.ok,true,result.code);
  assert.equal(result.state.gold,20);
  assert.equal(result.state.nlItemsV1.stacks['qa-gold-bundle'],undefined);
  assert.equal(result.state.version,5);
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

test('R6 exact-name and level craft source links consume materials on all valid promotions',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const src=fs.readFileSync(path.join(__dirname,'../tools/nl_item_integration_v1.js'),'utf8');
 const links=new Function('source',src.slice(src.indexOf('function nlMobileCraftLinks('),src.indexOf('const NL_MOBILE_CRAFT_LINKS='))+'return nlMobileCraftLinks(source);')(source);
 assert.equal(links.length,82);assert.equal(new Set(links.map(x=>x.id)).size,49);
 const all=new Function('source',src.slice(src.indexOf('function nlMobileFallbackEquipment('),src.indexOf('const NL_MOBILE_FALLBACK_GEAR='))+'return nlMobileFallbackEquipment(source);')({...source,runtimeEquipment:[]});
 const by=new Map(all.map(g=>[g.sourceId,g])),pairs=[];
 for(const g of source.equipment){const a=by.get(String(g.id)),b=by.get(String(g.upgradeTo?.id)),l=links.find(x=>x.to===b?.id);if(!l||!b||a.slot!==b.slot||!(b.displayedLevel>a.displayedLevel||b.displayedLevel===a.displayedLevel&&b.sourceQuality>a.sourceQuality))continue;a.mobilePromotion={to:b.id,kind:'upgrade',materials:[{id:l.id,name:l.name,quantity:1}]};pairs.push({a,b,l});}
 const mats=[...new Map(links.map(l=>[l.id,{id:l.id,name:l.name,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',provenance:{classification:'SOURCE_EXACT'},acquisitionRule:{kind:'MOBILE_DROP'},effectRule:null}])).values()];
 const api=createModule({equipment:all,items:mats},rules);assert.equal(pairs.length,136);
 for(const {a,b,l} of pairs){let state={...fresh(),nlContentC:{mobileCommanderLevel:440},items:[{uid:'r6',base:a.id,lv:1}],gear:{liu:{[a.slot]:'r6'}},nlItemsV1:{stacks:{},receipts:{},serial:0}};
 assert.equal(api.mobilePromote(state,'r6','r6:promote').code,'INSUFFICIENT_MATERIAL');
 state.nlItemsV1.stacks[l.id]=1;let out=ok(api.mobilePromote(state,'r6','r6:promote'));assert.equal(out.items[0].base,b.id);assert.equal(out.nlItemsV1.stacks[l.id],undefined);assert.equal(out.gear.liu[a.slot],'r6');assert.equal(api.mobilePromote(out,'r6','r6:promote').duplicate,true);}
});
