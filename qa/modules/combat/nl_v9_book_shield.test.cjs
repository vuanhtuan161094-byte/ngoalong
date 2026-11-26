'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../../tools/nl_content_c_runtime.js'),'utf8');
const extract=(a,b)=>src.slice(src.indexOf(a),src.indexOf(b));
const helpers=extract('function mobileConsumeShield(','function mobileSingleHit(')+extract('function mobileBookAction(','function mobileApplyTurnPassives(');
function run(grade,rolls,turn=2){
 const ally={hp:50,slot:0,effects:[]},actor={hp:50,name:'A',nlMobileTraining:{book:{id:'3',grade,name:'Võ Hầu',desc:'test'}},nlMobileBookTurns:turn};
 const event={actor:'A',mode:'normal',description:'test'};
 const ctx={battle:{p:[ally],e:[]},nat:x=>Math.max(0,Math.floor(Number(x)||0)),mobileTextKey:x=>x,p2Random:()=>rolls.shift()??0,
 MOBILE_BOOK_SHIELD_STATUS:'book-shield',p2Snapshot:()=>({}),applyMobileSourceStatus:(u,a)=>{u.effects=[{kind:a.kind,turns:a.turns,mobileSourceValues:a.values}];return true;},actor,event,ally};
 vm.createContext(ctx);vm.runInContext(helpers+';mobileBookAction(actor,event);',ctx);return ctx;
}
test('grade 1 success and failure use seeded combat odds',()=>{
 assert.equal(run(1,[.49]).ally.effects[0].mobileSourceValues.shieldLayers,1);
 assert.equal(run(1,[.5]).ally.effects.length,0);
});
test('grade 4 optional extra layer, grade 5 guaranteed two, no turn 2 trigger',()=>{
 assert.equal(run(4,[.49]).ally.effects[0].mobileSourceValues.shieldLayers,2);
 assert.equal(run(4,[.5]).ally.effects[0].mobileSourceValues.shieldLayers,1);
 assert.equal(run(5,[]).ally.effects[0].turns,2);
 assert.equal(run(5,[],1).ally.effects.length,0);
});
test('two layers are removed one at a time',()=>{
 const c=run(5,[]);vm.runInContext('mobileConsumeShield(ally,ally.effects[0]);',c);
 assert.equal(c.ally.effects[0].mobileSourceValues.shieldLayers,1);
 vm.runInContext('mobileConsumeShield(ally,ally.effects[0]);',c);assert.equal(c.ally.effects.length,0);
});
