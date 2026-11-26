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
          const q=window.__P2_QA__,c=window.__NL_CONTENT_C_QA__;
          if(!q||!c)return {loaded:false};
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
          const planCoverage=plans.every((p,i)=>p&&p.floor===i+21&&p.units.every(u=>u.slot>=0&&u.slot<9&&u.role&&u.skill));
          const planCounts=counts.every((v,i)=>v===(i<10?3:i<30?4:5));
          const reward21=c.towerRewards(21),reward30=c.towerRewards(30),reward29=c.towerRewards(29);
          const checks={loaded:true,coverage:c.counts.maps===249&&c.counts.npcs===5063&&c.counts.legacyNpcCount===4903&&c.counts.runtimeHeroes===368&&c.tiers()===40,
            towerPlanCoverage:planCoverage&&new Set(keys).size===80&&arcs.size===8&&styles.size===4&&planCounts,
            towerBossRewards:plans.filter(p=>p.chapterBoss).length===8&&reward30.silver-reward29.silver>420&&reward30.soul>reward21.soul,
            mobileNpcSkillAudit:skillAudit.totalUnits===25195&&skillAudit.sourceExactUnits===23944&&
              skillAudit.sourceExactWithNameAndDescription===23944&&skillAudit.sourceExactSkillNames===694&&
              skillAudit.sourceExactDamageAdapted>5000&&skillAudit.sourceExactHealAdapted>1000&&
              skillAudit.sourceExactMoraleAdapted>0&&skillAudit.sourceEffectUnits===18250&&
              skillAudit.sourceEffectRows===36480&&skillAudit.sourceEffectIds===134&&skillAudit.sourceEffectNames===134&&
              skillAudit.simulatedFallback>0&&skillAudit.sourceEdition==='CURRENT_VNG_MOBILE_WIKI_VIETNAMESE'};
          checks.mobileNpcSkillAuditStats=skillAudit;
          const mobileRoles={infantry:'1',spear:'10',cavalry:'11',archer:'12',strategist:'13'};
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
          checks.skillUpgrade=hs.skillUpgrade(id)&&hs.state().heroes[id].skillLevel===2&&q.getGame().silver===beforeSkill.silver-500&&q.getGame().nlClassicA.merit===beforeSkill.nlClassicA.merit-20;
          checks.skillScaling=hs.skillDescriptor(id,base).mult===1.035&&hs.skillDescriptor(id,base).drainMorale===21&&base.mult===1;
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
        browser.close()
    assert out and all(out.values()) and not errors, (out,errors)
if __name__=="__main__":
    main()
