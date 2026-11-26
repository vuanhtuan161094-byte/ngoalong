// === NL-ITEMS-V1 — canonical Group08 integration candidate ===
// This source is injected into the game's existing closure before BOOT.
// Sources: Group04 inventory engine/UI + catalogue/rules; project formulas SIMULATED.
// Do not mark release READY until Chromium/save/replay/exact-SHA gates pass.
const NL_ITEM_CATALOGUE = window.NLItemBalanceV1.apply(__NL_ITEMS_CATALOGUE__);
// Balance B2 changes only 667 project-origin item rules, not Wiki reference rows.
window.NLItemBalanceV1.economicAudit(NL_ITEM_CATALOGUE);
const NL_MOBILE_INVENTORY=NL_ITEM_CATALOGUE.mobileSource;
if(NL_MOBILE_INVENTORY?.sourceCounts?.equipment!==399||NL_MOBILE_INVENTORY?.sourceCounts?.items!==746||
   NL_MOBILE_INVENTORY.runtimeCounts?.activeSourceEquipment!==114||
   NL_MOBILE_INVENTORY.runtimeCounts?.activeSourceMaterials!==34||
   NL_MOBILE_INVENTORY.runtimeEquipment?.length!==114||NL_MOBILE_INVENTORY.runtimeMaterials?.length!==34)
  throw new Error('NL_MOBILE_INVENTORY_SOURCE_COVERAGE_MISMATCH');
// Keep the immutable normalized source routes separate from the offline merchant adapter.
function nlMobileFallbackEquipment(source){
 const exact=new Set(source.runtimeEquipment.map(x=>String(x.sourceId))),slots={1:'weapon',2:'armor',3:'horse',4:'book',5:'cloak',6:'shield',7:'artifact'};
 const labels={'Vật Công':'atk','Pháp Công':'catk','Mưu Công':'matk','Vật Phòng':'def','Pháp Phòng':'tdef','Mưu Phòng':'mdef','Lính':'hp','Bạo Kích':'crit','Phản Kích':'counter','Né Tránh':'dodge'};
 return source.equipment.filter(row=>!exact.has(String(row.id))).map(row=>{
  const stats=Object.fromEntries([...Object.values(labels),'int'].map(k=>[k,0]));
  for(const a of row.stats||[])if(labels[a.label])stats[labels[a.label]]=Math.max(0,Math.trunc(a.base||0));
  const quality=source.equipTiers[String(row.quality)]||{},sell=Math.max(1,Math.trunc(row.sell||0));
  // Original cost and currency code are preserved even when unresolved. No fake source price.
  const price=Math.max(sell+1,Math.ceil(sell*1.35),500*(1+Number(row.quality||0)));
  return {id:'mobile-vng-equipment-'+row.id,sourceId:String(row.id),name:row.name,category:'equipment',integration:'PLAYABLE',
   sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceGroup:row.qualityName||'',displayedLevel:row.level,requiredLevel:1,
   slot:slots[row.type],rarity:row.qualityName||'Thường',stats,sourceStats:row.stats,sourceQuality:row.quality,
   sourceType:row.type,sourceTypeName:row.typeName,sourceDesc:row.desc||'',sourceIcon:row.icon,
   sourceAcquisition:{cost:row.cost,costType:row.costType,costName:row.costName,usage:row.usage,upgradeFrom:row.upgradeFrom,upgradeTo:row.upgradeTo},
   mobileEnhancement:{classification:'SOURCE_EXACT',maxLevel:425,inc:row.cuongHoa.inc,coef:row.cuongHoa.coef,
    qualityCoef:quality.coef||1,tierName:quality.name||row.qualityName,statScale:.001,formulaId:'VNG_WIKI_BAC_CUONG_HOA_V1'},
   mobileRefinement:{classification:'SOURCE_EXACT_DATA_WITH_RUNTIME_EFFECTS_UNRESOLVED',slot:String(row.type),sourcePools:source.equipRefine[String(row.type)]},
   mobileSale:{classification:'SOURCE_EXACT_VALUE_WITH_SIMULATED_CURRENCY',amount:sell,currency:'silver',currencyClassification:'SIMULATED'},
   acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:Math.max(10,Math.min(440,Number(row.level)||10)),shopCost:{silver:price},shopMaterials:[]},
   enhancementRule:{kind:'MOBILE_WIKI_EXACT',maxLevel:425},
   fieldProvenance:{name:'SOURCE_EXACT',sourceStats:'SOURCE_EXACT',stats:'DERIVED_FROM_SOURCE',enhancementRule:'SOURCE_EXACT',acquisitionRule:'SIMULATED_FALLBACK'},
   provenance:{classification:'SOURCE_EXACT',sourceId:'mobile-wiki-equip-detail'}};
 });
}
const NL_MOBILE_FALLBACK_GEAR=nlMobileFallbackEquipment(NL_MOBILE_INVENTORY);
if(NL_MOBILE_FALLBACK_GEAR.length!==285)throw Error('MOBILE_FALLBACK_GEAR_COUNT_DRIFT');
const NL_MOBILE_GEAR_ALL=[...NL_MOBILE_INVENTORY.runtimeEquipment,...NL_MOBILE_FALLBACK_GEAR];
const nlMobileGearRaw=new Map(NL_MOBILE_INVENTORY.equipment.map(x=>[String(x.id),x]));
for(const row of NL_MOBILE_GEAR_ALL){
 const raw=nlMobileGearRaw.get(String(row.sourceId)),to=nlMobileGearRaw.get(String(raw?.upgradeTo?.id));
 if(raw&&to&&raw.type===to.type&&(to.level>raw.level||to.level===raw.level&&to.quality>raw.quality)){
  row.mobilePromotion={to:'mobile-vng-equipment-'+to.id,sourceName:to.name,kind:raw.upgradeKind||'upgrade',sourceRelation:'SOURCE_EXACT',costClassification:'SIMULATED'};
 }
}
NL_ITEM_CATALOGUE.equipment.push(...NL_MOBILE_GEAR_ALL);
NL_ITEM_CATALOGUE.items.push(...NL_MOBILE_INVENTORY.runtimeMaterials);
function nlMobileSourceBundles(source){
 const awakening=new Set(['Bánh Bao','Thịt','Rượu','Trân Châu','Ngọc Bôi','Kim Lô','Hổ Phách','Lam Bảo Thạch','Lang Nha Ngọc','Băng Tuyết Liên','Linh Chi Rừng','Hà Thủ Ô Trăm Năm','Thanh Liên','Bàn Đào','Nhân Sâm Quả','Quỳnh Tương','Chu Quả','Thiên Mai','Hoàng Trung Lý']);
 const bundles=[];
 // Additional fixed source rewards are connected to existing growth wallets.
 // Source quantities are exact; point and legacy material conversions, and merchant prices, are SIMULATED.
 const direct={
  'res_120':{output:{name:'Linh Lăng-Thanh',qty:1,wallet:'horse-points',factor:350000},price:350000,gate:300},
  'res_121':{output:{name:'Linh Lăng-Tinh',qty:1,wallet:'horse-points',factor:620000},price:620000,gate:350},
  'res_122':{output:{name:'Linh Lăng-Cống',qty:1,wallet:'horse-points',factor:930000},price:930000,gate:400},
  'res_119':{output:{name:'Thanh Trĩ Thảo',qty:1,wallet:'horse-points',factor:175000},price:175000,gate:250},
  'res_114':{output:{name:'Mệnh Hồn Luyện Ngọc',qty:1,wallet:'destiny-jade'},price:2500,gate:400},
  'res_123':{output:{name:'Điểm Khoa Kỹ',qty:1,wallet:'science'},price:500,gate:100},
  'res_95':{output:{name:'Hổ Phù',qty:1,wallet:'tiger-token'},price:500000,gate:210},
  'res_107':{output:{name:'Long Phượng Bội',qty:1,wallet:'beauty-pendant'},price:5000,gate:100},
  '539':{output:{name:'EXP chúa công',qty:100,maxQty:200,wallet:'commander-xp'},price:4000,gate:10},
  '540':{output:{name:'EXP chúa công',qty:500,maxQty:800,wallet:'commander-xp'},price:18000,gate:30},
  '541':{output:{name:'EXP chúa công',qty:1500,maxQty:2000,wallet:'commander-xp'},price:45000,gate:80},
  '607':{output:{name:'EXP chúa công',qty:3200,maxQty:4000,wallet:'commander-xp'},price:90000,gate:150},
  '1067':{output:{name:'Bạc',qty:1000000,wallet:'silver'},price:1100000,gate:100},
  '1063':{output:{name:'Lệnh Phái Vũ Khí ĐB',qty:4,wallet:'weapon-core'},price:2800},
  '1062':{output:{name:'Lệnh Phái Vũ Khí ĐB',qty:2,wallet:'weapon-core'},price:1400},
  '1061':{output:{name:'Lăng La',qty:2,wallet:'stack',itemId:'mobile-vng-item-fam_10'},price:4200},
  '1055':{output:{name:'Cỏ Khô',qty:1,wallet:'horse-points',factor:700000},price:700000,gate:250},
  '1059':{output:{name:'Chiến Tích',qty:50000,wallet:'seal-credit'},price:100000,gate:100},
  '1072':{output:{name:'Phôi Vạn Năng',qty:1,wallet:'blank'},price:1500,gate:100},
  'res_79':{output:{name:'Cỏ Khô',qty:1,wallet:'horse-points',factor:700000},price:700000,gate:250},
  'res_96':{output:{name:'Cỏ Khô Nhỏ',qty:1,wallet:'horse-points',factor:10000},price:10000,gate:250},
  '1109':{output:{name:'Thư Linh-Cao',qty:10,wallet:'book-exp',factor:1000},price:22000},
  '1149':{output:{name:'Lệnh Phái Vũ Khí ĐB',qty:6,wallet:'weapon-core',factor:1},price:4000},
  '1152':{output:{name:'Mệnh Hồn Luyện Ngọc',qty:1,wallet:'destiny-jade',factor:1},price:2500},
  '1227':{output:{name:'Thanh Trĩ Thảo',qty:175000,wallet:'horse-points',factor:1},price:175000,gate:250}
 };
 for(const row of source.items){
  const fixed=direct[String(row.id)]||(String(row.id).startsWith('res_')&&awakening.has(row.name)?{output:{name:row.name,qty:1,wallet:'awakening'},price:8,gate:10}:null);
  if(fixed){
   bundles.push({id:'mobile-vng-item-'+row.id,sourceId:String(row.id),name:row.name,category:'consumable',integration:'PLAYABLE',
    sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:row.typeName,sourceDesc:row.desc,sourceIcon:row.icon,provenance:{classification:'SOURCE_EXACT'},
    acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',shopCost:{silver:fixed.price},minCommander:fixed.gate||0},
    effectRule:{kind:'OPEN_SOURCE_BUNDLE',outputs:[fixed.output],minCommander:fixed.gate||0,classification:'SOURCE_EXACT_QUANTITIES_SIMULATED_WALLET_ADAPTER'}});
   continue;
  }
  const match=String(row.desc||'').match(/^Mở(?:.+?)? nhận:\s*(.+)$/u);if(!match)continue;
  let body=match[1].replace(/, có thể dùng để.+$/u,'').replace(/\.$/,'');
  const parts=body.split(/,\s*/),outputs=[];
  for(const part of parts){
   const entry=part.match(/^(.+?)\s+x(\d+)$/u);if(!entry)break;
   const name=entry[1],qty=Number(entry[2]),wallet=awakening.has(name)?'awakening':name==='Điểm Khoa Kỹ'?'science':name==='Huân Đỉnh'?'tripod':null;
   if(!wallet||!Number.isSafeInteger(qty)||qty<=0)break;outputs.push({name,qty,wallet});
  }
  if(outputs.length!==parts.length||!outputs.length)continue;
  const price=outputs.reduce((sum,x)=>sum+x.qty*(x.wallet==='awakening'?8:x.wallet==='science'?500:1000),0);
  bundles.push({id:'mobile-vng-item-'+row.id,sourceId:String(row.id),name:row.name,category:'consumable',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',
   sourceCategory:row.typeName,sourceDesc:row.desc,sourceIcon:row.icon,provenance:{classification:'SOURCE_EXACT'},
   acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',shopCost:{silver:price}},
   effectRule:{kind:'OPEN_SOURCE_BUNDLE',outputs,classification:'SOURCE_EXACT_QUANTITIES'}});
 }
 return bundles;
}
const NL_MOBILE_BUNDLES=nlMobileSourceBundles(NL_MOBILE_INVENTORY);
for(const row of NL_MOBILE_BUNDLES){
 const i=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===row.id);
 if(i>=0)NL_ITEM_CATALOGUE.items[i]=row;else NL_ITEM_CATALOGUE.items.push(row);
}
// Promote the six explicit source exchange links; only base ingredients are sold.
function nlMobileExchangeMaterials(source){
 const byId=new Map(source.items.map(x=>[String(x.id),x])),recipes=new Map(),ids=new Set(),outputs=new Set();
 for(const row of source.items)for(const link of row.usage?.exchangeFrom||[]){
  const from=String(link.from),to=String(row.id),need=Number(link.scale);
  if(!from.startsWith('mat_')||!to.startsWith('mat_')||!byId.has(from)||from===to||!Number.isSafeInteger(need)||need<2||recipes.has(from))continue;
  recipes.set(from,{output:'mobile-vng-item-'+to,needPieces:need,silverCost:0,outputQuantity:1,kind:'CRAFT_REAGENT',classification:'SOURCE_RATIO_WITH_SIMULATED_ZERO_FEE'});ids.add(from);ids.add(to);outputs.add(to);
 }
 return [...ids].map(id=>{const row=byId.get(id),base=!outputs.has(id);return {id:'mobile-vng-item-'+id,sourceId:id,name:row.name,category:'material',integration:'PLAYABLE',
  sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:row.typeName,sourceDesc:row.desc||'',sourceIcon:row.icon,provenance:{classification:'SOURCE_EXACT'},
  acquisitionRule:base?{kind:'SHOP',classification:'SIMULATED_FALLBACK',shopCost:{silver:1200},minCommander:100}:{kind:'MATERIAL_EXCHANGE',classification:'SOURCE_EXACT'},
  effectRule:recipes.get(id)||null};});
}
const NL_MOBILE_EXCHANGE=nlMobileExchangeMaterials(NL_MOBILE_INVENTORY);
if(NL_MOBILE_EXCHANGE.length!==9||NL_MOBILE_EXCHANGE.filter(x=>x.effectRule).length!==6)throw Error('MOBILE_MATERIAL_EXCHANGE_DRIFT');
for(const row of NL_MOBILE_EXCHANGE){
 const i=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===row.id);
 if(i>=0)NL_ITEM_CATALOGUE.items[i]=row;else NL_ITEM_CATALOGUE.items.push(row);
}
// Ordinary Tri Kỷ gifts: exact XP/score gate; merchant price follows existing gift adapter.
const NL_MOBILE_GIFTS=NL_MOBILE_INVENTORY.items.filter(row=>[0,1].includes(row.gift?.famousType)&&Number.isSafeInteger(row.gift.effect)&&row.gift.effect>0).map(row=>({
 id:'mobile-vng-item-'+row.id,sourceId:String(row.id),name:row.name,category:'material',integration:'PLAYABLE',
 sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:row.typeName,sourceDesc:row.desc||'',sourceIcon:row.icon,
 provenance:{classification:'SOURCE_EXACT'},sourceGift:{effect:row.gift.effect,needScore:row.gift.needScore||0,famousType:row.gift.famousType,classification:row.gift.famousType===1?'SIMULATED_GENERIC_PREFERENCE_GIFT':'SOURCE_EXACT_AMOUNT'},
 acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',shopCost:{silver:row.gift.effect*2}},effectRule:null
}));
if(NL_MOBILE_GIFTS.length!==17)throw Error('MOBILE_GIFT_COUNT_DRIFT');
for(const row of NL_MOBILE_GIFTS){const idx=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===row.id);if(idx>=0)NL_ITEM_CATALOGUE.items[idx]=row;else NL_ITEM_CATALOGUE.items.push(row);}
// Explicit name + level matches only. Source states the reagent identity, not quantity.
function nlMobileCraftLinks(source){
 const gear=new Map(source.equipment.map(x=>[String(x.id),x])),eligible=new Set(),links=[];
 for(const row of source.equipment){const to=gear.get(String(row.upgradeTo?.id));if(to&&row.type===to.type&&(to.level>row.level||to.level===row.level&&to.quality>row.quality))eligible.add(String(to.id));}
 for(const row of source.items){
  const desc=String(row.desc||'');if(!/^Dùng (?:để )?ghép /u.test(desc))continue;
  for(const clause of desc.replace(/^Dùng (?:để )?ghép /u,'').replace(/\.$/,'').split(/\s+và\s+/u)){
   const match=clause.match(/^(.+?)\s+\(Trang bị Lv(\d+)\)$/iu);if(!match)continue;
   const candidates=source.equipment.filter(g=>g.name===match[1]&&g.level===Number(match[2])&&eligible.has(String(g.id)));
   if(candidates.length!==1)continue;
   links.push({sourceId:String(row.id),id:'mobile-vng-item-'+row.id,name:row.name,to:'mobile-vng-equipment-'+candidates[0].id,toName:candidates[0].name,level:candidates[0].level,quantity:1});
  }
 }
 return links;
}
const NL_MOBILE_CRAFT_LINKS=nlMobileCraftLinks(NL_MOBILE_INVENTORY);
const craftByDest=new Map(NL_MOBILE_CRAFT_LINKS.map(x=>[x.to,x]));
const craftMaterials=new Map(NL_MOBILE_CRAFT_LINKS.map(x=>[x.id,x]));
if(NL_MOBILE_CRAFT_LINKS.length!==82||craftByDest.size!==82||craftMaterials.size!==49)throw Error('MOBILE_CRAFT_SOURCE_DRIFT');
let nlCraftNewMaterialCount=0;
for(const [id,link] of craftMaterials){
 const index=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===id),prior=index>=0?NL_ITEM_CATALOGUE.items[index]:null,raw=NL_MOBILE_INVENTORY.items.find(x=>String(x.id)===link.sourceId);
 if(prior?.integration==='PLAYABLE'){prior.sourceCraftTargets=NL_MOBILE_CRAFT_LINKS.filter(x=>x.id===id).map(x=>x.toName);continue;}
 const row={id,sourceId:link.sourceId,name:link.name,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:raw.typeName,sourceDesc:raw.desc,sourceIcon:raw.icon,provenance:{classification:'SOURCE_EXACT'},
 sourceCraftTargets:NL_MOBILE_CRAFT_LINKS.filter(x=>x.id===id).map(x=>x.toName),
 acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:Math.max(10,link.level-20),shopCost:{silver:Math.max(600,link.level*12)}},effectRule:null};
 if(index>=0)NL_ITEM_CATALOGUE.items[index]=row;else NL_ITEM_CATALOGUE.items.push(row);nlCraftNewMaterialCount++;
}
for(const gear of NL_MOBILE_GEAR_ALL){const link=craftByDest.get(gear.mobilePromotion?.to);if(link)gear.mobilePromotion.materials=[{id:link.id,name:link.name,quantity:link.quantity,classification:'SOURCE_IDENTITY_SIMULATED_QUANTITY'}];}
// Series-only descriptions: the source names the set and level, not individual gear.
 // Within each unique level band, add the common reagent to every valid promotion.
 // This is a SIMULATED group-to-member mapping; precise single-item links remain intact.
function nlMobileSeriesCraftLinks(source){
 const by=new Map(source.equipment.map(x=>[String(x.id),x])),eligible=new Set(),out=[];
 for(const g of source.equipment){const to=by.get(String(g.upgradeTo?.id));if(to&&g.type===to.type&&(to.level>g.level||to.level===g.level&&to.quality>g.quality))eligible.add(String(to.id));}
 const groups=source.items.filter(x=>/ghép (?:Trang Bị .+|Thao ThiếtTrang Bị) \(Trang bị Lv\d+\)/iu.test(x.desc||''));
 for(const r of groups){const level=Number(String(r.desc).match(/Lv(\d+)\)/i)?.[1]);const band=source.equipment.filter(g=>g.level===level&&eligible.has(String(g.id)));
  if(!band.length||groups.filter(x=>Number(String(x.desc).match(/Lv(\d+)\)/i)?.[1])===level).length!==1||band.length>7)continue;
  for(const g of band)out.push({id:'mobile-vng-item-'+r.id,sourceId:String(r.id),name:r.name,to:'mobile-vng-equipment-'+g.id,toName:g.name,level,quantity:1,classification:'SIMULATED_SERIES_MEMBERSHIP_AND_QUANTITY'});
 }
 return out;
}
const NL_MOBILE_SERIES_CRAFT=nlMobileSeriesCraftLinks(NL_MOBILE_INVENTORY);
const seriesMaterials=new Map(NL_MOBILE_SERIES_CRAFT.map(x=>[x.id,x])),seriesByDest=new Map(NL_MOBILE_SERIES_CRAFT.map(x=>[x.to,x]));
if(NL_MOBILE_SERIES_CRAFT.length!==89||seriesMaterials.size!==13||seriesByDest.size!==89)throw Error('MOBILE_SERIES_CRAFT_DRIFT');
let nlSeriesNewMaterialCount=0;
for(const [id,link] of seriesMaterials){
 const index=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===id),prior=index>=0?NL_ITEM_CATALOGUE.items[index]:null,raw=NL_MOBILE_INVENTORY.items.find(x=>String(x.id)===link.sourceId);
 const targets=NL_MOBILE_SERIES_CRAFT.filter(x=>x.id===id).map(x=>x.toName);
 if(prior?.integration==='PLAYABLE'){prior.sourceCraftTargets=targets;continue;}
 const row={id,sourceId:link.sourceId,name:link.name,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:raw.typeName,sourceDesc:raw.desc,sourceIcon:raw.icon,provenance:{classification:'SOURCE_EXACT'},sourceCraftTargets:targets,
 acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:Math.max(10,link.level-20),shopCost:{silver:Math.max(1000,link.level*18)}},effectRule:null};
 if(index>=0)NL_ITEM_CATALOGUE.items[index]=row;else NL_ITEM_CATALOGUE.items.push(row);nlSeriesNewMaterialCount++;
}
for(const gear of NL_MOBILE_GEAR_ALL){const link=seriesByDest.get(gear.mobilePromotion?.to);if(link){const materials=gear.mobilePromotion.materials||[];if(!materials.some(m=>m.id===link.id))gear.mobilePromotion.materials=[...materials,{id:link.id,name:link.name,quantity:link.quantity,classification:link.classification}];}}
// Reset permits only recorded Mobile quality payments; other hero investments are preserved.
const NL_MOBILE_RESET_ITEMS=NL_MOBILE_INVENTORY.items.filter(row=>['842','1235'].includes(String(row.id))).map(row=>({
 id:'mobile-vng-item-'+row.id,sourceId:String(row.id),name:row.name,category:'material',integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:row.typeName,sourceDesc:row.desc,sourceIcon:row.icon,
 provenance:{classification:'SOURCE_EXACT'},sourceReset:String(row.id)==='1235'?'super':'normal',
 acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:100,shopCost:{silver:String(row.id)==='1235'?100000:30000}},effectRule:null
}));
if(NL_MOBILE_RESET_ITEMS.length!==2)throw Error('MOBILE_RESET_SOURCE_DRIFT');
for(const row of NL_MOBILE_RESET_ITEMS){const index=NL_ITEM_CATALOGUE.items.findIndex(x=>x.id===row.id);if(index>=0)NL_ITEM_CATALOGUE.items[index]=row;else NL_ITEM_CATALOGUE.items.push(row);}
const NL_ITEM_RULES = __NL_ITEMS_RULES__;
// UI-only access to upgrade costs; authoritative mechanics remain in engine.js.
NL_ITEM_CATALOGUE.rules=NL_ITEM_RULES;
const NL_ITEM_GROUP_RULES = __NL_ITEM_GROUP_RULES__;
const nlItemConsumableApi=window.NLItemConsumables.createModule(NL_ITEM_CATALOGUE,NL_ITEM_GROUP_RULES);
const nlItemWarehouseView={mode:'bag',category:'all',search:'',page:0};
const nlItemApi = window.NLItemInventory.createModule(NL_ITEM_CATALOGUE, NL_ITEM_RULES);
const nlItemModels = NL_ITEM_CATALOGUE.equipment.filter(x => x.integration === 'PLAYABLE');
if (nlItemModels.length !== 810 ||
    NL_ITEM_CATALOGUE.equipment.filter(x=>x.integration==='PLAYABLE'&&x.provenance?.classification==='SIMULATED').length!==411||
    NL_ITEM_CATALOGUE.equipment.filter(x => x.integration === 'REFERENCE_ONLY').length !== 392) {
  throw new Error('NL_ITEMS_411_PROJECT_PLUS_399_MOBILE_OR_392_REFERENCE_COVERAGE_MISMATCH');
}
for (const item of nlItemModels) {
  // Old 19 IDs and stats stay byte-for-byte equivalent to their R03 pack.
  if (EQUIPMENT[item.id] && NL_GAME_DATA.equipment.projectItems.some(p=>p.id===item.id)) continue;
  EQUIPMENT[item.id] = {
    name:item.name,slot:item.slot,rarity:item.rarity,
    ...item.stats,
    icon:'', cost:item.acquisitionRule?.shopCost || {silver:0,iron:0,prestige:0},
    sourceId:item.sourceId||null,provenance:item.provenance
  };
}
function nlItemHydrate(){
  if (!game || !Array.isArray(game.items) || !game.gear || typeof game.gear!=='object')
    throw new Error('NL_ITEMS_INCOMPATIBLE_SAVE');
  if (!game.nlItemsV1) {
    // Legacy saves had no item receipt ledger. Never retro-award cleared stages.
    game.nlItemsV1 = {
      stacks:{},receipts:{},serial:0,actionNonce:0,
      rewardBaseline:Array.isArray(game.cleared)?game.cleared.slice():[],
      pendingAwards:{}
    };
  }
  const state = game.nlItemsV1;
  if (!state.stacks || typeof state.stacks!=='object' ||
      !state.receipts || typeof state.receipts!=='object' ||
      !Number.isSafeInteger(state.serial) || state.serial<0) {
    throw new Error('NL_ITEMS_CORRUPT_LEDGER');
  }
  if (!Number.isSafeInteger(state.actionNonce) || state.actionNonce<0) state.actionNonce=0;
  if (!Array.isArray(state.rewardBaseline)) state.rewardBaseline=Array.isArray(game.cleared)?game.cleared.slice():[];
  if (!state.pendingAwards || typeof state.pendingAwards!=='object') state.pendingAwards={};
  // Repair colliding old UID serials lazily; do NOT modify existing UIDs.
  const used = new Set(game.items.map(x=>String(x.uid)));
  while (used.has('nli-'+(state.serial+1))) state.serial++;
  return state;
}
const nlItemPriorFresh=fresh;
fresh=function(){
  const state=nlItemPriorFresh();
  state.nlItemsV1={stacks:{},receipts:{},serial:0,actionNonce:0,rewardBaseline:[],pendingAwards:{}};
  return state;
};
const nlItemPriorHydrate=hydrateExtension;
hydrateExtension=function(){
  nlItemPriorHydrate();
  nlItemHydrate();
};
nlItemHydrate();

const nlItemPriorStats=equipmentStats;
equipmentStats=function(heroId){
  // Single authority: never stack R03 equipmentStats and Group04 bonuses.
  return nlItemApi.bonuses(game,heroId);
};
if(window.__NL_R03_QA__) window.__NL_R03_QA__.equipmentStats=equipmentStats;

const nlItemSelected={heroId:null,tab:'all',search:'',shop:false,page:0,reinforceTargets:{}};
function nlItemHeroId(){
  const roster=(game.roster||[]).filter(id=>game.hero?.[id]);
  if (!roster.includes(nlItemSelected.heroId)) nlItemSelected.heroId=roster[0]||null;
  return nlItemSelected.heroId;
}
const nlItemPriorRenderEquipment=renderEquipment;
renderEquipment=function(){
  // Legacy pane stays present (19 existing IDs, QA/data-buy selectors intact).
  // The legacy renderer is the 19-item shop; 392 new gear are exposed by the
  // paginated Group04 panel, not duplicated in the old mobile grid.
  const originalIds=new Set(NL_GAME_DATA.equipment.projectItems.map(x=>x.id));
  // The legacy renderer also resolves every owned gear instance to its
  // EQUIPMENT definition (including .icon). Never hide an owned new-model
  // definition while it renders, or Save/reload/mobile will throw.
  const ownedIds=new Set((game.items||[]).map(item=>item.base));
  const hidden=Object.entries(EQUIPMENT).filter(([id])=>
    !originalIds.has(id) && !ownedIds.has(id));
  for(const [id] of hidden)delete EQUIPMENT[id];
  let previous;
  try{previous=nlItemPriorRenderEquipment();}
  finally{for(const [id,row] of hidden)EQUIPMENT[id]=row;}
  const heroId=nlItemHeroId();
  if(!heroId) return previous;
  const selector='<label class="nli-owner-switch">Chọn võ tướng <select data-nli-hero>'+
    (game.roster||[]).filter(id=>game.hero?.[id]).map(id=>
      '<option value="'+esc(id)+'" '+(id===heroId?'selected':'')+'>'+
        esc(HEROES[id]?.name||id)+'</option>').join('')+'</select></label>';
  const pending=Object.entries(nlItemHydrate().pendingAwards).map(([stage,drop])=>
    '<div class="nli-pending">'+(drop.source==='mobile-campaign'?'Chiến dịch Wiki':'Ải '+esc(stage))+' · Chờ nhận '+
    esc(EQUIPMENT[drop.id]?.name||drop.entries?.map(x=>NL_ITEM_CATALOGUE.equipment.find(e=>e.id===x.id)?.name||NL_ITEM_CATALOGUE.items.find(i=>i.id===x.id)?.name||x.id).join(', ')||drop.id)+
    ' <button data-nli-pending="'+esc(stage)+'">Nhận thưởng</button></div>').join('');
  return previous+'<div data-nl-item-bridge="1">'+selector+pending+
    window.NLItemEquipmentUI.makeView(NL_ITEM_CATALOGUE,nlItemApi,game,heroId,nlItemSelected)+
    '</div><div data-nl-consumables-bridge="1">'+
    window.NLItemConsumablesUI.view(NL_ITEM_CATALOGUE,nlItemConsumableApi,game,nlItemWarehouseView)+
    '</div>';
};
function nlItemApply(result,meta){
  if (!result.ok) {
    if(typeof toast==='function') toast('Trang bị: '+(result.code||'Không thể thực hiện'));
    return false;
  }
  if (result.duplicate) return false;
  Object.assign(game,result.state); // preserve authoritative game object identity
  if (meta?.actionNonce!=null) game.nlItemsV1.actionNonce=meta.actionNonce;
  if (typeof save==='function') save();
  if (typeof render==='function' && !meta?.noRender) render();
  return true;
}
function nlItemAction(action,arg){
  const nonce=nlItemHydrate().actionNonce+1;
  const receipt='nli:ui:'+nonce;
  const heroId=nlItemHeroId();
  const result=action==='buy'?nlItemApi.buy(game,arg.id,receipt):
    action==='sell'?nlItemApi.sell(game,arg.uid,receipt):
    action==='equip'?nlItemApi.equip(game,heroId,arg.uid,receipt):
    action==='unequip'?nlItemApi.unequip(game,heroId,arg.slot,receipt):
    action==='reinforce'?nlItemApi.reinforce(game,arg.uid,receipt,arg.targetLevel):
    action==='refine'?nlItemApi.refine(game,arg.uid,receipt):
    action==='mobile-promote'&&!battle?nlItemApi.mobilePromote(game,arg.uid,receipt):
    action==='mobile-refine'&&!battle?nlItemApi.mobileRefine(game,arg.uid,arg.pool,receipt):
    {ok:false,code:'UNSUPPORTED_ACTION'};
  return nlItemApply(result,{actionNonce:nonce});
}
function nlItemLootForStage(stage){
  return window.NLItemBalanceV1.select(NL_ITEM_CATALOGUE,stage).entries[0]?.id||null;
}
function nlItemGiveCampaignReward(stage){
  const m=nlItemHydrate();
  if(!Number.isSafeInteger(stage)||stage<1||stage>STAGES.length ||
     m.rewardBaseline.includes(stage)||m.receipts['nli:stage:'+stage])return false;
  const award=window.NLItemBalanceV1.select(NL_ITEM_CATALOGUE,stage);
  const receipt='nli:stage:'+stage;
  const entries=award.entries;
  const result=nlItemApi.grant(game,entries,receipt);
  if(!result.ok){
    if(['EQUIPMENT_CAPACITY','STACK_CAPACITY','STACK_KIND_CAPACITY'].includes(result.code)){
      m.pendingAwards[stage]={id:entries[0].id,entries,receipt};
      if(typeof save==='function')save();
    }
    return false;
  }
  Object.assign(game,result.state);
  delete game.nlItemsV1.pendingAwards[stage];
  if(typeof save==='function')save();
  return true;
}
function nlItemClaimPending(stage){
  const m=nlItemHydrate();
  const record=m.pendingAwards[stage];
  if(!record)return false;
  const result=nlItemApi.grant(game,record.entries||[{id:record.id,quantity:1}],record.receipt);
  if(!result.ok)return false;
  Object.assign(game,result.state);
  delete game.nlItemsV1.pendingAwards[stage];
  if(typeof save==='function')save();
  if(typeof render==='function')render();
  return true;
}
function nlItemSettleMobileDrops(record){
  if(!record||!Array.isArray(record.rows))return false;
  const entries=record.rows.filter(x=>x.hit&&x.runtimeId).map(x=>({id:x.runtimeId,quantity:x.quantity||1}));
  if(!entries.length){record.settlement={granted:0,unresolved:record.rows.filter(x=>x.status==='UNRESOLVED_SOURCE_ITEM_BINDING').length};return true;}
  const reportId=String(battle?.report?.id||('seed-'+(battle?.seed||0)+'-'+Date.now()));
  const receipt='nli:mobile-drop:'+reportId;
  const result=nlItemApi.grant(game,entries,receipt);
  if(result.ok){
    if(!result.duplicate)Object.assign(game,result.state);
    const nonce=nlItemHydrate().actionNonce+1;game.nlItemsV1.actionNonce=nonce;
    record.settlement={granted:result.duplicate?0:entries.reduce((n,x)=>n+x.quantity,0),duplicate:!!result.duplicate,
      receipt,quantities:result.detail?.quantities||{},unresolved:record.rows.filter(x=>x.status==='UNRESOLVED_SOURCE_ITEM_BINDING').length};
    if(typeof save==='function')save();
    return true;
  }
  const m=nlItemHydrate(),pendingKey='mobile:'+reportId;
  if(['EQUIPMENT_CAPACITY','STACK_CAPACITY','STACK_KIND_CAPACITY'].includes(result.code)){
    m.pendingAwards[pendingKey]={source:'mobile-campaign',entries,receipt};
    record.settlement={granted:0,pending:true,code:result.code,receipt,
      unresolved:record.rows.filter(x=>x.status==='UNRESOLVED_SOURCE_ITEM_BINDING').length};
    if(typeof save==='function')save();
  }else record.settlement={granted:0,error:result.code,receipt};
  return false;
}
function nlItemQaEquipOwned(heroId,uid){
  const nonce=nlItemHydrate().actionNonce+1,receipt='nli:qa:equip:'+nonce+':'+String(uid);
  const result=nlItemApi.equip(game,heroId,uid,receipt);
  if(result.ok&&!result.duplicate){Object.assign(game,result.state);game.nlItemsV1.actionNonce=nonce;if(typeof save==='function')save();}
  return {ok:result.ok,duplicate:!!result.duplicate,code:result.code||null,detail:result.detail||null};
}
// Hook the actual settled battle report; never mint gear from replay, animation
// frames, losses, or stage previews. Receipt ID has only one interpretation.
const nlItemPriorStoreReport=p2StoreReport;
p2StoreReport=function(rewards,loot){
  nlItemPriorStoreReport(rewards,loot);
  if(battle?.nlContentC&&battle.report)nlItemSettleMobileDrops(battle.nlContentC.mobileDropRolls);
  if (!battle || battle.mode!=='campaign' || battle.won!==true ||
      battle.replay || !battle.report) return;
  nlItemGiveCampaignReward(Number(battle.stage));
};
// The canonical render() may skip the already-open equipment panel.
 // Refresh only its owned DOM after item-local navigation; do not rely on
 // unrelated game-wide rendering to repaint this fragment.
function nlItemRefreshEquipmentPanel(){
  const bridge=document.querySelector('[data-nl-item-bridge]');
  const current=bridge?.querySelector('.nli-panel');
  const heroId=nlItemHeroId();
  if(!current||!heroId)return;
  const template=document.createElement('template');
  template.innerHTML=window.NLItemEquipmentUI.makeView(
    NL_ITEM_CATALOGUE,nlItemApi,game,heroId,nlItemSelected);
  const updated=template.content.querySelector('.nli-panel');
  if(updated)current.replaceWith(updated);
}
document.addEventListener('click',function(ev){
  const control=ev.target.closest?.('[data-nli-action],[data-nli-tab],[data-nli-shop],[data-nli-page],[data-nli-pending]');
  if(!control || !control.closest('.nli-panel'))return;
  ev.preventDefault();ev.stopPropagation();
  if(control.hasAttribute('data-nli-pending')) {
    nlItemClaimPending(control.getAttribute('data-nli-pending'));return;
  }
  if(control.hasAttribute('data-nli-tab')){
    nlItemSelected.tab=control.getAttribute('data-nli-tab');nlItemSelected.page=0;nlItemRefreshEquipmentPanel();return;
  }
  if(control.hasAttribute('data-nli-shop')){
    nlItemSelected.shop=control.getAttribute('data-nli-shop')==='1';nlItemSelected.page=0;nlItemRefreshEquipmentPanel();return;
  }
  if(control.hasAttribute('data-nli-page')){
    nlItemSelected.page=Math.max(0,Number(control.getAttribute('data-nli-page'))||0);
    nlItemRefreshEquipmentPanel();return;
  }
  const action=control.getAttribute('data-nli-action');
  nlItemAction(action,{
    id:control.getAttribute('data-item'),
    uid:control.getAttribute('data-uid'),
    slot:control.getAttribute('data-slot'),
    pool:control.getAttribute('data-pool'),
    targetLevel:control.getAttribute('data-target-level')?Number(control.getAttribute('data-target-level')):undefined
  });
},true);
document.addEventListener('change',function(ev){
  if(ev.target.matches?.('[data-nli-reinforce-target]')){
    const uid=ev.target.getAttribute('data-nli-reinforce-target');
    nlItemSelected.reinforceTargets[uid]=Math.max(1,Math.floor(Number(ev.target.value)||1));
    nlItemRefreshEquipmentPanel();return;
  }
  if(!ev.target.matches?.('[data-nli-hero]'))return;
  nlItemSelected.heroId=ev.target.value;render();
},true);
document.addEventListener('input',function(ev){
  if(!ev.target.matches?.('[data-nli-search]') ||
    !ev.target.closest('[data-nl-item-bridge]'))return;
  nlItemSelected.search=ev.target.value;
  nlItemSelected.page=0;
  // Search updates only the equipment panel, avoiding loss of game scene state.
  const position=ev.target.selectionStart;
  nlItemRefreshEquipmentPanel();
  const el=document.querySelector('[data-nl-item-bridge] [data-nli-search]');
  if(el){el.focus();el.setSelectionRange(position,position);}
},true);
// Group04 consumable UI uses the SAME Save v5 receipt ledger as equipment.
function nlItemRefreshWarehousePanel(){
  const bridge=document.querySelector('[data-nl-consumables-bridge]');
  const current=bridge?.querySelector('.nli-items-panel');
  if(!current)return;
  const template=document.createElement('template');
  template.innerHTML=window.NLItemConsumablesUI.view(
    NL_ITEM_CATALOGUE,nlItemConsumableApi,game,nlItemWarehouseView);
  const updated=template.content.querySelector('.nli-items-panel');
  if(updated)current.replaceWith(updated);
}
document.addEventListener('click',function(ev){
  const control=ev.target.closest?.('[data-nli-item-action],[data-nli-item-mode],[data-nli-item-category],[data-nli-item-page]');
  if(!control||!control.closest('[data-nl-consumables-bridge]'))return;
  ev.preventDefault();ev.stopPropagation();
  if(control.hasAttribute('data-nli-item-mode')){
    nlItemWarehouseView.mode=control.getAttribute('data-nli-item-mode');
    nlItemWarehouseView.page=0;nlItemRefreshWarehousePanel();return;
  }
  if(control.hasAttribute('data-nli-item-category')){
    nlItemWarehouseView.category=control.getAttribute('data-nli-item-category');
    nlItemWarehouseView.page=0;render();return;
  }
  if(control.hasAttribute('data-nli-item-page')){
    nlItemWarehouseView.page=Math.max(0,Number(control.getAttribute('data-nli-item-page'))||0);
    nlItemRefreshWarehousePanel();return;
  }
  const action=control.getAttribute('data-nli-item-action');
  const id=control.getAttribute('data-nli-item-id');
  const nonce=nlItemHydrate().actionNonce+1,receipt='nli:ui:'+nonce;
  if(battle)return;
  const result=action==='buy-source-material'?nlItemConsumableApi.buySourceMaterial(game,id,receipt):action==='buy-source-bundle'?nlItemConsumableApi.buySourceBundle(game,id,receipt):action==='use'?nlItemConsumableApi.use(game,id,receipt,nlItemHeroId()):
    action==='process'?nlItemConsumableApi.process(game,id,receipt):
    {ok:false,code:'UNKNOWN_ITEM_ACTION'};
  nlItemApply(result,{actionNonce:nonce});
},true);
document.addEventListener('input',function(ev){
  if(!ev.target.matches?.('[data-nli-item-search]')||
     !ev.target.closest('[data-nl-consumables-bridge]'))return;
  nlItemWarehouseView.search=ev.target.value;
  nlItemWarehouseView.page=0;
  const cursor=ev.target.selectionStart;
  nlItemRefreshWarehousePanel();
  const field=document.querySelector('[data-nl-consumables-bridge] [data-nli-item-search]');
  if(field){field.focus();field.setSelectionRange(cursor,cursor)}
},true);
if(window.__P2_ENABLE_QA__){
  window.__NL_ITEM_QA__={
    getCounts:()=>({playable:nlItemModels.length,projectPlayable:411,mobilePlayable:NL_MOBILE_INVENTORY.runtimeEquipment.length+NL_MOBILE_FALLBACK_GEAR.length,sourceRouteGear:NL_MOBILE_INVENTORY.runtimeEquipment.length,fallbackRouteGear:NL_MOBILE_FALLBACK_GEAR.length,
      references:NL_ITEM_CATALOGUE.equipment.filter(x=>x.integration==='REFERENCE_ONLY').length}),
    getItemCounts:()=>({
      playable:NL_ITEM_CATALOGUE.items.filter(x=>x.integration==='PLAYABLE').length,
      projectPlayable:669,mobilePlayable:NL_ITEM_CATALOGUE.items.filter(x=>x.integration==='PLAYABLE'&&x.sourceEdition==='CURRENT_VNG_MOBILE_WIKI').length,sourceBundles:NL_MOBILE_BUNDLES.length,sourceExchangeMaterials:NL_MOBILE_EXCHANGE.length,sourceExchangeRecipes:NL_MOBILE_EXCHANGE.filter(x=>x.effectRule).length,sourceGifts:NL_MOBILE_GIFTS.length,sourceResetItems:NL_MOBILE_RESET_ITEMS.length,sourceCraftLinks:NL_MOBILE_CRAFT_LINKS.length,sourceCraftMaterials:craftMaterials.size,sourceCraftNewMaterials:nlCraftNewMaterialCount,sourceSeriesCraftLinks:NL_MOBILE_SERIES_CRAFT.length,sourceSeriesCraftMaterials:seriesMaterials.size,sourceSeriesNewMaterials:nlSeriesNewMaterialCount,
      references:NL_ITEM_CATALOGUE.items.filter(x=>x.integration==='REFERENCE_ONLY').length
    }),
    useItem:(id,heroId)=>{
      const nonce=nlItemHydrate().actionNonce+1;
      const result=nlItemConsumableApi.use(game,id,'nli:ui:'+nonce,heroId||nlItemHeroId());
      nlItemApply(result,{actionNonce:nonce,noRender:true});
      return result;
    },
    bonus:heroId=>nlItemApi.bonuses(game,heroId),
    sets:heroId=>nlItemApi.sets(game,heroId),
    selectLoot:nlItemLootForStage,
    settleStage:nlItemGiveCampaignReward,
    claim:nlItemClaimPending,
    state:()=>structuredClone(game.nlItemsV1),
    equipOwned:nlItemQaEquipOwned,
    mobileSource:()=>({equipment:NL_MOBILE_INVENTORY.sourceCounts.equipment,items:NL_MOBILE_INVENTORY.sourceCounts.items,
      drops:NL_MOBILE_INVENTORY.sourceCounts.campaignDropRows,activeEquipment:NL_MOBILE_INVENTORY.runtimeEquipment.length+NL_MOBILE_FALLBACK_GEAR.length,sourceRouteEquipment:NL_MOBILE_INVENTORY.runtimeEquipment.length,fallbackRouteEquipment:NL_MOBILE_FALLBACK_GEAR.length,
      activeMaterials:NL_MOBILE_INVENTORY.runtimeMaterials.length,sourceShopCosts:NL_MOBILE_INVENTORY.equipmentPurchaseCostCounts.sourceExactShopRows,
      unresolvedCostTypes:NL_MOBILE_INVENTORY.equipmentPurchaseCostCounts.unresolvedCostRows,
      reverseDropAudit:NL_MOBILE_INVENTORY.equipmentUsageDropCounts}),
    settleMobileDrops:nlItemSettleMobileDrops
  };
}
// === end NL-ITEMS-V1 ===
