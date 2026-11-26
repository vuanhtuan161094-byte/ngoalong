/* Muu Dinh Tam Quoc — isolated inventory domain; no game globals or save writes.
 * All invented capacities/refinement/economy coefficients are PROJECT_ORIGINAL/SIMULATED.
 * Integrator passes catalogue and rules; reference-only Wiki rows are never actionable.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NLItemInventory = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const STATS = ['atk', 'def', 'int', 'hp', 'tdef', 'mdef'];
  const MOBILE_STATS = ['catk', 'matk', 'crit', 'counter', 'dodge'];
  const LANES = ['weaponAtk', 'horseAtk'];
  const RESOURCES = new Set(['silver', 'gold', 'iron', 'grain', 'prestige']);
  const SLOT_ALIASES = { banner: 'artifact' };
  const owned = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  function problem(code) { const e = new Error(code); e.code = code; throw e; }
  function assert(ok, code) { if (!ok) problem(code); }
  function integer(v, min = 0) { return Number.isSafeInteger(v) && v >= min; }
  function jsonCopy(v) { return JSON.parse(JSON.stringify(v)); }
  function canon(slot) { return SLOT_ALIASES[slot] || slot; }
  function saneId(v) { return typeof v === 'string' && v.length > 0 && v.length <= 160; }
  function validateCatalogue(pack) {
    assert(pack && Array.isArray(pack.equipment) && Array.isArray(pack.items), 'BAD_CATALOGUE');
    const ids = new Set(), byId = {};
    for (const row of [...pack.equipment, ...pack.items]) {
      assert(row && saneId(row.id) && !ids.has(row.id), 'DUPLICATE_OR_INVALID_ID');
      assert(['PLAYABLE', 'REFERENCE_ONLY'].includes(row.integration), 'BAD_INTEGRATION_STATUS');
      assert(['VERIFIED', 'DERIVED', 'SIMULATED', 'UNKNOWN', 'SOURCE_EXACT', 'DERIVED_FROM_SOURCE'].includes(row.provenance?.classification), 'BAD_PROVENANCE');
      if (row.integration === 'PLAYABLE') {
        const sourceEnabled=row.provenance.classification==='SOURCE_EXACT'&&row.sourceEdition==='CURRENT_VNG_MOBILE_WIKI'&&
          (row.acquisitionRule?.kind==='MOBILE_DROP'||row.acquisitionRule?.kind==='SOURCE_CURRENCY'||
           (row.acquisitionRule?.kind==='SHOP'&&['SOURCE_EXACT','SIMULATED_FALLBACK'].includes(row.acquisitionRule.classification)&&
            row.acquisitionRule.shopCost&&typeof row.acquisitionRule.shopCost==='object'));
        assert(row.provenance.classification === 'SIMULATED'||sourceEnabled, 'UNAPPROVED_WIKI_ACTIVATION');
        if (row.category === 'equipment') {
          assert(typeof row.slot === 'string' && row.stats && STATS.every(k => integer(row.stats[k])) &&
            MOBILE_STATS.every(k => row.stats[k] == null || integer(row.stats[k])), 'BAD_EQUIPMENT_STATS');
          if(sourceEnabled)assert(row.mobileEnhancement?.classification==='SOURCE_EXACT'&&
            row.mobileEnhancement.formulaId==='VNG_WIKI_BAC_CUONG_HOA_V1','BAD_SOURCE_EQUIPMENT_ADAPTER');
        } else {
          assert(['consumable', 'material'].includes(row.category), 'BAD_ACTIVE_ITEM_CATEGORY');
        }
      } else {
        assert(row.effectRule == null && row.stats == null, 'REFERENCE_HAS_ACTIVE_EFFECT');
      }
      ids.add(row.id); byId[row.id] = row;
    }
    return byId;
  }
  function createModule(pack, rules) {
    const catalog = validateCatalogue(pack);
    assert(rules && rules.limits && rules.reinforcement && rules.refinement, 'BAD_RULES');
    const limits = rules.limits;
    assert(integer(limits.equipmentInstances, 1) && integer(limits.stackKinds, 1) &&
      integer(limits.stackQuantity, 1) && integer(limits.receipts, 1), 'BAD_LIMITS');
    function moduleState(state) {
      if (!state.nlItemsV1) state.nlItemsV1 = { stacks: {}, receipts: {}, serial: 0 };
      const m = state.nlItemsV1;
      assert(m && typeof m.stacks === 'object' && m.stacks && !Array.isArray(m.stacks) &&
        m.receipts && typeof m.receipts === 'object' && !Array.isArray(m.receipts) &&
        integer(m.serial), 'CORRUPT_ITEM_STATE');
      assert(Array.isArray(state.items) && state.gear && typeof state.gear === 'object', 'INCOMPATIBLE_SAVE');
      return m;
    }
    function checkOwned(state) {
      const uids = new Set();
      for (const instance of state.items) {
        assert(instance && instance.uid != null && saneId(String(instance.uid)) && !uids.has(String(instance.uid)), 'DUPLICATE_INSTANCE_UID');
        uids.add(String(instance.uid));
      }
      const allocated = new Set();
      for (const gear of Object.values(state.gear)) {
        for (const uid of Object.values(gear || {})) {
          if (uid == null || uid === '') continue;
          assert(uids.has(String(uid)), 'DANGLING_EQUIPMENT');
          assert(!allocated.has(String(uid)), 'EQUIPMENT_DOUBLE_ASSIGNED');
          allocated.add(String(uid));
        }
      }
    }
    function execute(state, kind, receiptId, payload, apply) {
      try {
        assert(state && typeof state === 'object', 'BAD_SAVE');
        assert(saneId(receiptId), 'RECEIPT_REQUIRED');
        const fingerprint = JSON.stringify([kind, payload]);
        const next = jsonCopy(state), m = moduleState(next);
        const prev = m.receipts[receiptId];
        if (prev) {
          assert(prev === fingerprint, 'RECEIPT_CONFLICT');
          return { ok: true, duplicate: true, state, code: 'ALREADY_SETTLED' };
        }
        assert(Object.keys(m.receipts).length < limits.receipts, 'RECEIPT_CAPACITY');
        checkOwned(next);
        const detail = apply(next, m) || {};
        m.receipts[receiptId] = fingerprint;
        checkOwned(next);
        return { ok: true, duplicate: false, state: next, detail };
      } catch (err) {
        return { ok: false, duplicate: false, state, code: err.code || 'INVALID_OPERATION' };
      }
    }
    function available(id, category) {
      const row = catalog[id];
      assert(row, 'UNKNOWN_ITEM');
      assert(row.integration === 'PLAYABLE', 'REFERENCE_ONLY');
      if (category) assert(row.category === category, 'WRONG_ITEM_CATEGORY');
      return row;
    }
    function equipmentCapacity(state) {
      const level=state?.nlCity?.levels?.nl_city_warehouse;
      return limits.equipmentInstances+5*(Number.isSafeInteger(level)?Math.max(0,Math.min(20,level)):0);
    }
    function grant(state, entries, receiptId) {
      return execute(state, 'GRANT', receiptId, entries, (next, m) => {
        assert(Array.isArray(entries) && entries.length > 0 && entries.length <= 100, 'BAD_GRANT');
        const grouped = new Map();
        for (const e of entries) {
          assert(e && saneId(e.id) && integer(e.quantity, 1) && e.quantity <= 999, 'BAD_GRANT_QTY');
          available(e.id);
          grouped.set(e.id, (grouped.get(e.id) || 0) + e.quantity);
        }
        let equipmentCount = 0;
        const created = [];
        for (const [id, qty] of grouped) {
          const row = available(id);
          if (row.category === 'equipment') equipmentCount += qty;
          else {
            assert(integer(m.stacks[id] || 0), 'CORRUPT_STACK');
            assert((m.stacks[id] || 0) + qty <= limits.stackQuantity, 'STACK_CAPACITY');
          }
        }
        assert(next.items.length + equipmentCount <= equipmentCapacity(next), 'EQUIPMENT_CAPACITY');
        const kinds = new Set(Object.keys(m.stacks).filter(id => m.stacks[id] > 0));
        for (const [id] of grouped) if (catalog[id].category !== 'equipment') kinds.add(id);
        assert(kinds.size <= limits.stackKinds, 'STACK_KIND_CAPACITY');
        const existingUids = new Set(next.items.map(x => String(x.uid)));
        for (const [id, qty] of grouped) {
          if (catalog[id].category !== 'equipment') {
            m.stacks[id] = (m.stacks[id] || 0) + qty;
          } else {
            for (let i = 0; i < qty; i++) {
              let uid;
              do { m.serial++; uid = 'nli-' + m.serial; } while (existingUids.has(uid));
              existingUids.add(uid);
              next.items.push({ uid, base: id, lv: 1 });
              created.push(uid);
            }
          }
        }
        return { created, quantities: Object.fromEntries(grouped) };
      });
    }
    // Buying is distinct from receiving a victory reward: no item is created
    // without charging its declared project-shop cost in the same transaction.
    function buy(state, id, receiptId) {
      return execute(state, 'BUY_EQUIPMENT', receiptId, id, (next, m) => {
        const row = available(id, 'equipment');
        const acquisition = row.acquisitionRule;
        assert(acquisition && ['SHOP','SHOP_OR_AUTHORIZED_REWARD'].includes(acquisition.kind) &&
          acquisition.shopCost, 'EQUIPMENT_NOT_FOR_SALE');
        assert(next.items.length < equipmentCapacity(next), 'EQUIPMENT_CAPACITY');
        if(acquisition.classification==='SIMULATED_FALLBACK'){
          assert(integer(acquisition.minCommander,1)&&
            Math.max(10,Number(next.nlContentC?.mobileCommanderLevel)||10)>=acquisition.minCommander,'COMMANDER_LEVEL_REQUIRED');
          assert(integer(row.mobileSale?.amount,1)&&integer(acquisition.shopCost.silver,1)&&acquisition.shopCost.silver>row.mobileSale.amount,'FALLBACK_PRICE_ARBITRAGE');
        }
        pay(next, acquisition.shopCost);
        for(const material of acquisition.shopMaterials||[]){
          available(material.id,'material');
          assert(integer(material.quantity,1)&&integer(m.stacks[material.id]||0)&&
            (m.stacks[material.id]||0)>=material.quantity,'INSUFFICIENT_MATERIAL');
        }
        for(const material of acquisition.shopMaterials||[]){
          m.stacks[material.id]-=material.quantity;
          if(m.stacks[material.id]===0)delete m.stacks[material.id];
        }
        const uids = new Set(next.items.map(x => String(x.uid)));
        let uid;
        do { m.serial++; uid = 'nli-' + m.serial; } while (uids.has(uid));
        next.items.push({ uid, base: id, lv: 1 });
        return { purchased: id, uid, cost: { ...acquisition.shopCost,
          materials:jsonCopy(acquisition.shopMaterials||[]) } };
      });
    }
    function equipmentInstance(state, uid) {
      assert(uid != null && saneId(String(uid)), 'BAD_UID');
      const instance = state.items.find(x => String(x.uid) === String(uid));
      assert(instance, 'EQUIPMENT_NOT_OWNED');
      available(instance.base, 'equipment');
      assert(integer(instance.lv, 1), 'BAD_REINFORCEMENT_LEVEL');
      return instance;
    }
    function equip(state, heroId, uid, receiptId) {
      return execute(state, 'EQUIP', receiptId, [heroId, uid], next => {
        assert(saneId(heroId) && next.hero && owned(next.hero, heroId), 'HERO_NOT_FOUND');
        const instance = equipmentInstance(next, uid), row = catalog[instance.base];
        const level = next.hero[heroId]?.level;
        assert(integer(level, 1) && level >= (row.requiredLevel || 1), 'HERO_LEVEL_REQUIRED');
        const gear = next.gear[heroId] || (next.gear[heroId] = {});
        for (const [owner, slots] of Object.entries(next.gear)) {
          for (const currentUid of Object.values(slots || {})) {
            if (String(currentUid) === String(uid)) {
              assert(owner === heroId, 'EQUIPPED_BY_OTHER_HERO');
              assert(String(gear[row.slot]) === String(uid), 'ALREADY_EQUIPPED_WRONG_SLOT');
            }
          }
        }
        // Existing Save v5 uses 'banner', so preserve the concrete slot key.
        assert(!Object.entries(gear).some(([slot, oldUid]) =>
          canon(slot) === canon(row.slot) && slot !== row.slot && oldUid), 'DUPLICATE_SLOT_ALIAS');
        gear[row.slot] = instance.uid;
        return { heroId, uid: instance.uid, slot: row.slot };
      });
    }
    function unequip(state, heroId, slot, receiptId) {
      return execute(state, 'UNEQUIP', receiptId, [heroId, slot], next => {
        assert(saneId(heroId) && next.hero && owned(next.hero, heroId), 'HERO_NOT_FOUND');
        assert(saneId(slot), 'BAD_SLOT');
        const gear = next.gear[heroId] || {};
        assert(owned(gear, slot) && gear[slot] != null, 'SLOT_EMPTY');
        const uid = gear[slot];
        delete gear[slot];
        return { heroId, uid, slot };
      });
    }
    function mobilePromoteQuote(state,uid){
      const item=state.items.find(x=>String(x.uid)===String(uid)),from=item&&catalog[item.base],to=from&&catalog[from.mobilePromotion?.to];
      if(!from?.mobileEnhancement||!to?.mobileEnhancement||from.slot!==to.slot||!(to.displayedLevel>from.displayedLevel||to.displayedLevel===from.displayedLevel&&to.sourceQuality>from.sourceQuality))return null;
      const oldSale=from.mobileSale?.amount||0,newSale=to.mobileSale?.amount||0;
      return {from:from.id,to:to.id,name:to.name,kind:from.mobilePromotion.kind,commander:Math.max(10,Math.min(440,to.displayedLevel||10)),silver:Math.max(1000,newSale-oldSale+1,Math.ceil(newSale*.3)),classification:'SOURCE_RELATION_SIMULATED_FEE'};
    }
    function mobilePromote(state,uid,receiptId){
      return execute(state,'MOBILE_PROMOTE',receiptId,uid,(next)=>{
        const item=equipmentInstance(next,uid),q=mobilePromoteQuote(next,uid);
        assert(q,'MOBILE_PROMOTION_NOT_AVAILABLE');
        assert(Math.max(10,Number(next.nlContentC?.mobileCommanderLevel)||10)>=q.commander,'COMMANDER_LEVEL_REQUIRED');
        pay(next,{silver:q.silver});
        const from=item.base;item.base=q.to;
        // Keep the owned UID, slot and level, but invalidate incompatible refinement rolls.
        const dest=catalog[q.to],pool=dest.mobileRefinement?.sourcePools;
        if(item.mobileRefines)for(const key of Object.keys(item.mobileRefines)){
          const allowed=pool?.[key];if(!Array.isArray(allowed)){delete item.mobileRefines[key];continue;}
          item.mobileRefines[key]=item.mobileRefines[key].filter(x=>allowed.some(y=>y.code===x.code&&y.value===x.value&&y.name===x.name));
        }
        return {uid,from,to:q.to,level:item.lv,silver:q.silver,classification:q.classification};
      });
    }
    function sell(state, uid, receiptId) {
      return execute(state, 'SELL_EQUIPMENT', receiptId, uid, (next) => {
        const instance=equipmentInstance(next,uid),row=catalog[instance.base],sale=row.mobileSale;
        assert(sale?.classification==='SOURCE_EXACT_VALUE_WITH_SIMULATED_CURRENCY'&&
          integer(sale.amount,1)&&RESOURCES.has(sale.currency)&&
          sale.currencyClassification==='SIMULATED','EQUIPMENT_NOT_SELLABLE');
        assert(!Object.values(next.gear).some(slots=>
          Object.values(slots||{}).some(equipped=>String(equipped)===String(uid))),
          'EQUIPMENT_EQUIPPED');
        const balance=next[sale.currency]||0;
        assert(integer(balance)&&Number.isSafeInteger(balance+sale.amount),'RESOURCE_OVERFLOW');
        const index=next.items.findIndex(x=>String(x.uid)===String(uid));
        assert(index>=0,'EQUIPMENT_NOT_OWNED');
        next.items.splice(index,1);next[sale.currency]=balance+sale.amount;
        return {sold:instance.base,uid:instance.uid,amount:sale.amount,currency:sale.currency,
          currencyClassification:sale.currencyClassification};
      });
    }
    function pay(state, costs) {
      for (const [resource, amount] of Object.entries(costs)) {
        assert(RESOURCES.has(resource) && integer(amount), 'INVALID_COST');
        assert(integer(state[resource] || 0) && (state[resource] || 0) >= amount, 'INSUFFICIENT_RESOURCES');
      }
      for (const [resource, amount] of Object.entries(costs)) state[resource] = (state[resource] || 0) - amount;
    }
    function mobileBacCost(level, enhancement) {
      const G=1/600,e=level;
      let value=enhancement.inc*enhancement.coef*e*(0.22+e*e*G)*enhancement.qualityCoef*G+5*e+3*enhancement.inc;
      if(e>=200)value*=2;
      return Math.floor(value);
    }
    function mobileNgocCost(level) {
      if(level<=200)return 0;
      if(level>260)return level;
      return 40*Math.ceil((level-200)/10);
    }
    // One price source for UI, combat state and all receipt transactions.
    function reinforcementCost(level, state, equipmentId, targetLevel) {
      assert(integer(level, 1), 'BAD_REINFORCE_LEVEL');
      const source=equipmentId?catalog[equipmentId]:null,enhancement=source?.mobileEnhancement;
      if(enhancement){
        const target=targetLevel==null?level+1:targetLevel;
        assert(integer(target,level+1)&&target<=enhancement.maxLevel&&integer(enhancement.inc,1)&&
          Number.isFinite(enhancement.coef)&&Number.isFinite(enhancement.qualityCoef),'BAD_SOURCE_REINFORCE_TARGET');
        const commander=Number.isSafeInteger(state?.nlContentC?.mobileCommanderLevel)?state.nlContentC.mobileCommanderLevel:1;
        const discount=commander>=300?.10:commander>=200?.05:0;
        let silver=0,ngoc=0;
        // A batch must debit the same rounded amount as applying each level
        // individually. The Wiki publishes the undiscounted per-level formula;
        // its level discount is text-only, so this floor is an explicit adapter
        // assumption, separate from the exact base price.
        for(let e=level+1;e<=target;e++){
          const base=mobileBacCost(e,enhancement);
          silver+=discount?Math.floor(base*(1-discount)):base;
          ngoc+=mobileNgocCost(e);
        }
        const materials=ngoc?[{id:'mobile-vng-resource-res_16',name:'Tranh Ngọc',quantity:ngoc}]:[];
        return {silver,materials,sourceBaseExact:true,discount,discountClassification:'DERIVED_FROM_SOURCE'};
      }
      assert(level < rules.reinforcement.maxLevel, 'BAD_REINFORCE_LEVEL');
      const r=rules.reinforcement;
      const silver=Math.round(r.silverBase*Math.pow(level,r.silverExponent));
      const cost = r.classicA3Pricing===true
        ? {silver:silver+Math.round(r.silverSupplementBase*Math.pow(level,r.silverSupplementExponent)),
           grain:Math.round(r.grainBase*Math.pow(level,r.grainExponent))}
        : {silver,iron:Math.round(r.ironBase*Math.pow(level,r.ironExponent))};
      const levels=state?.nlCity?.levels||{};
      const safeLevel=id=>Number.isSafeInteger(levels[id])?Math.max(0,Math.min(20,levels[id])):0;
      const discount=Math.min(.16,Math.min(.10,safeLevel('nl_city_workshop')*.02)+Math.min(.06,safeLevel('nl_city_engraving')*.01));
      if(discount)cost.silver=Math.ceil(cost.silver*(1-discount));
      return cost;
    }
    function reinforce(state, uid, receiptId, requestedLevel) {
      return execute(state, 'REINFORCE', receiptId, [uid,requestedLevel??null], (next,m) => {
        const instance = equipmentInstance(next, uid),row=catalog[instance.base],mobile=row.mobileEnhancement;
        const max=mobile?.maxLevel||rules.reinforcement.maxLevel;
        const target=mobile?(requestedLevel==null?instance.lv+1:requestedLevel):instance.lv+1;
        assert(integer(target,instance.lv+1)&&target<=max, 'REINFORCEMENT_MAX');
        const cost = reinforcementCost(instance.lv,next,instance.base,target);
        const currencies=Object.fromEntries(Object.entries(cost).filter(([key])=>!['materials','sourceExact','sourceBaseExact','discount','discountClassification'].includes(key)));
        pay(next, currencies);
        for(const material of cost.materials||[]){
          available(material.id,'material');
          assert(integer(m.stacks[material.id]||0)&&(m.stacks[material.id]||0)>=material.quantity,'INSUFFICIENT_MATERIAL');
        }
        for(const material of cost.materials||[]){
          m.stacks[material.id]-=material.quantity;
          if(m.stacks[material.id]===0)delete m.stacks[material.id];
        }
        instance.lv=target;
        return { uid: instance.uid, level: instance.lv, cost };
      });
    }
    // Exact source pool values. Unknown prices and weights above 100% use explicit offline adapters.
    const MOBILE_REFINE_POOLS=['so','cao','dacKy'], MOBILE_REFINE_STONE='mobile-vng-resource-res_62';
    function mobileRefineQuote(state,uid,pool){
      const instance=state.items.find(x=>String(x.uid)===String(uid)),row=instance&&catalog[instance.base],p=row?.mobileRefinement?.sourcePools;
      if(!p||!MOBILE_REFINE_POOLS.includes(pool)||!Array.isArray(p[pool])||!p[pool].length)return null;
      const i=MOBILE_REFINE_POOLS.indexOf(pool),gate=[1,50,100][i],count=pool==='dacKy'?1:pool==='so'?p.effectNum:p.seniorEffectNum;
      if(!integer(count,1)||count>3)return null;
      const sum=p[pool].reduce((n,x)=>n+x.rate,0);
      if(!Number.isFinite(sum)||sum<=0||!p[pool].every(x=>Number.isFinite(x.value)&&Number.isFinite(x.rate)&&x.rate>0))return null;
      return {pool,gate,count,silver:600*(i+1)*Math.max(1,row.sourceQuality||1),stone:[1,2,4][i],materialId:MOBILE_REFINE_STONE,
        weightSum:sum,classification:'SOURCE_EXACT_VALUES_SIMULATED_COST_AND_ROLL'};
    }
    function mobileRefineRoll(rows,seed){
      let hash=2166136261;
      for(const c of seed)hash=Math.imul(hash^c.charCodeAt(0),16777619)>>>0;
      let weight=rows.reduce((n,x)=>n+x.rate,0)*(hash/4294967296);
      for(const x of rows){weight-=x.rate;if(weight<0)return jsonCopy(x);}
      return jsonCopy(rows[rows.length-1]);
    }
    function mobileRefine(state,uid,pool,receiptId){
      return execute(state,'MOBILE_REFINE',receiptId,[uid,pool],(next,m)=>{
        const instance=equipmentInstance(next,uid),row=catalog[instance.base],q=mobileRefineQuote(next,uid,pool);
        assert(q,'MOBILE_REFINE_POOL');
        assert(instance.lv>=q.gate,'MOBILE_REFINE_LEVEL');
        available(q.materialId,'material');
        assert(integer(m.stacks[q.materialId]||0)&&m.stacks[q.materialId]>=q.stone,'INSUFFICIENT_MATERIAL');
        pay(next,{silver:q.silver});m.stacks[q.materialId]-=q.stone;
        if(m.stacks[q.materialId]===0)delete m.stacks[q.materialId];
        if(!instance.mobileRefines||typeof instance.mobileRefines!=='object'||Array.isArray(instance.mobileRefines))instance.mobileRefines={};
        instance.mobileRefineSerial=integer(instance.mobileRefineSerial)?instance.mobileRefineSerial+1:1;
        const rolls=Array.from({length:q.count},(_,i)=>mobileRefineRoll(row.mobileRefinement.sourcePools[pool],uid+':'+pool+':'+instance.mobileRefineSerial+':'+i));
        instance.mobileRefines[pool]=rolls;
        return {uid,pool,rolls,quote:q};
      });
    }
    function mobileRefineModifiers(state,heroId){
      const out={lead:0,war:0,intellect:0,atk:0,catk:0,matk:0,def:0,tdef:0,mdef:0,hp:0,crit:0,dodge:0,finalDamage:0,critDamage:0,pierceFlat:0,vs:{},resist:{},allDefense:0,teamDefense:0,unresolved:[]};
      for(const uid of Object.values(state.gear?.[heroId]||{})){
        if(uid==null)continue;
        const item=equipmentInstance(state,uid),p=catalog[item.base]?.mobileRefinement?.sourcePools;
        if(!p)continue;
        for(const pool of MOBILE_REFINE_POOLS){
          const cap=mobileRefineQuote(state,uid,pool)?.count||0;
          for(const roll of (Array.isArray(item.mobileRefines?.[pool])?item.mobileRefines[pool]:[]).slice(0,cap)){
            const x=p[pool].find(v=>v.code===roll.code&&v.value===roll.value&&v.name===roll.name);if(!x)continue;
            const v=x.value,stat=({11:'atk',12:'def',13:'matk',14:'mdef',15:'catk',16:'tdef',27:'lead',28:'war',29:'intellect',55:'dodge',56:'finalDamage',58:'critDamage',60:'crit'})[x.code];
            if(stat)out[stat]+=v;
            else if(x.code===7)out.hp+=v*.001*.82;
            else if(x.code===59){out.lead+=v;out.war+=v;out.intellect+=v;}
            else if(x.code===45){for(const k of ['atk','catk','matk'])out[k]+=v;}
            else if(x.code===46){if(/toàn phe ta/i.test(x.name))out.teamDefense+=v;else out.allDefense+=v;}
            else if(x.code===36)out.pierceFlat+=v*.001;
            else if(x.code>=47&&x.code<=50){const f=['Thục','Ngụy','Ngô','Quần'][x.code-47];out.vs[f]=(out.vs[f]||0)+v;}
            else if(x.code>=51&&x.code<=54){const f=['Thục','Ngụy','Ngô','Quần'][x.code-51];out.resist[f]=(out.resist[f]||0)+v;}
            else out.unresolved.push(x.name);
          }
        }
      }
      return out;
    }
    function refine(state, uid, receiptId) {
      return execute(state, 'REFINE', receiptId, uid, (next, m) => {
        const instance = equipmentInstance(next, uid), r = rules.refinement;
        assert(!catalog[instance.base].mobileEnhancement,'MOBILE_REFINE_MECHANICS_UNRESOLVED');
        const rank = instance.refineLv || 0;
        assert(integer(rank) && rank < r.maxLevel, 'REFINE_MAX');
        const material = available(r.materialId, 'material');
        const row = catalog[instance.base];
        // R03 and early gear remain price-stable; premium applies only to
        // high-tier, project-authored equipment.
        const premium = row.sourceId && row.integration==='PLAYABLE' && r.highTierPricing?.groups
          ? r.highTierPricing.groups[row.sourceGroup] : null;
        const materialCount = r.materialPerLevel + (premium?.materialExtra || 0);
        assert(integer(m.stacks[material.id] || 0) && m.stacks[material.id] >= materialCount, 'INSUFFICIENT_MATERIAL');
        const cost = { silver: Math.round(r.silverBase * (rank + 1) * (premium?.silverMultiplier || 1)) };
        pay(next, cost);
        m.stacks[material.id] -= materialCount;
        if (m.stacks[material.id] === 0) delete m.stacks[material.id];
        instance.refineLv = rank + 1;
        return { uid: instance.uid, refineLv: instance.refineLv, cost, material: material.id };
      });
    }
    function use(state, id, receiptId) {
      return execute(state, 'USE', receiptId, id, (next, m) => {
        const row = available(id, 'consumable'), effect = row.effectRule;
        assert(effect && effect.kind === 'GRANT_RESOURCE' && RESOURCES.has(effect.resource) &&
          integer(effect.amount, 1), 'UNSUPPORTED_CONSUMABLE');
        assert(integer(m.stacks[id] || 0) && m.stacks[id] >= 1, 'OUT_OF_STOCK');
        assert(integer(next[effect.resource] || 0) &&
          (next[effect.resource] || 0) + effect.amount <= Number.MAX_SAFE_INTEGER, 'RESOURCE_OVERFLOW');
        m.stacks[id]--;
        if (m.stacks[id] === 0) delete m.stacks[id];
        next[effect.resource] = (next[effect.resource] || 0) + effect.amount;
        return { consumed: id, resource: effect.resource, added: effect.amount };
      });
    }
    function collectSets(state, heroId) {
      const counts = new Map();
      for (const uid of Object.values(state.gear?.[heroId] || {})) {
        if (uid == null) continue;
        const instance = equipmentInstance(state, uid);
        const setId = catalog[instance.base].effectRule?.setId;
        if (setId) counts.set(setId, (counts.get(setId) || 0) + 1);
      }
      const activated = [], totals = Object.fromEntries(STATS.map(k => [k,0]));
      for (const [setId, pieces] of counts) {
        const rule = rules.setBonuses?.[setId];
        if (!rule) continue;
        for (const threshold of rule.thresholds || []) {
          if (pieces < threshold.pieces) continue;
          assert(integer(threshold.pieces, 1) && STATS.every(k =>
            !Object.prototype.hasOwnProperty.call(threshold.stats,k) ||
            integer(threshold.stats[k])), 'BAD_SET_BONUS');
          for (const [key, amount] of Object.entries(threshold.stats)) {
            assert(STATS.includes(key) && integer(amount), 'BAD_SET_BONUS');
            totals[key] += amount;
          }
          activated.push({ setId, pieces, activatedAt: threshold.pieces,
            stats: { ...threshold.stats } });
        }
      }
      return { bonuses: totals, activated };
    }
    function sets(state, heroId) {
      checkOwned(state);
      return collectSets(state, heroId).activated;
    }
    function bonuses(state, heroId) {
      checkOwned(state);
      const result = Object.fromEntries([...STATS, ...MOBILE_STATS, ...LANES].map(k => [k, 0]));
      for (const uid of Object.values(state.gear?.[heroId] || {})) {
        if (uid == null) continue;
        const instance = equipmentInstance(state, uid), row = catalog[instance.base];
        if(row.mobileEnhancement){
          const scale=row.mobileEnhancement.statScale||0.001,level=instance.lv;
          for(const attr of row.sourceStats||[]){
            const key=({"Vật Công":"atk","Pháp Công":"catk","Mưu Công":"matk","Vật Phòng":"def","Pháp Phòng":"tdef","Mưu Phòng":"mdef","Lính":"hp","Bạo Kích":"crit","Phản Kích":"counter","Né Tránh":"dodge"})[attr.label];
            if(!key)continue;
            const raw=attr.pct?(attr.base||0)/100:(attr.base||0)+(level-1)*(attr.growth||0);
            const adapted=attr.pct?raw:(raw>0?Math.max(1,Math.round(raw*scale)):0);
            result[key]+=adapted;
            if(key==='atk'&&row.slot==='weapon')result.weaponAtk+=adapted;
          }
          continue;
        }
        const refineLv = instance.refineLv || 0;
        assert(integer(refineLv) && refineLv <= rules.refinement.maxLevel, 'BAD_REFINE_LEVEL');
        const factor = (1 + (instance.lv - 1) * rules.reinforcement.statBonusPerLevel) *
          (1 + refineLv * rules.refinement.statBonusPerLevel);
        for (const stat of STATS) result[stat] += Math.round(row.stats[stat] * factor);
        if (row.slot === 'weapon') result.weaponAtk += Math.round(row.stats.atk * factor);
        if (row.slot === 'horse') result.horseAtk += Math.round(row.stats.atk * factor);
      }
      const setStats = collectSets(state, heroId).bonuses;
      for (const key of STATS) result[key] += setStats[key];
      return result;
    }
    return { grant, buy, equip, unequip, sell, reinforce, reinforcementCost, refine, mobileRefine, mobileRefineQuote, mobileRefineModifiers, mobilePromote, mobilePromoteQuote, use, bonuses, sets, validateState: checkOwned };
  }
  return { createModule, validateCatalogue };
});
