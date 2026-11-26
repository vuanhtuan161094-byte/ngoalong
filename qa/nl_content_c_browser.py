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
          const checks={loaded:true,coverage:c.counts.maps===249&&c.counts.npcs===5063&&c.counts.legacyNpcCount===4903&&c.counts.runtimeHeroes===368&&c.counts.mobileBuffs===320&&c.mobileBuffCount()===320&&c.tiers()===40,
            towerPlanCoverage:planCoverage&&new Set(keys).size===80&&arcs.size===8&&styles.size===4&&planCounts,
            towerBossRewards:plans.filter(p=>p.chapterBoss).length===8&&reward30.silver-reward29.silver>420&&reward30.soul>reward21.soul,
            mobileNpcSkillAudit:skillAudit.totalUnits===25195&&skillAudit.sourceExactUnits===23944&&
              skillAudit.sourceExactWithNameAndDescription===23944&&skillAudit.sourceExactSkillNames===694&&
              skillAudit.sourceExactDamageAdapted>5000&&skillAudit.sourceExactHealAdapted>1000&&
              skillAudit.sourceExactMoraleAdapted>0&&skillAudit.sourceEffectUnits===18250&&
              skillAudit.sourceEffectRows===36480&&skillAudit.sourceEffectIds===134&&skillAudit.sourceEffectNames===134&&
              skillAudit.sourceStatusAdapted>3000&&skillAudit.sourceStatusAdaptedUnits>3000&&skillAudit.sourceStatusIds===24&&
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
          checks.mobileSourceDefenseStatusCoverage=skillAudit.sourceStatusIds===24;
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
          checks.mobileSourcePurificationDescriptor=appOf(purificationDescriptor,'46')?.scope==='self'&&appOf(purificationDescriptor,'46')?.turns===2&&
            appOf(purificationDescriptor,'46')?.values.damageBonusPerBeneficialBuff===.2&&
            appOf(purificationHighDescriptor,'46')?.scope==='self'&&appOf(purificationHighDescriptor,'46')?.turns===2&&
            appOf(purificationHighDescriptor,'46')?.values.damageBonusPerBeneficialBuff===1;
          checks.mobileSourcePurificationCoverage=skillAudit.sourceStatusIds===24;
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
          function launchStatusProbe(probe){
            if(!probe)return null;const map=c.map(probe.mapId),g=JSON.parse(JSON.stringify(beforeStatusProbe));
            g.nlContentC.mobileCommanderLevel=440;g.nlClassicA.orders=60;g.hero[id].troops=3000;
            for(const prev of map.npcs.slice(0,probe.npcIndex))g.nlContentC.cleared[prev.id]=true;
            delete g.nlContentC.cleared[probe.npcId];q.setGame(g);
            return c.startNpc(probe.npcId)?q.debugBattle():null;
          }
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
