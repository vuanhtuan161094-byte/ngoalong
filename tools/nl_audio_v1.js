// === NL-AUDIO-V1: original browser-synthesized cues and optional ambient motif ===
(()=>{
'use strict';
const KEY='muu_dinh_tam_quoc_audio_v1';
const sourceAudio=__NL_SOURCE_AUDIO__, activeAudio=new Set();
let sourceMusic=null,sourceMusicId='',sourcePlays=0;
function sourcePlay(kind){
 if(!sourceAudio[kind]||settings.muted||settings.effects<=0)return false;
 try{const a=new Audio(sourceAudio[kind]);a.volume=settings.effects;activeAudio.add(a);const cleanup=()=>activeAudio.delete(a);a.addEventListener('ended',cleanup,{once:true});a.addEventListener('error',cleanup,{once:true});sourcePlays++;a.play().catch(cleanup);return true;}catch{return false;}
}
const number=(v,fallback)=>Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;
function read(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'null');if(raw&&typeof raw==='object')return {
  muted:raw.muted===true,music:raw.music===true,effects:number(raw.effects,.18),musicVolume:number(raw.musicVolume,.08)
 };}catch{}
 return {muted:false,music:false,effects:.18,musicVolume:.08};
}
let settings=read(),context=null,master=null,effectsBus=null,musicBus=null,musicTimer=0,musicIndex=0,lastEffectAt=0;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings));}catch{}}
function ensure(){
 if(context)return true;
 const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return false;
 try{context=new Ctor();master=context.createGain();effectsBus=context.createGain();musicBus=context.createGain();
  effectsBus.connect(master);musicBus.connect(master);master.connect(context.destination);sync();
 }catch{context=null;master=null;effectsBus=null;musicBus=null;return false;}
 try{const resumed=context.resume();resumed?.catch?.(()=>{});}catch{}
 return true;
}
function sync(){
 if(master)master.gain.value=settings.muted?0:1;
 if(effectsBus)effectsBus.gain.value=settings.effects;
 if(musicBus)musicBus.gain.value=settings.musicVolume;
 for(const a of activeAudio){a.volume=settings.muted?0:settings.effects;if(settings.muted)a.pause();}
 if(sourceMusic)sourceMusic.volume=settings.musicVolume;
 if(settings.music&&!settings.muted)startMusic();else stopMusic();
}
function tone(freq,at,duration,amp,bus,wave='sine',endFreq=0){
 if(!context||!bus||settings.muted)return;
 try{
  const osc=context.createOscillator(),env=context.createGain();osc.type=wave;
  osc.frequency.setValueAtTime(freq,at);if(endFreq>0)osc.frequency.exponentialRampToValueAtTime(endFreq,at+duration);
  env.gain.setValueAtTime(.0001,at);env.gain.exponentialRampToValueAtTime(Math.max(.0002,amp),at+.018);
  env.gain.exponentialRampToValueAtTime(.0001,at+duration);
  osc.connect(env);env.connect(bus);osc.start(at);osc.stop(at+duration+.025);
 }catch{}
}
const CUES={
 click:[{f:659,d:.055,a:.11,w:'sine'}],
 preview:[{f:392,d:.24,a:.22,w:'triangle'},{f:523,d:.3,a:.18,w:'sine',delay:.12},{f:784,d:.38,a:.12,w:'sine',delay:.25}],
 strike:[{f:196,d:.09,a:.17,w:'triangle',end:115},{f:392,d:.07,a:.06,w:'sine',delay:.025,end:290}],
 heal:[{f:523,d:.16,a:.12,w:'sine'},{f:659,d:.2,a:.1,w:'sine',delay:.09}],
 victory:[{f:392,d:.4,a:.18,w:'triangle'},{f:494,d:.45,a:.16,w:'sine',delay:.12},{f:587,d:.5,a:.16,w:'sine',delay:.24},{f:784,d:.7,a:.13,w:'sine',delay:.38}],
 defeat:[{f:392,d:.35,a:.16,w:'triangle',end:350},{f:330,d:.42,a:.15,w:'sine',delay:.16,end:294},{f:262,d:.55,a:.13,w:'sine',delay:.36,end:220}]
};
function play(kind='click'){
 if(settings.muted||settings.effects<=0||!ensure())return false;
 if(sourcePlay(kind))return true;
 try{const now=context.currentTime+.012,notes=CUES[kind]||CUES.click;
  for(const n of notes)tone(n.f,now+(n.delay||0),n.d,n.a,effectsBus,n.w,n.end||0);
  return true;
 }catch{return false;}
}
const SCALE=[293.66,349.23,392,440,523.25,587.33,698.46,783.99];
const MELODY=[0,2,3,5,4,2,1,3,5,6,4,2,0,1,3,4,2,5,3,1];
function musicStep(){
 musicTimer=0;if(!settings.music||settings.muted||!ensure())return;
 const now=context.currentTime+.035,index=musicIndex++%MELODY.length,note=SCALE[MELODY[index]];
 tone(note,now,1.05,.19,musicBus,'triangle');tone(note*2,now,.34,.055,musicBus,'sine');
 if(index%5===0)tone(SCALE[(MELODY[index]+3)%SCALE.length]/2,now,.9,.11,musicBus,'sine');
 musicTimer=window.setTimeout(musicStep,1250);
}
function startMusic(){
 if(!settings.music||settings.muted||!ensure())return;
 const id=battle&&!battle.finished?'battleMusic':'cityMusic';
 if(sourceAudio[id]){
  if(sourceMusicId!==id){sourceMusic?.pause();sourceMusic=new Audio(sourceAudio[id]);sourceMusic.loop=true;sourceMusicId=id;}
  sourceMusic.volume=settings.musicVolume;
  if(sourceMusic.paused)sourceMusic.play().catch(()=>{});
  return;
 }
 if(!musicTimer)musicStep();
}
function stopMusic(){if(musicTimer){clearTimeout(musicTimer);musicTimer=0;}sourceMusic?.pause();}
function update(changes){settings={...settings,...changes,effects:number(changes.effects,settings.effects),musicVolume:number(changes.musicVolume,settings.musicVolume)};persist();sync();return snapshot();}
function snapshot(){return {...settings};}
function panel(){
 const s=settings;
 return `<section class="panel mini-box nl-audio-panel" data-nl-audio-settings><h3>🎼 Âm thanh</h3><p class="tiny">${Object.keys(sourceAudio).length?'Âm thanh và nhạc nền MatrixHan tích hợp offline, cue chưa ánh xạ dùng âm thanh dự phòng.':'Cue và nhạc nền tổng hợp offline.'}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr));gap:12px;align-items:center"><label style="display:flex;align-items:center;gap:9px"><input type="checkbox" data-nlaudio-mute ${s.muted?'checked':''}> Tắt toàn bộ</label><label style="display:flex;align-items:center;gap:9px"><input type="checkbox" data-nlaudio-music ${s.music?'checked':''}> Nhạc nền</label><label>Hiệu ứng <div style="display:flex;align-items:center;gap:10px"><input style="flex:1;min-width:0" type="range" min="0" max="100" value="${Math.round(s.effects*100)}" data-nlaudio-effects aria-label="Âm lượng hiệu ứng"><output data-nlaudio-effects-value>${Math.round(s.effects*100)}%</output></div></label><label>Nhạc <div style="display:flex;align-items:center;gap:10px"><input style="flex:1;min-width:0" type="range" min="0" max="100" value="${Math.round(s.musicVolume*100)}" data-nlaudio-music-volume aria-label="Âm lượng nhạc"><output data-nlaudio-music-value>${Math.round(s.musicVolume*100)}%</output></div></label><button class="dark-button" data-nlaudio-action="preview">▶ Nghe thử</button></div><p class="tiny">Tùy chọn được lưu trên thiết bị riêng, không thay đổi Save v5.</p></section>`;
}
if(!NAV.some(item=>item[0]==='settings'))NAV.push(['settings','⚙️','Cài Đặt']);
const oldRender=render;
render=function(){
 if(tab!=='settings')return oldRender();
 resetDaily();tickSafe();renderResources();renderSidebar();
 $('view').innerHTML=head('Thiết lập trải nghiệm','Cài đặt','Điều chỉnh tiếng giao diện, trận đấu và nhạc nền.')+panel();
};
document.addEventListener('change',ev=>{
 const t=ev.target;if(t.matches?.('[data-nlaudio-mute]'))update({muted:t.checked});
 else if(t.matches?.('[data-nlaudio-music]'))update({music:t.checked});
});
document.addEventListener('input',ev=>{
 const t=ev.target;
 if(t.matches?.('[data-nlaudio-effects]')){const value=Number(t.value)/100;update({effects:value});const out=document.querySelector('[data-nlaudio-effects-value]');if(out)out.textContent=Math.round(value*100)+'%';}
 else if(t.matches?.('[data-nlaudio-music-volume]')){const value=Number(t.value)/100;update({musicVolume:value});const out=document.querySelector('[data-nlaudio-music-value]');if(out)out.textContent=Math.round(value*100)+'%';}
});
document.addEventListener('click',ev=>{
 const audioAction=ev.target.closest?.('[data-nlaudio-action]');
 if(audioAction){if(audioAction.dataset.nlaudioAction==='preview')play('preview');return;}
 if(ev.target.closest?.('button,[data-tab],[data-focus-building],[data-stage],[data-battle],[data-recruit],[data-formation]'))play('click');
});
const oldPerform=p2Perform;
p2Perform=function(actor){
 const current=battle,count=current?.events?.length||0;oldPerform(actor);if(settings.music&&!settings.muted)startMusic();
 if(!current||current!==battle||current.replay)return;
 const event=current.events?.[count];if(event)play((event.hits||[]).some(hit=>hit.heal)?'heal':'strike');
};
const oldFinish=finishBattle;
finishBattle=function(){
 const active=!!battle&&!battle.finished&&!battle.replay;oldFinish();
 if(active&&battle?.finished){play(battle.won?'victory':'defeat');if(settings.music&&!settings.muted)startMusic();}
};
if(window.__P2_ENABLE_QA__){
 if(window.__P2_QA__){window.__P2_QA__.perform=p2Perform;window.__P2_QA__.finishBattle=finishBattle;}
 window.__NL_AUDIO_QA__=Object.freeze({settings:snapshot,update,play,available:()=>!!(window.AudioContext||window.webkitAudioContext),contextState:()=>context?.state||'not-created',sourceCount:()=>Object.keys(sourceAudio).length,sourcePlays:()=>sourcePlays});
}
})();
// === end NL-AUDIO-V1 ===
