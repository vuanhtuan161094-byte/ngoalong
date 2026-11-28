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
// Exact Thống Soái book identities; shop price is an explicit offline fallback
// because the public Wiki item rows publish no acquisition route or currency.
function nlMobileEliteMaterials(source){
 const wanted=new Map([['mat_63','Quỷ Cốc Thư'],['mat_73','Sách Dũng Khí'],['mat_74','Sách Ý Chí'],['mat_75','Sách Sức Bền'],['mat_76','Sách Võ Kỹ'],['mat_77','Sách Nhanh Nhẹn']]);
 const byId=new Map(source.items.map(x=>[String(x.id),x]));
 return [...wanted].map(([id,name])=>{
  const raw=byId.get(id);if(!raw||raw.name!==name)throw Error('MOBILE_ELITE_MATERIAL_SOURCE_DRIFT:'+id);
  return {id:'mobile-vng-item-'+id,sourceId:id,name:raw.name,category:'material',integration:'PLAYABLE',
   sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:raw.typeName,sourceDesc:raw.desc||'',sourceIcon:raw.icon,
   provenance:{classification:'SOURCE_EXACT'},sourceAcquisition:{classification:'UNRESOLVED_NO_PUBLIC_WIKI_ROUTE'},
   stackLimit:1000000,fieldProvenance:{stackLimit:'SIMULATED_CAPACITY_ADAPTER'},
   acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:1,shopCost:{silver:12}},effectRule:null};
 });
}
const NL_MOBILE_ELITE_MATERIALS=nlMobileEliteMaterials(NL_MOBILE_INVENTORY);
for(const row of NL_MOBILE_ELITE_MATERIALS){
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
function nlMobileWikiRecord(row){
 return {id:String(row.id),type:row.type,typeName:row.typeName,quality:row.quality,qualityName:row.qualityName,
  series:row.series,level:row.level,cost:row.cost,costType:row.costType,costName:row.costName,sell:row.sell,
  upgradeKind:row.upgradeKind,flag:row.flag,cuongHoa:row.cuongHoa,gift:row.gift,upgradeFrom:row.upgradeFrom,
  upgradeTo:row.upgradeTo,stats:row.stats,refundGold:row.refundGold,refundTiers:row.refundTiers,
  usage:row.usage,desc:row.desc||''};
}
// === WIKI-TYPED-ITEMS ===
function nlTypedWikiFallback(row,source,tier){
 const fold=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
 const name=fold(row.name),desc=fold(row.desc),both=name+' '+desc,group=row.typeName;
 const output=(wallet,qty,extra={})=>({name:row.name,qty,wallet,...extra});
 const resource={
  'bac':'silver','vang':'gold','lua':'grain','quan luong':'grain','chien cong':'merit','hon tuong':'hero-soul','chien tich':'seal-credit','quan lenh':'orders','linh':'reserve','ho phu':'tiger-token','diem khoa ky':'science','long phuong boi':'beauty-pendant','exp chua cong':'commander-xp','menh hon luyen ngoc':'destiny-jade','da toi luyen':'tempering-stone','manh binh thu ngau nhien':'book-fragment','manh phoi van nang ngau nhien':'blank'
 };

 // Parse complete named loot tables, preserving actual stack identities and all options.
 // Missing quantities and lottery probabilities are explicitly simulated, never source claims.
 const id=String(row.id),keys={'1233':'res_125'};
 const all=Array.isArray(source?.items)?source.items:[];
 const levelGift=name.match(/^qua cap (\d+)$/);
 if(levelGift){
  const rank=Number(levelGift[1]),chain=all.filter(x=>/^qua cap \d+$/.test(fold(x.name)));
  const prev=chain.find(x=>fold(x.name)==='qua cap '+(rank-1)),next=chain.find(x=>fold(x.name)==='qua cap '+(rank+1));
  const gate=rank===1?10:Number(fold(prev?.desc).match(/thanh chinh lv(\d+) mo/)?.[1]);
  const prefix=String(row.desc||'').match(/^Gồm:\s*Quà Cấp\s+\d+\s*\([^)]*\)\s*,?\s*/i);
  if(!prefix||!Number.isSafeInteger(gate)||gate<10)return null;
  const rewards=[],substitutions=[];
  if(next)rewards.push({name:next.name,qty:1,wallet:'stack',itemId:'mobile-vng-item-'+next.id});
  else substitutions.push('Không có hồ sơ Quà Cấp '+(rank+1)+'; kết thúc chuỗi ở cấp '+rank);
  const aliases={'tranh long ngoc':'res_16'};
  const awakening=new Set(['banh bao','thit','ruou','tran chau','ngoc boi','kim lo']);
  const gear=new Set(['vuong kiem','no yen khai','bao nguyet','tu dan lenh','bach ly','bat nha khai','giac ky lan','don giap thu']);
  for(const part of String(row.desc).slice(prefix[0].length).replace(/[.]$/,'').split(/,\s*/)){
   const m=part.match(/^(.+?)\s+x(\d+)$/i);if(!m)return null;
   const label=m[1].trim(),key=fold(label),qty=Number(m[2]);
   if(!Number.isSafeInteger(qty)||qty<1)return null;
   if(resource[key]){rewards.push({name:label,qty,wallet:resource[key]});continue;}
   if(awakening.has(key)){rewards.push({name:label,qty,wallet:'awakening'});continue;}
   const targets=all.filter(x=>fold(x.name)===key),target=aliases[key]?all.find(x=>String(x.id)===aliases[key]):targets.length===1?targets[0]:targets.find(x=>String(x.id).startsWith('res_'));
   if(target){rewards.push({name:label,qty,wallet:'stack',itemId:'mobile-vng-item-'+target.id});if(aliases[key])substitutions.push(label+' → '+target.name);continue;}
   if(/^(cong|phong|binh) van lv\d+$/.test(key)){rewards.push({name:label,qty,wallet:'tempering-stone',factor:Number(key.match(/\d+$/)[0])});substitutions.push(label+' → đá tôi luyện (SIMULATED)');continue;}
   if(gear.has(key)){rewards.push({name:label,qty,wallet:'blank'});substitutions.push(label+' → phôi (SIMULATED)');continue;}
   return null;
  }
  return {route:'level-gift-chain',outputs:rewards,minCommander:gate,levelGift:rank,substitutions};
 }
 // Fixed-value and random-one gold festival rewards: explicit source amounts,
 // seeded equal odds only where Wiki does not disclose the distribution.
 const goldIds=new Set(['713','740','769','850','808','1142','1202','811','1141','1103','853','1044','1201','1241','1237','1243','1239']);
 if(goldIds.has(id)){
  const amounts=[...desc.matchAll(/(\d+)\s+vang\b/g)].map(m=>Number(m[1]));
  if(!amounts.length&&['1241','1237','1243','1239'].includes(id))amounts.push(888);
  if(amounts.length&&amounts.every(n=>Number.isSafeInteger(n)&&n>0))return {route:'festival-gold',outputs:amounts.map(qty=>({name:'Vàng',qty,wallet:'gold'})),random:amounts.length>1};
 }
 const direct={'1070':'562','1069':null,'1194':null};
 if(direct[id]){
  const target=all.find(x=>String(x.id)===direct[id]);
  if(target)return {route:'named-loot-all',outputs:[{name:target.name,qty:1,wallet:'stack',itemId:'mobile-vng-item-'+target.id}]};
 }
 if(id==='1060')return {route:'resource-reserve',outputs:[{name:'Lính',qty:600,wallet:'reserve'}]};
 if(['694','1089','res_125','856','560','561','562'].includes(id))return {route:id==='856'?'elite-reset-token':['560','561','562'].includes(id)?'hero-reset-token':'locked-chest-key',material:true,outputs:[]};
 if(id==='1233'){
  const stack=(id,qty)=>({name:id,qty,wallet:'stack',itemId:'mobile-vng-item-'+id});
  return {route:'named-loot-random',random:true,requiredKey:'mobile-vng-item-res_125',outputs:[
   stack('res_126',1),stack('res_16',100),{name:'Đá Tôi Luyện',qty:10,wallet:'tempering-stone'},
   stack('fam_5',3),stack('fam_10',10),stack('fam_6',3),stack('fam_9',3),
   {name:'Lính',qty:1000,wallet:'reserve'},{name:'Chiến Tích',qty:10000,wallet:'seal-credit'},stack('res_36',150)
  ]};
 }
 const horse=desc.match(/tang\s+(\d+)\s*(k)?\s*diem truong thanh/);
 if(group==='Tài Nguyên'&&horse&&/chien ma/.test(desc)){
  const qty=Number(horse[1])*(horse[2]?1000:1),gate=Number(desc.match(/thanh chinh lv(\d+)/)?.[1])||0;
  return {route:'horse-growth-source-quantity',outputs:[output('horse-points',qty)],minCommander:gate};
 }
 const rawDesc=String(row.desc||''),colon=rawDesc.indexOf(':');
 if(colon>=0&&/mo|nhan/.test(fold(rawDesc.slice(0,colon)))&&/x\s*\d/i.test(rawDesc.slice(colon+1))){
  const text=rawDesc.slice(colon+1).trim().replace(/[.。]$/,'');
  const rows=Array.isArray(source?.items)?source.items:[];
  const parts=text.split(/,\s+(?=[^\d])/),loot=[];
  for(const part of parts){
   const m=part.trim().match(/^(.+?)\s*[x×]\s*(\d+(?:[.,]\d{3})*)\s*(Vạn|Triệu|Nghìn|Ngàn|K)?$/iu);
   if(!m){loot.length=0;break;}
   const k=fold(m[1].trim()),unit=fold(m[3]),qty=Number(m[2].replace(/[.,]/g,''))*({'van':10000,'trieu':1000000,'nghin':1000,'ngan':1000,'k':1000}[unit]||1);
   if(!Number.isSafeInteger(qty)||qty<1||qty>100000000){loot.length=0;break;}
   const wallet=resource[k];
   if(wallet&&wallet!=='commander-xp'){loot.push({name:m[1].trim(),qty,wallet});continue;}
   if(wallet==='commander-xp'&&qty<=1000000){loot.push({name:m[1].trim(),qty,wallet,maxQty:qty});continue;}
   const matches=rows.filter(r=>fold(r.name)===k&&String(r.id)!==id);
   const canonical=matches.filter(r=>String(r.id).startsWith('res_'));
   const target=matches.length===1?matches[0]:canonical.length===1?canonical[0]:null;
   if(!target){loot.length=0;break;}
   loot.push({name:target.name,qty,wallet:'stack',itemId:'mobile-vng-item-'+target.id});
  }
  if(loot.length===parts.length&&loot.length>0&&loot.length<=64){
   const random=/ngau nhien|co hoi|mot trong|xac suat|mot mon/.test(desc);
   return {route:random?'named-loot-random':'named-loot-all',outputs:loot,random,requiredKey:keys[id]?'mobile-vng-item-'+keys[id]:null};
  }
 }

 if(group==='Ấn Thạch'){
  const m=name.match(/ngoc (bao|ne|phan)\s*lv\s*(\d+)/);
  if(m)return {route:'gem-'+m[1],outputs:[output('hero-gem',Number(m[2]),{gem:m[1]})]};
 }
 if(group==='Bí Tịch'){
  const match=String(row.desc||'').match(/kỹ năng ([^,.]+?)(?:\.|,|$)/iu);
  if(match)return {route:'child-manual',outputs:[output('child-manual',1,{skill:match[1].trim(),faction:row.id==='611'?'wei':row.id==='608'?'shu-wu':null})]};
 }
 if(group==='Tài Nguyên'&&resource[name]){
  const wallet=resource[name],qty=wallet==='silver'?100:wallet==='grain'?100:wallet==='merit'?10:wallet==='reserve'?50:wallet==='commander-xp'?100:wallet==='seal-credit'?100:1;
  return {route:'resource-'+wallet,outputs:[output(wallet,qty,wallet==='commander-xp'?{maxQty:qty}:{})]};
 }
 // Direct exact quantities only when the source names the recipient wallet.
 // For random loot, draw one known option using receipt-seeded RNG; unknown odds are simulated.
 const options=[];
 for(const [key,wallet] of Object.entries(resource)){
  const pattern=new RegExp('(?:^|[^a-z0-9])'+key+'\\s*(?:x|×|\\*)\\s*([\\d.,]+)\\s*(van|trieu|nghin|ngan)?','g');
  for(const m of desc.matchAll(pattern)){
   const base=Number(m[1].replace(/[.,]/g,'')),factor=m[2]==='van'?10000:m[2]==='trieu'?1000000:m[2]?1000:1,qty=base*factor;
   if(!Number.isSafeInteger(qty)||qty<=0||qty>100000000)continue;
   if(wallet==='commander-xp'&&qty>1000000)continue;
   options.push(output(wallet,qty,wallet==='commander-xp'?{maxQty:qty}:{}));
  }
 }
 if(options.length&&options.length===([...(desc.matchAll(/(?:x|×)\s*\d+/g))].length)&&/mo|nhan|ruong|tui/.test(both)&&!keys[id]){
  const random=/ngau nhien|co hoi|mot trong|xac suat|mot mon/.test(desc);
  return {route:random?'known-loot-option':'known-loot-bundle',outputs:options.slice(0,10),random};
 }
 // Materials with no exact recipe retain their source category, but produce a useful,
 // themed progression resource rather than universally recycling into mineral.
 const rules=[
  [/binh thu|thu linh|sach|bi tich|kinh nghiem.*thu/, 'book-exp',80*tier],
  [/chien ma|ngua|co kho|ma truong|linh lang|thanh tri thao/, 'horse-points',500*tier],
  [/menh cach|menh hon|luyen ngoc/, 'destiny-jade',1],
  [/vu khi|chuyen dung|phoi|v.v.k|vo khi/, 'blank',1],
  [/tinh nhue|ho bao|vo ve|cam quan/, 'merit',10*tier],
  [/giac ngo|tuong hon|hon tuong|chieu mo|tuong khi/, 'hero-soul',2*tier],
  [/quan an|an tran|chien tich|an hon|an thach/, 'seal-credit',100*tier],
  [/khoa ky|khoa hoc|nghien cuu/, 'science',tier],
  [/tri ky|thien cam|danh pham|long phuong boi/, 'beauty-pendant',1],
  [/quan luong|luong thao|luong thuc/, 'grain',160*tier],
  [/chien cong|thuong lenh|quan cong/, 'merit',10*tier],
  [/linh luc|binh luc|quan linh|chieu binh/, 'reserve',30*tier],
  [/exp chua cong|kinh nghiem chua cong/, 'commander-xp',100*tier],
  [/tinh luyen|toi luyen|cuong hoa|trang bi|ghep/, 'tempering-stone',1]
 ];
 for(const [re,wallet,qty] of rules)if(re.test(both))return {route:'themed-'+wallet,outputs:[output(wallet,qty,wallet==='commander-xp'?{maxQty:qty}:{})]};
 return null;
}
// === END WIKI-TYPED-ITEMS ===

function nlExposeMobileWikiCatalogue(source){
 const bySourceId=new Map(NL_ITEM_CATALOGUE.items.filter(x=>x.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&x.sourceId!=null)
  .map(x=>[String(x.sourceId),x]));
 const added=[],genericFallbacks=[];
 const awakening=new Set(['Bánh Bao','Thịt','Rượu','Trân Châu','Ngọc Bôi','Kim Lô','Hổ Phách','Lam Bảo Thạch','Lang Nha Ngọc','Băng Tuyết Liên','Linh Chi Rừng','Hà Thủ Ô Trăm Năm','Thanh Liên','Bàn Đào','Nhân Sâm Quả','Quỳnh Tương','Chu Quả','Thiên Mai','Hoàng Trung Lý']);
 const materialGroups=new Set(['Vật Liệu','Ấn Thạch']);
 function genericFallback(row,record){
  const sourceId=String(row.id),id='mobile-vng-item-'+sourceId;
  let hash=2166136261;for(const ch of sourceId)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
  const tier=1+hash%5,price=400+tier*350;
  const common={id,sourceId,name:row.name,category:materialGroups.has(row.typeName)?'material':'consumable',
   integration:'PLAYABLE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI',sourceCategory:row.typeName,
   sourceDesc:row.desc||'',sourceIcon:row.icon,sourceReference:record,
   provenance:{classification:'SOURCE_EXACT',sourceId:'mobile-wiki-item-identity'},
   sourceFallback:{classification:'SIMULATED_GENERIC_FALLBACK',reason:'Wiki chưa công bố đường mua hoặc công thức sử dụng cho ID này; thêm lối dùng chung mô phỏng cho bản offline. Tên và mô tả vẫn giữ nguyên dữ liệu Wiki.'},
   fieldProvenance:{name:'SOURCE_EXACT',sourceDescription:'SOURCE_EXACT',sourceCategory:'SOURCE_EXACT',effectRule:'SIMULATED_GENERIC_FALLBACK',acquisitionRule:'SIMULATED_GENERIC_FALLBACK'},
   acquisitionRule:{kind:'SHOP',classification:'SIMULATED_FALLBACK',minCommander:0,shopCost:{silver:price}}};
  const typed=nlTypedWikiFallback(row,source,tier);
  if(typed?.material)return {...common,category:'material',sourceTypedRoute:typed.route,sourceFallback:{...common.sourceFallback,classification:'SIMULATED_TYPED_WIKI_ADAPTER'},effectRule:null};
  if(typed){
   // Source identity and UI search remain unchanged; use existing bundle transaction.
   const silver=Math.max(0,...typed.outputs.filter(x=>x.wallet==='silver').map(x=>x.qty));
   const gold=Math.max(0,...typed.outputs.filter(x=>x.wallet==='gold').map(x=>x.qty));
   const cost=Math.max(price,silver+100,gold*200);
   return {...common,category:'consumable',sourceTypedRoute:typed.route,
    acquisitionRule:{...common.acquisitionRule,minCommander:typed.minCommander||0,shopCost:{silver:cost}},
    sourceFallback:{...common.sourceFallback,route:typed.route,classification:'SIMULATED_TYPED_WIKI_ADAPTER'},
    effectRule:{kind:'OPEN_SOURCE_BUNDLE',outputs:typed.outputs,randomOne:!!typed.random,minCommander:typed.minCommander||0,requiredKey:typed.requiredKey||null,levelGift:typed.levelGift||null,substitutions:typed.substitutions||[],classification:'SIMULATED_TYPED_WIKI_ADAPTER'}};
  }
  if(materialGroups.has(row.typeName))return {...common,effectRule:{kind:'CRAFT_REAGENT',needPieces:3+(tier>=4?1:0),silverCost:150+tier*75,
   output:'mdt-tinh-khoang',outputQuantity:1,classification:'SIMULATED_GENERIC_RECYCLING'}};
  let outputs;
  if(row.typeName==='Tài Nguyên'&&awakening.has(row.name))outputs=[{name:row.name,qty:1,wallet:'awakening'}];
  else {
   outputs=[{name:'Bạc',qty:100+tier*60,wallet:'silver'}];
   if(['Rương','Túi Phúc','Túi Tầm Bảo'].includes(row.typeName))outputs.push({name:'Lương',qty:120+tier*70,wallet:'grain'});
  }
  return {...common,effectRule:{kind:'OPEN_SOURCE_BUNDLE',outputs,minCommander:0,requiredKey:sourceId==='1233'?'mobile-vng-item-res_125':null,classification:'SIMULATED_GENERIC_BUNDLE'}};
 }
 for(const row of source.items){
  const sourceId=String(row.id),existing=bySourceId.get(sourceId),record=nlMobileWikiRecord(row);
  if(existing){existing.sourceReference=record;continue;}
  const fallback=genericFallback(row,record);
  NL_ITEM_CATALOGUE.items.push(fallback);bySourceId.set(sourceId,fallback);added.push(fallback);genericFallbacks.push(fallback);
 }
 // Resolve references after all 746 source rows exist. Preserve canonical IDs of
 // preexisting specialized rows; give bulk stacks the capacity required by source rewards.
 for(const row of genericFallbacks)for(const out of row.effectRule?.outputs||[]){
  if(out.wallet!=='stack')continue;
  const target=bySourceId.get(String(out.itemId).replace(/^mobile-vng-item-/,''));
  if(target){out.itemId=target.id;if(out.qty>999)target.stackLimit=Math.max(target.stackLimit||0,1000000);}
 }
 if(bySourceId.size!==746||source.items.length!==746)throw Error('MOBILE_WIKI_ITEM_RUNTIME_CATALOGUE_DRIFT');
 if(genericFallbacks.length!==585||genericFallbacks.some(x=>x.integration!=='PLAYABLE'||(!['locked-chest-key','elite-reset-token','hero-reset-token'].includes(x.sourceTypedRoute)&&x.effectRule?.classification!=='SIMULATED_GENERIC_FALLBACK'&&x.effectRule?.classification!=='SIMULATED_GENERIC_BUNDLE'&&x.effectRule?.classification!=='SIMULATED_GENERIC_RECYCLING'&&x.effectRule?.classification!=='SIMULATED_TYPED_WIKI_ADAPTER')))throw Error('MOBILE_WIKI_GENERIC_FALLBACK_DRIFT');
 return {added,genericFallbacks};
}
const NL_MOBILE_WIKI_CATALOGUE=nlExposeMobileWikiCatalogue(NL_MOBILE_INVENTORY);
const NL_MOBILE_WIKI_GENERIC_FALLBACKS=NL_MOBILE_WIKI_CATALOGUE.genericFallbacks;
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
      sourceRouteMaterials:NL_MOBILE_INVENTORY.runtimeMaterials.length,sourceEliteMaterials:NL_MOBILE_ELITE_MATERIALS.length,
      mobileSourceCatalogueIds:new Set(NL_ITEM_CATALOGUE.items.filter(x=>x.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&x.sourceId!=null).map(x=>String(x.sourceId))).size,
      sourceGenericFallbacks:NL_MOBILE_WIKI_GENERIC_FALLBACKS.length,
      sourceTypedFallbacks:NL_MOBILE_WIKI_GENERIC_FALLBACKS.filter(x=>x.sourceTypedRoute).length,
      sourceUntypedFallbacks:NL_MOBILE_WIKI_GENERIC_FALLBACKS.filter(x=>!x.sourceTypedRoute).length,
      sourceSpecificActive:NL_ITEM_CATALOGUE.items.filter(x=>x.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&x.integration==='PLAYABLE'&&!x.sourceFallback).length,
      mobileSourceReferenceOnly:NL_ITEM_CATALOGUE.items.filter(x=>x.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&x.integration==='REFERENCE_ONLY').length,
      references:NL_ITEM_CATALOGUE.items.filter(x=>x.integration==='REFERENCE_ONLY').length
    }),
    genericFallbackProbe:()=>{
      const bundle=NL_MOBILE_WIKI_GENERIC_FALLBACKS.find(x=>x.effectRule?.classification==='SIMULATED_GENERIC_BUNDLE');
      const material=NL_MOBILE_WIKI_GENERIC_FALLBACKS.find(x=>x.effectRule?.classification==='SIMULATED_GENERIC_RECYCLING');
      if(!bundle||!material)return {ok:false,code:'FALLBACK_FIXTURE_MISSING'};
      nlItemHydrate();
      const fixture=structuredClone(game);fixture.silver=Math.max(fixture.silver||0,10000000);
      if(!fixture.nlContentC)fixture.nlContentC={};fixture.nlContentC.mobileCommanderLevel=440;
      const buyBundle=nlItemConsumableApi.buySourceBundle(fixture,bundle.id,'qa:generic-bundle-buy');
      const openBundle=buyBundle.ok?nlItemConsumableApi.use(buyBundle.state,bundle.id,'qa:generic-bundle-open',nlItemHeroId()):buyBundle;
      const duplicateOpen=openBundle.ok?nlItemConsumableApi.use(openBundle.state,bundle.id,'qa:generic-bundle-open',nlItemHeroId()):openBundle;
      const quantity=material.effectRule.needPieces;
      const buyMaterial=nlItemConsumableApi.buySourceMaterials(fixture,material.id,quantity,'qa:generic-material-buy');
      const processMaterial=buyMaterial.ok?nlItemConsumableApi.process(buyMaterial.state,material.id,'qa:generic-material-process'):buyMaterial;
      return {ok:buyBundle.ok&&openBundle.ok&&duplicateOpen.ok&&duplicateOpen.duplicate&&buyMaterial.ok&&processMaterial.ok,
        genericBundle:bundle.sourceId,genericMaterial:material.sourceId,openClassification:bundle.effectRule.classification,
        recipeClassification:material.effectRule.classification,duplicateOpen:!!duplicateOpen.duplicate,
        processed:processMaterial.detail?.outputCount===1,saveVersion:fixture.version,
        buyBundleCode:buyBundle.code||null,openBundleCode:openBundle.code||null,duplicateCode:duplicateOpen.code||null,
        buyMaterialCode:buyMaterial.code||null,processMaterialCode:processMaterial.code||null};
    },
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
