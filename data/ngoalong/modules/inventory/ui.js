/* Equipment-panel UI bridge: ready to mount into the canonical Ngoa Long tab
 * by Chat08. No changes to Save, generator or shared runtime in this module.
 * Actual actions require caller-owned, durable receipt IDs.
 */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NLItemEquipmentUI=api;
})(typeof globalThis==='object'?globalThis:this,function(){
  'use strict';
  const SLOTS=[
    ['all','Tất cả'],['weapon','Vũ khí'],['armor','Giáp'],
    ['horse','Ngựa'],['book','Binh thư'],['cloak','Áo choàng'],
    ['shield','Thuẫn'],['artifact','Bảo vật']
  ];
  const STYLES=`
.nli-panel{color:#e9dfc9;background:linear-gradient(155deg,#202f38,#111f29 80%);border:1px solid #957d4d;border-radius:12px;padding:16px;font:14px/1.5 system-ui,sans-serif;box-shadow:0 14px 40px #0005}
.nli-panel *{box-sizing:border-box}
.nli-panel .nli-heading{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px solid #91785170;padding-bottom:10px}
.nli-panel h2{color:#f3d28c;font-size:21px;margin:0}
.nli-panel h3{color:#efc77a;font-size:15px;margin:14px 0 8px}
.nli-panel .nli-balance{font-variant-numeric:tabular-nums;color:#d8ccae}
.nli-panel .nli-tabs,.nli-panel .nli-switch,.nli-panel .nli-buttons{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin:10px 0}
.nli-panel .nli-tabs{overflow-x:auto;flex-wrap:nowrap;padding-bottom:5px}
.nli-panel button{cursor:pointer;border:1px solid #ad8a54;background:#344550;color:#f3e6c9;padding:7px 10px;border-radius:7px;font-size:12px;white-space:nowrap}
.nli-panel button[aria-pressed=true],.nli-panel button:hover{background:#80612f;color:#fff6df}
.nli-panel button:disabled{opacity:.45;cursor:not-allowed}
.nli-panel label{display:block;color:#d5c4a1;margin:10px 0}
.nli-panel input{display:block;width:100%;max-width:410px;background:#101b25;border:1px solid #87754f;border-radius:7px;color:#f1e7ce;padding:9px;margin-top:5px;font-size:14px}
.nli-panel .nli-slots{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}
.nli-panel .nli-slot{min-height:94px;padding:8px;background:#2c3c44;border:1px solid #8e7347;border-radius:8px;display:flex;flex-direction:column;justify-content:center;gap:4px}
.nli-panel .nli-slot span{font-size:11px;color:#b8c6c8}
.nli-panel .nli-slot strong{font-size:12px;color:#f4d291;line-height:1.3;overflow-wrap:anywhere}
.nli-panel .nli-slot small{font-size:11px;color:#d5d4c9}
.nli-panel .nli-total,.nli-panel .nli-sets{padding:10px;margin:9px 0;background:#283a44;border-left:3px solid #b79552;border-radius:4px}
.nli-panel .nli-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;margin-top:12px}
.nli-panel .nli-gear{background:#293a43;border:1px solid #796740;border-radius:9px;padding:11px;min-height:150px}
.nli-panel .nli-gear header{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nli-panel .nli-gear header strong{font-size:14px;color:#f0d08c}
.nli-panel .nli-gear header span{font-size:11px;color:#ccc2ae}
.nli-panel .nli-gear small{color:#aebebf}
.nli-panel .nli-gear p{color:#e6d8b6}
.nli-panel .nli-gear .nli-buttons{margin-bottom:0}
.nli-panel .nli-gear{min-width:0;overflow-wrap:anywhere}
.nli-panel .nli-gear header{flex-wrap:wrap}
.nli-panel .nli-tools{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:7px}
.nli-panel .nli-pages{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px}
.nli-panel .nli-price{color:#d8bf8c;font-size:12px;margin:7px 0}
.nli-panel .nli-meta{font-size:12px;color:#aebebf;margin:6px 0}
.nli-panel .nli-empty{padding:14px;background:#293a43;border-radius:8px}
.nli-panel .nli-upgrade-target{display:inline-flex;align-items:center;gap:4px;margin:0;font-size:10px}.nli-panel .nli-upgrade-target input{width:62px;padding:5px;margin:0}.nli-panel .nli-source-refine{margin-top:6px;padding:6px;border:1px solid #75643f;border-radius:5px;color:#d6c7a7;font-size:10px}.nli-panel .nli-source-refine summary{cursor:pointer;color:#e7d294}.nli-panel .nli-source-refine ul{margin:3px 0 6px;padding-left:15px}.nli-panel .nli-source-refine li{margin:2px 0}.nli-panel .nli-source-refine small{color:#d8a971}
.nli-panel .nli-list,.nli-panel .nli-slots{min-width:0}
.nli-panel button:focus-visible,.nli-panel input:focus-visible{outline:2px solid #ffe0a1;outline-offset:2px}
@media(max-width:770px){.nli-panel{padding:11px}.nli-panel .nli-slots{grid-template-columns:repeat(3,minmax(0,1fr))}.nli-panel .nli-list{grid-template-columns:1fr}.nli-panel h2{font-size:19px}}
`;
  const statNames={atk:'Vật công',catk:'Pháp công',matk:'Mưu công',def:'Vật phòng',int:'Mưu công',
    hp:'Dẫn binh',tdef:'Chiến phòng',mdef:'Mưu phòng',
    crit:'Bạo kích',counter:'Phản kích',dodge:'Né tránh',weaponAtk:'Vũ khí',horseAtk:'Ngựa'};
  const escape=s=>String(s??'').replace(/[&<>"']/g,
    x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const money=(n)=>Number.isFinite(n)?Math.round(n).toLocaleString('vi-VN'):'0';
  const priceNames={silver:'bạc',gold:'vàng',grain:'lương',iron:'sắt',prestige:'uy danh'};
  const priceText=(cost,separator=' / ')=>{
    const parts=Object.entries(cost||{}).filter(([k])=>!['materials','sourceExact','sourceBaseExact','discount','discountClassification'].includes(k))
      .map(([k,n])=>money(n)+' '+(priceNames[k]||k));
    for(const material of cost?.materials||[])parts.push(money(material.quantity)+' '+material.name);
    return parts.join(separator);
  };
  const affordable=(state,cost)=>Boolean(cost)&&Object.entries(cost).filter(([k])=>!['materials','sourceExact','sourceBaseExact','discount','discountClassification'].includes(k)).every(([k,n])=>
    Number.isSafeInteger(n)&&n>=0&&Number.isSafeInteger(state[k])&&state[k]>=n)&&
    (cost.materials||[]).every(x=>Number.isSafeInteger(state.nlItemsV1?.stacks?.[x.id]||0)&&(state.nlItemsV1?.stacks?.[x.id]||0)>=x.quantity);
  function makeView(pack,api,state,heroId,{tab='all',search='',shop=false,page=0,reinforceTargets={}}={}){
    if(!state||!state.hero||!state.hero[heroId])throw new Error('HERO_NOT_FOUND');
    const model=pack.equipment.filter(x=>x.integration==='PLAYABLE');
    const map=Object.fromEntries(model.map(x=>[x.id,x]));
    const equipped=state.gear?.[heroId]||{};
    const worn=Object.fromEntries(Object.entries(equipped).filter(([,uid])=>uid!=null).map(([slot,uid])=>[String(uid),slot]));
    const owned=state.items.filter(x=>map[x.base]).map(x=>({...x,definition:map[x.base]}));
    const filter=item=>(tab==='all'||item.definition.slot===tab)&&
      (!search||item.definition.name.toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN')));
    const byStat=x=>Object.entries(x).filter(([k,v])=>v>0&&statNames[k])
      .map(([k,v])=>escape(statNames[k])+': +'+money(v)).join(' · ')||'Không có';
    const bonuses=api.bonuses(state,heroId);
    const setActivations=api.sets(state,heroId);
    const slotCards=SLOTS.slice(1).map(([slot,label])=>{
      const uid=equipped[slot]??(slot==='artifact'?equipped.banner:null);
      const item=owned.find(x=>String(x.uid)===String(uid));
      return '<div class="nli-slot" data-slot="'+slot+'"><span>'+escape(label)+'</span>'+
        '<strong>'+escape(item?.definition.name||'Chưa trang bị')+'</strong>'+
        (item?'<small>+'+(item.lv-1)+' · '+escape(item.definition.rarity)+'</small>':'')+'</div>';
    }).join('');
    const reinforcement=pack.rules?.reinforcement||null;
    const costRules=pack.rules?.refinement||null;
    const ownedFiltered=owned.filter(filter);
    const candidates=shop?model.filter(row=>['SHOP','SHOP_OR_AUTHORIZED_REWARD'].includes(row.acquisitionRule?.kind))
      .filter(row=>(tab==='all'||tab===row.slot)&&
        (!search||row.name.toLocaleLowerCase('vi-VN').includes(search.toLocaleLowerCase('vi-VN')))):ownedFiltered;
    const perPage=30,pages=Math.max(1,Math.ceil(candidates.length/perPage));
    const currentPage=Math.min(Math.max(0,Math.floor(Number(page)||0)),pages-1);
    const visible=candidates.slice(currentPage*perPage,(currentPage+1)*perPage);
    const bagCards=(shop?[]:visible).map(item=>{
      const row=item.definition,uid=String(item.uid),isWorn=Object.prototype.hasOwnProperty.call(worn,uid);
      const need=row.requiredLevel||1,allowed=state.hero[heroId].level>=need;
      const r=pack.rules?.reinforcement;
      const f=pack.rules?.refinement;
      const level=item.lv||1,rank=item.refineLv||0;
      const sourceEnhancement=row.mobileEnhancement||null,maxLevel=sourceEnhancement?.maxLevel||r?.maxLevel||1;
      const targetLevel=sourceEnhancement?Math.min(maxLevel,Math.max(level+1,Number(reinforceTargets[uid])||level+1)):level+1;
      const rc=level<maxLevel?api.reinforcementCost(level,state,sourceEnhancement?row.id:undefined,sourceEnhancement?targetLevel:undefined):null;
      const premium=f?.highTierPricing?.groups?.[row.sourceGroup]&&row.sourceId?
        f.highTierPricing.groups[row.sourceGroup]:null;
      const needMat=(f?.materialPerLevel||0)+(premium?.materialExtra||0);
      const fc=f&&rank<f.maxLevel?Math.round(f.silverBase*(rank+1)*(premium?.silverMultiplier||1)):null;
      const haveMat=state.nlItemsV1?.stacks?.[f?.materialId]||0;
      const canReinforce=targetLevel>level&&targetLevel<=maxLevel&&affordable(state,rc);
      const canRefine=!sourceEnhancement&&fc!=null&&state.silver>=fc&&haveMat>=needMat;
      const sourceStats=(row.sourceStats||[]).map(x=>escape(x.label)+': '+money(x.base||0)+(x.growth?(' +'+money(x.growth)+'/Lv'):'')).join(' · ');
      const sourceRefine=row.mobileRefinement?.sourcePools;
      const sourceRefineDetail=sourceRefine?'<details class="nli-source-refine"><summary>Bảng thuộc tính Tinh Luyện Wiki (dữ liệu nguồn)</summary>'+Object.entries(sourceRefine).filter(([,entries])=>Array.isArray(entries)).map(([pool,entries])=>
        '<div><b>'+escape(pool)+'</b><ul>'+entries.map(x=>'<li>'+escape(x.name)+' · '+Math.round(x.rate*100)+'% · giá trị '+escape(x.value)+'</li>').join('')+'</ul></div>').join('')+
        '<small>Giữ nguyên giá trị nguồn. Bảng tổng vượt 100% được dùng làm trọng số chuẩn hóa; chi phí và điều kiện mở mô phỏng.</small></details>':'';
      const promotion=typeof api.mobilePromoteQuote==='function'?api.mobilePromoteQuote(state,uid):null;
      const promoteButton=promotion?'<button data-nli-action="mobile-promote" data-uid="'+escape(uid)+'" '+((state.silver||0)<promotion.silver||Math.max(10,Number(state.nlContentC?.mobileCommanderLevel)||10)<promotion.commander?'disabled':'')+'>Nâng phẩm: '+escape(promotion.name)+' · '+money(promotion.silver)+' Bạc · Chỉ huy '+promotion.commander+'</button>':'';
      const mobileRefineButtons=sourceRefine&&typeof api.mobileRefineQuote==='function'?['so','cao','dacKy'].map((pool,i)=>{
        const q=api.mobileRefineQuote(state,uid,pool);if(!q)return '';
        const have=state.nlItemsV1?.stacks?.[q.materialId]||0,rolls=item.mobileRefines?.[pool]||[];
        return '<div class="nli-meta">'+['Sơ cấp','Cao cấp','Đặc kỹ'][i]+': '+(rolls.map(x=>escape(x.name)).join(' · ')||'Chưa phụ ma')+
        ' <button data-nli-action="mobile-refine" data-uid="'+escape(uid)+'" data-pool="'+pool+'" '+(level<q.gate||state.silver<q.silver||have<q.stone?'disabled':'')+'>Phụ ma · '+money(q.silver)+' Bạc / '+q.stone+' Đá · Lv'+q.gate+'</button></div>';
      }).join(''):'';
      return '<article class="nli-gear" data-uid="'+escape(uid)+'" data-nl-art-item="'+escape(row.id)+'" data-nl-art-kind="'+escape(row.slot)+'" data-nl-art-rarity="'+escape(row.rarity)+'">'+
        '<header><strong>'+escape(row.name)+'</strong><span>'+escape(row.rarity)+'</span></header>'+
        '<small>'+escape(SLOTS.find(s=>s[0]===row.slot)?.[1]||row.slot)+
        (sourceEnhancement?' · Cấp trang bị Wiki '+money(row.displayedLevel||0)+' · yêu cầu Chỉ huy Lv 1 (mô phỏng)':' · Cấp yêu cầu '+need)+
        ' · Cường hóa +'+(item.lv-1)+
        ' · Tinh luyện '+(item.refineLv||0)+'</small>'+
        '<p>'+(sourceEnhancement?'Chỉ số gốc Wiki · P2 ×0,001, làm tròn tối thiểu 1 điểm mỗi chỉ số dương: ':'')+byStat(row.stats)+'</p>'+
        (sourceEnhancement?'<div class="nli-meta">Wiki · cấp trang bị '+money(row.displayedLevel||0)+' · chỉ số nguồn: '+sourceStats+'</div>':'')+
        '<div class="nli-buttons">'+
        (isWorn?'<button data-nli-action="unequip" data-uid="'+escape(uid)+'" data-slot="'+escape(worn[uid])+'">Tháo</button>':
          '<button data-nli-action="equip" data-uid="'+escape(uid)+'" '+(!allowed?'disabled':'')+'>Trang bị</button>')+
        (row.mobileSale?'<button data-nli-action="sell" data-uid="'+escape(uid)+'" '+(isWorn?'disabled title="Tháo trang bị trước khi bán"':'')+'>Bán · '+money(row.mobileSale.amount)+' Bạc</button>':'')+
        (sourceEnhancement?'<label class="nli-upgrade-target">Đến Lv <input type="number" min="'+(level+1)+'" max="'+maxLevel+'" value="'+targetLevel+'" data-nli-reinforce-target="'+escape(uid)+'"></label>':'')+
        '<button data-nli-action="reinforce" data-uid="'+escape(uid)+'" data-target-level="'+(sourceEnhancement?targetLevel:'')+'" '+(!canReinforce?'disabled':'')+'>'+
        (rc?'Cường hóa'+(sourceEnhancement?' đến Lv '+targetLevel:'')+' · '+priceText(rc):'Cường hóa tối đa')+'</button>'+
        (sourceEnhancement?promoteButton+mobileRefineButtons:'<button data-nli-action="refine" data-uid="'+escape(uid)+'" '+(!canRefine?'disabled':'')+'>'+
        (fc!=null?'Tinh luyện · '+money(fc)+' bạc / '+needMat+' tinh khoáng':'Tinh luyện tối đa')+'</button>')+'</div>'+
        (sourceEnhancement?'<div class="nli-meta">Cường Hóa theo bảng Wiki Lv1–425. Giảm Bạc theo Cấp Chỉ huy mô phỏng: '+(rc?.discount?Math.round(rc.discount*100)+'%':'0%')+'; làm tròn từng cấp là giả định vì Wiki chỉ nêu mức giảm. Không áp dụng giảm giá công trình/khoa kỹ chưa có hệ số nguồn. Đá Tôi Luyện Wiki: '+(state.nlItemsV1?.stacks?.['mobile-vng-resource-res_62']||0)+'</div>':'')+
        (row.mobileSale?'<div class="nli-meta">Giá trị bán theo Wiki; quy đổi thành Bạc là mô phỏng vì nguồn không ghi loại tiền.</div>':'')+
        (sourceRefine?sourceRefineDetail:'<div class="nli-meta">Tinh khoáng: '+haveMat+' · '+(canRefine?'Đủ nguyên liệu':'Chưa đủ điều kiện tinh luyện')+'</div>')+'</article>';
    }).join('');
    const shopCards=(shop?visible:[]).map(row=>{
        const cost={...(row.acquisitionRule.shopCost||{}),materials:row.acquisitionRule.shopMaterials||[]};
        const fallback=row.acquisitionRule.classification==='SIMULATED_FALLBACK',min=row.acquisitionRule.minCommander||1;
        const locked=fallback&&Math.max(10,Number(state.nlContentC?.mobileCommanderLevel)||10)<min;
        return '<article class="nli-gear" data-nl-art-item="'+escape(row.id)+'" data-nl-art-kind="'+escape(row.slot)+'" data-nl-art-rarity="'+escape(row.rarity)+'"><header><strong>'+escape(row.name)+'</strong><span>'+
          escape(row.rarity)+'</span></header><small>'+escape(SLOTS.find(s=>s[0]===row.slot)?.[1]||row.slot)+
          (row.mobileEnhancement?' · Cấp Wiki '+money(row.displayedLevel||0)+(fallback?' · Thương nhân bổ sung (mô phỏng), Chỉ huy '+min:' · Giá nguồn Wiki'):' · Cấp '+row.requiredLevel)+'</small><p>'+byStat(row.stats)+'</p>'+
          '<div class="nli-buttons"><span>'+priceText(cost,' · ')+'</span>'+
          '<button data-nli-action="buy" data-item="'+escape(row.id)+'" '+
          (locked||!affordable(state,cost)?'disabled':'')+'>'+(locked?'Chưa mở':'Mua')+'</button></div></article>';
      }).join('');
    return '<style data-nli-style="1">'+STYLES+'</style>'+
      '<section class="nli-panel" data-nli-root="1" aria-label="Trang bị">'+
      '<header class="nli-heading"><h2>Trang bị · Kho chiến cụ</h2>'+
      '<div class="nli-balance">Bạc: '+money(state.silver)+
      ' · Vàng: '+money(state.gold||0)+
      (pack.rules?.classicA3?' · Lương: '+money(state.grain):' · Sắt: '+money(state.iron))+
      ' · Trang bị: '+owned.length+'</div></header>'+
      '<div class="nli-tabs" role="group" aria-label="Loại trang bị">'+
      SLOTS.map(([key,label])=>'<button data-nli-tab="'+key+'" '+(tab===key?'aria-pressed="true"':'')+'>'+escape(label)+'</button>').join('')+'</div>'+
      '<label>Tìm trang bị <input type="search" data-nli-search="1" value="'+escape(search)+'" placeholder="Nhập tên trang bị"/></label>'+
      '<div class="nli-switch"><button data-nli-shop="0" '+(!shop?'aria-pressed="true"':'')+'>Kho của tôi</button>'+
      '<button data-nli-shop="1" '+(shop?'aria-pressed="true"':'')+'>Tiệm trang bị</button></div>'+
      '<h3>Tướng '+escape(heroId)+' · Cấp '+Number(state.hero[heroId].level||1)+'</h3>'+
      '<div class="nli-slots">'+slotCards+'</div>'+
      '<p class="nli-total"><strong>Chỉ số trang bị:</strong> '+byStat(bonuses)+'</p>'+
      (setActivations.length?'<p class="nli-sets">Bộ kích hoạt: '+
        setActivations.map(x=>escape(pack.equipment.find(row=>row.effectRule?.setId===x.setId)?.sourceGroup||x.setId)+' ('+x.activatedAt+' món)').join(' · ')+'</p>':'')+
      '<div class="nli-tools"><span class="nli-meta" data-nli-result-count="'+candidates.length+'">'+
      (shop?'Tiệm trang bị: ':'Đang sở hữu: ')+candidates.length+' mục</span>'+
      '<span class="nli-meta">Trang '+(currentPage+1)+'/'+pages+'</span></div>'+
      '<div class="nli-list">'+((shop?shopCards:bagCards)||'<p class="nli-empty">Không có trang bị phù hợp.</p>')+'</div>'+
      '<div class="nli-pages"><button data-nli-page="'+(currentPage-1)+'" '+(!currentPage?'disabled':'')+'>Trước</button>'+
      '<span>Trang '+(currentPage+1)+'/'+pages+'</span>'+
      '<button data-nli-page="'+(currentPage+1)+'" '+(currentPage===pages-1?'disabled':'')+'>Sau</button></div></section>';
  }
  function mount(host,options){
    if(!host||typeof host.addEventListener!=='function')throw new Error('INVALID_HOST');
    if(!options||typeof options.getState!=='function'||
      typeof options.setState!=='function'||
      typeof options.receiptId!=='function')throw new Error('RECEIPT_STATE_HOST_REQUIRED');
    const {pack,inventory,heroId,getState,setState,receiptId}=options;
    const ui={tab:'all',search:'',shop:false,page:0};
    function render(){host.innerHTML=makeView(pack,inventory,getState(),heroId,ui)}
    function handle(e){
      const t=e.target.closest('[data-nli-action], [data-nli-tab], [data-nli-shop], [data-nli-page]');
      if(!t||!host.contains(t))return;
      if(t.hasAttribute('data-nli-tab')){ui.tab=t.getAttribute('data-nli-tab');ui.page=0;render();return}
      if(t.hasAttribute('data-nli-shop')){ui.shop=t.getAttribute('data-nli-shop')==='1';ui.page=0;render();return}
      if(t.hasAttribute('data-nli-page')){ui.page=Math.max(0,Number(t.getAttribute('data-nli-page'))||0);render();return}
      const action=t.getAttribute('data-nli-action');
      const uid=t.getAttribute('data-uid'),id=t.getAttribute('data-item');
      const slot=t.getAttribute('data-slot');
      // A durable unique ID is supplied by the authoritative Save/receipt owner.
      const rid=receiptId(action,{uid,id,slot,heroId});
      if(typeof rid!=='string'||!rid)throw new Error('RECEIPT_REQUIRED');
      const state=getState();
      const result=action==='buy'?inventory.buy(state,id,rid):
        action==='sell'?inventory.sell(state,uid,rid):
        action==='equip'?inventory.equip(state,heroId,uid,rid):
        action==='unequip'?inventory.unequip(state,heroId,slot,rid):
        action==='reinforce'?inventory.reinforce(state,uid,rid):
        action==='refine'?inventory.refine(state,uid,rid):
        {ok:false,code:'UNSUPPORTED_ACTION'};
      if(result.ok&&!result.duplicate){
        setState(result.state, {action,receiptId:rid,detail:result.detail});
        render();
      }else if(typeof options.onMessage==='function'){
        options.onMessage(result.code||'ALREADY_SETTLED',result);
      }
    }
    function search(e){
      if(!e.target.matches('[data-nli-search]'))return;
      const next=e.target.value;
      ui.search=next;ui.page=0;
      render();
      const field=host.querySelector('[data-nli-search]');
      if(field){field.focus();field.setSelectionRange(next.length,next.length)}
    }
    host.addEventListener('click',handle);
    host.addEventListener('input',search);
    render();
    return {render,dispose(){host.removeEventListener('click',handle);
      host.removeEventListener('input',search)}};
  }
  return {SLOTS,STYLES,makeView,mount};
});
