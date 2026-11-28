#!/usr/bin/env python3
"""Focused live-browser A5-A9 integration. No external server or simulated combat solver."""
import sys
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from nl_native_pve_a1_browser import open_page, errors

ROOT=Path(__file__).resolve().parents[1]

def main():
    with sync_playwright() as p:
        chromium=shutil.which("chromium")
        browser=p.chromium.launch(headless=True,executable_path=chromium,args=["--no-sandbox","--disable-dev-shm-usage"])
        page=open_page(browser)
        result=page.evaluate("""()=>{
          const native=window.__P2_QA__,w=window.__NL_WORLD_A4_QA__,a=window.__NL_ADVANCED_QA__;
          if(!native||!w||!a)return {loaded:false};
          const g=native.getGame(),id=g.roster[0];
          g.silver=1000000;g.grain=1000000;g.prestige=2000;
          g.cleared=Array.from({length:24},(_,i)=>i+1);
          g.hero[id].level=40;g.hero[id].xp=0;
          if(g.nlClassicA){g.nlClassicA.merit=100000;g.nlClassicA.orders=60;}
          native.setGame(g);
          const checks={loaded:true,saveV5:native.getGame().version===5,
            office:w.move('xuchang')&&a.rankUp()&&a.salary()&&!a.salary(),
            guild:a.joinGuild()&&a.donate(),
            merchant:a.dispatch('horse')&&!a.collectDispatch(),
            growth:a.breakthrough(id)&&a.advancedTrain(id),
            achievement:a.achievement('advanced')&&!a.achievement('advanced'),
            ui:!!document.querySelector('[data-nla59-panel]')};
          const before=native.getGame().nlClassicA?.orders;
          checks.nativeWar=a.challenge('war','changan')&&native.debugBattle()?.mode==='campaign'&&native.getGame().nlClassicA?.orders===before-1;
          native.closeBattle('city');
          return checks;
        }""")
        print(result,flush=True)
        page.locator('.nav[data-tab="city"]').click()
        page.wait_for_timeout(100)
        screen_labels=page.locator('#nl-screen-select option').all_text_contents()
        advanced_page=next((i for i,label in enumerate(screen_labels) if 'Triều Chính' in label),None)
        if advanced_page is None:
            raise AssertionError(f'city screen selector is missing the advanced city window: {screen_labels}')
        page.locator('#nl-screen-select').select_option(str(advanced_page))
        page.wait_for_timeout(100)
        page.locator('[data-nla59-tab="treasure"]').click()
        page.screenshot(path=str(ROOT/'qa'/'nl-treasure-desktop.png'),full_page=False)
        routes=page.locator('[data-nla59-action="treasure"]').count()==3 and 'SIMULATED' in page.locator('[data-nla59-panel]').inner_text()
        page.locator('[data-nla59-action="treasure"][data-nla59-id="trade-road"]').click()
        started=page.evaluate("""()=>{
          const g=window.__P2_QA__.getGame(),t=g.nlClassicAdvanced?.treasure;
          return !!t?.job&&t.job.routeId==='trade-road'&&g.nlClassicAdvanced.daily.treasure===1&&
            t.lastTripAt>0&&Number.isSafeInteger(t.job.until);
        }""")
        page.evaluate("""()=>{
          const q=window.__P2_QA__,g=q.getGame();
          g.nlClassicAdvanced.treasure.job.until=Date.now()-1;q.setGame(g);
        }""")
        page.locator('[data-nla59-action="treasure-collect"]').click()
        treasure_result=page.evaluate("""()=>{
          const g=window.__P2_QA__.getGame(),t=g.nlClassicAdvanced.treasure;
          return {jobCleared:!t.job,oneDiscovery:t.discoveries.length===1,
            actualInventoryLoot:g.items.some(x=>x.base===t.discoveries[0]?.lootId),
            rewardReceipt:g.nlClassicAdvanced.receipts.some(x=>String(x.id).startsWith('treasure-collect:')),
            savedSchema:g.version===5};
        }""")
        treasure_result['routeUI']=routes
        treasure_result['startUI']=started
        print('Thám Bảo live UI',treasure_result,flush=True)
        mobile=open_page(browser,width=390)
        mobile.locator('.nav[data-tab="city"]').click();mobile.wait_for_timeout(80)
        mobile_labels=mobile.locator('#nl-screen-select option').all_text_contents()
        mobile_page=next((i for i,label in enumerate(mobile_labels) if 'Triều Chính' in label),None)
        if mobile_page is None:
            raise AssertionError(f'mobile city screen selector is missing the advanced city window: {mobile_labels}')
        mobile.locator('#nl-screen-select').select_option(str(mobile_page));mobile.wait_for_timeout(80)
        mobile.locator('[data-nla59-tab="treasure"]').click();mobile.wait_for_timeout(80)
        mobile_result=mobile.evaluate("""()=>({
          routes:document.querySelectorAll('[data-nla59-action="treasure"]').length===3,
          startVisible:!!document.querySelector('[data-nla59-action="treasure"][data-nla59-id="trade-road"]')?.getClientRects().length,
          noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+2,
          fixedViewport:document.documentElement.scrollHeight<=innerHeight+2
        })""")
        mobile.screenshot(path=str(ROOT/'qa'/'nl-treasure-mobile.png'),full_page=False)
        print('Thám Bảo mobile',mobile_result,flush=True)
        treasure_result['mobile']=all(mobile_result.values())
        mobile.close()
        browser.close()
    return 0 if result and all(result.values()) and all(treasure_result.values()) and not errors else 1

if __name__=='__main__':
    sys.exit(main())
