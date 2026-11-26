// === NL-CONTENT-C-V1: sourced roster and project-simulated native P2 expansion ===
const NL_CONTENT_C=__NL_CONTENT_C_DATA__;
const NL_C_TIER4=__NL_CONTENT_C_TIER4__;
const NL_CONTENT_C_TOWER=__NL_TOWER_DATA__;
let nlContentCSettle,nlContentCHeroPanel;
(()=>{
'use strict';
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), nat=x=>Number.isSafeInteger(x)&&x>=0?x:0, clamp=(v,l,h)=>Math.min(h,Math.max(l,v));
const owned=id=>game.roster.includes(id)&&!!game.hero[id];
const MAPS=NL_CONTENT_C.maps, HERO=new Map(NL_CONTENT_C.heroes.map(h=>[h.id,h]));
const NPC=new Map(), MAP=new Map(MAPS.map(m=>[m.id,m])),MAP_INDEX=new Map(MAPS.map((m,i)=>[m.id,i]));
for(const m of MAPS)m.npcs.forEach((n,i)=>NPC.set(n.id,{map:m,n,index:i}));
if(MAPS.length!==249||NPC.size!==4903||Object.keys(NL_CONTENT_C.heroAliases).length!==364)throw Error('C source counts');
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
 const s=game.nlContentC;s.version=1;
 for(const k of ['cleared','mapsCleared','seals','recruits','sealLevels','npcRepeat'])if(!obj(s[k]))s[k]={};
 if(!Array.isArray(s.equippedSeals))s.equippedSeals=[];
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
function descriptor(label,role,boss){
 const s=String(label||'Chiến pháp'),l=s.toLocaleLowerCase('vi'),mult=boss?1.6:1.35;
 if(/hồi|trị|cứu|nhân đức|y thuật/.test(l)||role==='support')return {tag:s,pattern:'heal',kind:'magic',mult,healCount:2,bonusMorale:8};
 if(/hoành|hàng ngang|quét/.test(l))return {tag:s,pattern:'row',kind:'tactic',mult:.95};
 if(/xuyên|liên|đột phá/.test(l))return {tag:s,pattern:'column',kind:'tactic',mult:1.05};
 if(/ly gián|li gián|huyễn|loạn|trấn/.test(l))return {tag:s,pattern:'single',kind:'magic',mult,drainMorale:20};
 if(/hỏa|viêm|lửa/.test(l))return {tag:s,pattern:'row',kind:'magic',mult:1.05,apply:'burn',applyChance:.35};
 if(role==='archer')return {tag:s,pattern:'back',kind:'physical',mult};
 return {tag:s,pattern:'single',kind:role==='strategist'?'magic':role==='cavalry'?'tactic':'physical',mult};
}
function awakeningDescriptor(id){
 const record=NL_CONTENT_C.awakeningSkills?.[id],growth=game.heroDevelopment?.heroes?.[id]?.awakening;
 if(!record)return null;
 return growth?.gold?(record.stages?.GOLD||record.stages?.ORANGE||record.stages?.PURPLE):
     growth?.orange?(record.stages?.ORANGE||record.stages?.PURPLE):
     game.nlClassicAdvanced?.growth?.[id]?.awakened?record.stages?.PURPLE:null;
}
function readyNpc(id){
 const row=NPC.get(id),s=state();if(!row||!game.cleared.includes(row.map.gate)||s.cleared[id])return false;
 return row.index===0||!!s.cleared[row.map.npcs[row.index-1].id];
}
// PROJECT_SIMULATED: repeat battles and map completion rewards.
const REPEAT_LIMIT=3;
// Continuous campaign progression, independent of the 28-stage legacy unlock band.
function npcDifficulty(row){
 const i=MAP_INDEX.get(row.map.id)||0,within=row.index/Math.max(1,row.map.npcs.length-1);
 return clamp(1+Math.floor(i*89/Math.max(1,MAPS.length-1)+within*3),1,90);
}
function npcMerit(row,repeat=false){return repeat?4+Math.floor(npcDifficulty(row)/5):12+Math.floor(npcDifficulty(row)*1.5)+(row.n.boss?20:0);}
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
function mapBonus(m){return {silver:800+m.gate*180,grain:300+m.gate*50,prestige:50+m.gate*8,soul:20+m.gate*2};}
function openObjective(o,units,scale){
 if(battle||nlAState().orders<1||!game.cleared.includes(1)||!game.slots.some(id=>id&&game.hero[id]?.troops>=30))return false;
 // Existing cleared stage 1 provides native launch, grain, order, turn and animation authority.
 beginBattle(1,'campaign');
 if(!battle||battle.replay||battle.finished||battle.stage!==1||battle.mode!=='campaign')return false;
 battle.nlContentC=o;
 battle.e=units.map((raw,i)=>{
  const u=Array.isArray(raw)?{slot:raw[0],name:raw[1],label:raw[2],skill:raw[3],troops:raw[4],level:raw[5]}:raw;
  const role=u.role||family(u.label),slot=u.slot,boss=!!o.boss&&i===units.length-1;
  const e=p2Unit('e','e',boss?4:i,Math.min(28,Math.max(1,u.level||scale)));
  e.id='c-'+i;e.slot=slot;delete e.nlTroopV2;delete e.nlA1BossSkill;delete e.skillId;delete e.skillKey;delete e.npcUnitId;delete e.npcProfileId;e.name=u.name;e.troop=role;e.type=role==='spear'?'infantry':(['drum','dancer','support'].includes(role)?'support':role);
  e.icon=({archer:'🏹',cavalry:'🐎',spear:'🔱',strategist:'🪶',support:'📜',drum:'🥁',dancer:'💃'})[role]||'🛡️';
  e.skill=u.skill;e.nlCDescriptor=descriptor(u.skill,role,boss);
  const ratio=clamp(Math.sqrt(Math.max(1,u.troops)/Math.max(200,250+scale*90)),.75,1.45);
  const difficulty=clamp(1+Math.max(0,scale-28)*.025,1,2.8);
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
 return openObjective({kind:'npc',id,mapId:r.map.id,title:r.map.name+' · '+r.n.name+(repeat?' · Tái chiến':''),boss:r.n.boss,scale,repeat:!!repeat,xp:repeat?Math.floor((95+scale*12)*.4):95+scale*12},r.n.units,scale);
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
  if(o.repeat){if(!canReplayNpc(o.id))return {};s.npcRepeat[o.id]=npcRepeatCount(o.id)+1;awardMerit(o,npcMerit(r,true));return npcReward(r,true);}
  if(s.cleared[o.id])return {};
  s.cleared[o.id]=true;s.soul+=r.n.boss?15:5;
  const reward=npcReward(r);let merit=npcMerit(r);
  if(!s.mapsCleared[r.map.id]&&r.map.npcs.every(n=>s.cleared[n.id])){
   s.mapsCleared[r.map.id]=true;const bonus=mapBonus(r.map);s.soul+=bonus.soul;merit+=40+Math.floor(npcDifficulty(r)*2);
   for(const k of ['silver','grain','prestige'])reward[k]+=bonus[k];
  }
  awardMerit(o,merit);return reward;
 }
 if(o.kind==='tower'&&o.floor===floor()+1&&o.floor<=NL_CONTENT_C_TOWER.maxFloor){
  s.extraFloor++;const reward=towerRewards(o.floor);s.soul+=reward.soul;awardMerit(o,15+o.floor*2);return {silver:reward.silver,grain:reward.grain,prestige:reward.prestige};
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
// PROJECT_SIMULATED: seal upgrade progression.
const SEAL_MAX=5;
const sealLevel=(s,id)=>s.seals[id]?clamp(nat(s.sealLevels[id])||1,1,SEAL_MAX):0;
const sealValue=(r,s)=>Math.round(r[3]*(1+(sealLevel(s,r[0])-1)*.15));
const sealCost=level=>({silver:level*1200,soul:level*40});
const SEALS=[
 ['sword','Lợi Kiếm','atk',25,'stage',4],['iron','Thiết Giáp','def',22,'stage',8],['dragon','Long Ngâm','hp',160,'npc',20],
 ['reverse','Nghịch Sách','mdef',30,'npc',40],['precision','Tinh Chuẩn','catk',64,'tower',50],['stratagem','Quỷ Kế','matk',42,'tower',35],
 ['holy','Thánh Bồng','tdef',37,'stage',20],['boulder','Cự Thạch','matk',64,'prestige',5000],['control','Chưởng Khống','hp',140,'heroes',228],
 ['command','Ngự Binh','hp',120,'heroes',180],['strength','Lực Lượng','atk',35,'territory',1],['turtle','Quy Giáp','def',28,'tower',20],
 ['steel','Kiên Giáp','def',13,'prestige',2000],['hoof','Thiết Đề','catk',25,'stage',12],['storm','Lôi Vũ','matk',25,'npc',60],
 ['flame','Liệt Diễm','mdef',13,'seals',5],['charge','Liệt Mã','catk',42,'tower',60],['diamond','Kim Cang','def',37,'npc',100]
];
function sealReady(r){
 const s=state(),v={stage:game.cleared.length,npc:Object.keys(s.cleared).length,tower:floor(),prestige:game.prestige,heroes:game.roster.length,territory:Object.keys(game.nlClassicAdvanced?.territories||{}).length,seals:Object.keys(s.seals).length};
 return v[r[4]]>=r[5];
}
function unlockSeal(id){const s=state(),r=SEALS.find(x=>x[0]===id);if(battle||!r||s.seals[id]||!sealReady(r))return false;s.seals[id]=true;save();render();return true;}
function upgradeSeal(id){
 const s=state(),r=SEALS.find(x=>x[0]===id),level=sealLevel(s,id);
 if(battle||!r||!level||level>=SEAL_MAX)return false;
 const cost=sealCost(level);if(s.soul<cost.soul||!payment({silver:cost.silver}))return false;
 s.soul-=cost.soul;s.sealLevels[id]=level+1;save();render();return true;
}
function equipSeal(id){const s=state();if(battle||!s.seals[id]||!SEALS.some(r=>r[0]===id))return false;
 if(s.equippedSeals.includes(id))s.equippedSeals=s.equippedSeals.filter(x=>x!==id);
 else {if(s.equippedSeals.length>=3)return false;s.equippedSeals.push(id);}save();render();return true;}
const priorUnit=p2Unit;
p2Unit=function(id,team,slot,stage){
 const u=priorUnit(id,team,slot,stage);if(team!=='p'||!u||battle?.mode==='cltq')return u;
 const awake=awakeningDescriptor(id);if(awake?.descriptor)u.skill=awake.descriptor.tag;
 const s=state(),used=new Set();
 for(const sid of s.equippedSeals.slice(0,3)){const r=SEALS.find(x=>x[0]===sid);if(!r||!s.seals[sid]||used.has(sid))continue;used.add(sid);
  if(Number.isFinite(u[r[2]])){const bonus=sealValue(r,s);u[r[2]]+=bonus;if(r[2]==='hp')u.maxHp+=bonus;}}
 if(tier4.has(nlwB4Active(id)?.id))for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]=Math.round(u[k]*1.08);
 return u;
};
let mapPage=0,npcPage=0,heroPage=0,unitPage=0,sealPage=0,mapId=MAPS[0].id,heroId='',search='',heroSearch='';
const btn=(a,id,label,disabled=false)=>'<button class="gold-button" data-nlc-action="'+a+'" data-nlc-id="'+esc(id)+'" '+(disabled?'disabled':'')+'>'+esc(label)+'</button>';
const row=(title,desc,action='')=>'<div class="nlc-row"><div><b>'+esc(title)+'</b><small>'+esc(desc)+'</small></div><div class="nlc-actions">'+action+'</div></div>';
const pane=(name,title,body)=>'<section class="panel mini-box nlc-pane" data-nlc-panel="'+name+'"><h3>'+title+'</h3>'+body+'<p class="tiny">Dữ liệu Wiki tham chiếu; chiến đấu và cân bằng PROJECT_SIMULATED.</p></section>';
const pages=(a,n,cb,action)=>a.slice(n*4,n*4+4).map(cb).join('')+'<div class="nlc-nav">'+btn(action,'prev','Trước',n===0)+' <span>'+(n+1)+'/'+Math.max(1,Math.ceil(a.length/4))+'</span> '+btn(action,'next','Sau',n>=Math.ceil(a.length/4)-1)+'</div>';
function nextNpc(){
 for(const m of MAPS){if(!game.cleared.includes(m.gate))continue;
   const n=m.npcs.find(n=>readyNpc(n.id));if(n)return {map:m,n};
 }return null;
}
function jumpNextNpc(){if(battle)return false;const x=nextNpc();if(!x)return false;
 search='';mapId=x.map.id;mapPage=Math.floor(MAP_INDEX.get(mapId)/20);npcPage=Math.floor(NPC.get(x.n.id).index/4);save();render();return true;
}
function campaignPanel(){const s=state(),m=MAP.get(mapId)||MAPS[0],list=MAPS.filter(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));
 const options=list.slice(mapPage*20,mapPage*20+20).map(x=>'<option value="'+esc(x.id)+'" '+(x.id===m.id?'selected':'')+'>'+esc(x.name)+' · '+x.npcs.length+' NPC · ải '+x.gate+'</option>').join('');
 if(!list.length)return pane('campaign','Thiên Hạ Wiki','<input data-nlc-search placeholder="Tìm phó bản" value="'+esc(search)+'"><p>Không tìm thấy phó bản.</p>');
 const progress=m.npcs.filter(n=>s.cleared[n.id]).length,bonus=mapBonus(m),next=nextNpc();
 return pane('campaign','Thiên Hạ Wiki · 249 phó bản / 4.903 NPC','<p>Đã vượt '+Object.keys(s.cleared).length+' NPC · '+Object.keys(s.mapsCleared).length+' bản đồ · '+s.soul+' Tướng Hồn</p>'+(next?row('Mục tiêu tiếp theo',next.map.name+' · '+next.n.name,btn('next-objective','','Đi tới',!!battle)):'<p>Không còn NPC đã mở mà chưa thắng. Tiếp tục ải chính để mở bản đồ.</p>')+'<input data-nlc-search placeholder="Tìm phó bản" value="'+esc(search)+'"><select data-nlc-map>'+options+'</select><div class="nlc-nav">'+btn('map-page','prev','Bản đồ trước',mapPage===0)+btn('map-page','next','Bản đồ sau',mapPage>=Math.ceil(list.length/20)-1)+'</div><b>'+esc(m.name)+' · '+progress+'/'+m.npcs.length+'</b><p>Thưởng hoàn thành lần đầu: '+fmt(bonus.silver)+' Bạc · '+fmt(bonus.soul)+' Tướng Hồn</p>'+pages(m.npcs,npcPage,n=>row(n.name,(n.boss?'Boss · ':'')+n.units.length+' đội · Độ khó '+npcDifficulty(NPC.get(n.id))+' · '+fmt(npcReward(NPC.get(n.id),!!s.cleared[n.id]).silver)+' Bạc · '+npcMerit(NPC.get(n.id),!!s.cleared[n.id])+' Chiến công · '+(n.sourceFormationIncomplete?'ngoại suy đội hình':'ô đội hình nguồn'),s.cleared[n.id]?btn('npc-repeat',n.id,'Tái chiến '+npcRepeatCount(n.id)+'/'+REPEAT_LIMIT,!!battle||!canReplayNpc(n.id)):btn('npc',n.id,'Xuất chiến',!readyNpc(n.id)||!!battle)),'npc-page'));
}
function heroPanel(){const s=state(),query=heroSearch.trim().toLocaleLowerCase('vi'),rows=[...HERO.values()].filter(h=>[h.name,h.faction,h.skill].some(v=>String(v||'').toLocaleLowerCase('vi').includes(query)));heroPage=Math.max(0,Math.min(heroPage,Math.ceil(rows.length/4)-1));return pane('heroes','Danh tướng Wiki bổ sung · '+HERO.size,'<p>364 hồ sơ Wiki được ánh xạ · '+NL_CONTENT_C.counts.runtimeHeroes+' danh tính runtime, gồm tướng cũ.</p><input data-nlc-hero-search placeholder="Tìm tên, phe hoặc kỹ năng" value="'+esc(heroSearch)+'"><p>Kết quả: '+rows.length+'</p>'+pages(rows,heroPage,h=>row(h.name,(h.faction||'')+' · '+h.skill+' · '+(h.towerGate?'Tháp '+h.towerGate+' · '+h.soulCost+' Tướng Hồn':'ải '+h.gate)+' · '+h.silver+' Bạc',btn('recruit',h.id,owned(h.id)?'Đã có':'Chiêu mộ',owned(h.id)||!!battle||!heroReady(h)||game.silver<h.silver)),'hero-page'));}
function troopPanel(){if(!owned(heroId))heroId=game.roster[0]||'';return pane('troops','Quân cấp 4 · '+tier4.size,'<p>40 quân WEB 2011 · mở sau 10 chuyển sinh, Tháp 40, Doanh Trại 4 · 300 Tướng Hồn + 5.000 Bạc.</p><select data-nlc-hero>'+game.roster.map(id=>'<option value="'+esc(id)+'" '+(id===heroId?'selected':'')+'>'+esc(HEROES[id]?.name||id)+'</option>').join('')+'</select>'+pages(NL_C_TIER4,unitPage,t=>row(t.name,t.sourceName+' · '+t.familyName,btn('tier4',t.id,nlwB4Active(heroId)?.id===t.id?'Đang dùng':'Chuyển quân',!!battle||!owned(heroId)||floor()<40||nat(game.nlClassicWorldA4?.rebirth?.[heroId])<10||game.buildings.barracks<4||state().soul<300||game.silver<5000)),'unit-page'));}
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
function sealPanel(){const s=state();return pane('seals','Quân ấn · '+SEALS.length+' mẫu','<p>Đã mở '+Object.keys(s.seals).length+' · trang bị '+s.equippedSeals.length+'/3 · chỉ số cộng cho đội.</p>'+pages(SEALS,sealPage,r=>row(r[1],r[2]+' +'+(s.seals[r[0]]?sealValue(r,s):r[3])+' · '+(s.seals[r[0]]?'Cấp '+sealLevel(s,r[0])+'/'+SEAL_MAX+' · ':'')+({stage:'Ải',npc:'NPC Wiki',tower:'Tầng',prestige:'Uy danh',heroes:'Võ tướng',territory:'Lãnh địa',seals:'Quân ấn'})[r[4]]+' '+r[5],s.seals[r[0]]?btn('equip-seal',r[0],s.equippedSeals.includes(r[0])?'Tháo':'Trang bị',!!battle||(!s.equippedSeals.includes(r[0])&&s.equippedSeals.length>=3))+(sealLevel(s,r[0])<SEAL_MAX?btn('upgrade-seal',r[0],'Cường hóa '+sealCost(sealLevel(s,r[0])).silver+' Bạc / '+sealCost(sealLevel(s,r[0])).soul+' Hồn',!!battle||s.soul<sealCost(sealLevel(s,r[0])).soul||game.silver<sealCost(sealLevel(s,r[0])).silver):''):btn('unlock-seal',r[0],'Nhận',!!battle||!sealReady(r))),'seal-page'));}
nlContentCHeroPanel=heroPanel;
const c0=renderCampaign,h0=renderHeroes,b0=renderBarracks,t0=renderTower,f0=renderFormation;
renderCampaign=function(){return c0()+campaignPanel();};renderHeroes=function(){return h0()+heroPanel();};renderBarracks=function(){return b0()+troopPanel();};renderTower=function(){return t0()+towerPanel();};renderFormation=function(){return f0()+sealPanel();};
document.addEventListener('change',e=>{if(e.target.matches?.('[data-nlc-map]')&&MAP.has(e.target.value)){mapId=e.target.value;npcPage=0;render();}else if(e.target.matches?.('[data-nlc-hero-search]')){heroSearch=e.target.value;heroPage=0;render();}else if(e.target.matches?.('[data-nlc-hero]')){heroId=e.target.value;render();}else if(e.target.matches?.('[data-nlc-search]')){search=e.target.value;mapPage=0;const match=MAPS.find(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(match){mapId=match.id;npcPage=0;}render();}});
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nlc-action]');if(!b||b.disabled)return;const a=b.dataset.nlcAction,id=b.dataset.nlcId,delta=id==='next'?1:-1;
 if(a==='next-objective'){jumpNextNpc();return;}
 if(a==='map-page'){mapPage=Math.max(0,mapPage+delta);const list=MAPS.filter(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(list[mapPage*20]){mapId=list[mapPage*20].id;npcPage=0;}render();return;}
 if(a==='npc-page')npcPage=Math.max(0,npcPage+delta);else if(a==='hero-page')heroPage=Math.max(0,heroPage+delta);else if(a==='unit-page')unitPage=Math.max(0,unitPage+delta);else if(a==='seal-page')sealPage=Math.max(0,sealPage+delta);else {const fn={npc:startNpc,'npc-repeat':id=>startNpc(id,true),recruit,tier4:tid=>choose4(heroId,tid),tower:startTower,'unlock-seal':unlockSeal,'equip-seal':equipSeal,'upgrade-seal':upgradeSeal}[a];if(fn&&!fn(id))toast('Chưa đủ điều kiện hoặc tài nguyên.');return;}render();});
const style=document.createElement('style');style.textContent='.nlc-row{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #665e43}.nlc-row b,.nlc-row small{display:block}.nlc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;max-width:57%}.nlc-actions button{white-space:normal!important;text-align:center}.nlc-row small,.nlc-pane p{font-size:10px}.nlc-row button,.nlc-nav button{font-size:11px;padding:5px 8px;white-space:nowrap}.nlc-nav{display:flex;align-items:center;gap:6px;margin:4px 0}.nlc-pane input,.nlc-pane select{max-width:100%;font-size:12px}.nlc-pane h3{margin:4px 0}.nlc-tower-plan{margin:8px 0;padding:9px 11px;border:1px solid #786a47;border-radius:6px;background:linear-gradient(135deg,#29362f,#172522)}.nlc-tower-plan>b{display:block;color:#f1d797}.nlc-tower-plan>small{display:block;margin-top:3px;color:#c5b68e;font-size:10px}.nlc-tower-plan p{line-height:1.55;margin:6px 0;color:#c4cdc0}.nlc-tower-lineup{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:3px 10px;color:#e0d4b4;font-size:10px}.nlc-tower-reward{padding:7px 9px;background:#172c27;border-left:3px solid #c3a262;color:#e5d4a9;line-height:1.6}@media(max-width:560px){.nlc-tower-lineup{grid-template-columns:1fr}}';document.head.appendChild(style);
if(window.__P2_ENABLE_QA__)window.__NL_CONTENT_C_QA__=Object.freeze({counts:NL_CONTENT_C.counts,state:()=>structuredClone(state()),map:id=>MAP.get(id),npc:id=>NPC.get(id)?.n,readyNpc,startNpc,nextNpc:()=>structuredClone(nextNpc()),awakeningDescriptor:id=>structuredClone(awakeningDescriptor(id)),canReplayNpc,npcRepeatCount,npcDifficulty:id=>NPC.has(id)?npcDifficulty(NPC.get(id)):null,npcMerit:id=>NPC.has(id)?npcMerit(NPC.get(id)):null,npcReward:id=>{const r=NPC.get(id);return r?npcReward(r,true):null;},mapBonus:id=>MAP.has(id)?mapBonus(MAP.get(id)):null,startTower,towerPlan,towerRewards,towerTarget:p2Target,recruit,choose4,unlockSeal,equipSeal,upgradeSeal,sealLevel:id=>sealLevel(state(),id),sealValue:id=>{const r=SEALS.find(x=>x[0]===id);return r&&sealLevel(state(),id)?sealValue(r,state()):0;},floor,descriptor,family,tiers:()=>NL_C_TIER4.length,seals:()=>SEALS.length,panels:()=>[campaignPanel(),heroPanel(),troopPanel(),towerPanel(),sealPanel()]});
})();
// === end NL-CONTENT-C-V1 ===
