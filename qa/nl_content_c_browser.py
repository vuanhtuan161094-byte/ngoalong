#!/usr/bin/env python3
"""Content C live Chromium smoke; actual P2 launch, one action, and native settlement."""
import os
import shutil
from playwright.sync_api import sync_playwright
from nl_native_pve_a1_browser import open_page, errors

def main():
    with sync_playwright() as p:
        executable=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH") or shutil.which("chromium")
        browser=p.chromium.launch(headless=True,executable_path=executable,
                                  args=["--no-sandbox","--disable-dev-shm-usage"])
        page=open_page(browser)
        out=page.evaluate("""()=>{
          const q=window.__P2_QA__,c=window.__NL_CONTENT_C_QA__,itemQa=window.__NL_ITEM_QA__,itemCounts=itemQa?.getItemCounts(),itemFallbackProbe=itemQa?.genericFallbackProbe();
          if(!q||!c)return {loaded:false};
          const heroBase=q.getGame(),extraIds=['3488','3531','3972','3973','3974','3975'].map(id=>'mobile-vng-hero-'+id),heroFixture=structuredClone(heroBase);
          heroFixture.cleared=Array.from({length:28},(_,i)=>i+1);heroFixture.silver=1000000;q.setGame(heroFixture);
          const extraBought=extraIds.map(id=>c.recruit(id)),extraRows=extraIds.map(id=>({id,record:c.mobileHeroRecord(id),quality:c.mobileHeroQuality(id)}));
          let extraUnits=true;
          for(const id of extraIds){const roster=q.getGame();roster.slots=[id,...roster.slots.slice(1)];q.setGame(roster);
            const unit=c.p2Unit(id,'p',0,1),row=extraRows.find(x=>x.id===id),sourceSkill=c.mobileHeroSkill(id)?.tag||row.record?.skill?.name;
            if(!unit||unit.nlMobileHero?.sourceId!==row.record?.id||!sourceSkill||unit.skill!==sourceSkill)extraUnits=false;
          }
          const extraSave=structuredClone(q.getGame());q.setGame(extraSave);
          const extraSaveOk=extraIds.every(id=>q.getGame().roster.includes(id)&&c.mobileHeroRecord(id)?.id===id.split('-').at(-1))&&q.getGame().version===5;
          q.setGame(heroBase);
          [...document.querySelectorAll('.nav')].find(x=>x.textContent.includes('Trang Bị'))?.click();
          document.querySelector('[data-nli-item-mode="wiki"]')?.click();
          const wikiResults=Number(document.querySelector('[data-nli-items-results]')?.getAttribute('data-nli-items-results'));
          const wikiPageCards=document.querySelectorAll('[data-nl-consumables-bridge] [data-nl-art-item]').length;
          document.querySelector('[data-nli-item-mode="bag"]')?.click();
          const g=q.getGame(),id=g.roster[0];
          g.lastTick=Date.now()+86400000;g.cleared=Array.from({length:28},(_,i)=>i+1);g.silver=1000000;g.grain=1000000;
          g.slots=[id,null,null,null,null,null,null,null,null];
          g.hero[id].troops=3000;g.hero[id].level=60;
          g.nlClassicA.orders=60;g.towerFloor=20;g.activity.towerTries=3;
          q.setGame(g);
          const plans=Array.from({length:80},(_,i)=>c.towerPlan(i+21));
          const styles=new Set(plans.map(p=>p?.aiStyle)),arcs=new Set(plans.map(p=>p?.arcId));
          const counts=plans.map(p=>p?.units.length),keys=plans.map(p=>p?.id);
          const skillAudit=c.skillAudit();
          const sourceStatusSamples={};
          for(let mapId=1;mapId<=400;mapId++){
            const map=c.map('wiki-map-'+mapId);if(!map)continue;
            for(let npcIndex=0;npcIndex<(map.npcs||[]).length;npcIndex++){
              const npc=map.npcs[npcIndex];
              for(const unit of npc.units||[]){
                for(const id of ['33','50','58','74','184','54','55','51','108','29','65','68','123','152']){
                  const effect=(unit.effects||[]).find(row=>String(row.id)===id);if(!effect||!unit.skill?.desc)continue;
                  const descriptor=c.describeSkill(unit.skill,unit.role||'infantry',npc.boss,unit.effects);
                  const app=descriptor?.sourceApplications?.find(row=>row.sourceId===id);
                  if(app){const sample={mapId,npcId:npc.id,npcIndex,slot:unit.slot,skill:unit.skill,effect,app};sourceStatusSamples[id]||=sample;sourceStatusSamples[id+'-'+app.scope]||=sample;if(id==='108'&&Number.isFinite(app.sourceMagnitude))sourceStatusSamples['108-exact']||=sample;}
                }
                if(sourceStatusSamples['58']?.app?.scope==='lowest-ally')continue;
                if(String(unit.effects?.find(row=>String(row.id)==='58')?.id)==='58'&&unit.skill?.desc){
                  const descriptor=c.describeSkill(unit.skill,unit.role||'infantry',npc.boss,unit.effects);
                  const app=descriptor?.sourceApplications?.find(row=>row.sourceId==='58');
                  if(app?.scope==='lowest-ally')sourceStatusSamples['58-lowest']={mapId,npcId:npc.id,skill:unit.skill,effect:unit.effects.find(row=>String(row.id)==='58'),app};
                }
              }
            }
          }
          const planCoverage=plans.every((p,i)=>p&&p.floor===i+21&&p.units.every(u=>u.slot>=0&&u.slot<9&&u.role&&u.skill));
          const planCounts=counts.every((v,i)=>v===(i<10?3:i<30?4:5));
          const reward21=c.towerRewards(21),reward30=c.towerRewards(30),reward29=c.towerRewards(29);
          const checks={loaded:true,coverage:c.counts.maps===249&&c.counts.npcs===5063&&c.counts.legacyNpcCount===4903&&c.counts.runtimeHeroes===374&&c.counts.mobileHeroDetails===373&&c.counts.mobileExtraRosterHeroes===6&&c.counts.mobileBuffs===320&&c.mobileBuffCount()===320&&c.tiers()===40,
            mobileExtraHeroRecruitment:extraBought.every(Boolean)&&extraRows.every(x=>x.record&&x.record.leadership>0&&x.quality?.growth)&&extraSaveOk,
            mobileExtraHeroP2Runtime:extraUnits,
            mobileItemSourceCatalogue:itemCounts?.mobileSourceCatalogueIds===746&&wikiResults===746,
            mobileItemRuntimeCount:itemCounts?.mobilePlayable===itemCounts?.sourceSpecificActive+itemCounts?.sourceGenericFallbacks&&itemCounts?.mobilePlayable===746&&itemCounts?.sourceSpecificActive===itemCounts?.sourceRouteMaterials+itemCounts?.sourceEliteMaterials+itemCounts?.sourceBundles+itemCounts?.sourceExchangeMaterials+itemCounts?.sourceGifts+itemCounts?.sourceResetItems+itemCounts?.sourceCraftNewMaterials+itemCounts?.sourceSeriesNewMaterials&&itemCounts?.sourceRouteMaterials===34&&itemCounts?.sourceEliteMaterials===6&&itemCounts?.sourceGenericFallbacks===585&&itemCounts?.mobileSourceReferenceOnly===0,
            mobileItemGenericFallback:itemFallbackProbe?.ok&&itemFallbackProbe?.duplicateOpen&&itemFallbackProbe?.processed,
            mobileItemCatalogueUI:wikiResults===746&&wikiPageCards===25,
            towerPlanCoverage:planCoverage&&new Set(keys).size===80&&arcs.size===8&&styles.size===4&&planCounts,
            towerBossRewards:plans.filter(p=>p.chapterBoss).length===8&&reward30.silver-reward29.silver>420&&reward30.soul>reward21.soul,
            mobileNpcSkillAudit:skillAudit.totalUnits===25195&&skillAudit.sourceExactUnits===23944&&
              skillAudit.sourceExactWithNameAndDescription===23944&&skillAudit.sourceExactSkillNames===694&&
              skillAudit.sourceExactDamageAdapted>5000&&skillAudit.sourceExactHealAdapted>1000&&
              skillAudit.sourceExactMoraleAdapted>0&&skillAudit.sourceEffectUnits===18250&&
              skillAudit.sourceEffectRows===36480&&skillAudit.sourceEffectIds===134&&skillAudit.sourceEffectNames===134&&
              skillAudit.sourceStatusAdapted>3000&&skillAudit.sourceStatusAdaptedUnits>3000&&skillAudit.legacySourceStatusIds===24&&skillAudit.sourceStatusIds>=24&&
              skillAudit.simulatedFallback>0&&skillAudit.sourceEdition==='CURRENT_VNG_MOBILE_WIKI_VIETNAMESE'};
          checks.mobileNpcSkillAuditStats=skillAudit;
          checks.mobileItemSourceCatalogueStats=itemCounts;
          checks.mobileItemGenericFallbackStats=itemFallbackProbe;
          const mobileRoles={infantry:'1',spear:'10',cavalry:'11',archer:'12',strategist:'13'};
          const troopRuntimeCoverage=c.mobileTroopRuntimeCoverage();
          checks.mobileTroopRuntimeCoverage=troopRuntimeCoverage.sourceProfiles===408&&troopRuntimeCoverage.playerSelectableProfiles===225&&
            troopRuntimeCoverage.campaignFormationUnits===23944&&troopRuntimeCoverage.campaignResolvedSourceIds===346&&
            troopRuntimeCoverage.campaignUnknownSourceIds===0&&troopRuntimeCoverage.campaignMaps===249&&
            troopRuntimeCoverage.campaignNpcs===5063&&troopRuntimeCoverage.sourceTraitsBound===21&&
            troopRuntimeCoverage.sourceCatalogueOnlyProfiles===0&&troopRuntimeCoverage.sourceTrialProfiles===43;
          checks.mobileTroopRuntimeCounts=troopRuntimeCoverage;
          const troopProfileAudit=c.mobileTroopRuntimeProfileAudit();
          checks.mobileTroopProfileRuntimeAll=troopProfileAudit.profiles===408&&troopProfileAudit.applied===408&&
            troopProfileAudit.attackDefenseExact&&troopProfileAudit.criticalExact&&troopProfileAudit.counterChanceExact;
          checks.mobileTroopProfileRuntimeAudit=troopProfileAudit;
          const mobileProbe={troop:'archer',type:'archer',atk:100,catk:100,matk:100,def:100,tdef:100,mdef:100,crit:.2};
          c.applyMobileTroopProfile(mobileProbe,'p');
          checks.mobileTroopSource= c.mobileTroopCount()===408&&Object.entries(mobileRoles).every(([role,id])=>c.mobileTroopSourceId(role)===id&&c.mobileTroopProfile(role)?.id===id);
          checks.mobileTroopCoefficients=mobileProbe.atk===85&&mobileProbe.catk===125&&mobileProbe.matk===85&&mobileProbe.def===15&&mobileProbe.tdef===10&&mobileProbe.mdef===20&&Math.abs(mobileProbe.crit-.11)<1e-9&&mobileProbe.nlMobileTroop?.id==='12';
          const mobileBefore=q.getGame(),mobileCandidate=mobileBefore.roster.find(heroId=>c.p2Unit(heroId,'p',0,1)?.type==='infantry');
          if(mobileCandidate){
            const mobileGame=JSON.parse(JSON.stringify(mobileBefore));mobileGame.troopModes[mobileCandidate]='spear';
            if(mobileGame.nlClassicWebB4?.assigned)delete mobileGame.nlClassicWebB4.assigned[mobileCandidate];
            q.setGame(mobileGame);const liveMobile=c.p2Unit(mobileCandidate,'p',0,1);
            checks.mobileTroopLiveP2=liveMobile?.nlMobileTroop?.id==='10'&&liveMobile.atk>0&&liveMobile.def>0;
          }else checks.mobileTroopLiveP2=false;
          q.setGame(mobileBefore);
          const troopBefore=q.getGame(),troopFixture=q.getGame();
          troopFixture.buildings.barracks=4;troopFixture.silver=1000000;troopFixture.nlClassicA.merit=10000;
          troopFixture.nlContentC.mobileCommanderLevel=440;q.setGame(troopFixture);
          const selectBefore=q.getGame(),mobileOwner=selectBefore.roster.find(h=>c.mobileHeroTroopAllowed(h,1))||id;
          checks.mobileSelectableCoverage=c.mobileTroopPlayable().length===225&&!c.mobileTroopPlayable().includes('112');
          checks.mobileChoose=c.mobileTroopChoose(mobileOwner,'2')&&c.mobileTroopAssigned(mobileOwner)?.id==='2'&&q.getGame().silver===selectBefore.silver-1000&&!c.mobileTroopChoose(mobileOwner,'2');
          checks.mobileSelectionP2=c.p2Unit(mobileOwner,'p',0,1)?.nlMobileTroop?.id==='2'&&c.p2Unit(mobileOwner,'p',0,1)?.troop==='infantry';
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.mobileTroopSave=c.mobileTroopAssigned(mobileOwner)?.id==='2'&&q.getGame().version===5;
          checks.mobileExcludeNpcShip=!c.mobileTroopChoose(id,'112')&&!c.mobileTroopChoose(id,'103');
          checks.mobileTraitCatalog=c.mobileTraitSupported().length===21;
          const multiDesc=c.describeSkill({name:'Kiểm tra liên kích',desc:'[C.Pháp] Địch trên hàng dọc chịu 2 lần 12800% Pháp Công.'},'spear',false,[]);
          checks.mobileMultiHitDescriptor=multiDesc.sourceHitCount===2&&multiDesc.mult===128&&multiDesc.pattern==='column';
          const passive=c.mobilePassivePlan({name:'Lưu Thủy Vô Tình',desc:'5 lượt đầu trận, mỗi lượt khiến địch giảm 52 sĩ khí và giải trừ 2 trạng thái có lợi của mục tiêu.'});
          checks.mobileSealPassive=passive?.limit===5&&passive.enemyMorale===52&&passive.dispel===2;
          const wa=c.mobilePassivePlan({name:'Gian Tuyệt Lv2',desc:'Mỗi lượt tăng cho các tướng khác phe ta 15 sĩ khí, bản thân tăng 5 sĩ khí, giải trừ 3 hiệu quả có lợi của địch trên đường thẳng.'});
          checks.mobileWeaponPassive=wa?.allyMorale===15&&wa.selfMorale===5&&wa.dispel===3&&wa.line;
          const fakeAttacker={hp:100},fakeTarget={hp:40,team:'e',slot:0};
          const repeat=c.mobileRepeatHit((a,t)=>{const hit=Math.min(30,t.hp);t.hp-=hit;return {amount:hit,team:t.team,slot:t.slot};},fakeAttacker,fakeTarget,'physical',1,{},5);
          checks.mobileMultiHitStop=repeat.amount===40&&repeat.mobileSourceHitCount===2&&fakeTarget.hp===0;

          checks.mobileTraitRank=c.mobileTraitChoose(mobileOwner,'2')&&c.mobileTraitChoose(mobileOwner,'2')&&!c.mobileTraitChoose(mobileOwner,'2')&&c.mobileTraitChoice(mobileOwner).rank===2;
          const techState=q.getGame();techState.nlContentC.mobileCommanderLevel=440;techState.nlContentC.mobileTechPoints=100000;techState.nlContentC.mobileTechTripods=10000;q.setGame(techState);
          const technologyQuote=c.mobileTechQuote('10',20),techBefore=c.state();
          checks.mobileTechnology=c.mobileTechCount()===14&&technologyQuote?.point>0&&c.mobileTechUpgrade('10',20)&&c.mobileTechLevel('10')===20&&c.mobileTechValue('10')===15&&c.state().mobileTechPoints===techBefore.mobileTechPoints-technologyQuote.point&&!c.mobileTechUpgrade('10',21);
          checks.mobileHeroSource=Object.values(selectBefore.roster).some(h=>c.mobileHeroRecord(h)?.name&&c.mobileHeroQuality(h)?.growth);
          const v3=q.getGame();v3.silver=100000000;v3.nlClassicA.merit=100000;v3.nlContentC.mobileCommanderLevel=440;
          v3.nlCity.levels.nl_city_manor=1;q.setGame(v3);
          const sourceOwner=v3.roster.find(h=>c.mobileHeroNext(h)?.valid);
          if(sourceOwner){
            const quote=c.mobileHeroNext(sourceOwner),before=c.mobileHeroQuality(sourceOwner).growth.q;
            checks.mobileAwakeningSource=Object.entries(quote.material).every(([name,n])=>c.mobileHeroBuyMaterial(sourceOwner,name,n))&&c.mobileHeroAwaken(sourceOwner)&&c.mobileHeroQuality(sourceOwner).growth.q===quote.to&&quote.from===before;
          }else checks.mobileAwakeningSource=false;
          checks.mobileBeautySource=c.mobileBeautyCount()===47&&c.mobileBeautyGift('55','fam_9',1)&&c.mobileBeautyUpgrade('55')&&c.mobileBeautyAssign(mobileOwner,'55')&&c.mobileBeautyBonus(mobileOwner)?.raw===3;
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.mobileBeautySave=c.mobileBeautyLevel('55')===1&&c.mobileBeautyBonus(mobileOwner)?.raw===3;
          const trainBefore=q.getGame(),trainFixture=q.getGame();
          trainFixture.nlContentC.mobileCommanderLevel=440;
          trainFixture.nlContentC.bookFragments=100000;trainFixture.nlContentC.bookExp=10000000;trainFixture.nlContentC.horsePoints=1000000000;
          trainFixture.silver=1000000000;q.setGame(trainFixture);
          const trainingOwner=trainFixture.roster[0],bookBefore=c.state();
          checks.mobileTrainingCoverage=c.trainingCounts().join(',')==='11,19,129';
          checks.mobileBookStep=c.bookStepQuote('1').exp===4800&&c.bookStep('1')&&c.bookLevel('1')===1&&c.bookQuote('1').exp===103200;
          checks.mobileHorseStep=c.horseStep('1')&&c.horseStar('1')===1&&c.horseTier('1')===0&&c.horseQuote('1').points===69664;
          const dailyFixture=q.getGame(),daily=c.trainingDaily();
          dailyFixture.nlContentC.trainingDaily={day:daily.day,wins:3,claimed:{}};q.setGame(dailyFixture);
          const dailyBefore=c.state(),stackBefore=q.getGame().nlItemsV1?.stacks?.['mobile-vng-resource-res_16']||0;
          checks.mobileDailyClaim=c.trainingClaim(0)&&c.state().bookFragments===dailyBefore.bookFragments+15&&(q.getGame().nlItemsV1?.stacks?.['mobile-vng-resource-res_16']||0)===stackBefore+100&&!c.trainingClaim(0);
          q.setGame(trainFixture);

          checks.mobileBookSource=Array.from({length:5},()=>c.bookUpgrade('1')).every(Boolean)&&!c.bookUpgrade('1')&&bookBefore.bookFragments-c.state().bookFragments===2350&&bookBefore.bookExp-c.state().bookExp===897360&&c.trainingAssign('book',trainingOwner,'1');
          checks.mobileHorseSource=!c.horseGate('2',0)&&c.horseUpgrade('1')&&c.horseTier('1')===1&&c.horseGate('2',0)&&c.trainingAssign('horse',trainingOwner,'1');
          checks.mobileEtchSource=c.etchBuy('1')&&c.etchChange('1-1-1','upgrade')&&c.etchEquip(trainingOwner,'1-1-2')&&c.trainingModifiers(trainingOwner).flat.atk>0;
          checks.mobileTrainingNative=!!c.p2Unit(trainingOwner,'p',0,1)?.nlMobileTraining?.book;
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.mobileTrainingSave=c.bookGrade('1')===5&&c.horseTier('1')===1&&c.trainingModifiers(trainingOwner).book?.grade===5;
          q.setGame(trainBefore);
          const childFixture=q.getGame();
          childFixture.nlContentC.mobileCommanderLevel=440;childFixture.silver=100000000;childFixture.nlClassicA.merit=100000;
          childFixture.nlContentC.mobileChild={stage:'chooseSkill',name:'Quý Tử QA',base:{lead:87,war:90,intellect:30},mastery:{'Chiến Pháp':48}};
          q.setGame(childFixture);
          const childChoice=c.childSkills()[0];
          checks.childGraduateNative=!!childChoice&&c.childGraduate(childChoice[0])&&q.getGame().roster.includes('mobile-quy-tu')&&!!c.p2Unit('mobile-quy-tu','p',0,1);
          const childTrained=q.getGame();childTrained.hero['mobile-quy-tu'].level=40;q.setGame(childTrained);
          let childPhases=0;
          for(let i=0;i<4;i++){const p=c.childNextPhase();if(!p?.choices?.length||!c.childPromote(p.choices[0].id))break;childPhases++;}
          checks.childSourcePhases=childPhases===4&&c.childState().phase==='giamQuoc'&&c.childNextPhase()===null;
          const childReload=JSON.parse(JSON.stringify(q.getGame()));q.setGame(childReload);
          checks.childSourceSave=c.childSyncRoster()&&q.getGame().roster.filter(h=>h==='mobile-quy-tu').length===1&&c.childState().phase==='giamQuoc';
          q.setGame(troopBefore);
          const m=c.map('wiki-map-1'),n=m.npcs[0],orders=q.getGame().nlClassicA.orders,firstMerit=q.getGame().nlClassicA.merit;
          checks.difficultyRange=c.npcDifficulty(n.id)===1&&m.npcs.every(x=>c.npcDifficulty(x.id)>=1&&c.npcDifficulty(x.id)<=90);
          checks.nativeStart=c.startNpc(n.id);checks.oneOrder=q.getGame().nlClassicA.orders===orders-1;
          let b=q.debugBattle();
          checks.formation=b?.e.length===n.units.length&&b.e.every((e,i)=>e.slot===n.units[i].slot&&e.name===n.units[i].name);
          const firstSourceSkill=n.units[0]?.skill,firstEnemySkill=b?.e?.[0]?.nlCDescriptor;
          checks.mobileNpcSkillDescriptor=!!firstSourceSkill&&b?.e?.[0]?.skill===firstSourceSkill.name&&
            firstEnemySkill?.sourceSkillClassification==='SOURCE_DAMAGE_COEFFICIENT_AND_TARGET_ADAPTED'&&
            firstEnemySkill?.tag===firstSourceSkill.name&&firstEnemySkill?.pattern==='single'&&
            firstEnemySkill?.kind==='magic'&&firstEnemySkill?.mult===.35&&
            b.e[0].nlMobileSource?.sourceSkillDescription===firstSourceSkill.desc&&
            JSON.stringify(b.e[0].nlMobileSource?.sourceEffects)===JSON.stringify(n.units[0]?.effects)&&
            b.e[0].nlMobileSource?.sourceEffectsClassification==='SOURCE_EXACT';
          checks.mobileNpcSkillDiagnostics={sourceSkill:firstSourceSkill,enemySkill:b?.e?.[0]?.skill,
            descriptor:firstEnemySkill,mobileSource:b?.e?.[0]?.nlMobileSource};
          const controlProbe=c.skillProbe('Cường Tập'),controlDescriptor=controlProbe&&c.describeSkill(controlProbe.skill,'infantry',false,controlProbe.effects),
            guardProbe=c.skillProbe('Thủ Hộ'),guardDescriptor=guardProbe&&c.describeSkill(guardProbe.skill,'strategist',false,guardProbe.effects),
            noBuffProbe=c.skillProbe('Bách Lý Truy Hồn'),noBuffDescriptor=noBuffProbe&&c.describeSkill(noBuffProbe.skill,'infantry',false,noBuffProbe.effects),
            defenseProbe=c.skillProbe('Chấn Kích'),defenseDescriptor=defenseProbe&&c.describeSkill(defenseProbe.skill,'strategist',false,defenseProbe.effects),
            deathProbe=c.skillProbe('Tử Thần'),deathDescriptor=deathProbe&&c.describeSkill(deathProbe.skill,'strategist',false,deathProbe.effects),
            physicalBuffProbe=c.skillProbe('Lợi Nhẫn'),physicalBuffDescriptor=physicalBuffProbe&&c.describeSkill(physicalBuffProbe.skill,'support',false,physicalBuffProbe.effects),
            magicBuffProbe=c.skillProbe('Phấn Đẩu'),magicBuffDescriptor=magicBuffProbe&&c.describeSkill(magicBuffProbe.skill,'strategist',false,magicBuffProbe.effects),
            tacticBuffProbe=c.skillProbe('Chuyên Chú'),tacticBuffDescriptor=tacticBuffProbe&&c.describeSkill(tacticBuffProbe.skill,'support',false,tacticBuffProbe.effects),
            attackDebuffProbe=c.skillProbe('Chiết Binh'),attackDebuffDescriptor=attackDebuffProbe&&c.describeSkill(attackDebuffProbe.skill,'strategist',false,attackDebuffProbe.effects),
            dragonBuffProbe=c.skillProbe('Chúa Lâm'),dragonBuffDescriptor=dragonBuffProbe&&c.describeSkill(dragonBuffProbe.skill,'support',false,dragonBuffProbe.effects),
            allDefenseProbe=c.skillProbe('Đoạn Lương Phá Trận'),allDefenseDescriptor=allDefenseProbe&&c.describeSkill(allDefenseProbe.skill,'strategist',false,allDefenseProbe.effects),
            purificationProbe=c.skillProbe('Long Uy'),purificationDescriptor=purificationProbe&&c.describeSkill(purificationProbe.skill,'cavalry',false,purificationProbe.effects),
            purificationHighProbe=c.skillProbe('Huyền Tướng'),purificationHighDescriptor=purificationHighProbe&&c.describeSkill(purificationHighProbe.skill,'strategist',false,purificationHighProbe.effects),
            magicDefenseProbe=c.skillProbe('Đãng Bình'),magicDefenseDescriptor=magicDefenseProbe&&c.describeSkill(magicDefenseProbe.skill,'strategist',false,magicDefenseProbe.effects),
            tacticDefenseProbe=c.skillProbe('Long Tức'),tacticDefenseDescriptor=tacticDefenseProbe&&c.describeSkill(tacticDefenseProbe.skill,'strategist',false,tacticDefenseProbe.effects),
            compoundDefenseProbe=c.skillProbe('Hủy Diệt'),compoundDefenseDescriptor=compoundDefenseProbe&&c.describeSkill(compoundDefenseProbe.skill,'strategist',false,compoundDefenseProbe.effects),
            healingReductionProbe=c.skillProbe('Tru Tâm'),healingReductionDescriptor=healingReductionProbe&&c.describeSkill(healingReductionProbe.skill,'strategist',false,healingReductionProbe.effects),
            lifestealProbe=c.skillProbe('Thị Chiến'),lifestealDescriptor=lifestealProbe&&c.describeSkill(lifestealProbe.skill,'infantry',false,lifestealProbe.effects),
            shieldProbe=c.skillProbe('Bích Lũy'),shieldDescriptor=shieldProbe&&c.describeSkill(shieldProbe.skill,'support',false,shieldProbe.effects);
          const appOf=(descriptor,id)=>descriptor?.sourceApplications?.find(app=>app.sourceId===id);
          checks.mobileSourceControlDescriptor=controlDescriptor?.sourceApplications?.some(app=>app.sourceId==='2'&&app.kind==='mobile-source-control'&&app.scope==='targets'&&app.chance===.75&&app.turns===1);
          checks.mobileSourceGuardDescriptor=guardDescriptor?.sourceApplications?.some(app=>app.sourceId==='4'&&app.kind==='mobile-source-incoming'&&app.scope==='allies'&&app.values.incomingDamageMultiplier===.65&&app.turns===2);
          checks.mobileSourceNoBuffDescriptor=noBuffDescriptor?.sourceApplications?.some(app=>app.sourceId==='77'&&app.kind==='mobile-source-no-buffs'&&app.scope==='targets'&&app.turns===5&&app.condition==='TARGET_SURVIVES')&&
            noBuffDescriptor?.sourceTargetMode==='LEAST_TROOPS'&&noBuffDescriptor?.sourceConditionalMorale?.onKill===500&&noBuffDescriptor?.sourceConditionalMorale?.onSurvival===145;
          checks.mobileSourceBuffAdapters=!!noBuffDescriptor?.sourceApplications?.some(app=>app.sourceId==='5'&&app.scope==='self'&&app.turns===3&&app.values.criticalChanceAdd===.6)&&
            !!noBuffDescriptor?.sourceApplications?.some(app=>app.sourceId==='49'&&app.scope==='self'&&app.turns===3&&app.values.outgoingDamageMultiplier===1.15&&app.stackingClassification==='SIMULATED_ADDITIVE_PER_STACK');
          checks.mobileSourceDefenseDescriptor=appOf(defenseDescriptor,'18')?.scope==='enemies'&&appOf(defenseDescriptor,'18')?.turns===3&&
            appOf(defenseDescriptor,'18')?.values.incomingPhysicalDefenseMultiplier===.5;
          checks.mobileSourceMagicDefenseDescriptor=appOf(magicDefenseDescriptor,'19')?.scope==='targets'&&appOf(magicDefenseDescriptor,'19')?.turns===2&&
            appOf(magicDefenseDescriptor,'19')?.values.incomingMagicDefenseMultiplier===.75;
          checks.mobileSourceTacticDefenseDescriptor=appOf(tacticDefenseDescriptor,'20')?.scope==='targets'&&appOf(tacticDefenseDescriptor,'20')?.turns===2&&
            appOf(tacticDefenseDescriptor,'20')?.values.incomingTacticDefenseMultiplier===.6;
          checks.mobileSourceCompoundDefenseDescriptor=appOf(compoundDefenseDescriptor,'20')?.values.incomingTacticDefenseMultiplier===.7&&
            appOf(compoundDefenseDescriptor,'20')?.values.incomingPhysicalDefenseMultiplier===.7;
          checks.mobileSourceDefenseStatusCoverage=skillAudit.legacySourceStatusIds===24&&skillAudit.sourceStatusIds>=24;
          checks.mobileSourceHealingReductionDescriptor=appOf(healingReductionDescriptor,'30')?.scope==='targets'&&appOf(healingReductionDescriptor,'30')?.turns===2&&
            appOf(healingReductionDescriptor,'30')?.values.incomingHealingMultiplier===.5;
          checks.mobileSourceLifestealDescriptor=appOf(lifestealDescriptor,'31')?.scope==='self'&&appOf(lifestealDescriptor,'31')?.turns===3&&
            appOf(lifestealDescriptor,'31')?.values.lifestealDamageMultiplier===.2&&appOf(lifestealDescriptor,'31')?.formulaClassification==='DERIVED_FROM_SOURCE_DAMAGE_RATIO';
          checks.mobileSourceShieldDescriptor=appOf(shieldDescriptor,'37')?.scope==='allies'&&appOf(shieldDescriptor,'37')?.turns===2&&
            appOf(shieldDescriptor,'37')?.chance===.85&&appOf(shieldDescriptor,'37')?.values.damageBlockCharges===1;
          checks.mobileSourceConditionalControlDescriptor=deathDescriptor?.sourceConditionalMorale?.onKill===500&&deathDescriptor?.sourceConditionalMorale?.onSurvival===0&&
            deathDescriptor?.sourceConditionalMorale?.onAction===50&&deathDescriptor?.sourceConditionalMorale?.onSurvivalStatus?.sourceId==='2'&&
            deathDescriptor?.sourceConditionalMorale?.onSurvivalStatus?.turns===1;
          checks.mobileSourceAttackVectorDescriptors=appOf(physicalBuffDescriptor,'9')?.scope==='allies'&&appOf(physicalBuffDescriptor,'9')?.turns===2&&appOf(physicalBuffDescriptor,'9')?.values.physicalDamageMultiplier===1.25&&
            appOf(magicBuffDescriptor,'10')?.scope==='self'&&appOf(magicBuffDescriptor,'10')?.values.magicDamageMultiplier===1.25&&
            appOf(tacticBuffDescriptor,'11')?.scope==='allies'&&appOf(tacticBuffDescriptor,'11')?.values.tacticDamageMultiplier===1.25&&
            appOf(attackDebuffDescriptor,'13')?.scope==='targets'&&appOf(attackDebuffDescriptor,'13')?.chance===.75&&appOf(attackDebuffDescriptor,'13')?.values.physicalDamageMultiplier===.75;
          checks.mobileSourceDragonBuffDescriptor=appOf(dragonBuffDescriptor,'70')?.scope==='allies'&&appOf(dragonBuffDescriptor,'70')?.turns===2&&
            appOf(dragonBuffDescriptor,'70')?.values.outgoingDamageMultiplier===1.2&&appOf(dragonBuffDescriptor,'70')?.unresolvedMechanics?.includes('SOURCE_BUFF_COUNT_SCALING_UNQUANTIFIED');
          checks.mobileSourceAllDefenseDescriptor=appOf(allDefenseDescriptor,'21')?.scope==='enemies'&&appOf(allDefenseDescriptor,'21')?.turns===3&&
            appOf(allDefenseDescriptor,'21')?.values.incomingDefenseMultiplier===.25;
          const guard50=sourceStatusSamples['50'],lastStand58=sourceStatusSamples['58'],lastStandTarget58=sourceStatusSamples['58-lowest'];
          const guardUnit={hp:1000,maxHp:1000,effects:[],team:'p',slot:0},lastStandUnit={hp:500,maxHp:1000,effects:[],team:'p',slot:0};
          const guardApplied=!!guard50?.app&&c.applyMobileSourceStatus(guardUnit,guard50.app)&&c.applyMobileSourceStatus(guardUnit,guard50.app);
          const lastStandApplied=!!lastStand58?.app&&c.applyMobileSourceStatus(lastStandUnit,lastStand58.app);
          checks.mobileSourceDefenseUpExactAndStacked=guard50?.app?.turns===Number(guard50.effect.detail.match(/(\\d+)\\s*lượt/i)?.[1])&&
            guard50?.app?.values.incomingDefensePerStack===Number(guard50.effect.detail.match(/(\\d+(?:[.,]\\d+)?)%/)?.[1]?.replace(',','.'))/100&&
            guard50?.app?.stackingClassification==='SOURCE_EXACT_ADD_STACK'&&guardApplied&&guardUnit.effects[0]?.stacks===2&&
            Math.abs(c.p2StatusFactor(guardUnit,'incomingDefenseMultiplier')-(1+guard50.app.values.incomingDefensePerStack*2))<1e-9;
          checks.mobileSourceLastStandMagnitudeAndScaling=lastStand58?.app?.values.defenseBonusAtZeroTroops===Number(lastStand58.effect.detail.match(/(\\d+(?:[.,]\\d+)?)%/)?.[1]?.replace(',','.'))/100&&
            lastStand58?.app?.formulaClassification==='SOURCE_MAGNITUDE_WITH_SIMULATED_LINEAR_INTERPOLATION'&&lastStandApplied&&
            Math.abs(c.p2StatusFactor(lastStandUnit,'incomingDefenseMultiplier')-(1+lastStand58.app.values.defenseBonusAtZeroTroops*.5))<1e-9;
          checks.mobileSourceLastStandLowestAllyTarget=lastStandTarget58?.app?.scope==='lowest-ally'&&lastStandTarget58?.app?.turns===3;
          const moonSoul33=sourceStatusSamples['33'],healingVitality74=sourceStatusSamples['74'];
          const silence184=sourceStatusSamples['184'],silenceTurns=Number(silence184?.skill?.desc.match(/\\[Vô Ngôn\\][\\s\\S]{0,45}?duy trì\\s+(\\d+)\\s*lượt/i)?.[1]);
          const bounty54=sourceStatusSamples['54'],insight55=sourceStatusSamples['55'];
          const confusion51=sourceStatusSamples['51'];
          const shield108=sourceStatusSamples['108'],shieldExact108=sourceStatusSamples['108-exact'];
          const progressive29=sourceStatusSamples['29'];
          const fortune65=sourceStatusSamples['65'];
          const heavenlyFire68=sourceStatusSamples['68'];
          const octagram123=sourceStatusSamples['123'];
          const revival152=sourceStatusSamples['152'];
          const bountyRawMagnitude=Number(bounty54?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)\\s*[·x*]\\s*\\d+\\s*lượt/i)?.[1]?.replace(',','.'));
          const insightRawMagnitude=Number(insight55?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)\\s*[·x*]\\s*\\d+\\s*lượt/i)?.[1]?.replace(',','.'));
          checks.mobileSourceBountySelectors=sourceStatusSamples['54-least-enemy']?.app?.scope==='least-enemy'&&
            sourceStatusSamples['54-random-enemies']?.app?.targetCount===2&&
            sourceStatusSamples['54-highest-troops-and-random']?.app?.additionalRandomTargets===1&&
            sourceStatusSamples['54-enemies']?.app?.scope==='enemies';
          checks.mobileSourceBountyMagnitudeIsNotMisread=Number.isFinite(bountyRawMagnitude)?
            bounty54?.app?.sourceMagnitude===bountyRawMagnitude&&bounty54?.app?.turns===Number(bounty54.effect.detail.match(/(\\d+)\\s*lượt/i)?.[1]):
            bounty54?.app?.sourceMagnitude===undefined&&bounty54?.app?.turns===Number(bounty54?.effect?.detail?.match(/(\\d+)\\s*lượt/i)?.[1]);
          checks.mobileSourceInsightMagnitude=Number.isFinite(insightRawMagnitude)&&insight55?.app?.scope==='self'&&
            insight55?.app?.values.damageToBountyMultiplier===insightRawMagnitude&&insight55?.app?.formulaClassification==='SIMULATED_DIRECT_DAMAGE_MULTIPLIER_FROM_SOURCE_MAGNITUDE'&&
            insight55?.app?.turns===Number(insight55.effect.detail.match(/(\\d+)\\s*lượt/i)?.[1]);
          checks.mobileSourceConfusionDescriptor=confusion51?.app?.scope==='enemies'&&confusion51?.app?.chance===Number(confusion51.effect.detail.match(/(\\d+(?:[.,]\\d+)?)%/)?.[1]?.replace(',','.'))/100&&
            confusion51?.app?.turns===Number(confusion51.effect.detail.match(/(\\d+)\\s*lượt/i)?.[1])&&confusion51?.app?.kind==='mobile-source-confusion';
          checks.mobileSourceShieldDescriptor=!!shield108&&['self','allies'].includes(shield108.app.scope)&&shield108.app.turns>0&&
            shield108.app.kind==='mobile-source-max-hp-shield'&&shield108.app.values.maxHpShieldRatio>0;
          checks.mobileSourceShieldExactRatio=!!shieldExact108&&shieldExact108.app.values.maxHpShieldRatio===shieldExact108.app.sourceMagnitude/100&&
            shieldExact108.app.formulaClassification==='SOURCE_MAX_HP_SHIELD_RATIO';
          const progressiveMagnitude=Number(progressive29?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)%/)?.[1]?.replace(',','.'))/100;
          const progressiveTurns=Number(progressive29?.effect?.detail?.match(/(\\d+)\\s*lượt/i)?.[1]);
          checks.mobileSourceProgressiveVulnerabilityDescriptor=!!progressive29&&progressive29.app.scope==='targets'&&progressiveMagnitude>0&&
            progressive29.app.values.damageTakenIncreasePerTargetAction===progressiveMagnitude&&progressive29.app.turns===progressiveTurns&&
            progressive29.app.simulatedStackLimit===5&&progressive29.app.formulaClassification==='SIMULATED_PROGRESSIVE_VULNERABILITY_FROM_SOURCE_MAGNITUDE';
          const fortuneDetail=fortune65?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)\\s*[·x*]\\s*(\\d+)\\s*lượt/i);
          const fortuneMaximum=Number(fortuneDetail?.[1]?.replace(',','.')),fortuneTurns=Number(fortuneDetail?.[2]);
          checks.mobileSourceFortuneDescriptor=!!fortune65&&fortune65.app.scope==='self'&&fortune65.app.values.maxDamageMultiplier===fortuneMaximum&&
            fortune65.app.sourceMagnitude===fortuneMaximum&&fortune65.app.turns===fortuneTurns&&
            fortune65.app.formulaClassification==='SOURCE_MAX_MULTIPLIER_WITH_SIMULATED_UNIFORM_INTEGER_PICK';
          const fireDuration=Number(heavenlyFire68?.effect?.detail?.match(/(\\d+)\\s*lượt/i)?.[1]||heavenlyFire68?.skill?.desc?.match(/Thiên Hỏa[^.]{0,45}?duy trì\\s+(\\d+)\\s*lượt/i)?.[1]);
          checks.mobileSourceHeavenlyFireDescriptor=!!heavenlyFire68&&heavenlyFire68.app.scope==='targets'&&heavenlyFire68.app.turns===fireDuration&&
            heavenlyFire68.app.values.currentTroopLossRatio>0&&heavenlyFire68.app.values.spreadChance===.25&&
            heavenlyFire68.app.dispelPolicy==='unremovable'&&heavenlyFire68.app.formulaClassification.startsWith('SIMULATED_');
          const octagramDuration=Number(octagram123?.effect?.detail?.match(/(\\d+)\\s*lượt/i)?.[1]);
          const octagramMagnitude=Number(octagram123?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)\\s*[·x*]/)?.[1]?.replace(',','.'));
          checks.mobileSourceOctagramDescriptor=!!octagram123&&octagram123.app.scope==='lowest-ally'&&octagram123.app.turns===octagramDuration&&
            octagram123.app.values.damageBlockCharges===1&&octagram123.app.sourceMagnitude===octagramMagnitude&&
            octagram123.app.formulaClassification==='SOURCE_EXACT_ONE_HIT_REDIRECT_WITH_SIMULATED_UNIFORM_RANDOM_TARGET';
          const revivalDuration=Number(revival152?.effect?.detail?.match(/(\\d+)\\s*lượt/i)?.[1]);
          const revivalMagnitude=Number(revival152?.effect?.detail?.match(/^(\\d+(?:[.,]\\d+)?)\\s*[·x*]/)?.[1]?.replace(',','.'));
          checks.mobileSourceRevivalDescriptor=!!revival152&&['self','allies','targets','lowest-ally'].includes(revival152.app.scope)&&
            revival152.app.turns===revivalDuration&&revival152.app.values.healPerConsumedStack>0&&
            revival152.app.values.stackCount>0&&revival152.app.sourceMagnitude===revivalMagnitude&&
            revival152.app.dispelPolicy==='unknown'&&revival152.app.formulaClassification==='SIMULATED_SOURCE_MAGNITUDE_AS_FLAT_TROOP_HEAL_PER_CONSUMED_STACK';
          checks.mobileSourceSilenceDescriptor=silence184?.app?.scope==='targets'&&silenceTurns>0&&silence184?.app?.turns===silenceTurns&&
            silence184?.app?.kind==='mobile-source-skill-silence';
          const moraleProtected={morale:80,effects:[],team:'p',slot:0};
          const moraleProtectedApplied=!!moonSoul33?.app&&c.applyMobileSourceStatus(moraleProtected,moonSoul33.app);
          if(moraleProtectedApplied)c.p2Morale(moraleProtected,-25);
          checks.mobileSourceMoonSoulBlocksMoraleLoss=moonSoul33?.app?.scope==='self'&&moonSoul33?.app?.values.moraleLossMultiplier===0&&
            moraleProtectedApplied&&moraleProtected.morale===80;
          const healer=c.p2Unit(id,'p',0,1),plainRecipient=c.p2Unit(id,'p',1,1),buffedRecipient=plainRecipient&&structuredClone(plainRecipient);
          if(plainRecipient&&buffedRecipient){plainRecipient.hp=Math.floor(plainRecipient.maxHp*.5);buffedRecipient.hp=plainRecipient.hp;}
          const healingBuffApplied=!!buffedRecipient&&!!healingVitality74?.app&&c.applyMobileSourceStatus(buffedRecipient,healingVitality74.app);
          const plainSourceHeal=healer&&plainRecipient?c.p2Heal(healer,plainRecipient,.5):null;
          const buffedSourceHeal=healer&&buffedRecipient?c.p2Heal(healer,buffedRecipient,.5):null;
          checks.mobileSourceHealingReceivedBuff=healingVitality74?.app?.scope==='allies'&&healingVitality74?.app?.values.incomingHealingMultiplier>1&&
            healingVitality74?.app?.formulaClassification==='SOURCE_PERCENT_WITH_DERIVED_HEAL_RECEIVED_ADAPTER'&&healingBuffApplied&&
            plainSourceHeal?.amount>0&&buffedSourceHeal?.amount===Math.round(plainSourceHeal.amount*healingVitality74.app.values.incomingHealingMultiplier);
          checks.mobileSourceDefenseDiagnostics={guard50:guard50&&{mapId:guard50.mapId,detail:guard50.effect.detail,app:guard50.app},lastStand58:lastStand58&&{mapId:lastStand58.mapId,detail:lastStand58.effect.detail,app:lastStand58.app},lowestAlly:lastStandTarget58&&{mapId:lastStandTarget58.mapId,detail:lastStandTarget58.effect.detail,app:lastStandTarget58.app}};
          checks.mobileSourcePurificationDescriptor=appOf(purificationDescriptor,'46')?.scope==='self'&&appOf(purificationDescriptor,'46')?.turns===2&&
            appOf(purificationDescriptor,'46')?.values.damageBonusPerBeneficialBuff===.2&&
            appOf(purificationHighDescriptor,'46')?.scope==='self'&&appOf(purificationHighDescriptor,'46')?.turns===2&&
            appOf(purificationHighDescriptor,'46')?.values.damageBonusPerBeneficialBuff===1;
          checks.mobileSourcePurificationCoverage=skillAudit.legacySourceStatusIds===24&&skillAudit.sourceStatusIds>=24;
          checks.mobileSourceNoBuffDiagnostics=noBuffDescriptor?.sourceApplications||[];
          if(!b)return checks;
          const enemy=b.e[0],beforeNpcSkillEvents=b.events.length;enemy.morale=100;q.perform(enemy);
          const npcSkillEvent=b.events.at(-1);
          checks.nativeAction=b.events.length===beforeNpcSkillEvents+1;
          checks.mobileNpcSkillInNativeCombat=npcSkillEvent?.skill===firstSourceSkill.name&&
            npcSkillEvent?.kind==='magic'&&npcSkillEvent?.hits?.length===1&&npcSkillEvent.hits[0].amount>0&&
            npcSkillEvent?.actorTeam==='e'&&npcSkillEvent?.actor===enemy.name;
          const damageOne=enemy.effects.find(effect=>effect.kind==='mobile-damage-one');
          const beforeDamageOneHit=enemy.hp,damageOneHit=c.p2Hit(b.p[0],enemy,'physical',1);
          checks.mobileSourceEffectInNativeCombat=firstEnemySkill?.applyAlly==='mobile-damage-one'&&
            firstEnemySkill?.applyAllyDuration===1&&firstEnemySkill?.skillFieldProvenance?.secondaryEffects==='PARTIAL_SOURCE_DAMAGE_ONE_STATUS_ADAPTED'&&
            damageOne?.turns===1&&damageOneHit?.amount===1&&enemy.hp===beforeDamageOneHit-1;
          checks.mobileNpcSkillEvent=npcSkillEvent?{skill:npcSkillEvent.skill,kind:npcSkillEvent.kind,
            mode:npcSkillEvent.mode,hits:npcSkillEvent.hits}:null;
          // Deterministic forced victory exercises the real native finish owner, not balance.
          for(const u of b.e)u.hp=0;
          if(!b.finished)q.finishBattle();
          const s=q.getGame(),report=b.report;
          checks.settlement=b.won&&c.state().cleared[n.id]===true&&s.cleared.length===28&&report?.nlContentC?.id===n.id&&report?.nlContentC?.mobileSource?.record?.ident===n.source?.ident&&report?.rewards?.iron===undefined;
          const mobileDrop=report?.nlContentC?.mobileDropRolls?.rows?.find(x=>x.sourceId==='34');
          checks.mobileCampaignDrop=mobileDrop?.status==='SOURCE_DROP_ROLLED'&&mobileDrop?.rate===100&&
            mobileDrop?.runtimeId==='mobile-vng-equipment-34'&&s.items.some(x=>x.base==='mobile-vng-equipment-34')&&
            report?.nlContentC?.mobileDropRolls?.sourceEdition==='CURRENT_VNG_MOBILE_WIKI_VIETNAMESE';
          const mobileGear=s.items.find(x=>x.base==='mobile-vng-equipment-34');
          const unarmed=c.p2Unit(id,'p',0,1),equipResult=mobileGear&&window.__NL_ITEM_QA__?.equipOwned(id,mobileGear.uid),armed=c.p2Unit(id,'p',0,1);
          checks.mobileGearLiveCombat=!!equipResult?.ok&&equipResult.detail?.slot==='armor'&&armed.def>unarmed.def&&armed.hp>unarmed.hp&&
            q.getGame().gear[id]?.armor===mobileGear.uid&&q.getGame().version===5;
          checks.sealCurrencySettlement=report?.rewards?.chienTich===650+c.npcDifficulty(n.id)*240+(n.boss?500:0)&&c.state().chienTich===report.rewards.chienTich&&c.state().hoPhu===0;
          checks.firstMerit=s.nlClassicA.merit-firstMerit>=c.npcMerit(n.id)&&report?.nlContentC?.meritAward===s.nlClassicA.merit-firstMerit;
          const balance=s.silver,meritBalance=s.nlClassicA.merit;q.finishBattle();checks.noDuplicate=q.getGame().silver===balance&&q.getGame().nlClassicA.merit===meritBalance;
          // Exercise the source-priced shop through the visible production screen.
          const shopState=q.getGame();shopState.silver=1000000;shopState.gold=1000;q.setGame(shopState);
          document.querySelector('.nav[data-tab="equipment"]')?.click();
          document.querySelector('[data-nl-item-bridge] [data-nli-shop="1"]')?.click();
          const shopSearch=document.querySelector('[data-nl-item-bridge] [data-nli-search]');
          if(shopSearch){shopSearch.value='Thiết Kiếm';shopSearch.dispatchEvent(new InputEvent('input',{bubbles:true}));}
          const shopItem=document.querySelector('[data-nl-item-bridge] [data-nl-art-item="mobile-vng-equipment-1"]');
          const shopBalance=q.getGame().silver,shopCount=q.getGame().items.length;
          const shopPrice=shopItem?.innerText.includes('400 bạc');
          shopItem?.querySelector('[data-nli-action="buy"]')?.click();
          const afterShop=q.getGame();
          checks.mobileShopPurchase=!!shopPrice&&afterShop.silver===shopBalance-400&&
            afterShop.items.length===shopCount+1&&afterShop.items.some(x=>x.base==='mobile-vng-equipment-1')&&afterShop.version===5;
          document.querySelector('[data-nl-item-bridge] [data-nli-shop="0"]')?.click();
          const ownedShopItem=document.querySelector('[data-nl-item-bridge] [data-nl-art-item="mobile-vng-equipment-1"]');
          const sellPrice=ownedShopItem?.innerText.includes('13 Bạc');
          ownedShopItem?.querySelector('[data-nli-action="sell"]')?.click();
          const afterSale=q.getGame();
          checks.mobileGearSale=!!sellPrice&&afterSale.silver===shopBalance-400+13&&
            afterSale.items.length===shopCount&&!afterSale.items.some(x=>x.base==='mobile-vng-equipment-1')&&afterSale.version===5;
          const beforeMoraleProbe=q.getGame(),moraleProbe=c.skillProbe('Cổ Vũ'),moraleDesc=moraleProbe&&c.describeSkill(moraleProbe.skill,'strategist',false);
          checks.mobileMoraleDescriptor=!!moraleProbe&&moraleDesc?.sourceSkillClassification==='SOURCE_MORALE_ONLY_ADAPTED'&&
            moraleDesc?.pattern==='morale'&&moraleDesc?.bonusMorale===45&&moraleDesc?.sourceMoraleScope==='OTHER_ALLIES';
          q.closeBattle('city');
          if(moraleProbe){
            const probeMap=c.map(moraleProbe.mapId),probeState=JSON.parse(JSON.stringify(beforeMoraleProbe));
            probeState.nlContentC.mobileCommanderLevel=440;
            for(const previous of probeMap.npcs.slice(0,moraleProbe.npcIndex))probeState.nlContentC.cleared[previous.id]=true;
            delete probeState.nlContentC.cleared[moraleProbe.npcId];q.setGame(probeState);
            const launched=c.startNpc(moraleProbe.npcId),mb=q.debugBattle();
            const moraleUnit=mb?.e?.find(u=>u.nlMobileSource?.sourceSkillName==='Cổ Vũ'&&u.slot===moraleProbe.slot);
            const allies=(mb?.e||[]).filter(u=>u!==moraleUnit);for(const unit of mb?.e||[])unit.morale=0;if(moraleUnit)moraleUnit.morale=100;
            const beforeMoraleEvents=mb?.events?.length||0;if(moraleUnit)q.perform(moraleUnit);
            const moraleEvent=mb?.events?.at(-1);
            checks.mobileMoraleInNativeCombat=!!launched&&!!moraleUnit&&allies.length>0&&moraleEvent?.mode==='drum'&&
              moraleEvent?.skill==='Cổ Vũ'&&moraleEvent?.hits?.length===0&&mb.events.length===beforeMoraleEvents+1&&
              allies.every(unit=>unit.morale===45)&&moraleUnit.morale===0&&moraleEvent.description.includes('45 sĩ khí');
            q.closeBattle('city');q.setGame(beforeMoraleProbe);
          }else checks.mobileMoraleInNativeCombat=false;
          // Source Hỗn Loạn and Thủ Hộ are applied by the real native P2 event/status/hit path.
          q.closeBattle('city');
          const beforeStatusProbe=q.getGame();
          function launchStatusProbe(probe,fullFormation=false){
            if(!probe)return null;const mapKey=String(probe.mapId),map=c.map(mapKey.startsWith('wiki-map-')?mapKey:'wiki-map-'+mapKey),g=JSON.parse(JSON.stringify(beforeStatusProbe));
            if(fullFormation)g.slots=g.roster.slice(0,5).concat(Array(9).fill(null)).slice(0,9);
            g.nlContentC.mobileCommanderLevel=440;g.nlClassicA.orders=60;g.hero[id].troops=3000;
            for(const prev of map.npcs.slice(0,probe.npcIndex))g.nlContentC.cleared[prev.id]=true;
            delete g.nlContentC.cleared[probe.npcId];q.setGame(g);
            return c.startNpc(probe.npcId)?q.debugBattle():null;
          }
          const leastBounty=sourceStatusSamples['54-least-enemy'],randomBounty=sourceStatusSamples['54-random-enemies'],highestBounty=sourceStatusSamples['54-highest-troops-and-random'];
          const bountyBattle=launchStatusProbe(leastBounty,true),bountyCaster=bountyBattle?.e?.find(unit=>unit.slot===leastBounty?.slot);
          if(bountyBattle&&bountyCaster){
            bountyBattle.p.forEach((unit,index)=>{unit.hp=unit.maxHp=1000000000000+index*1000000000;unit.alive=true;});
            const expectedLeast=[...bountyBattle.p].filter(unit=>unit.hp>0).sort((a,b)=>a.hp-b.hp||a.slot-b.slot)[0];
            const selectedLeast=c.mobileSourceApplicationTargets(bountyCaster,{actorTeam:'e',hits:[]},leastBounty.app,bountyCaster.nlCDescriptor);
            const selectedRandom=c.mobileSourceApplicationTargets(bountyCaster,{actorTeam:'e',hits:[]},randomBounty?.app||{},bountyCaster.nlCDescriptor);
            const highest=bountyBattle.p.filter(unit=>unit.hp>0).sort((a,b)=>b.hp-a.hp||a.slot-b.slot)[0];
            const selectedHighest=c.mobileSourceApplicationTargets(bountyCaster,{actorTeam:'e',hits:[]},highestBounty?.app||{},bountyCaster.nlCDescriptor);
            checks.mobileSourceBountyTargetSelectors=selectedLeast.length===1&&selectedLeast[0]===expectedLeast&&
              selectedRandom.length===2&&new Set(selectedRandom).size===2&&selectedHighest.length===2&&selectedHighest.includes(highest);
            bountyCaster.morale=100;q.perform(bountyCaster);
            const event=bountyBattle.events.at(-1),actualMarks=bountyBattle.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='54'));
            checks.mobileSourceBountyInNativeCombat=event?.mode==='skill'&&event.skill===leastBounty.skill.name&&actualMarks.length===1&&
              actualMarks[0]?.effects.some(effect=>effect.mobileSource?.sourceEffectId==='54'&&effect.turns===leastBounty.app.turns);
            const markApplied=actualMarks[0]?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='54');
            if(markApplied?.mobileSource?.dispelPolicy==='undispellable'){
              checks.mobileSourceBountyCannotBeDispelled=c.mobileBookDispel(actualMarks[0],1)===0&&actualMarks[0].effects.includes(markApplied);
            }else checks.mobileSourceBountyCannotBeDispelled=true;
            checks.mobileSourceBountyDiagnostics={sample:leastBounty,selectedLeast:selectedLeast.map(x=>x.slot),expectedLeast:expectedLeast?.slot,actualMarks:actualMarks.map(x=>({slot:x.slot,effects:x.effects.filter(effect=>effect.mobileSource?.sourceEffectId==='54')})),event};
          }else {checks.mobileSourceBountyTargetSelectors=false;checks.mobileSourceBountyInNativeCombat=false;checks.mobileSourceBountyCannotBeDispelled=false;}
          q.closeBattle('city');
          const insightBattle=launchStatusProbe(insight55),insightCaster=insightBattle?.e?.find(unit=>unit.slot===insight55?.slot);
          if(insightBattle&&insightCaster){
            insightBattle.p.forEach(unit=>{unit.hp=unit.maxHp=1000000000000;unit.alive=true;});
            insightCaster.morale=100;q.perform(insightCaster);
            const insightStatus=insightCaster.effects.find(effect=>effect.mobileSource?.sourceEffectId==='55');
            const markedTarget=structuredClone(insightBattle.p.find(unit=>unit.hp>0));
            const plainTarget=structuredClone(markedTarget);
            if(markedTarget&&plainTarget){
              markedTarget.hp=markedTarget.maxHp=plainTarget.hp=plainTarget.maxHp=1000000000000;
              markedTarget.effects=[];plainTarget.effects=[];
              const bountyApp=leastBounty?.app;
              const markApplied=!!bountyApp&&c.applyMobileSourceStatus(markedTarget,bountyApp);
              const attack={id:insightCaster.id,team:'e',slot:4,troop:'infantry',type:'infantry',hp:1000000000000,maxHp:1000000000000,
                atk:1000000,catk:1000000,matk:1000000,def:500,tdef:500,mdef:500,morale:50,crit:0,nlMobileActionPattern:'single',nlMobileSourceSkillAction:false,
                effects:[structuredClone(insightStatus)]};
              const cleanTarget=target=>{for(const field of ['nlMobileTrait','nlMobileTech','nlMobileHero','nlMobileHeroBuild','nlMobileRefine','nlMobileTraining','nlMobilePierceActive','nlClassicWebAbility','nlClassicWebPattern'])delete target[field];target.id='qa-target';target.troop='infantry';target.type='infantry';target.atk=100;target.catk=100;target.matk=100;target.alive=true;target.def=target.tdef=target.mdef=1;};
              for(const target of [markedTarget,plainTarget])cleanTarget(target);
              const seed=insightBattle.seed;insightBattle.seed=123456;const plainHit=c.p2Hit(structuredClone(attack),plainTarget,'physical',1);
              insightBattle.seed=123456;const markedHit=c.p2Hit(structuredClone(attack),markedTarget,'physical',1);insightBattle.seed=seed;
              const expectedMultiplier=insightStatus?.mobileSourceValues?.damageToBountyMultiplier;
              checks.mobileSourceInsightInNativeCombat=!!insightStatus&&insightStatus.turns===insight55.app.turns&&markApplied&&
                expectedMultiplier===insightRawMagnitude&&Number(markedHit?.amount)>Number(plainHit?.amount)&&
                Math.abs(Number(markedHit?.amount)/Math.max(1,Number(plainHit?.amount))-expectedMultiplier)<.01&&
                insightStatus.mobileSource?.formulaClassification==='SIMULATED_DIRECT_DAMAGE_MULTIPLIER_FROM_SOURCE_MAGNITUDE';
              const undispellableApp={...insight55.app,dispelPolicy:'undispellable'},protectedInsight={hp:1,maxHp:1,effects:[],team:'p',slot:0};
              const appliedProtectedInsight=c.applyMobileSourceStatus(protectedInsight,undispellableApp);
              checks.mobileSourceInsightDynamicDispelPolicy=appliedProtectedInsight&&c.mobileBookDispel(protectedInsight,1)===0&&protectedInsight.effects.length===1;
              checks.mobileSourceInsightDiagnostics={sample:insight55,insightStatus,plainHit,markedHit,expectedMultiplier};
            }else {checks.mobileSourceInsightInNativeCombat=false;checks.mobileSourceInsightDynamicDispelPolicy=false;}
          }else {checks.mobileSourceInsightInNativeCombat=false;checks.mobileSourceInsightDynamicDispelPolicy=false;}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const confusionBattle=launchStatusProbe(confusion51,true),confusionCaster=confusionBattle?.e?.find(unit=>unit.slot===confusion51?.slot);
          if(confusionBattle&&confusionCaster){
            confusionBattle.p.forEach(unit=>{unit.hp=unit.maxHp=1000000000000;unit.alive=true;});
            const application=confusionCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='51');if(application)application.chance=1;
            confusionCaster.morale=100;q.perform(confusionCaster);
            const confusionEvent=confusionBattle.events.at(-1),confusedTargets=confusionBattle.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='51'));
            const confusedTarget=confusedTargets[0];if(confusedTarget){confusedTarget.morale=100;const beforeMorale=confusedTarget.morale;q.perform(confusedTarget);const redirectEvent=confusionBattle.events.at(-1),allyHit=redirectEvent?.hits?.find(hit=>hit.team==='p');
              checks.mobileSourceConfusionInNativeCombat=confusionEvent?.mode==='skill'&&confusedTargets.length===confusionBattle.p.length&&
                confusedTarget.effects.some(effect=>effect.mobileSource?.sourceEffectId==='51'&&effect.turns===confusion51.app.turns)&&
                redirectEvent?.mode==='normal'&&redirectEvent.mobileSourceConfusionRedirected===true&&allyHit?.slot!==confusedTarget.slot&&
                confusedTarget.morale>=beforeMorale&&!confusedTarget.nlMobileConfusionRedirect;
              checks.mobileSourceConfusionDiagnostics={sample:confusion51,confusionEvent,confusedSlots:confusedTargets.map(unit=>unit.slot),redirectEvent,confusedTarget:{slot:confusedTarget.slot,morale:confusedTarget.morale}};
            }else {checks.mobileSourceConfusionInNativeCombat=false;checks.mobileSourceConfusionDiagnostics={confusionEvent,players:confusionBattle.p.map(unit=>({slot:unit.slot,effects:unit.effects}))};}
          }else {checks.mobileSourceConfusionInNativeCombat=false;checks.mobileSourceConfusionDiagnostics={battle:!!confusionBattle,caster:!!confusionCaster,sample:confusion51};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const hpShieldBattle=launchStatusProbe(shield108,true),hpShieldCaster=hpShieldBattle?.e?.find(unit=>unit.slot===shield108?.slot);
          if(hpShieldBattle&&hpShieldCaster){
            const application=hpShieldCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='108');if(application)application.chance=1;
            hpShieldCaster.morale=100;q.perform(hpShieldCaster);
            const hpShieldFriendly=hpShieldBattle[hpShieldCaster.team].filter(unit=>unit.hp>0),hpShieldedUnits=hpShieldFriendly.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='108'));
            const expectedShieldTargets=shield108.app.scope==='self'?1:hpShieldFriendly.length;
            checks.mobileSourceShieldInNativeCombat=hpShieldBattle.events.at(-1)?.skill===shield108.skill.name&&hpShieldedUnits.length===expectedShieldTargets&&
              hpShieldedUnits.every(unit=>{const status=unit.effects.find(effect=>effect.mobileSource?.sourceEffectId==='108');return status.turns===shield108.app.turns&&
                status.mobileSourceValues.shieldMaximum===Math.round(unit.maxHp*shield108.app.values.maxHpShieldRatio)&&status.mobileSourceValues.shieldRemaining===status.mobileSourceValues.shieldMaximum;});
            const probeTarget={team:'p',slot:0,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',def:1,tdef:1,mdef:1,effects:[]};
            const shieldApplied=c.applyMobileSourceStatus(probeTarget,shield108.app),poolBefore=probeTarget.effects[0]?.mobileSourceValues?.shieldRemaining;
            const attacker={team:'e',slot:4,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',atk:1000000,catk:1000000,matk:1000000,crit:0,def:1,tdef:1,mdef:1,effects:[]};
            const hpBefore=probeTarget.hp,shieldHit=shieldApplied?c.p2Hit(attacker,probeTarget,'physical',1):null;
            checks.mobileSourceShieldDamageAbsorption=shieldHit?.mobileSourceShieldAbsorbed>0&&probeTarget.hp===hpBefore&&
              probeTarget.effects[0]?.mobileSourceValues?.shieldRemaining<poolBefore&&shieldHit.amount===0;
            checks.mobileSourceShieldDiagnostics={sample:shield108,exactSample:shieldExact108,shielded:hpShieldedUnits.map(unit=>({slot:unit.slot,hp:unit.hp,effects:unit.effects.filter(effect=>effect.mobileSource?.sourceEffectId==='108')})),shieldHit,poolBefore,poolAfter:probeTarget.effects[0]?.mobileSourceValues?.shieldRemaining};
          }else {checks.mobileSourceShieldInNativeCombat=false;checks.mobileSourceShieldDamageAbsorption=false;checks.mobileSourceShieldDiagnostics={battle:!!hpShieldBattle,caster:!!hpShieldCaster,sample:shield108};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const progressiveBattle=launchStatusProbe(progressive29,true),progressiveCaster=progressiveBattle?.e?.find(unit=>unit.slot===progressive29?.slot);
          if(progressiveBattle&&progressiveCaster){
            progressiveBattle.p.forEach(unit=>{unit.hp=unit.maxHp=1000000000000;unit.alive=true;});
            const application=progressiveCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='29');if(application)application.chance=1;
            progressiveCaster.morale=100;q.perform(progressiveCaster);
            const event=progressiveBattle.events.at(-1),markedTargets=progressiveBattle.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='29'));
            const markedTarget=markedTargets[0],markedStatus=markedTarget?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='29');
            if(markedTarget&&markedStatus){
              markedTarget.morale=40;q.perform(markedTarget);const afterOwnTurn=markedTarget.effects.find(effect=>effect.mobileSource?.sourceEffectId==='29');
              const probeTarget={team:'p',slot:0,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',def:1,tdef:1,mdef:1,effects:[]};
              const applied=c.applyMobileSourceStatus(probeTarget,progressive29.app),probeStatus=probeTarget.effects[0];probeStatus.stacks=2;
              const plainTarget=structuredClone(probeTarget);plainTarget.effects=[];
              const attacker={team:'e',slot:4,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',atk:1000000,catk:1000000,matk:1000000,crit:0,def:1,tdef:1,mdef:1,effects:[]};
              const seed=progressiveBattle.seed;progressiveBattle.seed=67890;const plainHit=c.p2Hit(structuredClone(attacker),plainTarget,'physical',1);
              progressiveBattle.seed=67890;const markedHit=applied?c.p2Hit(structuredClone(attacker),probeTarget,'physical',1):null;progressiveBattle.seed=seed;
              const expectedFactor=1+progressiveMagnitude*2;
              checks.mobileSourceProgressiveVulnerabilityInNativeCombat=event?.skill===progressive29.skill.name&&event?.mode==='skill'&&markedStatus.turns===progressiveTurns&&
                afterOwnTurn?.stacks===2&&markedTargets.length>0&&markedHit?.amount>plainHit?.amount&&
                Math.abs(Number(markedHit.amount)/Math.max(1,Number(plainHit.amount))-expectedFactor)<.01;
              checks.mobileSourceProgressiveVulnerabilityDiagnostics={sample:progressive29,sourceEvent:event,markedSlots:markedTargets.map(unit=>unit.slot),initialStacks:markedStatus.stacks,afterOwnTurn:afterOwnTurn?.stacks,plainHit,markedHit,expectedFactor};
            }else {checks.mobileSourceProgressiveVulnerabilityInNativeCombat=false;checks.mobileSourceProgressiveVulnerabilityDiagnostics={sample:progressive29,event,markedTargets:progressiveBattle.p.map(unit=>({slot:unit.slot,effects:unit.effects}))};}
          }else {checks.mobileSourceProgressiveVulnerabilityInNativeCombat=false;checks.mobileSourceProgressiveVulnerabilityDiagnostics={battle:!!progressiveBattle,caster:!!progressiveCaster,sample:progressive29};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const fortuneBattle65=launchStatusProbe(fortune65,true),fortuneCaster65=fortuneBattle65?.e?.find(unit=>unit.slot===fortune65?.slot);
          if(fortuneBattle65&&fortuneCaster65){
            const application=fortuneCaster65.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='65');if(application)application.chance=1;
            fortuneCaster65.morale=100;q.perform(fortuneCaster65);
            const sourceEvent=fortuneBattle65.events.at(-1),fortuneStatus=fortuneCaster65.effects.find(effect=>effect.mobileSource?.sourceEffectId==='65');
            const maximum=fortuneStatus?.mobileSourceValues?.maxDamageMultiplier;
            fortuneCaster65.morale=40;q.perform(fortuneCaster65);const actionEvent=fortuneBattle65.events.at(-1),draw=actionEvent?.mobileSourceFateDamageMultiplier;
            const plainTarget={team:'p',slot:0,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',def:1,tdef:1,mdef:1,effects:[]},fateTarget=structuredClone(plainTarget);
            const plainAttacker={team:'e',slot:4,hp:1000000000000,maxHp:1000000000000,alive:true,morale:40,type:'infantry',troop:'infantry',atk:1000000,catk:1000000,matk:1000000,crit:0,def:1,tdef:1,mdef:1,effects:[]},fateAttacker={...plainAttacker,nlMobileFateDamageMultiplier:draw||1};
            const seed=fortuneBattle65.seed;fortuneBattle65.seed=112233;const plainHit=c.p2Hit(plainAttacker,plainTarget,'physical',1);
            fortuneBattle65.seed=112233;const fateHit=c.p2Hit(fateAttacker,fateTarget,'physical',1);fortuneBattle65.seed=seed;
            checks.mobileSourceFortuneInNativeCombat=sourceEvent?.skill===fortune65.skill.name&&fortuneStatus?.turns===fortuneTurns&&
              fortuneStatus?.mobileSourceValues?.maxDamageMultiplier===fortuneMaximum&&actionEvent?.mode==='normal'&&
              Number.isInteger(draw)&&draw>=1&&draw<=fortuneMaximum&&!fortuneCaster65.nlMobileFateDamageMultiplier&&
              Math.abs(Number(fateHit?.amount)/Math.max(1,Number(plainHit?.amount))-draw)<.02;
            checks.mobileSourceFortuneDiagnostics={sample:fortune65,sourceEvent,actionEvent:{mode:actionEvent?.mode,draw:actionEvent?.mobileSourceFateDamageMultiplier,hit:actionEvent?.hits?.[0]},fortuneStatus,maximum,plainHit,fateHit};
          }else {checks.mobileSourceFortuneInNativeCombat=false;checks.mobileSourceFortuneDiagnostics={battle:!!fortuneBattle65,caster:!!fortuneCaster65,sample:fortune65};}
          q.closeBattle('city');
          const heavenlyFireBattle=launchStatusProbe(heavenlyFire68,true),heavenlyFireCaster=heavenlyFireBattle?.e?.find(unit=>unit.slot===heavenlyFire68?.slot);
          if(heavenlyFireBattle&&heavenlyFireCaster){
            for(const unit of heavenlyFireBattle.p){unit.hp=unit.maxHp=1000000000000;unit.alive=true;}
            for(const unit of heavenlyFireBattle.e)if(unit.nlMobileTroop)unit.nlMobileTroop.strikeBack=0;
            const fireApplication=heavenlyFireCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='68');
            if(fireApplication)fireApplication.chance=1;
            heavenlyFireCaster.morale=100;q.perform(heavenlyFireCaster);
            const fireSourceEvent=heavenlyFireBattle.events.at(-1),fireTargets=heavenlyFireBattle.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='68'));
            const fireTarget=fireTargets[0],fireStatus=fireTarget?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='68');
            const fireAppliedTurns=fireStatus?.turns;
            const cleanseRemoved=fireTarget?c.mobileBookCleanse(fireTarget,99):null;
            if(fireStatus)fireStatus.mobileSourceValues.spreadChance=1;
            const fireHpBefore=fireTarget?.hp;
            if(fireTarget){fireTarget.morale=40;q.perform(fireTarget);}
            const fireActionEvent=heavenlyFireBattle.events.at(-1),periodicHit=fireActionEvent?.hits?.find(hit=>hit.mobilePeriodic&&hit.team===fireTarget?.team&&hit.slot===fireTarget?.slot);
            const fireSide=fireTarget?.team==='p'?heavenlyFireBattle.p:heavenlyFireBattle.e;
            const spreadTarget=fireSide?.find(unit=>unit!==fireTarget&&unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='68'));
            checks.mobileSourceHeavenlyFireInNativeCombat=fireSourceEvent?.skill===heavenlyFire68?.skill?.name&&fireSourceEvent?.mode==='skill'&&
              fireTargets.length>0&&fireAppliedTurns===heavenlyFire68?.app?.turns&&periodicHit?.amount>0&&fireTarget.hp<fireHpBefore&&
              periodicHit.amount===Math.floor(fireHpBefore*heavenlyFire68.app.values.currentTroopLossRatio);
            checks.mobileSourceHeavenlyFireUnremovable=!!fireTarget&&cleanseRemoved===0&&fireTarget.effects.includes(fireStatus)&&
              fireStatus?.mobileSource?.dispelPolicy==='unremovable';
            checks.mobileSourceHeavenlyFireSpreads=!!fireTarget&&!!spreadTarget&&fireActionEvent?.description?.includes('Thiên Hỏa lây sang')&&
              spreadTarget.effects.find(effect=>effect.mobileSource?.sourceEffectId==='68')?.mobileSource?.dispelPolicy==='unremovable';
            checks.mobileSourceHeavenlyFireDiagnostics={sample:{mapId:heavenlyFire68.mapId,npcId:heavenlyFire68.npcId,skill:heavenlyFire68.skill,app:heavenlyFire68.app},
              fireSourceEvent,fireTargets:fireTargets.map(unit=>unit.slot),cleanseRemoved,fireActionEvent:{mode:fireActionEvent?.mode,periodicHit,description:fireActionEvent?.description},
              fireHpBefore,fireHpAfter:fireTarget?.hp,spreadSlots:fireSide?.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='68')).map(unit=>unit.slot)};
          }else {checks.mobileSourceHeavenlyFireInNativeCombat=false;checks.mobileSourceHeavenlyFireUnremovable=false;checks.mobileSourceHeavenlyFireSpreads=false;
            checks.mobileSourceHeavenlyFireDiagnostics={battle:!!heavenlyFireBattle,caster:!!heavenlyFireCaster,sample:heavenlyFire68};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const octagramBattle=launchStatusProbe(octagram123,true),octagramCaster=octagramBattle?.e?.find(unit=>unit.slot===octagram123?.slot);
          if(octagramBattle&&octagramCaster){
            for(const unit of [...octagramBattle.p,...octagramBattle.e]){unit.hp=unit.maxHp=1000000000000;unit.alive=true;if(unit.nlMobileTroop)unit.nlMobileTroop.strikeBack=0;}
            const octagramApplication=octagramCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='123');
            if(octagramApplication)octagramApplication.chance=1;
            const expectedOctagramAllies=c.mobileSourceApplicationTargets(octagramCaster,{actorTeam:'e',hits:[]},octagram123.app,octagramCaster.nlCDescriptor);
            octagramCaster.morale=100;q.perform(octagramCaster);
            const octagramSourceEvent=octagramBattle.events.at(-1),protectedAlly=octagramBattle.e.find(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='123'));
            const protectedStatus=protectedAlly?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='123'),protectedAppliedTurns=protectedStatus?.turns;
            const playerAttacker=octagramBattle.p[0],enemyHpBefore=octagramBattle.e.map(unit=>unit.hp),playerHpBefore=octagramBattle.p.map(unit=>unit.hp);
            for(const unit of octagramBattle.e)if(unit!==protectedAlly)unit.hp=0;
            playerAttacker.morale=40;playerAttacker.atk=playerAttacker.catk=playerAttacker.matk=1000000000;
            q.perform(playerAttacker);
            const octagramHitEvent=octagramBattle.events.at(-1),blockedHit=octagramHitEvent?.hits?.find(hit=>hit.team==='e'&&hit.slot===protectedAlly?.slot&&hit.mobileSourceShieldBlocked),redirectedHit=octagramHitEvent?.hits?.find(hit=>hit.mobileSourceRedirect&&hit.mobileSourceEffectId==='123');
            const redirectVictim=redirectedHit&&octagramBattle.p.find(unit=>unit.slot===redirectedHit.slot);
            checks.mobileSourceOctagramNativeRedirect=octagramSourceEvent?.skill===octagram123.skill.name&&octagramSourceEvent?.mode==='skill'&&
              protectedAlly&&expectedOctagramAllies.length===1&&expectedOctagramAllies[0]===protectedAlly&&protectedAppliedTurns===octagram123.app.turns&&protectedAlly.hp===1000000000000&&
              blockedHit?.amount===0&&!!redirectedHit&&redirectedHit.amount>0&&redirectedHit.amount===redirectedHit.mobileSourceRedirectAmount&&
              redirectVictim?.hp===playerHpBefore[redirectVictim.slot]-redirectedHit.amount&&
              !protectedAlly.effects.some(effect=>effect.mobileSource?.sourceEffectId==='123')&&octagramHitEvent.description.includes('Bát Quái chuyển');
            checks.mobileSourceOctagramTargetPolicy=octagram123.app.scope==='lowest-ally'&&expectedOctagramAllies.length===1&&
              expectedOctagramAllies[0]===protectedAlly&&enemyHpBefore.length===octagramBattle.e.length;
            checks.mobileSourceOctagramDiagnostics={sample:{mapId:octagram123.mapId,npcId:octagram123.npcId,skill:octagram123.skill,app:octagram123.app},
              octagramSourceEvent,protected:{slot:protectedAlly?.slot,turns:protectedAppliedTurns,hp:protectedAlly?.hp},
              octagramHitEvent:{actor:octagramHitEvent?.actor,mode:octagramHitEvent?.mode,description:octagramHitEvent?.description,hits:octagramHitEvent?.hits},
              redirectVictim:{slot:redirectVictim?.slot,hp:redirectVictim?.hp},playerHpBefore};
          }else {checks.mobileSourceOctagramNativeRedirect=false;checks.mobileSourceOctagramTargetPolicy=false;
            checks.mobileSourceOctagramDiagnostics={battle:!!octagramBattle,caster:!!octagramCaster,sample:octagram123};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const revivalBattle=launchStatusProbe(revival152,true),revivalCaster=revivalBattle?.e?.find(unit=>unit.slot===revival152?.slot);
          if(revivalBattle&&revivalCaster){
            for(const unit of [...revivalBattle.p,...revivalBattle.e]){unit.hp=unit.maxHp=1000000000000;unit.alive=true;if(unit.nlMobileTroop)unit.nlMobileTroop.strikeBack=0;}
            const revivalApplication=revivalCaster.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='152');
            if(revivalApplication)revivalApplication.chance=1;
            revivalCaster.morale=100;q.perform(revivalCaster);
            const revivalSourceEvent=revivalBattle.events.at(-1),revivalTarget=[...revivalBattle.p,...revivalBattle.e].find(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='152'));
            const revivalStatus=revivalTarget?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='152'),revivalInitialStacks=revivalStatus?.stacks;
            const revivalProbe={team:'p',slot:8,hp:500,maxHp:1000,alive:true,effects:[]};
            const revivalStackFirst=c.applyMobileSourceStatus(revivalProbe,revival152.app),revivalStackSecond=c.applyMobileSourceStatus(revivalProbe,revival152.app);
            const revivalExpectedStacks=revival152.app.values.stackCount*2;
            let revivalHpBefore=0,revivalDamageHit=null,revivalHealHit=null,revivalActionEvent=null;
            if(revivalTarget){
              const revivalTeam=revivalTarget.team==='p'?revivalBattle.p:revivalBattle.e,attackerTeam=revivalTarget.team==='p'?revivalBattle.e:revivalBattle.p;
              for(const unit of revivalTeam)if(unit!==revivalTarget)unit.hp=0;
              revivalTarget.hp=revivalTarget.maxHp/2;revivalTarget.def=revivalTarget.tdef=revivalTarget.mdef=0;
              const revivalAttacker=attackerTeam.find(unit=>unit.hp>0);
              if(revivalAttacker){revivalAttacker.morale=40;revivalAttacker.atk=revivalAttacker.catk=revivalAttacker.matk=1000000000;
                revivalHpBefore=revivalTarget.hp;q.perform(revivalAttacker);revivalActionEvent=revivalBattle.events.at(-1);
                revivalDamageHit=revivalActionEvent?.hits?.find(hit=>hit.team===revivalTarget.team&&hit.slot===revivalTarget.slot&&hit.amount>0&&!hit.heal);
                revivalHealHit=revivalActionEvent?.hits?.find(hit=>hit.team===revivalTarget.team&&hit.slot===revivalTarget.slot&&hit.mobileSourceRevival&&hit.heal);}
            }
            const revivalRemaining=revivalTarget?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='152')?.stacks||0;
            checks.mobileSourceRevivalNativeCombat=revivalSourceEvent?.skill===revival152.skill.name&&revivalSourceEvent?.mode==='skill'&&
              revivalTarget&&revivalInitialStacks===revival152.app.values.stackCount&&revivalDamageHit?.amount>0&&revivalHealHit?.amount===revival152.app.values.healPerConsumedStack&&
              revivalTarget.hp===revivalHpBefore-revivalDamageHit.amount+revivalHealHit.amount&&revivalRemaining===Math.max(0,revivalInitialStacks-1)&&
              revivalActionEvent?.description?.includes('Hồi Xuân hồi quân');
            checks.mobileSourceRevivalStacking=revivalStackFirst&&revivalStackSecond&&revivalProbe.effects[0]?.stacks===revivalExpectedStacks&&
              revivalProbe.effects[0]?.mobileSource?.dispelPolicy==='unknown'&&revival152.app.stackingClassification==='SIMULATED_ADDITIVE_STACKS_CAP_99';
            checks.mobileSourceRevivalDiagnostics={sample:{mapId:revival152.mapId,npcId:revival152.npcId,skill:revival152.skill,app:revival152.app},
              revivalSourceEvent,revivalInitialStacks,revivalDamageHit,revivalHealHit,revivalHpBefore,revivalHpAfter:revivalTarget?.hp,revivalRemaining,
              revivalActionEvent:{actor:revivalActionEvent?.actor,mode:revivalActionEvent?.mode,description:revivalActionEvent?.description}};
          }else {checks.mobileSourceRevivalNativeCombat=false;checks.mobileSourceRevivalStacking=false;
            checks.mobileSourceRevivalDiagnostics={battle:!!revivalBattle,caster:!!revivalCaster,sample:revival152};}
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          const silenceBattle=launchStatusProbe(silence184),silenceCaster=silenceBattle?.e?.find(unit=>unit.slot===silence184?.slot);
          if(silenceBattle&&silenceCaster){
            for(const unit of silenceBattle.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}
            silenceCaster.morale=100;q.perform(silenceCaster);
            const sourceEvent=silenceBattle.events.at(-1),silencedTarget=silenceBattle.p.find(unit=>unit.hp>0&&unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='184'));
            if(silencedTarget){silencedTarget.morale=100;q.perform(silencedTarget);const targetEvent=silenceBattle.events.at(-1);
              checks.mobileSourceSilenceInNativeCombat=sourceEvent?.skill===silence184.skill.name&&sourceEvent?.mode==='skill'&&
                targetEvent?.actor===silencedTarget.name&&targetEvent?.mode==='normal'&&
                silencedTarget.effects.some(effect=>effect.mobileSource?.sourceEffectId==='184'&&effect.turns===silence184.app.turns);
              checks.mobileSourceSilenceDiagnostics={sample:{mapId:silence184.mapId,npcId:silence184.npcId,npcIndex:silence184.npcIndex,slot:silence184.slot,skill:silence184.skill,app:silence184.app},sourceEvent,target:{name:silencedTarget.name,morale:silencedTarget.morale,effects:silencedTarget.effects}};
            }else {checks.mobileSourceSilenceInNativeCombat=false;checks.mobileSourceSilenceDiagnostics={sourceEvent,sample:{npcId:silence184.npcId,slot:silence184.slot,skill:silence184.skill,app:silence184.app},players:silenceBattle.p.map(unit=>({name:unit.name,hp:unit.hp,effects:unit.effects}))};}
          }else {checks.mobileSourceSilenceInNativeCombat=false;checks.mobileSourceSilenceDiagnostics={battle:!!silenceBattle,caster:!!silenceCaster,sample:silence184};}
          q.closeBattle('city');
          function compareSourceDefense(battleState,attacker,target,sourceId,kind,attackField,guardField){
            const plain=structuredClone(target),reduced=structuredClone(target),sourceActor=structuredClone(attacker);
            plain.effects=plain.effects.filter(effect=>effect.mobileSource?.sourceEffectId!==sourceId);
            sourceActor[attackField]=1000000;sourceActor.crit=0;
            for(const unit of [plain,reduced]){unit[guardField]=1000000;unit.hp=unit.maxHp=100000000;unit.alive=true;}
            const seed=battleState.seed;battleState.seed=123456;const plainHit=c.p2Hit(sourceActor,plain,kind,1);
            battleState.seed=123456;const reducedHit=c.p2Hit(sourceActor,reduced,kind,1);battleState.seed=seed;
            return {plain:plainHit?.amount||0,reduced:reducedHit?.amount||0};
          }
          const cb=launchStatusProbe(controlProbe),ca=cb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Cường Tập');
          if(cb&&ca){const app=ca.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='2');app.chance=1;ca.morale=100;q.perform(ca);
            const event=cb.events.at(-1),hit=event?.hits?.find(row=>row.team==='p'),target=hit&&cb.p.find(unit=>unit.slot===hit.slot),control=target?.effects.find(effect=>effect.kind==='mobile-source-control');
            checks.mobileSourceControlInNativeCombat=event?.skill==='Cường Tập'&&!!control&&control.turns===1&&control.mobileSource?.sourceEffectId==='2'&&c.p2StatusValue(control,'skipActionChance')===1;
            if(target){target.morale=0;q.perform(target);checks.mobileSourceControlExpires=cb.events.at(-1)?.mode==='stunned'&&!target.effects.some(effect=>effect.kind==='mobile-source-control');}
            else checks.mobileSourceControlExpires=false;
          }else {checks.mobileSourceControlInNativeCombat=false;checks.mobileSourceControlExpires=false;}
          q.closeBattle('city');
          const gb=launchStatusProbe(guardProbe),ga=gb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Thủ Hộ');
          if(gb&&ga){const app=ga.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='4');app.chance=1;ga.morale=100;q.perform(ga);
            const guarded=gb.e.filter(unit=>unit.effects.some(effect=>effect.kind==='mobile-source-incoming')),
              defender=guarded[0],status=defender?.effects.find(effect=>effect.kind==='mobile-source-incoming'),attacker=gb.p[0];
            const oldRandom=window.p2Random,plain=defender&&structuredClone(defender),shielded=defender&&structuredClone(defender);window.p2Random=()=>.5;
            if(plain&&shielded){attacker.atk=1000000;plain.effects=plain.effects.filter(effect=>effect.kind!=='mobile-source-incoming');plain.hp=plain.maxHp;shielded.hp=shielded.maxHp;
              const plainHit=c.p2Hit(attacker,plain,'physical',1),guardedHit=c.p2Hit(attacker,shielded,'physical',1);
              checks.mobileSourceGuardInNativeCombat=guarded.length===gb.e.filter(unit=>unit.hp>0).length&&c.p2StatusFactor(defender,'incomingDamageMultiplier')===.65&&status?.mobileSource?.sourceEffectId==='4'&&guardedHit.amount<plainHit.amount;
            }else checks.mobileSourceGuardInNativeCombat=false;
            window.p2Random=oldRandom;
          }else checks.mobileSourceGuardInNativeCombat=false;
          q.closeBattle('city');
          const fb=launchStatusProbe(noBuffProbe),fa=fb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Bách Lý Truy Hồn');
          if(fb&&fa){const app=fa.nlCDescriptor.sourceApplications.find(row=>row.sourceId==='77');app.chance=1;fa.morale=100;
            for(const unit of fb.p){unit.hp=unit.maxHp=100000000;unit.alive=true;c.p2Status(unit,'mobile-source-incoming',2);}
            const priorHit=fb.events.length;q.perform(fa);const ev=fb.events.at(-1),hit=ev?.hits?.find(row=>row.team==='p'),target=hit&&fb.p.find(unit=>unit.slot===hit.slot);
            const status=target?.effects.find(effect=>effect.kind==='mobile-source-no-buffs');
            checks.mobileSourceNoBuffInNativeCombat=ev?.actor===fa.name&&fb.events.length===priorHit+1&&!!status&&status.turns===5&&
              status.mobileSource?.sourceEffectId==='77'&&target.effects.some(effect=>effect.kind==='mobile-source-incoming')&&
              !c.p2Status(target,'mobile-source-attack-up',2)&&fa.morale===130&&ev.hits.some(row=>row.slot===target.slot&&row.team==='p')&&
              fa.effects.some(effect=>effect.mobileSource?.sourceEffectId==='5'&&effect.turns===3)&&
              fa.effects.some(effect=>effect.mobileSource?.sourceEffectId==='49'&&effect.turns===3&&c.p2StatusValue(effect,'outgoingDamageMultiplier')===1.15);
            const plainTarget=structuredClone(target),plainActor=structuredClone(fa);
            plainActor.effects=plainActor.effects.filter(effect=>!['5','49'].includes(effect.mobileSource?.sourceEffectId));
            plainActor.crit=0;
            const sourceBuffHits=Array.from({length:16},()=>c.p2Hit(fa,structuredClone(target),'physical',1)),plainHit=c.p2Hit(plainActor,plainTarget,'physical',1);
            checks.mobileSourceCriticalInNativeCombat=sourceBuffHits.some(hit=>hit.crit)&&!plainHit.crit;
            checks.mobileSourceAttackIncreaseInNativeCombat=Math.abs(c.p2StatusFactor(fa,'outgoingDamageMultiplier')-1.15)<1e-9;
            checks.mobileSourceCriticalCombatDiagnostics={sourceCrits:sourceBuffHits.filter(hit=>hit.crit).length,sourceAmount:sourceBuffHits[0]?.amount,plain:{crit:plainHit.crit,amount:plainHit.amount},
              sourceCrit:fa.crit,critBonus:fa.effects.find(effect=>effect.mobileSource?.sourceEffectId==='5')?.mobileSourceValues?.criticalChanceAdd,
              sourceAttack:c.p2StatusFactor(fa,'outgoingDamageMultiplier')};
            const attackStack=fa.effects.find(effect=>effect.mobileSource?.sourceEffectId==='49');
            checks.mobileSourceStackingAdapter=!!attackStack&&c.p2Status(fa,attackStack.kind,3)&&attackStack.stacks===2&&
              Math.abs(c.p2StatusValue(attackStack,'outgoingDamageMultiplier')-1.3)<1e-9;
            checks.mobileSourceNoBuffCombatDiagnostics={npcId:noBuffProbe.npcId,skill:fa.nlMobileSource?.sourceSkillName,morale:fa.morale,
              apps:fa.nlCDescriptor.sourceApplications,event:{actor:ev.actor,kind:ev.kind,mode:ev.mode,hits:ev.hits},
              target:target?{hp:target.hp,effects:target.effects}:null};
          }else checks.mobileSourceNoBuffInNativeCombat=false;
          q.closeBattle('city');
          const db=launchStatusProbe(defenseProbe),da=db?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Chấn Kích');
          if(db&&da){for(const unit of db.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}da.morale=100;q.perform(da);
            const defenseEvent=db.events.at(-1),affected=db.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='18')),
              physicalTarget=affected[0],physicalCompare=physicalTarget&&compareSourceDefense(db,da,physicalTarget,'18','physical','atk','def'),
              magicCompare=physicalTarget&&compareSourceDefense(db,da,physicalTarget,'18','magic','matk','mdef');
            checks.mobileSourceDefenseInNativeCombat=defenseEvent?.skill==='Chấn Kích'&&affected.length===db.p.filter(unit=>unit.hp>0).length&&
              affected.every(unit=>unit.effects.find(effect=>effect.mobileSource?.sourceEffectId==='18')?.turns===3&&
                unit.effects.find(effect=>effect.mobileSource?.sourceEffectId==='18')?.mobileSourceValues?.incomingPhysicalDefenseMultiplier===.5)&&
              physicalCompare?.reduced>physicalCompare?.plain&&magicCompare?.reduced===magicCompare?.plain;
          }else checks.mobileSourceDefenseInNativeCombat=false;
          q.closeBattle('city');
          const mb=launchStatusProbe(magicDefenseProbe),ma=mb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Đãng Bình');
          if(mb&&ma){for(const unit of mb.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}ma.morale=100;q.perform(ma);
            const event=mb.events.at(-1),hit=event?.hits?.find(row=>row.team==='p'),target=hit&&mb.p.find(unit=>unit.slot===hit.slot),status=target?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='19'),
              magicCompare=target&&compareSourceDefense(mb,ma,target,'19','magic','matk','mdef'),physicalCompare=target&&compareSourceDefense(mb,ma,target,'19','physical','atk','def');
            checks.mobileSourceMagicDefenseInNativeCombat=event?.skill==='Đãng Bình'&&!!status&&status.turns===2&&status.mobileSourceValues?.incomingMagicDefenseMultiplier===.75&&
              magicCompare?.reduced>magicCompare?.plain&&physicalCompare?.reduced===physicalCompare?.plain;
          }else checks.mobileSourceMagicDefenseInNativeCombat=false;
          q.closeBattle('city');
          const tacticBattle=launchStatusProbe(tacticDefenseProbe),ta=tacticBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Long Tức');
          if(tacticBattle&&ta){for(const unit of tacticBattle.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}ta.morale=100;q.perform(ta);
            const event=tacticBattle.events.at(-1),hit=event?.hits?.find(row=>row.team==='p'),target=hit&&tacticBattle.p.find(unit=>unit.slot===hit.slot),status=target?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='20'),
              tacticCompare=target&&compareSourceDefense(tacticBattle,ta,target,'20','tactic','catk','tdef'),magicCompare=target&&compareSourceDefense(tacticBattle,ta,target,'20','magic','matk','mdef');
            checks.mobileSourceTacticDefenseInNativeCombat=event?.skill==='Long Tức'&&event?.kind==='tactic'&&!!status&&status.turns===2&&
              status.mobileSourceValues?.incomingTacticDefenseMultiplier===.6&&tacticCompare?.reduced>tacticCompare?.plain&&magicCompare?.reduced===magicCompare?.plain;
          }else checks.mobileSourceTacticDefenseInNativeCombat=false;
          q.closeBattle('city');
          const healBattle=launchStatusProbe(healingReductionProbe),healActor=healBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Tru Tâm');
          if(healBattle&&healActor){for(const unit of healBattle.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}healActor.matk=1000000;healActor.morale=100;q.perform(healActor);
            const event=healBattle.events.at(-1),hit=event?.hits?.find(row=>row.team==='p'),target=hit&&healBattle.p.find(unit=>unit.slot===hit.slot),status=target?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='30');
            if(target){const plain=structuredClone(target);plain.effects=plain.effects.filter(effect=>effect.mobileSource?.sourceEffectId!=='30');
              plain.hp=0;target.hp=0;const fullHeal=c.p2Heal(healActor,plain,1),reducedHeal=c.p2Heal(healActor,target,1);
              checks.mobileSourceHealingReductionInNativeCombat=event?.skill==='Tru Tâm'&&!!status&&status.turns===2&&status.mobileSourceValues?.incomingHealingMultiplier===.5&&
                fullHeal.amount>0&&reducedHeal.amount===Math.round(fullHeal.amount*.5);
            }else checks.mobileSourceHealingReductionInNativeCombat=false;
          }else checks.mobileSourceHealingReductionInNativeCombat=false;
          q.closeBattle('city');
          const lifeBattle=launchStatusProbe(lifestealProbe),lifeActor=lifeBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Thị Chiến');
          if(lifeBattle&&lifeActor){for(const unit of lifeBattle.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}lifeActor.morale=100;q.perform(lifeActor);
            const status=lifeActor.effects.find(effect=>effect.mobileSource?.sourceEffectId==='31');lifeActor.hp=lifeActor.maxHp-500000;
            const hit=c.p2Hit(lifeActor,lifeBattle.p[0],'physical',1),healed=lifeActor.hp-(lifeActor.maxHp-500000),expected=Math.min(500000,Math.floor(hit.amount*.2));
            checks.mobileSourceLifestealInNativeCombat=!!status&&status.turns===3&&status.mobileSourceValues?.lifestealDamageMultiplier===.2&&
              hit.amount>0&&healed===expected&&hit.mobileSourceHealing===expected;
          }else checks.mobileSourceLifestealInNativeCombat=false;
          q.closeBattle('city');
          const shieldBattle=launchStatusProbe(shieldProbe),shieldActor=shieldBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Bích Lũy');
          if(shieldBattle&&shieldActor){for(const unit of shieldBattle.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}
            const shieldApp=shieldActor.nlCDescriptor.sourceApplications.find(app=>app.sourceId==='37');if(shieldApp)shieldApp.chance=1;
            shieldActor.morale=100;q.perform(shieldActor);const shielded=shieldBattle.e.find(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='37')),
              status=shielded?.effects.find(effect=>effect.mobileSource?.sourceEffectId==='37'),attacker=shieldBattle.p[0],
              allLivingShieldedBeforeHit=shieldBattle.e.filter(unit=>unit.hp>0).every(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='37'));attacker.atk=1000000;
            if(shielded&&status){const before=shielded.hp,blocked=c.p2Hit(attacker,shielded,'physical',1),afterBlock=shielded.hp,nextHit=c.p2Hit(attacker,shielded,'physical',1);
              checks.mobileSourceOneHitShieldInNativeCombat=allLivingShieldedBeforeHit&&
                status.turns===2&&blocked.mobileSourceShieldBlocked===true&&blocked.amount===0&&afterBlock===before&&
                !shielded.effects.some(effect=>effect.mobileSource?.sourceEffectId==='37')&&nextHit.amount>0&&shielded.hp<before;
            }else checks.mobileSourceOneHitShieldInNativeCombat=false;
          }else checks.mobileSourceOneHitShieldInNativeCombat=false;
          q.closeBattle('city');
          const pb=launchStatusProbe(purificationProbe),pa=pb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Long Uy');
          if(pb&&pa){
            for(const unit of pb.p){unit.hp=unit.maxHp=100000000;unit.alive=true;unit.effects=[];c.p2Status(unit,'mobile-source-incoming',8);c.p2Status(unit,'mobile-source-attack-up',8);}
            const oldRandom=window.p2Random;pa.morale=100;q.perform(pa);
            const firstEvent=pb.events.at(-1),purification=pa.effects.find(effect=>effect.mobileSource?.sourceEffectId==='46');
            pa.morale=100;q.perform(pa);const secondEvent=pb.events.at(-1);
            const plainActor=structuredClone(pa),buffedActor=structuredClone(pa),plainTarget=structuredClone(pb.p[0]);
            plainActor.effects=plainActor.effects.filter(effect=>effect.mobileSource?.sourceEffectId!=='46');plainActor.crit=buffedActor.crit=0;
            plainActor.matk=buffedActor.matk=1000000;
            plainActor.nlMobileSourceSkillAction=buffedActor.nlMobileSourceSkillAction=true;
            plainTarget.effects=[];c.p2Status(plainTarget,'mobile-source-incoming',8);c.p2Status(plainTarget,'mobile-source-attack-up',8);
            plainTarget.hp=plainTarget.maxHp=100000000;plainTarget.alive=true;plainTarget.mdef=0;
            const seed=pb.seed;pb.seed=123456;const plainHit=c.p2Hit(plainActor,plainTarget,'magic',1);
            const purifiedTarget=structuredClone(plainTarget);purifiedTarget.hp=purifiedTarget.maxHp=100000000;pb.seed=123456;
            const purifiedHit=c.p2Hit(buffedActor,purifiedTarget,'magic',1);pb.seed=seed;
            const plainDamage=plainHit?.amount||0,purifiedDamage=purifiedHit?.amount||0;
            checks.mobileSourcePurificationInNativeCombat=firstEvent?.skill==='Long Uy'&&secondEvent?.skill==='Long Uy'&&!!purification&&
              purification.turns>0&&purification.mobileSourceValues?.damageBonusPerBeneficialBuff===.2&&
              plainDamage>0&&purifiedDamage>plainDamage&&Math.abs(purifiedDamage/plainDamage-1.4)<.08;
            checks.mobileSourcePurificationDiagnostics={npcId:purificationProbe?.npcId,turns:purification?.turns,detail:purification?.mobileSource?.sourceDetail,
              firstHits:firstEvent?.hits,secondHits:secondEvent?.hits,plainMean:plainDamage,purifiedMean:purifiedDamage,
              buffCount:2,expectedMultiplier:1.4,observedMultiplier:plainDamage?purifiedDamage/plainDamage:null};
            window.p2Random=oldRandom;
          }else{checks.mobileSourcePurificationInNativeCombat=false;checks.mobileSourcePurificationDiagnostics={probe:purificationProbe,launched:!!pb,actor:!!pa};}
          q.closeBattle('city');
          const xb=launchStatusProbe(deathProbe),xa=xb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Tử Thần');
          if(xb&&xa){xa.morale=100;for(const unit of xb.p){unit.hp=unit.maxHp=100000000;unit.alive=true;}q.perform(xa);
            const deathEvent=xb.events.at(-1),deathHit=deathEvent?.hits?.find(row=>row.team==='p'),survivor=deathHit&&xb.p.find(unit=>unit.slot===deathHit.slot),control=survivor?.effects.find(effect=>effect.kind==='mobile-source-control');
            checks.mobileSourceConditionalControlInNativeCombat=deathEvent?.skill==='Tử Thần'&&survivor?.hp>0&&!!control&&control.turns===1&&
              control.mobileSource?.sourceEffectId==='2'&&xa.morale===63;
            checks.mobileSourceConditionalControlDiagnostics={skill:deathEvent?.skill,morale:xa.morale,branch:xa.nlCDescriptor?.sourceConditionalMorale,
              hit:deathHit,target:survivor?{hp:survivor.hp,effects:survivor.effects}:null};
          }else {checks.mobileSourceConditionalControlInNativeCombat=false;checks.mobileSourceConditionalControlDiagnostics={probe:deathProbe,descriptor:deathDescriptor};}
          q.closeBattle('city');
          const kb=launchStatusProbe(deathProbe),ka=kb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Tử Thần');
          if(kb&&ka){ka.morale=100;for(const unit of kb.p){unit.hp=1;unit.alive=true;}q.perform(ka);
            const killEvent=kb.events.at(-1),killHit=killEvent?.hits?.find(row=>row.team==='p'),victim=killHit&&kb.p.find(unit=>unit.slot===killHit.slot);
            checks.mobileSourceConditionalKillInNativeCombat=killEvent?.skill==='Tử Thần'&&victim?.hp===0&&
              !victim.effects.some(effect=>effect.kind==='mobile-source-control')&&ka.morale===130;
          }else checks.mobileSourceConditionalKillInNativeCombat=false;
          q.closeBattle('city');
          const vb=launchStatusProbe(physicalBuffProbe),va=vb?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Lợi Nhẫn');
          if(vb&&va){va.morale=100;q.perform(va);const vectorEvent=vb.events.at(-1),vectorStatuses=vb.e.flatMap(unit=>unit.effects.filter(effect=>effect.mobileSource?.sourceEffectId==='9'));
            const vectorStatus=va.effects.find(effect=>effect.mobileSource?.sourceEffectId==='9'),baseActor=structuredClone(va);
            va.atk=baseActor.atk=1000000;va.crit=baseActor.crit=0;baseActor.effects=baseActor.effects.filter(effect=>effect.mobileSource?.sourceEffectId!=='9');
            const testTarget=structuredClone(vb.p[0]);testTarget.hp=testTarget.maxHp=1000000000;testTarget.def=testTarget.tdef=testTarget.mdef=0;
            const buffedHit=c.p2Hit(va,structuredClone(testTarget),'physical',1),plainHit=c.p2Hit(baseActor,structuredClone(testTarget),'physical',1);
            checks.mobileSourceAttackVectorInNativeCombat=vectorEvent?.skill==='Lợi Nhẫn'&&vectorStatuses.length===vb.e.filter(unit=>unit.hp>0).length&&
              vectorStatus?.turns===2&&vectorStatus.mobileSourceValues?.physicalDamageMultiplier===1.25&&buffedHit.amount>plainHit.amount;
          }else checks.mobileSourceAttackVectorInNativeCombat=false;
          q.closeBattle('city');
          const dragonBattle=launchStatusProbe(dragonBuffProbe),dragonActor=dragonBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Chúa Lâm');
          if(dragonBattle&&dragonActor){dragonActor.morale=100;q.perform(dragonActor);const dragonEvent=dragonBattle.events.at(-1),dragonStatuses=dragonBattle.e.flatMap(unit=>unit.effects.filter(effect=>effect.mobileSource?.sourceEffectId==='70')),
              dragonStatus=dragonActor.effects.find(effect=>effect.mobileSource?.sourceEffectId==='70');
            checks.mobileSourceDragonBuffInNativeCombat=dragonEvent?.skill==='Chúa Lâm'&&dragonStatuses.length===dragonBattle.e.filter(unit=>unit.hp>0).length&&
              dragonStatus?.turns===2&&dragonStatus.mobileSourceValues?.outgoingDamageMultiplier===1.2&&c.p2StatusFactor(dragonActor,'outgoingDamageMultiplier')===1.2;
          }else checks.mobileSourceDragonBuffInNativeCombat=false;
          q.closeBattle('city');
          const allDefenseBattle=launchStatusProbe(allDefenseProbe),allDefenseActor=allDefenseBattle?.e?.find(unit=>unit.nlMobileSource?.sourceSkillName==='Đoạn Lương Phá Trận');
          if(allDefenseBattle&&allDefenseActor){allDefenseActor.morale=100;q.perform(allDefenseActor);const defenseEvent=allDefenseBattle.events.at(-1),reduced=allDefenseBattle.p.filter(unit=>unit.effects.some(effect=>effect.mobileSource?.sourceEffectId==='21'));
            checks.mobileSourceAllDefenseInNativeCombat=defenseEvent?.skill==='Đoạn Lương Phá Trận'&&reduced.length===allDefenseBattle.p.filter(unit=>unit.hp>0).length&&
              reduced.every(unit=>unit.effects.find(effect=>effect.mobileSource?.sourceEffectId==='21')?.turns===3&&c.p2StatusFactor(unit,'incomingDefenseMultiplier')===.25);
          }else checks.mobileSourceAllDefenseInNativeCombat=false;
          q.closeBattle('city');q.setGame(beforeStatusProbe);
          document.querySelector('.nav[data-tab="city"]')?.click();
          checks.tower=c.startTower()&&q.debugBattle()?.nlContentC?.floor===21&&q.getGame().activity.towerTries===2;
          const tb=q.debugBattle(),towerBefore=q.getGame(),expected=c.towerRewards(21),soulBefore=c.state().soul,towerMeritBefore=q.getGame().nlClassicA.merit;
          checks.towerPlanInNativeBattle=tb?.e.length===3&&tb?.nlContentC?.arcId===plans[0].arcId&&tb?.nlContentC?.aiStyle===plans[0].aiStyle;
          if(tb){const styles=[];for(const style of ['pressure','counter','finish','protect']){tb.nlContentC.aiStyle=style;c.towerTarget(tb.e[0],'front');styles.push(tb.aiDecisionLog?.at(-1)?.style);}tb.nlContentC.aiStyle=plans[0].aiStyle;checks.towerAIUsesArcDoctrine=new Set(styles).size===4&&tb.stage===1;}
          if(tb){for(const u of tb.e)u.hp=0;if(!tb.finished)q.finishBattle();}
          const towerAfter=q.getGame(),towerReport=towerAfter.battleReports[0];
          checks.towerNativeSettlement=!!tb?.won&&c.floor()===21&&c.state().extraFloor===1&&c.state().soul===soulBefore+expected.soul&&
            towerAfter.silver-towerBefore.silver===expected.silver&&towerAfter.grain-towerBefore.grain===expected.grain&&
            towerReport?.nlContentC?.floor===21&&towerReport?.nlContentC?.rank==='Thường';
          checks.towerMerit=towerAfter.nlClassicA.merit-towerMeritBefore===57&&towerReport?.nlContentC?.meritAward===57;
          const settled=[towerAfter.silver,towerAfter.grain,towerAfter.prestige,c.floor(),c.state().soul,towerAfter.battleReports.length];
          q.finishBattle();const towerRepeated=q.getGame();
          checks.towerNoDuplicate=JSON.stringify(settled)===JSON.stringify([towerRepeated.silver,towerRepeated.grain,towerRepeated.prestige,c.floor(),c.state().soul,towerRepeated.battleReports.length]);
          q.closeBattle('city');
          checks.seals=c.seals()===25&&c.sealReady('1001')&&c.sealLevel('1002')===1&&!('unlockSeal'in c)&&!('equipSeal'in c);
          checks.panels=c.panels().every(x=>x.includes('data-nlc-panel'))&&c.panels().some(x=>x.includes('mobile-troops'));
          const exactMapBonus=c.mapBonus('wiki-map-1');
          checks.mobileCampaignAchievement=exactMapBonus?.sourceExact===true&&exactMapBonus.silver===140&&exactMapBonus.gold===10&&Number.isSafeInteger(q.getGame().gold);
          const campaignGateBefore=q.getGame(),campaignTarget=c.map('wiki-map-3')?.npcs?.[0];
          const belowGate=JSON.parse(JSON.stringify(campaignGateBefore));belowGate.nlContentC.mobileCommanderLevel=29;q.setGame(belowGate);
          const campaignLocked=!!campaignTarget&&!c.readyNpc(campaignTarget.id);
          const atGate=q.getGame();atGate.nlContentC.mobileCommanderLevel=30;q.setGame(atGate);
          checks.mobileSourceUnlock=campaignLocked&&!!campaignTarget&&c.readyNpc(campaignTarget.id)&&c.state().mobileCommanderLevel===30;
          q.setGame(campaignGateBefore);
          checks.saveV5=q.getGame().version===5&&c.floor()===21&&c.state().soul===soulBefore+expected.soul;
          // Test repeat victory through the same native settlement path; not a balance claim.
          const repeatGame=q.getGame();repeatGame.silver=1000000;repeatGame.grain=1000000;
          repeatGame.hero[id].troops=3000;repeatGame.nlClassicA.orders=60;q.setGame(repeatGame);
          const beforeRepeat=q.getGame(),repeatSoul=c.state().soul,repeatReward=c.npcReward(n.id),repeatMeritBefore=q.getGame().nlClassicA.merit;
          checks.repeatLaunch=c.canReplayNpc(n.id)&&c.startNpc(n.id,true)&&q.debugBattle()?.nlContentC?.repeat===true;
          const rb=q.debugBattle();if(rb){for(const u of rb.e)u.hp=0;if(!rb.finished)q.finishBattle();}
          const afterRepeat=q.getGame();
          checks.repeatSettlement=!!rb?.won&&c.npcRepeatCount(n.id)===1&&c.state().soul===repeatSoul&&rb.report?.rewards?.silver===repeatReward.silver;
          checks.repeatMerit=afterRepeat.nlClassicA.merit-repeatMeritBefore===c.npcMerit(n.id)&&rb.report?.nlContentC?.meritAward===c.npcMerit(n.id);
          q.finishBattle();checks.repeatOnce=q.getGame().silver===afterRepeat.silver&&c.npcRepeatCount(n.id)===1&&q.getGame().nlClassicA.merit===afterRepeat.nlClassicA.merit;
          q.closeBattle('city');
          const cap=q.getGame();cap.nlContentC.npcRepeat[n.id]=3;q.setGame(cap);
          checks.repeatCap=!c.canReplayNpc(n.id)&&!c.startNpc(n.id,true);
          const last=m.npcs.at(-1),mapGame=q.getGame();
          if(m.npcs.length>1){
            for(const x of m.npcs.slice(0,-1))mapGame.nlContentC.cleared[x.id]=true;
            delete mapGame.nlContentC.cleared[last.id];delete mapGame.nlContentC.mapsCleared[m.id];
            mapGame.hero[id].troops=3000;mapGame.nlClassicA.orders=60;q.setGame(mapGame);
            const mapSoul=c.state().soul,bonus=c.mapBonus(m.id);
            checks.mapLaunch=c.startNpc(last.id);const mb=q.debugBattle();
            if(mb){for(const u of mb.e)u.hp=0;if(!mb.finished)q.finishBattle();}
            checks.mapCompletion=!!mb?.won&&c.state().mapsCleared[m.id]===true&&c.state().soul===mapSoul+bonus.soul+(last.boss?15:5);
            const mapAfter=q.getGame();q.finishBattle();checks.mapOnce=q.getGame().silver===mapAfter.silver&&c.state().soul===mapSoul+bonus.soul+(last.boss?15:5);
            q.closeBattle('city');
          }
          const untouched=q.getGame(),legacy=JSON.parse(JSON.stringify(untouched));
          legacy.nlContentC={version:1,seals:{sword:true,precision:true,flame:true},sealLevels:{sword:5,precision:3,flame:4},sealActivations:{sword:7,precision:4,flame:5},equippedSeals:['sword','precision','flame']};
          q.setGame(legacy);const migrated=c.state();
          checks.sealMigration=c.sealLevel('1001')===5&&c.sealActivation('1001')===7&&c.sealLevel('1002')===3&&c.sealActivation('1002')===4&&migrated.mobileSealMigration?.version===2&&migrated.mobileSealMigration.aliases.length===3&&migrated.mobileSealMigration.legacyEquippedSnapshot.length===3;
          const sourceChecks=(()=>{const xs=c.sealCatalog(),raw=window.__NL_CONTENT_C_QA__.state(),cost=c.sealQuote(1,250),late=c.sealQuote(209,250),xung=c.sealStatsForRuntime('1002',1,0);return xs.length===25&&xs.every(x=>x.attributes.filter(a=>a.kind==='levelSeries').every(a=>a.series.length===250))&&cost.chienTich===66897820&&cost.hoPhu===9&&late.hoPhu===9&&xung[0].value===6&&xung[1].sourceValue===175&&xs[1].attributes[1].series[249]===56487&&c.sealActivationValue('1002',25)===2071;})();
          checks.sealSourceExact=sourceChecks;
          const sealGame=q.getGame();sealGame.nlContentC={version:1};sealGame.nlContentC.chienTich=100000000;sealGame.nlContentC.hoPhu=10;q.setGame(sealGame);
          const quote2=c.sealQuote(1,2);checks.sealUpgrade=c.upgradeSeal('1002',2)&&c.sealLevel('1002')===2&&q.getGame().nlContentC.chienTich===100000000-quote2.chienTich&&q.getGame().nlContentC.hoPhu===10;
          checks.sealLocked=!c.upgradeSeal('not-a-seal',2)&&!c.upgradeSeal('1002',251);
          const maxQuote=c.sealQuote(2,250),maxGame=q.getGame();maxGame.nlContentC.chienTich=maxQuote.chienTich;maxGame.nlContentC.hoPhu=maxQuote.hoPhu;q.setGame(maxGame);
          checks.sealMax=c.upgradeSeal('1002',250)&&c.sealLevel('1002')===250&&q.getGame().nlContentC.chienTich===0&&q.getGame().nlContentC.hoPhu===0&&c.sealQuote(1,250).chienTich===66897820;
          const activeGame=q.getGame();activeGame.formation='spear';q.setGame(activeGame);const strong=c.p2Unit(id,'p',0,1).catk;
          const weaker=q.getGame();weaker.nlContentC.mobileSealLevels['1002']=1;weaker.nlContentC.mobileSealActivations['1002']=0;q.setGame(weaker);
          const weak=c.p2Unit(id,'p',0,1).catk;checks.sealCombat=strong>weak+40&&c.sealActive('1018');
          const otherFormation=q.getGame();otherFormation.formation='shield';q.setGame(otherFormation);checks.sealFormationLinked=!c.sealActive('1018')&&c.sealActive('1002');
          const poor=q.getGame();poor.nlContentC.chienTich=10;poor.nlContentC.hoPhu=0;q.setGame(poor);const poorBefore=c.state();
          checks.sealAtomicFailure=!c.upgradeSeal('1002',250)&&c.sealLevel('1002')===1&&c.state().chienTich===poorBefore.chienTich&&c.state().hoPhu===poorBefore.hoPhu;
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.sealSave=c.sealLevel('1002')===1&&c.state().mobileSealSchema===2&&q.getGame().version===5;
          const adv=window.__NL_ADVANCED_QA__,hs=window.__NL_HERO_SYSTEMS_QA__,fg=q.getGame();
          fg.silver=100000;fg.grain=100000;fg.nlClassicA.merit=10000;
          fg.nlCity.levels.nl_city_manor=2;fg.hero[id].level=60;
          q.setGame(fg);
          const initialAtk=hs.unit(id).atk;
          checks.familyLocked=!adv.trainHeir(id,'martial')&&!adv.visitBond('unknown','martial');
          checks.bond=adv.visitBond(id,'martial')&&adv.visitBond(id,'martial')&&adv.visitBond(id,'martial')&&adv.familyProfile(id).bond.level===3&&!adv.visitBond(id,'strategy');
          checks.heir=adv.trainHeir(id,'martial')&&adv.familyProfile(id).heir.level===1&&Math.abs(adv.familyBonus(id).atk-.035)<1e-9;
          checks.familyCombat=hs.unit(id).atk>initialAtk;
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.familySave=adv.familyProfile(id).bond.level===3&&adv.familyProfile(id).heir.level===1&&q.getGame().version===5;
          const end=q.getGame();end.silver=500000;end.grain=500000;end.nlClassicA.merit=100000;
          end.hero[id].level=60;end.heroDevelopment.heroes[id].awakening={orange:true,gold:false};
          for(const k of Object.keys(end.heroDevelopment.materials))end.heroDevelopment.materials[k]=100;
          q.setGame(end);
          checks.ancientLocked=!hs.ancientUpgrade(id)&&!hs.illusionChoose(id,'assault');
          const eg=q.getGame();eg.heroDevelopment.heroes[id].awakening.gold=true;q.setGame(eg);
          const oldUnit=hs.unit(id),oldSilver=q.getGame().silver;
          checks.ancient=hs.ancientUpgrade(id)&&hs.state().heroes[id].ancientLevel===1&&q.getGame().silver===oldSilver-5000&&hs.unit(id).atk>oldUnit.atk;
          const ancient=hs.unit(id),beforeMode=q.getGame().silver;
          checks.illusion=hs.illusionChoose(id,'assault')&&hs.unit(id).atk>ancient.atk&&hs.unit(id).def<ancient.def&&q.getGame().silver===beforeMode-8000;
          checks.illusionSwitch=hs.illusionChoose(id,'guardian')&&hs.unit(id).def>ancient.def&&hs.illusionChoose(id,'none');
          const beforeFree=q.getGame().silver;
          checks.illusionReuse=hs.illusionChoose(id,'assault')&&q.getGame().silver===beforeFree&&!hs.illusionChoose(id,'assault');
          const oldManual=hs.materials().commandManual;
          checks.renewableMaterials=Array.from({length:5},()=>hs.materialBuy('commandManual')).every(Boolean)&&hs.materials().commandManual===oldManual+5&&!hs.materialBuy('commandManual')&&!hs.materialBuy('unknown');
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.endgameSave=hs.state().heroes[id].ancientLevel===1&&hs.state().heroes[id].illusionMode==='assault'&&hs.state().materialShop.counts.commandManual===5;
          const sk=q.getGame();sk.hero[id].level=60;sk.silver=100000;sk.nlClassicA.merit=10000;sk.heroDevelopment.heroes[id].skillLevel=1;q.setGame(sk);
          const base={tag:'QA',mult:1,drainMorale:20,applyChance:.3},beforeSkill=q.getGame();
          checks.skillUpgrade=c.mobileHeroSkill(id)?!hs.skillUpgrade(id)&&q.getGame().silver===beforeSkill.silver:hs.skillUpgrade(id)&&hs.state().heroes[id].skillLevel===2&&q.getGame().silver===beforeSkill.silver-500&&q.getGame().nlClassicA.merit===beforeSkill.nlClassicA.merit-20;
          // Exact Mobile skills reject paid simulated ranks; independently exercise the legacy scaling function.
          const exactSkill=c.mobileHeroSkill(id),afterSkill=q.getGame(),paidRank=hs.state().heroes[id].skillLevel;
          const paidDescriptor=hs.skillDescriptor(id,base);
          const scaleFixture=structuredClone(afterSkill);scaleFixture.heroDevelopment.heroes[id].skillLevel=2;q.setGame(scaleFixture);
          const scaled=hs.skillDescriptor(id,base),unscaled=hs.skillDescriptor(id,{...base,nlMobileHeroSkill:true});
          checks.skillScaling=paidRank===(exactSkill?1:2)&&paidDescriptor.mult===(exactSkill?1:1.035)&&scaled.mult===1.035&&scaled.drainMorale===21&&unscaled.mult===1&&unscaled.drainMorale===20&&base.mult===1;
          q.setGame(afterSkill);
          const train=q.getGame();train.hero[id].level=1;train.hero[id].xp=0;train.silver=100000;q.setGame(train);
          const cost=hs.trainQuote(id),trainingBefore=q.getGame().silver;
          checks.batchTrain=hs.trainBatch(id,5)&&q.getGame().silver===trainingBefore-cost.cost.silver*5&&q.getGame().hero[id].level>1&&!hs.trainBatch(id,99);
          checks.normalizedCurve=c.npcBaseStage(1)===1&&c.npcBaseStage(90)===28&&Array.from({length:89},(_,i)=>c.npcBaseStage(i+2)>=c.npcBaseStage(i+1)).every(Boolean);
          const activation=q.getGame();activation.nlContentC.chienTich=100000;activation.nlContentC.mobileSealLevels['1002']=1;activation.nlContentC.mobileSealActivations['1002']=0;q.setGame(activation);
          checks.sealActivation=Array.from({length:25},()=>c.activateSeal('1002')).every(Boolean)&&c.sealActivation('1002')===25&&c.sealActivationValue('1002',25)===2071&&c.state().chienTich===6250&&!c.activateSeal('1002');
          q.setGame(JSON.parse(JSON.stringify(q.getGame())));
          checks.activationSave=c.sealActivation('1002')===25&&q.getGame().version===5;
          return checks;
        }""")
        print(out,flush=True)
        if not out.get("mobileSourceDefenseUpExactAndStacked"):
            print("SOURCE DEFENSE DEBUG",out.get("mobileSourceDefenseDiagnostics"),flush=True)
        browser.close()
    assert out and all(out.values()) and not errors, (out,errors)
if __name__=="__main__":
    main()
