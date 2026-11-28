// === NL-CITY-ART-V1: original offline capital courtyard background ===
(()=>{
'use strict';
const env=__NL_WLY2_ENV_DATA__;
window.__NL_PREMIUM_ICONS__=Object.freeze(env.mobileIcons||{});
const sourceCity=Boolean(env.castle);
const image=env.castle||__NL_CITY_ART_DATA_URL__;
if(typeof image!=='string'||!image.startsWith('data:image/webp;base64,'))
 throw Error('NL_CITY_ART_V1: embedded city scene is missing');
const style=document.createElement('style');
style.dataset.nlCityArt='v1';
style.textContent=`
.city-visual{
 background-image:linear-gradient(180deg,rgba(9,18,22,.10),rgba(8,17,19,.28)),url("${image}")!important;
 background-size:cover;background-position:center;
}
.city-visual:before{
 transform:none;opacity:.26;
 background:linear-gradient(180deg,rgba(13,23,27,.08),transparent 44%,rgba(10,19,21,.24));
}
.city-visual:after{
 background:linear-gradient(90deg,rgba(9,20,22,.34),transparent 20% 80%,rgba(9,20,22,.25)),
            linear-gradient(0deg,rgba(8,16,18,.48),transparent 30%);
}
.city-mountain,.city-path{display:none}
.city-visual .building{
 background:linear-gradient(160deg,rgba(48,57,47,.94),rgba(16,31,29,.94));
 backdrop-filter:blur(2px);border-color:#d2ae68;
 box-shadow:0 8px 0 rgba(7,17,17,.72),0 12px 18px rgba(3,9,10,.55);
}
.city-visual .building:focus-visible{outline:2px solid #f5d99a;outline-offset:2px}
.city-visual .building:hover{border-color:#f5d99a;filter:brightness(1.08)}
@media (prefers-reduced-motion: reduce){.city-visual .building{transition:none!important}}
.city-visual .building.palace{
 background:linear-gradient(160deg,rgba(91,69,39,.96),rgba(31,42,35,.96));
}
`;
if(sourceCity){
 const placements={palace:[50,18],farm:[12,68],market:[27,39],mine:[88,68],barracks:[50,75],academy:[74,39],tavern:[73,76],lumberyard:[12,40],warehouse:[28,76],wall:[88,40],walls:[88,40]};
 let extra=`
  #view .city-visual{container-type:size;background-size:cover!important;background-repeat:no-repeat;background-color:#17282d!important;background-position:center!important;isolation:isolate}
 #view .city-visual:before,#view .city-visual:after{display:none!important}
 #view .city-visual .building{
  position:absolute!important;transform:translate(-50%,-50%)!important;
  width:clamp(42px,calc(min(100cqw,150.6cqh)*.16),130px)!important;
  min-width:0!important;padding:0!important;display:flex!important;flex-direction:column;align-items:center;
  background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;
  height:auto!important;gap:0!important;z-index:3;
 }
 #view .city-visual .building .symbol{
  display:block!important;width:100%!important;height:clamp(30px,calc(min(100cqw,150.6cqh)*.105),88px)!important;
  background-size:contain;background-repeat:no-repeat;background-position:center bottom;
  margin:0!important;color:transparent!important;line-height:0!important;
 }
 #view .city-visual .building .symbol>*{display:none!important}
 #view .city-visual .building b,#view .city-visual .building small{
  background:#172a25db!important;color:#f5e4b3!important;text-shadow:0 1px 2px #000;
  padding:1px 4px;border-radius:3px;white-space:nowrap;line-height:1.15!important;
 }
 #view .city-visual .building:hover,#view .city-visual .building:focus-visible{z-index:5;filter:brightness(1.17)}
 #view .world-scene{background-image:url("${env.world}")!important;background-size:cover!important;background-position:center!important}
 `;
 for(const [id,[x,y]] of Object.entries(placements)){
  const selector='#app #view .city-visual .building[data-focus-building="'+id+'"]';
  const art=env.buildings[id];
  extra+=`${selector}{left:${x}%!important;top:${y}%!important;right:auto!important;bottom:auto!important}`;
  if(art)extra+=`${selector} .symbol{background-image:url("${art}")!important}`;
  else extra+=`${selector} .symbol{color:#f6e2b0!important;line-height:1!important;display:grid!important;place-items:center;font-size:clamp(19px,3vw,30px)!important;height:clamp(26px,4vw,42px)!important}`;
 }
 extra+=`#app #view .city-visual .building[data-focus-building="palace"]{z-index:6}
 #app #view .city-visual .building .symbol,#app #view .city-visual .building b,#app #view .city-visual .building small{pointer-events:none}
 #app #view .city-visual .building{width:clamp(34px,12cqw,118px)!important}
 @media(max-width:600px){#app #view .city-visual .building{width:clamp(30px,12cqw,65px)!important}
 #app #view .city-visual .building .symbol{height:clamp(24px,10cqw,49px)!important}
 #app #view .city-visual .building b,#app #view .city-visual .building small{max-width:100%;overflow:hidden;text-overflow:ellipsis}}`;
 style.textContent+=extra;
 if(env.ui){
  const ui=env.ui;
  style.textContent+=`
   #app #view .gold-button{background-image:url("${ui.buttonGold}")!important;background-size:100% 100%!important;color:#17271f!important;border-color:#cba960!important}
   #app #view .dark-button,#app .nl-screen-ctrl button:not(:disabled){background-image:url("${ui.buttonGreen}")!important;background-size:100% 100%!important;color:#f4e9c9!important}
   #app>.shell>.sidebar .nav.active{background-image:url("${ui.navActive}")!important;background-size:100% 100%!important;border-color:#78aaa7!important}
   #app #view .panel{background-image:linear-gradient(#0c232a50,#091e2480),url("${ui.panel}")!important;background-size:100% 100%!important}
   #app>.shell>.sidebar .nav:not(.active){background-image:url("${ui.navIdle}")!important;background-size:100% 100%!important}
   #app>.topbar .res{background-image:url("${ui.panelSoft}")!important;background-size:100% 100%!important}
   #app #nl-screen-toolbar{background-image:url("${ui.header}")!important;background-size:100% 100%!important}
   #app #view .slot.occupied,#app #view .nl-slot.occupied,#app #view .portrait,#app #view .slot-item{border-image:url("${ui.frame}") 10 stretch}
   #app #view .slot.chosen,#app #view .stage.chosen,#app #view .nl-slot.selected{outline:2px solid #e8c974;box-shadow:0 0 10px #d5ae5b66!important}
   #app #view .hero-card,#app #view .feature-card,#app #view .quest,#app #view .nli-gear,#app #view .nli-items-card,#app #view .nlcity-tile{background-image:linear-gradient(#102831b0,#102831b0),url("${ui.panelSoft}")!important;background-size:100% 100%!important}
   #app #view .panel h3,#app #view .section-break{border-bottom:1px solid #7b967e;padding-bottom:5px}
   #app #view .campaign-scene{background-image:linear-gradient(#10252355,#0b171c99),url("${env.world}")!important;background-size:cover!important;background-position:center}
   #app #view .nl-city-map-root{grid-template-columns:minmax(0,1fr)!important}
   #app #view .nl-city-map-root:has(.city-visual:not(.nl-pane-hidden)) .city-visual{width:100%!important}
   #app #view .city-visual .building b,#app #view .city-visual .building small{font-size:clamp(9px,1.15vw,13px)!important}
   #app #view .city-visual .building{width:clamp(34px,12cqw,118px)!important}
   #app #view .city-visual .building .symbol{height:clamp(25px,calc(min(100cqw,150.6cqh)*.10),80px)!important}
   #app>.topbar .res span:before{content:"";display:inline-block;width:16px;height:16px;vertical-align:middle;margin-right:4px;background-repeat:no-repeat;background-size:contain;background-position:center}
   ${['resourceSilver','resourceGrain','resourcePrestige','resourceMerit','resourceOrder','resourceGold','resourceScore','resourceToken'].map((key,i)=>`#app>.topbar .res:nth-child(${i+1}) span:before{background-image:url("${ui[key]}")}`).join('')}
   
   @media(min-width:1000px){
    #app #view>.grid-2:has(.city-visual){grid-template-columns:minmax(0,1fr)!important;align-items:start}
    #app #view .city-visual{height:clamp(360px,calc(100dvh - 187px),570px)!important;background-size:cover!important}
   }
   @media(max-width:600px){#app #view .city-visual{height:320px!important}}
  `;
 }
}
document.head.appendChild(style);
const previousCity=renderCity;
renderCity=function(){return previousCity().replace('THÀNH TRÌ · MỸ THUẬT P4','THÀNH TRÌ · CẢNH THÀNH V1');};
if(window.__P2_ENABLE_QA__)window.__NL_CITY_ART_QA__=Object.freeze({
 source:sourceCity?'MatrixHan/WLY2':'image_gen.imagegen',version:1,width:sourceCity?2000:1400,height:sourceCity?1328:788,
 sourceBuildings:()=>Object.keys(env.buildings||{}),
 sourceUI:()=>Object.keys(env.ui||{}),
 sourceUILibrary:()=>Object.keys(env.uiLibrary||{}).length,
 cssReady:()=>document.querySelectorAll('style[data-nl-city-art="v1"]').length===1,
 background:()=>getComputedStyle(document.querySelector('.city-visual')).backgroundImage
});
})();
// === end NL-CITY-ART-V1 ===
