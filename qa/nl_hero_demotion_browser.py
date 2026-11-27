#!/usr/bin/env python3
"""G02 Chromium flow: receipt-backed hero demotion, dependencies and Save v5."""
from __future__ import annotations
import json
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
from nl_browser_navigation import navigate_markup

ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
SAVE_KEY='muu_dinh_tam_quoc_v1'
TOKEN='mobile-vng-item-562'
STUB='''<script>window.__P2_ENABLE_QA__=true;const __store=__NL_STORE__;Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>Object.prototype.hasOwnProperty.call(__store,k)?__store[k]:null,setItem:(k,v)=>__store[k]=String(v),removeItem:k=>delete __store[k],clear:()=>Object.keys(__store).forEach(k=>delete __store[k])}});</script>'''
checks=[]
errors=[]

def check(name,value):
    ok=bool(value)
    checks.append({'name':name,'pass':ok})
    print(('PASS ' if ok else 'FAIL ')+name,flush=True)

def open_page(browser,stored=None):
    page=browser.new_page(viewport={'width':1280,'height':720})
    page.on('pageerror',lambda err:errors.append(str(err)))
    data={} if stored is None else {SAVE_KEY:stored}
    navigate_markup(page, HTML.replace('<script>',STUB.replace('__NL_STORE__',json.dumps(data,ensure_ascii=False))+'<script>',1),wait_until='domcontentloaded')
    page.wait_for_timeout(200)
    return page

def main():
    records=[
        {'id':'commander-1','system':'commander','heroId':'cao','level':1,'currency':{'silver':100,'merit':10},'materials':{'commandManual':2}},
        {'id':'ancient-1','system':'ancient','heroId':'cao','level':1,'currency':{'silver':5000,'merit':150},'materials':{'quynhTuong':1,'xichQua':1,'hoangTrungLy':1}},
        {'id':'illusion-assault','system':'illusion:assault','heroId':'cao','level':1,'currency':{'silver':8000,'merit':250},'materials':{'destinyJade':2,'blank':2}}
    ]
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
        page=open_page(browser)
        fixture=page.evaluate('''records=>{
          const q=window.__P2_QA__,g=q.getGame(),d=g.heroDevelopment;
          g.cleared=Array.from({length:28},(_,i)=>i+1);g.silver=0;g.nlClassicA.merit=0;g.lastTick=Date.now()+86400000;
          g.roster=[...new Set([...(g.roster||[]),'cao'])];g.hero=g.hero||{};g.hero.cao={...g.hero.cao,level:40,xp:0,troops:500};
          d.selectedHero='cao';d.selectedSystem='hero';
          d.heroes.cao={...d.heroes.cao,awakening:{orange:true,gold:true},commanderLevel:1,ancientLevel:1,illusionUnlocked:['assault'],illusionMode:'assault'};
          d.materials={commandManual:0,quynhTuong:0,xichQua:0,hoangTrungLy:0,destinyJade:0,blank:0};
          d.receipts=records;d.refundLedger.cao=records;
          g.nlItemsV1.stacks['mobile-vng-item-562']=1;
          q.setGame(g);const saved=q.persist();
          return {saved,version:q.getGame().version,token:q.getGame().nlItemsV1.stacks['mobile-vng-item-562'],unit:window.__NL_HERO_SYSTEMS_QA__.unit('cao')};
        }''',records)
        check('live fixture persisted with Save v5 and source reset token',fixture.get('saved') and fixture.get('version')==5 and fixture.get('token')==1)
        check('verified commander investment changes the actual P2 unit',fixture.get('unit',{}).get('nlhDevelopment',{}).get('commanderLevel')==1)
        page.locator('.nav[data-tab="heroes"]').click()
        page.locator('.nlh-system-button[data-nlh-target="awakening"]').click()
        button=page.locator('[data-nlh-action="developmentReset"][data-nlh-mode="562"]')
        check('Hạ Chức Lệnh-Cao is reachable and enabled for the owned hero',button.count()==1 and button.is_enabled() and '100%' in button.locator('xpath=..').inner_text())
        page.on('dialog',lambda dialog:dialog.accept())
        button.click();page.wait_for_timeout(150)
        after=page.evaluate('''()=>{
          const q=window.__P2_QA__,g=q.getGame(),h=g.heroDevelopment.heroes.cao;
          return {version:g.version,silver:g.silver,merit:g.nlClassicA.merit,materials:g.heroDevelopment.materials,
            hero:{commanderLevel:h.commanderLevel,ancientLevel:h.ancientLevel,illusionUnlocked:h.illusionUnlocked,illusionMode:h.illusionMode},
            token:g.nlItemsV1.stacks['mobile-vng-item-562']||0,receipts:g.heroDevelopment.receipts.length,
            receiptCount:Object.keys(g.nlItemsV1.receipts).length,
            unit:window.__NL_HERO_SYSTEMS_QA__.unit('cao'),saved:localStorage.getItem('muu_dinh_tam_quoc_v1')};
        }''')
        check('one live action refunds only recorded costs and clears dependent development',after['version']==5 and after['silver']==13100 and after['merit']==410 and after['materials']['commandManual']==2 and after['materials']['destinyJade']==2 and after['materials']['blank']==2 and after['hero']=={'commanderLevel':0,'ancientLevel':0,'illusionUnlocked':[],'illusionMode':None})
        check('reset token and all refunded receipts settle once',after['token']==0 and after['receipts']==0 and after['receiptCount']>=1)
        check('demotion removes its bonus from the actual P2 unit',after['unit'].get('nlhDevelopment',{}).get('commanderLevel')==0 and after['unit']['atk']<fixture['unit']['atk'])
        check('post-reset Save remains schema v5',after['saved'] and json.loads(after['saved'])['version']==5)
        restored=open_page(browser,after['saved'])
        row=restored.evaluate('''()=>{
          const g=window.__P2_QA__.getGame(),h=g.heroDevelopment.heroes.cao;
          return {version:g.version,silver:g.silver,merit:g.nlClassicA.merit,materials:g.heroDevelopment.materials,
            hero:{commanderLevel:h.commanderLevel,ancientLevel:h.ancientLevel,illusionUnlocked:h.illusionUnlocked,illusionMode:h.illusionMode},
            token:g.nlItemsV1.stacks['mobile-vng-item-562']||0,receipts:g.heroDevelopment.receipts.length,
            unit:window.__NL_HERO_SYSTEMS_QA__.unit('cao')};
        }''')
        check('browser reload preserves demotion, wallet, material and token state',row['version']==5 and row['silver']==after['silver'] and row['merit']==after['merit'] and row['materials']==after['materials'] and row['hero']==after['hero'] and row['token']==0 and row['receipts']==0 and row['unit'].get('nlhDevelopment',{}).get('commanderLevel')==0)
        check('no runtime exceptions during demotion and reload',not errors)
        browser.close()
    report={'milestone':'NL_G02_HERO_DEMOTION','total':len(checks),'passed':sum(x['pass'] for x in checks),'failed':[x['name'] for x in checks if not x['pass']],'pageErrors':errors}
    print(json.dumps(report,ensure_ascii=False),flush=True)
    return 0 if not report['failed'] else 1

if __name__=='__main__':
    raise SystemExit(main())
