// === NL-HERO-SYSTEMS-V1 ===
// Additive hero development for the Mobile-first offline runtime. Keep Save v5 additive.
let nlCampaignTrainBatch;
(()=>{'use strict';
const NL_HS=__NL_HERO_SYSTEM_CONFIG__, NL_HS_ART_PACK=__NL_HERO_ART__;
const NL_HS_ART=NL_HS_ART_PACK.pool?Object.fromEntries(Object.entries(NL_HS_ART_PACK.refs).map(([id,m])=>[id,Object.fromEntries(Object.entries(m).map(([kind,i])=>[kind,NL_HS_ART_PACK.pool[i]]))])):NL_HS_ART_PACK;
if(NL_HS.schemaVersion!==1||NL_HS.systems?.length!==12||Object.keys(NL_HS.materialCatalog||{}).length!==10)
  throw new Error('NL-HERO-SYSTEMS: source database drift');
if(!document.getElementById('nlh-system-style')){
  const style=document.createElement('style');style.id='nlh-system-style';style.textContent=__NL_HERO_SYSTEM_STYLE__;document.head.appendChild(style);
}
const SYS=Object.fromEntries(NL_HS.systems.map(x=>[x.id,x]));
// Original offline endgame progression; formulas and unlocks are SIMULATED.
const ANCIENT_MAX=5,SKILL_MAX=10;
const ILLUSIONS={
 assault:{name:'Phá Quân',attackPct:.09,tacticAttackPct:.06,defensePct:-.04,hpPct:-.03,magicAttackPct:0,speedFlat:0},
 guardian:{name:'Hộ Thành',attackPct:-.04,tacticAttackPct:0,defensePct:.10,hpPct:.08,magicAttackPct:0,speedFlat:0},
 strategist:{name:'Thiên Cơ',attackPct:-.04,tacticAttackPct:0,defensePct:-.02,hpPct:0,magicAttackPct:.16,speedFlat:4}
};
const MATERIAL_SHOP={
 commandManual:[6,400,15],weaponCore:[8,550,20],inheritanceSeal:[12,650,25],orangeEssence:[16,1800,70],
 quynhTuong:[22,2200,90],xichQua:[22,2200,90],hoangTrungLy:[22,2200,90],
 temperingStone:[24,500,25],destinyJade:[24,900,40],blank:[24,800,30]
};
const PICKABLE=['hero','training','troops','commander','specialWeapon','inheritance','destiny','equipment','formation','rewards','recruit','awakening'];
function nlhsState(){
  if(!game.heroDevelopment||typeof game.heroDevelopment!=='object'||Array.isArray(game.heroDevelopment))
    game.heroDevelopment={schemaVersion:1,selectedHero:game.roster?.[0]||'liu',selectedSystem:'hero',heroes:{},materials:{},receipts:[],source:'PROJECT_SIMULATED_HERO_SYSTEMS_V1'};
  const s=game.heroDevelopment;s.schemaVersion=1;
  if(!s.heroes||typeof s.heroes!=='object'||Array.isArray(s.heroes))s.heroes={};
  if(!s.materials||typeof s.materials!=='object'||Array.isArray(s.materials))s.materials={};
  if(!Array.isArray(s.receipts))s.receipts=[];
  if(!s.refundLedger||typeof s.refundLedger!=='object'||Array.isArray(s.refundLedger))s.refundLedger={};
  for(const id of game.roster||[])if(!Array.isArray(s.refundLedger[id]))s.refundLedger[id]=s.receipts.filter(r=>r?.heroId===id&&r.currency&&r.materials).map(r=>({...r}));
  if(!s.firstClearClaims||typeof s.firstClearClaims!=='object'||Array.isArray(s.firstClearClaims))s.firstClearClaims={};
  for(const r of s.receipts)if(r?.system==='rewards'&&Number.isInteger(r.stage))s.firstClearClaims[r.stage]=true;
  if(!s.materialShop||typeof s.materialShop!=='object'||Array.isArray(s.materialShop)||s.materialShop.day!==dayId())s.materialShop={day:dayId(),counts:{}};
  if(!s.materialShop.counts||typeof s.materialShop.counts!=='object'||Array.isArray(s.materialShop.counts))s.materialShop.counts={};
  if(!s.artModes||typeof s.artModes!=='object'||Array.isArray(s.artModes))s.artModes={};
  for(const id of Object.keys(NL_HS.materialCatalog))if(!Number.isSafeInteger(s.materials[id])||s.materials[id]<0)s.materials[id]=0;
  for(const id of game.roster||[])nlhsHero(id);
  if(!game.roster?.includes(s.selectedHero))s.selectedHero=game.roster?.[0]||'liu';
  if(!PICKABLE.includes(s.selectedSystem))s.selectedSystem='hero';
  return s;
}
function nlhsHero(id){
  const s=game.heroDevelopment;
  if(!s.heroes[id]||typeof s.heroes[id]!=='object')s.heroes[id]={commanderLevel:0,weaponLevel:0,inheritanceLevel:0,destinyId:null,destinyLevel:0,awakening:{orange:false,gold:false}};
  const h=s.heroes[id];for(const k of ['commanderLevel','weaponLevel','inheritanceLevel','destinyLevel'])if(!Number.isSafeInteger(h[k])||h[k]<0)h[k]=0;
  if(!h.awakening||typeof h.awakening!=='object')h.awakening={orange:false,gold:false};
  h.skillLevel=Number.isSafeInteger(h.skillLevel)?Math.min(SKILL_MAX,Math.max(1,h.skillLevel)):1;
  h.awakening.orange=!!h.awakening.orange;h.awakening.gold=!!h.awakening.gold;
  h.ancientLevel=Number.isSafeInteger(h.ancientLevel)&&h.awakening.gold?Math.max(0,Math.min(ANCIENT_MAX,h.ancientLevel)):0;
  if(!Array.isArray(h.illusionUnlocked))h.illusionUnlocked=[];
  h.illusionUnlocked=h.ancientLevel?[...new Set(h.illusionUnlocked.filter(k=>Object.hasOwn(ILLUSIONS,k)))]:[];
  if(!h.illusionUnlocked.includes(h.illusionMode))h.illusionMode=null;
  if(!['war','guard','tactic',null].includes(h.destinyId))h.destinyId=null;
  return h;
}
nlhsState();save();
function hsEsc(x){return typeof esc==='function'?esc(String(x??'')):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function nlhHero(id){return HEROES[id]||NL_HERO207_BY_ID?.get(id)||{name:id,role:'Võ tướng',type:'unknown',faction:'Unknown',skill:'Chưa có mô tả kỹ năng'};}
function nlhArt(id){return NL_HS_ART[id]||NL_HS_ART.default||{};}
function nlhSetArtMode(heroId,mode){const art=nlhArt(heroId);if(!['portrait','splash','character'].includes(mode)||!art[mode])return false;const state=nlhsState();state.artModes[heroId]=mode;save();render();return true;}
function nlhStage(){return Array.isArray(game.cleared)?game.cleared.length:0;}
function nlhIsOpen(id){return nlhStage()>=(SYS[id]?.unlock?.campaignClears||0);}
function nlhOwned(id){return game.roster?.includes(id)&&!!game.hero?.[id];}
function nlhHeroStats(id){
 const h=nlhHero(id),d=game.hero?.[id]||{level:1,xp:0,troops:0};
 const u=nlhOwned(id)?p2Unit(id,'p',Math.max(0,(game.slots||[]).indexOf(id)),Math.max(1,Math.min(28,nlhStage()+1))):null;
 const value=k=>Number.isFinite(u?.[k])?Math.max(0,u[k]):0;
 const combat={atk:value('atk'),catk:value('catk'),matk:value('matk'),def:value('def'),tdef:value('tdef'),mdef:value('mdef'),maxHp:value('maxHp'),speed:value('speed')};
 const power=u?Math.round((combat.atk+combat.catk+combat.matk)*.8+(combat.def+combat.tdef+combat.mdef)*.65+combat.maxHp*.4+combat.speed*4):0;
 return {level:d.level||1,xp:d.xp||0,troops:d.troops||0,atk:u?.nlMobileHero?.war??h.atk??0,lead:u?.nlMobileHero?.leadership??h.lead??0,def:h.def||0,int:u?.nlMobileHero?.intellect??h.int??0,speed:h.agi||h.speed||0,power,combat};
}
function nlhCurrentTroop(id){
 const mobileId=game.nlContentC?.mobileTroopAssigned?.[id],mobile=typeof NL_CONTENT_C!=='undefined'&&NL_CONTENT_C.mobileTroops?.units?.[mobileId];
 if(mobile)return {name:mobile.name,tier:mobile.tier,description:mobile.desc||mobile.typeName,kind:'Binh chủng Mobile'};
 try{const classic=typeof nlwB4Active==='function'?nlwB4Active(id):null;if(classic)return {name:classic.name,tier:classic.tier,description:classic.ability||classic.role,kind:'Legacy WEB troop profile'};}catch(_e){}
  try{const branch=typeof nlr03BranchFor==='function'?nlr03BranchFor(id):null;if(branch)return {name:branch.name,tier:branch.tier||1,description:branch.description||branch.id,kind:'Tiến hóa dự án'};}catch(_e){}
  const h=nlhHero(id),mode=game.troopModes?.[id];return {name:mode?({drum:'Cổ Vũ Sĩ',dancer:'Vũ Nữ'}[mode]||mode):(h.troopName||h.type||'Bộ binh'),tier:1,description:h.role||'Binh chủng cơ sở',kind:'Project troop profile'};
}
function nlhLevel(id,heroId){const s=nlhsState(),h=nlhsHero(heroId),d=game.hero?.[heroId]||{},gear=game.gear?.[heroId]||{};
 if(id==='hero'||id==='training')return d.level||1;if(id==='troops')return nlhCurrentTroop(heroId).tier||1;
 if(id==='commander')return h.commanderLevel;if(id==='specialWeapon')return h.weaponLevel;if(id==='inheritance')return h.inheritanceLevel;if(id==='destiny')return h.destinyLevel;
 if(id==='equipment')return Object.values(gear).filter(Boolean).length;
 if(id==='formation')return Math.max(1,Math.min(12,game.buildings?.academy||1));if(id==='rewards')return nlhStage();if(id==='recruit')return game.roster?.length||0;if(id==='awakening')return Number(h.awakening.orange)+Number(h.awakening.gold);return 0;
}
function nlhFmt(n){return typeof fmt==='function'?fmt(n):Number(n||0).toLocaleString('vi-VN');}
function nlhMaterials(rows){return '<div class="nlh-materials">'+Object.entries(rows||{}).map(([id,n])=>'<span class="nlh-material">'+hsEsc(NL_HS.materialCatalog[id]?.name||id)+'<b>×'+nlhFmt(n)+'</b></span>').join('')+'</div>';}
function nlhNeedText(id){const need=SYS[id]?.unlock?.campaignClears||0;return nlhStage()>=need?'Đã mở · ải '+nlhFmt(need):'Mở sau '+nlhFmt(need)+' ải';}
function nlhGateText(id){const def=SYS[id],need=def?.unlock?.campaignClears||0;return nlhStage()>=need?'Đã mở ở mốc chiến dịch '+need:'Còn '+Math.max(0,need-nlhStage())+' ải để mở';}
function nlhCurrency(level,id){
 if(id==='commander')return {silver:1000*level,merit:60*level};
 if(id==='specialWeapon')return {silver:1300*level,merit:45*level};
 if(id==='inheritance')return {silver:1500*level,merit:50*level};
 if(id==='destiny')return {silver:3000*level,merit:50*level};
 if(id==='awakening-orange')return {silver:6000,merit:250};
 if(id==='awakening-gold')return {silver:12000,merit:500};
 return {};
}
function nlhMaterialCost(level,id){
 if(id==='commander')return {commandManual:level};if(id==='specialWeapon')return {weaponCore:level};
 if(id==='inheritance')return {inheritanceSeal:level};if(id==='destiny')return {temperingStone:2*level,destinyJade:level,blank:1};
 if(id==='awakening-orange')return {orangeEssence:1};
 if(id==='awakening-gold')return {quynhTuong:1,xichQua:1,hoangTrungLy:1};return {};
}
function nlhCostText(currency,materials){const names={silver:'Bạc',iron:'Sắt',gems:'Ngọc',merit:'Chiến công'};const a=Object.entries(currency||{}).map(([k,v])=>nlhFmt(v)+' '+(names[k]||k));const b=Object.entries(materials||{}).map(([k,v])=>nlhFmt(v)+' '+(NL_HS.materialCatalog[k]?.name||k));return [...a,...b].join(' · ')||'Miễn phí';}
function nlhCanPay(currency,materials){const a=nlhsState();for(const [k,v] of Object.entries(currency||{})){const current=k==='merit'?(game.nlClassicA?.merit||0):Number(game[k]||0);if(!Number.isSafeInteger(current)||!Number.isSafeInteger(v)||v<0||current<v)return false;}for(const [k,v] of Object.entries(materials||{}))if(!Object.hasOwn(NL_HS.materialCatalog,k)||!Number.isSafeInteger(v)||v<0||(a.materials[k]||0)<v)return false;return true;}
function nlhPay(currency,materials){if(!nlhCanPay(currency,materials))return false;for(const [k,v] of Object.entries(currency||{})){if(k==='merit'){game.nlClassicA.merit-=v;game.nlClassicA.meritSpent=(game.nlClassicA.meritSpent||0)+v;}else game[k]-=v;}for(const [k,v] of Object.entries(materials||{}))nlhsState().materials[k]-=v;return true;}
function nlhQuotePanel(id,heroId,level,max,extra=''){
 const next=level+1,open=nlhIsOpen(id)&&nlhOwned(heroId)&&!battle&&next<=max,cost=nlhCurrency(next,id),mats=nlhMaterialCost(next,id),afford=nlhCanPay(cost,mats);
 return '<div class="nlh-feature-panel"><div class="nlh-feature-title"><span class="nlh-emblem">'+nlhGlyph(id)+'</span><div><b>'+hsEsc(SYS[id].label)+' · Cấp '+level+'/'+max+'</b><div class="nlh-copy">'+hsEsc(extra||'Tăng trưởng dự án · SIMULATED')+'</div></div></div><div class="nlh-action-row"><span class="nlh-quote">'+hsEsc(level>=max?'Đã đạt cấp tối đa':!nlhIsOpen(id)?nlhGateText(id):nlhCostText(cost,mats))+'</span><button class="nlh-button" data-nlh-action="upgrade" data-nlh-system="'+id+'" '+(!open||!afford?'disabled':'')+'>'+(level>=max?'Tối đa':!nlhIsOpen(id)?'Chưa mở':!afford?'Thiếu nguyên liệu':'Nâng cấp lên '+next)+'</button></div>'+nlhMaterials(mats)+'</div>';
}
function nlhGlyph(id){const paths={hero:'<path d="M12 3l7 4v5c0 5-3 8-7 10-4-2-7-5-7-10V7z"/><path d="M9 12l2 2 4-5"/>',training:'<path d="M4 19h16M7 16l2-5 3 2 4-7 2 2"/>',troops:'<path d="M12 3v18M5 7h14M6 7l-2 8h8L10 7M14 7l-2 8h8l-2-8"/>',commander:'<path d="M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"/>',specialWeapon:'<path d="M4 20L16 8m-3-3 4-4 4 4-4 4M3 17l4 4"/>',inheritance:'<path d="M12 3l8 4v5c0 5-4 8-8 9-4-1-8-4-8-9V7zM8 12h8M12 8v8"/>',destiny:'<path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z"/>',equipment:'<path d="M8 4h8l2 4-2 12H8L6 8zM8 8h8M9 13h6"/>',formation:'<path d="M4 4h5v5H4zM15 4h5v5h-5zM9.5 15h5v5h-5zM6.5 9v3h11V9M12 12v3"/>',rewards:'<path d="M6 4h12v14H6zM9 8h6M9 11h6M9 14h3M4 21h16"/>',recruit:'<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0M19 6v6m-3-3h6"/>',awakening:'<path d="M12 2v5m0 10v5m10-10h-5M7 12H2m17.1-7.1-3.5 3.5m-7.2 7.2-3.5 3.5m14.2 0-3.5-3.5M7.6 7.6 4.1 4.1"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true"><g>'+ (paths[id]||paths.hero)+'</g></svg>';}
function nlhSelectHero(id){if(!nlhOwned(id))return;const s=nlhsState();s.selectedHero=id;save();render();}
function nlhSelectSystem(id){if(!PICKABLE.includes(id))return;const s=nlhsState();s.selectedSystem=id;save();render();}
function nlhUpgrade(id,heroId,sub=''){
 if(battle||!nlhOwned(heroId)||(id==='specialWeapon'&&nlhSourceWeapon(heroId))||(id==='destiny'&&nlhSourceOptions(heroId).length)||(id==='awakening'&&typeof nlMobileHeroApi!=='undefined'&&nlMobileHeroApi?.quality(heroId)))return false;const state=nlhsState(),h=nlhsHero(heroId),next=0;let current=0,max=0,key=id;
 if(id==='commander'){current=h.commanderLevel;max=SYS[id].maxLevel;}
 else if(id==='specialWeapon'){current=h.weaponLevel;max=SYS[id].maxLevel;}
 else if(id==='inheritance'){current=h.inheritanceLevel;max=nlhSourceSeal(heroId)?.skillDescs.length||SYS[id].maxLevel;}
 else if(id==='destiny'){current=h.destinyLevel;max=SYS[id].maxLevel;if(!h.destinyId){toast('Hãy chọn một Mệnh Cách trước.');return false;}}
 else if(id==='awakening'&&sub==='orange'){current=Number(h.awakening.orange);max=1;key='awakening-orange';if(nlhStage()<16||(game.hero[heroId]?.level||1)<20){toast('Mở lộ trình SIMULATED sau ải 16 và tướng cấp 20.');return false;}}
 else if(id==='awakening'&&sub==='gold'){current=Number(h.awakening.gold);max=1;key='awakening-gold';if(!h.awakening.orange||nlhStage()<22||(game.hero[heroId]?.level||1)<30){toast('Cần Giác Ngộ Cam, vượt ải 22 và tướng cấp 30.');return false;}}
 else return false;
 if(current>=max||!nlhIsOpen(id))return false;
 const level=current+1,cost=nlhCurrency(level,key),materials=nlhMaterialCost(level,key);
 if(!nlhPay(cost,materials)){toast('Chưa đủ Bạc, Chiến công hoặc nguyên liệu.');return false;}
 if(id==='commander')h.commanderLevel=level;else if(id==='specialWeapon')h.weaponLevel=level;else if(id==='inheritance')h.inheritanceLevel=level;
 else if(id==='destiny')h.destinyLevel=level;else if(sub==='orange')h.awakening.orange=true;else h.awakening.gold=true;
 nlhRecordDevelopmentReceipt(state,{id:'hero-system:'+key+':'+heroId+':'+level+':'+Date.now(),system:key,heroId,level,currency:cost,materials,at:Date.now(),classification:'SIMULATED'});
 log('Phát triển '+nlhHero(heroId).name+' · '+SYS[id].label+' cấp '+level+' (SIMULATED).');save();render();toast(nlhHero(heroId).name+' · '+SYS[id].label+' cấp '+level);return true;
}
function nlhPickDestiny(id,heroId){if(nlhSourceOptions(heroId).length||battle||!['war','guard','tactic'].includes(id)||!nlhIsOpen('destiny')||!nlhOwned(heroId))return false;const h=nlhsHero(heroId);h.destinyId=id;save();render();return true;}
function nlhHeroCap(id){return typeof nlClassicGrowthPolicy!=='undefined'?nlClassicGrowthPolicy.cap(id):40;}
function nlhTrainQuote(id){
 const h=game.hero[id],advanced=!!game.nlClassicAdvanced?.growth?.[id]?.advanced;
 const bonus=typeof nlClassicGrowthPolicy!=='undefined'?nlClassicGrowthPolicy.trainingBonus():0;
 const xp=Math.floor((advanced?900:95+(game.buildings?.academy||1)*12)*(1+bonus));
 return {cap:nlhHeroCap(id),xp,cost:advanced?{silver:900,merit:60}:{silver:700},level:h?.level||1};
}
function nlhTrainBatch(id,requested=1){
 if(battle||!nlhOwned(id)||![1,5,10].includes(requested))return false;
 const h=game.hero[id],q=nlhTrainQuote(id);if(h.level>=q.cap)return false;
 let n=0;
 while(n<requested&&h.level<q.cap&&nlhCanPay(q.cost,{})){
   if(!nlhPay(q.cost,{}))break;
   addExp(id,q.xp);countTask('train');n++;
 }
 if(!n)return false;
 const total=Object.fromEntries(Object.entries(q.cost).map(([k,v])=>[k,v*n]));
 return nlhEndgameReceipt('training-batch',id,n,total,{});
}
nlCampaignTrainBatch=nlhTrainBatch;
function nlhSkillQuote(level){return {silver:250*level,merit:10*level};}
function nlhSkillUpgrade(id){
 if(battle||!nlhOwned(id)||(typeof nlMobileHeroApi!=='undefined'&&nlMobileHeroApi?.skill(id)))return false;
 const h=nlhsHero(id),next=h.skillLevel+1,cost=nlhSkillQuote(next);
 if(next>SKILL_MAX||nlhStage()<3||(game.hero[id]?.level||0)<next*4||!nlhPay(cost,{}))return false;
 h.skillLevel=next;return nlhEndgameReceipt('skill',id,next,cost,{});
}
function nlhSkillDescriptor(id,source){
 if(!source||typeof source!=='object')return source;
 const rank=nlhsHero(id).skillLevel-1,skill={...source};
 if(rank<=0||skill.nlMobileHeroSkill)return skill;
 if(Number.isFinite(skill.mult))skill.mult=Math.round(skill.mult*(1+rank*.035)*10000)/10000;
 if(Number.isFinite(skill.drainMorale))skill.drainMorale=Math.min(50,skill.drainMorale+rank);
 if(Number.isFinite(skill.bonusMorale))skill.bonusMorale=Math.min(35,skill.bonusMorale+Math.floor(rank/2));
 if(Number.isFinite(skill.applyChance))skill.applyChance=Math.min(.95,skill.applyChance+rank*.015);
 return skill;
}
const nlhPriorSkill=p2Skill;
p2Skill=function(actor){
 const skill=nlhPriorSkill.apply(this,arguments);
 if(actor?.team!=='p'||battle?.replay||battle?.mode==='cltq'||!nlhOwned(actor.id))return skill;
 return nlhSkillDescriptor(actor.id,skill);
};
function nlhEndgameReady(id){return nlhOwned(id)&&nlhStage()>=28&&nlhsHero(id).awakening.gold&&(game.hero[id]?.level||0)>=40;}
function nlhAncientQuote(level){return {currency:{silver:5000*level,merit:150*level},materials:{quynhTuong:level,xichQua:level,hoangTrungLy:level}};}
function nlhIllusionQuote(){return {currency:{silver:8000,merit:250},materials:{destinyJade:2,blank:2}};}
function nlhRecordDevelopmentReceipt(s,r){
 if(!s.refundLedger||typeof s.refundLedger!=='object')s.refundLedger={};
 if(!Array.isArray(s.refundLedger[r.heroId]))s.refundLedger[r.heroId]=[];
 if(game.roster?.includes(r.heroId)&&r.currency&&r.materials){
  const ledger=s.refundLedger[r.heroId];if(ledger.some(x=>x.id===r.id))r={...r,id:r.id+':'+ledger.length};
  ledger.push({...r,currency:{...r.currency},materials:{...r.materials}});
 }
 s.receipts.push(r);s.receipts=s.receipts.slice(-500);
}
function nlhEndgameReceipt(system,id,level,cost,materials){
 const s=nlhsState();nlhRecordDevelopmentReceipt(s,{id:'hero-endgame:'+system+':'+id+':'+level+':'+Date.now(),system,heroId:id,level,currency:cost,materials,at:Date.now(),classification:'SIMULATED'});save();render();return true;
}
function nlhAncientUpgrade(id){
 if(battle||!nlhEndgameReady(id))return false;
 const h=nlhsHero(id),next=h.ancientLevel+1,q=nlhAncientQuote(next);
 if(next>ANCIENT_MAX||!nlhPay(q.currency,q.materials))return false;
 h.ancientLevel=next;return nlhEndgameReceipt('ancient',id,next,q.currency,q.materials);
}
function nlhIllusionChoose(id,mode){
 if(battle||!nlhOwned(id))return false;
 const h=nlhsHero(id);
 if(mode==='none'){if(!h.illusionMode)return false;h.illusionMode=null;save();render();return true;}
 if(!nlhEndgameReady(id)||!h.ancientLevel||!Object.hasOwn(ILLUSIONS,mode)||h.illusionMode===mode)return false;
 if(h.illusionUnlocked.includes(mode)){h.illusionMode=mode;save();render();return true;}
 const q=nlhIllusionQuote();if(!nlhPay(q.currency,q.materials))return false;
 h.illusionUnlocked.push(mode);h.illusionMode=mode;return nlhEndgameReceipt('illusion:'+mode,id,1,q.currency,q.materials);
}
function nlhMaterialBuy(id){
 if(battle||!Object.hasOwn(MATERIAL_SHOP,id))return false;
 const s=nlhsState(),[gate,silver,merit]=MATERIAL_SHOP[id],count=Number(s.materialShop.counts[id])||0;
 if(nlhStage()<gate||count>=5||!nlhPay({silver,merit},{}))return false;
 s.materialShop.counts[id]=count+1;s.materials[id]++;
 return nlhEndgameReceipt('material:'+id,'shop',count+1,{silver,merit},{});
}
// Exact Mobile attribute series; acquisition fees use the existing offline material economy.
function nlhSourceRecord(id){return typeof nlMobileHeroApi!=='undefined'?nlMobileHeroApi?.record(id):null;}
function nlhSourceOptions(id){
 const q=typeof nlMobileHeroApi!=='undefined'?nlMobileHeroApi?.quality(id):null;
 const stages=nlhSourceRecord(id)?.stages||[];
 return q?(stages.filter(x=>x.q<=q.growth.q&&x.kismets?.length).sort((a,b)=>b.q-a.q)[0]?.kismets||[]):[];
}
function nlhSourceSeal(id){
 const q=typeof nlMobileHeroApi!=='undefined'?nlMobileHeroApi?.quality(id):null;
 const stage=(nlhSourceRecord(id)?.stages||[]).filter(x=>x.q<=(q?.growth.q||0)&&x.seals?.some(y=>!y.isChild&&y.skillDescs?.length)).sort((a,b)=>b.q-a.q)[0];
 return stage?.seals?.find(x=>!x.isChild&&x.skillDescs?.length)||null;
}
function nlhSourceWeapon(id){const w=nlhSourceRecord(id)?.weapon;return w?.name&&Array.isArray(w.stats)&&w.stats.length?w:null;}
function nlhSourceProgress(id){const h=nlhsHero(id);if(!h.mobileBuild||typeof h.mobileBuild!=='object')h.mobileBuild={weapon:Math.min(10,h.weaponLevel||0),destiny:null,ranks:{},migration:'legacy-weapon-rank-preserved'};const m=h.mobileBuild;if(!m.ranks||typeof m.ranks!=='object')m.ranks={};m.weapon=Number.isSafeInteger(m.weapon)?Math.max(0,Math.min(10,m.weapon)):0;return m;}
function nlhSourceRank(id,name){const v=nlhSourceProgress(id).ranks[name];return Number.isSafeInteger(v)?Math.max(0,Math.min(10,v)):0;}
function nlhSourceQuote(id,system,name){
 if(system==='weapon'){
  const w=nlhSourceWeapon(id),level=nlhSourceProgress(id).weapon+1;
  if(!w||level>10)return null;
  return {level,gate:0,currency:{silver:1300*level,merit:45*level},materials:{weaponCore:level}};
 }
 const option=nlhSourceOptions(id).find(x=>x.name===name),level=nlhSourceRank(id,name)+1;
 if(!option||level>10||!option.effects?.every(e=>Array.isArray(e.series)&&e.series.length>=level))return null;
 return {level,gate:400,currency:{silver:3000*level,merit:50*level},materials:{temperingStone:2*level,destinyJade:level,blank:1}};
}
function nlhSourceUpgrade(id,system,name){
 if(battle||!nlhOwned(id))return false;
 const q=nlhSourceQuote(id,system,name);if(!q||!nlhIsOpen(system==='weapon'?'specialWeapon':'destiny')||(q.gate&&(game.nlContentC?.mobileCommanderLevel||10)<q.gate)||!nlhPay(q.currency,q.materials))return false;
 const m=nlhSourceProgress(id);if(system==='weapon')m.weapon=q.level;else {m.ranks[name]=q.level;m.destiny=name;}
 return nlhEndgameReceipt('mobile-'+system,id,q.level,q.currency,q.materials);
}
function nlhSourceEquip(id,name){
 const m=nlhSourceProgress(id);
 if(battle||!nlhOwned(id)||!nlhSourceOptions(id).some(x=>x.name===name)||!nlhSourceRank(id,name)||m.destiny===name)return false;
 m.destiny=name;save();render();return true;
}
function nlhSourceModifiers(id){
 const m=nlhSourceProgress(id),w=nlhSourceWeapon(id),option=nlhSourceOptions(id).find(x=>x.name===m.destiny),rank=option?nlhSourceRank(id,option.name):0;
 const out={flat:{},pct:{},lead:0,war:0,intellect:0,dodge:0,critDamage:0,finalDamage:0,patterns:{},troopAttack:{},troopDefense:{},unresolved:[],passives:[]};
 const stat={'Vật Công':'atk','Pháp Công':'catk','C.C':'catk','Mưu Công':'matk','Vật Phòng':'def','Pháp Phòng':'tdef','Mưu Phòng':'mdef'};
 function apply(label,raw,pct){
  const v=typeof raw==='number'?raw:Number(String(raw).replace('%','').replaceAll(' ','').replace(',','.'));if(!Number.isFinite(v))return;
  const percent=pct??String(raw).includes('%'),n=percent?v/100:v;
  const keys=stat[label]?[stat[label]]:label==='Tất cả phòng'?['def','tdef','mdef']:label==='Tất cả công'?['atk','catk','matk']:[];
  if(keys.length){for(const k of keys){const dst=percent?out.pct:out.flat;dst[k]=(dst[k]||0)+(percent?n:n*.001);}return;}
  if(['C.Huy','Chỉ Huy'].includes(label)&&!percent)out.lead+=n;
  else if(['Võ','Võ Lực'].includes(label)&&!percent)out.war+=n;
  else if(label==='Trí'&&!percent)out.intellect+=n;
  else if(['Phần trăm Né','Né Tránh Cuối'].includes(label)&&percent)out.dodge+=n;
  else if(label==='Sát thương bạo kích'&&percent)out.critDamage+=n;
  else if(label==='Tăng ST Cuối'&&percent)out.finalDamage+=n;
  else if(label==='Sát thương mục tiêu đơn'&&percent)out.patterns.single=(out.patterns.single||0)+n;
  else if(label==='Sát thương toàn phe địch'&&percent)out.patterns.all=(out.patterns.all||0)+n;
  else {const match=label.match(/^(Tấn Công|Phòng Thủ) (Bộ Binh|Thương Binh|Kỵ Binh|Cung Binh|Quan Văn)$/);
   if(match&&percent){const role={'Bộ Binh':'infantry','Thương Binh':'spear','Kỵ Binh':'cavalry','Cung Binh':'archer','Quan Văn':'strategist'}[match[2]],d=match[1]==='Tấn Công'?out.troopAttack:out.troopDefense;d[role]=(d[role]||0)+n;}
   else out.unresolved.push({label,raw});
  }
 }
 if(w&&m.weapon)for(const x of w.stats){const i=x.ranks?.indexOf(m.weapon)??-1;if(i>=0)apply(x.name,x.series[i],x.pct);}
 if(rank)for(const x of option.effects)apply(x.label,x.series[rank-1]);
 const seal=nlhSourceSeal(id),sealRank=nlhsHero(id).inheritanceLevel;
 if(seal&&sealRank>0)out.passives.push({kind:'seal',name:seal.name,desc:seal.skillDescs[Math.min(sealRank,seal.skillDescs.length)-1]});
 if(w&&m.weapon)for(const slot of w.slots||[]){
   // Fractional source thresholds have no published star-equivalence. Use the next integer
   // as the offline unlock; thresholds above ten remain unresolved, never silently unlocked.
   const active=(slot.tiers||[]).filter(t=>Number.isFinite(t.rank)&&Math.ceil(t.rank)<=m.weapon).sort((a,b)=>b.rank-a.rank)[0];
   if(active)out.passives.push({kind:'weapon',name:active.name,desc:active.desc});
 }
 return out;
}
function nlhSourcePanel(id,system){
 const weapon=system==='weapon',w=weapon?nlhSourceWeapon(id):null,opts=weapon?(w?[w]:[]):nlhSourceOptions(id);
 if(!opts.length)return null;
 const m=nlhSourceProgress(id),title=weapon?'Vũ khí đặc biệt':'Mệnh Cách';
 return '<div class="nlh-section-head"><span>'+title+' · '+hsEsc(nlhHero(id).name)+'</span></div>'+opts.map(o=>{
  const lv=weapon?m.weapon:nlhSourceRank(id,o.name),q=nlhSourceQuote(id,system,o.name),active=weapon||m.destiny===o.name;
  const stats=weapon?o.stats.map(x=>({label:x.name,value:lv?x.series[x.ranks.indexOf(lv)]:0,next:q?x.series[x.ranks.indexOf(q.level)]:null})):o.effects.map(x=>({label:x.label,value:lv?x.series[lv-1]:0,next:q?x.series[q.level-1]:null}));
  return '<div class="nlh-feature-panel"><b>'+hsEsc(o.name)+' · '+lv+'/10'+(active?' · Đang dùng':'')+'</b><div class="nlh-stat-compare">'+stats.map(x=>'<div><span>'+hsEsc(x.label)+'</span><b>'+hsEsc(x.value)+'</b><strong>'+(x.next!=null?'→ '+hsEsc(x.next):'—')+'</strong></div>').join('')+'</div>'+
  (weapon&&o.slots?.length?'<details class="nlh-material-drawer"><summary>Hiệu ứng theo bậc</summary>'+(o.slots||[]).map(x=>'<p><b>'+hsEsc(x.name)+'</b> · '+(x.tiers||[]).map(t=>hsEsc(t.desc)).join(' / ')+'</p>').join('')+'</details>':'')+
  (q?'<button class="nlh-button" data-nlh-action="sourceUpgrade" data-nlh-kind="'+system+'" data-nlh-name="'+hsEsc(o.name)+'" '+(battle||!nlhIsOpen(weapon?'specialWeapon':'destiny')||q.gate>(game.nlContentC?.mobileCommanderLevel||10)||!nlhCanPay(q.currency,q.materials)?'disabled':'')+'>Nâng cấp · '+hsEsc(nlhCostText(q.currency,q.materials))+'</button>':'')+
  (!weapon&&lv&&!active?'<button class="nlh-button" data-nlh-action="sourceEquip" data-nlh-name="'+hsEsc(o.name)+'">Trang bị</button>':'')+'</div>';
 }).join('')+'<p class="nlh-source-note">Bảng chỉ số theo cấp lấy nguyên nguồn. Chi phí và mở khóa đặc vũ mô phỏng; hiệu ứng mô tả riêng chưa nối đầy đủ. Mệnh Cách mở ở cấp Chỉ huy đại diện 400.</p>';
}
function nlhCombatGrowth(id){
 const h=nlhsHero(id),bonus={attackPct:0,tacticAttackPct:0,magicAttackPct:0,defensePct:0,hpPct:0,speedFlat:0};
 const sourceRank=typeof nlMobileHeroApi!=='undefined'&&nlMobileHeroApi?.quality(id),orange=sourceRank?0:Number(h.awakening.orange),gold=sourceRank?0:Number(h.awakening.gold);
 const weaponLevel=nlhSourceWeapon(id)?0:h.weaponLevel;
 bonus.attackPct+=h.commanderLevel*.012+weaponLevel*.025+orange*.06+gold*.08;
 bonus.tacticAttackPct+=weaponLevel*.025;bonus.magicAttackPct+=weaponLevel*.025+gold*.08;
 const inheritanceLevel=nlhSourceSeal(id)?0:h.inheritanceLevel;
 bonus.defensePct+=h.commanderLevel*.012+inheritanceLevel*.015+gold*.08;
 bonus.hpPct+=inheritanceLevel*.035+orange*.05;
 bonus.speedFlat+=h.commanderLevel;
 if(h.destinyId&&!nlhSourceProgress(id).destiny){
   if(h.destinyId==='war')bonus.attackPct+=h.destinyLevel*.028;
   else if(h.destinyId==='guard'){bonus.hpPct+=h.destinyLevel*.04;bonus.defensePct+=h.destinyLevel*.015;}
   else if(h.destinyId==='tactic'){bonus.magicAttackPct+=h.destinyLevel*.03;bonus.speedFlat+=h.destinyLevel*2;}
 }
 bonus.attackPct+=h.ancientLevel*.02;bonus.defensePct+=h.ancientLevel*.02;bonus.hpPct+=h.ancientLevel*.025;
 const illusion=ILLUSIONS[h.illusionMode];if(illusion)for(const k of Object.keys(bonus))bonus[k]+=illusion[k]||0;
 return bonus;
}
if(typeof nlMobileHeroBuildModifiers!=='undefined'||typeof nlMobileHeroApi!=='undefined')nlMobileHeroBuildModifiers=nlhSourceModifiers;
const nlhPriorUnit=p2Unit;p2Unit=function(id,team,slot,stage){
 const unit=nlhPriorUnit.apply(this,arguments);if(team!=='p'||!unit||!nlhOwned(id)||battle?.mode==='cltq')return unit;
 const source=nlhSourceModifiers(id);
 for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(unit[k]))unit[k]=Math.max(1,(unit[k]+(source.flat[k]||0))*(1+(source.pct[k]||0)));
 unit.dodge=Math.max(0,Math.min(.95,(unit.dodge||0)+source.dodge));unit.nlMobileHeroBuild=source;
 const b=nlhCombatGrowth(id),factor=(key,amount)=>{if(Number.isFinite(unit[key])&&amount)unit[key]=Math.max(1,Math.round(unit[key]*(1+amount)));};
 factor('atk',b.attackPct);factor('catk',b.attackPct+b.tacticAttackPct);factor('matk',b.attackPct+b.magicAttackPct);
 factor('def',b.defensePct);factor('tdef',b.defensePct);factor('mdef',b.defensePct);factor('maxHp',b.hpPct);factor('hp',b.hpPct);
 if(Number.isFinite(unit.speed))unit.speed+=b.speedFlat;
 unit.nlhDevelopment={...b,commanderLevel:nlhsHero(id).commanderLevel,weaponLevel:nlhsHero(id).weaponLevel,inheritanceLevel:nlhsHero(id).inheritanceLevel,destinyId:nlhsHero(id).destinyId,destinyLevel:nlhsHero(id).destinyLevel,awakening:structuredClone(nlhsHero(id).awakening),ancientLevel:nlhsHero(id).ancientLevel,illusionMode:nlhsHero(id).illusionMode};
 return unit;
};
function nlhGrantStageMaterials(stage){
 if(!battle||battle.replay||!battle.won||battle.mode!=='campaign'||!game.cleared?.includes(stage))return false;
 const key='hero-system:first-clear:'+stage,state=nlhsState();if(state.firstClearClaims[stage]||state.receipts.some(x=>x.id===key))return false;
 state.firstClearClaims[stage]=true;
 const reward=NL_HS.firstClearMaterialRewards[String(stage)]||{};for(const [id,n] of Object.entries(reward))state.materials[id]=(state.materials[id]||0)+n;
 state.receipts.push({id:key,system:'rewards',stage,materials:reward,at:Date.now(),classification:'SIMULATED'});state.receipts=state.receipts.slice(-500);save();
 if(Object.keys(reward).length){const result=document.querySelector('#battle-result .reward');if(result)result.insertAdjacentHTML('beforeend','<span>Vật liệu tướng · '+hsEsc(Object.entries(reward).map(([id,n])=>(NL_HS.materialCatalog[id]?.name||id)+' ×'+n).join(' · '))+' (SIMULATED)</span>');}
 return true;
}
const hsPriorFinish=finishBattle;finishBattle=function(){const b=battle,stage=b?.stage,first=!!b&&!b.finished&&!b.replay&&b.mode==='campaign'&&!b.nlContentC&&!b.nlAdvancedObjective&&!game.cleared?.includes(stage);const result=hsPriorFinish.apply(this,arguments);if(first&&battle===b&&b.finished&&b.won)nlhGrantStageMaterials(stage);return result;};
function nlhHeaderTitle(system){return SYS[system]?.label||'Võ Tướng';}
function nlhMaterialsBar(){const s=nlhsState();return '<div class="nlh-materials">'+Object.entries(NL_HS.materialCatalog).map(([id,m])=>'<span class="nlh-material">'+hsEsc(m.name)+'<b>×'+nlhFmt(s.materials[id]||0)+'</b></span>').join('')+'</div>';}
function nlhProfile(heroId){
 const h=nlhHero(heroId),d=nlhHeroStats(heroId),art=nlhArt(heroId),troop=nlhCurrentTroop(heroId),dev=nlhsHero(heroId);
 const mode=art[game.heroDevelopment?.artModes?.[heroId]]?game.heroDevelopment.artModes[heroId]:(art.character?'character':art.portrait?'portrait':'splash');
 const artSrc=art[mode]||art.character||art.portrait||art.splash;
 const img=artSrc?'<img class="nlh-character nlh-character-'+mode+'" src="'+artSrc+'" alt="'+(mode==='portrait'?'Chân dung':mode==='splash'?'Splash art':'Nữ tướng toàn thân')+' '+hsEsc(h.name)+'">':'<div class="nlh-character-fallback">'+hsEsc(String(h.name||'?').slice(0,1))+'</div>';
 const modeNames={portrait:'Chân dung',splash:'Splash',character:'Toàn thân'};
 const artTabs=['portrait','splash','character'].filter(key=>art[key]).map(key=>'<button class="nlh-art-tab '+(mode===key?'selected':'')+'" data-nlh-action="artMode" data-nlh-mode="'+key+'" aria-label="Xem '+modeNames[key]+' '+hsEsc(h.name)+'">'+modeNames[key]+'</button>').join('');
 const bg=art.splash?'style="--nlh-splash:url(\''+art.splash+'\')"':'';
 const awake=typeof NL_CONTENT_C!=='undefined'?NL_CONTENT_C.awakeningSkills?.[heroId]?.stages:null;
 const chosen=dev.awakening.gold?(awake?.GOLD||awake?.ORANGE||awake?.PURPLE):dev.awakening.orange?(awake?.ORANGE||awake?.PURPLE):null;
 const skill=(chosen?.descriptor?.tag||P2_SKILLS?.[heroId]?.tag||P2_SKILLS?.[heroId]?.name||h.skill||'Chiến pháp riêng');
 const level=d.level;
 return '<div class="nlh-profile" '+bg+'><div class="nlh-hero-art">'+img+'<div class="nlh-art-tabs" role="group" aria-label="Chọn tranh nhân vật">'+artTabs+'</div><span class="nlh-grade-badge">Bậc '+hsEsc(dev.ancientLevel?'Thượng Cổ '+dev.ancientLevel:dev.awakening.gold?'Vàng':dev.awakening.orange?'Cam':h.rarity||h.grade||'Tướng')+'</span></div><div class="nlh-profile-info"><div class="nlh-name-plate"><span class="nlh-kicker">'+hsEsc(h.faction||game.nation||'Tam Quốc')+' · '+hsEsc(h.role||h.type||'Võ tướng')+'</span><h2>'+hsEsc(h.name)+'</h2><span class="nlh-rank-ribbon">Cấp '+level+' · Lực chiến '+nlhFmt(d.power)+'</span></div><div class="nlh-profile-stats"><div class="nlh-stat"><small>Võ</small><b>'+nlhFmt(d.atk)+'</b></div><div class="nlh-stat"><small>Trí</small><b>'+nlhFmt(d.int)+'</b></div><div class="nlh-stat"><small>Thủ</small><b>'+nlhFmt(d.def)+'</b></div><div class="nlh-stat"><small>Tốc</small><b>'+nlhFmt(d.speed)+'</b></div><div class="nlh-stat"><small>Binh</small><b>'+nlhFmt(d.troops)+'</b></div><div class="nlh-stat"><small>Binh chủng</small><b>'+hsEsc(troop.name)+'</b></div></div><div class="nlh-skill-strip"><span class="nlh-kicker">CHIẾN PHÁP</span><b>'+hsEsc(skill)+'</b></div><div class="nlh-profile-actions"><button class="nlh-button" data-nlh-action="trainBatch" data-nlh-count="1" '+(level>=nlhHeroCap(heroId)||battle||!nlhCanPay(nlhTrainQuote(heroId).cost,{})?'disabled':'')+'>Huấn luyện</button><button class="nlh-button secondary" data-nlh-action="system" data-nlh-target="commander">Thống Soái</button><button class="nlh-button secondary" data-tab="formation">Bày Trận</button></div></div></div>';
}

// Exact catalogue identity first; same-family art is explicitly labelled.
function nlhFastGear(name,category){
 const pack=window.__NL_PREMIUM_ICONS__||{},all=[];
 for(const kind of ['heroGear','equipment'])for(const [key,m] of Object.entries(pack.gearMeta?.[kind]||{})){
  const src=pack[kind]?.[key];if(src)all.push({...m,src});
 }
 const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').trim();
 const exact=all.filter(x=>norm(x.name)===norm(name));
 if(exact.length===1)return {...exact[0],binding:'exact'};
 if(category==='equipment')return null;
 const n=norm(name),families=[
  [/kiem|nhan/,'Ỷ Thiên Kiếm'],[/thuong|mau|kich|qua$/,'Long Đảm Thương'],
  [/dao/,'Yển Đao'],[/cung|no$/,'Lạc Nhật Cung'],[/phien|quat/,'Quạt Lông'],
  [/chuy|bong|con$/,'Lưu Tinh Chùy'],[/phu|viet$/,'Quỷ Vương Phủ'],
  [/gian|thu|sach|kinh|quyen|dien|luc$/,'Binh Võ Kinh'],[/an$|ti$|lenh/,'Trấn Thiên Ấn']
 ];
 const family=families.find(([re])=>re.test(n));
 const representative=family&&all.find(x=>x.name===family[1]);
 return representative?{...representative,binding:'family'}:null;
}
function nlhFastArt(system,id,name){
 const pack=window.__NL_PREMIUM_ICONS__||{},scenes=window.__NL_PREMIUM_SCENES__||{};
 const img=(src,alt,binding,grade='')=>src?'<img class="nlh-stage-relic nlh-fast-relic" data-art-binding="'+hsEsc(binding)+'" src="'+src+'" alt="'+hsEsc(alt)+'">'+(binding==='family'?'<small class="nlh-art-caption">Ảnh đại diện cùng loại</small>':grade?'<small class="nlh-art-caption">'+hsEsc(grade)+'</small>':''):'';
 const missing='<div class="nlh-art-unavailable">Chưa có ảnh đúng loại</div>';
 if(system==='specialWeapon'){
  const art=nlhFastGear(name,'weapon');return {background:scenes.battle,picture:art?img(art.src,art.name,art.binding):missing};
 }
 if(system==='inheritance')return {background:scenes.towerBackground||scenes.battle,picture:img(pack.seal?.[name],name,'exact')||missing};
 if(system==='destiny'){
  const opts=nlhSourceOptions(id),active=nlhSourceProgress(id).destiny;
  const legacy=[{name:'Chiến',category:'attack'},{name:'Thủ',category:'defense'},{name:'Mưu',category:'tactic'}];
  const nodes=(opts.length?opts:legacy).map(o=>{
   const cat=o.category||'tactic',key=cat==='attack'?'Hổ Khiếu Sư Hống':cat==='defense'?'Công Thủ Kiêm Bị':'Di Tinh Hoán Nhật';
   const src=pack.seal?.[key];
   return '<div class="nlh-destiny-node '+(active===o.name?'active':'')+'">'+(src?'<img data-art-binding="category" src="'+src+'" alt="">':'')+'<b>'+hsEsc(o.name)+'</b><small>'+nlhSourceRank(id,o.name)+'/10</small></div>';
  }).join('');
  return {background:scenes.towerBackground||scenes.battle,picture:'<div class="nlh-destiny-orbit">'+nodes+'</div>'};
 }
 if(system==='equipment'){
  const gear=game.gear?.[id]||{},slots=Object.entries(SLOT_NAME||{});
  return {background:scenes.towerBackground||scenes.city,picture:'<div class="nlh-gear-art-grid">'+slots.map(([slot,label])=>{
   const item=game.items?.find(x=>x.uid===gear[slot]),base=item&&EQUIPMENT[item.base],art=base&&nlhFastGear(base.name,'equipment');
   return '<div class="nlh-gear-art-slot">'+(art&&art.binding==='exact'?'<img src="'+art.src+'" alt="'+hsEsc(base.name)+'" data-art-binding="exact">':'')+'<b>'+hsEsc(label)+'</b><small>'+hsEsc(base?.name||'Trống')+'</small></div>';
  }).join('')+'</div>'};
 }
 return null;
}
function nlhPremiumStage(system,id){
 const h=nlhHero(id),a=nlhArt(id),d=nlhHeroStats(id),dev=nlhsHero(id),troop=nlhCurrentTroop(id);
 if(system==='hero'||system==='training'||system==='awakening')return nlhProfile(id);
 const names={troops:troop.name,commander:'Chỉ huy cá nhân',specialWeapon:nlhSourceWeapon(id)?.name||'Bảo binh bản mệnh',inheritance:nlhSourceSeal(id)?.name||'Dấu ấn truyền thừa',destiny:nlhSourceProgress(id).destiny||'Thiên mệnh',equipment:'Bộ trang bị',formation:'Trận đồ',rewards:'Chiến công',recruit:'Tửu quán'};
 const subtitles={troops:'Đội hình và chủng quân',commander:'Chỉ huy · mô phỏng',specialWeapon:'Vũ khí đặc biệt',inheritance:'Ấn Kế Thừa',destiny:'Mệnh Cách',equipment:'Trang bị võ tướng',formation:'Bày trận',rewards:'Thưởng phát triển',recruit:'Chiêu mộ võ tướng'};
 const name=names[system]||SYS[system]?.label||h.name;
 const level=system==='specialWeapon'&&nlhSourceWeapon(id)?nlhSourceProgress(id).weapon:system==='destiny'&&nlhSourceProgress(id).destiny?nlhSourceRank(id,nlhSourceProgress(id).destiny):nlhLevel(system,id);
 const fast=nlhFastArt(system,id,name);
 const stageBackground=fast?.background||(!fast&&a.splash)||'';
 const background=stageBackground?' style="--nlh-stage-bg:url(\''+stageBackground+'\')"':'';
 const isArmy=system==='troops'||system==='commander';
 const unit=p2Unit(id,'p',0,Math.max(1,Math.min(28,nlhStage()+1)));
 const image=a.character||a.portrait||a.splash;
 const icons=window.__NL_PREMIUM_ICONS__||{},sealIcon=system==='inheritance'?icons.seal?.[name]:null;
 const formation=system==='formation'?'<div class="nlh-preview-formation">'+game.slots.map((heroId,i)=>{const p=heroId&&nlhArt(heroId)?.portrait;return '<div class="nlh-preview-slot '+(heroId?'filled':'')+'">'+(p?'<img src="'+p+'" alt="'+hsEsc(nlhHero(heroId).name)+'">':heroId?hsEsc(nlhHero(heroId).name):'')+'</div>';}).join('')+'</div>':'';
 const picture=fast?.picture||formation||(sealIcon?'<img class="nlh-stage-relic" src="'+sealIcon+'" alt="'+hsEsc(name)+'">':isArmy?'<canvas class="nlh-stage-troop" width="480" height="370" data-premium-troop="'+hsEsc(unit?.troop||h.type||'infantry')+'" data-premium-branch="'+hsEsc(unit?.branch||'')+'" role="img" aria-label="Đội quân của '+hsEsc(h.name)+'"></canvas>':image?'<img class="nlh-stage-character" src="'+image+'" alt="'+hsEsc(h.name)+'">':'');
 const detail=system==='formation'?game.slots.filter(Boolean).length+'/5 võ tướng':system==='troops'?'Bậc '+troop.tier:system==='recruit'?game.roster.length+' võ tướng':system==='equipment'?Object.values(game.gear?.[id]||{}).filter(Boolean).length+'/7 vị trí':'Cấp '+level;
 return '<div class="nlh-showcase" data-premium-stage="'+system+'"'+background+'><div class="nlh-stage-glow"></div>'+picture+'<div class="nlh-stage-heading"><small>'+hsEsc(subtitles[system]||SYS[system]?.label||'Phát triển')+'</small><h2>'+hsEsc(name)+'</h2><span>'+hsEsc(h.name)+' · '+hsEsc(detail)+'</span></div><span class="nlh-stage-mark">'+nlhGlyph(system)+'</span></div>';
}
function nlhSystemMenu(system,heroId){return '<aside class="nlh-toolbar"><div class="nlh-toolbar-title">PHÁT TRIỂN TƯỚNG</div>'+NL_HS.systems.map((s,i)=>'<button class="nlh-system-button '+(system===s.id?'selected':'')+'" data-nlh-action="system" data-nlh-target="'+s.id+'"><span class="nlh-system-no">'+nlhGlyph(s.id)+'</span><span>' +hsEsc(({hero:'Tướng',training:'Huấn luyện',troops:'Binh chủng',commander:'Thống Soái',specialWeapon:'Vũ Khí ĐB',inheritance:'Ấn Kế Thừa',destiny:'Mệnh Cách',equipment:'Trang bị',formation:'Trận pháp',rewards:'Thưởng',recruit:'Chiêu mộ',awakening:'Giác ngộ'})[s.id]||s.label)+'</span>'+(!nlhIsOpen(s.id)?'<i class="nlh-lock">'+(s.unlock.campaignClears||0)+'</i>':'')+'</button>').join('')+'</aside>';}
function nlhRoster(heroId){const list=(game.roster||[]).filter(nlhOwned);return '<aside class="nlh-roster"><div class="nlh-roster-head"><strong>VÕ TƯỚNG</strong><small>'+list.length+' tướng</small></div><div class="nlh-roster-grid">'+list.map(id=>{const h=nlhHero(id),a=nlhArt(id),src=a.portrait;return '<button class="nlh-portrait-card '+(heroId===id?'selected':'')+'" data-nlh-action="hero" data-nlh-hero="'+hsEsc(id)+'" aria-label="Chọn '+hsEsc(h.name)+'">'+(src?'<img src="'+src+'" alt="">':'<span class="nlh-portrait-fallback">'+hsEsc(String(h.name||'?').slice(0,1))+'</span>')+'<b>'+hsEsc(h.name)+'</b></button>';}).join('')+'</div></aside>';}
function nlhProgress(level,max,label,percent){return '<div class="nlh-growth"><div class="nlh-growth-head"><span>'+hsEsc(label)+'</span><b>'+hsEsc(String(level))+' / '+hsEsc(String(max))+'</b></div><div class="nlh-bar"><i style="width:'+Math.max(0,Math.min(100,percent))+'%"></i></div></div>';}
function nlhEndgamePanel(id){
 const h=nlhsHero(id),next=h.ancientLevel+1,q=nlhAncientQuote(next),ready=nlhEndgameReady(id);
 const controls=Object.entries(ILLUSIONS).map(([key,x])=>{const unlocked=h.illusionUnlocked.includes(key),price=nlhIllusionQuote(),active=h.illusionMode===key;
 const details=Object.entries(x).filter(([k,v])=>k!=='name'&&v).map(([k,v])=>({attackPct:'Công',tacticAttackPct:'Chiến pháp',magicAttackPct:'Mưu',defensePct:'Thủ',hpPct:'Binh',speedFlat:'Tốc'}[k]||k)+' '+(v>0?'+':'')+Math.round(k==='speedFlat'?v:v*100)+(k==='speedFlat'?'':'%')).join(' · ');
 return '<div class="nlh-feature-panel"><b>'+hsEsc(x.name)+(active?' · Đang dùng':'')+'</b><p class="nlh-copy">'+hsEsc(details)+'</p><button class="nlh-button" data-nlh-action="illusion" data-nlh-mode="'+key+'" '+(!ready||!h.ancientLevel||active||battle||(!unlocked&&!nlhCanPay(price.currency,price.materials))?'disabled':'')+'>'+(active?'Đang dùng':unlocked?'Chuyển dạng':'Mở · '+hsEsc(nlhCostText(price.currency,price.materials)))+'</button></div>';}).join('');
 return '<div class="nlh-feature-panel"><b>Thượng Cổ · '+h.ancientLevel+'/'+ANCIENT_MAX+'</b><p class="nlh-copy">Sau ải 28, tướng Vàng cấp 40. Mỗi cấp +2% Công/Thủ, +2,5% Binh. SIMULATED.</p><button class="nlh-button" data-nlh-action="ancient" '+(!ready||next>ANCIENT_MAX||battle||!nlhCanPay(q.currency,q.materials)?'disabled':'')+'>'+(next>ANCIENT_MAX?'Tối đa':'Nâng cấp · '+hsEsc(nlhCostText(q.currency,q.materials)))+'</button></div><h3 class="nlh-section-title">Huyễn Tướng · chọn một chiến thể</h3>'+controls+(h.illusionMode?'<button class="nlh-button secondary" data-nlh-action="illusion" data-nlh-mode="none" '+(battle?'disabled':'')+'>Về dạng gốc</button>':'')+'<p class="nlh-source-note">Các chiến thể là mô phỏng offline có ưu/nhược điểm; giữ ID và ngoại hình hiện tại.</p>';
}
function nlhMaterialShopPanel(){
 const s=nlhsState();return '<h3 class="nlh-section-title">Đổi vật liệu · tối đa 5 món mỗi loại/ngày</h3>'+Object.entries(MATERIAL_SHOP).map(([id,[gate,silver,merit]])=>{const n=s.materialShop.counts[id]||0;return '<div class="nlh-action-row"><span class="nlh-quote">'+hsEsc(NL_HS.materialCatalog[id].name)+' · '+n+'/5 · '+silver+' Bạc + '+merit+' Chiến công</span><button class="nlh-button" data-nlh-action="materialBuy" data-nlh-material="'+id+'" '+(battle||nlhStage()<gate||n>=5||!nlhCanPay({silver,merit},{})?'disabled':'')+'>'+(nlhStage()<gate?'Ải '+gate:'Đổi')+'</button></div>';}).join('')+'<p class="nlh-source-note">Nguồn vật liệu tái tạo bằng Bạc/Chiến công; giá và giới hạn SIMULATED.</p>';
}
function nlhDevelopmentRefundPanel(id){
 if(typeof nlItemConsumableApi==='undefined'||!nlItemConsumableApi.heroDevelopmentRefundQuote)return '';
 const options=[['560','Hạ Chức Lệnh-Sơ'],['561','Hạ Chức Lệnh-Trung'],['562','Hạ Chức Lệnh-Cao']];
 const rows=options.map(([token,name])=>{
  const q=nlItemConsumableApi.heroDevelopmentRefundQuote(game,id,token);
  if(!q)return '';
  const owned=Number(game.nlItemsV1?.stacks?.['mobile-vng-item-'+token])||0;
  return '<div class="nlh-feature-panel"><b>'+hsEsc(name)+' · '+q.rate+'%</b><p>'+hsEsc(nlhCostText(q.currency,q.materials))+'</p><p>'+q.plan.length+' nhóm có chứng từ đầy đủ'+(q.blocked.length?' · '+q.blocked.length+' nhóm giữ nguyên do thiếu chứng từ':'')+'</p><button class="nlh-button" data-nlh-action="developmentReset" data-nlh-mode="'+token+'" '+(battle||!owned?'disabled':'')+'>Hạ chức · Có '+owned+' lệnh</button></div>';
 }).join('');
 return '<h3 class="nlh-section-title">Hạ chức phát triển</h3><p>Hoàn trả 60/80/100% chi phí thực trả của các nhóm nâng cấp có đủ chứng từ. Giữ nguyên cấp tướng, trang bị, giác ngộ nguồn và các nhóm thiếu chứng từ; đây là mô phỏng phạm vi hạ chức.</p>'+ (rows||'<p>Chưa có nhóm đầu tư đủ chứng từ.</p>');
}
function nlhMobileResetPanel(id){
 if(typeof nlMobileHeroApi==='undefined'||!nlMobileHeroApi?.resetQuote)return '';
 const rows=['normal','super'].map(kind=>{const q=nlMobileHeroApi.resetQuote(id,kind);return q?'<div class="nlh-feature-panel"><b>'+hsEsc(kind==='super'?'Truyền Thừa Lệnh-Siêu':'Truyền Thừa Lệnh')+'</b><p>Hạ phẩm chất '+q.from+' → '+q.to+' · Hoàn trả '+Object.entries(q.refund).map(([k,v])=>hsEsc(k)+' ×'+nlhFmt(v)).join(' · ')+'</p><button class="nlh-button" data-nlh-action="mobileReset" data-nlh-mode="'+kind+'" '+(battle||!q.owned?'disabled':'')+'>Hạ phẩm chất · Có '+q.owned+' lệnh</button></div>':'';}).join('');
 return nlhDevelopmentRefundPanel(id)+'<h3 class="nlh-section-title">Hạ chức / Truyền thừa</h3><p>Chỉ hoàn trả giác ngộ có chứng từ đầy đủ; không hạ cấp, không đổi trang bị, Mệnh Cách, Quý Tử hoặc các đầu tư khác. Chưa phải toàn bộ cơ chế Mobile.</p>'+(rows||'<p>Chưa đủ chuỗi chứng từ từ phẩm chất gốc hoặc chưa đạt điều kiện.</p>');
}
function nlhMobileAwakeningPanel(id){
 if(typeof nlMobileHeroApi==='undefined'||!nlMobileHeroApi?.quality(id))return null;
 const exact=nlMobileHeroApi?.quality(id),q=nlMobileHeroApi.next(id),wallet=game.nlContentC?.mobileHeroMaterials||{};
 const materials=q?.valid?Object.entries(q.material).map(([name,amount])=>{
   const have=wallet[name]||0,missing=Math.max(0,amount-have),quote=missing?nlMobileHeroApi.materialQuote(id,name,missing):null;
   return '<div class="nlh-action-row"><span>'+hsEsc(name)+' · '+nlhFmt(have)+'/'+nlhFmt(amount)+'</span>'+
   (quote?'<button class="nlh-button" data-nlh-action="mobileMaterial" data-nlh-name="'+hsEsc(name)+'" data-nlh-count="'+missing+'" '+(battle||game.silver<quote.silver?'disabled':'')+'>Đổi '+nlhFmt(missing)+' · '+nlhFmt(quote.silver)+' Bạc</button>':'')+'</div>';
 }).join(''):'';
 return '<div class="nlh-section-head"><span>Giác Ngộ · '+hsEsc(exact.name)+'</span><span class="nlh-status">'+hsEsc(exact.growth.qn)+'</span></div>'+
 '<h3 class="nlh-section-title">Giác ngộ theo phẩm chất nguồn</h3>'+nlhMobileSourcePanel(id)+
 (!q?'<p>Đã đạt phẩm chất tối đa có dữ liệu.</p>':'<div class="nlh-feature-panel"><b>Bậc tiếp: '+hsEsc(q.name)+'</b><p>'+hsEsc(q.stage?.access||'Chưa xác minh đường nhận')+'</p>'+materials+
 (q.valid?'<button class="nlh-button" data-nlh-action="mobileAwaken" '+(!nlMobileHeroApi.canAwaken(id)?'disabled':'')+'>Giác ngộ · cần Chỉ huy '+q.gate+'</button>':'<p>Thiếu bảng chi phí nguồn: chưa mở giao dịch.</p>')+
 '<p class="nlh-source-note">Số lượng nguyên liệu lấy nguyên Wiki; đường đổi Bạc và các ngưỡng chưa có nguồn là mô phỏng.</p></div>')+nlhMobileResetPanel(id);
}
function nlhMobileSourcePanel(id){
 const key=typeof NL_CONTENT_C!=='undefined'?NL_CONTENT_C.mobileHeroSource?.runtimeAliases?.[id]:null;
 const record=key?NL_CONTENT_C.mobileHeroSource.details[key]:null;
 if(!record)return '';
 const ranks=(record.growth||[]).filter(r=>Number.isInteger(r.q)&&[r.lead,r.war,r.int].every(Number.isFinite)).sort((a,b)=>a.q-b.q);
 if(!ranks.length)return '';
 const current=nlMobileHeroApi?.quality(id)?.growth||ranks[0],next=ranks.find(r=>r.q>current.q);
 const stage=(record.stages||[]).filter(t=>t.q<=current.q).sort((a,b)=>a.q-b.q).at(-1),nextStage=(record.stages||[]).find(t=>t.q===next?.q);
 return '<div class="nlh-feature-panel"><b>Phẩm chất · '+hsEsc(current.qn||current.q)+'</b><p class="nlh-copy">Chỉ Huy '+current.lead+' · Võ '+current.war+' · Trí '+current.int+' · tăng trưởng nguồn '+current.gl+'/'+current.gw+'/'+current.gi+'</p>'+
 (stage?.skill?'<p class="nlh-copy">Chiến pháp nguồn: '+hsEsc(stage.skill.name)+' · '+hsEsc(stage.skill.desc||'')+'</p>':'')+
 (next?'<p class="nlh-copy">Bậc tiếp: '+hsEsc(next.qn||next.q)+' · '+(nextStage?.cost||[]).map(x=>hsEsc(x.name)+' × '+nlhFmt(x.qty)).join(' · ')+'</p>':'')+
 '<p class="nlh-source-note">Thuộc tính và chi phí giác ngộ có bảng nguồn đã nối runtime. Chiến pháp phức hợp, tăng trưởng theo cấp và nguồn chiêu mộ còn cần đối soát.</p></div>';
}
function nlhSkillPanel(id){
 const exact=typeof nlMobileHeroApi!=='undefined'?nlMobileHeroApi?.skill(id):null;
 if(exact)return '<div class="nlh-feature-panel"><b>Chiến pháp · '+hsEsc(exact.tag)+'</b><p class="nlh-copy">'+hsEsc(exact.sourceDescription||'')+'</p><p>Phát triển qua Giác Ngộ.</p></div>';
 const h=nlhsHero(id),level=h.skillLevel,next=level+1,cost=nlhSkillQuote(next),base=P2_SKILLS[id],skill=nlhSkillDescriptor(id,base);
 const can=nlhStage()>=3&&(game.hero[id]?.level||0)>=next*4&&next<=SKILL_MAX&&!battle&&nlhCanPay(cost,{});
 return '<div class="nlh-feature-panel"><b>Chiến pháp · Cấp '+level+'/'+SKILL_MAX+'</b><p class="nlh-copy">'+hsEsc(skill?.tag||nlhHero(id).skill||'Chiến pháp')+' · '+(Number.isFinite(skill?.mult)?'Hệ số '+Math.round(skill.mult*100)+'% · ':'')+'Mỗi cấp +3,5% hệ số gốc, cải thiện hiệu ứng có sẵn. SIMULATED.</p><button class="nlh-button" data-nlh-action="skillUpgrade" '+(can?'':'disabled')+'>'+(next>SKILL_MAX?'Tối đa':'Nâng cấp · '+hsEsc(nlhCostText(cost,{}))+' · cần tướng cấp '+next*4)+'</button></div>';
}
function nlhSystemBody(system,id){
 const h=nlhHero(id),d=nlhHeroStats(id),state=nlhsState(),dev=nlhsHero(id),skill=SYS[system];
 if(system==='hero')return '<div class="nlh-section-head"><span>Võ Tướng · '+hsEsc(h.name)+'</span><span class="nlh-status">'+hsEsc(nlhNeedText('hero'))+'</span></div><h3 class="nlh-section-title">Thuộc tính</h3>'+nlhProgress(d.level,nlhHeroCap(id),'Cấp tướng',d.level/nlhHeroCap(id)*100)+nlhProgress(dev.commanderLevel,5,'Chỉ huy cá nhân · mô phỏng',dev.commanderLevel/5*100)+'<div class="nlh-facts"><div class="nlh-fact"><small>CHIẾN PHÁP GỐC</small><b>'+hsEsc(h.skill||'Chưa có nguồn mô tả')+'</b></div><div class="nlh-fact"><small>BINH CHỦNG HIỆN TẠI</small><b>'+hsEsc(nlhCurrentTroop(id).name)+'</b></div></div><p class="nlh-source-note">Chỉ số tăng trưởng có phần mô phỏng.</p>'+nlhMobileSourcePanel(id)+nlhSkillPanel(id)+'<div class="nlh-feature-panel"><b>Chỉ số vào trận</b><p class="nlh-copy">'+Object.entries(d.combat).map(([k,v])=>({atk:'Công',catk:'Chiến công lực',matk:'Mưu công',def:'Vật phòng',tdef:'Chiến phòng',mdef:'Mưu phòng',maxHp:'HP',speed:'Tốc'}[k]||k)+' '+nlhFmt(v)).join(' · ')+'</p></div>';
 if(system==='training'){
 const q=nlhTrainQuote(id),need=Math.max(1,d.level*90),xp=d.xp||0;
 const controls=[1,5,10].map(n=>'<button class="nlh-button nlh-training-option" data-nlh-action="trainBatch" data-nlh-count="'+n+'" '+(d.level>=q.cap||battle||!nlhCanPay(q.cost,{})?'disabled':'')+'><b>Luyện ×'+n+'</b><small>Tối đa '+nlhFmt(q.xp*n)+' EXP</small><small>'+hsEsc(nlhCostText(Object.fromEntries(Object.entries(q.cost).map(([k,v])=>[k,v*n])),{}))+'</small></button>').join('');
 return '<div class="nlh-section-head"><span>Huấn Luyện · '+hsEsc(h.name)+'</span><span class="nlh-status">Cấp '+d.level+'/'+q.cap+'</span></div><h3 class="nlh-section-title">Tu luyện kinh nghiệm</h3>'+nlhProgress(xp,need,d.level>=q.cap?'Đã đạt giới hạn':'Kinh nghiệm tới cấp '+(d.level+1),d.level>=q.cap?100:xp/need*100)+'<div class="nlh-facts"><div class="nlh-fact"><small>EXP MỖI LƯỢT</small><b>+'+nlhFmt(q.xp)+'</b></div><div class="nlh-fact"><small>BẠC ĐANG CÓ</small><b>'+nlhFmt(game.silver)+'</b></div></div><div class="nlh-training-options">'+controls+'</div><p class="nlh-copy">Tự dừng khi đạt giới hạn hoặc thiếu tài nguyên. Chi phí trên là tối đa.</p><div class="nlh-action-row"><span>Giới hạn cấp '+q.cap+'</span><button class="nlh-button secondary" data-tab="city">Dưỡng tướng</button></div><p class="nlh-source-note">Đột phá / chuyển sinh tại Thành trì · thông số mô phỏng.</p>';
 }
 if(system==='troops'&&typeof window.__NL_HERO_TROOP_VIEW__==='function')return window.__NL_HERO_TROOP_VIEW__(id);
 if(system==='troops'){const troop=nlhCurrentTroop(id);return '<div class="nlh-section-head"><span>Binh Chủng · '+hsEsc(h.name)+'</span><span class="nlh-status">Bậc '+troop.tier+'</span></div><h3 class="nlh-section-title">'+hsEsc(troop.name)+'</h3><p class="nlh-copy">'+hsEsc(troop.description||'')+' · '+hsEsc(troop.kind)+'. Một võ tướng vẫn là một đơn vị logic; lính đi theo chỉ là sprite trình diễn.</p><div class="nlh-facts"><div class="nlh-fact"><small>CẤP DOANH TRẠI</small><b>'+nlhFmt(game.buildings?.barracks||1)+'</b></div><div class="nlh-fact"><small>QUÂN SỐ TƯỚNG</small><b>'+nlhFmt(d.troops)+'</b></div></div><p class="nlh-copy">Kho tham chiếu: 55 quân chủng Ngọa Long WEB; 25 ID và 18 nhánh tiến hóa của dự án. Hệ số chiến đấu chưa xác minh đều gắn SIMULATED.</p><button class="nlh-button" data-tab="barracks">Mở Doanh Trại · chọn quân chủng</button>';}
 if(system==='commander')return (typeof window.__NL_PREMIUM_ELITE_VIEW__==='function'?window.__NL_PREMIUM_ELITE_VIEW__():'')+'<div class="nlh-section-head"><span>Chỉ huy cá nhân · mô phỏng · '+hsEsc(h.name)+'</span><span class="nlh-status">'+hsEsc(nlhGateText(system))+'</span></div>'+nlhQuotePanel(system,id,dev.commanderLevel,skill.maxLevel,'Mỗi cấp: +1,2% Công/Thủ và +1 Tốc. SIMULATED.')+'<p class="nlh-source-note">Cần vượt 6 ải, Binh Thư Thống Soái và tài nguyên. Hệ này là thiết kế mới của dự án, không gán cho nguồn chính thức.</p>';
 if(system==='specialWeapon'&&nlhSourceWeapon(id))return nlhSourcePanel(id,'weapon');
 if(system==='specialWeapon')return '<div class="nlh-section-head"><span>Vũ Khí Đặc Biệt · '+hsEsc(h.name)+'</span><span class="nlh-status">'+hsEsc(nlhGateText(system))+'</span></div><h3 class="nlh-section-title">'+hsEsc(({guan:'Thanh Long Yển Nguyệt Đao',zhao:'Long Đảm Lượng Ngân Thương',zhang:'Trượng Bát Xà Mâu',cao:'Ỷ Thiên Kiếm',liu:'Song Cổ Kiếm',lu:'Phương Thiên Họa Kích','wiki-mobile-hero-083':'Bạch Vũ Phiến'})[id]||'Bảo Binh Bản Mệnh')+'</h3><p class="nlh-copy">Vũ khí riêng gắn theo ID tướng, tăng Vật Công/Chiến Công/Mưu Công đồng thời. SIMULATED; không chiếm ô trang bị thường.</p>'+nlhQuotePanel(system,id,dev.weaponLevel,skill.maxLevel,'Mỗi cấp: +2,5% Công và hiệu lực Chiến/Mưu Công.')+'<p class="nlh-source-note">Mở sau ải 8; Tinh Thiết Đặc Vũ và phí nâng cấp đều là dữ liệu dự án.</p>';
 if(system==='inheritance'&&nlhSourceSeal(id)){
 const seal=nlhSourceSeal(id),rank=dev.inheritanceLevel,cap=seal.skillDescs.length;
 return '<div class="nlh-section-head"><span>Ấn Kế Thừa · '+hsEsc(h.name)+'</span></div><div class="nlh-feature-panel"><b>'+hsEsc(seal.name)+'</b><p>'+seal.skillDescs.map((x,i)=>'<small>Lv '+(i+1)+(rank===i+1?' · Đang dùng':'')+' · '+hsEsc(x)+'</small>').join(' · ')+'</p>'+nlhQuotePanel(system,id,rank,cap,'Hiệu ứng theo cấp nguồn; phí nâng mô phỏng. Chỉ các mẫu hiệu ứng đã có adapter mới tác động combat.')+'</div>';
 }
 if(system==='inheritance')return '<div class="nlh-section-head"><span>Ấn Kế Thừa · '+hsEsc(h.name)+'</span><span class="nlh-status">'+hsEsc(nlhGateText(system))+'</span></div><h3 class="nlh-section-title">Dấu ấn truyền thừa</h3><p class="nlh-copy">Ấn riêng từng võ tướng, tăng sinh lực và phòng ngự trong trận thật. Lộ trình, cấp tối đa và hệ số đều SIMULATED.</p>'+nlhQuotePanel(system,id,dev.inheritanceLevel,skill.maxLevel,'Mỗi cấp: +3,5% HP và +1,5% Thủ.')+'<p class="nlh-source-note">Mở sau ải 12. Ấn Kế Thừa được cấp qua thưởng lần đầu vượt ải.</p>';
 if(system==='destiny'){
  const source=nlhSourcePanel(id,'destiny');if(source)return source;
  const opts=skill.options||[],opened=nlhIsOpen(system),names={war:'Thiên Uy',guard:'Long Thủ',tactic:'Tinh Cơ'};
  return '<div class="nlh-section-head"><span>Mệnh Cách · '+hsEsc(h.name)+'</span><span class="nlh-status">'+(opened?'Mở sau ải 24':'Khóa · 24')+'</span></div><h3 class="nlh-section-title">Chọn một mệnh cách đang trang bị</h3><p class="nlh-copy">Nguồn VNG Mobile xác nhận hệ Mệnh Cách mở ở Thành Chính cấp 400 và vật liệu gồm Đá Tôi Luyện, Mệnh Hồn Luyện Ngọc, Phôi. Mọi cấp/chi phí ở đây là SIMULATED.</p><div class="nlh-choice-grid">'+opts.map(o=>'<button class="nlh-choice '+(dev.destinyId===o.id?'selected':'')+'" data-nlh-action="destiny" data-nlh-destiny="'+o.id+'" '+(!opened||battle?'disabled':'')+'><b>'+hsEsc(o.name)+'</b><small>'+hsEsc(o.effect)+'</small></button>').join('')+'</div>'+(dev.destinyId?nlhQuotePanel(system,id,dev.destinyLevel,skill.maxLevel,names[dev.destinyId]+' · một lựa chọn được trang bị; SIMULATED.'):'<p class="nlh-source-note">Chọn một trong ba hướng sau khi mở hệ. Nguồn lịch sử công bố số lựa chọn khác nhau tùy phiên bản.</p>')+'<p class="nlh-source-note">Ngưỡng Mobile chính thức: cấp 400; chiến dịch 24 ải là đường mô phỏng riêng để game WEB hiện tại có thể mở.</p>';
 }
 if(system==='equipment'){
  const gear=game.gear?.[id]||{},slots=Object.entries(SLOT_NAME||{});return '<div class="nlh-section-head"><span>Trang Bị · '+hsEsc(h.name)+'</span><span class="nlh-status">'+Object.values(gear).filter(Boolean).length+'/7 ô</span></div><h3 class="nlh-section-title">Bảy vị trí trang bị</h3><div class="nlh-inline-list">'+slots.map(([slot,name])=>{const it=game.items?.find(x=>x.uid===gear[slot]),base=it&&EQUIPMENT[it.base];return '<div class="nlh-inline-row"><span>'+hsEsc(name)+'</span><b>'+(base?hsEsc(base.name)+' +'+it.lv:'Chưa trang bị')+'</b></div>';}).join('')+'</div><p class="nlh-copy">Trang bị dùng kho, cường hóa, mua và giao dịch Save hiện có.</p><button class="nlh-button" data-tab="equipment">Mở Kho Trang Bị</button>';
 }
 if(system==='formation'){
  const f=FORMATIONS?.[game.formation]||{};return '<div class="nlh-section-head"><span>Trận Pháp · '+hsEsc(h.name)+'</span><span class="nlh-status">'+game.slots.filter(Boolean).length+'/5 tướng</span></div><h3 class="nlh-section-title">'+hsEsc(f.name||game.formation)+'</h3><p class="nlh-copy">'+hsEsc(f.desc||'')+' · chỉ số hiện tại: Công '+Math.round((f.atk||0)*100)+'% · Thủ '+Math.round((f.def||0)*100)+'% · Mưu '+Math.round((f.int||0)*100)+'%.</p><div class="nlh-facts"><div class="nlh-fact"><small>TRẬN PHÁP NỀN ĐANG CHẠY</small><b>10 ID tương thích</b></div><div class="nlh-fact"><small>PRESET CHIẾN THUẬT DỰ ÁN</small><b>24 phương án</b></div></div><button class="nlh-button" data-tab="formation">Mở bàn Bày Trận</button><p class="nlh-source-note">Đây là hệ thống nền được giữ tương thích Save; chưa khẳng định cùng cơ chế Mobile. Giao diện không nhân đôi hiệu ứng.</p>';
 }
 if(system==='rewards'){
  const s=nlhsState(),recent=NL_HS.firstClearMaterialRewards[String(Math.min(28,nlhStage()+1))]||{};return '<div class="nlh-section-head"><span>Thưởng Võ Tướng</span><span class="nlh-status">'+nlhStage()+'/28 ải</span></div><h3 class="nlh-section-title">Thưởng phát triển theo mốc</h3><p class="nlh-copy">Vật liệu thưởng lần đầu theo mốc chiến dịch; có thể đổi thêm bằng tài nguyên kiếm được. Các số lượng vật liệu này là SIMULATED.</p><div class="nlh-facts"><div class="nlh-fact"><small>MỐC TIẾP THEO</small><b>Ải '+(Math.min(28,nlhStage()+1))+'</b></div><div class="nlh-fact"><small>GIAO DỊCH VẬT LIỆU</small><b>'+s.receipts.filter(x=>x.system==='rewards').length+'</b></div></div>'+nlhMaterials(recent)+'<button class="nlh-button" data-tab="quests">Mở nhiệm vụ và thưởng</button>'+nlhMaterialShopPanel();
 }
 if(system==='recruit'){
  const a=typeof nlARecruitPanel==='function'?nlARecruitPanel():'<p class="nlh-copy">Tửu Quán giữ luồng chiêu mộ hiện tại.</p>';const b=typeof nlHero207Panel==='function'?nlHero207Panel():'';return '<div class="nlh-section-head"><span>Chiêu Mộ</span><span class="nlh-status">'+(game.roster.length)+'/'+(typeof NL_CONTENT_C!=='undefined'?NL_CONTENT_C.counts.runtimeHeroes:221)+'</span></div><p class="nlh-copy">Chiêu mộ theo chiến dịch, Uy danh và Tháp. Không đổi ID hoặc Save. Điều kiện dự án được ghi SIMULATED.</p>'+a+b+(typeof nlContentCHeroPanel==='function'?nlContentCHeroPanel():'');
 }
 if(system==='awakening'){
  const mobile=nlhMobileAwakeningPanel(id);if(mobile)return mobile;
  const orange=dev.awakening.orange,gold=dev.awakening.gold,lv=game.hero?.[id]?.level||1,opened=nlhIsOpen('awakening');return '<div class="nlh-section-head"><span>Giác Ngộ · '+hsEsc(h.name)+'</span><span class="nlh-status">'+Number(orange+gold)+'/2</span></div><h3 class="nlh-section-title">Giác Ngộ và tiến hóa cao cấp</h3><p class="nlh-copy">Wiki Mobile xác nhận mở hệ Cam ở cấp Thành Chính 300, Vàng ở 380; vật liệu Vàng có ba tên bên dưới. Điều kiện từng tướng và số lượng không được nguồn xác nhận.</p><div class="nlh-feature-panel"><b class="nlh-feature-title">Giác Ngộ Cam · '+(orange?'Đã đạt':'Cấp '+lv+' · cần 20')+'</b><p class="nlh-copy">Dự án: mở sau ải 16 · +6% Công, +5% Binh · cần Tinh Phách Giác Ngộ ×1, 6.000 Bạc, 250 Chiến công.</p><button class="nlh-button" data-nlh-action="awakening" data-nlh-stage="orange" '+(!opened||orange||nlhStage()<16||lv<20||!nlhCanPay(nlhCurrency(1,'awakening-orange'),nlhMaterialCost(1,'awakening-orange'))||battle?'disabled':'')+'>'+(orange?'Đã Giác Ngộ Cam':!opened?'Mở sau ải 16':'Kích hoạt Cam')+'</button></div><div class="nlh-feature-panel"><b class="nlh-feature-title">Giác Ngộ Vàng · '+(gold?'Đã đạt':'Cấp '+lv+' · cần 30')+'</b><p class="nlh-copy">Dự án: cần Cam, vượt ải 22 · +8% Công/Thủ/Mưu · chi phí SIMULATED.</p><button class="nlh-button" data-nlh-action="awakening" data-nlh-stage="gold" '+(!orange||gold||nlhStage()<22||lv<30||!nlhCanPay(nlhCurrency(1,'awakening-gold'),nlhMaterialCost(1,'awakening-gold'))||battle?'disabled':'')+'>'+(gold?'Đã Giác Ngộ Vàng':!orange?'Cần Cam trước':'Kích hoạt Vàng')+'</button></div><p class="nlh-source-note">Ngưỡng Mobile chính thức khác với mốc chiến dịch mô phỏng. Tên vật liệu Vàng: Quỳnh Tương, Xích Quả, Hoàng Trung Lý; số lượng áp dụng là dự án thiết kế.</p>'+nlhEndgamePanel(id);
 }
 return '<div class="nlh-section-head"><span>'+hsEsc(skill?.label||system)+'</span></div>';
}
function renderNlhHeroScreen(){
 const s=nlhsState(),heroId=nlhOwned(s.selectedHero)?s.selectedHero:(game.roster.find(nlhOwned)||'liu'),system=PICKABLE.includes(s.selectedSystem)?s.selectedSystem:'hero';
 return '<div class="nlh-root" data-nlh-screen="1" data-premium-system="'+system+'">'+nlhRoster(heroId)+'<main class="nlh-main">'+nlhPremiumStage(system,heroId)+'<div class="nlh-detail"><section class="nlh-main-body" data-nlh-system-body="'+system+'">'+nlhSystemBody(system,heroId)+(['specialWeapon','inheritance','destiny','commander','awakening','rewards'].includes(system)?'<details class="nlh-material-drawer"><summary>Nguyên liệu đang có</summary>'+nlhMaterialsBar()+'</details>':'')+'</section><div class="nlh-detail-pager" aria-label="Trang chi tiết"><button data-nlh-page="prev" aria-label="Trang trước">‹</button><span></span><button data-nlh-page="next" aria-label="Trang sau">›</button></div></div></main>'+nlhSystemMenu(system,heroId)+'</div>';
}
document.addEventListener('click',e=>{
 const b=e.target.closest?.('[data-nlh-action]');if(!b||b.disabled)return;const action=b.dataset.nlhAction;
 if(action==='hero')nlhSelectHero(b.dataset.nlhHero);
 else if(action==='system')nlhSelectSystem(b.dataset.nlhTarget);
 else if(action==='upgrade')nlhUpgrade(b.dataset.nlhSystem,nlhsState().selectedHero);
 else if(action==='destiny')nlhPickDestiny(b.dataset.nlhDestiny,nlhsState().selectedHero);
 else if(action==='awakening')nlhUpgrade('awakening',nlhsState().selectedHero,b.dataset.nlhStage);
 else if(action==='trainBatch')nlhTrainBatch(nlhsState().selectedHero,Number(b.dataset.nlhCount));
 else if(action==='skillUpgrade')nlhSkillUpgrade(nlhsState().selectedHero);
 else if(action==='ancient')nlhAncientUpgrade(nlhsState().selectedHero);
 else if(action==='illusion')nlhIllusionChoose(nlhsState().selectedHero,b.dataset.nlhMode);
 else if(action==='sourceUpgrade')nlhSourceUpgrade(nlhsState().selectedHero,b.dataset.nlhKind,b.dataset.nlhName);
 else if(action==='sourceEquip')nlhSourceEquip(nlhsState().selectedHero,b.dataset.nlhName);
 else if(action==='materialBuy')nlhMaterialBuy(b.dataset.nlhMaterial);
 else if(action==='mobileMaterial')nlMobileHeroApi.buyMaterial(nlhsState().selectedHero,b.dataset.nlhName,Number(b.dataset.nlhCount));
 else if(action==='mobileAwaken')nlMobileHeroApi.awaken(nlhsState().selectedHero);
 else if(action==='developmentReset'){const id=nlhsState().selectedHero,token=b.dataset.nlhMode,q=nlItemConsumableApi.heroDevelopmentRefundQuote(game,id,token);if(!battle&&q&&window.confirm('Hạ chức '+q.plan.length+' nhóm có đủ chứng từ và hoàn trả '+q.rate+'%?')){const nonce=nlItemHydrate().actionNonce+1;nlItemApply(nlItemConsumableApi.resetHeroDevelopment(game,id,token,'nli:ui:'+nonce),{actionNonce:nonce});}}
 else if(action==='mobileReset'){const id=nlhsState().selectedHero,kind=b.dataset.nlhMode,q=nlMobileHeroApi.resetQuote(id,kind);if(q&&window.confirm('Hạ phẩm chất '+q.from+' về '+q.to+' và dùng một lệnh?'))nlMobileHeroApi.reset(id,kind);}
 else if(action==='artMode')nlhSetArtMode(nlhsState().selectedHero,b.dataset.nlhMode);
});

/* One battlefield, full viewport; reuse native buttons and replay state. */
let detailKey='',detailScroll=0,detailPending=false;
function bindPremiumDetail(){
 detailPending=false;
 const body=document.querySelector('.nlh-main-body'),pager=document.querySelector('.nlh-detail-pager');if(!body||!pager)return;
 const key=(game.heroDevelopment?.selectedHero||'')+':'+body.dataset.nlhSystemBody;
 if(key!==detailKey){detailKey=key;detailScroll=0;}
 body.scrollTop=detailScroll;
 const refresh=()=>{const total=Math.max(1,Math.ceil(body.scrollHeight/Math.max(1,body.clientHeight))),page=Math.min(total,1+Math.floor((body.scrollTop+2)/Math.max(1,body.clientHeight)));pager.hidden=total<=1;pager.querySelector('span').textContent='Trang '+page+'/'+total;pager.querySelector('[data-nlh-page="prev"]').disabled=body.scrollTop<=2;pager.querySelector('[data-nlh-page="next"]').disabled=body.scrollTop+body.clientHeight>=body.scrollHeight-3;};
 if(!body.dataset.premiumPagerBound){body.dataset.premiumPagerBound='1';body.addEventListener('scroll',()=>{detailScroll=body.scrollTop;refresh()},{passive:true});}
 refresh();
}
function schedulePremiumDetail(){if(detailPending||typeof requestAnimationFrame!=='function')return;detailPending=true;requestAnimationFrame(bindPremiumDetail);}
const premiumView=document.getElementById('view');if(premiumView&&typeof MutationObserver==='function'){new MutationObserver(schedulePremiumDetail).observe(premiumView,{childList:true});if(typeof window.addEventListener==='function')window.addEventListener('resize',schedulePremiumDetail);schedulePremiumDetail();}
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nlh-page]');if(!b||b.disabled)return;const body=b.closest('.nlh-detail')?.querySelector('.nlh-main-body');if(body){body.scrollTop+=(b.dataset.nlhPage==='next'?1:-1)*Math.max(1,body.clientHeight-24);detailScroll=body.scrollTop;schedulePremiumDetail();}});
if(typeof renderBattleShell==='function'){
const premiumPriorBattleShell=renderBattleShell;
renderBattleShell=function(){
 const out=premiumPriorBattleShell.apply(this,arguments);
 const root=document.querySelector('#battle-mount .battle-window');
 if(!root||!battle||battle.mode==='cltq')return out;
 root.classList.add('nl-premium-battle');
 const left=NATIONS[game.nation]?.name||'Đồng minh',right=battle.mode==='arena'?'Đối thủ':'Quân địch';
 const header=root.querySelector('.battle-head');
 if(header&&!header.querySelector('.nl-premium-versus')){const banner=document.createElement('div');banner.className='nl-premium-versus';banner.innerHTML='<span>'+hsEsc(left)+'</span><b>VS</b><span>'+hsEsc(right)+'</span>';header.prepend(banner);}
 return out;
};
}
const NLH_NAV_ICON_PATH={
 city:'<path d="M3 10h18v10H3zM2 10l10-7 10 7M7 13v3m5-3v3m5-3v3M8 20v-4h8v4"/>',
 formation:'<path d="M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15h5v5h-5z"/>',
 campaign:'<path d="M4 21V4m1 1h13l-3 4 3 4H5"/>',
 heroes:'<path d="M12 3l2.4 4.8 5.3.8-3.9 3.8.9 5.3-4.7-2.5-4.7 2.5.9-5.3-3.9-3.8 5.3-.8zM4 21c1.8-2.7 4.3-4 8-4s6.2 1.3 8 4"/>',
 barracks:'<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6zM12 7v10M8 10h8"/>',
 tech:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.6v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.4v-2.6h.1A1.7 1.7 0 0 0 8 10a1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V5h2.6v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1A1.7 1.7 0 0 0 19.4 10a1.7 1.7 0 0 0 1.5 1h.1v2.6h-.1a1.7 1.7 0 0 0-1.5 1.4z"/>',
 equipment:'<path d="M5 20 17 8m-3-3 4-4 4 4-4 4M3 17l4 4M6 4l4 4m-3-6 5 5"/>',
 tower:'<path d="M4 20h16M6 16h12M8 12h8M10 8h4M12 3v5M7 16l5-4 5 4M9 20v-4m6 4v-4"/>',
 arena:'<path d="M12 3l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8zM3 20c2-2 4-3 6-3m12 3c-2-2-4-3-6-3"/>',
 world:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18M5 7h14m-14 10h14"/>',
 quests:'<path d="M6 3h12v18l-6-3-6 3zM9 8h6m-6 4h6"/>',
 nation:'<path d="M4 21V4m1 1h13l-3 4 3 4H5m2 8h10"/>',
 replays:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m10 8 6 4-6 4zM7 4v16m10-16v16"/>',
 journal:'<path d="M4 5a3 3 0 0 1 3-2h13v17H7a3 3 0 0 0-3 2zM4 5v15m4-13h8m-8 4h8"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5a1.6 1.6 0 0 0 .8 1.4l.2.1-1.8 3.1-.2-.1a1.6 1.6 0 0 0-1.6.1 1.6 1.6 0 0 0-.8 1.4v.2h-3.6v-.2a1.6 1.6 0 0 0-.8-1.4 1.6 1.6 0 0 0-1.6-.1l-.2.1-1.8-3.1.2-.1a1.6 1.6 0 0 0 .8-1.4 1.6 1.6 0 0 0-.8-1.4l-.2-.1 1.8-3.1.2.1a1.6 1.6 0 0 0 1.6-.1 1.6 1.6 0 0 0 .8-1.4v-.2h3.6v.2a1.6 1.6 0 0 0 .8 1.4 1.6 1.6 0 0 0 1.6.1l.2-.1 1.8 3.1-.2.1a1.6 1.6 0 0 0-.8 1.4z"/>',
 default:'<path d="M4 5h16v14H4zM8 9h8m-8 4h8m-8 3h5"/>'
};
if(typeof renderSidebar==='function'){
 const nlhRenderSidebar=renderSidebar;
 renderSidebar=function(){nlhRenderSidebar.apply(this,arguments);document.querySelectorAll('.nav[data-tab] .ico').forEach(icon=>{const tab=icon.parentElement?.dataset.tab||'default',path=NLH_NAV_ICON_PATH[tab]||NLH_NAV_ICON_PATH.default;icon.innerHTML='<svg class="nl-nav-icon" viewBox="0 0 24 24" aria-hidden="true"><g>'+path+'</g></svg>';icon.setAttribute('aria-hidden','true');});};
 if(document.querySelector('#sidebar'))renderSidebar();
}
const nlhPriorHeroes=renderHeroes;renderHeroes=function(){return renderNlhHeroScreen();};
if(window.__P2_ENABLE_QA__)window.__NL_HERO_SYSTEMS_QA__=Object.freeze({config:NL_HS,state:()=>structuredClone(nlhsState()),selectHero:nlhSelectHero,selectSystem:nlhSelectSystem,setArtMode:nlhSetArtMode,upgrade:nlhUpgrade,pickDestiny:nlhPickDestiny,stats:nlhHeroStats,combatGrowth:nlhCombatGrowth,sourceModifiers:nlhSourceModifiers,sourceUpgrade:nlhSourceUpgrade,sourceEquip:nlhSourceEquip,sourceQuote:nlhSourceQuote,trainBatch:nlhTrainBatch,trainQuote:nlhTrainQuote,skillUpgrade:nlhSkillUpgrade,skillDescriptor:nlhSkillDescriptor,ancientUpgrade:nlhAncientUpgrade,illusionChoose:nlhIllusionChoose,materialBuy:nlhMaterialBuy,unit:(id,slot=0,stage=1)=>p2Unit(id,'p',slot,stage),art:id=>({portrait:!!nlhArt(id).portrait,splash:!!nlhArt(id).splash,character:!!nlhArt(id).character}),render:renderNlhHeroScreen,materials:()=>structuredClone(nlhsState().materials)});
})();
// === END NL-HERO-SYSTEMS-V1 ===
