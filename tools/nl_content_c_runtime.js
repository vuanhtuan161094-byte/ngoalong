// === NL-CONTENT-C-V1: sourced roster and project-simulated native P2 expansion ===
const NL_CONTENT_C=__NL_CONTENT_C_DATA__;
const NL_C_TIER4=__NL_CONTENT_C_TIER4__;
const NL_CONTENT_C_TOWER=__NL_TOWER_DATA__;
let nlContentCSettle,nlContentCHeroPanel,nlMobileHeroApi,nlMobileHeroBuildModifiers;
(()=>{
'use strict';
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x), nat=x=>Number.isSafeInteger(x)&&x>=0?x:0, clamp=(v,l,h)=>Math.min(h,Math.max(l,v));
const owned=id=>game.roster.includes(id)&&!!game.hero[id];
const MOBILE_TROOPS=NL_CONTENT_C.mobileTroops;
const MOBILE_HERO_SOURCE=NL_CONTENT_C.mobileHeroSource;
const MOBILE_BEAUTIES=NL_CONTENT_C.mobileBeauties||{beauties:{},exp:{},gifts:[]};
const BEAUTY_STAT={'Tăng Vật Công':'atk','Tăng Pháp Công':'catk','Tăng Mưu Công':'matk','Tăng Vật Phòng':'def','Tăng Pháp Phòng':'tdef','Tăng Mưu Phòng':'mdef'};
function mobileBeautyLevel(id){return clamp(nat(state().mobileBeautyLevels[id]),0,(MOBILE_BEAUTIES.beauties[id]?.growth?.length||1)-1);}
function mobileBeautyQuote(id){
 const b=MOBILE_BEAUTIES.beauties[id],lv=mobileBeautyLevel(id),t=b&&MOBILE_BEAUTIES.exp[String(b.tier)],next=lv+1;
 if(!b||!t||next>=b.growth.length)return null;
 return {next,exp:t.exp[next],material:t.material[next],stat:b.statName,value:b.growth[next],classification:'SOURCE_TABLE_DESTINATION_LEVEL_ADAPTER'};
}
function mobileBeautyGift(id,giftId,qty){
 const b=MOBILE_BEAUTIES.beauties[id],gift=MOBILE_BEAUTIES.gifts.find(g=>g.id===giftId&&g.famousType===0),s=state();
 if(battle||!b||!gift||!Number.isSafeInteger(qty)||qty<1||qty>1000||!mobileBeautyQuote(id)||!(game.nlCity?.levels?.nl_city_manor>=1))return false;
 // Wiki provides gift EXP and score requirements, not a public earned-only price.
 const have=nat(s.mobileBeautyExp[id]),lv=mobileBeautyLevel(id),score=MOBILE_BEAUTIES.exp[String(b.tier)].exp.slice(1,lv+1).reduce((a,v)=>a+v,0)+have;
 if(score<gift.needScore)return false;
 const added=gift.effect*qty,silver=added*2;
 if(!Number.isSafeInteger(have+added)||!payment({silver}))return false;
 s.mobileBeautyExp[id]=have+added;save();render();return true;
}
function mobileBeautyBuyPendants(qty){
 const s=state();if(battle||!(game.nlCity?.levels?.nl_city_manor>=1)||!Number.isSafeInteger(qty)||qty<1||qty>1000||!payment({silver:1000*qty,merit:10*qty}))return false;
 s.mobileBeautyPendants+=qty;save();render();return true;
}
function mobileBeautyUpgrade(id){
 const s=state(),q=mobileBeautyQuote(id);
 if(battle||!q||!(game.nlCity?.levels?.nl_city_manor>=1)||nat(s.mobileBeautyExp[id])<q.exp||s.mobileBeautyPendants<q.material)return false;
 s.mobileBeautyExp[id]-=q.exp;s.mobileBeautyPendants-=q.material;s.mobileBeautyLevels[id]=q.next;save();render();return true;
}
function mobileBeautyAssign(heroId,id){
 const s=state();if(battle||(state().mobileChild?.stage==='expecting'&&state().mobileChild.parent===heroId&&state().mobileChild.beauty!==id)||!owned(heroId)||!MOBILE_BEAUTIES.beauties[id]||mobileBeautyLevel(id)<1||Object.entries(s.mobileBeautyAssigned).some(([h,v])=>h!==heroId&&v===id))return false;
 s.mobileBeautyAssigned[heroId]=id;save();render();return true;
}
function mobileBeautyBonus(id){
 const selected=state().mobileBeautyAssigned[id],b=MOBILE_BEAUTIES.beauties[selected],level=mobileBeautyLevel(selected);
 if(!b||!level||!BEAUTY_STAT[b.statName])return null;
 return {id:selected,name:b.name,level,stat:BEAUTY_STAT[b.statName],raw:b.growth[level],flat:b.growth[level]*.001};
}
// Quý Tử: first two school phases. Source caps and daily allowance are retained;
 // offline season clock, probability bands, and mastery gate are explicitly simulated.
const MOBILE_CHILDREN=NL_CONTENT_C.mobileChildren||{order:[],stages:{}};
const CHILD_SCHOOL=[
 ['lead','base','Đá Cầu'],['lead','base','Đánh Cờ'],['lead','base','Chèo Thuyền'],['lead','base','Đua Ngựa'],
 ['lead','growth','Xây Thành'],['lead','growth','Liệt Trận'],['lead','growth','Thủy Chiến'],['lead','growth','Xung Phong'],
 ['war','base','Xạ Tiễn'],['war','base','Đấu Vật'],['war','base','Cưỡi Ngựa'],['war','base','Múa Kiếm'],
 ['war','growth','Thương Côn'],['war','growth','Thợ Mộc'],['war','growth','Cưỡi Ngựa Bắn Cung'],['war','growth','Săn Bắt'],
 ['intellect','base','Đọc Sách'],['intellect','base','Học Lễ'],['intellect','base','Tập Viết'],['intellect','base','Luận Bàn'],
 ['intellect','growth','Bày Mưu'],['intellect','growth','Đọc Binh Thư'],['intellect','growth','Học Kế'],['intellect','growth','Nghiên Cứu']
];
const CHILD_LANES=['Hỗ Trợ','Vật Lý','Chiến Pháp','Kế Sách'];
const CHILD_DAY=86400000;
function childDay(now){return Math.floor((now+3*3600000)/CHILD_DAY);}
function childState(){const s=state();if(!obj(s.mobileChild))s.mobileChild={stage:'none'};return s.mobileChild;}
function childAllowance(now=Date.now()){
 const c=childState(),day=childDay(now);
 if(c.stage!=='school1'&&c.stage!=='school2')return 0;
 if(!Number.isInteger(c.lastDay)){c.lastDay=day;c.tickets=12;}
 if(day>c.lastDay){c.tickets=Math.min(30,nat(c.tickets)+12*(day-c.lastDay));c.lastDay=day;}
 return nat(c.tickets);
}
function childStart(parent,now=Date.now()){
 const c=childState(),s=state(),beauty=s.mobileBeautyAssigned[parent];
 if(battle||c.stage!=='none'||!owned(parent)||!beauty||mobileBeautyLevel(beauty)<10||!(game.nlCity?.levels?.nl_city_manor>=1))return false;
 s.mobileChild={stage:'expecting',parent,beauty,readyAt:now+3*CHILD_DAY};save();render();return true;
}
function childBirth(name,now=Date.now()){
 const c=childState();
 if(battle||c.stage!=='expecting'||now<c.readyAt||typeof name!=='string'||!name.trim()||name.trim().length>24)return false;
 Object.assign(c,{stage:'school1',name:name.trim(),attempts:0,secondAttempts:0,lastDay:childDay(now),tickets:12,base:{lead:0,war:0,intellect:0},growth:{lead:10,war:10,intellect:10},mastery:{},favorite:Math.floor(now/1000)%24,reroll:0});
 save();render();return true;
}
function childHash(n){let x=Math.imul(n+1,2654435761)>>>0;x^=x>>>16;x=Math.imul(x,2246822519)>>>0;return (x^(x>>>13))>>>0;}
function childCards(){
 const c=childState(),offset=childHash(nat(c.attempts)+37*nat(c.reroll))%24;
 return Array.from({length:4},(_,i)=>{const id=(offset+7*i)%24,t=CHILD_SCHOOL[id],band=childHash(id+nat(c.attempts)*31+nat(c.reroll)*71)%3;
  return {id,name:t[2],stat:t[0],kind:t[1],band,amount:t[1]==='base'?[3,4,5][band]:[5,8,10][band],chance:[.95,.8,.65][band],favorite:id===c.favorite};
 });
}
function childTrain(cardId,guaranteed=false,now=Date.now()){
 const c=childState(),card=childCards().find(x=>x.id===cardId);
 if(battle||c.stage!=='school1'||c.attempts>=120||childAllowance(now)<1||!card)return false;
 if(guaranteed&&!card.favorite&&!payment({gold:10}))return false;
 const success=card.favorite||guaranteed||childHash(c.attempts*101+card.id*11+nat(c.reroll))%10000/10000<card.chance;
 c.tickets--;c.attempts++;c.reroll=0;
 if(success){const dst=card.kind==='base'?c.base:c.growth,cap=card.kind==='base'?100:310;dst[card.stat]=Math.min(cap,nat(dst[card.stat])+card.amount);}
 if(c.attempts===120)c.stage='school2';
 c.lastTraining={name:card.name,success};save();render();return true;
}
function childReroll(now=Date.now()){
 const c=childState();if(battle||c.stage!=='school1'||childAllowance(now)<1||nat(c.reroll)>0&&!payment({gold:2}))return false;
 c.reroll=nat(c.reroll)+1;save();render();return true;
}
function childSecond(lane,now=Date.now()){
 const c=childState();
 if(battle||c.stage!=='school2'||!CHILD_LANES.includes(lane)||c.secondAttempts>=48||childAllowance(now)<1)return false;
 c.tickets--;c.secondAttempts++;c.mastery[lane]=nat(c.mastery[lane])+1;
 if(c.secondAttempts===48)c.stage='chooseSkill';save();render();return true;
}
function childSkills(){
 const c=childState(),max=Math.max(0,...Object.values(c.mastery||{}));
 return Object.entries(MOBILE_CHILDREN.stages?.xuatSu||{}).filter(([id,x])=>max>0&&nat(c.mastery[x.category])===max);
}
const MOBILE_CHILD_ID='mobile-quy-tu';
const CHILD_PHASE_NAMES={xuatSu:'Xuất Sư',thucTinh:'Thức Tỉnh',renLuyen:'Rèn Luyện',chuChinh:'Chủ Chính',giamQuoc:'Giám Quốc'};
const CHILD_PHASE_RULES=[{commander:0,level:1,silver:0,merit:0},{commander:220,level:20,silver:20000,merit:500},{commander:300,level:30,silver:40000,merit:1000},{commander:380,level:40,silver:80000,merit:2000},{commander:420,level:40,silver:160000,merit:4000}];
function childSkillDescriptor(c){
 const current=MOBILE_CHILDREN.stages?.[c.phase||'xuatSu']?.[c.skillId];
 if(!current)return null;
 const role=({ 'Hỗ Trợ':'support','Vật Lý':'infantry','Chiến Pháp':'cavalry','Kế Sách':'strategist'})[current.category]||'infantry';
 const d=descriptor(current,role,false,[]);
 if(d.sourceSkillClassification?.startsWith('SIMULATED_FALLBACK'))return {...inferredDescriptor(current.name,role,false),sourceDescription:current.desc,sourceSkillClassification:'SIMULATED_CHILD_FALLBACK'};
 return {...d,nlMobileHeroSkill:true};
}
function childSyncRoster(){
 const c=game.nlContentC?.mobileChild;if(c?.stage!=='graduated'){delete HEROES[MOBILE_CHILD_ID];delete P2_SKILLS[MOBILE_CHILD_ID];return false;}
 const current=MOBILE_CHILDREN.stages?.[c.phase||'xuatSu']?.[c.skillId];if(!current)return false;
 const role=({'Hỗ Trợ':'support','Vật Lý':'infantry','Chiến Pháp':'cavalry','Kế Sách':'strategist'})[current.category]||'infantry';
 const attrs=c.base||{},p={id:MOBILE_CHILD_ID,name:c.name||'Quý Tử',role:current.category,type:role,rarity:'Quý Tử',icon:'📜',lead:Math.max(20,nat(attrs.lead)),atk:Math.max(20,nat(attrs.war)),int:Math.max(20,nat(attrs.intellect)),def:Math.max(20,Math.round((nat(attrs.lead)+nat(attrs.war))/2)),agi:60,skill:current.name,skillDesc:current.desc,provenance:{classification:'SIMULATED_CHILD_UNIT_WITH_SOURCE_SKILL'}};
 HEROES[MOBILE_CHILD_ID]=p;P2_SKILLS[MOBILE_CHILD_ID]=childSkillDescriptor(c);
 if(!game.hero[MOBILE_CHILD_ID])game.hero[MOBILE_CHILD_ID]=c.savedHero&&typeof c.savedHero==='object'?structuredClone(c.savedHero):{level:1,xp:0,troops:160};
 if(!game.roster.includes(MOBILE_CHILD_ID))game.roster.push(MOBILE_CHILD_ID);
 if(!game.troopModes[MOBILE_CHILD_ID])game.troopModes[MOBILE_CHILD_ID]=role;
 return true;
}
function childGraduate(id){
 const c=childState(),skill=childSkills().find(x=>x[0]===id)?.[1];
 if(battle||c.stage!=='chooseSkill'||!skill)return false;
 c.stage='graduated';c.phase='xuatSu';c.skillId=id;c.skillName=skill.name;c.skillDesc=skill.desc;childSyncRoster();save();render();return true;
}
function childNextPhase(){
 const c=childState(),index=MOBILE_CHILDREN.order.indexOf(c.phase||'xuatSu'),next=MOBILE_CHILDREN.order[index+1],q=CHILD_PHASE_RULES[index+1],current=MOBILE_CHILDREN.stages?.[c.phase||'xuatSu']?.[c.skillId];
 if(c.stage!=='graduated'||!next||!q||!current)return null;
 return {...q,phase:next,name:CHILD_PHASE_NAMES[next],choices:Object.entries(MOBILE_CHILDREN.stages[next]||{}).filter(([,x])=>x.category===current.category).map(([id,x])=>({id,name:x.name,desc:x.desc}))};
}
function childPromote(skillId){
 const c=childState(),q=childNextPhase(),choice=q?.choices.find(x=>x.id===skillId);
 if(battle||!q||!choice||state().mobileCommanderLevel<q.commander||(game.hero[MOBILE_CHILD_ID]?.level||0)<q.level||!payment({silver:q.silver,merit:q.merit}))return false;
 c.phase=q.phase;c.skillId=choice.id;c.skillName=choice.name;c.skillDesc=choice.desc;childSyncRoster();save();render();return true;
}
const childPriorSave=save;
save=function(){const c=game.nlContentC?.mobileChild;if(c?.stage==='graduated'&&game.hero?.[MOBILE_CHILD_ID])c.savedHero=structuredClone(game.hero[MOBILE_CHILD_ID]);return childPriorSave.apply(this,arguments);};
const childPriorRender=render;
render=function(){childSyncRoster();return childPriorRender.apply(this,arguments);};
// Source-backed late-game training. Exact quantities/relations; offline acquisition and assignment scope explicitly simulated.
const MOBILE_BOOKS=NL_CONTENT_C.mobileBooks?.books||[],BOOKS=new Map(MOBILE_BOOKS.map(x=>[String(x.key),x]));
const MOBILE_HORSES=NL_CONTENT_C.mobileHorses?.horses||[],HORSES=new Map(MOBILE_HORSES.map(x=>[String(x.key),x]));
const MOBILE_ETCH=NL_CONTENT_C.mobileEtch?.items||[],ETCH=new Map(MOBILE_ETCH.map(x=>[x.id,x]));
const MOBILE_NGOC='mobile-vng-resource-res_16';
function bookGrade(id){return clamp(nat(state().bookGrades[id]),0,BOOKS.get(id)?.grades.length||0);}
function bookLevel(id){const b=BOOKS.get(id),g=bookGrade(id);return clamp(nat(state().bookLevels[id]),0,b?.grades[g]?.levels.length||0);}
function bookQuote(id){
 const b=BOOKS.get(id),g=bookGrade(id),row=b?.grades[g],lv=bookLevel(id);
 return row?{grade:g+1,fragment:row.frag,exp:row.levels.slice(lv).reduce((n,x)=>n+x.exp,0),levels:row.levels.slice(lv),gate:b.unlockLevel}:null;
}
function bookStepQuote(id){const q=bookQuote(id),lv=bookLevel(id);if(!q)return null;
 return q.levels.length?{grade:q.grade,level:lv+1,exp:q.levels[0].exp,fragment:0,gate:q.gate,complete:false}:{grade:q.grade,level:0,exp:0,fragment:q.fragment,gate:q.gate,complete:true};}
function bookStep(id){const s=state(),q=bookStepQuote(id);if(battle||!q||s.mobileCommanderLevel<q.gate||s.bookFragments<q.fragment||s.bookExp<q.exp)return false;
 s.bookFragments-=q.fragment;s.bookExp-=q.exp;
 if(q.complete){s.bookGrades[id]=q.grade;s.bookLevels[id]=0;}else s.bookLevels[id]=q.level;
 save();render();return true;}
function bookUpgrade(id){const s=state(),q=bookQuote(id);if(battle||!q||s.mobileCommanderLevel<q.gate||s.bookFragments<q.fragment||s.bookExp<q.exp)return false;
 s.bookFragments-=q.fragment;s.bookExp-=q.exp;s.bookGrades[id]=q.grade;s.bookLevels[id]=0;save();render();return true;}
function horseTier(id){const h=HORSES.get(id);return h?clamp(nat(state().horseTiers[id]),0,h.tiers.length-1):0;}
function horseStar(id){const h=HORSES.get(id),t=horseTier(id);return clamp(nat(state().horseStars[id]),0,h?.tiers[t]?.top?0:Math.max(0,(h?.tiers[t]?.star||1)-1));}
function horseGate(id,tier){
 const h=HORSES.get(id);if(!h?.tiers[tier])return false;
 const text=h.tiers[tier].unlock||'',city=text.match(/Thành Chính(?: đạt)?(?: Lv)?\s*(\d+)/i);
 if(city&&state().mobileCommanderLevel<Number(city[1]))return false;
 let rest=text.replace(/Thành Chính(?: đạt)?(?: Lv)?\s*\d+/i,'').replace(/^\s*·\s*/,'').trim();
 if(!rest||rest==='Mở ngay')return true;
 for(const part of rest.split('·').map(x=>x.trim())){
  const m=part.match(/^(.+?)\s+(?:đạt\s+)?bậc\s+(\d+)(?:[\s-]+(\d+)\s*sao)?$/i);
  if(!m)return false;const alias=m[1]==='Trọng Kỵ La Mã'?'Trọng Kỵ Roma':m[1],p=MOBILE_HORSES.find(x=>x.name===alias);
  if(!p)return false;const t=horseTier(String(p.key)),star=horseStar(String(p.key)),need=Number(m[2]);
  if(t<need||(t===need&&star<Number(m[3]||0)))return false;
 }
 return true;
}
// Only the total points per tier are published. Per-star split is simulated, exactly conserving that total.
function horseSpent(row,stars){return Math.floor(row.points*stars/row.star);}
function horseQuote(id){const h=HORSES.get(id),t=horseTier(id),row=h?.tiers[t],star=horseStar(id);return row&&!row.top&&h.tiers[t+1]?{from:t,to:t+1,points:row.points-horseSpent(row,star),gate:horseGate(id,t)&&horseGate(id,t+1)}:null;}
function horseStepQuote(id){
 const h=HORSES.get(id),t=horseTier(id),row=h?.tiers[t],star=horseStar(id);
 if(!row||row.top||!h.tiers[t+1])return null;
 const complete=star+1===row.star;
 return {tier:t,star:star+1,complete,points:horseSpent(row,star+1)-horseSpent(row,star),gate:horseGate(id,t)&&(!complete||horseGate(id,t+1))};
}
function horseStep(id){const s=state(),q=horseStepQuote(id);if(battle||!q?.gate||s.horsePoints<q.points)return false;
 s.horsePoints-=q.points;if(q.complete){s.horseTiers[id]=q.tier+1;s.horseStars[id]=0;}else s.horseStars[id]=q.star;save();render();return true;}
function horseUpgrade(id){const s=state(),q=horseQuote(id);if(battle||!q?.gate||s.horsePoints<q.points)return false;
 s.horsePoints-=q.points;s.horseTiers[id]=q.to;s.horseStars[id]=0;save();render();return true;}
function trainingAssign(kind,hero,id){
 const s=state(),wallet=kind==='book'?s.bookAssigned:kind==='horse'?s.horseAssigned:null;
 if(!wallet||battle||!owned(hero)||Object.entries(wallet).some(([h,v])=>h!==hero&&v===id))return false;
 if(kind==='book'?!BOOKS.has(id)||bookGrade(id)<1:!HORSES.has(id)||!horseGate(id,0))return false;
 if(wallet[hero]===id)return false;wallet[hero]=id;save();render();return true;
}
function trainingBuy(kind,n){
 if(battle||!Number.isSafeInteger(n)||n<=0||n>10000000)return false;
 const s=state(),rates={fragment:['bookFragments',150],exp:['bookExp',2],horse:['horsePoints',1]};
 const pair=rates[kind];if(!pair||!payment({silver:n*pair[1]}))return false;s[pair[0]]+=n;save();render();return true;
}
// Earned-only daily training rewards: single claim per milestone and day.
const DAILY_TRAINING=[{wins:3,fragment:15,exp:15000,horse:50000,ngoc:100,stone:1},{wins:6,fragment:25,exp:25000,horse:100000,ngoc:200,stone:2},{wins:10,fragment:40,exp:40000,horse:200000,ngoc:350,stone:3}];
function trainingDaily(){const s=state(),day=dayId();if(s.trainingDaily?.day!==day)s.trainingDaily={day,wins:0,claimed:{}};return s.trainingDaily;}
function trainingVictory(){const d=trainingDaily();d.wins=Math.min(10,nat(d.wins)+1);}
function trainingClaim(index){
 const q=DAILY_TRAINING[index],d=trainingDaily();
 if(battle||!q||d.wins<q.wins||d.claimed[index]||typeof nlItemApi==='undefined')return false;
 // Inventory grant is the atomic owner. A failed capacity check leaves the entire reward pending.
 const receipt='nl-training:'+d.day+':'+index;
 const result=nlItemApi.grant(game,[{id:MOBILE_NGOC,quantity:q.ngoc},{id:'mobile-vng-resource-res_62',quantity:q.stone}],receipt);
 if(!result.ok||result.duplicate)return false;
 Object.assign(game,result.state);
 const s=state();s.bookFragments+=q.fragment;s.bookExp+=q.exp;s.horsePoints+=q.horse;trainingDaily().claimed[index]=true;
 save();render();return true;
}
function etchCount(id){return nat(state().etchStacks[id]);}
function etchTake(id,n){const s=state();s.etchStacks[id]-=n;if(!s.etchStacks[id])delete s.etchStacks[id];}
function etchBuy(attr){const id=attr+'-1-1',s=state();if(battle||!ETCH.has(id)||s.mobileCommanderLevel<100||!payment({silver:1000}))return false;s.etchStacks[id]=etchCount(id)+1;save();render();return true;}
function etchQuote(id,kind){
 if(!['upgrade','mix'].includes(kind))return null;
 const r=ETCH.get(id),link=kind==='upgrade'?r?.upgrade:r?.ghep?.mode==='to'?r.ghep:null,to=link&&(kind==='upgrade'?link.toId:link.otherId);
 if(!r||!ETCH.has(to)||!Number.isSafeInteger(kind==='upgrade'?link.bac:0)||!Number.isSafeInteger(kind==='upgrade'?link.ngoc:0)||!(kind==='upgrade'||Number.isSafeInteger(link.count)&&link.count>0))return null;
 return {to,count:kind==='upgrade'?1:link.count,silver:kind==='upgrade'?link.bac:0,ngoc:kind==='upgrade'?link.ngoc:0};
}
function etchChange(id,kind){const q=etchQuote(id,kind),s=state(),bag=game.nlItemsV1?.stacks;
 if(battle||!q||etchCount(id)<q.count||game.silver<q.silver||(bag?.[MOBILE_NGOC]||0)<q.ngoc||!payment({silver:q.silver}))return false;
 if(q.ngoc){bag[MOBILE_NGOC]-=q.ngoc;if(!bag[MOBILE_NGOC])delete bag[MOBILE_NGOC];}
 etchTake(id,q.count);s.etchStacks[q.to]=etchCount(q.to)+1;save();render();return true;}
function etchEquip(hero,id){const s=state(),r=ETCH.get(id);if(battle||!owned(hero)||!r||!etchCount(id))return false;
 const slots=s.etchAssigned[hero]||(s.etchAssigned[hero]={}),old=slots[r.attr];if(old===id)return false;
 etchTake(id,1);if(ETCH.has(old))s.etchStacks[old]=etchCount(old)+1;slots[r.attr]=id;save();render();return true;}
function etchRemove(hero,attr){const s=state(),slots=s.etchAssigned[hero],id=slots?.[attr];if(battle||!owned(hero)||!ETCH.has(id))return false;delete slots[attr];s.etchStacks[id]=etchCount(id)+1;save();render();return true;}
function trainingModifiers(id){
 const s=state(),b=BOOKS.get(s.bookAssigned[id]),g=b?bookGrade(String(b.key)):0,h=HORSES.get(s.horseAssigned[id]),t=h&&horseGate(String(h.key),0)?h.tiers[horseTier(String(h.key))]:null;
 const out={flat:{},pct:{},hp:0,lead:0,war:0,intellect:0,crit:0,dodge:0,book:null,resist:{}};
 const labels={'Vật Công':'atk','Pháp Công':'catk','Mưu Công':'matk','Vật Phòng':'def','Pháp Phòng':'tdef','Mưu Phòng':'mdef'};
 const add=(bag,k,v)=>bag[k]=(bag[k]||0)+v;
 if(b&&g){const row=b.statGrowth.find(x=>x.grade===g);if(row){
  for(let i=0;i<b.statLabels.length;i++){const n=row.vals[i],label=b.statLabels[i];
   if(label==='Tất cả công')for(const k of ['atk','catk','matk'])add(out.flat,k,n*.001);
   else if(label==='Tất cả phòng')for(const k of ['def','tdef','mdef'])add(out.flat,k,n*.001);
   else if(label==='Lính')out.hp+=n*.001*.82;
   else if(label.startsWith('Toàn thể kháng '))out.resist[label.replace('Toàn thể kháng ','').replace(' (%)','')]=n/100;
  }out.book={id:String(b.key),name:b.name,grade:g,desc:b.ranks[g-1]};}}
 if(t){for(const x of t.stats){const k=labels[x.label];if(k){add(out.flat,k,x.base*.001);add(out.pct,k,x.pct/100);}}
 for(const x of t.special||[]){const k=labels[x.label];if(k)add(x.pct?out.pct:out.flat,k,x.pct?x.value/100:x.value*.001);
 else if(x.label==='C.Huy')out.lead+=x.value;else if(x.label==='Võ Lực')out.war+=x.value;else if(x.label==='Trí')out.intellect+=x.value;else if(x.label==='Tỷ lệ bạo kích')out.crit+=x.value/100;else if(x.label==='Phần trăm Né')out.dodge+=x.value/100;}}
 for(const etchId of Object.values(s.etchAssigned[id]||{})){const e=ETCH.get(etchId);if(!e)continue;
 if(e.attr===1)for(const k of ['atk','catk','matk'])add(out.flat,k,e.value*.001);
 else if(e.attr===2)for(const k of ['def','tdef','mdef'])add(out.flat,k,e.value*.001);
 else if(e.attr===3)out.hp+=e.value*.001*.82;}
 return out;
}
function trainingCombat(u,m){if(!m)return u;
 for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]=(u[k]+(m.flat[k]||0))*(1+(m.pct[k]||0));
 u.hp+=m.hp;u.maxHp+=m.hp;u.crit=Math.min(.95,(u.crit||0)+m.crit);u.dodge=Math.min(.95,(u.dodge||0)+m.dodge);u.nlMobileTraining=m;return u;
}
const MOBILE_TECH=NL_CONTENT_C.mobileAdvancedTech?.tech||[];
const MOBILE_TECH_BY_ID=new Map(MOBILE_TECH.map(t=>[String(t.key),t]));
function mobileTechLevel(id){const t=MOBILE_TECH_BY_ID.get(String(id));return t?clamp(nat(state().mobileTechLevels[id]),0,t.effect.length):0;}
function mobileTechValue(id){const t=MOBILE_TECH_BY_ID.get(String(id)),lv=mobileTechLevel(id);return lv?t.effect[lv-1]:0;}
function mobileTechQuote(id,to){
 const t=MOBILE_TECH_BY_ID.get(String(id)),from=mobileTechLevel(id);
 if(!t||!Number.isInteger(to)||to<=from||to>t.effect.length)return null;
 return {from,to,point:t.pointCost.slice(from,to).reduce((a,b)=>a+b,0),tripod:t.tripodCost.slice(from,to).reduce((a,b)=>a+b,0)};
}
function mobileTechUpgrade(id,to){
 const t=MOBILE_TECH_BY_ID.get(String(id)),q=mobileTechQuote(id,to),s=state();
 if(battle||!t||!q||s.mobileCommanderLevel<t.unlockLevel||s.mobileTechPoints<q.point||s.mobileTechTripods<q.tripod)return false;
 s.mobileTechPoints-=q.point;s.mobileTechTripods-=q.tripod;s.mobileTechLevels[id]=to;save();render();return true;
}
function mobileTechCombat(u){
 if(!u||u.team!=='p')return u;
 const atk=mobileTechValue('10')/100,def=mobileTechValue('11')/100,hp=mobileTechValue('8')*.001*.82;
 for(const k of ['atk','catk','matk'])if(Number.isFinite(u[k]))u[k]*=1+atk;
 for(const k of ['def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]*=1+def;
 if(Number.isFinite(u.hp)&&Number.isFinite(u.maxHp)){u.hp+=hp;u.maxHp+=hp;}
 u.nlMobileTech={damage:mobileTechValue('13')/100,protect:mobileTechValue('7')/100,dodge:mobileTechValue('14')/100,
    vs:{'Thục':mobileTechValue('1')/100,'Ngụy':mobileTechValue('2')/100,'Ngô':mobileTechValue('3')/100,'Quần':mobileTechValue('9')/100},
    resist:{'Thục':mobileTechValue('4')/100,'Ngụy':mobileTechValue('5')/100,'Ngô':mobileTechValue('6')/100,'Quần':mobileTechValue('12')/100}};
 if(Number.isFinite(u.dodge))u.dodge=Math.min(.95,u.dodge+u.nlMobileTech.dodge);
 return u;
}
function mobileTechDamage(a,t){
 const af=a?.nlMobileHero?.faction,tf=t?.nlMobileHero?.faction;
 const out=(a?.nlMobileTech?.damage||0)+(a?.nlMobileTech?.vs?.[tf]||0);
 const resist=(t?.nlMobileTech?.protect||0)+(t?.nlMobileTech?.resist?.[af]||0);
 return (1+out)*Math.max(0,1-resist);
}
function mobileHeroRecord(id){const key=MOBILE_HERO_SOURCE?.runtimeAliases?.[id];return key?MOBILE_HERO_SOURCE.details[key]||null:null;}
function mobileHeroQuality(id){
 const record=mobileHeroRecord(id);if(!record)return null;
 const ranks=(record.growth||[]).filter(r=>Number.isInteger(r.q)&&[r.lead,r.war,r.int].every(Number.isFinite)).sort((a,b)=>a.q-b.q);
 if(!ranks.length)return null;
 const flags=game.heroDevelopment?.heroes?.[id]?.awakening,advanced=game.nlClassicAdvanced?.growth?.[id]?.awakened;
 const migrated=flags?.gold?8:flags?.orange?7:advanced?6:ranks[0].q;
 const stored=state().mobileHeroRanks[id],requested=Number.isInteger(stored)?stored:migrated;
 const growth=ranks.filter(r=>r.q<=requested).at(-1)||ranks[0];
 const stage=(record.stages||[]).filter(t=>t.q<=growth.q).sort((a,b)=>a.q-b.q).at(-1)||null;
 return {sourceId:record.id,name:record.name,faction:record.faction,growth,stage,requested,classification:'SOURCE_EXACT_GROWTH_WITH_LEGACY_QUALITY_MIGRATION'};
}
// Stage quantities are retained verbatim. The offline merchant is a simulated acquisition adapter.
function mobileHeroNext(id){
 const record=mobileHeroRecord(id),current=mobileHeroQuality(id);
 if(!record||!current)return null;
 const next=(record.growth||[]).filter(r=>Number.isInteger(r.q)&&r.q>current.growth.q).sort((a,b)=>a.q-b.q)[0];
 if(!next)return null;
 const stage=(record.stages||[]).find(t=>t.q===next.q),cost=stage?.cost;
 const material={};
 let valid=Array.isArray(cost)&&cost.length>0;
 for(const m of cost||[]){
   if(!m||typeof m.name!=='string'||!m.name.trim()||!Number.isSafeInteger(m.qty)||m.qty<1){valid=false;continue;}
   material[m.name]=(material[m.name]||0)+m.qty;
 }
 return {from:current.growth.q,to:next.q,name:next.qn,stage,material,valid,gate:next.q>=8?380:next.q>=7?300:10};
}
function mobileHeroMaterialQuote(id,name,qty){
 const q=mobileHeroNext(id);if(!q?.valid||!Object.hasOwn(q.material,name)||!Number.isSafeInteger(qty)||qty<1||qty>q.material[name])return null;
 const have=nat(state().mobileHeroMaterials[name]),need=Math.max(0,q.material[name]-have);
 if(qty>need)return null;
 const unit=1+Math.max(0,q.to-2),silver=qty*unit;
 return Number.isSafeInteger(silver)?{name,qty,silver,classification:'SIMULATED_ACQUISITION'}:null;
}
function mobileHeroBuyMaterial(id,name,qty){
 const q=mobileHeroMaterialQuote(id,name,qty),s=state();
 if(battle||!owned(id)||!q||!payment({silver:q.silver}))return false;
 s.mobileHeroMaterials[name]=nat(s.mobileHeroMaterials[name])+qty;save();render();return true;
}
function mobileHeroCanAwaken(id){
 const q=mobileHeroNext(id),s=state();
 return !!(!battle&&owned(id)&&q?.valid&&s.mobileCommanderLevel>=q.gate&&Object.entries(q.material).every(([n,v])=>nat(s.mobileHeroMaterials[n])>=v));
}
function mobileHeroAwaken(id){
 if(!mobileHeroCanAwaken(id))return false;
 const q=mobileHeroNext(id),s=state();
 for(const [n,v] of Object.entries(q.material))s.mobileHeroMaterials[n]-=v;
 s.mobileHeroRanks[id]=q.to;
 s.mobileHeroRankReceipts[id+':'+q.to]={sourceId:mobileHeroRecord(id).id,from:q.from,to:q.to,materials:q.material,classification:'SOURCE_EXACT_QUANTITIES'};
 save();render();return true;
}
function mobileHeroAllowedTypes(id){
 const units=mobileHeroRecord(id)?.units||[],mapping={'步兵':1,'枪兵':2,'槍兵':2,'骑兵':3,'騎兵':3,'弓兵':4,'文官':5,'官文':5};
 const mapped=units.map(x=>mapping[x]).filter(Boolean);
 return mapped.length&&mapped.length===units.length?new Set(mapped):null;
}
function mobileHeroTroopAllowed(id,type){const allowed=mobileHeroAllowedTypes(id);return !allowed||allowed.has(type);}

const MOBILE_BUFFS=NL_CONTENT_C.mobileBuffCatalog;
const MOBILE_ITEM_SOURCE=NL_ITEM_CATALOGUE.mobileSource;
const MOBILE_DAMAGE_ONE_STATUS='mobile-damage-one';
if(MOBILE_BUFFS?.sourceEdition!=='CURRENT_VNG_MOBILE_WIKI_VIETNAMESE'||Object.keys(MOBILE_BUFFS.records||{}).length!==320)throw Error('MOBILE_BUFF_SOURCE_COVERAGE_MISMATCH');
NL_GAME_DATA.statusEffects.effects[MOBILE_DAMAGE_ONE_STATUS]={duration:1,polarity:'beneficial',
 dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'round-end',removeAfterOwnAction:false,
 provenance:{classification:'DERIVED_FROM_SOURCE',sourceEdition:'CURRENT_VNG_MOBILE_WIKI_VIETNAMESE',sourceEffectId:'3'}};
const MOBILE_CONTROL_STATUS='mobile-source-control',MOBILE_SLEEP_STATUS='mobile-source-sleep',
 MOBILE_MORALE_LOCK_STATUS='mobile-source-morale-lock',MOBILE_INCOMING_STATUS='mobile-source-incoming',
 MOBILE_ATTACK_UP_STATUS='mobile-source-attack-up',MOBILE_ATTACK_STACK_STATUS='mobile-source-attack-stack-up',
 MOBILE_CRIT_UP_STATUS='mobile-source-crit-up',MOBILE_DEFENSE_DOWN_STATUS='mobile-source-defense-down',
 MOBILE_PHYSICAL_ATTACK_UP_STATUS='mobile-source-physical-attack-up',MOBILE_MAGIC_ATTACK_UP_STATUS='mobile-source-magic-attack-up',
 MOBILE_TACTIC_ATTACK_UP_STATUS='mobile-source-tactic-attack-up',MOBILE_PHYSICAL_ATTACK_DOWN_STATUS='mobile-source-physical-attack-down',
 MOBILE_MAGIC_ATTACK_DOWN_STATUS='mobile-source-magic-attack-down',MOBILE_TACTIC_ATTACK_DOWN_STATUS='mobile-source-tactic-attack-down',
 MOBILE_DRAGON_ATTACK_STATUS='mobile-source-dragon-attack-up',MOBILE_ALL_DEFENSE_DOWN_STATUS='mobile-source-all-defense-down',
 MOBILE_MAGIC_DEFENSE_DOWN_STATUS='mobile-source-magic-defense-down',MOBILE_TACTIC_DEFENSE_DOWN_STATUS='mobile-source-tactic-defense-down',
 MOBILE_PURIFICATION_STATUS='mobile-source-purification',
 MOBILE_HEAL_REDUCTION_STATUS='mobile-source-heal-reduction',MOBILE_LIFESTEAL_STATUS='mobile-source-lifesteal',MOBILE_ONE_HIT_SHIELD_STATUS='mobile-source-one-hit-shield',
 MOBILE_ATTACK_DOWN_STATUS='mobile-source-attack-down',
 MOBILE_NO_BUFFS_STATUS='mobile-source-no-buffs';
for(const [kind,spec] of Object.entries({
 [MOBILE_CONTROL_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'owner-action',removeAfterOwnAction:true,skipActionChance:1},
 [MOBILE_SLEEP_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'owner-action',removeAfterOwnAction:true,skipActionChance:1,wakeOnDamage:true},
 [MOBILE_MORALE_LOCK_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'round-end',removeAfterOwnAction:false,moraleGainMultiplier:0},
 [MOBILE_INCOMING_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_ATTACK_UP_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_ATTACK_STACK_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'add-stack',stackLimit:99,expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'DERIVED_FROM_SOURCE_WITH_SIMULATED_STACK_SCALING',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'49'}},
 [MOBILE_CRIT_UP_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'5'}},
 [MOBILE_PHYSICAL_ATTACK_UP_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_MAGIC_ATTACK_UP_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_TACTIC_ATTACK_UP_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_PHYSICAL_ATTACK_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_MAGIC_ATTACK_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_TACTIC_ATTACK_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_DRAGON_ATTACK_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'DERIVED_FROM_SOURCE_WITH_UNRESOLVED_BUFF_COUNT_SCALING',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'70'}},
 [MOBILE_DEFENSE_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'18'}},
 [MOBILE_MAGIC_DEFENSE_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'19'}},
 [MOBILE_TACTIC_DEFENSE_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'20'}},
 [MOBILE_ALL_DEFENSE_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'21'}},
 [MOBILE_PURIFICATION_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'46'}},
 [MOBILE_HEAL_REDUCTION_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'30'}},
 [MOBILE_LIFESTEAL_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'DERIVED_FROM_SOURCE',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'31'}},
 [MOBILE_ONE_HIT_SHIELD_STATUS]:{duration:1,polarity:'beneficial',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'round-end',removeAfterOwnAction:false,
  provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:'37'}},
 [MOBILE_ATTACK_DOWN_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'refresh-longer',expirePhase:'round-end',removeAfterOwnAction:false},
 [MOBILE_NO_BUFFS_STATUS]:{duration:1,polarity:'harmful',dispelPolicy:'unremovable',stackingPolicy:'replace-duration',expirePhase:'round-end',removeAfterOwnAction:false}
}))NL_GAME_DATA.statusEffects.effects[kind]={...spec,provenance:{classification:'SOURCE_EXACT_ADAPTER',sourceEdition:MOBILE_BUFFS.sourceEdition}};
const MOBILE_SOURCE_STATUS_RULES=Object.freeze({
 '2':{kind:MOBILE_CONTROL_STATUS,mechanic:'one-action-control'},
 '3':{kind:MOBILE_DAMAGE_ONE_STATUS,mechanic:'damage-to-one'},
 '4':{kind:MOBILE_INCOMING_STATUS,mechanic:'damage-reduction'},
 '5':{kind:MOBILE_CRIT_UP_STATUS,mechanic:'critical-increase'},
 '7':{kind:MOBILE_MORALE_LOCK_STATUS,mechanic:'no-morale-gain'},
 '9':{kind:MOBILE_PHYSICAL_ATTACK_UP_STATUS,mechanic:'physical-attack-increase'},
 '10':{kind:MOBILE_MAGIC_ATTACK_UP_STATUS,mechanic:'magic-attack-increase'},
 '11':{kind:MOBILE_TACTIC_ATTACK_UP_STATUS,mechanic:'tactic-attack-increase'},
 '12':{kind:MOBILE_ATTACK_UP_STATUS,mechanic:'attack-increase'},
 '13':{kind:MOBILE_PHYSICAL_ATTACK_DOWN_STATUS,mechanic:'physical-attack-reduction'},
 '14':{kind:MOBILE_MAGIC_ATTACK_DOWN_STATUS,mechanic:'magic-attack-reduction'},
 '15':{kind:MOBILE_TACTIC_ATTACK_DOWN_STATUS,mechanic:'tactic-attack-reduction'},
 '18':{kind:MOBILE_DEFENSE_DOWN_STATUS,mechanic:'defense-reduction'},
 '19':{kind:MOBILE_MAGIC_DEFENSE_DOWN_STATUS,mechanic:'magic-defense-reduction'},
 '20':{kind:MOBILE_TACTIC_DEFENSE_DOWN_STATUS,mechanic:'tactic-defense-reduction'},
 '21':{kind:MOBILE_ALL_DEFENSE_DOWN_STATUS,mechanic:'all-defense-reduction'},
 '30':{kind:MOBILE_HEAL_REDUCTION_STATUS,mechanic:'healing-reduction'},
 '31':{kind:MOBILE_LIFESTEAL_STATUS,mechanic:'lifesteal'},
 '37':{kind:MOBILE_ONE_HIT_SHIELD_STATUS,mechanic:'one-hit-shield'},
 '46':{kind:MOBILE_PURIFICATION_STATUS,mechanic:'skill-damage-per-beneficial-buff'},
 '49':{kind:MOBILE_ATTACK_STACK_STATUS,mechanic:'stackable-attack-increase'},
 '70':{kind:MOBILE_DRAGON_ATTACK_STATUS,mechanic:'dragon-attack-increase'},
 '16':{kind:MOBILE_ATTACK_DOWN_STATUS,mechanic:'attack-reduction'},
 '26':{kind:MOBILE_SLEEP_STATUS,mechanic:'sleep-wakes-on-damage'},
 '77':{kind:MOBILE_NO_BUFFS_STATUS,mechanic:'reject-new-beneficial-effects'}
});
const MOBILE_DROP_BINDINGS=new Map((MOBILE_ITEM_SOURCE?.campaignDropBindings||[]).map(x=>[
 [String(x.mapId),String(x.npcId),String(x.sourceId),String(x.category||''),String(x.name||'')].join('|'),x.binding
]));
if(!MOBILE_TROOPS||Object.keys(MOBILE_TROOPS.units||{}).length!==408||Object.keys(MOBILE_TROOPS.baseRuntimeProfiles||{}).length!==5)throw Error('MOBILE_TROOP_SOURCE_COVERAGE_MISMATCH');
const MOBILE_TROOP_ATTACK=Object.freeze({strengthAtk:'atk',leaderAtk:'catk',intellectAtk:'matk'});
const MOBILE_TROOP_DEFENSE=Object.freeze({strengthDef:'def',leaderDef:'tdef',intellectDef:'mdef'});
function mobileTroopSourceId(role){return MOBILE_TROOPS.baseRuntimeRoleMap?.[role]||null;}
function mobileTroopProfile(role){const id=mobileTroopSourceId(role),row=id?MOBILE_TROOPS.units[id]:null;return row?{...row,id,role}:null;}
// Source tier/name/coefficients are exact. Recruit gates and prices are offline simulations.
const MOBILE_TROOP_ROLES={1:'infantry',2:'spear',3:'cavalry',4:'archer',5:'strategist'};
const MOBILE_TROOP_BASE_IDS=new Set(Object.values(MOBILE_TROOPS.baseRuntimeRoleMap));
const MOBILE_TROOP_ROWS=Object.entries(MOBILE_TROOPS.units).map(([id,r])=>({id,...r}));
const MOBILE_TROOP_PLAYABLE=MOBILE_TROOP_ROWS.filter(r=>MOBILE_TROOP_ROLES[r.type]&&!r.npc&&!r.pbOnly&&(MOBILE_TROOP_BASE_IDS.has(r.id)||r.tier>0));
const MOBILE_TROOP_SELECTABLE=new Map(MOBILE_TROOP_PLAYABLE.map(r=>[r.id,r]));
function mobileTroopAssigned(id){return MOBILE_TROOP_SELECTABLE.get(state().mobileTroopAssigned[id])||null;}
function mobileTroopQuote(t){
 const tier=nat(t.tier);
 return {barracks:Math.min(4,1+tier),commander:[10,20,40,80,140,220,300,380][tier]||440,
  silver:tier===0?0:250*tier*tier,merit:tier<3?0:20*tier*tier};
}
function mobileTroopCanSelect(id,tid){
 const t=MOBILE_TROOP_SELECTABLE.get(String(tid));if(!t||!owned(id)||battle||!mobileHeroTroopAllowed(id,t.type)||mobileTroopAssigned(id)?.id===t.id)return false;
 const q=mobileTroopQuote(t);
 return (game.buildings?.barracks||0)>=q.barracks&&state().mobileCommanderLevel>=q.commander&&game.silver>=q.silver&&nlAState().merit>=q.merit;
}
function mobileTroopChoose(id,tid){
 if(!mobileTroopCanSelect(id,tid))return false;
 const t=MOBILE_TROOP_SELECTABLE.get(String(tid)),q=mobileTroopQuote(t),s=state();
 if(!payment({silver:q.silver,merit:q.merit}))return false;
 // Only one active lineage. Preserve legacy selection as an archival migration reference.
 const old=nlwB4State().assigned[id],branch=game.nlr03?.evolutions?.[id];
 if(old||branch)s.mobileTroopLegacy[id]={web:old||null,r03:branch||null};
 delete nlwB4State().assigned[id];if(game.nlr03?.evolutions)delete game.nlr03.evolutions[id];
 s.mobileTroopAssigned[id]=t.id;game.troopModes[id]=MOBILE_TROOP_ROLES[t.type];save();render();return true;
}
// Mobile source trait rates; one equipped trait and purchase/rank gates are offline design.
const MOBILE_TRAITS=new Map(MOBILE_TROOPS.specials.map((t,i)=>[String(i),t]));
const MOBILE_TRAIT_SUPPORTED=new Set(MOBILE_TROOPS.specials.map(t=>t.name));
const MOBILE_NO_NORMAL='mobile-trait-no-normal';
NL_GAME_DATA.statusEffects.effects[MOBILE_NO_NORMAL]={duration:1,polarity:'harmful',dispelPolicy:'removable',stackingPolicy:'replace-duration',expirePhase:'owner-action',removeAfterOwnAction:true,skipActionChance:1};
function mobileTraitQuote(rank){return {silver:500*rank*rank,merit:30*rank};}
function mobileTraitChoice(id){
 const chosen=state().mobileTroopTraits[id],unit=mobileTroopAssigned(id),t=MOBILE_TRAITS.get(chosen?.id);
 return unit&&t&&MOBILE_TRAIT_SUPPORTED.has(t.name)&&t.types.includes(unit.type)&&Number.isInteger(chosen.rank)&&chosen.rank>=1&&chosen.rank<=Math.min(3,unit.tier)?{id:chosen.id,name:t.name,rank:chosen.rank,text:t.levels[chosen.rank-1]}:null;
}
function mobileTraitChoose(id,tid){
 const t=MOBILE_TRAITS.get(String(tid)),u=mobileTroopAssigned(id),old=mobileTraitChoice(id);
 if(battle||!owned(id)||!u||!t||!MOBILE_TRAIT_SUPPORTED.has(t.name)||!t.types.includes(u.type))return false;
 const rank=old?.id===String(tid)?old.rank+1:1;
 if(rank>3||u.tier<rank||!payment(mobileTraitQuote(rank)))return false;
 state().mobileTroopTraits[id]={id:String(tid),rank};save();render();return true;
}
const mobileTraitRate=(u,values)=>values[(u?.nlMobileTrait?.rank||1)-1]||0;
function mobileTraitFactors(a,t,kind,pattern,round){
 let outgoing=1,incoming=1;
 const an=a?.nlMobileTrait?.name,tn=t?.nlMobileTrait?.name,low=u=>u?.maxHp>0&&u.hp/u.maxHp<.5;
 if(an==='Lợi Nhẫn')outgoing*=1+mobileTraitRate(a,[.03,.05,.08]);
 if(tn==='Trọng Giáp')incoming*=1-mobileTraitRate(t,[.03,.05,.08]);
 if(an==='Bạch Nhẫn'&&['physical','tactic'].includes(kind))outgoing*=1+mobileTraitRate(a,[.04,.07,.12]);
 if(tn==='Bất Khuất'&&low(t))incoming*=1-mobileTraitRate(t,[.06,.10,.16]);
 if(an==='Hãm Trận'&&low(a))outgoing*=1+mobileTraitRate(a,[.06,.10,.16]);
 if(an==='Hoành Tảo'&&['row','column'].includes(pattern))outgoing*=1+mobileTraitRate(a,[.04,.07,.12]);
 if(an==='Nhiễu Hậu'&&t?.troop==='strategist')outgoing*=1+mobileTraitRate(a,[.09,.15,.24]);
 if(an==='Phương Viên'&&['cavalry','archer'].includes(t?.troop))outgoing*=1+mobileTraitRate(a,[.09,.15,.24]);
 if(['Sách Phản','Xạ Thủ'].includes(an)&&['single','all'].includes(pattern))outgoing*=1+mobileTraitRate(a,[.04,.07,.12]);
 if(an==='Trù Sách'&&kind==='magic')outgoing*=1+mobileTraitRate(a,[.04,.07,.12]);
 if(an==='Tật Hành'&&round<=3)outgoing*=1+mobileTraitRate(a,[.09,.15,.24]);
 if(tn==='Ẩn Nấp'&&round<=3)incoming*=1-mobileTraitRate(t,[.09,.15,.24]);
 return {outgoing,incoming};
}
function mobileTroopCoefficients(u,sourceId){
 const source=MOBILE_TROOPS.units[String(sourceId)];if(!u||!source)return u;
 const stats=source.stats;
 for(const [key,target] of Object.entries(MOBILE_TROOP_ATTACK))if(Number.isFinite(u[target]))u[target]=Math.max(1,Math.round(u[target]*stats[key]));
 for(const [key,target] of Object.entries(MOBILE_TROOP_DEFENSE))if(Number.isFinite(u[target]))u[target]=Math.max(1,Math.round(u[target]*stats[key]));
 const classCrit=u.type==='archer'?.10:.04;u.crit=Math.max(0,(Number(u.crit)||0)-classCrit+(Number(stats.critical)||0));
 u.nlMobileTroop={id:String(sourceId),name:source.name,typeName:source.typeName,tier:source.tier,critical:stats.critical,strikeBack:stats.strikeBack,sourceEdition:MOBILE_TROOPS.sourceEdition};return u;
}
function applyMobileTroopProfile(u,team){
 if(!u||team!=='p'||battle?.mode==='cltq'||u.nlClassicWebUnit||game.nlr03?.evolutions?.[u.id])return u;
 const assigned=mobileTroopAssigned(u.id),sourceId=assigned?.id||mobileTroopSourceId(u.troop);
 if(assigned){u.troop=MOBILE_TROOP_ROLES[assigned.type];u.type=u.troop==='spear'?'infantry':u.troop;}
 const result=mobileTroopCoefficients(u,sourceId),trait=assigned&&mobileTraitChoice(u.id);
 if(trait){result.nlMobileTrait={...trait};
   if(trait.name==='Can Đảm')result.nlMobileControlCharges=mobileTraitRate(result,[2,3,5]);
   if(trait.name==='Vững Chắc')result.nlMobileAbsorb=Math.floor((result.maxHp||0)*mobileTraitRate(result,[.09,.15,.24]));
 }
 return result;
}
// A deliberate legacy selection deactivates the Mobile assignment, not the source catalogue.
const mobilePriorWebSelect=nlwB4Select;
nlwB4Select=function(id,tid){const ok=mobilePriorWebSelect(id,tid);if(ok){delete state().mobileTroopAssigned[id];save();render();}return ok;};
const mobilePriorR03Evolve=nlr03Evolve;
nlr03Evolve=function(id,tid){const ok=mobilePriorR03Evolve(id,tid);if(ok){delete state().mobileTroopAssigned[id];save();render();}return ok;};

const MAPS=NL_CONTENT_C.maps, HERO=new Map(NL_CONTENT_C.heroes.map(h=>[h.id,h]));
const NPC=new Map(), MAP=new Map(MAPS.map(m=>[m.id,m])),MAP_INDEX=new Map(MAPS.map((m,i)=>[m.id,i]));
for(const m of MAPS)m.npcs.forEach((n,i)=>NPC.set(n.id,{map:m,n,index:i}));
if(MAPS.length!==249||NPC.size!==5063||Object.keys(NL_CONTENT_C.heroAliases).length!==364)throw Error('C source counts');
for(const h of HERO.values()){
 const {descriptor,gate,silver,provenance,...profile}=h;HEROES[h.id]=profile;P2_SKILLS[h.id]={...descriptor};
}
for(const [id,sourceId] of Object.entries(MOBILE_HERO_SOURCE?.runtimeAliases||{})){
 const profile=HEROES[id],record=MOBILE_HERO_SOURCE.details[sourceId];
 if(profile&&record){profile.mobileSourceId=sourceId;profile.faction=record.faction||profile.faction;}
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
 if(!obj(s.mobileTroopAssigned))s.mobileTroopAssigned={};
 if(!obj(s.mobileTroopLegacy))s.mobileTroopLegacy={};
 if(!obj(s.mobileTroopTraits))s.mobileTroopTraits={};
 if(!obj(s.mobileTechLevels))s.mobileTechLevels={};
 for(const k of ['mobileHeroRanks','mobileHeroMaterials','mobileHeroRankReceipts','mobileBeautyLevels','mobileBeautyExp','mobileBeautyAssigned'])if(!obj(s[k]))s[k]={};
 s.mobileBeautyPendants=nat(s.mobileBeautyPendants);
 for(const k of ['bookGrades','bookLevels','bookAssigned','horseTiers','horseStars','horseAssigned','etchStacks','etchAssigned'])if(!obj(s[k]))s[k]={};
 for(const k of ['bookFragments','bookExp','horsePoints'])s[k]=nat(s[k]);
 s.mobileTechPoints=nat(s.mobileTechPoints);s.mobileTechTripods=nat(s.mobileTechTripods);
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
function mobileTextKey(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('vi').replace(/đ/g,'d');}
function mobileSourceApplications(skill,effects){
 const text=String(skill?.desc||''),fold=mobileTextKey(text),rows=[];
 const statPattern={
  '9':/vat cong[\s\S]{0,130}(?:tang|giam)/,'10':/phap cong[\s\S]{0,130}(?:tang|giam)/,'11':/muu cong[\s\S]{0,130}(?:tang|giam)/,
  '13':/vat cong[\s\S]{0,130}(?:tang|giam)/,'14':/phap cong[\s\S]{0,130}(?:tang|giam)/,'15':/muu cong[\s\S]{0,130}(?:tang|giam)/
 };
 for(const sourceEffect of Array.isArray(effects)?effects:[]){
  const id=String(sourceEffect?.id??'');if(id==='3')continue; // Dedicated one-point damage adapter below owns this source status.
  const rule=MOBILE_SOURCE_STATUS_RULES[id],catalog=MOBILE_BUFFS.records?.[id];
  if(!rule||!catalog||!sourceEffect?.name)continue;
  const name=mobileTextKey(sourceEffect.name),marker='['+name+']';let at=fold.indexOf(marker),context='';
  if(at>=0)context=fold.slice(Math.max(0,at-110),at);
  else if(statPattern[id]?.test(fold)){at=fold.search(statPattern[id]);context=fold.slice(at,at+200);}
  else if(id==='21'&&/(?:tat ca phong|tat ca nang luc phong thu)/.test(fold)){
    at=fold.search(/(?:tat ca phong|tat ca nang luc phong)/);context=fold.slice(Math.max(0,at-100),at+140);
  }
  else if(id==='18'&&/vat phong.{0,100}giam/.test(fold)){at=fold.search(/vat phong/);context=fold.slice(at,at+180);}
  else if(id==='19'&&/phap phong.{0,100}giam/.test(fold)){at=fold.search(/phap phong/);context=fold.slice(Math.max(0,at-100),at+180);}
  else if(id==='20'&&/muu phong.{0,100}giam/.test(fold)){at=fold.search(/muu phong/);context=fold.slice(Math.max(0,at-100),at+180);}
  else if(id==='30'&&/hieu qua tri lieu.{0,90}giam\s+\d+(?:[.,]\d+)?\s*%/.test(fold)){at=fold.search(/hieu qua tri lieu/);context=fold.slice(Math.max(0,at-120),at+180);}
  else if(id==='16'&&/tan cong.{0,90}giam\s+\d+(?:[.,]\d+)?\s*%/.test(fold)){at=fold.search(/tan cong.{0,90}giam\s+\d+(?:[.,]\d+)?\s*%/);context=fold.slice(Math.max(0,at-45),at+110);}
  else if(id==='12'&&/tang.{0,60}(?:tan cong|cong)/.test(fold)){at=fold.search(/tang.{0,60}(?:tan cong|cong)/);context=fold.slice(Math.max(0,at-45),at+100);}
  if(at<0)continue;
  let scope=null;
  if(/(?:ban than|tu than)\s+nhan(?:\s+\[[^\]]+\]\s*,?)*\s*$/.test(context))scope='self';
  else if(/toan phe ta\s+nhan(?:\s+\[[^\]]+\]\s*,?)*\s*$/.test(context))scope='allies';
  else if(['9','10','11','13','14','15'].includes(id)&&/toan phe ta/.test(context))scope='allies';
  else if(['9','10','11','13','14','15'].includes(id)&&/ban than|tu than/.test(context))scope='self';
  else if(['9','10','11','13','14','15'].includes(id)&&/toan phe dich|\bdich\b/.test(context))scope='enemies';
  else if(['9','10','11','13','14','15'].includes(id)&&/muc tieu|doi phuong/.test(context))scope='targets';
  else if(id==='21'&&/toan phe dich|\bdich\b/.test(context))scope='enemies';
  else if(id==='21'&&/muc tieu|doi phuong/.test(context))scope='targets';
  else if(id==='18'&&/vat phong\s+toan phe dich/.test(context))scope='enemies';
  else if(id==='18'&&/(?:vat phong.{0,70}muc tieu|muc tieu.{0,70}vat phong)/.test(context))scope='targets';
  else if(['19','20'].includes(id)&&/(?:muc tieu|toan phe dich|\bdich\b|doi phuong)/.test(context))scope='targets';
  else if(id==='30'&&/(?:muc tieu|toan phe dich|doi phuong)/.test(context))scope='targets';
  else if(/toan phe dich\s+(?:bi|nhan)\s*$/.test(context))scope='enemies';
  else if(/(?:muc tieu|doi phuong)\s+(?:bi|nhan)\s*$/.test(context)||id==='16')scope='targets';
  else if(id==='12'&&/toan phe ta/.test(context))scope='allies';
  else if(id==='12'&&/(?:ban than|tu than)/.test(context))scope='self';
  else if(id==='12'&&/muc tieu|doi phuong/.test(context))scope='targets';
  if(!scope)continue;
  const detail=String(sourceEffect.detail||''),detailFold=mobileTextKey(detail);
  const following=['18','21'].includes(id)?fold.slice(at,at+260):fold.slice(at+marker.length,at+marker.length+140);
  const duration=detailFold.match(/(\d+)\s*luot/)||following.match(/duy tri\s+(\d+)\s*luot/);
  if(!duration)continue;
  const chanceText=detailFold.match(/(?:ti le|xac suat)\s*(\d+(?:[.,]\d+)?)\s*%/);
  const contextualChance=context.match(/(\d+(?:[.,]\d+)?)\s*%\s*(?:khien|co hoi|ti le)/);
  const chance=chanceText?Number(chanceText[1].replace(',','.'))/100:
      contextualChance?Number(contextualChance[1].replace(',','.'))/100:1;
  const magnitude=detailFold.match(/(\d+(?:[.,]\d+)?)\s*%/);
  const percent=magnitude?Number(magnitude[1].replace(',','.'))/100:null;
  const app={sourceId:id,sourceName:sourceEffect.name,sourceDescription:catalog.ing||'',sourceEffectDescription:sourceEffect.desc||'',detail,
    kind:rule.kind,mechanic:rule.mechanic,scope,turns:Number(duration[1]),chance,values:{}};
  if(id==='77'&&/neu khong/.test(context))app.condition='TARGET_SURVIVES';
  if(rule.mechanic==='damage-reduction'&&percent!==null)app.values.incomingDamageMultiplier=Math.max(0,1-percent);
  if(rule.mechanic==='attack-increase'&&percent!==null)app.values.outgoingDamageMultiplier=1+percent;
  if(rule.mechanic==='stackable-attack-increase'&&percent!==null){app.values.outgoingDamageMultiplier=1+percent;app.stackingClassification='SIMULATED_ADDITIVE_PER_STACK';}
  if(['physical-attack-increase','magic-attack-increase','tactic-attack-increase'].includes(rule.mechanic)&&percent!==null){
    const field={ 'physical-attack-increase':'physicalDamageMultiplier','magic-attack-increase':'magicDamageMultiplier','tactic-attack-increase':'tacticDamageMultiplier'}[rule.mechanic];app.values[field]=1+percent;
  }
  if(['physical-attack-reduction','magic-attack-reduction','tactic-attack-reduction'].includes(rule.mechanic)&&percent!==null){
    const field={ 'physical-attack-reduction':'physicalDamageMultiplier','magic-attack-reduction':'magicDamageMultiplier','tactic-attack-reduction':'tacticDamageMultiplier'}[rule.mechanic];app.values[field]=Math.max(0,1-percent);
  }
  if(rule.mechanic==='dragon-attack-increase'&&percent!==null){app.values.outgoingDamageMultiplier=1+percent;app.unresolvedMechanics=['SOURCE_BUFF_COUNT_SCALING_UNQUANTIFIED'];}
  if(rule.mechanic==='critical-increase'&&percent!==null)app.values.criticalChanceAdd=percent;
  if(rule.mechanic==='defense-reduction'&&percent!==null)app.values.incomingPhysicalDefenseMultiplier=Math.max(0,1-percent);
  if(rule.mechanic==='magic-defense-reduction'&&percent!==null)app.values.incomingMagicDefenseMultiplier=Math.max(0,1-percent);
  if(rule.mechanic==='tactic-defense-reduction'&&percent!==null){
    app.values.incomingTacticDefenseMultiplier=Math.max(0,1-percent);
    if(/vat phong/.test(context))app.values.incomingPhysicalDefenseMultiplier=Math.max(0,1-percent);
  }
  if(rule.mechanic==='all-defense-reduction'&&percent!==null)app.values.incomingDefenseMultiplier=Math.max(0,1-percent);
  if(['defense-reduction','magic-defense-reduction','tactic-defense-reduction','all-defense-reduction'].includes(rule.mechanic))
    app.stackingClassification='SIMULATED_MULTIPLICATIVE_CROSS_EFFECTS';
  if(rule.mechanic==='skill-damage-per-beneficial-buff'&&percent!==null){
    app.values.damageBonusPerBeneficialBuff=percent;
    app.values.beneficialBuffCountClassification='SIMULATED_DISTINCT_ACTIVE_STATUS_TYPES';
    app.formulaClassification='SOURCE_EXACT_WITH_SIMULATED_BUFF_COUNTING';
  }
  if(rule.mechanic==='healing-reduction'&&percent!==null)app.values.incomingHealingMultiplier=Math.max(0,1-percent);
  if(rule.mechanic==='lifesteal'&&percent!==null){app.values.lifestealDamageMultiplier=percent;app.formulaClassification='DERIVED_FROM_SOURCE_DAMAGE_RATIO';}
  if(rule.mechanic==='one-hit-shield')app.values.damageBlockCharges=1;
  if(rule.mechanic==='attack-reduction'&&percent!==null)app.values.outgoingDamageMultiplier=Math.max(0,1-percent);
  if(rule.mechanic==='one-action-control'||rule.mechanic==='sleep-wakes-on-damage')app.values.skipActionChance=1;
  if(rule.mechanic==='no-morale-gain')app.values.moraleGainMultiplier=0;
  const needsValue=['damage-reduction','attack-increase','stackable-attack-increase','attack-reduction','critical-increase','defense-reduction','magic-defense-reduction','tactic-defense-reduction','all-defense-reduction','dragon-attack-increase',
   'physical-attack-increase','magic-attack-increase','tactic-attack-increase','physical-attack-reduction','magic-attack-reduction','tactic-attack-reduction',
   'skill-damage-per-beneficial-buff','healing-reduction','lifesteal'].includes(rule.mechanic);
  if(needsValue&&percent===null)continue;
  rows.push(app);
 }
 return rows;
}
function descriptor(skill,role,boss,effects=[]){
 const source=skill&&typeof skill==='object'&&!Array.isArray(skill)?skill:null;
 if(!source)return inferredDescriptor(skill,role,boss);
 const name=String(source.name||'Chiến pháp'),text=String(source.desc||''),fold=text.toLocaleLowerCase('vi');
 const out=inferredDescriptor(name,role,boss),sourceFold=mobileTextKey(text);
 out.tag=name;out.sourceSkillName=name;out.sourceDescription=text;
 if(/(?:don vi dich|dich).{0,40}(?:linh it nhat|it quan nhat)/.test(sourceFold))out.sourceTargetMode='LEAST_TROOPS';
 const moraleBranch=sourceFold.match(/neu diet duoc muc tieu[\s\S]{0,160}?hoi\s+(\d+)\s+si khi/);
 if(moraleBranch){
   const tail=sourceFold.slice(moraleBranch.index+moraleBranch[0].length),survivalMorale=tail.match(/neu khong[\s\S]{0,360}?ban than hoi\s+(\d+)\s+si khi/);
   out.sourceConditionalMorale={onKill:Number(moraleBranch[1]),onSurvival:survivalMorale?Number(survivalMorale[1]):0,classification:'SOURCE_EXACT'};
   const onActionMorale=sourceFold.match(/(?:ban than|toan phe ta) hoi\s+(\d+)\s+si khi[\s\S]{0,80}?neu diet duoc muc tieu/);
   if(onActionMorale)out.sourceConditionalMorale.onAction=Number(onActionMorale[1]);
   const noKillAt=tail.indexOf('neu khong'),noKillClause=noKillAt>=0?tail.slice(noKillAt,noKillAt+280):'',
     controlDuration=noKillClause.match(/duy tri\s+(\d+)\s+luot/),
     survivalControl=/(?:muc tieu|don vi dich)/.test(noKillClause)&&/hon loan/.test(noKillClause)?controlDuration:null;
   if(survivalControl)out.sourceConditionalMorale.onSurvivalStatus={sourceId:'2',sourceName:'Hỗn Loạn',sourceDescription:MOBILE_BUFFS.records?.['2']?.ing||'',
     kind:MOBILE_CONTROL_STATUS,turns:Number(survivalControl[1]),chance:1,values:{skipActionChance:1},classification:'SOURCE_EXACT'};
 }
 out.sourceApplications=mobileSourceApplications(source,effects);
 if(out.sourceApplications.length){out.sourceSkillClassification='SOURCE_TEXT_AND_EFFECT_ADAPTER';
   out.skillFieldProvenance={name:'SOURCE_EXACT',description:'SOURCE_EXACT',coefficient:'UNRESOLVED',target:'UNRESOLVED',secondaryEffects:'SOURCE_EFFECT_CATALOG_ADAPTED'};
   if(/^\s*\[Hỗ Trợ\]/i.test(text)&&!/trị liệu|hồi phục.{0,12}(?:binh|lính)/i.test(text)){
     out.pattern='heal';out.kind='magic';out.mult=0;out.healCount=5;out.sourceNoHealing=true;
   }
 }
 if(!out.skillFieldProvenance)out.skillFieldProvenance={name:'SOURCE_EXACT',description:'SOURCE_EXACT',coefficient:'UNRESOLVED',target:'UNRESOLVED',secondaryEffects:'UNRESOLVED'};
 if(!out.sourceSkillClassification)out.sourceSkillClassification='SOURCE_TEXT_WITH_P2_ADAPTER';
 const simpleMorale=text.match(/^\s*\[Hỗ Trợ\]\s*(tướng khác của phe ta|toàn phe ta)\s+hồi\s+(\d+)\s+sĩ khí[.,]?\s*$/i);
 if(simpleMorale){
   out.pattern='morale';out.kind='tactic';out.mult=0;out.bonusMorale=Number(simpleMorale[2]);
   out.sourceMoraleOnly=true;out.sourceMoraleScope=/tướng khác/i.test(simpleMorale[1])?'OTHER_ALLIES':'ALL_ALLIES';
   out.sourceSkillClassification='SOURCE_MORALE_ONLY_ADAPTED';
   out.skillFieldProvenance.coefficient='NOT_APPLICABLE_MORALE_ONLY';
   out.skillFieldProvenance.target='DERIVED_FROM_SOURCE';out.skillFieldProvenance.secondaryEffects='SOURCE_TEXT_RETAINED';
   return out;
 }
 const damageStart=fold.search(/(?:gây|chịu|tấn công)\s+(?:cho\s+)?/);
 const damageClause=damageStart>=0?text.slice(damageStart,damageStart+240).split(/[;。]/,1)[0]:'';
 const targetContext=damageStart>=0?fold.slice(0,Math.min(fold.length,damageStart+120)):fold;
 const percent=damageClause.match(/(\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*%/);
 const damageLane=damageClause.toLocaleLowerCase('vi');
 const sourceKind=/mưu công/.test(damageLane)?'tactic':
   /pháp công|sát thương phép/.test(damageLane)?'magic':
   /sát thương vật lý|vật công/.test(damageLane)?'physical':
   /\[c\. pháp\]/i.test(text)?'magic':
   /\[kế sách\]/i.test(text)?'tactic':
   /\[vật lý\]|\[thường\]/i.test(text)?'physical':out.kind;
 let sourcePattern=null,targetProvenance='SOURCE_TARGET_TEXT_NOT_MAPPED';
 if(/toàn phe địch/.test(targetContext)){sourcePattern='all';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng ngang/.test(targetContext)){sourcePattern='row';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng dọc|hàng thẳng/.test(targetContext)){sourcePattern='column';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/hàng sau/.test(targetContext)){sourcePattern='back';targetProvenance='DERIVED_FROM_SOURCE';}
 else if(/1 kẻ địch|một kẻ địch|cho 1 địch|cho một địch|đơn vị địch.{0,40}(?:lính ít nhất|ít quân nhất)|địch.{0,40}lính ít nhất/.test(targetContext)){sourcePattern='single';targetProvenance='DERIVED_FROM_SOURCE';}
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
   const repeated=damageClause.match(/(\d+)\s*lần\s+(?:gây\s+)?(?:\d{1,3}(?:\.\d{3})+|\d+(?:[.,]\d+)?)\s*%/i);
   out.pattern=sourcePattern;out.kind=sourceKind;out.mult=amount/100;
   out.sourceSkillClassification='SOURCE_DAMAGE_COEFFICIENT_AND_TARGET_ADAPTED';
   out.skillFieldProvenance.coefficient='DERIVED_FROM_SOURCE';out.skillFieldProvenance.target=targetProvenance;
   const sourceDamageOne=/bản thân nhận\s+\[\s*thiết bích\s*\]/i.test(text),duration=fold.match(/duy trì\s+(\d+)\s+lượt/);
   if(sourceDamageOne){out.applyAlly=MOBILE_DAMAGE_ONE_STATUS;if(duration)out.applyAllyDuration=Number(duration[1]);}
   if(repeated&&Number(repeated[1])>1&&Number(repeated[1])<=20){out.sourceHitCount=Number(repeated[1]);out.skillFieldProvenance.secondaryEffects='PRIMARY_MULTI_HIT_ADAPTED_OTHER_CLAUSES_UNRESOLVED';}
   else if(sourceDamageOne)out.skillFieldProvenance.secondaryEffects=out.sourceApplications.length?'SOURCE_DAMAGE_ONE_AND_CATALOG_STATUSES_ADAPTED':'PARTIAL_SOURCE_DAMAGE_ONE_STATUS_ADAPTED';
   else if(out.sourceTargetMode==='LEAST_TROOPS'&&/càng ít.{0,50}càng cao/i.test(text))out.skillFieldProvenance.secondaryEffects='UNRESOLVED_LOW_TROOP_DAMAGE_SCALING_WITH_SOURCE_STATUS_ADAPTED';
   else if(out.sourceApplications.length)out.skillFieldProvenance.secondaryEffects='SOURCE_EFFECT_CATALOG_ADAPTED';
   else out.skillFieldProvenance.secondaryEffects=/\[|duy trì|giảm \d+ sĩ khí|hồi \d+ sĩ khí/.test(fold)?'UNRESOLVED_SECONDARY_EFFECTS':'SOURCE_TEXT_RETAINED';
   return out;
 }
 if(out.sourceApplications.length&&out.sourceNoHealing){
   out.sourceSkillClassification='SOURCE_EFFECT_STATUS_ONLY_ADAPTED';
   out.skillFieldProvenance.coefficient='NOT_APPLICABLE_STATUS_ONLY';
   out.skillFieldProvenance.target='DERIVED_FROM_SOURCE';out.skillFieldProvenance.secondaryEffects='SOURCE_EFFECT_CATALOG_ADAPTED';
   return out;
 }
 if(/trị liệu toàn phe ta/.test(fold))out.sourceSkillClassification='SIMULATED_FALLBACK_HEAL';
 else out.sourceSkillClassification='SIMULATED_FALLBACK_COMPLEX_OR_UNPARSED';
 return out;
}
function mobileSkillAudit(){
 const rows={totalUnits:0,sourceExactUnits:0,sourceExactWithNameAndDescription:0,withNameAndDescription:0,
   sourceExactDamageAdapted:0,sourceExactHealAdapted:0,sourceDamageAdapted:0,sourceHealAdapted:0,
   sourceExactMoraleAdapted:0,sourceEffectUnits:0,sourceEffectRows:0,sourceEffectIds:new Set(),sourceEffectNames:new Set(),
   sourceStatusAdapted:0,sourceStatusAdaptedUnits:0,sourceStatusIds:new Set(),sourceStatusOnlyAdapted:0,
   sourceLeastTroopsTargets:0,sourceConditionalMoraleBranches:0,
   simulatedFallback:0,skillNames:new Set(),sourceExactSkillNames:new Set(),unresolvedSecondaryEffects:0};
 for(const map of MAPS)for(const npc of map.npcs)for(const unit of npc.units||[]){
   rows.totalUnits++;const skill=unit.skill;
   const sourceExact=unit.provenance==='SOURCE_EXACT_WITH_P2_ADAPTER';
   if(sourceExact)rows.sourceExactUnits++;
   if(sourceExact&&Array.isArray(unit.effects)&&unit.effects.length){rows.sourceEffectUnits++;for(const effect of unit.effects){
     rows.sourceEffectRows++;if(effect?.id!=null)rows.sourceEffectIds.add(String(effect.id));if(effect?.name)rows.sourceEffectNames.add(effect.name);
   }}
   if(!skill||typeof skill!=='object'||!skill.name||!skill.desc)continue;
   rows.withNameAndDescription++;rows.skillNames.add(skill.name);
   if(sourceExact){rows.sourceExactWithNameAndDescription++;rows.sourceExactSkillNames.add(skill.name);}
   const d=descriptor(skill,unit.role||'infantry',npc.boss,unit.effects);
   if(d.sourceTargetMode==='LEAST_TROOPS')rows.sourceLeastTroopsTargets++;
   if(d.sourceConditionalMorale)rows.sourceConditionalMoraleBranches++;
   if(d.sourceApplications?.length){rows.sourceStatusAdapted+=d.sourceApplications.length;rows.sourceStatusAdaptedUnits++;
     for(const effect of d.sourceApplications)rows.sourceStatusIds.add(effect.sourceId);}
   if(d.sourceSkillClassification==='SOURCE_DAMAGE_COEFFICIENT_AND_TARGET_ADAPTED'){
     rows.sourceDamageAdapted++;if(sourceExact)rows.sourceExactDamageAdapted++;
   }else if(d.sourceSkillClassification==='SOURCE_HEAL_COEFFICIENT_ADAPTED'){
     rows.sourceHealAdapted++;if(sourceExact)rows.sourceExactHealAdapted++;
   }else if(d.sourceSkillClassification==='SOURCE_MORALE_ONLY_ADAPTED'){
     if(sourceExact)rows.sourceExactMoraleAdapted++;
   }else if(d.sourceSkillClassification==='SOURCE_EFFECT_STATUS_ONLY_ADAPTED'){
     if(sourceExact)rows.sourceStatusOnlyAdapted++;
   }else rows.simulatedFallback++;
   if(String(d.skillFieldProvenance?.secondaryEffects||'').startsWith('UNRESOLVED'))rows.unresolvedSecondaryEffects++;
 }
 return {...rows,skillNames:rows.skillNames.size,sourceExactSkillNames:rows.sourceExactSkillNames.size,
   sourceEffectIds:rows.sourceEffectIds.size,sourceEffectNames:rows.sourceEffectNames.size,sourceStatusIds:rows.sourceStatusIds.size,
   sourceEdition:NL_CONTENT_C.sourceEdition};
}
function skillProbe(name){
 for(const map of MAPS)for(let npcIndex=0;npcIndex<map.npcs.length;npcIndex++){
   const npc=map.npcs[npcIndex];for(let unitIndex=0;unitIndex<(npc.units||[]).length;unitIndex++){
     const unit=npc.units[unitIndex],skill=unit.skill;
     if(unit.provenance==='SOURCE_EXACT_WITH_P2_ADAPTER'&&skill?.name===name)
     return {mapId:map.id,npcId:npc.id,npcIndex,unitIndex,slot:unit.slot,skill:structuredClone(skill),effects:structuredClone(unit.effects||[])};
   }
 }
 return null;
}
const nlContentCMobileBaseStatus=p2Status;
p2Status=function(unit,kind,turns,...rest){
 if(unit?.nlMobileControlCharges>0&&['daze','sleep','fear',MOBILE_CONTROL_STATUS,MOBILE_SLEEP_STATUS,MOBILE_NO_NORMAL].includes(kind)){unit.nlMobileControlCharges--;return false;}
 if(unit?.effects?.some(effect=>effect.kind===MOBILE_NO_BUFFS_STATUS&&effect.turns>0)&&
    NL_GAME_DATA.statusEffects.effects[kind]?.polarity==='beneficial')return false;
 if(unit?.team==='e'&&battle?.nlContentC&&kind===MOBILE_DAMAGE_ONE_STATUS&&
   Number.isInteger(unit.nlCDescriptor?.applyAllyDuration))turns=unit.nlCDescriptor.applyAllyDuration;
 return nlContentCMobileBaseStatus(unit,kind,turns,...rest);
};
const nlContentCMobileBaseStatusValue=p2StatusValue;
p2StatusValue=function(effect,field){
 const sourceValue=effect?.mobileSourceValues?.[field];
 if(field==='outgoingDamageMultiplier'&&effect?.kind===MOBILE_ATTACK_STACK_STATUS&&Number.isFinite(sourceValue))
   return 1+((sourceValue-1)*Math.max(1,nat(effect.stacks)||1));
 return Number.isFinite(sourceValue)?sourceValue:nlContentCMobileBaseStatusValue(effect,field);
};
const nlContentCMobileBaseMorale=p2Morale;
p2Morale=function(unit,delta){
 if(unit&&delta>0)delta=Math.floor(delta*p2StatusFactor(unit,'moraleGainMultiplier'));
 return nlContentCMobileBaseMorale(unit,delta);
};
function applyMobileSourceStatus(unit,app){
 if(!unit||!app||!Number.isInteger(app.turns)||app.turns<1||!p2Status(unit,app.kind,app.turns))return false;
 const status=unit.effects.find(effect=>effect.kind===app.kind);
 if(!status)return false;
 status.mobileSourceValues=structuredClone(app.values||{});
 status.mobileSource={sourceEdition:MOBILE_BUFFS.sourceEdition,sourceEffectId:app.sourceId,
   sourceName:app.sourceName,sourceDescription:app.sourceDescription,sourceDetail:app.detail};
 return true;
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
  e.nlCDescriptor=descriptor(u.skill,role,boss,u.effects);
  e.nlMobileSource={npcId:o.id||null,troopId:u.sourceTroopId||null,troopType:u.sourceTroopType||null,
   sourceHp:u.sourceHp??null,sourceSkillName:u.sourceSkillName||u.skill?.name||u.skill||null,
   sourceSkillDescription:u.skill&&typeof u.skill==='object'?u.skill.desc||null:null,
   sourceEffects:structuredClone(Array.isArray(u.effects)?u.effects:[]),
   sourceEffectsOwnerNpcId:u.sourceEffectsOwnerNpcId||o.id||null,
   sourceEffectsClassification:u.provenance==='SOURCE_EXACT_WITH_P2_ADAPTER'?'SOURCE_EXACT':
     (Array.isArray(u.effects)&&u.effects.length?'SOURCE_EXACT_FROM_DONOR':'SIMULATED_OR_EMPTY'),
   skillAdapter:e.nlCDescriptor.sourceSkillClassification||'SIMULATED_LEGACY_LABEL',
   adapter:u.provenance||'PROJECT_SIMULATED'};
  const {ratio,difficulty}=power,sourceTroop=MOBILE_TROOPS.units[String(u.sourceTroopId||'')];
  if(sourceTroop)mobileTroopCoefficients(e,u.sourceTroopId);
  for(const k of ['atk','catk','matk','def','tdef','mdef'])e[k]=Math.max(1,Math.round(e[k]*ratio*difficulty*(sourceTroop?1:(ROLE_COEFFICIENTS[role]?.[k]||1))*(boss?1.12:1)));
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
  if(o.repeat){if(!canReplayNpc(o.id))return {};o.mobileDropRolls=rollMobileCampaignDrops(r);s.npcRepeat[o.id]=npcRepeatCount(o.id)+1;trainingVictory();awardMerit(o,npcMerit(r,true));return {...npcReward(r,true),...sealCurrencyReward(r,true)};}
  if(s.cleared[o.id])return {};
  o.mobileDropRolls=rollMobileCampaignDrops(r);
  s.cleared[o.id]=true;s.soul+=r.n.boss?15:5;trainingVictory();
  s.bookExp+=100+npcDifficulty(r)*10;s.horsePoints+=1000+npcDifficulty(r)*50;if(r.n.boss)s.bookFragments+=5;
  // Public technology price tables are exact; earned-only currency sources are simulated.
  const science=1+Math.floor(npcDifficulty(r)/10);s.mobileTechPoints+=science;o.mobileTechPoints=science;
  const reward={...npcReward(r),...sealCurrencyReward(r)};let merit=npcMerit(r);
  if(!s.mapsCleared[r.map.id]&&r.map.npcs.every(n=>s.cleared[n.id])){
   s.mapsCleared[r.map.id]=true;const tripod=2+Math.floor(npcDifficulty(r)/5);s.mobileTechTripods+=tripod;o.mobileTechTripods=tripod;const bonus=mapBonus(r.map);s.soul+=bonus.soul;merit+=40+Math.floor(npcDifficulty(r)*2);
   for(const k of ['silver','gold','grain','prestige'])reward[k]=(reward[k]||0)+(bonus[k]||0);
   reward.chienTich+=1000+r.map.gate*150;
   if(Object.keys(s.mapsCleared).length%25===0)reward.hoPhu+=1;
  }
  awardMerit(o,merit);return reward;
 }
 if(o.kind==='tower'&&o.floor===floor()+1&&o.floor<=NL_CONTENT_C_TOWER.maxFloor){
  s.extraFloor++;trainingVictory();const reward=towerRewards(o.floor);s.soul+=reward.soul;awardMerit(o,15+o.floor*2);return {silver:reward.silver,grain:reward.grain,prestige:reward.prestige,chienTich:1000+o.floor*200,hoPhu:o.floor%10===0?1:0};
 }
 return {};
};
function mobileHeroSkill(id){
 if(id===MOBILE_CHILD_ID){const d=childSkillDescriptor(childState());return d?.nlMobileHeroSkill?d:null;}
 const quality=mobileHeroQuality(id),skill=quality?.stage?.skill;
 if(!skill?.name||!skill.desc)return null;
 const effects=(skill.buffs||[]).map(id=>({id:String(id),name:MOBILE_BUFFS.records[String(id)]?.name})).filter(x=>x.name);
 const d=descriptor(skill,HEROES[id]?.type||'infantry',false,effects),fold=mobileTextKey(skill.desc);
 // Only literal, unambiguous support amounts. A variable in braces is deliberately not invented.
 const ally=fold.match(/(tuong khac cua phe ta|toan phe ta) (?:hoi|tang) (\d+)(?:\+\{[^}]+\})? si khi/);
 const enemy=fold.match(/(?:toan phe dich giam|giam) (\d+) si khi(?: toan phe dich)?/);
 if(/^\s*\[ho tro\]/.test(fold)&&ally&&!/tri lieu|hoi phuc|sat thuong (?:vat ly|phep)/.test(fold)){
   d.pattern='morale';d.kind='tactic';d.mult=0;d.bonusMorale=Number(ally[2]);d.sourceMoraleOnly=true;
   d.sourceMoraleScope=ally[1].includes('tuong khac')?'OTHER_ALLIES':'ALL_ALLIES';
   d.sourceEnemyMorale=enemy?Number(enemy[1]):0;d.sourceSkillClassification='SOURCE_HERO_MORALE_ADAPTER';
   if(/\+\{/.test(ally[0]))d.sourceVariableMoraleUnresolved=true;
 }
 if(d.sourceSkillClassification?.startsWith('SIMULATED_FALLBACK')&&!d.sourceMoraleOnly)return null;
 d.nlMobileHeroSkill=true;d.sourceHeroId=quality.sourceId;d.sourceQuality=quality.growth.q;
 return d;
}
const oldSkill=p2Skill;
p2Skill=function(actor){
 if(actor?.team==='e'&&battle?.nlContentC&&actor.nlCDescriptor)return actor.nlCDescriptor;
 if(actor?.team!=='p'||battle?.mode==='cltq'||battle?.replay)return oldSkill(actor);
 if(actor.id===MOBILE_CHILD_ID){const d=childSkillDescriptor(childState());if(d)return d;}
 const exact=mobileHeroSkill(actor.id);if(exact)return exact;
 const chosen=awakeningDescriptor(actor.id);
 if(!chosen?.descriptor)return oldSkill(actor);
 const d={...chosen.descriptor},pattern=actor.nlClassicWebPattern;
 if(['row','column','back'].includes(pattern)&&d.pattern==='single'){d.pattern=pattern;d.mult*=.75;}
 if(actor.nlClassicWebAbility==='control'&&d.pattern!=='heal'&&!d.apply){d.apply='daze';d.applyChance=.18+.03*(actor.nlClassicWebTier||1);}
 return d;
};
const nlContentCBaseHit=p2Hit;
function mobileSingleHit(attacker,target,kind,mult=1,opts={}){
 const trait=mobileTraitFactors(attacker,target,kind,attacker?.nlMobileActionPattern||'single',battle?.round||1);
 const ar=attacker?.nlMobileRefine,tr=target?.nlMobileRefine,af=attacker?.nlMobileHero?.faction,tf=target?.nlMobileHero?.faction;
 const ab=attacker?.nlMobileHeroBuild,tb=target?.nlMobileHeroBuild,pattern=attacker?.nlMobileActionPattern||'single';
 mult*=Math.max(0,1+(ab?.finalDamage||0)+(ab?.patterns?.[pattern]||0)+(ab?.troopAttack?.[attacker?.troop]||0))*Math.max(0,1-(tb?.troopDefense?.[target?.troop]||0));
 const bookResist=(target?.team==='p'?battle?.p:battle?.e)?.reduce((a,u)=>a+(u.hp>0?(u.nlMobileTraining?.resist?.[af]||0):0),0)||0;
 mult*=Math.max(0,1-bookResist);
 mult*=trait.outgoing*trait.incoming*mobileTechDamage(attacker,target)*(1+(ar?.finalDamage||0)+(ar?.vs?.[tf]||0))*Math.max(0,1-(tr?.resist?.[af]||0));
 const protectedBySource=target?.effects?.some(effect=>effect.kind===MOBILE_DAMAGE_ONE_STATUS&&effect.turns>0);
 const oneHitShield=target?.effects?.find(effect=>effect.kind===MOBILE_ONE_HIT_SHIELD_STATUS&&effect.turns>0);
 const resolvedTarget=oneHitShield?{...target,effects:structuredClone(target.effects)}:target;
 const beforeHp=target?.hp,beforeMorale=target?.morale;
 const critAdd=(attacker?.effects||[]).reduce((sum,effect)=>sum+(Number(effect.mobileSourceValues?.criticalChanceAdd)||0)*(effect.stacks||1),0);
 const effectiveAttacker=critAdd?{...attacker,crit:Math.min(.95,(Number(attacker.crit)||0)+critAdd)}:attacker;
 const vectorField=({physical:'physicalDamageMultiplier',tactic:'tacticDamageMultiplier',magic:'magicDamageMultiplier'})[kind];
 const vectorMultiplier=vectorField?(attacker?.effects||[]).reduce((factor,effect)=>{
   const value=effect.mobileSourceValues?.[vectorField];return Number.isFinite(value)?factor*value:factor;
 },1):1;
 const activeBeneficialKinds=new Set((target?.effects||[]).filter(effect=>effect.turns>0&&
   NL_GAME_DATA.statusEffects.effects[effect.kind]?.polarity==='beneficial').map(effect=>effect.kind));
 const perBuffDamage=(attacker?.nlMobileSourceSkillAction?(attacker?.effects||[])
   .filter(effect=>effect.kind===MOBILE_PURIFICATION_STATUS&&effect.turns>0)
   .reduce((sum,effect)=>sum+(Number(effect.mobileSourceValues?.damageBonusPerBeneficialBuff)||0),0):0);
 const purificationMultiplier=perBuffDamage?1+activeBeneficialKinds.size*perBuffDamage:1;
 const guardField=({physical:'def',tactic:'tdef',magic:'mdef'})[kind];
 const defenseValueField=({physical:'incomingPhysicalDefenseMultiplier',tactic:'incomingTacticDefenseMultiplier',magic:'incomingMagicDefenseMultiplier'})[kind];
 const sourceDefenseMultiplier=guardField?(resolvedTarget?.effects||[]).filter(effect=>effect.turns>0)
   .reduce((factor,effect)=>{const value=effect.mobileSourceValues?.[defenseValueField];return Number.isFinite(value)?factor*value:factor;},1):1;
 const teamDefense=(target?.team==='p'?battle?.p:battle?.e)?.reduce((a,u)=>a+(u.hp>0?(u.nlMobileRefine?.teamDefense||0):0),0)||0;
 const guardFactor=sourceDefenseMultiplier*(attacker?.nlMobilePierceActive?.9:1)*(1+teamDefense);
 const previousGuard=guardField?resolvedTarget?.[guardField]:undefined;
 if(Number.isFinite(previousGuard))resolvedTarget[guardField]=Math.max(0,previousGuard*guardFactor-(ar?.pierceFlat||0));
 let hit;
 try{hit=nlContentCBaseHit(effectiveAttacker,resolvedTarget,kind,mult*vectorMultiplier*purificationMultiplier,opts);}
 finally{if(Number.isFinite(previousGuard))resolvedTarget[guardField]=previousGuard;}
 const rawDamage=beforeHp-resolvedTarget.hp;
 if(oneHitShield&&rawDamage>0){
   target.effects=target.effects.filter(effect=>effect!==oneHitShield);
   hit.amount=0;hit.number='-0';hit.mobileSourceShieldBlocked=true;return hit;
 }
 const damageReduction=(target?.effects||[]).filter(effect=>effect.kind===MOBILE_INCOMING_STATUS&&effect.turns>0)
   .reduce((factor,effect)=>factor*(Number.isFinite(effect.mobileSourceValues?.incomingDamageMultiplier)?effect.mobileSourceValues.incomingDamageMultiplier:1),1);
 let damage=Math.min(beforeHp,Math.floor(rawDamage*damageReduction*(hit.critical===true||hit.crit===true?1+(ar?.critDamage||0)+(ab?.critDamage||0):1)));
 if(protectedBySource&&rawDamage>0)damage=Math.min(damage||1,1);
 if(damage>0&&target?.nlMobileAbsorb>0){const blocked=Math.min(damage,target.nlMobileAbsorb);target.nlMobileAbsorb-=blocked;damage-=blocked;hit.mobileTraitAbsorbed=blocked;}
 if(damage!==rawDamage){target.hp=beforeHp-damage;target.alive=target.hp>0;target.morale=beforeMorale;
   if(damage>0)p2Morale(target,target.type==='strategist'?34:25);
   hit.amount=damage;hit.number='-'+damage;}
 if(hit.amount>0&&target?.effects?.some(effect=>effect.kind===MOBILE_SLEEP_STATUS))
   target.effects=target.effects.filter(effect=>effect.kind!==MOBILE_SLEEP_STATUS);
 const lifeSteal=(attacker?.effects||[]).filter(effect=>effect.kind===MOBILE_LIFESTEAL_STATUS&&effect.turns>0)
   .reduce((sum,effect)=>sum+(Number(effect.mobileSourceValues?.lifestealDamageMultiplier)||0),0);
 if(hit.amount>0&&lifeSteal>0&&Number.isFinite(attacker.hp)&&Number.isFinite(attacker.maxHp)){
   const healed=Math.min(Math.max(0,attacker.maxHp-attacker.hp),Math.floor(hit.amount*Math.min(1,lifeSteal)));
   attacker.hp+=healed;if(healed>0)attacker.alive=true;hit.mobileSourceHealing=healed;
 }
 return hit;
}
function mobileRepeatHit(single,attacker,target,kind,mult,opts,count){
 const hits=[];let amount=0;
 for(let i=0;i<count&&target.hp>0&&attacker.hp>0;i++){
   const h=single(attacker,target,kind,mult,opts);if(!h)break;
   hits.push({...h});amount+=Math.max(0,Number(h.amount)||0);
 }
 if(!hits.length)return {team:target.team,slot:target.slot,kind,amount:0,number:'-0',mobileSourceHitCount:0,mobileSourceRequestedHits:count,mobileSourceHits:[]};
 const last=hits[hits.length-1];
 if(hits.length===1&&count===1)return last;
 return {...last,amount,number:'-'+amount,mobileSourceHitCount:hits.length,mobileSourceRequestedHits:count,mobileSourceHits:hits};
}
p2Hit=function(attacker,target,kind,mult=1,opts={}){
 const d=attacker?.nlMobileSourceSkillAction?(attacker.team==='e'?attacker.nlCDescriptor:mobileHeroSkill(attacker.id)):null;
 const count=Number.isSafeInteger(d?.sourceHitCount)?clamp(d.sourceHitCount,1,20):1;
 // Each hit is the existing P2 hit path; no additional action, reward or skill settlement.
 return count>1&&!battle?.replay?mobileRepeatHit(mobileSingleHit,attacker,target,kind,mult,opts,count):mobileSingleHit(attacker,target,kind,mult,opts);
};
const nlContentCBaseHeal=p2Heal;
p2Heal=function(attacker,target,mult){
 if((attacker?.team==='e'&&battle?.nlContentC&&attacker.nlCDescriptor?.sourceNoHealing)||(attacker?.team==='p'&&attacker.nlMobileSourceSkillAction&&mobileHeroSkill(attacker.id)?.sourceNoHealing))
   return {team:target.team,slot:target.slot,amount:0,number:'+0',heal:true,kind:'heal'};
 const received=(target?.effects||[]).filter(effect=>effect.kind===MOBILE_HEAL_REDUCTION_STATUS&&effect.turns>0)
   .reduce((factor,effect)=>factor*(Number.isFinite(effect.mobileSourceValues?.incomingHealingMultiplier)?effect.mobileSourceValues.incomingHealingMultiplier:1),1);
 return nlContentCBaseHeal(attacker,target,mult*received);
};
// Preserve the source Cổ Vũ support action on the native P2 turn/event path.
// The temporary drum role is an adapter only; the original troop identity returns
// before the stored snapshot is finalized, and no damage resolver is added.
const nlContentCNativePerform=p2Perform;
function mobileSourceApplicationTargets(actor,event,app,descriptor){
 const same=event.actorTeam==='e'?battle.e:battle.p,opposite=event.actorTeam==='e'?battle.p:battle.e;
 if(app.scope==='self')return [actor];
 if(app.scope==='allies')return same.filter(unit=>unit.hp>0);
 if(app.scope==='enemies')return opposite.filter(unit=>unit.hp>0);
 if(app.scope==='targets'&&descriptor.sourceNoHealing){const target=opposite.find(unit=>unit.hp>0);return target?[target]:[];}
 return (event.hits||[]).map(hit=>(hit.team==='e'?battle.e:battle.p).find(unit=>unit.slot===hit.slot)).filter(unit=>unit&&unit.hp>0);
}
function applyMobileSourceApplications(actor,event,descriptor){
 if(!battle||(!battle.nlContentC&&!descriptor?.nlMobileHeroSkill)||event?.actor!==actor?.name||event.mode==='stunned'||!descriptor?.sourceApplications?.length)return;
 const applied=[];
 for(const app of descriptor.sourceApplications){
  for(const target of mobileSourceApplicationTargets(actor,event,app,descriptor)){
   if(app.condition==='TARGET_SURVIVES'&&target.hp<=0)continue;
   if(app.chance<1&&p2Random()>=app.chance)continue;
   if(applyMobileSourceStatus(target,app))applied.push({target:target.name,name:app.sourceName,turns:app.turns});
  }
 }
 if(!applied.length)return;
 const labels=[...new Set(applied.map(row=>row.name))].join(' · ');
 event.description=descriptor.sourceNoHealing?
   '✦ '+actor.name+' thi triển '+actor.skill+', áp dụng '+labels+'.':
   event.description+' Hiệu ứng: '+labels+'.';
 event.state=p2Snapshot();battle.log=event.description;
 const log=document.getElementById('combat-log');if(log)log.textContent=event.description;
}
function applyMobileSourceConditionalMorale(actor,event,descriptor){
 const branch=descriptor?.sourceConditionalMorale;
 if(!battle||(!battle.nlContentC&&!descriptor?.nlMobileHeroSkill)||event?.actor!==actor?.name||event.mode==='stunned'||!branch)return;
 const opposing=actor.team==='p'?'e':'p';
 const hitUnits=(event.hits||[]).filter(hit=>hit.team===opposing).map(hit=>battle[opposing].find(unit=>unit.slot===hit.slot)).filter(Boolean);
 if(!hitUnits.length)return;
 const killed=hitUnits.some(unit=>unit.hp<=0),moraleBefore=actor.morale,requested=killed?branch.onKill:branch.onSurvival;
 if(!killed&&branch.onSurvivalStatus){
   for(const target of hitUnits.filter(unit=>unit.hp>0))applyMobileSourceStatus(target,branch.onSurvivalStatus);
 }
 if(Number.isFinite(branch.onAction))p2Morale(actor,branch.onAction);
 p2Morale(actor,requested);
 const gained=actor.morale-moraleBefore;
 event.description+=' '+(killed?'Diệt mục tiêu':'Mục tiêu sống sót')+', sĩ khí '+(gained>=0?'+':'')+gained+'.';
 event.state=p2Snapshot();battle.log=event.description;
 const log=document.getElementById('combat-log');if(log)log.textContent=event.description;
}
// Only documented per-turn clauses that can be parsed without guessing.
function mobilePassivePlan(passive){
 const text=mobileTextKey(passive?.desc),plan={name:passive?.name,limit:0,allyMorale:0,selfMorale:0,enemyMorale:0,dispel:0,line:false};
 const limit=text.match(/(\d+) luot dau tran/);if(limit)plan.limit=Number(limit[1]);
 if(!/moi luot/.test(text)||/khi (?:khai chien|bat dau tran|doi phuong|ban than bat dau)/.test(text))return null;
 const ally=text.match(/tang cho cac tuong khac phe ta (\d+) si khi/),self=text.match(/ban than tang (\d+) si khi/),enemy=text.match(/khien dich giam (\d+) si khi/),dispel=text.match(/giai tru (\d+) (?:trang thai|hieu qua) co loi cua (?:muc tieu|dich tren duong thang)/);
 if(ally)plan.allyMorale=Number(ally[1]);if(self)plan.selfMorale=Number(self[1]);if(enemy)plan.enemyMorale=Number(enemy[1]);if(dispel)plan.dispel=Number(dispel[1]);
 plan.line=/dich tren duong thang/.test(text);
 return plan.allyMorale||plan.selfMorale||plan.enemyMorale||plan.dispel?plan:null;
}
function mobileBookCleanse(u,max){
 let n=0;u.effects=(u.effects||[]).filter(e=>{const spec=NL_GAME_DATA.statusEffects.effects[e.kind];if(n<max&&spec?.polarity==='harmful'&&spec.dispelPolicy==='removable'){n++;return false;}return true;});return n;
}
function mobileBookRestore(u,ratio){const old=u.hp;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*ratio));return u.hp-old;}
function mobileBookAction(actor,event){
 const b=actor?.nlMobileTraining?.book;if(!b||!battle||battle.replay||battle.mode==='cltq'||actor.hp<=0||event?.actor!==actor.name||event.mode==='stunned')return false;
 actor.nlMobileBookTurns=nat(actor.nlMobileBookTurns)+1;
 if(![3,6].includes(actor.nlMobileBookTurns))return false;
 const desc=mobileTextKey(b.desc),enemies=battle.e.filter(x=>x.hp>0),allies=battle.p.filter(x=>x.hp>0);
 let changed=false;
 if(b.id==='1'&&enemies.length){
  const target=enemies.slice().sort((a,b)=>b.morale-a.morale||a.slot-b.slot)[0],n=desc.match(/giam (\d+) si khi/);
  if(/giam toan bo si khi/.test(desc)){p2Morale(target,-target.morale);changed=true;}
  else if(n){p2Morale(target,-Number(n[1]));changed=true;}
  const extra=desc.match(/giam them (\d+) si khi/);if(extra)for(const e of enemies)p2Morale(e,-Number(extra[1]));
 }else if(b.id==='2'&&allies.length){
  const targets=allies.slice().sort((a,b)=>a.hp-b.hp||a.slot-b.slot),u=targets[0],g=b.grade;
  const removed=mobileBookCleanse(u,g>=3?Infinity:g),healed=mobileBookRestore(u,[.5,.7,1,1,1][g-1]);
  changed=removed>0||healed>0;if(g>=4&&targets[1])changed=mobileBookRestore(targets[1],g===4?.2:.4)>0||changed;
 }else if(b.id==='4'&&allies.length){const n=desc.match(/hoi (\d+) si khi/);if(n){p2Morale(allies.slice().sort((a,b)=>a.morale-b.morale||a.slot-b.slot)[0],Number(n[1]));changed=true;const extra=desc.match(/hoi them cho toan phe ta (\d+) si khi/);if(extra)for(const u of allies)p2Morale(u,Number(extra[1]));}}
 else if(b.id==='6'){for(const u of allies){const removed=mobileBookCleanse(u,b.grade===1?1:2);if(removed){p2Morale(u,removed*(b.grade<=2?10:20));changed=true;}}}
 else if(b.id==='8'){const n=desc.match(/giam (\d+) si khi/);if(n){for(const e of enemies)p2Morale(e,-Number(n[1]));changed=!!enemies.length;}}
 if(changed){event.description+=' · '+b.name;event.state=p2Snapshot();battle.log=event.description;}
 return changed;
}
function mobileApplyTurnPassives(actor,event){
 if(!battle||battle.replay||battle.mode==='cltq'||actor?.team!=='p'||!event||event.actor!==actor.name||event.mode==='stunned'||actor.hp<=0)return [];
 const passives=actor.nlMobileHeroBuild?.passives||[];if(!passives.length)return [];
 actor.nlMobilePassiveTurns=(actor.nlMobilePassiveTurns||0)+1;
 const enemies=battle.e.filter(u=>u.hp>0),firstHit=(event.hits||[]).find(h=>h.team==='e'),target=enemies.find(u=>u.slot===firstHit?.slot)||enemies[0],labels=[];
 for(const passive of passives){
  const p=mobilePassivePlan(passive);if(!p||p.limit&&actor.nlMobilePassiveTurns>p.limit)continue;
  let changed=false;
  if(p.allyMorale)for(const u of battle.p.filter(u=>u!==actor&&u.hp>0)){p2Morale(u,p.allyMorale);changed=true;}
  if(p.selfMorale){p2Morale(actor,p.selfMorale);changed=true;}
  if(target&&p.enemyMorale){p2Morale(target,-p.enemyMorale);changed=true;}
  if(target&&p.dispel)for(const u of p.line?enemies.filter(x=>x.slot%3===target.slot%3):[target]){
    let remain=p.dispel;
    const prev=u.effects||[];
    u.effects=prev.filter(effect=>{const spec=NL_GAME_DATA.statusEffects.effects[effect.kind];if(remain>0&&spec?.polarity==='beneficial'&&spec.dispelPolicy!=='undispellable'&&spec.dispelPolicy!=='non-removable'&&spec.dispelPolicy!=='permanent'&&spec.dispelPolicy==='removable'){remain--;return false;}return true;});
    if(u.effects.length!==prev.length)changed=true;
  }
  if(changed)labels.push(p.name);
 }
 if(labels.length){event.description+=' · '+labels.join(' · ');event.state=p2Snapshot();battle.log=event.description;}
 return labels;
}
p2Perform=function(actor){
 const d=actor?.team==='e'&&battle?.nlContentC?actor.nlCDescriptor:
   actor?.team==='p'&&battle&&!battle.replay&&battle.mode!=='cltq'&&actor.morale>=100?mobileHeroSkill(actor.id):null;
 const sourceSkillAction=!!actor&&actor.morale>=100&&!!d;
 const moraleOnly=!!actor&&actor.morale>=100&&d?.sourceMoraleOnly&&Number.isFinite(d.bonusMorale);
 const originalTroop=actor?.troop,originalMorale=p2Morale,eventIndex=battle?.events?.length||0;
 const previousSkillAction=actor?.nlMobileSourceSkillAction,hadSkillAction=!!actor&&Object.hasOwn(actor,'nlMobileSourceSkillAction');
 if(moraleOnly){
  actor.troop='drum';
  p2Morale=function(unit,delta){
    if(unit?.team===actor.team&&delta>0){
      if(unit===actor&&d.sourceMoraleScope==='OTHER_ALLIES')return originalMorale(unit,0);
      return originalMorale(unit,d.bonusMorale);
    }
    if(unit?.team!==actor.team&&delta<0)return originalMorale(unit,0);
    return originalMorale(unit,delta);
  };
 }
 try{
   if(actor)actor.nlMobileSourceSkillAction=!!(d&&actor.morale>=100&&!moraleOnly);
   // Chước Giới blocks only the next normal action, not a morale skill.
   if(actor?.nlMobileNoNormal){
     actor.nlMobileNoNormal=false;
     if(actor.morale<100)p2Status(actor,MOBILE_NO_NORMAL,1);
   }
   if(actor?.nlMobileTrait?.name==='Kình Nỏ')actor.nlMobilePierceActive=p2Random()<mobileTraitRate(actor,[.15,.24,.40]);
   if(actor){
     actor.nlMobileActionPattern=actor.morale>=100?(p2Skill(actor)?.pattern||'single'):'single';
   }
   const result=nlContentCNativePerform(actor);
   if(actor){actor.troop=originalTroop;if(hadSkillAction)actor.nlMobileSourceSkillAction=previousSkillAction;else delete actor.nlMobileSourceSkillAction;}
   const event=battle?.events?.[eventIndex];
   const multi=(event?.hits||[]).filter(h=>h.mobileSourceHitCount>1);if(multi.length){event.description+=' · '+multi.map(h=>h.mobileSourceHitCount+' đòn').join(' / ');event.state=p2Snapshot();battle.log=event.description;}
   if(moraleOnly&&event?.actor===actor.name&&event.mode==='drum'){
     const audience=d.sourceMoraleScope==='OTHER_ALLIES'?'các tướng đồng minh khác':'toàn phe ta';
     event.description='🥁 '+actor.name+' thi triển '+actor.skill+': '+audience+' hồi '+d.bonusMorale+' sĩ khí.';
     event.state=p2Snapshot();battle.log=event.description;
     const log=document.getElementById('combat-log');if(log)log.textContent=event.description;
   }
   if(moraleOnly&&d.nlMobileHeroSkill&&event?.actor===actor.name&&event.mode==='drum'&&d.sourceEnemyMorale){
     for(const target of (actor.team==='p'?battle.e:battle.p).filter(u=>u.hp>0))originalMorale(target,-d.sourceEnemyMorale);
     event.description+=' · giảm '+d.sourceEnemyMorale+' sĩ khí toàn địch.';event.state=p2Snapshot();battle.log=event.description;
   }
   if(moraleOnly||sourceSkillAction){applyMobileSourceApplications(actor,event,d);applyMobileSourceConditionalMorale(actor,event,d);}
   // Restore the native morale function before independent per-turn passives.
   p2Morale=originalMorale;mobileApplyTurnPassives(actor,event);mobileBookAction(actor,event);
   if(actor?.nlMobileTrait&&event&&event.mode!=='stunned'&&actor.hp>0){
     actor.nlMobileTraitTurns=(actor.nlMobileTraitTurns||0)+1;
     let label='';
     if(actor.nlMobileTrait.name==='Khích Lệ'&&actor.nlMobileTraitTurns>=2&&actor.nlMobileTraitTurns<=6){p2Morale(actor,mobileTraitRate(actor,[10,15,25]));label='Khích Lệ';}
     if(actor.nlMobileTrait.name==='Công Tâm'&&p2Random()<mobileTraitRate(actor,[.30,.50,.80])){
       const target=(actor.team==='p'?battle.e:battle.p).find(u=>u.hp>0);if(target){p2Morale(target,-15);label='Công Tâm';}
     }
     const enemies=(actor.team==='p'?battle.e:battle.p).filter(u=>u.hp>0);
     const hit=(event.hits||[]).find(h=>h.team!==actor.team),target=enemies.find(u=>u.slot===hit?.slot)||enemies[0];
     if(actor.nlMobileTrait.name==='Chước Giới'&&target&&p2Random()<mobileTraitRate(actor,[.15,.24,.40])){target.nlMobileNoNormal=true;label='Chước Giới';}
     if(actor.nlMobileTrait.name==='Giẫm Đạp'&&target&&p2Random()<mobileTraitRate(actor,[.09,.15,.24])){
       for(const t of enemies.filter(u=>Math.floor(u.slot/3)===Math.floor(target.slot/3))){
         t.nlMobileTrample=(t.nlMobileTrample||0)+1;
         if(t.nlMobileTrample>=4){t.nlMobileTrample=0;p2Status(t,MOBILE_CONTROL_STATUS,1);}
       }label='Giẫm Đạp';
     }
     if(actor.nlMobilePierceActive)label='Kình Nỏ';
     if(label){event.description+=' · '+label;event.state=p2Snapshot();battle.log=event.description;}
   }
   return result;
 }finally{p2Morale=originalMorale;if(actor){delete actor.nlMobileActionPattern;delete actor.nlMobilePierceActive;actor.troop=originalTroop;if(hadSkillAction)actor.nlMobileSourceSkillAction=previousSkillAction;else delete actor.nlMobileSourceSkillAction;}}
};
const nlContentCBaseTarget=p2Target;
p2Target=function(actor,mode){
 const plan=battle?.nlContentC;
 if(actor?.team==='p'&&battle&&!battle.replay&&battle.mode!=='cltq'&&actor.morale>=100&&mobileHeroSkill(actor.id)?.sourceTargetMode==='LEAST_TROOPS')return battle.e.filter(u=>u.hp>0).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0]||null;
 if(actor?.team!=='e'||!plan)return nlContentCBaseTarget(actor,mode);
 if(actor.nlCDescriptor?.sourceTargetMode==='LEAST_TROOPS')
   return battle.p.filter(unit=>unit.hp>0).sort((a,b)=>(Number(a.troops)||Number(a.hp)||0)-(Number(b.troops)||Number(b.hp)||0)||a.slot-b.slot)[0]||null;
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
 s.soul-=300;delete s.mobileTroopAssigned[id];const b=nlwB4State();b.assigned[id]=tid;b.selectionReceipts.push({heroId:id,troopId:tid,silver:5000,at:Date.now(),source:'PROJECT_SIMULATED_C'});b.selectionReceipts=b.selectionReceipts.slice(-250);save();render();return true;
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
 const exact=team==='p'&&battle?.mode!=='cltq'?mobileHeroQuality(id):null,prior=HEROES[id];
 const talent=team==='p'&&battle?.mode!=='cltq'?mobileTraitChoice(id):null;
 const allRound=talent?.name==='Toàn Năng'?[9,15,24][talent.rank-1]:0;
 const training=team==='p'&&owned(id)&&battle?.mode!=='cltq'?trainingModifiers(id):null;
 const build=team==='p'&&owned(id)&&battle?.mode!=='cltq'&&typeof nlMobileHeroBuildModifiers==='function'?nlMobileHeroBuildModifiers(id):null;
 const refine=team==='p'&&battle?.mode!=='cltq'&&owned(id)&&typeof nlItemApi?.mobileRefineModifiers==='function'?nlItemApi.mobileRefineModifiers(game,id):null;
 let u;
 if((exact||allRound||refine?.lead||refine?.war||refine?.intellect||build?.lead||build?.war||build?.intellect||training?.lead||training?.war||training?.intellect)&&prior){
   // Apply the source attribute bonus before the single native stat formula.
   const g=exact?.growth;HEROES[id]={...prior,lead:(g?.lead??prior.lead??0)+allRound+(refine?.lead||0)+(build?.lead||0)+(training?.lead||0),atk:(g?.war??prior.atk??0)+allRound+(refine?.war||0)+(build?.war||0)+(training?.war||0),int:(g?.int??prior.int??0)+allRound+(refine?.intellect||0)+(build?.intellect||0)+(training?.intellect||0)};
   try{u=priorUnit(id,team,slot,stage);}finally{HEROES[id]=prior;}
 }else u=priorUnit(id,team,slot,stage);
 if(team!=='p'||!u||battle?.mode==='cltq')return u;
 if(exact)u.nlMobileHero={sourceId:exact.sourceId,quality:exact.growth.q,leadership:exact.growth.lead,war:exact.growth.war,intellect:exact.growth.int,traitAttributeBonus:allRound,skill:exact.stage?.skill?.name||null,faction:exact.faction};
 applyMobileTroopProfile(u,team);
 const sourceSkill=mobileHeroSkill(id),awake=awakeningDescriptor(id);if(sourceSkill)u.skill=sourceSkill.tag;else if(awake?.descriptor)u.skill=awake.descriptor.tag;
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
 if(refine){
  for(const k of ['atk','catk','matk','def','tdef','mdef'])if(Number.isFinite(u[k]))u[k]*=1+(refine[k]||0)+(['def','tdef','mdef'].includes(k)?refine.allDefense:0);
  u.hp+=refine.hp;u.maxHp+=refine.hp;u.crit=Math.min(.95,(u.crit||0)+refine.crit);u.dodge=Math.min(.95,(u.dodge||0)+refine.dodge);u.nlMobileRefine=refine;
 }
 const beauty=mobileBeautyBonus(id);if(beauty&&Number.isFinite(u[beauty.stat])){u[beauty.stat]+=beauty.flat;u.nlMobileBeauty=beauty;}
 return mobileTechCombat(trainingCombat(u,training));
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
let mobileTroopSearch='',mobileTroopType='all',mobileTroopPage=0;
function mobileTraitPanel(){
 const u=mobileTroopAssigned(heroId),active=mobileTraitChoice(heroId);
 if(!u)return '<p>Chọn binh chủng Mobile trước khi học đặc tính.</p>';
 return '<p>Đặc tính đang dùng: '+esc(active?active.name+' · '+active.rank:'Chưa có')+'</p>'+[...MOBILE_TRAITS].filter(([id,t])=>t.types.includes(u.type)).map(([id,t])=>{
  const supported=MOBILE_TRAIT_SUPPORTED.has(t.name),rank=active?.id===id?active.rank+1:1,q=mobileTraitQuote(rank);
  return row(t.name,t.levels[Math.min(rank,3)-1],supported?btn('mobile-trait',id,rank>3?'Tối đa':'Học '+rank+' · '+q.silver+' Bạc / '+q.merit+' Chiến công',!!battle||rank>3||u.tier<rank||game.silver<q.silver||nlAState().merit<q.merit):'<small>Chưa nối hiệu ứng</small>');
 }).join('');
}
function mobileTroopPanel(){
 if(!owned(heroId))heroId=game.roster[0]||'';
 const active=mobileTroopAssigned(heroId),query=mobileTextKey(mobileTroopSearch);
 const list=MOBILE_TROOP_ROWS.filter(t=>(mobileTroopType==='all'||String(t.type)===mobileTroopType)&&mobileTextKey([t.name,t.typeName,t.id,t.desc||''].join(' ')).includes(query));
 mobileTroopPage=clamp(mobileTroopPage,0,Math.max(0,Math.ceil(list.length/4)-1));
 const heroes=game.roster.map(id=>'<option value="'+esc(id)+'" '+(id===heroId?'selected':'')+'>'+esc(HEROES[id]?.name||id)+'</option>').join('');
 const options=[['all','Tất cả'],['1','Bộ'],['2','Thương'],['3','Kỵ'],['4','Cung'],['5','Quan Văn'],['6','Thuyền nhỏ'],['7','Thuyền vừa'],['8','Thuyền lớn']].map(([id,label])=>'<option value="'+id+'" '+(mobileTroopType===id?'selected':'')+'>'+label+'</option>').join('');
 return pane('mobile-troops','Binh chủng Mobile · '+MOBILE_TROOP_ROWS.length+' hồ sơ',
 '<p>'+MOBILE_TROOP_PLAYABLE.length+' binh chủng bộ chiến có thể chọn · hồ sơ NPC/thuyền giữ riêng. Đang dùng: '+esc(active?.name||'Nhánh hiện tại')+'</p><select data-nlc-hero>'+heroes+'</select><input data-nlc-mobile-troop-search placeholder="Tìm tên, loại, ID" value="'+esc(mobileTroopSearch)+'"><select data-nlc-mobile-troop-type>'+options+'</select>'+
 pages(list,mobileTroopPage,t=>{
  const selectable=MOBILE_TROOP_SELECTABLE.has(t.id),q=mobileTroopQuote(t),on=active?.id===t.id,st=t.stats;
  const stats='V.C '+st.strengthAtk+' · C.C '+st.leaderAtk+' · M.C '+st.intellectAtk+' · V.P '+st.strengthDef+' · C.P '+st.leaderDef+' · M.P '+st.intellectDef+' · Bạo '+Math.round(st.critical*100)+'% · Phản '+Math.round(st.strikeBack*100)+'%';
  const desc=t.typeName+' · Bậc '+t.tier+(selectable&&!mobileHeroTroopAllowed(heroId,t.type)?' · Tướng không tương thích dòng quân':'')+' · '+stats+' · '+(t.desc||'')+(selectable?' · Doanh trại '+q.barracks+' / Chỉ huy '+q.commander+' / '+fmt(q.silver)+' Bạc / '+q.merit+' Chiến công':' · NPC/thuyền/đơn vị đặc biệt');
  return row(t.name,desc,selectable?btn('mobile-troop',t.id,on?'Đang dùng':'Chuyển quân',on||!mobileTroopCanSelect(heroId,t.id)):'');
 },'mobile-troop-page')+'<p class="tiny">Hệ số gốc SOURCE_EXACT; điều kiện và giá chuyển quân SIMULATED. Mô tả đặc tính được bảo toàn; phản kích chưa đầy đủ runtime; 21 đặc tính có adapter, quy tắc đường thẳng/đòn thường cần nghiệm thu thực tế.</p>'+mobileTraitPanel());
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
let beautyPage=0,beautyHero='';
function mobileBeautyPanel(){
 if(!owned(beautyHero))beautyHero=game.roster[0]||'';
 const s=state(),rows=Object.entries(MOBILE_BEAUTIES.beauties),manor=game.nlCity?.levels?.nl_city_manor||0;
 const chooser='<select data-nlc-beauty-hero>'+game.roster.map(id=>'<option value="'+esc(id)+'" '+(id===beautyHero?'selected':'')+'>'+esc(HEROES[id]?.name||id)+'</option>').join('')+'</select>';
 return pane('mobile-beauties','Tri kỷ Mobile · '+rows.length+' hồ sơ',chooser+'<p>Long Phượng Bội '+fmt(s.mobileBeautyPendants)+' · Dinh Phủ '+manor+'</p>'+btn('beauty-pendant','1','Đổi 1 Bội · 1.000 Bạc / 10 Chiến công',!manor||!!battle)+
 pages(rows,beautyPage,([id,b])=>{
   const lv=mobileBeautyLevel(id),q=mobileBeautyQuote(id),exp=nat(s.mobileBeautyExp[id]),gift=MOBILE_BEAUTIES.gifts.find(g=>g.id==='fam_9');
   const assigned=s.mobileBeautyAssigned[beautyHero]===id,used=Object.entries(s.mobileBeautyAssigned).some(([h,v])=>h!==beautyHero&&v===id);
   const giftQty=q&&gift?Math.max(1,Math.min(1000,Math.ceil(Math.max(0,q.exp-exp)/gift.effect))):0;
   return row(b.name,'Lv '+lv+'/'+(b.growth.length-1)+' · '+b.statName+' '+fmt(b.growth[lv])+(q?' → '+fmt(q.value)+' · EXP '+fmt(exp)+'/'+fmt(q.exp)+' · Bội '+q.material:' · MAX'),
   (q&&gift&&exp<q.exp?btn('beauty-gift',id+':'+giftQty,'Tơ lụa ×'+giftQty+' · '+fmt(giftQty*gift.effect*2)+' Bạc',!!battle||!manor):'')+
   (q?btn('beauty-level',id,'Tăng cấp',!!battle||!manor||exp<q.exp||s.mobileBeautyPendants<q.material):'')+
   btn('beauty-assign',id,assigned?'Đang dùng':used?'Đã gán':'Gán tri kỷ',!!battle||!lv||assigned||used));
 },'beauty-page')+'<p class="tiny">Giữ bảng EXP, vật liệu, quà và tăng trưởng nguồn đến 220. Mỗi tướng chọn một tri kỷ, giá đổi và cách áp dụng chỉ số vào P2 là mô phỏng. Chưa áp dụng thiên tính, tỷ lệ phụ trợ hoặc Quý tử.</p>');
}
let childName='Quý Tử',childSkillPage=0;
function childPanel(){
 const c=childState(),s=state(),allow=childAllowance(),manor=game.nlCity?.levels?.nl_city_manor||0;
 let body='';
 if(c.stage==='none')body='<p>Chọn tướng có Tri kỷ Lv10 trở lên (ngưỡng mô phỏng).</p>'+btn('child-start',beautyHero,'Sinh con',!!battle||!manor||!s.mobileBeautyAssigned[beautyHero]||mobileBeautyLevel(s.mobileBeautyAssigned[beautyHero])<10);
 else if(c.stage==='expecting')body='<p>Đang chờ sinh con · '+Math.max(0,Math.ceil((c.readyAt-Date.now())/3600000))+' giờ</p><input data-nlc-child-name maxlength="24" value="'+esc(childName)+'">'+btn('child-birth','','Đặt tên và mở Tư Thục',!!battle||Date.now()<c.readyAt);
 else if(c.stage==='school1')body='<p>'+esc(c.name)+' · '+c.attempts+'/120 lượt · '+allow+'/30 lượt tích lũy · '+Object.entries(c.base).map(([k,v])=>k+' '+v+' (+'+c.growth[k]/100+')').join(' · ')+'</p>'+childCards().map(x=>row(x.name,x.stat+' · '+(x.kind==='base'?x.amount:x.amount/100)+' · '+(x.favorite?'Sở thích · 100%':Math.round(x.chance*100)+'% mô phỏng'),btn('child-train',String(x.id),'Luyện',!!battle||!allow)+btn('child-train-safe',String(x.id),'Thần Hựu · 10 Vàng',!!battle||!allow||game.gold<10))).join('')+btn('child-reroll','','Tạo mới'+(c.reroll?' · 2 Vàng':' · miễn phí'),!!battle||!allow);
 else if(c.stage==='school2')body='<p>'+esc(c.name)+' · '+c.secondAttempts+'/48 lượt · '+allow+'/30 lượt</p>'+CHILD_LANES.map(lane=>row(lane,'Thuần thục '+nat(c.mastery[lane]),btn('child-second',lane,'Học',!!battle||!allow))).join('');
 else if(c.stage==='chooseSkill')body='<p>Chọn kỹ năng theo hệ đã luyện nhiều nhất.</p>'+pages(childSkills(),childSkillPage,([id,x])=>row(x.name,x.desc,btn('child-graduate',id,'Xuất Sư',!!battle)),'child-skill-page');
 else {const q=childNextPhase();body='<p>'+esc(c.name)+' · '+esc(CHILD_PHASE_NAMES[c.phase||'xuatSu'])+' · '+esc(c.skillName)+' · '+esc(c.skillDesc)+'</p><p>Đã gia nhập danh sách tướng. Xếp đội hình như tướng thường (tối đa 5).</p>'+(q?'<p>'+q.name+' · Chỉ huy '+q.commander+' · Tướng Lv'+q.level+' · '+fmt(q.silver)+' Bạc / '+fmt(q.merit)+' Chiến công (mô phỏng)</p>'+pages(q.choices,childSkillPage,x=>row(x.name,x.desc,btn('child-promote',x.id,'Tiến giai',!!battle||s.mobileCommanderLevel<q.commander||(game.hero[MOBILE_CHILD_ID]?.level||0)<q.level||game.silver<q.silver||nlAState().merit<q.merit)),'child-skill-page'):'<p>Đã đạt Giám Quốc.</p>');}
 return pane('mobile-child','Quý Tử · Tư Thục',body+'<p class="tiny">Nguồn: Wiki Xuất Sư (120 + 48 lượt, 12 lượt/ngày, tối đa 30, Thần Hựu 10 Vàng). Một mùa offline = 24 giờ; ngưỡng thân mật, xác suất, tên một số thẻ Trí và thuần thục mô phỏng. Chưa hoàn thiện lọc quốc gia, sư phụ, thẻ học vấn và binh chủng.</p>');
}
let trainHero='',bookPage=0,horsePage=0,etchPage=0;
function trainingPanel(){
 const s=state(),daily=trainingDaily();if(!owned(trainHero))trainHero=game.roster[0]||'';
 const selector='<select data-nlc-train-hero>'+game.roster.map(id=>'<option value="'+esc(id)+'" '+(id===trainHero?'selected':'')+'>'+esc(HEROES[id]?.name||id)+'</option>').join('')+'</select>';
 const books=pages(MOBILE_BOOKS,bookPage,b=>{const id=String(b.key),g=bookGrade(id),q=bookQuote(id),step=bookStepQuote(id),used=Object.entries(s.bookAssigned).some(([h,v])=>h!==trainHero&&v===id);
 return row(b.name,'Bậc '+g+'/5 · Cấp '+bookLevel(id)+'/9 · Chỉ huy '+b.unlockLevel+' · '+(g?b.ranks[g-1]:b.ranks[0]),(step?btn('book-step',id,step.complete?'Lên bậc · '+fmt(step.fragment)+' Mảnh':'Luyện cấp '+step.level+' · '+fmt(step.exp)+' Thư Linh',!!battle||s.mobileCommanderLevel<step.gate||s.bookFragments<step.fragment||s.bookExp<step.exp):'')+(q?btn('book-up',id,'Nâng '+q.grade+' · '+fmt(q.fragment)+' Mảnh / '+fmt(q.exp)+' Thư Linh',!!battle||s.mobileCommanderLevel<q.gate||s.bookFragments<q.fragment||s.bookExp<q.exp):'')+btn('book-equip',id,s.bookAssigned[trainHero]===id?'Đang dùng':'Trang bị',!!battle||!g||used||s.bookAssigned[trainHero]===id));},'book-page');
 const horses=pages(MOBILE_HORSES,horsePage,h=>{const id=String(h.key),t=horseTier(id),q=horseQuote(id),step=horseStepQuote(id),used=Object.entries(s.horseAssigned).some(([a,v])=>a!==trainHero&&v===id);
 return row(h.name,'Bậc '+t+' · '+horseStar(id)+' Sao · '+(h.tiers[0].unlock||'Mở ngay')+' · '+h.tiers[t].stats.map(x=>x.label+' '+x.base+' / '+x.pct+'%').join(' · '),(step?btn('horse-step',id,'Luyện sao '+step.star+' · '+fmt(step.points)+' điểm',!!battle||!step.gate||s.horsePoints<step.points):'')+(q?btn('horse-up',id,'Nâng · '+fmt(q.points)+' điểm',!!battle||!q.gate||s.horsePoints<q.points):'')+btn('horse-equip',id,s.horseAssigned[trainHero]===id?'Đang dùng':'Cưỡi',!!battle||!horseGate(id,0)||used||s.horseAssigned[trainHero]===id));},'horse-page');
 const own=MOBILE_ETCH.filter(x=>etchCount(x.id));etchPage=clamp(etchPage,0,Math.max(0,Math.ceil(own.length/4)-1));
 const etch=pages(own,etchPage,x=>{const up=etchQuote(x.id,'upgrade'),mix=etchQuote(x.id,'mix');return row(x.qname+' '+x.stat+' Lv'+x.level,'×'+etchCount(x.id)+' · '+fmt(x.value),(up?btn('etch-up',x.id,'Nâng · '+fmt(up.silver)+' Bạc / '+fmt(up.ngoc)+' Ngọc',!!battle||game.silver<up.silver||(game.nlItemsV1?.stacks?.[MOBILE_NGOC]||0)<up.ngoc):'')+(mix?btn('etch-mix',x.id,'Ghép '+mix.count,!!battle||etchCount(x.id)<mix.count):'')+btn('etch-equip',x.id,'Khảm',!!battle));},'etch-page');
 return pane('mobile-training','Binh Thư · Mã Trường · Khắc Văn',selector+'<h4>Thưởng luyện tập hằng ngày · '+daily.wins+'/10 trận</h4>'+DAILY_TRAINING.map((q,i)=>row(q.wins+' trận thắng',q.fragment+' Mảnh · '+fmt(q.exp)+' Thư Linh · '+fmt(q.horse)+' điểm mã · '+q.ngoc+' Ngọc · '+q.stone+' Đá',btn('training-claim',String(i),daily.claimed[i]?'Đã nhận':'Nhận thưởng',!!battle||daily.wins<q.wins||!!daily.claimed[i]))).join('')+'<p class="tiny">Thưởng mô phỏng, kiếm qua NPC Wiki (cả đánh lại) hoặc tầng tháp bổ sung. Không cần nạp tài nguyên debug.</p><h4>Binh Thư</h4><p>Mảnh '+fmt(s.bookFragments)+' · Thư Linh '+fmt(s.bookExp)+'</p>'+btn('training-buy','fragment:100','Đổi 100 Mảnh · 15.000 Bạc',!!battle||game.silver<15000)+btn('training-buy','exp:10000','Đổi 10.000 Thư Linh · 20.000 Bạc',!!battle||game.silver<20000)+books+'<h4>Mã Trường</h4><p>Điểm '+fmt(s.horsePoints)+'</p>'+btn('training-buy','horse:100000','Đổi 100.000 điểm · 100.000 Bạc',!!battle||game.silver<100000)+horses+'<h4>Khắc Văn</h4><p>Tranh Ngọc '+fmt(game.nlItemsV1?.stacks?.[MOBILE_NGOC]||0)+'</p>'+[1,2,3].map(i=>btn('etch-buy',String(i),'Mua '+(['Công','Phòng','Binh'][i-1])+' · 1.000 Bạc',!!battle||s.mobileCommanderLevel<100||game.silver<1000)).join('')+Object.entries(s.etchAssigned[trainHero]||{}).map(([a,id])=>row(ETCH.get(id)?.stat||id,'Lv'+(ETCH.get(id)?.level||0),btn('etch-remove',a,'Tháo',!!battle))).join('')+etch+'<p class="tiny">Bảng nguồn nguyên vẹn. Binh Thư có từng cấp theo bảng và nâng trọn bậc; chiến mã từng sao, chia điểm mô phỏng bảo toàn tổng từng tầng; chỉ số nguồn cập nhật khi đủ bậc; cấp Thành Chính dùng Chỉ huy đại diện. Khắc Văn dùng đúng chi phí nâng/ghép, nguồn mua cơ bản và đổi điểm mô phỏng. Chỉ số P2 quy đổi; năm Binh Thư có adapter sĩ khí/hồi lính/giải trừ theo lượt 3/6; hiệu ứng còn lại chưa nối.</p>');
}
function mobileTechPanel(){
 const s=state();
 return pane('mobile-tech','Khoa kỹ cao cấp · '+MOBILE_TECH.length+' loại','<p>Điểm Khoa Kỹ '+fmt(s.mobileTechPoints)+' · Huân Đỉnh '+fmt(s.mobileTechTripods)+' · Chỉ huy '+s.mobileCommanderLevel+'</p><p>Nguồn thu mô phỏng: thắng NPC lần đầu và hoàn thành bản đồ.</p>'+MOBILE_TECH.map(t=>{
   const lv=mobileTechLevel(t.key),q=mobileTechQuote(t.key,lv+1),cap=t.effect.length;
   return row(t.name,t.stat+' · Lv '+lv+'/'+cap+' · '+mobileTechValue(t.key)+' → '+(q?t.effect[lv]:'MAX')+' · Chỉ huy '+t.unlockLevel,
    q?btn('mobile-tech',String(t.key),'Nâng · '+q.point+' Điểm / '+q.tripod+' Đỉnh',!!battle||s.mobileCommanderLevel<t.unlockLevel||s.mobileTechPoints<q.point||s.mobileTechTripods<q.tripod):'');
 }).join('')+'<p class="tiny">Chỉ số, giá và cấp mở lấy nguyên bảng Wiki. P2 chuyển đổi Dẫn binh theo thang hiện có; Bảo Hộ được mô phỏng như giảm sát thương. Diệt/kháng chỉ áp dụng khi phe địch được xác định từ nguồn, không tự gán phe cho NPC.</p>');
}
const c0=renderCampaign,h0=renderHeroes,b0=renderBarracks,t0=renderTower,f0=renderFormation,city0=renderCity;
renderCity=function(){return city0()+mobileTechPanel()+mobileBeautyPanel()+childPanel()+trainingPanel();};
renderCampaign=function(){return c0()+campaignPanel();};renderHeroes=function(){return h0()+heroPanel();};renderBarracks=function(){return b0()+troopPanel()+mobileTroopPanel();};renderTower=function(){return t0()+towerPanel();};renderFormation=function(){return f0()+sealPanel();};
document.addEventListener('change',e=>{if(e.target.matches?.('[data-nlc-map]')&&MAP.has(e.target.value)){mapId=e.target.value;npcPage=0;render();}else if(e.target.matches?.('[data-nlc-train-hero]')){trainHero=e.target.value;render();}else if(e.target.matches?.('[data-nlc-child-name]')){childName=e.target.value;}else if(e.target.matches?.('[data-nlc-beauty-hero]')){beautyHero=e.target.value;render();}else if(e.target.matches?.('[data-nlc-mobile-troop-search]')){mobileTroopSearch=e.target.value;mobileTroopPage=0;render();}else if(e.target.matches?.('[data-nlc-mobile-troop-type]')){mobileTroopType=e.target.value;mobileTroopPage=0;render();}else if(e.target.matches?.('[data-nlc-hero-search]')){heroSearch=e.target.value;heroPage=0;render();}else if(e.target.matches?.('[data-nlc-hero]')){heroId=e.target.value;render();}else if(e.target.matches?.('[data-nlc-search]')){search=e.target.value;mapPage=0;const match=MAPS.find(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(match){mapId=match.id;npcPage=0;}render();}else if(e.target.matches?.('[data-nlc-seal-search]')){sealSearch=e.target.value;sealPage=0;render();}else if(e.target.matches?.('[data-nlc-seal-from]')){sealFrom=clamp(Math.trunc(Number(e.target.value)||1),1,SEAL_MAX);render();}else if(e.target.matches?.('[data-nlc-seal-to]')){sealTo=clamp(Math.trunc(Number(e.target.value)||1),1,SEAL_MAX);render();}});
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-nlc-action]');if(!b||b.disabled)return;const a=b.dataset.nlcAction,id=b.dataset.nlcId,delta=id==='next'?1:-1;
 if(a==='next-objective'){jumpNextNpc();return;}
 if(a==='select-seal'){sealId=id;const lv=sealLevel(state(),id)||1;sealFrom=lv;sealTo=Math.min(SEAL_MAX,lv+1);render();requestAnimationFrame(()=>setTimeout(()=>document.querySelector('#nl-screen-next')?.click(),0));return;}
 if(a==='map-page'){mapPage=Math.max(0,mapPage+delta);const list=MAPS.filter(x=>x.name.toLocaleLowerCase('vi').includes(search.toLocaleLowerCase('vi')));if(list[mapPage*20]){mapId=list[mapPage*20].id;npcPage=0;}render();return;}
 if(a==='npc-page')npcPage=Math.max(0,npcPage+delta);else if(a==='hero-page')heroPage=Math.max(0,heroPage+delta);else if(a==='book-page')bookPage=Math.max(0,bookPage+delta);else if(a==='horse-page')horsePage=Math.max(0,horsePage+delta);else if(a==='etch-page')etchPage=Math.max(0,etchPage+delta);else if(a==='child-skill-page')childSkillPage=Math.max(0,childSkillPage+delta);else if(a==='beauty-page')beautyPage=Math.max(0,beautyPage+delta);else if(a==='mobile-troop-page')mobileTroopPage=Math.max(0,mobileTroopPage+delta);else if(a==='unit-page')unitPage=Math.max(0,unitPage+delta);else if(a==='seal-page')sealPage=Math.max(0,sealPage+delta);else {const fn={npc:startNpc,'npc-repeat':id=>startNpc(id,true),recruit,'mobile-troop':tid=>mobileTroopChoose(heroId,tid),'mobile-trait':tid=>mobileTraitChoose(heroId,tid),'mobile-tech':id=>mobileTechUpgrade(id,mobileTechLevel(id)+1),'beauty-pendant':()=>mobileBeautyBuyPendants(1),'beauty-gift':key=>{const [id,n]=key.split(':');return mobileBeautyGift(id,'fam_9',Number(n));},'beauty-level':mobileBeautyUpgrade,'beauty-assign':id=>mobileBeautyAssign(beautyHero,id),'book-step':bookStep,'book-up':bookUpgrade,'book-equip':id=>trainingAssign('book',trainHero,id),'horse-step':horseStep,'horse-up':horseUpgrade,'horse-equip':id=>trainingAssign('horse',trainHero,id),'training-claim':id=>trainingClaim(Number(id)),'training-buy':id=>{const [k,n]=id.split(':');return trainingBuy(k,Number(n));},'etch-buy':etchBuy,'etch-up':id=>etchChange(id,'upgrade'),'etch-mix':id=>etchChange(id,'mix'),'etch-equip':id=>etchEquip(trainHero,id),'etch-remove':id=>etchRemove(trainHero,id),'child-start':id=>childStart(id),'child-birth':()=>childBirth(childName),'child-train':id=>childTrain(Number(id)),'child-train-safe':id=>childTrain(Number(id),true),'child-reroll':()=>childReroll(),'child-second':id=>childSecond(id),'child-graduate':childGraduate,'child-promote':id=>{const ok=childPromote(id);if(ok)childSkillPage=0;return ok;},tier4:tid=>choose4(heroId,tid),tower:startTower,'upgrade-seal':id=>upgradeSeal(id,sealTo),'activate-seal':activateSeal}[a];if(fn&&!fn(id))toast('Chưa đủ điều kiện hoặc tài nguyên.');return;}render();});
const style=document.createElement('style');style.textContent='.nlc-row{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #665e43}.nlc-row b,.nlc-row small{display:block}.nlc-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:3px;max-width:57%}.nlc-actions button{white-space:normal!important;text-align:center}.nlc-row small,.nlc-pane p{font-size:10px}.nlc-row button,.nlc-nav button{font-size:11px;padding:5px 8px;white-space:nowrap}.nlc-nav{display:flex;align-items:center;gap:6px;margin:4px 0}.nlc-pane input,.nlc-pane select{max-width:100%;font-size:12px}.nlc-pane h3{margin:4px 0}.nlc-seal-wallet{padding:6px 8px;margin:4px 0;background:#102d28;border:1px solid #927849;border-radius:5px;font-size:11px}.nlc-seal-wallet b{color:#f0d18a}.nlc-seal-detail{margin-top:7px;padding:8px;border:1px solid #91764a;background:linear-gradient(140deg,#172c28,#17221f);border-radius:6px}.nlc-seal-detail h4{font-size:14px;margin:0 0 3px;color:#f1dcaa}.nlc-seal-detail h4 small{font-size:10px;color:#b9aa83}.nlc-seal-attr{display:grid;grid-template-columns:minmax(100px,1fr) auto;gap:2px 8px;padding:3px 0;border-bottom:1px solid #554d39;font-size:10px}.nlc-seal-attr b{color:#e7cf94}.nlc-seal-attr small{grid-column:1/-1;color:#aeb4a6;font-size:9px}.nlc-seal-attr i{font-style:normal;color:#87cdb0}.nlc-seal-calc{display:flex;align-items:center;flex-wrap:wrap;gap:5px;margin-top:6px;padding-top:6px;border-top:1px solid #746342;font-size:10px}.nlc-seal-calc>b{flex-basis:100%;color:#edd59d}.nlc-seal-calc label{white-space:nowrap}.nlc-seal-calc input{width:48px;padding:3px;border:1px solid #806e49;border-radius:4px;background:#0b1c19;color:#fff;text-align:center}.nlc-seal-calc span{color:#e5d3a4}.nlc-seal-calc button{font-size:10px;padding:5px 7px}.nlc-tower-plan{margin:8px 0;padding:9px 11px;border:1px solid #786a47;border-radius:6px;background:linear-gradient(135deg,#29362f,#172522)}.nlc-tower-plan>b{display:block;color:#f1d797}.nlc-tower-plan>small{display:block;margin-top:3px;color:#c5b68e;font-size:10px}.nlc-tower-plan p{line-height:1.55;margin:6px 0;color:#c4cdc0}.nlc-tower-lineup{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:3px 10px;color:#e0d4b4;font-size:10px}.nlc-tower-reward{padding:7px 9px;background:#172c27;border-left:3px solid #c3a262;color:#e5d4a9;line-height:1.6}@media(max-width:560px){.nlc-tower-lineup{grid-template-columns:1fr}}';document.head.appendChild(style);
nlMobileHeroApi=Object.freeze({quality:mobileHeroQuality,record:mobileHeroRecord,next:mobileHeroNext,materialQuote:mobileHeroMaterialQuote,buyMaterial:mobileHeroBuyMaterial,canAwaken:mobileHeroCanAwaken,awaken:mobileHeroAwaken,skill:mobileHeroSkill});
if(window.__P2_ENABLE_QA__)window.__NL_CONTENT_C_QA__=Object.freeze({counts:NL_CONTENT_C.counts,state:()=>structuredClone(state()),map:id=>MAP.get(id),npc:id=>NPC.get(id)?.n,readyNpc,startNpc,nextNpc:()=>structuredClone(nextNpc()),skillProbe,awakeningDescriptor:id=>structuredClone(awakeningDescriptor(id)),canReplayNpc,npcRepeatCount,npcDifficulty:id=>NPC.has(id)?npcDifficulty(NPC.get(id)):null,npcBaseStage,enemyScale,npcMerit:id=>NPC.has(id)?npcMerit(NPC.get(id)):null,npcReward:id=>{const r=NPC.get(id);return r?npcReward(r,true):null;},mapBonus:id=>MAP.has(id)?mapBonus(MAP.get(id)):null,startTower,towerPlan,towerRewards,towerTarget:p2Target,recruit,choose4,upgradeSeal,activateSeal,sealReady:id=>sealReady(SEAL_BY_ID.get(sealKey(id))),sealActive:id=>sealActive(SEAL_BY_ID.get(sealKey(id))),sealActivation:id=>sealActivation(state(),id),sealActivationValue:(id,rank)=>{const r=SEAL_BY_ID.get(sealKey(id));return r?sealActivationValue(r,rank):0;},sealActivationCost,sealLevel:id=>sealLevel(state(),id),sealValue:id=>{const r=SEAL_BY_ID.get(sealKey(id));return r?sealValue(r,state()):null;},sealStatsForRuntime,sealQuote,sealMigration:legacySealStats,p2Unit,p2Hit,p2Heal,p2Status,p2StatusValue,p2StatusFactor,mobileTechLevel,mobileTechValue,mobileTechQuote,mobileTechUpgrade,mobileTechCombat,mobileTechDamage,mobileTechCount:()=>MOBILE_TECH.length,mobileBeautyLevel,mobileBeautyQuote,mobileBeautyGift,mobileBeautyBuyPendants,mobileBeautyUpgrade,mobileBeautyAssign,mobileBeautyBonus,mobileBeautyCount:()=>Object.keys(MOBILE_BEAUTIES.beauties).length,bookGrade,bookLevel,bookQuote,bookStepQuote,bookStep,bookUpgrade,horseTier,horseStar,horseGate,horseQuote,horseStepQuote,horseStep,horseUpgrade,trainingAssign,trainingBuy,etchCount,etchBuy,etchQuote,etchChange,etchEquip,etchRemove,trainingModifiers,trainingCombat,trainingDaily:()=>structuredClone(trainingDaily()),trainingClaim,trainingCounts:()=>[MOBILE_BOOKS.length,MOBILE_HORSES.length,MOBILE_ETCH.length],childStart,childBirth,childCards,childTrain,childReroll,childSecond,childGraduate,childNextPhase,childPromote,childSyncRoster,childSkillDescriptor,childAllowance,childSkills,childState:()=>structuredClone(childState()),mobileHeroRecord,mobileHeroQuality,mobileHeroNext,mobileHeroMaterialQuote,mobileHeroBuyMaterial,mobileHeroCanAwaken,mobileHeroAwaken,mobileHeroSkill,mobileHeroTroopAllowed,applyMobileTroopProfile,mobileTroopSourceId,mobileTroopProfile,mobileTroopAssigned,mobileTraitChoose,mobileTraitChoice,mobileTraitFactors,mobileTraitSupported:()=>[...MOBILE_TRAIT_SUPPORTED],mobileTroopChoose,mobileTroopCanSelect,mobileTroopQuote,mobileTroopCoefficients,mobileTroopPlayable:()=>MOBILE_TROOP_PLAYABLE.map(r=>r.id),mobileTroopCount:()=>Object.keys(MOBILE_TROOPS.units).length,mobileBuffCount:()=>Object.keys(MOBILE_BUFFS.records).length,credit,days:()=>dayId(),floor,descriptor,describeSkill:descriptor,skillAudit:mobileSkillAudit,mobileRepeatHit,mobilePassivePlan,mobileApplyTurnPassives,mobileBookAction,family,tiers:()=>NL_C_TIER4.length,seals:()=>SEALS.length,sealCatalog:()=>structuredClone(SEALS),panels:()=>[campaignPanel(),heroPanel(),mobileTroopPanel(),troopPanel(),towerPanel(),sealPanel()]});
})();
// === end NL-CONTENT-C-V1 ===
