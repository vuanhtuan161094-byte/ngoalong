'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const src=fs.readFileSync(path.resolve(__dirname,'../../../tools/nl_content_c_runtime.js'),'utf8');
const code=src.slice(src.indexOf('const NAVAL_ROUTES='),src.indexOf('function startNpc('));
function fixture(){
 const game={cleared:[1,8,16,24],slots:['liu'],hero:{liu:{troops:100}},nlCity:{levels:{nl_city_naval_port:3,nl_city_naval_drill:1}},nlClassicAdvanced:{naval:{ships:3}}},state={},a={orders:3},ctx={game,battle:null,nlContentCNaval:null,state:()=>state,nlAState:()=>a,dayId:()=>1,nat:n=>Number.isSafeInteger(n)&&n>=0?n:0,obj:x=>x&&typeof x==='object'&&!Array.isArray(x),clamp:(v,l,h)=>Math.min(h,Math.max(l,v)),structuredClone,trainingVictory:()=>{},awardMerit:(o,m)=>{o.meritAward=m;},MOBILE_TROOPS:{units:{}},MOBILE_TROOP_ATTACK:{},MOBILE_TROOP_DEFENSE:{},save:()=>{},renderBattleShell:()=>{},p2Snapshot:()=>({}),openObjective:(o)=>{ctx.battle={p:[],nlContentC:o};return true;}};
 vm.createContext(ctx);vm.runInContext(code,ctx);return ctx;
}
test('naval routes gated, native launch, first and repeat reward, once-only receipt',()=>{
 const c=fixture(),run=x=>vm.runInContext(x,c);
 assert.equal(run("navalQuote('lake').ready"),false);
 assert.equal(run("startNaval('river')"),true);assert.equal(run('navalState().attempts'),1);
 const reward=run('settleNaval(battle.nlContentC)');assert.equal(reward.silver,1200);assert.equal(run('Object.keys(settleNaval(battle.nlContentC)).length'),0);
 c.battle=null;assert.equal(run("navalQuote('lake').ready"),true);
 assert.equal(run("navalQuote('river').reward.silver"),540);
 assert.equal(run("startNaval('lake')"),true);c.battle=null;assert.equal(run("navalQuote('river').ready"),false);
});
