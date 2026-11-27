'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../../tools/nl_content_c_runtime.js'),'utf8');
const extract=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
const helpers=extract('function mobileBookHas(','function mobileSingleHit(')+extract('function mobileBookCleanse(','function mobileApplyTurnPassives(');
const wikiValueHelper=extract('function wikiValue(','function wikiEliteShield(');
function run(id,grade,roll,turn=2){
 const ally={name:'A',hp:50,maxHp:100,morale:0,slot:0,effects:[],nlMobileTraining:{book:{id,grade,name:'Book',desc:'test'}},nlMobileBookTurns:turn};
 const enemy={hp:100,maxHp:100,morale:100,slot:0,effects:[{kind:'buff',turns:2}]};
 const ctx={battle:{p:[ally],e:[enemy]},nat:x=>Math.max(0,Math.floor(Number(x)||0)),mobileTextKey:x=>x,p2Random:()=>roll,p2Snapshot:()=>({}),
 NL_GAME_DATA:{statusEffects:{effects:{buff:{polarity:'beneficial',dispelPolicy:'removable'}}}},
 applyMobileSourceStatus:(u,a)=>{u.effects.push({kind:a.kind,turns:a.turns,mobileSourceValues:a.values});return true;},actor:ally,ally,enemy,event:{actor:'A',mode:'normal',description:'test'}};
 ctx.MOBILE_SOURCE_NO_HEAL='mobile-source-no-heal';
 for(const k of ['BREAK','BREAK2','SILENCE','ATTR','SPRING','MOON','IMMUNE','VITAL','MORALE_GUARD','SHIELD_STATUS'])ctx['MOBILE_BOOK_'+k]=k;
 vm.createContext(ctx);vm.runInContext(helpers+';mobileBookAction(actor,event);',ctx);return ctx;
}
test('Dao Duc grades and sixth action duration',()=>{assert.equal(run('7',1,.25).enemy.effects.length,1);assert.equal(run('7',1,.24).enemy.effects.at(-1).kind,'BREAK');const c=run('7',5,0,5);assert.equal(c.enemy.effects.at(-1).turns,2);assert.equal(c.ally.effects.at(-1).mobileSourceValues.layers,2);});
test('Thanh Linh removes buffs and locks only highest morale target',()=>{const c=run('10',5,0);assert.equal(c.enemy.effects.length,1);assert.equal(c.enemy.effects[0].kind,'SILENCE');assert.equal(c.enemy.effects[0].turns,1);});
test('attribute book uses bounded temporary flat modifier',()=>{const c=run('11',5,0);assert.equal(c.ally.effects[0].mobileSourceValues.attributeFlat,20);assert.equal(vm.runInContext('mobileBookAttribute(ally)',c),20);});
test('Spring consumes a layer, heals actual HP and respects Break',()=>{const c=run('7',5,0);assert.equal(vm.runInContext('mobileBookSpring(ally)',c),41);assert.equal(c.ally.hp,91);assert.equal(c.ally.effects[0].mobileSourceValues.layers,1);});

test('counter uses source chance, one response per defender, no recursive turns or replay',()=>{
 const source=wikiValueHelper+extract('function mobileCounterChance(','p2Perform=function(actor){\n // A silence');
 const a={name:'A',team:'p',slot:0,hp:100},b={name:'B',team:'e',slot:0,hp:100,nlMobileTroop:{strikeBack:.25},effects:[{turns:2,stacks:1,mobileSource:{wikiStack:true},mobileSourceValues:{wikiCounterAny:.25}}]};
 const event={actor:'A',mode:'normal',description:'normal',hits:[{team:'e',slot:0,amount:20},{team:'e',slot:0,amount:10}]};
 const ctx={actor:a,event,battle:{p:[a],e:[b]},nat:x=>Math.max(0,Math.floor(Number(x)||0)),p2Random:()=>.49,p2Snapshot:()=>({}),mobileBookHas:()=>false,MOBILE_CONTROL_STATUS:'control',MOBILE_SLEEP_STATUS:'sleep',
 mobileSingleHit:(attacker,target,kind,mult)=>{assert.equal(mult,.6);target.hp-=20;return {team:target.team,slot:target.slot,amount:20};}};
 vm.createContext(ctx);vm.runInContext(source+';mobileResolveCounters(actor,event);',ctx);
 assert.equal(a.hp,80);assert.equal(event.hits.length,3);assert.equal(event.hits[2].mobileCounter,true);
 ctx.battle.replay=true;vm.runInContext('mobileResolveCounters(actor,event);',ctx);assert.equal(a.hp,80);
});

test('R5 periodic effects use owner action, no recursion, no newly applied tick',()=>{
 const code=extract('function mobileTickPeriodic(','function mobileResolveCounters(');
 const a={name:'A',team:'p',slot:0,hp:100,maxHp:100,morale:50,effects:[]};
 const dot={kind:'desert',turns:2,mobileSourceValues:{currentTroopLossRatio:.1}};
 const morale={kind:'morale',turns:2,mobileSourceValues:{periodicMoraleLoss:15}};
 const regen={kind:'regen',turns:2,mobileSourceValues:{maxTroopHealRatio:.05}};
 a.effects=[dot,morale,regen];const event={actor:'A',mode:'stunned',hits:[],description:'test'};
 const ctx={actor:a,event,prior:[dot,morale],battle:{},MOBILE_SOURCE_DESERTION:'desert',MOBILE_SOURCE_MORALE_DOT:'morale',MOBILE_SOURCE_REGEN:'regen',
 p2Morale:(u,d)=>u.morale+=d,p2Snapshot:()=>({}),p2StatusFactor:()=>1,mobileBookRestore:(u,r)=>{const old=u.hp;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*r));return u.hp-old;}};
 vm.createContext(ctx);vm.runInContext(code+';mobileTickPeriodic(actor,event,prior);',ctx);
 assert.equal(a.hp,90);assert.equal(a.morale,35);assert.equal(event.hits.length,1);
 ctx.prior=[regen];vm.runInContext('mobileTickPeriodic(actor,event,prior)',ctx);assert.equal(a.hp,95);
 ctx.battle.replay=true;vm.runInContext('mobileTickPeriodic(actor,event,prior)',ctx);assert.equal(a.hp,95);
});
