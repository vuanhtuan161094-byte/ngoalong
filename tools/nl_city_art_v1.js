// === NL-CITY-ART-V1: original offline capital courtyard background ===
(()=>{
'use strict';
const image=__NL_CITY_ART_DATA_URL__;
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
.city-visual .building.palace{
 background:linear-gradient(160deg,rgba(91,69,39,.96),rgba(31,42,35,.96));
}
`;
document.head.appendChild(style);
const previousCity=renderCity;
renderCity=function(){return previousCity().replace('THÀNH TRÌ · MỸ THUẬT P4','THÀNH TRÌ · CẢNH THÀNH V1');};
if(window.__P2_ENABLE_QA__)window.__NL_CITY_ART_QA__=Object.freeze({
 source:'image_gen.imagegen',version:1,width:1400,height:788,
 cssReady:()=>document.querySelectorAll('style[data-nl-city-art="v1"]').length===1,
 background:()=>getComputedStyle(document.querySelector('.city-visual')).backgroundImage
});
})();
// === end NL-CITY-ART-V1 ===
