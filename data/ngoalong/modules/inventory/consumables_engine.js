/* Muu Dinh Tam Quoc - Group04 item actions, no DOM/save/global dependency.
 * Source names/groups are Wiki references. Effects/recipes are original game rules.
 * Uses the same nlItemsV1 receipt ledger as Group04's equipment engine.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NLItemConsumables=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const RESOURCE=new Set(['silver','gold','iron','grain','prestige']);
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const safe=n=>Number.isSafeInteger(n)&&n>=0;
  const goodId=id=>typeof id==='string'&&id.length>0&&id.length<=160&&!['__proto__','prototype','constructor'].includes(id);
  const copy=o=>JSON.parse(JSON.stringify(o));
  const error=code=>{const e=new Error(code);e.code=code;throw e};
  const requireOk=(ok,code)=>{if(!ok)error(code)};
  function validatePack(pack,config){
    requireOk(pack&&Array.isArray(pack.items),'BAD_CATALOGUE');
    requireOk(config&&safe(config.limits?.stacksKinds)&&
      safe(config.limits?.quantityEach)&&safe(config.limits?.receipts),'BAD_CONFIG');
    const lookup=Object.create(null);
    for(const row of pack.items){
      requireOk(row&&goodId(row.id)&&!own(lookup,row.id),'INVALID_OR_DUPLICATE_ITEM_ID');
      requireOk(row.integration==='PLAYABLE'||row.integration==='REFERENCE_ONLY','BAD_INTEGRATION');
      const mobileSourceMaterial=row.provenance?.classification==='SOURCE_EXACT'&&
        row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&
        ['MOBILE_DROP','SOURCE_CURRENCY'].includes(row.acquisitionRule?.kind)&&
        row.category==='material'&&row.effectRule==null;
      const mobileExchange=row.provenance?.classification==='SOURCE_EXACT'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&row.category==='material'&&(row.acquisitionRule?.kind==='MATERIAL_EXCHANGE'||row.acquisitionRule?.kind==='SHOP'&&row.acquisitionRule?.classification==='SIMULATED_FALLBACK')&&(row.effectRule==null||row.effectRule.kind==='CRAFT_REAGENT');
      const mobileSourceBundle=row.provenance?.classification==='SOURCE_EXACT'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&row.category==='consumable'&&row.effectRule?.kind==='OPEN_SOURCE_BUNDLE'&&row.acquisitionRule?.classification==='SIMULATED_FALLBACK';
      requireOk(['VERIFIED','SIMULATED','SOURCE_EXACT'].includes(row.provenance?.classification),'BAD_PROVENANCE');
      if(row.integration==='REFERENCE_ONLY'){
        requireOk(row.effectRule==null,'REFERENCE_EFFECT_FORBIDDEN');
      }else{
        requireOk(row.provenance.classification==='SIMULATED'||mobileSourceMaterial||mobileSourceBundle||mobileExchange,'ACTIVE_NOT_PROJECT_ORIGINAL');
        requireOk(row.category==='consumable'||row.category==='material','BAD_PLAYABLE_KIND');
        if(row.category==='consumable')requireOk(row.effectRule&&
          ['GRANT_RESOURCE','OPEN_BUNDLE','OPEN_SOURCE_BUNDLE','TRAIN_HERO_XP'].includes(row.effectRule.kind),'BAD_CONSUMABLE_RULE');
        else if(!mobileSourceMaterial&&!mobileExchange)requireOk(row.effectRule?.kind==='CRAFT_REAGENT'||
          row.effectRule?.kind==='REFINEMENT_REAGENT','BAD_MATERIAL_RULE');
      }
      lookup[row.id]=row;
    }
    return lookup;
  }
  function createModule(pack,config){
    const items=validatePack(pack,config),limit=config.limits;
    function get(id){
      requireOk(goodId(id)&&own(items,id),'UNKNOWN_ITEM');
      const row=items[id];
      requireOk(row.integration==='PLAYABLE','REFERENCE_ONLY');
      return row;
    }
    function execute(state,action,id,args,receipt,body){
      try{
        requireOk(state&&typeof state==='object'&&goodId(receipt),'RECEIPT_REQUIRED');
        const next=copy(state),m=next.nlItemsV1;
        requireOk(m&&typeof m.stacks==='object'&&!Array.isArray(m.stacks)&&
          typeof m.receipts==='object'&&!Array.isArray(m.receipts)&&
          safe(m.serial),'CORRUPT_ITEM_LEDGER');
        const fingerprint=JSON.stringify([action,id,args]);
        if(own(m.receipts,receipt)){
          requireOk(m.receipts[receipt]===fingerprint,'RECEIPT_CONFLICT');
          return {ok:true,duplicate:true,state,code:'ALREADY_SETTLED'};
        }
        requireOk(Object.keys(m.receipts).length<limit.receipts,'RECEIPT_LIMIT');
        const detail=body(next,m);
        m.receipts[receipt]=fingerprint;
        return {ok:true,duplicate:false,state:next,detail};
      }catch(e){
        return {ok:false,duplicate:false,state,code:e.code||'INVALID_OPERATION'};
      }
    }
    function debitStack(m,id,qty){
      requireOk(goodId(id)&&safe(qty)&&qty>=1,'INVALID_STACK_COST');
      const prior=m.stacks[id];
      requireOk(safe(prior)&&prior>=qty,'NOT_ENOUGH_ITEMS');
      if(prior===qty)delete m.stacks[id];else m.stacks[id]=prior-qty;
    }
    function addStack(m,id,qty){
      requireOk(safe(qty)&&qty>0,'INVALID_GRANT_QUANTITY');
      const row=get(id),stackLimit=safe(row.stackLimit)&&row.stackLimit>=limit.quantityEach?row.stackLimit:limit.quantityEach;
      const current=m.stacks[id]||0;
      requireOk(safe(current),'CORRUPT_STACK');
      requireOk(current+qty<=stackLimit,'STACK_CAPACITY');
      const keys=new Set(Object.keys(m.stacks).filter(k=>m.stacks[k]>0));
      keys.add(id);
      requireOk(keys.size<=limit.stacksKinds,'STACK_KIND_CAPACITY');
      m.stacks[id]=current+qty;
    }
    function addResource(next,name,qty){
      requireOk(RESOURCE.has(name)&&safe(qty),'INVALID_RESOURCE_REWARD');
      const old=next[name]||0;
      requireOk(safe(old)&&Number.isSafeInteger(old+qty),'RESOURCE_OVERFLOW');
      next[name]=old+qty;
    }
    // Purchases and opening use the same receipt-protected inventory ledger.
    function buySourceBundle(state,id,receipt){
      return execute(state,'BUY_SOURCE_BUNDLE',id,null,receipt,(next,m)=>{
        const row=get(id),q=row.acquisitionRule;
        requireOk(row.effectRule?.kind==='OPEN_SOURCE_BUNDLE'&&q?.classification==='SIMULATED_FALLBACK'&&safe(q.shopCost?.silver)&&q.shopCost.silver>0,'NOT_SOURCE_BUNDLE_SHOP');
        requireOk((next.nlContentC?.mobileCommanderLevel||0)>=(q.minCommander||0),'COMMANDER_LEVEL_REQUIRED');
        if(row.effectRule.levelGift){requireOk(row.effectRule.levelGift===1&&!next.nlContentC?.levelGiftClaims?.['1']&&!(m.stacks[id]>0),'LEVEL_GIFT_CHAIN_ONLY');}
        requireOk(safe(next.silver)&&next.silver>=q.shopCost.silver,'INSUFFICIENT_RESOURCES');
        next.silver-=q.shopCost.silver;addStack(m,id,1);return {id,quantity:1,silver:q.shopCost.silver};
      });
    }
    function buySourceMaterial(state,id,receipt){
      return execute(state,'BUY_SOURCE_MATERIAL',id,null,receipt,(next,m)=>{
        const row=get(id),q=row.acquisitionRule;
        requireOk(row.category==='material'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&q?.kind==='SHOP'&&q.classification==='SIMULATED_FALLBACK'&&safe(q.shopCost?.silver)&&q.shopCost.silver>0,'NOT_SOURCE_MATERIAL_SHOP');
        requireOk((next.nlContentC?.mobileCommanderLevel||0)>=(q.minCommander||0),'COMMANDER_LEVEL_REQUIRED');
        requireOk(safe(next.silver)&&next.silver>=q.shopCost.silver,'INSUFFICIENT_RESOURCES');
        next.silver-=q.shopCost.silver;addStack(m,id,1);return {id,quantity:1,silver:q.shopCost.silver};
      });
    }
    function buySourceMaterials(state,id,quantity,receipt){
      return execute(state,'BUY_SOURCE_MATERIALS',id,[quantity],receipt,(next,m)=>{
        const row=get(id),q=row.acquisitionRule;
        requireOk(row.category==='material'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&q?.kind==='SHOP'&&q.classification==='SIMULATED_FALLBACK'&&safe(q.shopCost?.silver)&&q.shopCost.silver>0&&safe(quantity)&&quantity>0&&quantity<=10000,'NOT_SOURCE_MATERIAL_SHOP');
        requireOk((next.nlContentC?.mobileCommanderLevel||0)>=(q.minCommander||0),'COMMANDER_LEVEL_REQUIRED');
        const cost=q.shopCost.silver*quantity;
        requireOk(safe(cost)&&safe(next.silver)&&next.silver>=cost,'INSUFFICIENT_RESOURCES');
        next.silver-=cost;addStack(m,id,quantity);return {id,quantity,silver:cost,classification:'SIMULATED_FALLBACK'};
      });
    }
    function consumeSourceMaterials(state,costs,receipt,scope){
      const rows=Array.isArray(costs)?costs:[];
      const normalized=rows.map(x=>({id:x?.id,quantity:x?.quantity})).sort((a,b)=>String(a.id).localeCompare(String(b.id)));
      return execute(state,'CONSUME_SOURCE_MATERIALS',scope,normalized,receipt,(next,m)=>{
        requireOk(goodId(scope)&&normalized.length>0&&normalized.length<=12,'BAD_SOURCE_MATERIAL_COSTS');
        const seen=new Set();
        for(const x of normalized){
          const row=get(x.id);
          requireOk(!seen.has(x.id)&&row.category==='material'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&row.provenance?.classification==='SOURCE_EXACT'&&safe(x.quantity)&&x.quantity>0,'BAD_SOURCE_MATERIAL_COSTS');
          seen.add(x.id);
        }
        for(const x of normalized)debitStack(m,x.id,x.quantity);
        return {scope,costs:normalized,classification:'SOURCE_EXACT_QUANTITIES'};
      });
    }
    function giveBeautyGift(state,id,receipt,beautyId,qty,score){
      return execute(state,'GIFT_BEAUTY',id,[beautyId,qty,score],receipt,(next,m)=>{
        const row=get(id),gift=row.sourceGift;
        requireOk(gift&&safe(gift.effect)&&gift.effect>0&&safe(gift.needScore)&&goodId(beautyId)&&safe(qty)&&qty>0&&qty<=1000&&safe(score),'BAD_BEAUTY_GIFT');
        requireOk(score>=gift.needScore,'BEAUTY_SCORE_REQUIRED');
        requireOk(next.nlCity?.levels?.nl_city_manor>=1,'MANOR_REQUIRED');
        const wallet=next.nlContentC?.mobileBeautyExp;
        requireOk(wallet&&typeof wallet==='object'&&!Array.isArray(wallet),'BEAUTY_STATE_REQUIRED');
        const have=own(wallet,beautyId)?wallet[beautyId]:0,added=gift.effect*qty;
        requireOk(safe(have)&&safe(added)&&safe(have+added),'BEAUTY_EXP_OVERFLOW');
        debitStack(m,id,qty);wallet[beautyId]=have+added;return {beautyId,qty,added};
      });
    }
    function resetMobileQuality(state,id,receipt,heroId,sourceId,from,to){
      return execute(state,'RESET_MOBILE_QUALITY',id,[heroId,sourceId,from,to],receipt,(next,m)=>{
        const row=get(id),c=next.nlContentC;
        requireOk(['normal','super'].includes(row.sourceReset)&&goodId(heroId)&&heroId!=='mobile-quy-tu'&&next.roster?.includes(heroId)&&next.hero?.[heroId]&&goodId(sourceId)&&safe(from)&&safe(to)&&from>to,'BAD_RESET_TARGET');
        requireOk(c?.mobileHeroRanks?.[heroId]===from&&c.mobileHeroRankReceipts&&c.mobileHeroMaterials,'RESET_RANK_MISMATCH');
        // Only refund actual debits in an unbroken chain; never fabricate historical expenditure.
        let rank=from;const refund=Object.create(null),keys=[];
        while(rank>to){
          const key=heroId+':'+rank,r=c.mobileHeroRankReceipts[key];
          requireOk(r&&String(r.sourceId)===sourceId&&r.to===rank&&safe(r.from)&&r.from<rank&&r.from>=to&&r.classification==='SOURCE_EXACT_QUANTITIES'&&r.materials&&typeof r.materials==='object','RESET_RECEIPT_CHAIN_INCOMPLETE');
          for(const [name,qty] of Object.entries(r.materials)){requireOk(goodId(name)&&safe(qty)&&qty>0&&safe((refund[name]||0)+qty),'BAD_RESET_REFUND');refund[name]=(refund[name]||0)+qty;}
          keys.push(key);rank=r.from;
        }
        requireOk(rank===to&&keys.length>0,'RESET_RECEIPT_CHAIN_INCOMPLETE');
        debitStack(m,id,1);
        for(const [name,qty] of Object.entries(refund)){const prev=c.mobileHeroMaterials[name]||0;requireOk(safe(prev)&&safe(prev+qty),'SOURCE_BUNDLE_OVERFLOW');c.mobileHeroMaterials[name]=prev+qty;}
        for(const key of keys)delete c.mobileHeroRankReceipts[key];
        c.mobileHeroRanks[heroId]=to;
        return {heroId,from,to,refund,classification:'PARTIAL_SOURCE_RESET_RECORDED_AWAKENING_ONLY'};
      });
    }
    function grantSourceBundle(next,m,rule,receipt,heroId){
      requireOk(Array.isArray(rule.outputs)&&rule.outputs.length>0&&rule.outputs.length<=64,'INVALID_SOURCE_BUNDLE');
      if(!next.nlContentC||typeof next.nlContentC!=='object')next.nlContentC={};
      const c=next.nlContentC;
      requireOk((c.mobileCommanderLevel||0)>=(rule.minCommander||0),'COMMANDER_LEVEL_REQUIRED');
      if(rule.levelGift){requireOk(safe(rule.levelGift)&&rule.levelGift>=1&&rule.levelGift<=39,'INVALID_LEVEL_GIFT');c.levelGiftClaims=c.levelGiftClaims||{};requireOk(!c.levelGiftClaims[rule.levelGift]&&(rule.levelGift===1||c.levelGiftClaims[rule.levelGift-1]),'LEVEL_GIFT_ALREADY_CLAIMED_OR_OUT_OF_ORDER');c.levelGiftClaims[rule.levelGift]=true;}
      if(!c.mobileHeroMaterials||typeof c.mobileHeroMaterials!=='object')c.mobileHeroMaterials={};
      if(rule.requiredKey){requireOk(goodId(rule.requiredKey)&&get(rule.requiredKey).category==='material','INVALID_BUNDLE_KEY');debitStack(m,rule.requiredKey,1);}
      let outputs=rule.outputs;
      if(rule.randomOne){let hash=2166136261;for(const ch of receipt)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;outputs=[outputs[hash%outputs.length]];}
      for(const x of outputs){
        requireOk(safe(x.qty)&&x.qty>0&&goodId(x.name)&&['awakening','science','tripod','book-exp','horse-points','weapon-core','destiny-jade','stack','seal-credit','blank','commander-xp','silver','grain','gold','merit','hero-soul','orders','reserve','book-fragment','tempering-stone','hero-gem','child-manual','tiger-token','beauty-pendant'].includes(x.wallet),'INVALID_SOURCE_BUNDLE_OUTPUT');
        if(['silver','grain','gold'].includes(x.wallet)){addResource(next,x.wallet,x.qty);continue;}
        if(x.wallet==='hero-gem'){
          requireOk(goodId(heroId)&&next.hero?.[heroId]&&['bao','ne','phan'].includes(x.gem)&&x.qty<=9,'HERO_GEM_REQUIRED');
          c.mobileGemSlots=c.mobileGemSlots||{};const slots=c.mobileGemSlots[heroId]||(c.mobileGemSlots[heroId]={});
          requireOk((slots[x.gem]||0)<x.qty,'GEM_NOT_UPGRADE');slots[x.gem]=x.qty;continue;
        }
        if(x.wallet==='child-manual'){
          const child=c.mobileChild;requireOk(child&&['school2','chooseSkill','graduated'].includes(child.stage)&&!child.manualName&&goodId(x.skill),'CHILD_MANUAL_NOT_READY');
          const nation=next.nlClassicWorldA4?.nation||next.nation||null;
          if(x.faction&&nation&&['wei','shu','wu'].includes(nation))requireOk(x.faction==='wei'?nation==='wei':nation!=='wei','CHILD_MANUAL_FACTION');
          child.manualName=x.skill;continue;
        }
        if(['merit','orders','reserve','hero-soul','book-fragment'].includes(x.wallet)){
          const owner=['merit','orders'].includes(x.wallet)?(next.nlClassicA||(next.nlClassicA={})):x.wallet==='reserve'?next:c;
          const key=({'hero-soul':'soul','book-fragment':'bookFragments'})[x.wallet]||x.wallet;
          const prior=owner[key]||0,cap=x.wallet==='orders'?60:1000000000;requireOk(safe(prior)&&safe(prior+x.qty)&&prior<cap,'SOURCE_BUNDLE_OVERFLOW');owner[key]=Math.min(cap,prior+x.qty);continue;
        }
        if(x.wallet==='commander-xp'){
          requireOk(safe(x.maxQty)&&x.maxQty>=x.qty&&x.maxQty<=1000000,'INVALID_EXP_RANGE');
          const level=Math.min(440,Math.max(10,safe(c.mobileCommanderLevel)?c.mobileCommanderLevel:10,10+2*Object.keys(c.cleared||{}).length));
          requireOk(level<440,'COMMANDER_LEVEL_CAP');
          let seed=2166136261;for(const ch of receipt)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
          const earned=x.qty+seed%(x.maxQty-x.qty+1),xp=safe(c.mobileCommanderXp)?c.mobileCommanderXp:0;requireOk(safe(xp+earned),'SOURCE_BUNDLE_OVERFLOW');
          const total=xp+earned,levels=Math.min(440-level,Math.floor(total/1000));c.mobileCommanderLevel=level+levels;c.mobileCommanderXp=c.mobileCommanderLevel===440?0:total-levels*1000;continue;
        }
        if(x.wallet==='stack'){requireOk(goodId(x.itemId),'INVALID_SOURCE_BUNDLE_OUTPUT');addStack(m,x.itemId,x.qty);continue;}
        const map={'tiger-token':'hoPhu','beauty-pendant':'mobileBeautyPendants','seal-credit':'chienTich','blank':'blank','science':'mobileTechPoints','tripod':'mobileTechTripods','book-exp':'bookExp','horse-points':'horsePoints','weapon-core':'weaponCore','destiny-jade':'destinyJade','tempering-stone':'temperingStone'};
        let owner=x.wallet==='awakening'?c.mobileHeroMaterials:c;
        if(['weapon-core','destiny-jade','blank','tempering-stone'].includes(x.wallet)){
          if(!next.heroDevelopment||typeof next.heroDevelopment!=='object')next.heroDevelopment={};
          if(!next.heroDevelopment.materials||typeof next.heroDevelopment.materials!=='object')next.heroDevelopment.materials={};
          owner=next.heroDevelopment.materials;
        }
        const key=x.wallet==='awakening'?x.name:map[x.wallet],factor=x.factor??1,qty=x.qty*factor;
        requireOk(safe(factor)&&factor>0&&safe(qty),'INVALID_SOURCE_BUNDLE_OUTPUT');
        const previous=own(owner,key)?owner[key]:0;requireOk(safe(previous)&&safe(previous+qty),'SOURCE_BUNDLE_OVERFLOW');owner[key]=previous+qty;
      }
    }
    function use(state,id,receipt,heroId=null){
      return execute(state,'USE_ITEM',id,heroId,receipt,(next,m)=>{
        const row=get(id),rule=row.effectRule;
        requireOk(row.category==='consumable','MATERIAL_MUST_BE_PROCESSED');
        requireOk(rule&&rule.kind,'NO_ACTION_RULE');
        if(rule.kind==='TRAIN_HERO_XP'){
          requireOk(goodId(heroId)&&next.hero?.[heroId],'HERO_REQUIRED');
          const hero=next.hero[heroId];
          requireOk(safe(hero.level)&&hero.level>=1&&hero.level<40&&safe(hero.xp||0),
            'HERO_LEVEL_INVALID');
        }
        if(rule.kind==='OPEN_BUNDLE'){
          requireOk(rule.resources&&typeof rule.resources==='object'&&
            rule.stacks&&typeof rule.stacks==='object','INVALID_BUNDLE');
          for(const [res,qty] of Object.entries(rule.resources))
            requireOk(RESOURCE.has(res)&&safe(qty),'INVALID_BUNDLE_RESOURCE');
          for(const [item,qty] of Object.entries(rule.stacks)){
            requireOk(goodId(item)&&safe(qty)&&qty>0&&item!==id,'INVALID_BUNDLE_ITEM');
            get(item);
          }
        }
        debitStack(m,id,1);
        if(rule.kind==='GRANT_RESOURCE')addResource(next,rule.resource,rule.amount);
        else if(rule.kind==='OPEN_SOURCE_BUNDLE')grantSourceBundle(next,m,rule,receipt,heroId);
        else if(rule.kind==='OPEN_BUNDLE'){
          for(const [res,qty] of Object.entries(rule.resources))addResource(next,res,qty);
          for(const [item,qty] of Object.entries(rule.stacks))addStack(m,item,qty);
        }else if(rule.kind==='TRAIN_HERO_XP'){
          const hero=next.hero[heroId];
          requireOk(safe(rule.amount)&&rule.amount>=1,'BAD_HERO_XP');
          requireOk(safe((hero.xp||0)+rule.amount),'HERO_XP_OVERFLOW');
          hero.xp=(hero.xp||0)+rule.amount;
          while(hero.level<40&&hero.xp>=hero.level*90){
            hero.xp-=hero.level*90;
            hero.level++;
          }
        }else error('UNSUPPORTED_ACTION');
        return {used:id,action:rule.kind,heroId};
      });
    }
    function process(state,id,receipt){
      return execute(state,'PROCESS_MATERIAL',id,null,receipt,(next,m)=>{
        const row=get(id),rule=row.effectRule;
        requireOk(row.category==='material'&&rule?.kind==='CRAFT_REAGENT',
          'NOT_PROCESSABLE');
        requireOk(goodId(rule.output)&&rule.output!==id&&
          safe(rule.needPieces)&&rule.needPieces>0&&
          safe(rule.silverCost)&&safe(rule.outputQuantity)&&rule.outputQuantity>0,
          'INVALID_RECIPE');
        const output=get(rule.output);
        requireOk(output.category==='material','BAD_RECIPE_OUTPUT');
        requireOk(safe(next.silver||0)&&next.silver>=rule.silverCost,'INSUFFICIENT_RESOURCES');
        debitStack(m,id,rule.needPieces);
        next.silver-=rule.silverCost;
        addStack(m,rule.output,rule.outputQuantity);
        return {processed:id,inputCount:rule.needPieces,output:rule.output,
          outputCount:rule.outputQuantity,silver:rule.silverCost};
      });
    }

    // Refund only actual receipt-backed payments. Old receipts stay immutable;
    // refunded receipt IDs cannot be counted in a subsequent unlock/reset cycle.
    function quoteEliteReset(state,appearanceId){
      const id=String(appearanceId),c=state?.nlContentC,m=state?.nlItemsV1;
      if(!/^\d+$/.test(id)||!c?.mobileEliteUnlocked?.[id]||!m?.receipts)return null;
      const level=c.mobileElitePending?.[id]?.to??c.mobileEliteLevels?.[id]??0;
      if(!safe(level)||level<1||level>20)return null;
      const ranks=c.mobileEliteSkills?.[id]||[1,0,0];
      if(!Array.isArray(ranks)||ranks.length!==3||ranks.some((r,i)=>!safe(r)||r<(i===0?1:0)||r>20))return null;
      const expected=new Set(['unlock:'+id+':1']);
      for(let i=2;i<=level;i++)expected.add('upgrade:'+id+':'+i);
      for(let pos=0;pos<3;pos++)for(let rank=pos===0?2:1;rank<=ranks[pos];rank++)expected.add('skill:'+id+':'+pos+':'+rank);
      const receipts=[],refund=Object.create(null),seen=new Set();
      for(const [key,fingerprint] of Object.entries(m.receipts)){
        if(c.mobileEliteRefundedReceipts?.[key]||typeof fingerprint!=='string')continue;
        let rec;try{rec=JSON.parse(fingerprint);}catch(_){continue;}
        if(!Array.isArray(rec)||rec[0]!=='CONSUME_SOURCE_MATERIALS'||typeof rec[1]!=='string'||!rec[1].startsWith('mobile-elite:'))continue;
        const scope=rec[1].slice('mobile-elite:'.length);
        if(!expected.has(scope))continue;
        if(seen.has(scope)||!Array.isArray(rec[2])||!rec[2].length)return null;
        seen.add(scope);receipts.push(key);
        for(const x of rec[2]){
          if(!x||!/^mobile-vng-item-mat_(63|73|74|75|76|77)$/.test(x.id)||!safe(x.quantity)||x.quantity<1||!safe((refund[x.id]||0)+x.quantity))return null;
          refund[x.id]=(refund[x.id]||0)+x.quantity;
        }
      }
      if(seen.size!==expected.size)return null;
      return {id,level,refund,receipts,classification:'ACTUAL_PAID_MATERIALS'};
    }
    function resetElite(state,appearanceId,receipt){
      const id=String(appearanceId),token='mobile-vng-item-856';
      return execute(state,'RESET_ELITE',id,null,receipt,(next,m)=>{
        requireOk(get(token).sourceTypedRoute==='elite-reset-token','BAD_ELITE_RESET_TOKEN');
        const q=quoteEliteReset(next,id);
        requireOk(q,'ELITE_RESET_RECEIPT_CHAIN_INCOMPLETE');
        debitStack(m,token,1);
        for(const [material,qty] of Object.entries(q.refund))addStack(m,material,qty);
        const c=next.nlContentC;
        c.mobileEliteRefundedReceipts=c.mobileEliteRefundedReceipts||{};
        for(const key of q.receipts)c.mobileEliteRefundedReceipts[key]=true;
        for(const field of ['mobileEliteUnlocked','mobileEliteLevels','mobileEliteSkills','mobileElitePending'])if(c[field])delete c[field][id];
        for(const [hero,assigned] of Object.entries(c.mobileEliteAssigned||{}))if(String(assigned)===id)delete c.mobileEliteAssigned[hero];
        return {id,refund:q.refund,classification:'SOURCE_REFUND_RECORDED_PAYMENTS_SIMULATED_PER_APPEARANCE_RESET'};
      });
    }


    // The base hero level includes earned battle XP and old saves cannot distinguish it
    // from purchased training. Leave it intact. Refund only complete paid rank lanes.
    const DEMOTION_RATES={'560':60,'561':80,'562':100};
    function heroDevelopmentRefundQuote(state,heroId,tokenId){
      const id=String(heroId),rate=DEMOTION_RATES[String(tokenId)],d=state?.heroDevelopment,h=d?.heroes?.[id];
      if(!rate||!goodId(id)||id==='mobile-quy-tu'||!state?.roster?.includes(id)||!h)return null;
      const ledger=Array.isArray(d.refundLedger?.[id])?d.refundLedger[id]:(d.receipts||[]).filter(r=>r?.heroId===id);
      const plan=[],used=new Set(),currency=Object.create(null),materials=Object.create(null),blocked=[];
      function lane(system,levels,field,base=0,option=null){
        if(!Array.isArray(levels)||!levels.length)return;
        const records=ledger.filter(r=>r?.system===system&&(option===null||r.option===option));
        // Compare the full level multiset, not just number of entries.
        if(records.length!==levels.length||records.map(r=>r.level).sort((a,b)=>a-b).join(',')!==levels.slice().sort((a,b)=>a-b).join(',')||
          records.some(r=>!goodId(r.id)||!r.currency||!r.materials||used.has(r.id))){
          blocked.push(option===null?system:system+':'+option);return;
        }
        const local={currency:Object.create(null),materials:Object.create(null)};
        for(const r of records)for(const k of ['currency','materials'])for(const [name,amount] of Object.entries(r[k])){
          if(!goodId(name)||!safe(amount)||k==='currency'&&!['silver','gold','iron','gems','merit'].includes(name)||
             k==='materials'&&!own(d.materials||{},name)||!safe((local[k][name]||0)+amount)){
            blocked.push(system);return;
          }
          local[k][name]=(local[k][name]||0)+amount;
        }
        for(const r of records)used.add(r.id);
        for(const k of ['currency','materials'])for(const [name,amount] of Object.entries(local[k])){
          const wallet=k==='currency'?currency:materials;wallet[name]=(wallet[name]||0)+amount;
        }
        plan.push({system,field,base,option});
      }
      const range=(from,to)=>safe(to)&&to>=from&&to<=100?Array.from({length:to-from+1},(_,i)=>from+i):[];
      lane('commander',range(1,h.commanderLevel),'commanderLevel');
      lane('inheritance',range(1,h.inheritanceLevel),'inheritanceLevel');
      lane('skill',range(2,h.skillLevel),'skillLevel',1);
      // A migrated legacy weapon baseline is retained; only newly paid Mobile ranks are refunded.
      lane('mobile-weapon',range((h.weaponLevel||0)+1,h.mobileBuild?.weapon),'mobileWeapon',h.weaponLevel||0);
      if(!h.mobileBuild?.weapon)lane('specialWeapon',range(1,h.weaponLevel),'weaponLevel');
      lane('destiny',range(1,h.destinyLevel),'destinyLevel');
      const ranks=h.mobileBuild?.ranks||{};
      const rankEntries=Object.entries(ranks).filter(([,rank])=>safe(rank)&&rank>0);
      // Legacy receipts omit the chosen option. If every option's rank multiset
      // is represented, reset all options together (no invented historical payment).
      const allRanks=rankEntries.flatMap(([,rank])=>range(1,rank));
      lane('mobile-destiny',allRanks,'mobileDestinyAll');
      lane('ancient',range(1,h.ancientLevel),'ancientLevel');
      // Illusion depends on ancient level. Refuse ancient reset if any illusion is unlocked
      // without its own complete paid receipt; do not destroy earned unlocks.
      if((h.illusionUnlocked||[]).length&&plan.some(p=>p.field==='ancientLevel')){
        // quote is recomputed in a later supported transaction; preserve this dependency now.
        return null;
      }
      if(!plan.length)return null;
      for(const wallet of [currency,materials])for(const name of Object.keys(wallet)){
        if(!safe(wallet[name]))return null;
        wallet[name]=Math.floor(wallet[name]*rate/100);
      }
      return {heroId:id,tokenId:String(tokenId),rate,currency,materials,plan,blocked,receiptIds:[...used],classification:'SIMULATED_SCOPED_ACTUAL_PAYMENT_REFUND'};
    }
    function resetHeroDevelopment(state,heroId,tokenId,receipt){
      const id=String(heroId),token='mobile-vng-item-'+String(tokenId);
      return execute(state,'RESET_HERO_DEVELOPMENT',id,String(tokenId),receipt,(next,m)=>{
        requireOk(get(token).sourceTypedRoute==='hero-reset-token','BAD_HERO_RESET_TOKEN');
        const q=heroDevelopmentRefundQuote(next,id,tokenId);
        requireOk(q,'NO_COMPLETE_HERO_DEVELOPMENT_RECEIPTS');
        const d=next.heroDevelopment,h=d.heroes[id],refundIds=new Set(q.receiptIds);
        debitStack(m,token,1);
        for(const [name,qty] of Object.entries(q.currency)){
          const wallet=name==='merit'?next.nlClassicA:next;
          requireOk(wallet&&safe(wallet[name]||0)&&safe((wallet[name]||0)+qty),'REFUND_OVERFLOW');
          wallet[name]=(wallet[name]||0)+qty;
        }
        for(const [name,qty] of Object.entries(q.materials)){
          requireOk(safe(d.materials[name]||0)&&safe((d.materials[name]||0)+qty),'REFUND_OVERFLOW');
          d.materials[name]=(d.materials[name]||0)+qty;
        }
        for(const p of q.plan){
          if(p.field==='mobileWeapon')h.mobileBuild.weapon=p.base;
          else if(p.field==='mobileDestinyAll'){h.mobileBuild.ranks={};h.mobileBuild.destiny=null;}
          else {h[p.field]=p.base;if(p.field==='destinyLevel')h.destinyId=null;}
        }
        d.receipts=(d.receipts||[]).filter(r=>!refundIds.has(r.id));
        d.refundLedger=d.refundLedger||{};d.refundLedger[id]=(d.refundLedger[id]||[]).filter(r=>!refundIds.has(r.id));
        return {heroId:id,rate:q.rate,currency:q.currency,materials:q.materials,plan:q.plan,blocked:q.blocked,classification:q.classification};
      });
    }

    function inspect(id){
      const row=items[id];
      if(!row)return {found:false};
      return {found:true,playable:row.integration==='PLAYABLE',
        category:row.category,sourceGroup:row.sourceGroup||null,
        effect:row.integration==='PLAYABLE'?copy(row.effectRule):null,
        provenance:row.provenance.classification};
    }
    return {use,process,buySourceBundle,buySourceMaterial,buySourceMaterials,consumeSourceMaterials,giveBeautyGift,resetMobileQuality,quoteEliteReset,resetElite,heroDevelopmentRefundQuote,resetHeroDevelopment,inspect,validate:()=>validatePack(pack,config)};
  }
  return {createModule,validatePack};
});
