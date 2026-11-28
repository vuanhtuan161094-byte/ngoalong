"""Actual premium hero system and combat shell smoke."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
from nl_native_pve_a1_browser import open_page,errors
OUT=Path(__file__).resolve().parent/"nl-premium-evidence"
OUT.mkdir(exist_ok=True)
screens=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=["--no-sandbox","--disable-dev-shm-usage"])
    for width,height in ((1280,720),(390,844)):
        page=open_page(browser,width=width)
        page.set_viewport_size({"width":width,"height":height})
        page.locator('.nav[data-tab="heroes"]').click()
        page.wait_for_function("document.querySelectorAll('.nlh-system-button').length===12",timeout=120000)
        for tab in ("hero","training","troops","commander","specialWeapon","inheritance","destiny","equipment","formation","rewards","recruit","awakening"):
            page.locator('.nlh-system-button[data-nlh-target="'+tab+'"]').click()
            page.wait_for_function("(t)=>document.querySelector('.nlh-root')?.dataset.premiumSystem===t",arg=tab)
            page.wait_for_timeout(300)
            assert page.locator(".nlh-main-body").count()==1
            assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+2")
            if tab=="troops":
                # Exercise the actual selected-hero control instead of merely checking a screenshot.
                owner=page.locator("[data-hero-troop-owner]").get_attribute("data-hero-troop-owner")
                assert owner==page.evaluate("__NL_HERO_SYSTEMS_QA__.state().selectedHero")
                assert page.locator("[data-hero-troop-preview] option").count()>0
                assert page.locator(".nl-hero-troop-stats div").count()==6
                candidate=page.evaluate("""(owner)=>Array.from(document.querySelectorAll('[data-hero-troop-preview] option')).map(o=>o.value).find(t=>__NL_CONTENT_C_QA__.mobileTroopCanSelect(owner,t))||null""",owner)
                if candidate:
                    before=page.evaluate("__P2_QA__.getGame().silver")
                    page.locator("[data-hero-troop-preview]").select_option(candidate)
                    page.locator("[data-hero-troop-confirm]").click()
                    assert page.evaluate("(owner)=>__NL_CONTENT_C_QA__.mobileTroopAssigned(owner)?.id",owner)==candidate
                    assert page.evaluate("(owner)=>__NL_HERO_SYSTEMS_QA__.unit(owner).nlMobileTroop?.id",owner)==candidate
                    assert page.evaluate("__P2_QA__.getGame().silver")<=before
                else:
                    assert page.locator("[data-hero-troop-confirm]").is_disabled()
            if tab=="commander":assert page.locator('[data-nlc-panel="mobile-elite"]').count()==1
            page.screenshot(path=str(OUT/f"{width}-{tab}.png"))
            screens.append(f"{width}-{tab}")
        page.evaluate("()=>{const q=__P2_QA__;q.beginBattle(1,'campaign');q.debugBattle().next=Date.now()+999999;q.stepBattle()}")
        page.wait_for_function("document.querySelector('.nl-premium-battle .nl-premium-versus')&&document.querySelector('#battle-canvas')")
        page.evaluate("()=>{__P41_QA__.setVisualElapsed(520);__P41_QA__.drawScene(performance.now())}")
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT/f"{width}-battle.png"))
        screens.append(f"{width}-battle")
        assert page.evaluate("__P2_QA__.getGame().version===5")
        page.close()
    browser.close()
assert not errors,errors
(OUT/"report.json").write_text(json.dumps({"screens":screens,"errors":errors,"status":"PASS"},indent=2))
print("Premium screens",len(screens),"PASS")
