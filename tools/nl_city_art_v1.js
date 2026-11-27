// === NL-CITY-ART-V1: original offline capital courtyard background ===
(()=>{
'use strict';
const env=__NL_WLY2_ENV_DATA__;
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
 const placements={palace:[56,25],farm:[19,54],market:[40,36],mine:[83,45],barracks:[52,69],academy:[78,29],tavern:[72,56]};
 let extra=`
 #view .city-visual{container-type:size;background-size:contain!important;background-repeat:no-repeat;background-color:#17282d!important;background-position:center!important;isolation:isolate}
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
  extra+=`#view .city-visual .building[data-focus-building="${id}"]{left:calc(50% + min(100cqw,150.6cqh)*${(x-50)/100})!important;top:calc(50% + min(100cqh,66.4cqw)*${(y-50)/100})!important;right:auto!important;bottom:auto!important}#view .city-visual .building[data-focus-building="${id}"] .symbol{background-image:url("${env.buildings[id]}")!important}`;
 }
 style.textContent+=extra;
 if(env.ui){
  const ui=env.ui;
  style.textContent+=`
   #app #view .gold-button{background-image:url("${ui.buttonGold}")!important;background-size:100% 100%!important;color:#17271f!important;border-color:#cba960!important}
   #app #view .dark-button,#app .nl-screen-ctrl button:not(:disabled){background-image:url("${ui.buttonGreen}")!important;background-size:100% 100%!important;color:#f4e9c9!important}
   #app>.shell>.sidebar .nav.active{background-image:url("${ui.navActive}")!important;background-size:100% 100%!important;border-color:#78aaa7!important}
   #app #view .panel{background-image:url("${ui.panel}")!important;background-size:100% 100%!important}
   @media(min-width:1000px){
    #app #view>.grid-2:has(.city-visual){grid-template-columns:minmax(0,1.75fr) minmax(260px,1fr)!important;align-items:start}
    #app #view .city-visual{height:clamp(390px,63vh,520px)!important}
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
 cssReady:()=>document.querySelectorAll('style[data-nl-city-art="v1"]').length===1,
 background:()=>getComputedStyle(document.querySelector('.city-visual')).backgroundImage
});
})();
// === end NL-CITY-ART-V1 ===
