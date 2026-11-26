// === NL-CONTENT-C-V1: sourced roster and project-simulated native P2 expansion ===
const NL_CONTENT_C=__NL_CONTENT_C_DATA__;
const NL_C_TIER4=__NL_CONTENT_C_TIER4__;
const NL_CONTENT_C_TOWER=__NL_TOWER_DATA__;
let nlContentCSettle,nlContentCHeroPanel;
(()=>{
'use strict';
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), nat=x=>Number.isSafeInteger(x)&&x>=0?x:0, clamp=(v,l,h)=>Math.min(h,Math.max(l,v));
const owned=id=>game.roster.includes(id)&&!!game.hero[id];
const MOBILE_TROOPS=NL_CONTENT_C.mobileTroops;
const MOBILE_ITEM_SOURCE=NL_ITEM_CATALOGUE.mobileSource;
const MOBILE_DROP_BINDINGS=new Map((MOBILE_ITEM_SOURCE?.campaignDropBindings||[]).map(x=>[
 [String(x.mapId),String(x.npcId),String(x.sourceId),String(x.category||''),String(x.name||'')].join('|'),x.binding
]));
if(!MOBILE_TROOPS||Object.keys(MOBILE_TROOPS.units||{}).length!==408||Object.keys(MOBILE_TROOPS.baseRuntimeProfiles||{}).length!==5)throw Error('MOBILE_TROOP_SOURCE_COVERAGE_MISMATCH');
const MOBILE_TROOP_ATTACK=Object.freeze({strengthAtk:'atk',leaderAtk:'catk',intellectAtk:'matk'});
const MOBILE_TROOP_DEFENSE=Object.freeze({strengthDef:'def',leaderDef:'tdef',intellectDef:'mdef'});
function mobileTroopSourceId(role){return MOBILE_TROOPS.baseRuntimeRoleMap?.[role]||null;}
function mobileTroopProfile(role){const id=mobileTroopSourceId(role),row=id?MOBILE_TROOPS.units[id]:null;return row?{...row,id,role}:null;}
function applyMobileTroopProfile(u,team){
 if(!u||team!=='p'||battle?.mode==='cltq'||u.nlClassicWebUnit)return u;
 const sourceId=mobileTroopSourceId(u.troop),source=sourceId&&MOBILE_TROOPS.units[sourceId];if(!source)return u;
 const stats=source.stats;
 for(const [key,target] of Object.entries(MOBILE_TROOP_ATTACK))if(Number.isFinite(u[target]))u[target]=Math.max(1,Math.round(u[target]*stats[key]));
 for(const [key,target] of Object.entries(MOBILE_TROOP_DEFENSE))if(Number.isFinite(u[target]))u[target]=Math.max(1,Math.round(u[target]*stats[key]));
 const classCrit=u.type==='archer'?.10:.04;u.crit=Math.max(0,(Number(u.crit)||0)-classCrit+(Number(stats.critical)||0));
 u.nlMobileTroop={id:String(sourceId),name:source.name,typeName:source.typeName,sourceEdition:MOBILE_TROOPS.sourceEdition};return u;
}
const MAPS=NL_CONTENT_C.maps, HERO=new Map(NL_CONTENT_C.heroes.map(h=>[h.id,h]));
const NPC=new Map(), MAP=new Map(MAPS.map(m=>[m.id,m])),MAP_INDEX=new Map(MAPS.map((m,i)=>[m.id,i]));
for(const m of MAPS)m.npcs.forEach((n,i)=>NPC.set(n.id,{map:m,n,index:i}));
if(MAPS.length!==249||NPC.size!==5063||Object.keys(NL_CONTENT_C.heroAliases).length!==364)throw Error('C source counts');
for(const h of HERO.values()){
 const {descriptor,gate,silver,provenance,...profile}=h;HEROES[h.id]=profile;P2_SKILLS[h.id]={...descriptor};
}
const originalAddExp=addExp;
addExp=function(id,amount){
 const h=game.hero[id],cap=typeof nlClassicGrowthPolicy==='undefined'?40:nlClassicGrowthPolicy.cap(id);
 if(!h||cap<=40)return originalAddExp(id,amount);
 h.xp=nat(h.xp)+Math.max(0,nat(amount));while(h.level<cap&&h.xp>=h.level*90){h.xp-=h.level*90;h.level++;}
};
function state(){
 if(!obj(game.nlContentC))game.nlContentC={};
 const s=game.nlContentC;
 for(const k of ['cleared','mapsCleared','seals','recruits','sealLevels','sealActivations','npcRepeat'])if(!obj(s[k]))s[k]={};
 if(!Array.isArray(s.equippedSeals))s.equippedSeals=[];
 if(!obj(s.mobileSealLevels))s.mobileSealLevels={};
 if(!obj(s.mobileSealActivations))s.mobileSealActivations={};
 s.chienTich=nat(s.chienTich);s.hoPhu=nat(s.hoPhu);if(!Number.isSafeInteger(game.gold)||game.gold<0)game.gold=0;
 s.mobileCommanderLevel=Math.min(440,Math.max(10,nat(s.mobileCommanderLevel),10+2*Object.keys(s.cleared).length));
 migrateMobileSeals(s);
 s.version=2;
 if(s.repeatDay!==dayId()){s.repeatDay=dayId();s.npcRepeat={};}
 s.extraFloor=clamp(nat(s.extraFloor),0,NL_CONTENT_C_TOWER.maxFloor-NL_CONTENT_C_TOWER.nativeFloors);s.soul=nat(s.soul);
 return s;
}
const floor=()=>Math.max(0,Math.min(NL_CONTENT_C_TOWER.nativeFloors,nat(game.towerFloor)))+state().extraFloor;
function heroReady(h){return h.towerGate?floor()>=h.towerGate&&state().soul>=h.soulCost:game.cleared.includes(h.gate);}
function recruit(id){
 const h=HERO.get(id),s=state();
 if(battle||!h||owned(id)||!heroReady(h)||!payment({silver:h.silver}))return false;
 if(h.towerGate)s.soul-=h.soulCost;
 game.roster.push(id);game.hero[id]={level:1,xp:0,troops:160};game.troopModes[id]=h.type;
 s.recruits[id]=true;countTask('recruit');save();render();return true;
}
function family(label){
 const s=String(label||'').toLocaleLowerCase('vi');
 if(/trống|cổ thủ|cổ hiệu|kỳ cổ|cổ vũ|鼓/.test(s))return 'drum';
 if(/vũ nữ|vũ cơ|舞/.test(s))return 'dancer';
 if(/cung|nỏ|xạ|tiễn|pháo|弓|弩/.test(s))return 'archer';
 if(/kỵ|mã|tượng|骑/.test(s))return 'cavalry';
 if(/thương|kích|mâu|枪/.test(s))return 'spear';
 if(/văn|sĩ|sư|pháp|thuật|quan văn|文/.test(s))return 'strategist';
 if(/y quan|hồi phục|hỗ trợ/.test(s))return 'support';
 return 'infantry';
}
function inferredDescriptor(label,role,boss){
 const s=String(label||'Chiến pháp'),l=s.toLocaleLowerCase('vi'),mult=boss?1.6:1.35;
 if(/hồi|trị|cứu|nhân đức|y thuật/.test(l)||role==='support')return {tag:s,pattern:'heal',kind:'magic',mult,healCount:2,bonusMorale:8};
 if(/hoành|hàng ngang|quét/.test(l))return {tag:s,pattern:'row',kind:'tactic',mult:.95};
 if(/xuyên|liên|đột phá/.test(l))return {tag:s,pattern:'column',kind:'tactic',mult:1.05};
 if(/ly gián|li gián|huyễn|loạn|trấn/.test(l))return {tag:s,pattern:'single',kind:'magic',mult,drainMorale:20};
 if(/hỏa|viêm|lửa/.test(l))return {tag:s,pattern:'row',kind:'magic',mult:1.05,apply:'burn',applyChance:.35};
 if(role==='archer')return {tag:s,pattern:'back',kind:'physical',mult};
 return {tag:s,pattern:'single',kind:role==='strategist'?'magic':role==='cavalry'?'tactic':'physical',mult};
}
function descriptor(skill,role,boss){
 const source=skill&&typeof skill==='object'&&!Array.isArray(skill)?skill:null;
 if(!source)return inferredDescriptor(skill,role,boss);
 const name=String(source.name||'Chiến pháp'),text=String(source.desc||''),fold=text.toLocaleLowerCase('vi');
 const out=inferredDescriptor(name+' '+text,role,boss);
 out.tag=name;out.sourceSkillName=name;out.sourceDescription=text;
 out.sourceSkillClassification='SOURCE_TEXT_WITH_P2_ADAPTER';
 out.skillFieldProvenance={name:'SOURCE_EXACT',description:'SOURCE_EXACT',coefficient:'UNRESOLVED',target:'UNRESOLVED',secondaryEffects:'UNRESOLVED'};
 const damageStart=fold.search(/(?:gây|chịu|tấn công)\s+(?:cho\s+)?/);
 const damageClause=damageStart>=0?text.slice(damageStart,damageStart+240).split(/[;。]/,1)[0]:'';
 const targetContext=damageStart>=0?fold.slice(0,Math.min(fold.length,damageStart+120)):fold;
 const percent=damageClause.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*%/);
 const damageLane=damageClause.toLocaleLowerCase('vi');
 const sourceKind=/mưu công|pháp công|sát thương phép/.test(damageLane)?'magic':
   /sát thương vật lý|vật công/.test(damageLane)?'physical':
   /\[c\. pháp\]/i.test(text)?'magic':
   /\[kế sách\]/i.test(text)?'magic':
   /\[vật lý\]|\[thường\]/i.test(text)?'physical':out.kind;
 let sourcePattern=null,targetProvenance='SOURCE_TARGET_TEXT_NOT_MAPPED';
 if(/toàn phe địch/.test(targetContext)){sourcePattern='all';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng ngang/.test(targetContext)){sourcePattern='row';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng dọc|hàng thẳng/.test(targetContext)){sourcePattern='column';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng sau/.test(targetContext)){sourcePattern='back';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/1 kẻ địch|một kẻ địch|cho 1 địch|cho một địch/.test(targetContext)){sourcePattern='single';targetProvenance='DERIVED_FROM_SOURCE';}
 if(/trị liệu toàn phe ta/.test(fold)){
   const heal=text.match(/(?:mức trị liệu bằng|trị liệu bằng|trị liệu toàn phe ta[^()]*\()\s*(\d+(?:[.,]\d+)?)\s*%\s*mưu công/i);
   if(heal){out.pattern='heal';out.kind='magic';out.mult=Number(heal[1].replace(',','.'))/100;out.healCount=5;
     out.sourceSkillClassification='SOURCE_HEAL_COEFFICIENT_ADAPTED';out.skillFieldProvenance.coefficient='DERIVED_FROM_SOURCE';
     out.skillFieldProvenance.target='DERIVED_FROM_SOURCE';out.skillFieldProvenance.secondaryEffects=/\d+ lần trị liệu/.test(fold)?'UNRESOLVED_MULTIPLE_HEALS':'SOURCE_TEXT_RETAINED';
     return out;}
 }
 if(percent&&sourcePattern){
   let raw=percent[1],amount;
   if(raw.includes('.')&&/^\d{1,3}(?:\.\d{3})+$/.test(raw))amount=Number(raw.replaceAll('.',''));
   else amount=Number(raw.replace(',','.'));
   const repeated=damageClause.match(/(\d+)\s*lần/);
   out.pattern=sourcePattern;out.kind=sourceKind;out.mult=amount/100;
   out.sourceSkillClassification='SOURCE_DAMAGE_COEFFICIENT_AND_TARGET_ADAPTED';
   out.skillFieldProvenance.coefficient='DERIVED_FROM_SOURCE';out.skillFieldProvenance.target=targetProvenance;
   if(repeated&&Number(repeated[1])>1)out.skillFieldProvenance.secondaryEffects='UNRESOLVED_MULTI_HIT';
   else out.skillFieldProvenance.secondaryEffects=/\[|duy trì|giảm \d+ sĩ khí|hồi \d+ sĩ khí/.test(fold)?'UNRESOLVED_SECONDARY_EFFECTS':'SOURCE_TEXT_RETAINED';
   return out;
 }
 if(/trị liệu toàn phe ta/.test(fold))out.sourceSkillClassification='SIMULATED_FALLBACK_HEAL';
 else out.sourceSkillClassification='SIMULATED_FALLBACK_COMPLEX_OR_UNPARSED';
 return out;
}
function mobileSkillAudit(){
 const rows={totalUnits:0,sourceExactUnits:0,sourceExactWithNameAndDescription:0,withNameAndDescription:0,
   sourceExactDamageAdapted:0,sourceExactHealAdapted:0,sourceDamageAdapted:0,sourceHealAdapted:0,
   simulatedFallback:0,skillNames:new Set(),sourceExactSkillNames:new Set(),unresolvedSecondaryEffects:0};
 for(const map of MAPS)for(const npc of map.npcs)for(const unit of npc.units||[]){
   rows.totalUnits++;const skill=unit.skill;
   const sourceExact=unit.provenance==='SOURCE_EXACT_WITH_P2_ADAPTER';
   if(sourceExact)rows.sourceExactUnits++;
   if(!skill||typeof skill!=='object'||!skill.name||!skill.desc)continue;
   rows.withNameAndDescription++;rows.skillNames.add(skill.name);
   if(sourceExact){rows.sourceExactWithNameAndDescription++;rows.sourceExactSkillNames.add(skill.name);}
   const d=descriptor(skill,unit.role||'infantry',npc.boss);
   if(d.sourceSkillClassification==='SOURCE_DAMAGE_COEFFICIENT_AND_TARGET_ADAPTED'){
     rows.sourceDamageAdapted++;if(sourceExact)rows.sourceExactDamageAdapted++;
   }else if(d.sourceSkillClassification==='SOURCE_HEAL_COEFFICIENT_ADAPTED'){
     rows.sourceHealAdapted++;if(sourceExact)rows.sourceExactHealAdapted++;
   }else rows.simulatedFallback++;
   if(String(d.skillFieldProvenance?.secondaryEffects||'').startsWith('UNRESOLVED'))rows.unresolvedSecondaryEffects++;
 }
 return {...rows,skillNames:rows.skillNames.size,sourceExactSkillNames:rows.sourceExactSkillNames.size,
   sourceEdition:NL_CONTENT_C.sourceEdition};
}
function awakeningDescriptor(id){
 const record=NL_CONTENT_C.awakeningSkills?.[id],growth=game.heroDevelopment?.heroes?.[id]?.awakening;
 if(!record)return null;
 return growth?.gold?(record.stages?.GOLD||record.stages?.ORANGE||record.stages?.PURPLE):
     growth?.orange?(record.stages?.ORANGE||record.stages?.PURPLE):
     game.nlClassicAdvanced?.growth?.[id]?.awakened?record.stages?.PURPLE:null;
}
function readyNpc(id){
 const row=NPC.get(id),s=state();if(!row||s.cleared[id])return false;
 if(Number.isFinite(row.map.sourceUnlockLevel)&&row.map.sourceUnlockLevel>s.mobileCommanderLevel)return false;
 return row.index===0||!!s.cleared[row.map.npcs[row.index-1].id];
}
// PROJECT_SIMULATED: repeat battles and map completion rewards.
const REPEAT_LIMIT=3;
// Continuous campaign progression, independent of the 28-stage legacy unlock band.
function npcDifficulty(row){
 const i=MAP_INDEX.get(row.map.id)||0,within=row.index/Math.max(1,row.map.npcs.length-1);
 return clamp(1+Math.floor(i*89/Math.max(1,MAPS.length-1)+within*3),1,90);
}
function npcMerit(row,repeat=false){if(Number.isFinite(row?.n?.source?.merit))return Math.max(0,Math.floor(row.n.source.merit));return repeat?4+Math.floor(npcDifficulty(row)/5):12+Math.floor(npcDifficulty(row)*1.5)+(row.n.boss?20:0);}
function awardMerit(o,amount){
 const a=nlAState();if(!Number.isSafeInteger(amount)||amount<0||!Number.isSafeInteger(a.merit+amount))return;
 a.merit+=amount;o.meritAward=amount;
}
const ROLE_COEFFICIENTS={
 infantry:{def:1.12,tdef:1.06},spear:{atk:1.08,catk:1.12},cavalry:{catk:1.18,def:.92},
 archer:{atk:1.15,def:.86},strategist:{matk:1.20,mdef:1.10,def:.84},
 support:{matk:1.12,atk:.82},drum:{atk:.75,def:.95},dancer:{atk:.78,matk:1.07}
};
function npcRepeatCount(id){return nat(state().npcRepeat[id]);}
function canReplayNpc(id){return NPC.has(id)&&!!state().cleared[id]&&npcRepeatCount(id)<REPEAT_LIMIT;}
function npcReward(row,repeat=false){
 const scale=npcDifficulty(row),boss=!!row.n.boss;
 const base={silver:350+scale*85,grain:120+scale*25,prestige:boss?30+scale*3:10+scale};
 return repeat?{silver:Math.floor(base.silver*.4),grain:Math.floor(base.grain*.4),prestige:0}:base;
}
function rollMobileCampaignDrops(row){
 const source=row.n.source||{},drops=Array.isArray(source.drops)?source.drops:[],rows=[];
 for(const drop of drops){
  const name=String(drop?.name||''),category=String(drop?.category||''),sourceId=String(drop?.id??'0');
  const key=[String(row.map.sourceId||''),String(source.ident),sourceId,category,name].join('|'),binding=MOBILE_DROP_BINDINGS.get(key);
  if(!binding){rows.push({sourceId,name,category,rate:drop?.rate??null,hit:false,runtimeId:null,status:'UNRESOLVED_SOURCE_ITEM_BINDING'});continue;}
  const rate=Math.max(0,Math.min(100,Number(drop?.rate)||0)),roll=p2Random(),hit=roll<rate/100;
  rows.push({sourceId,name,category,rate,roll,hit,runtimeId:hit?binding.runtimeId:null,
   bindingKind:binding.kind,quantity:hit?1:0,quantityClassification:'SIMULATED_DEFAULT_ONE',status:hit?'SOURCE_DROP_ROLLED':'SOURCE_DROP_MISSED'});
 }
 return {sourceEdition:'CURRENT_VNG_MOBILE_WIKI_VIETNAMESE',classification:'SOURCE_EXACT_RATE_WITH_DERIVED_SEEDED_ROLL',
  sourceRateUnit:'percent',independentRolls:true,rows};
}
function mapBonus(m){
 const source=Array.isArray(m.sourceAchievementRewards)?m.sourceAchievementRewards:[];
 if(source.length){const out={silver:0,gold:0,grain:0,prestige:0,soul:20+m.gate*2,sourceExact:true,sourceRows:source.length};
  for(const r of source){const name=String(r?.name||'').toLocaleLowerCase('vi'),amount=nat(r?.amount);
   if(name.includes('bạc'))out.silver+=amount;else if(name.includes('vàng'))out.gold+=amount;else if(name.includes('lương'))out.grain+=amount;else if(name.includes('uy danh'))out.prestige+=amount;else if(name.includes('tướng hồn'))out.soul+=amount;
  }return out;
 }
 return {silver:800+m.gate*180,grain:300+m.gate*50,prestige:50+m.gate*8,soul:20+m.gate*2,sourceExact:false};
}
// SIMULATED earned-only acquisition; Wiki gives seal spend tables, not drop rates.
function sealCurrencyReward(row,repeat=false){
 const scale=npcDifficulty(row),first=650+scale*240+(row.n.boss?500:0);
 if(!repeat)return {chienTich:first,hoPhu:0};
 const next=npcRepeatCount(row.n.id);
 return {chienTich:Math.max(100,Math.floor(first*.08)),hoPhu:row.n.boss&&next%3===0?1:0};
}
// Compress Mobile source progression into the native 28-stage stat curve.
function npcBaseStage(scale){return clamp(1+Math.floor((scale-1)*27/89),1,28);}
function enemyScale(o,units,scale,raw){
 const stage=o.kind==='npc'?npcBaseStage(scale):clamp(scale,1,28);
 const soldier=x=>Math.max(1,Number(Array.isArray(x)?x[4]:x.troops)||1);
 const avg=units.reduce((sum,u)=>sum+soldier(u),0)/Math.max(1,units.length);
 const ratio=o.kind==='npc'?clamp(Math.sqrt(soldier(raw)/avg),.82,1.22):clamp(Math.sqrt(soldier(raw)/Math.max(200,250+scale*90)),.75,1.45);
 return {stage,ratio,difficulty:clamp(1+Math.max(0,scale-28)*.025,1,2.8)};
}
function openObjective(o,units,scale){
 if(battle||nlAState().orders<1||!game.cleared.includes(1)||!game.slots.some(id=>id&&game.hero[id]?.troops>=30))return false;
 // Existing cleared stage 1 provides native launch, grain, order, turn and animation authority.
 beginBattle(1,'campaign');
 if(!battle||battle.replay||battle.finished||battle.stage!==1||battle.mode!=='campaign')return false;
 battle.nlContentC=o;
 battle.e=units.map((raw,i)=>{
  const u=Array.isArray(raw)?{slot:raw[0],name:raw[1],label:raw[2],skill:raw[3],troops:raw[4],level:raw[5]}:raw;
  const role=u.role||family(u.label),slot=u.slot,boss=!!o.boss&&i===units.length-1;
  const power=enemyScale(o,units,scale,raw),e=p2Unit('e','e',boss?4:i,power.stage);
  e.id='c-'+i;e.slot=slot;delete e.nlTroopV2;delete e.nlA1BossSkill;delete e.skillId;delete e.skillKey;delete e.npcUnitId;delete e.npcProfileId;e.name=u.name;e.troop=role;e.type=role==='spear'?'infantry':(['drum','dancer','support'].includes(role)?'support':role);
  e.icon=({archer:'🏹',cavalry:'🐎',spear:'🔱',strategist:'🪶',support:'📜',drum:'🥁',dancer:'💃'})[role]||'🛡️';
  e.skill=typeof u.skill==='object'?String(u.skill?.name||'Chiến pháp'):String(u.skill||'Chiến pháp');
  e.nlCDescriptor=descriptor(u.skill,role,boss);
  e.nlMobileSource={npcId:o.id||null,troopId:u.sourceTroopId||null,troopType:u.sourceTroopType||null,
   sourceHp:u.sourceHp??null,sourceSkillName:u.sourceSkillName||u.skill?.name||u.skill||null,
   sourceSkillDescription:u.skill&&typeof u.skill==='object'?u.skill.desc||null:null,
   skillAdapter:e.nlCDescriptor.sourceSkillClassification||'SIMULATED_LEGACY_LABEL',
   adapter:u.provenance||'PROJECT_SIMULATED'};
  const {ratio,difficulty}=power;
  for(const k of ['atk','catk','matk','def','tdef','mdef'])e[k]=Math.max(1,Math.round(e[k]*ratio*difficulty*(ROLE_COEFFICIENTS[role]?.[k]||1)*(boss?1.12:1)));
  e.hp=e.maxHp=Math.max(1,Math.round(e.maxHp*ratio*difficulty*(boss?1.18:1)));e.effects=[];e.morale=boss?60:40;
  return e;
 });
 delete battle.nlA1;delete battle.nlA1Focus;
 battle.order=null;battle.orderIndex=0;battle.opening=p2Snapshot();
 if(o.kind==='tower'){game.activity.towerTries--;battleLastTab='tower';}
 save();renderBattleShell();return true;
}
function startNpc(id,repeat=false){
 if(repeat?!canReplayNpc(id):!readyNpc(id))return false;const r=NPC.get(id),scale=npcDifficulty(r);
 return openObjective({kind:'npc',id,mapId:r.map.id,title:r.map.name+' · '+r.n.name+(repeat?' · Tái chiến':''),boss:r.n.boss,scale,repeat:!!repeat,xp:repeat?Math.floor((95+scale*12)*.4):95+scale*12,
  mobileSource:{url:r.n.sourceUrl||null,record:structuredClone(r.n.source||{}),formation:structuredClone(r.n.units||[]),formationAdapter:r.n.provenance}},r.n.units,scale);
}
const TOWER_ROLE_NAMES={infantry:'Bộ binh',spear:'Thương binh',cavalry:'Kỵ binh',archer:'Cung thủ',strategist:'Mưu sĩ',support:'Hỗ trợ',drum:'Cổ thủ',dancer:'Vũ cơ'};
function towerPlan(n){
 if(!Number.isInteger(n)||n<=NL_CONTENT_C_TOWER.nativeFloors||n>NL_CONTENT_C_TOWER.maxFloor)return null;
 const arc=NL_CONTENT_C_TOWER.arcs.find(x=>n>=x.firstFloor&&n<x.firstFloor+10),local=arc?n-arc.firstFloor:-1;
 if(!arc||local<0||local>=NL_CONTENT_C_TOWER.layouts.length)return null;
 const layout=NL_CONTENT_C_TOWER.layouts[local],band=NL_CONTENT_C_TOWER.enemyCountBands.find(x=>n>=x.first&&n<=x.last);
 if(!band)return null;
 const boss=n%NL_CONTENT_C_TOWER.eliteEvery===0,chapterBoss=n%NL_CONTENT_C_TOWER.chapterBossEvery===0;
 const units=layout.order.slice(0,band.count).map((idx,i)=>{
  const source=arc.roster[idx],isLeader=boss&&i===band.count-1;
  return {slot:layout.slots[i],name:(isLeader?'Thủ lĩnh ':'')+source.name,role:source.role,skill:source.skill,
   troops:Math.round((500+n*90)*(source.troopScale||1)),level:n,boss:isLeader};
 });
 return {kind:'tower',id:'tower-'+n,floor:n,arcId:arc.id,arcName:arc.name,doctrine:arc.doctrine,counterplay:arc.counterplay,
  title:'Tháp Thí Luyện · Tầng '+n+' · '+arc.name,rank:chapterBoss?'Boss chương':boss?'Tinh anh':'Thường',boss,
  chapterBoss,aiStyle:arc.aiStyle,layoutIndex:local,units};
}
function towerRewards(n){
 const f=NL_CONTENT_C_TOWER.rewardFormula,b=f.normal,bonus=n%NL_CONTENT_C_TOWER.chapterBossEvery===0?f.chapterBossBonus:{silver:0,grain:0,prestige:0,soul:0};
 return {silver:b.silverBase+n*b.silverPerFloor+bonus.silver,grain:b.grainBase+n*b.grainPerFloor+bonus.grain,
  prestige:b.prestigeBase+n*b.prestigePerFloor+bonus.prestige,soul:b.soulBase+n*b.soulPerFloor+bonus.soul};
}
function startTower(){
 const n=floor()+1,plan=towerPlan(n);if(!plan||battle||!game.activity||game.activity.towerTries<=0||!towerAvailable())return false;
 return openObjective({...plan,xp:95+n*12},plan.units,n);
}
// Called only inside native finishBattle's victory branch. Native credit, losses, XP,
// report and replay are still the sole settlement owner; no legacy stage reward/loot.
nlContentCSettle=function(o){
 const s=state();
 if(o.kind==='npc'){
  const r=NPC.get(o.id);if(!r)return {};
  if(o.repeat){if(!canReplayNpc(o.id))return {};o.mobileDropRolls=rollMobileCampaignDrops(r);s.npcRepeat[o.id]=npcRepeatCount(o.id)+1;awardMerit(o,npcMerit(r,true));return {...npcReward(r,true),...sealCurrencyReward(r,true)};}
  if(s.cleared[o.id])return {};
  o.mobileDropRolls=rollMobileCampaignDrops(r);
  s.cleared[o.id]=true;s.soul+=r.n.boss?15:5;
  const reward={...npcReward(r),...sealCurrencyReward(r)};let merit=npcMerit(r);
  if(!s.mapsCleared[r.map.id]&&r.map.npcs.every(n=>s.cleared[n.id])){
   s.mapsCleared[r.map.id]=true;const bonus=mapBonus(r.map);s.soul+=bonus.soul;merit+=40+Math.floor(npcDifficulty(r)*2);
   for(const k of ['silver','gold','grain','prestige'])reward[k]=(reward[k]||0)+(bonus[k]||0);
   reward.chienTich+=1000+r.map.gate*150;
   if(Object.keys(s.mapsCleared).length%25===0)reward.hoPhu+=1;
  }
  awardMerit(o,merit);return reward;
 }
 if(o.kind==='tower'&&o.floor===floor()+1&&o.floor<=NL_CONTENT_C_TOWER.maxFloor){
  s.extraFloor++;const reward=towerRewards(o.floor);s.soul+=reward.soul;awardMerit(o,15+o.floor*2);return {silver:reward.silver,grain:reward.grain,prestige:reward.prestige,chienTich:1000+o.floor*200,hoPhu:o.floor%10===0?1:0};
 }
 return {};
};
const oldSkill=p2Skill;
p2Skill=function(actor){
 if(actor?.team==='e'&&battle?.nlContentC&&actor.nlCDescriptor)return actor.nlCDescriptor;
 if(actor?.team!=='p'||battle?.mode==='cltq'||battle?.replay)return oldSkill(actor);
 const chosen=awakeningDescriptor(actor.id);
 if(!chosen?.descriptor)return oldSkill(actor);
 const d={...chosen.descriptor},pattern=actor.nlClassicWebPattern;
 if(['row','column','back'].includes(pattern)&&d.pattern==='single'){d.pattern=pattern;d.mult*=.75;}
 if(actor.nlClassicWebAbility==='control'&&d.pattern!=='heal'&&!d.apply){d.apply='daze';d.applyChance=.18+.03*(actor.nlClassicWebTier||1);}
 return d;
};
const nlContentCBaseTarget=p2Target;
p2Target=function(actor,mode){
 const plan=battle?.nlContentC;
 if(actor?.team!=='e'||!plan)return nlContentCBaseTarget(actor,mode);
 const style=plan.kind==='tower'?plan.aiStyle:({cavalry:'pressure',spear:'counter',archer:'finish',strategist:'finish',support:'protect',drum:'protect',dancer:'protect'}[actor.troop]||'counter');
 const stage=battle.stage,styleStage={pressure:0,counter:1,finish:2,protect:3}[style]??1;
 try{battle.stage=styleStage;return nlContentCBaseTarget(actor,mode);}finally{battle.stage=stage;}
};
const oldReport=p2StoreReport;
p2StoreReport=function(rewards,loot){oldReport(rewards,loot);if(battle?.nlContentC&&battle.report)battle.report.nlContentC=structuredClone(battle.nlContentC);};
const oldShell=renderBattleShell;
renderBattleShell=function(){oldShell();const o=battle?.nlContentC||battle?.report?.nlContentC;
 if(o){const head=document.querySelector('.battle-head');if(head&&!document.querySelector('[data-nlc-battle]'))head.insertAdjacentHTML('afterend','<div data-nlc-battle class="nl-a1-live">'+esc(o.title)+' · PROJECT_SIMULATED</div>');}
};
// Tier 4 names and six historical source coefficients use the B4 assignment map,
// without mutating the original 55-entry catalogue or introducing another unit owner.
for(const t of NL_C_TIER4)NLW_B4_BY_ID.set(t.id,t);
const tier4=new Map(NL_C_TIER4.map(t=>[t.id,t])),oldCan=nlwB4CanSelect;
nlwB4CanSelect=function(id,tid){if(tier4.has(tid))return false;return oldCan(id,tid);};
function choose4(id,tid){
 const t=tier4.get(tid),s=state();
 if(battle||!t||!owned(id)||game.buildings.barracks<4||floor()<40||nat(game.nlClassicWorldA4?.rebirth?.[id])<10||s.soul<300||nlwB4Active(id)?.id===tid||!payment({silver:5000}))return false;
 s.soul-=300;const b=nlwB4State();b.assigned[id]=tid;b.selectionReceipts.push({heroId:id,troopId:tid,silver:5000,at:Date.now(),source:'PROJECT_SIMULATED_C'});b.selectionReceipts=b.selectionReceipts.slice(-250);save();render();return true;
}
// Mobile Seal V2: raw per-level values and destination-level prices come from the
// pinned public Wiki payload. Only unknown activation/acquisition details are simulated.
const SEAL_DATA=NL_CONTENT_C.mobileSeals;
const SEALS=SEAL_DATA.seals,SEAL_BY_ID=new Map(SEALS.map(x=>[x.id,x]));
const SEAL_MAX=SEAL_DATA.levelCap,SEAL_ACTIVATION_MAX=SEAL_DATA.activationRanks;
const SEAL_COST_BY_LEVEL=new Map(SEAL_DATA.upgradeCosts.map(x=>[x.lv,x]));
const SEAL_ADAPTER=SEAL_DATA.runtimeAdapter,SEAL_FLAT_SCALE=SEAL_ADAPTER.flatPointScale;
const sealKey=x=>String(x);
function sealReady(r){
 if(!r)return false;
 return !r.linkedFormation||Object.values(FORMATIONS).some(f=>f.name===r.linkedFormation);
}
function sealActive(r){
 if(!sealReady(r))return false;
 return !r.linkedFormation||FORMATIONS[game.formation]?.name===r.linkedFormation;
}
function migrateMobileSeals(s){
 if(s.mobileSealSchema===2)return;
 const ledger=[],aliases=SEAL_DATA.legacyAliases||{},levels=s.mobileSealLevels,activations=s.mobileSealActivations;
 for(const [alias,target] of Object.entries(aliases)){
  if(!s.seals[alias])continue;
  const oldLevel=clamp(nat(s.sealLevels[alias])||1,1,5),oldRank=clamp(nat(s.sealActivations[alias]),0,25);
  const beforeLevel=clamp(nat(levels[target])||1,1,SEAL_MAX),beforeRank=clamp(nat(activations[target]),0,25);
  levels[target]=Math.max(beforeLevel,oldLevel);activations[target]=Math.max(beforeRank,oldRank);
  ledger.push({legacyId:alias,mobileId:target,oldLevel,oldActivation:oldRank,
   retainedLevel:levels[target],retainedActivation:activations[target],collisionMergedByMax:beforeLevel>1||beforeRank>0});
 }
 s.mobileSealMigration={version:2,aliases:ledger,legacyEquippedSnapshot:[...s.equippedSeals]};
 s.mobileSealSchema=2;
}
const sealLevel=(s,id)=>{const r=SEAL_BY_ID.get(sealKey(id));if(!r||!sealReady(r))return 0;return clamp(nat(s.mobileSealLevels[r.id])||1,1,SEAL_MAX);};
const sealActivation=(s,id)=>{const r=SEAL_BY_ID.get(sealKey(id));return r&&sealLevel(s,r.id)?clamp(nat(s.mobileSealActivations[r.id]),0,SEAL_ACTIVATION_MAX):0;};
function sealActivationValue(r,rank){return Math.round(r.activation.maxTotal*clamp(nat(rank),0,SEAL_ACTIVATION_MAX)/SEAL_ACTIVATION_MAX);}
function sealActivationCost(rank){return {chienTich:500+250*clamp(nat(rank),1,SEAL_ACTIVATION_MAX)};}
function sealQuote(from,to){
 const a=clamp(nat(Number(from)),1,SEAL_MAX),b=clamp(nat(Number(to)),1,SEAL_MAX),low=Math.min(a,b),high=Math.max(a,b);
 let chienTich=0,hoPhu=0;
 for(let lv=low+1;lv<=high;lv++){const row=SEAL_COST_BY_LEVEL.get(lv);if(!row)throw Error('Missing exact seal price Lv'+lv);chienTich+=row.ct;hoPhu+=row.hp;}
 return {from:low,to:high,chienTich,hoPhu,classification:'SOURCE_EXACT'};
}
function sealValue(r,s){
 const level=sealLevel(s,r.id);if(!level)return [];
 const flat=r.attributes.filter(a=>a.kind==='levelSeries'),rank=sealActivation(s,r.id),active=sealActivationValue(r,rank);
 const each=flat.length?Math.floor(active/flat.length):0,remainder=flat.length?active%flat.length:0;
 return r.attributes.map(a=>a.kind==='fixedPercent'?{label:a.label,kind:a.kind,value:a.fixed}:
  {label:a.label,kind:a.kind,value:a.series[level-1]+each+(flat.indexOf(a)<remainder?1:0)});
}
function spendSealCurrency(cost){
 const s=state();if(s.chienTich<cost.chienTich||s.hoPhu<(cost.hoPhu||0))return false;
 s.chienTich-=cost.chienTich;s.hoPhu-=cost.hoPhu||0;return true;
}
function activateSeal(id){
 const s=state(),r=SEAL_BY_ID.get(sealKey(id)),rank=sealActivation(s,id);
 if(battle||!r||!sealReady(r)||!sealLevel(s,id)||rank>=SEAL_ACTIVATION_MAX)return false;
 if(!spendSealCurrency(sealActivationCost(rank+1)))return false;
 s.mobileSealActivations[r.id]=rank+1;save();render();return true;
}
function upgradeSeal(id,target=undefined){
 const s=state(),r=SEAL_BY_ID.get(sealKey(id)),level=sealLevel(s,id),to=target===undefined?level+1:Math.trunc(Number(target));
 if(battle||!r||!sealReady(r)||!level||!Number.isInteger(to)||to<=level||to>SEAL_MAX)return false;
 const cost=sealQuote(level,to);if(!spendSealCurrency(cost))return false;
 s.mobileSealLevels[r.id]=to;sealFrom=to;sealTo=Math.min(SEAL_MAX,to+1);save();render();return true;
}
function sealStatsForRuntime(id,level,rank){
 const r=SEAL_BY_ID.get(sealKey(id));if(!r)return null;
 const active=sealActivationValue(r,rank),flat=r.attributes.filter(a=>a.kind==='levelSeries'),each=flat.length?Math.floor(active/flat.length):0,rem=flat.length?active%flat.length:0;
 return r.attributes.map(a=>({label:a.label,kind:a.kind,sourceValue:a.kind==='fixedPercent'?a.fixed:a.series[clamp(nat(level)||1,1,SEAL_MAX)-1],
  value:a.kind==='fixedPercent'?a.fixed:a.series[clamp(nat(level)||1,1,SEAL_MAX)-1]+each+(flat.indexOf(a)<rem?1:0)}));
}
function legacySealStats(){return {classification:'SIMULATED',activationCost:'500 + 250 × destination rank Chiến Tích',flatPointScale:SEAL_FLAT_SCALE,discount:'UNRESOLVED'};}
const oldMobileSealCredit=credit;
credit=function(kind,amount){if(kind==='chienTich'||kind==='hoPhu'){const s=state();s[kind]+=Math.max(0,nat(amount));return;}if(kind==='gold'){state();game.gold+=Math.max(0,nat(amount));return;}return oldMobileSealCredit(kind,amount);};
const oldMobileSealPayment=payment;
payment=function(cost){
 const sealCost={chienTich:nat(cost?.chienTich),hoPhu:nat(cost?.hoPhu)},goldCost=nat(cost?.gold),other={...(cost||{})};delete other.chienTich;delete other.hoPhu;delete other.gold;
 const s=state();if(s.chienTich<sealCost.chienTich||s.hoPhu<sealCost.hoPhu)return false;
 if(game.gold<goldCost)return false;
 if(!oldMobileSealPayment(other))return false;
 s.chienTich-=sealCost.chienTich;s.hoPhu-=sealCost.hoPhu;game.gold-=goldCost;return true;
};
const oldMobileSealResources=renderResources;
renderResources=function(){oldMobileSealResources();const box=$('resources');if(!box)return;for(const [key,label,value] of [['gold','🪙 Vàng',game.gold],['chienTich','⚔ Chiến Tích',state().chienTich],['hoPhu','虎 Hổ Phù',state().hoPhu]]){let el=box.querySelector('[data-nlc-wallet="'+key+'"]');if(!el){box.insertAdjacentHTML('beforeend','<div class="res" data-nlc-wallet="'+key+'"><span>'+label+'</span><b>'+fmt(value)+'</b></div>');}else el.innerHTML='<span>'+label+'</span><b>'+fmt(value)+'</b>';}};
const oldMobileSealEarnedText=earnedText;
earnedText=function(rewards){const rest={...(rewards||{})},ct=nat(rest.chienTich),hp=nat(rest.hoPhu),gold=nat(rest.gold);delete rest.chienTich;delete rest.hoPhu;delete rest.gold;const labels=[];if(Object.keys(rest).length)labels.push(oldMobileSealEarnedText(rest));if(gold)labels.push('Vàng '+fmt(gold));if(ct)labels.push('Chiến Tích '+fmt(ct));if(hp)labels.push('Hổ Phù '+fmt(hp));return labels.filter(Boolean).join(' · ');};
const priorUnit=p2Unit;
p2Unit=function(id,team,slot,stage){
 const u=priorUnit(id,team,slot,stage);if(team!=='p'||!u||battle?.mode==='cltq')return u;
 applyMobileTroopProfile(u,team);
 const awake=awakeningDescriptor(id);if(awake?.descriptor)u.skill=awake.descriptor.tag;
 const s=state(),flat={},pct={};let troopCapacity=0,healing=0;
 for(const r of SEALS){if(!sealActive(r))continue;const values=sealStatsForRuntime(r.id,sealLevel(s,r.id),sealActivation(s,r.id));
  for(const a of values){const targets=SEAL_ADAPTER.statTargets[a.label];if(!targets)continue;const keys=Array.isArray(targets)?targets:[targets];
   if(a.kind==='fixedPercent')for(const k of keys){if(k==='healingMultiplier')healing+=a.value/100;else pct[k]=(pct[k]||0)+a.value/100;}
   else {const bonus=a.value*SEAL_FLAT_SCALE;for(const k of keys){if(k==='troopCapacity')troopCapacity+=bonus;else if(k==='healingMultiplier')healing+=bonus;else flat[k]=(flat[k]||0)+bonus;}}
  }
 }
 for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]=(u[k]+(flat[k]||0))*(1+(pct[k]||0));
 if(troopCapacity){const hpBonus=troopCapacity*.82;u.troopCapacity=(u.troopCapacity||0)+troopCapacity;u.maxHp+=hpBonus;u.hp+=hpBonus;}
 u.nlSealHealingMultiplier=1+healing;
 if(tier4.has(nlwB4Active(id)?.id))for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]=Math.round(u[k]*1.08);
 return u;
};
const priorSealHeal=p2Heal;
p2Heal=function(a,t,mult){return priorSealHeal(a,t,mult*(a?.nlSealHealingMultiplier||1));};
let mapPage=0,npcPage=0,heroPage=0,unitPage=0,sealPage=0,mapId=MAPS[0].id,heroId='',search='',heroSearch='',sealId='1002',sealSearch='',sealFrom=1,sealTo=2;
const btn=(a,id,label,disabled=false)=>'<button class="gold-button" data-nlc-action="'+a+'" data-nlc-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const row=(title,desc,action='')=>'<div class="nlc-row"><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div><div class="nlc-actions">'+action+'</div></div>';
const pane=(name,title,body)=>'<section class="panel mini-box nlc-pane" data-nlc-panel="'+name+'"><h3>'+title+'</h3>'+body+'</section>';
const pages=(a,n,cb,action)=>a.slice(n*4,n*4+4).map(cb).join('')+'<div class="nlc-nav">'+btn(action,'prev','Trước',n===0)+' <span>'+(n+1)+'/'+Math.max(1,Math.ceil(a.length/4))+'</span> '+btn(action,'next','Sau',n>=Math.ceil(a.length/4)-1)+'</div>';
function nextNpc(){
 for(const m of MAPS){if(Number.isFinite(m.sourceUnlockLevel)&&m.sourceUnlockLevel>state().mobileCommanderLevel)continue;
   const n=m.npcs.find(n=>readyNpc(n.id));if(n)return {map:m,n};
 }return null;
}
function jumpNextNpc(){if(battle)return false;const x=nextNpc();if(!x)return false;
 search='';mapId=x.map.id;mapPage=Math.floor(MAP_INDEX.get(mapId)/20);npcPage=Math.floor(NPC.get(x.n.id).index/4);save();render();return true;
}
function campaignPanel(){const s=state(),m=MAP.get(mapId)||MAPS[0],list=MAPS.filter(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
 const options=list.slice(mapPage*20,mapPage*20+20).map(x=>'<option value="'+esc(x.id)+'" '+(x.id===m.id?'selected':'')+'>'+esc(x.name)+' · '+x.npcs.length+' NPC · Cấp mở Wiki '+fmt(x.sourceUnlockLevel)+'</option>').join('');
 if(!list.length)return pane('campaign','Thiên Hạ Wiki','<input data-nlc-search placeholder="Tìm phó bản" value="'+esc(search)+'"><p>Không tìm thấy phó bản.</p>');
 const progress=m.npcs.filter(n=>s.cleared[n.id]).length,bonus=mapBonus(m),next=nextNpc();
 return pane('campaign','Thiên Hạ Wiki · 249 phó bản / 5.063 NPC','<p>Đã vượt '+Object.keys(s.cleared).length+' NPC · '+Object.keys(s.mapsCleared).length+' bản đồ · Cấp Chỉ huy '+s.mobileCommanderLevel+' · '+s.soul+' Tướng Hồn. Cấp chỉ huy tăng theo nhịp mô phỏng; ngưỡng mở bản đồ dùng đúng Cấp mở Wiki.</p>'+(next?row('Mục tiêu tiếp theo',next.map.name+' · '+next.n.name,btn('next-objective','','Đi tới',!!battle)):'<p>Không còn NPC đang mở. Tăng Cấp Chỉ huy qua chiến dịch để mở bản đồ theo Wiki.</p>')+'<input data-nlc-search placeholder="Tìm phó bản" value="'+esc(search)+'"><select data-nlc-map>'+options+'</select><div class="nlc-nav">'+btn('map-page','prev','Bản đồ trước',mapPage===0)+btn('map-page','next','Bản đồ sau',mapPage>=Math.ceil(list.length/20)-1)+'</div><b>'+esc(m.name)+' · '+progress+'/'+m.npcs.length+' · Cấp mở '+fmt(m.sourceUnlockLevel)+'</b><p>Thành tựu Wiki: '+fmt(bonus.silver)+' Bạc · '+fmt(bonus.gold)+' Vàng · '+fmt(bonus.soul)+' Tướng Hồn '+(bonus.sourceExact?'(Bạc/Vàng theo nguồn; Tướng Hồn mô phỏng)':'(mô phỏng)')+'</p>'+pages(m.npcs,npcPage,n=>row(n.name,(n.boss?'Boss · ':'')+n.units.length+' đội · Wiki Lv '+fmt(n.source?.level||n.level)+' · '+fmt(n.source?.troops||0)+' quân · lực '+fmt(n.source?.power||0)+' · '+fmt(npcReward(NPC.get(n.id),!!s.cleared[n.id]).silver)+' Bạc mô phỏng · '+npcMerit(NPC.get(n.id),!!s.cleared[n.id])+' Chiến công Wiki · '+(n.sourceFormationIncomplete?'ngoại suy đội hình':'đội hình nguồn 3×3'),s.cleared[n.id]?btn('npc-repeat',n.id,'Tái chiến '+npcRepeatCount(n.id)+'/'+REPEAT_LIMIT,!!battle||!canReplayNpc(n.id)):btn('npc',n.id,'Xuất chiến',!readyNpc(n.id)||!!battle)),'npc-page'));
}
function heroPanel(){const s=state(),query=heroSearch.trim().toLocaleLowerCase('vi'),rows=[...HERO.values()].filter(h=>[h.name,h.faction,h.skill].some(v=>String(v||'').toLocaleLowerCase('vi').includes(query)));heroPage=Math.max(0,Math.min(heroPage,Math.ceil(rows.length/4)-1));return pane('heroes','Danh tướng Wiki bổ sung · '+HERO.size,'<p>364 hồ sơ Wiki được ánh xạ · '+NL_CONTENT_C.counts.runtimeHeroes+' danh tính runtime, gồm tướng cũ.</p><input data-nlc-hero-search placeholder="Tìm tên, phe hoặc kỹ năng" value="'+esc(heroSearch)+'"><p>Kết quả: '+rows.length+'</p>'+pages(rows,heroPage,h=>row(h.name,(h.faction||'')+' · '+h.skill+' · '+(h.towerGate?'Tháp '+h.towerGate+' · '+h.soulCost+' Tướng Hồn':'ải '+h.gate)+' · '+h.silver+' Bạc',btn('recruit',h.id,owned(h.id)?'Đã có':'Chiêu mộ',owned(h.id)||!!battle||!heroReady(h)||game.silver<h.silver)),'hero-page'));}
function mobileTroopPanel(){
 const order=['infantry','spear','cavalry','archer','strategist'];
 const rows=order.map(role=>{const p=mobileTroopProfile(role),s=p.stats;
  const coeff=Object.entries(s).map(([k,v])=>esc(k)+' × '+fmt(v)).join(' · ');
  return row(p.name,p.typeName+' · '+coeff+' · '+p.desc);
 }).join('');
 return pane('mobile-troops','Binh chủng Mobile · hệ số nguồn',
  '<p>408 hồ sơ nguồn đã nhập; lô hệ số cơ bản dưới đây áp dụng vào P2. Hành vi 403 hồ sơ nâng cao và 21 quy tắc riêng: chưa nối gameplay.</p>'+rows+
  '<p class="tiny">Hệ số chiến đấu lấy từ Wiki VNG Mobile. Ánh xạ hệ số sang thuộc tính P2 là DERIVED_FROM_SOURCE; hiệu ứng đòn đánh trả còn UNRESOLVED.</p>');
}
function troopPanel(){if(!owned(heroId))heroId=game.roster[0]||'';return pane('troops','Quân WEB cấp 4 · '+tier4.size,'<p>Nhánh WEB 2011 · yêu cầu 10 lần chuyển sinh, Tháp 40, Doanh Trại 4 · 300 Tướng Hồn + 5.000 Bạc.</p><select data-nlc-hero>'+game.roster.map(id=>'<option value="'+esc(id)+'" '+(id===heroId?'selected':'')+'>'+esc(HEROES[id]?.name||id)+'</option>').join('')+'</select>'+pages(NL_C_TIER4,unitPage,t=>row(t.name,t.sourceName+' · '+t.familyName,btn('tier4',t.id,nlwB4Active(heroId)?.id===t.id?'Đang dùng':'Chuyển quân',!!battle||!owned(heroId)||floor()<40||nat(game.nlClassicWorldA4?.rebirth?.[heroId])<10||game.buildings.barracks<4||state().soul<300||game.silver<5000)),'unit-page'));}
function towerPanel(){
 const completed=floor(),locked=completed<NL_CONTENT_C_TOWER.nativeFloors,done=completed>=NL_CONTENT_C_TOWER.maxFloor,
  next=locked?NL_CONTENT_C_TOWER.nativeFloors+1:Math.min(NL_CONTENT_C_TOWER.maxFloor,completed+1),plan=!locked&&!done?towerPlan(next):null,
  tries=game.activity?.towerTries||0,reward=plan?towerRewards(next):null;
 const roster=plan?plan.units.map(u=>esc(u.name)+' · '+esc(TOWER_ROLE_NAMES[u.role]||u.role)+' · '+esc(u.skill)).join('<br>'):'';
 const preview=plan?'<div class="nlc-tower-plan"><b>'+esc(plan.arcName)+' · '+esc(plan.rank)+'</b><small>'+esc(plan.doctrine)+'</small><p>'+esc(plan.counterplay)+'</p><div class="nlc-tower-lineup">'+roster+'</div></div>':locked?'<div class="nlc-tower-plan"><b>Mở rộng từ tầng '+next+'</b><small>Hoàn thành 20 tầng gốc để mở 8 chặng mô phỏng đến tầng 100.</small></div>':row('Tháp đã chinh phục','Đã hoàn thành đủ '+NL_CONTENT_C_TOWER.maxFloor+' tầng.');
 const loot=reward?'<p class="nlc-tower-reward">Thưởng mô phỏng: Bạc +'+fmt(reward.silver)+' · Lương +'+fmt(reward.grain)+' · Uy danh +'+fmt(reward.prestige)+' · Tướng Hồn +'+fmt(reward.soul)+(plan.chapterBoss?' · thưởng Boss chương':'')+'</p>':'';
 const progress=locked?'Đã vượt '+completed+'/'+NL_CONTENT_C_TOWER.nativeFloors+' tầng gốc':`Đã vượt ${completed}/${NL_CONTENT_C_TOWER.maxFloor}`;
 return pane('tower','Tháp Thí Luyện · '+NL_CONTENT_C_TOWER.maxFloor+' tầng','<p>'+progress+' · lượt hôm nay '+tries+'/3 · Tướng Hồn '+state().soul+'</p>'+preview+loot+row(done?'Hoàn tất':locked?'Tầng '+NL_CONTENT_C_TOWER.nativeFloors+' → '+next:'Tầng '+next,locked?'Mở rộng sau khi vượt đủ 20 tầng gốc.':done?'Đã hoàn thành Tháp Thí Luyện.':'Đội hình '+plan.units.length+' quân · '+plan.aiStyle+' · PROJECT_SIMULATED',btn('tower','','Khiêu chiến',!!battle||locked||done||!tries)));
}
function sealPanel(){
 const s=state(),query=sealSearch.trim().toLocaleLowerCase('vi'),list=SEALS.filter(r=>[r.id,r.name,r.linkedFormation||'Ấn cơ bản',...r.attributes.map(a=>a.label)].join(' ').toLocaleLowerCase('vi').includes(query));
 sealPage=Math.max(0,Math.min(sealPage,Math.max(0,Math.ceil(list.length/4)-1)));
 let r=SEAL_BY_ID.get(sealId);if(!r||!list.some(x=>x.id===r.id))r=list[0]||SEALS[0];if(r)sealId=r.id;
 const eligible=sealReady(r),active=sealActive(r),level=sealLevel(s,r.id),rank=sealActivation(s,r.id),values=sealValue(r,s),byLabel=new Map(values.map(x=>[x.label,x]));
 if(!sealFrom||sealFrom<1)sealFrom=Math.max(1,level||1);if(!sealTo||sealTo<1)sealTo=Math.min(SEAL_MAX,(level||1)+1);
 sealFrom=clamp(Math.trunc(sealFrom),1,SEAL_MAX);sealTo=clamp(Math.trunc(sealTo),1,SEAL_MAX);
 const quote=sealQuote(sealFrom,sealTo),nextRank=rank+1,rankCost=sealActivationCost(nextRank),rankGain=sealActivationValue(r,nextRank)-sealActivationValue(r,rank);
 const unlock=r.linkedFormation?'Mở khi sở hữu '+r.linkedFormation+' · '+(eligible?'đã có trong danh mục trận pháp':'chưa có Trận pháp nguồn trong game'):'Ấn cơ bản · không cần trận pháp';
 const attrHtml=r.attributes.map(a=>a.kind==='fixedPercent'
  ?'<div class="nlc-seal-attr"><span>'+esc(a.label)+' <i>cố định</i></span><b>+'+fmt(a.fixed)+'%</b></div>'
  :'<div class="nlc-seal-attr"><span>'+esc(a.label)+' <i>Lv1 → Lv250</i></span><b>+'+fmt(a.series[0])+' → +'+fmt(a.series[249])+'</b><small>Hiện tại '+(level?'Lv'+level+' · +'+fmt(byLabel.get(a.label)?.value||0):'đang khóa')+'</small></div>').join('');
 const rows=pages(list,sealPage,x=>{const ok=sealReady(x),on=sealActive(x),lv=sealLevel(s,x.id),detail=x.linkedFormation?(on?'· Đang dùng với '+x.linkedFormation:ok?'· Đổi sang '+x.linkedFormation+' để kích hoạt':'· Chưa có trận pháp'): '· Ấn cơ bản';return row(x.name,'ID '+x.id+' · '+(x.linkedFormation||'Cơ bản')+' · '+(ok?'Lv '+lv+'/'+SEAL_MAX:'Khóa')+' '+detail,btn('select-seal',x.id,x.id===r.id?'Đang xem':'Chi tiết'));},'seal-page');
 const activationText=rank<SEAL_ACTIVATION_MAX?'<p class="tiny">Bậc kế '+nextRank+'/'+SEAL_ACTIVATION_MAX+': mô phỏng +'+fmt(rankGain)+' tổng chỉ số · '+fmt(rankCost.chienTich)+' Chiến Tích.</p>'+btn('activate-seal',r.id,'Kích hoạt bậc '+nextRank,!!battle||!eligible||!level||s.chienTich<rankCost.chienTich):'<p class="tiny">Đã đạt tổng kích hoạt tối đa theo Wiki: +'+fmt(r.activation.maxTotal)+'.</p>';
 const upgradeDisabled=!!battle||!eligible||!level||sealFrom!==level||sealTo<=level||s.chienTich<quote.chienTich||s.hoPhu<quote.hoPhu;
 const listBody='<div class="nlc-seal-wallet">Chiến Tích <b>'+fmt(s.chienTich)+'</b> · Hổ Phù <b>'+fmt(s.hoPhu)+'</b> · '+SEALS.filter(sealActive).length+' ấn đang tác dụng</div>'+
  '<input data-nlc-seal-search placeholder="Tìm ấn, chỉ số hoặc trận pháp" value="'+esc(sealSearch)+'"><div class="nlc-seal-rows">'+rows+'</div>';
 const detail='<div class="nlc-seal-detail"><h4>'+esc(r.name)+' <small>ID '+esc(r.id)+(r.new?' · Mới':'')+'</small></h4><p>'+esc(unlock)+(r.linkedFormation&&active?' · Hiệu lực trong đội hình hiện tại':'')+'</p>'+attrHtml+
   '<p class="tiny">Kích hoạt tối đa: +'+fmt(r.activation.maxTotal)+' qua 25 bậc. Phân bổ từng bậc và chi phí kích hoạt: SIMULATED vì Wiki chỉ công bố tổng.</p>'+activationText+
   '<div class="nlc-seal-calc"><b>Tính chỉ số và chi phí cường hóa</b><label>Từ Lv <input data-nlc-seal-from type="number" min="1" max="250" value="'+sealFrom+'"></label><label>đến Lv <input data-nlc-seal-to type="number" min="1" max="250" value="'+sealTo+'"></label>'+
   '<span>Chiến Tích '+fmt(quote.chienTich)+' · Hổ Phù '+fmt(quote.hoPhu)+'</span>'+btn('upgrade-seal',r.id,'Cường hóa → Lv'+sealTo,upgradeDisabled)+'</div>'+
   '<p class="tiny">Giá gốc theo từng cấp Wiki; Hổ Phù chỉ trừ tại các mốc có trong bảng. Quy tắc giảm giá riêng của Ấn chưa được công bố, nên chưa áp dụng. P2 quy đổi chỉ số phẳng theo hệ số 1/1000; số Wiki hiển thị giữ nguyên.</p></div>';
 return pane('seals','Ấn Trận Mobile · '+SEALS.length+' mẫu',listBody)+pane('seal-detail','Chi tiết Ấn Trận · '+r.name,detail);
}
nlContentCHeroPanel=heroPanel;
const c0=renderCampaign,h0=renderHeroes,b0=renderBarracks,t0=renderTower,f0=renderFormation;
renderCampaign=function(){return c0()+campaignPanel();};renderHeroes=function(){return h0()+heroPanel();};renderBarracks=function(){return b0()+troopPanel()+mobileTroopPanel();};renderTower=function(){return t0()+towerPanel();};renderFormation=function(){return f0()+sealPanel();};
document.addEventListener('change',e=>{if(e.target.matches?.('[data-nlc-map]')&&MAP.has(e.target.value)){mapId=e.target.value;npcPage=0;render();}else if(e.target.matches?.('[data-nlc-hero-search]')){heroSearch=e.target.value;heroPage=0;render();}else if(e.target.matches?.('[data-nlc-hero]')){heroId=e.target.value;render();}else if(e.target.matches?.('[data-nlc-search]')){search=e.target.value;mapPage=0;const match=MAPS.find(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(match){mapId=match.id;npcPage=0;}render();}else if(e.target.matches?.('[data-nlc-seal-search]')){sealSearch=e.target.value;sealPage=0;render();}else if(e.target.matches?.('[data-nlc-seal-from]')){sealFrom=clamp(Math.trunc(Number(e.target.value)||1),1,SEAL_MAX);render();}else if(e.target.matches?.('[data-nlc-seal-to]')){sealTo=clamp(Math.trunc(Number(e.target.value)||1),1,SEAL_MAX);render();}});
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nlc-action]');if(!b||b.disabled)return;const a=b.dataset.nlcAction,id=b.dataset.nlcId,delta=id==='next'?1:-1;
 if(a==='next-objective'){jumpNextNpc();return;}
 if(a==='select-seal'){sealId=id;const lv=sealLevel(state(),id)||1;sealFrom=lv;sealTo=Math.min(SEAL_MAX,lv+1);render();requestAnimationFrame(()=>setTimeout(()=>document.querySelector('#nl-screen-next')?.click(),0));return;}
 if(a==='map-page'){mapPage=Math.max(0,mapPage+delta);const list=MAPS.filter(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(list[mapPage*20]){mapId=list[mapPage*20].id;npcPage=0;}render();return;}
 if(a==='npc-page')npcPage=Math.max(0,npcPage+delta);else if(a==='hero-page')heroPage=Math.max(0,heroPage+delta);else if(a==='unit-page')unitPage=Math.max(0,unitPage+delta);else if(a==='seal-page')sealPage=Math.max(0,sealPage+delta);else {const fn={npc:startNpc,'npc-repeat':id=>startNpc(id,true),recruit,tier4:tid=>choose4(heroId,tid),tower:startTower,'upgrade-seal':id=>upgradeSeal(id,sealTo),'activate-seal':activateSeal}[a];if(fn&&!fn(id))toast('Chưa đủ điều kiện hoặc tài nguyên.');return;}render();});
const style=document.createElement('style');style.textContent='.nlc-row{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #665e43}.nlc-row b,.nlc-row small{display:block}.nlc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;max-width:57%}.nlc-actions button{white-space:normal!important;text-align:center}.nlc-row small,.nlc-pane p{font-size:10px}.nlc-row button,.nlc-nav button{font-size:11px;padding:5px 8px;white-space:nowrap}.nlc-nav{display:flex;align-items:center;gap:6px;margin:4px 0}.nlc-pane input,.nlc-pane select{max-width:100%;font-size:12px}.nlc-pane h3{margin:4px 0}.nlc-seal-wallet{padding:6px 8px;margin:4px 0;background:#102d28;border:1px solid #927849;border-radius:5px;font-size:11px}.nlc-seal-wallet b{color:#f0d18a}.nlc-seal-detail{margin-top:7px;padding:8px;border:1px solid #91764a;background:linear-gradient(140deg,#172c28,#17221f);border-radius:6px}.nlc-seal-detail h4{font-size:14px;margin:0 0 3px;color:#f1dcaa}.nlc-seal-detail h4 small{font-size:10px;color:#b9aa83}.nlc-seal-attr{display:grid;grid-template-columns:minmax(100px,1fr) auto;gap:2px 8px;padding:3px 0;border-bottom:1px solid #554d39;font-size:10px}.nlc-seal-attr b{color:#e7cf94}.nlc-seal-attr small{grid-column:1/-1;color:#aeb4a6;font-size:9px}.nlc-seal-attr i{font-style:normal;color:#87cdb0}.nlc-seal-calc{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;padding-top:6px;border-top:1px solid #746342;font-size:10px}.nlc-seal-calc>b{flex-basis:100%;color:#edd59d}.nlc-seal-calc label{white-space:nowrap}.nlc-seal-calc input{width:48px;padding:3px;border:1px solid #806e49;border-radius:4px;background:#0b1c19;color:#fff;text-align:center}.nlc-seal-calc span{color:#e5d3a4}.nlc-seal-calc button{font-size:10px;padding:5px 7px}.nlc-tower-plan{margin:8px 0;padding:9px 11px;border:1px solid #786a47;border-radius:6px;background:linear-gradient(135deg,#29362f,#172522)}.nlc-tower-plan>b{display:block;color:#f1d797}.nlc-tower-plan>small{display:block;margin-top:3px;color:#c5b68e;font-size:10px}.nlc-tower-plan p{line-height:1.55;margin:6px 0;color:#c4cdc0}.nlc-tower-lineup{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:3px 10px;color:#e0d4b4;font-size:10px}.nlc-tower-reward{padding:7px 9px;background:#172c27;border-left:3px solid #c3a262;color:#e5d4a9;line-height:1.6}@media(max-width:560px){.nlc-tower-lineup{grid-template-columns:1fr}}';document.head.appendChild(style);
if(window.__P2_ENABLE_QA__)window.__NL_CONTENT_C_QA__=Object.freeze({counts:NL_CONTENT_C.counts,state:()=>structuredClone(state()),map:id=>MAP.get(id),npc:id=>NPC.get(id)?.n,readyNpc,startNpc,nextNpc:()=>structuredClone(nextNpc()),awakeningDescriptor:id=>structuredClone(awakeningDescriptor(id)),canReplayNpc,npcRepeatCount,npcDifficulty:id=>NPC.has(id)?npcDifficulty(NPC.get(id)):null,npcBaseStage,enemyScale,npcMerit:id=>NPC.has(id)?npcMerit(NPC.get(id)):null,npcReward:id=>{const r=NPC.get(id);return r?npcReward(r,true):null;},mapBonus:id=>MAP.has(id)?mapBonus(MAP.get(id)):null,startTower,towerPlan,towerRewards,towerTarget:p2Target,recruit,choose4,upgradeSeal,activateSeal,sealReady:id=>sealReady(SEAL_BY_ID.get(sealKey(id))),sealActive:id=>sealActive(SEAL_BY_ID.get(sealKey(id))),sealActivation:id=>sealActivation(state(),id),sealActivationValue:(id,rank)=>{const r=SEAL_BY_ID.get(sealKey(id));return r?sealActivationValue(r,rank):0;},sealActivationCost,sealLevel:id=>sealLevel(state(),id),sealValue:id=>{const r=SEAL_BY_ID.get(sealKey(id));return r?sealValue(r,state()):null;},sealStatsForRuntime,sealQuote,sealMigration:legacySealStats,p2Unit,applyMobileTroopProfile,mobileTroopSourceId,mobileTroopProfile,mobileTroopCount:()=>Object.keys(MOBILE_TROOPS.units).length,credit,days:()=>dayId(),floor,descriptor,describeSkill:descriptor,skillAudit:mobileSkillAudit,family,tiers:()=>NL_C_TIER4.length,seals:()=>SEALS.length,sealCatalog:()=>structuredClone(SEALS),panels:()=>[campaignPanel(),heroPanel(),mobileTroopPanel(),troopPanel(),towerPanel(),sealPanel()]});
})();
// === end NL-CONTENT-C-V1 ===
