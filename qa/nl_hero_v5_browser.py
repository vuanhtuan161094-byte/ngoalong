#!/usr/bin/env python3
"""Focused Chromium check for V5 hero art switching, upgrade settlement and Save v5."""
from __future__ import annotations
import json
import shutil
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SAVE_KEY='muu_dinh_tam_quoc_v1'
STUB='''<script>window.__P2_ENABLE_QA__=true;const __store=__NL_STORE__;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(__store,k)?__store[k]:null,setItem:(k,v)=>__store[k]=String(v),removeItem:k=>delete __store[k],clear:()=>Object.keys(__store).forEach(k=>delete __store[k])}});</script>'''
checks=[];errors=[]
def check(name,ok):
    ok=bool(ok);checks.append({'name':name,'pass':ok});print(('PASS ' if ok else 'FAIL ')+name,flush=True)
def open_page(browser,width=1280,height=720,stored=None):
    page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
    page.on('pageerror',lambda err:errors.append(str(err)))
    store={} if stored is None else {SAVE_KEY:stored}
    page.set_content(HTML.replace('<script>',STUB.replace('__NL_STORE__',json.dumps(store,ensure_ascii=False))+'<script>',1),wait_until='domcontentloaded')
    page.wait_for_timeout(250)
    return page

def main():
  with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
    page=open_page(browser)
    page.locator('.nav[data-tab="heroes"]').click();page.wait_for_timeout(100)
    check('V5 hero screen has twelve development systems and custom vector navigation',page.locator('.nlh-system-button').count()==12 and page.locator('.nav[data-tab] .nl-nav-icon').count()==15)
    check('ten production hero IDs have portrait, splash and character art registered',page.evaluate("['cao','liu','guan','zhang','zhao','zhuge','lu','sun','ma','wiki-mobile-hero-083'].every(id=>Object.values(window.__NL_HERO_SYSTEMS_QA__.art(id)).every(Boolean))"))
    page.locator('.nav[data-tab="heroes"]').click();page.wait_for_timeout(100)
    check('V5 portraits load for the owned roster',page.locator('.nlh-portrait-card img').evaluate_all('xs=>xs.length>=3&&xs.every(x=>x.complete&&x.naturalWidth>0)'))
    for mode in ['portrait','splash','character']:
      page.locator('.nlh-art-tab[data-nlh-mode="'+mode+'"]').click();page.wait_for_timeout(80)
      check('hero art switch displays '+mode,page.locator('.nlh-character-'+mode).count()==1 and page.locator('.nlh-character-'+mode).evaluate('x=>x.complete&&x.naturalWidth>0'))
    page.locator('.nlh-art-tab[data-nlh-mode="character"]').click()
    g=page.evaluate('window.__P2_QA__.getGame()')
    for hero_id in ['cao','zhuge','lu','sun','ma']:
      if hero_id not in g['roster']:g['roster'].append(hero_id)
    g['hero']['cao']={'level':20,'xp':0,'troops':500}
    g['hero']['zhuge']={'level':20,'xp':0,'troops':500}
    g['hero']['lu']={'level':20,'xp':0,'troops':500}
    g['hero']['sun']={'level':20,'xp':0,'troops':500}
    g['hero']['ma']={'level':20,'xp':0,'troops':500}
    g['cleared']=list(range(1,29));g['silver']=500000;g['iron']=200000;g['gems']=10000
    g['nlClassicA']['merit']=5000;g['nlClassicA']['meritSpent']=0
    g['heroDevelopment']['selectedHero']='cao';g['heroDevelopment']['selectedSystem']='commander'
    g['heroDevelopment']['artModes']['cao']='character'
    g['heroDevelopment']['materials']['commandManual']=5
    g['lastTick']=page.evaluate('Date.now()+86400000')
    page.evaluate('g=>window.__P2_QA__.setGame(g)',g)
    page.locator('.nav[data-tab="heroes"]').click();page.wait_for_timeout(80)
    for hero_id,name in [('zhuge','Gia Cát Lượng'),('lu','Lữ Bố'),('sun','Tôn Thượng Hương'),('ma','Mã Siêu')]:
      page.locator('[data-nlh-action="hero"][data-nlh-hero="'+hero_id+'"]').click();page.wait_for_timeout(80)
      check(name+' V5 trio is selected from its stable hero ID',page.locator('.nlh-profile h2').inner_text()==name and page.locator('.nlh-character-character').evaluate('x=>x.complete&&x.naturalWidth>0'))
    page.locator('[data-nlh-action="hero"][data-nlh-hero="cao"]').click();page.wait_for_timeout(80)
    page.locator('.nlh-system-button[data-nlh-target="commander"]').click();page.wait_for_timeout(80)
    before=page.evaluate('window.__P2_QA__.getGame()')
    before_unit=page.evaluate("window.__NL_HERO_SYSTEMS_QA__.unit('cao')")
    page.locator('[data-nlh-action="upgrade"][data-nlh-system="commander"]').click();page.wait_for_timeout(100)
    after=page.evaluate('window.__P2_QA__.getGame()')
    after_unit=page.evaluate("window.__NL_HERO_SYSTEMS_QA__.unit('cao')")
    check('commander upgrade charges silver, iron, nested merit and its manual once',after['heroDevelopment']['heroes']['cao']['commanderLevel']==1 and before['silver']-after['silver']==1000 and before['iron']-after['iron']==80 and before['nlClassicA']['merit']-after['nlClassicA']['merit']==30 and before['heroDevelopment']['materials']['commandManual']-after['heroDevelopment']['materials']['commandManual']==1)
    check('commander bonus reaches actual combat units once',after_unit.get('nlhDevelopment',{}).get('commanderLevel')==1 and after_unit['atk']>before_unit['atk'] and after_unit['atk']==page.evaluate("window.__NL_HERO_SYSTEMS_QA__.unit('cao').atk"))
    check('Save v5 stores the art choice, level, receipt and material balance',after['version']==5 and after['heroDevelopment']['artModes']['cao']=='character' and after['heroDevelopment']['receipts'][-1]['system']=='commander' and '"version":5' in (page.evaluate("localStorage.getItem('muu_dinh_tam_quoc_v1')") or ''))
    saved=page.evaluate("localStorage.getItem('muu_dinh_tam_quoc_v1')")
    restored=open_page(browser,1280,720,saved)
    reloaded=restored.evaluate('window.__P2_QA__.getGame()')
    check('reload restores V5 development level and chosen art view',reloaded['heroDevelopment']['heroes']['cao']['commanderLevel']==1 and reloaded['heroDevelopment']['artModes']['cao']=='character')
    restored.locator('.nav[data-tab="heroes"]').click();restored.wait_for_timeout(80)
    check('desktop runtime screenshot shows the playable V5 heroine screen',restored.locator('.nlh-character-character').count()==1 and restored.locator('.nlh-portrait-card img').evaluate_all('xs=>xs.length>=5&&xs.every(x=>x.complete&&x.naturalWidth>0)'))
    Path('/tmp/ngoalong-v5-heroes').mkdir(exist_ok=True)
    restored.screenshot(path='/tmp/ngoalong-v5-heroes/1280x720_heroes_save.png',full_page=False)
    restored.locator('[data-nlh-action="hero"][data-nlh-hero="ma"]').click();restored.wait_for_timeout(100)
    for mode in ['character','portrait','splash']:
      if mode!='character':restored.locator('.nlh-art-tab[data-nlh-mode="'+mode+'"]').click()
      check('Mã Siêu V5 '+mode+' art is selectable and loads in the live profile',restored.locator('.nlh-character-'+mode).count()==1 and restored.locator('.nlh-character-'+mode).evaluate('x=>x.complete&&x.naturalWidth>0'))
      if mode!='splash':restored.locator('.nlh-art-tab[data-nlh-mode="character"]').click()
    restored.locator('.nlh-art-tab[data-nlh-mode="character"]').click()
    restored.screenshot(path=str(ROOT/'qa'/'nl-ma-chao-v5-desktop.png'),full_page=False)
    mobile=open_page(browser,390,844,saved);mobile.locator('.nav[data-tab="heroes"]').click();mobile.wait_for_timeout(100)
    check('390px V5 hero screen keeps all systems and avoids document overflow',mobile.locator('.nlh-system-button').count()==12 and mobile.evaluate('document.documentElement.scrollWidth<=innerWidth+2&&document.body.scrollHeight<=innerHeight+2'))
    mobile.locator('[data-nlh-action="hero"][data-nlh-hero="ma"]').click();mobile.wait_for_timeout(100)
    check('390px mobile view resolves Mã Siêu character art without clipping',mobile.locator('.nlh-character-character').count()==1 and mobile.locator('.nlh-character-character').evaluate('x=>x.complete&&x.naturalWidth>0'))
    mobile.screenshot(path=str(ROOT/'qa'/'nl-ma-chao-v5-mobile.png'),full_page=False)
    mobile.screenshot(path='/tmp/ngoalong-v5-heroes/390x844_heroes_save.png',full_page=False)
    check('no browser JavaScript exceptions across art switching, upgrade, reload and mobile',not errors)
    browser.close()
  report={'milestone':'NL_HERO_ART_V5_AND_GROWTH','total':len(checks),'passed':sum(x['pass'] for x in checks),'failed':[x['name'] for x in checks if not x['pass']],'pageErrors':errors}
  Path('/tmp/ngoalong-v5-heroes/hero_v5_browser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
  print(json.dumps(report,ensure_ascii=False),flush=True)
  return 0 if not report['failed'] else 1
if __name__=='__main__':sys.exit(main())
