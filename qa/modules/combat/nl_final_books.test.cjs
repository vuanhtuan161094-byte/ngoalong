'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../../tools/nl_content_c_runtime.js'),'utf8');
const extract=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
const helpers=extract('function mobileBookHas(','function mobileSingleHit(')+extract('function mobileBookCleanse(','function mobileApplyTurnPassives(');
function run(id,grade,roll,turn=2){
 const ally={name:'A',hp:50,maxHp:100,morale:0,slot:0,effects:[],nlMobileTraining:{book:{id,grade,name:'Book',desc:'test'}},nlMobileBookTurns:turn};
 const enemy={hp:100,maxHp:100,morale:100,slot:0,effects:[{kind:'buff',turns:2}]};
 const ctx={battle:{p:[ally],e:[enemy]},nat:x=>Math.max(0,Math.floor(Number(x)||0)),mobileTextKey:x=>x,p2Random:()=>roll,p2Snapshot:()=>({}),
 NL_GAME_DATA:{statusEffects:{effects:{buff:{polarity:'beneficial',dispelPolicy:'removable'}}}},
 applyMobileSourceStatus:(u,a)=>{u.effects.push({kind:a.kind,turns:a.turns,mobileSourceValues:a.values});return true;},actor:ally,ally,enemy,event:{actor:'A',mode:'normal',description:'test'}};
 for(const k of ['BREAK','BREAK2','SILENCE','ATTR','SPRING','MOON','IMMUNE','VITAL','MORALE_GUARD','SHIELD_STATUS'])ctx['MOBILE_BOOK_'+k]=k;
 vm.createContext(ctx);vm.runInContext(helpers+';mobileBookAction(actor,event);',ctx);return ctx;
}
test('Dao Duc grades and sixth action duration',()=>{assert.equal(run('7',1,.25).enemy.effects.length,1);assert.equal(run('7',1,.24).enemy.effects.at(-1).kind,'BREAK');const c=run('7',5,0,5);assert.equal(c.enemy.effects.at(-1).turns,2);assert.equal(c.ally.effects.at(-1).mobileSourceValues.layers,2);});
test('Thanh Linh removes buffs and locks only highest morale target',()=>{const c=run('10',5,0);assert.equal(c.enemy.effects.length,1);assert.equal(c.enemy.effects[0].kind,'SILENCE');assert.equal(c.enemy.effects[0].turns,1);});
test('attribute book uses bounded temporary flat modifier',()=>{const c=run('11',5,0);assert.equal(c.ally.effects[0].mobileSourceValues.attributeFlat,20);assert.equal(vm.runInContext('mobileBookAttribute(ally)',c),20);});
test('Spring consumes a layer, heals actual HP and respects Break',()=>{const c=run('7',5,0);assert.equal(vm.runInContext('mobileBookSpring(ally)',c),41);assert.equal(c.ally.hp,91);assert.equal(c.ally.effects[0].mobileSourceValues.layers,1);});
