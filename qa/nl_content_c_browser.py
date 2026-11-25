#!/usr/bin/env python3
"""Content C live Chromium smoke; actual P2 launch, one action, and native settlement."""
from playwright.sync_api import sync_playwright
from nl_native_pve_a1_browser import open_page, errors

def main():
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
        page=open_page(browser)
        out=page.evaluate("""()=>{
          const q=window.__P2_QA__,c=window.__NL_CONTENT_C_QA__;
          if(!q||!c)return {loaded:false};
          const g=q.getGame(),id=g.roster[0];
          g.cleared=Array.from({length:28},(_,i)=>i+1);g.silver=1000000;g.grain=1000000;
          g.slots=[id,null,null,null,null,null,null,null,null];
          g.hero[id].troops=3000;g.hero[id].level=60;
          g.nlClassicA.orders=60;g.towerFloor=20;g.activity.towerTries=3;
          q.setGame(g);
          const plans=Array.from({length:80},(_,i)=>c.towerPlan(i+21));
          const styles=new Set(plans.map(p=>p?.aiStyle)),arcs=new Set(plans.map(p=>p?.arcId));
          const counts=plans.map(p=>p?.units.length),keys=plans.map(p=>p?.id);
          const planCoverage=plans.every((p,i)=>p&&p.floor===i+21&&p.units.every(u=>u.slot>=0&&u.slot<9&&u.role&&u.skill));
          const planCounts=counts.every((v,i)=>v===(i<10?3:i<30?4:5));
          const reward21=c.towerRewards(21),reward30=c.towerRewards(30),reward29=c.towerRewards(29);
          const checks={loaded:true,coverage:c.counts.maps===249&&c.counts.npcs===4903&&c.counts.runtimeHeroes===368&&c.tiers()===40,
            towerPlanCoverage:planCoverage&&new Set(keys).size===80&&arcs.size===8&&styles.size===4&&planCounts,
            towerBossRewards:plans.filter(p=>p.chapterBoss).length===8&&reward30.silver-reward29.silver>420&&reward30.soul>reward21.soul};
          const m=c.map('wiki-map-1'),n=m.npcs[0],orders=q.getGame().nlClassicA.orders;
          checks.nativeStart=c.startNpc(n.id);checks.oneOrder=q.getGame().nlClassicA.orders===orders-1;
          let b=q.debugBattle();
          checks.formation=b?.e.length===n.units.length&&b.e.every((e,i)=>e.slot===n.units[i][0]&&e.name===n.units[i][1]);
          if(!b)return checks;
          const enemy=b.e[0];enemy.morale=100;q.perform(enemy);
          checks.nativeAction=b.events.length===1;
          // Deterministic forced victory exercises the real native finish owner, not balance.
          for(const u of b.e)u.hp=0;
          if(!b.finished)q.finishBattle();
          const s=q.getGame(),report=b.report;
          checks.settlement=b.won&&c.state().cleared[n.id]===true&&s.cleared.length===28&&report?.nlContentC?.id===n.id&&report?.rewards?.iron===undefined;
          const balance=s.silver;q.finishBattle();checks.noDuplicate=q.getGame().silver===balance;
          q.closeBattle('city');
          checks.tower=c.startTower()&&q.debugBattle()?.nlContentC?.floor===21&&q.getGame().activity.towerTries===2;
          const tb=q.debugBattle(),towerBefore=q.getGame(),expected=c.towerRewards(21),soulBefore=c.state().soul;
          checks.towerPlanInNativeBattle=tb?.e.length===3&&tb?.nlContentC?.arcId===plans[0].arcId&&tb?.nlContentC?.aiStyle===plans[0].aiStyle;
          if(tb){const styles=[];for(const style of ['pressure','counter','finish','protect']){tb.nlContentC.aiStyle=style;c.towerTarget(tb.e[0],'front');styles.push(tb.aiDecisionLog?.at(-1)?.style);}tb.nlContentC.aiStyle=plans[0].aiStyle;checks.towerAIUsesArcDoctrine=new Set(styles).size===4&&tb.stage===1;}
          if(tb){for(const u of tb.e)u.hp=0;if(!tb.finished)q.finishBattle();}
          const towerAfter=q.getGame(),towerReport=towerAfter.battleReports[0];
          checks.towerNativeSettlement=!!tb?.won&&c.floor()===21&&c.state().extraFloor===1&&c.state().soul===soulBefore+expected.soul&&
            towerAfter.silver-towerBefore.silver===expected.silver&&towerAfter.grain-towerBefore.grain===expected.grain&&
            towerReport?.nlContentC?.floor===21&&towerReport?.nlContentC?.rank==='Thường';
          const settled=[towerAfter.silver,towerAfter.grain,towerAfter.prestige,c.floor(),c.state().soul,towerAfter.battleReports.length];
          q.finishBattle();const towerRepeated=q.getGame();
          checks.towerNoDuplicate=JSON.stringify(settled)===JSON.stringify([towerRepeated.silver,towerRepeated.grain,towerRepeated.prestige,c.floor(),c.state().soul,towerRepeated.battleReports.length]);
          q.closeBattle('city');
          checks.seals=c.unlockSeal('sword')&&c.equipSeal('sword')&&!c.unlockSeal('sword');
          checks.panels=c.panels().every(x=>x.includes('data-nlc-panel'));
          checks.saveV5=q.getGame().version===5&&c.floor()===21&&c.state().soul===soulBefore+expected.soul;
          return checks;
        }""")
        print(out,flush=True)
        browser.close()
    assert out and all(out.values()) and not errors, (out,errors)
if __name__=="__main__":
    main()
