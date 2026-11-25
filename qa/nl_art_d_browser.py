"""Focused visual layer contract, no simulated gameplay assertions."""
import argparse
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description="Offline visual layer coverage for a canonical or review HTML build.")
parser.add_argument("--html",type=Path,default=root/"index.html")
html_path=parser.parse_args().html.resolve()
html=html_path.read_text(encoding="utf-8")
with sync_playwright() as p:
    chromium=shutil.which("chromium")
    browser=p.chromium.launch(headless=True,executable_path=chromium,args=["--no-sandbox","--disable-dev-shm-usage"] if chromium else [])
    for width,height in [(1280,720),(390,844)]:
        page=browser.new_page(viewport={"width":width,"height":height})
        errors=[]
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.set_content(html.replace("<script>","<script>window.__P2_ENABLE_QA__=true;",1),wait_until="domcontentloaded",timeout=120000)
        page.wait_for_function("Boolean(window.__NL_ART_D_QA__)")
        result=page.evaluate("""() => {
          const q=window.__NL_ART_D_QA__;
          const a=q.portrait('test-a'), b=q.portrait('test-b');
          return {heroes:q.count(),icons:q.icons.length,distinct:a!==b,
            offline:a.startsWith('data:image/svg+xml'),nav:document.querySelectorAll('.nav .nl-art-d-img').length,
            city:document.querySelectorAll('.building .nl-art-d-img').length,
            save:window.__P2_QA__.getGame().version};
        }""")
        assert result["heroes"]>=368 and result["icons"]>=14 and result["distinct"] and result["offline"],result
        assert result["nav"]>=14 and result["city"]>0 and result["save"]==5,result
        page.locator('.nav[data-tab="heroes"]').click()
        page.wait_for_function("document.querySelector('.nlh-profile h2') && document.querySelector('.nlh-character-character')?.complete")
        live_profile=page.evaluate("""() => ({
          name:document.querySelector('.nlh-profile h2')?.textContent.trim()||'',
          loaded:Boolean(document.querySelector('.nlh-character-character')?.naturalWidth>0),
          stableIdControl:Boolean(document.querySelector('[data-nlh-action="hero"][data-nlh-hero="zhao"]')||document.querySelector('[data-nlh-action="hero"][data-nlh-hero="liu"]'))
        })""")
        assert live_profile["name"] and live_profile["loaded"] and live_profile["stableIdControl"],live_profile
        hero_id="zhao" if page.locator('[data-nlh-action="hero"][data-nlh-hero="zhao"]').count() else "liu"
        page.locator('[data-nlh-action="hero"][data-nlh-hero="'+hero_id+'"]').click()
        page.locator('.nlh-art-tab[data-nlh-mode="portrait"]').click()
        page.wait_for_function("document.querySelector('.nlh-character-portrait')?.complete&&document.querySelector('.nlh-character-portrait')?.naturalWidth>0")
        zhao_portrait = page.evaluate("""() => {
          const q=window.__NL_ART_D_QA__;
          const image=document.querySelector('.nlh-character-portrait');
          const source=q.portrait('zhao');
          const imageSource=image?.src||'';
          return {registered:q.heroPortraitIds.includes('zhao'),
            sourceIsPng:source.startsWith('data:image/png;base64,'),
            imageSourceIsV5:Boolean(imageSource.startsWith('data:image/webp;base64,')||imageSource.startsWith('data:image/png;base64,')),
            title:image?.alt||'',loaded:Boolean(image?.complete&&image?.naturalWidth>0)};
        }""")
        assert zhao_portrait["registered"] and zhao_portrait["sourceIsPng"] \
            and zhao_portrait["imageSourceIsV5"] and zhao_portrait["loaded"],zhao_portrait
        wiki_portrait=page.evaluate("""() => {
          const q=window.__NL_ART_D_QA__;
          const source=q.portrait('wiki-mobile-hero-083');
          return {registered:q.heroPortraitIds.includes('wiki-mobile-hero-083'),sourceIsPng:source.startsWith('data:image/png;base64,'),sourceLength:source.length};
        }""")
        assert wiki_portrait["registered"] and wiki_portrait["sourceIsPng"] and wiki_portrait["sourceLength"]>1000,wiki_portrait
        result3=page.evaluate("""() => {
          const q=window.__NL_ART_D_QA__;
          return {maps:q.mapCount(),architecture:q.architecture('hall','Thành Chính')!==q.architecture('tower','Tháp'),
            terrain:q.landscape('wiki-map-1')!==q.landscape('wiki-map-2'),
            equipment:q.loot('a','weapon','rare')!==q.loot('b','armor','rare')};
        }""")
        assert result3["maps"]==249 and all(result3.values()),result3
        page.locator('.nav[data-tab="campaign"]').click()
        page.wait_for_function("document.querySelectorAll('[data-nlc-panel=campaign] h3 .nl-art-d4-scenic').length>0")
        page.wait_for_function("Array.from(document.querySelectorAll('.nl-art-d4-scenic')).every(i=>i.complete&&i.naturalWidth>0)")
        assert page.evaluate("document.documentElement.dataset.nlArtD==='v4' && Array.from(document.querySelectorAll('.nl-art-d4-scenic')).every(i=>i.src.startsWith('data:image/webp;base64,'))")
        page.locator('.nav[data-tab="equipment"]').click()
        page.wait_for_function("document.querySelectorAll('.nli-slot .nl-art-d-img').length>0")
        page.locator('.nav[data-tab="barracks"]').click()
        page.wait_for_function("document.querySelectorAll('.nlw-unit .nl-art-d-img').length>0")
        assert page.evaluate("document.documentElement.scrollWidth<=innerWidth+2")
        assert not errors,errors
        print("NL_ART_D/D3 PASS",width,result,result3,zhao_portrait,wiki_portrait)
        page.close()
    browser.close()
