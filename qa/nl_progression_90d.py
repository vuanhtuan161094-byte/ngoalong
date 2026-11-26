"""90-day earned-only progression: actual native production, recruitment, training, combat and Save.
Run independently from the UI/short-session gates. No injected inventory or currency.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from functools import partial
import json, shutil

ROOT=Path(__file__).resolve().parents[1]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
rows=[];errors=[]
CLOCK="""window.__P2_ENABLE_QA__=true;let virtualNow=Date.now();const NativeDate=Date;window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:[virtualNow]))}static now(){return virtualNow}};"""
try:
    with sync_playwright() as p:
        launch={'headless':True,'args':['--no-sandbox','--disable-dev-shm-usage']}
        if shutil.which('chromium'): launch['executable_path']=shutil.which('chromium')
        browser=p.chromium.launch(**launch);ctx=browser.new_context(viewport={'width':1280,'height':720})
        ctx.add_init_script(CLOCK);page=ctx.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(f'http://127.0.0.1:{server.server_port}/index.html',wait_until='domcontentloaded',timeout=120000)
        assert page.evaluate("!!window.__NL_CONTENT_C_QA__ && !!window.__NL_HERO_SYSTEMS_QA__")
        page.evaluate("""()=>{window.__NL_CLASSIC_A_QA__.recruit('zhao');window.__P3_QA__.assign('spear-van')}""")
        for day in range(1,91):
            row=page.evaluate("""day=>{const q=window.__P2_QA__,a=window.__NL_CLASSIC_A_QA__,h=window.__NL_HERO_SYSTEMS_QA__,r=window.__NL_R03_QA__,c=window.__NL_CONTENT_C_QA__;
              virtualNow+=86400000;r.tick();a.tax();
              let g=q.getGame();if(!g.roster.includes('huang')&&a.canRecruit('huang')){a.recruit('huang');window.__P3_QA__.assign('spear-van');}
              g=q.getGame();let train=0;for(const id of g.slots.filter(Boolean)){
                if(q.getGame().silver>5000&&h.trainBatch(id,5))train++;
                if(q.getGame().reserve<160&&q.getGame().silver>=600&&q.getGame().grain>=450)q.enlist();
                for(let i=0;i<3;i++){const v=q.getGame();if(v.reserve<=0||v.hero[id].troops>=280+v.buildings.barracks*70+v.hero[id].level*35)break;q.giveTroops(id);}
              }
              g=q.getGame();let stage=g.cleared.length+1,npc=null,won=null,valid=true;
              if(stage<=28)q.beginBattle(stage,'campaign');else{const next=c.nextNpc();npc=next?.n?.id||null;if(npc)c.startNpc(npc);}
              const b=q.debugBattle();if(b){b.seed=8675309+day*7919;q.skipBattle();won=b.won;const report=q.getGame().battleReports[0];valid=report?.troopLosses?.every(x=>x.initial-x.casualties===x.remaining)&&(!won?Object.keys(report.rewards||{}).length===0:true);q.closeBattle('city');}
              g=q.getGame();return {day,stage,npc,won,valid,train,cleared:g.cleared.length,mobile:Object.keys(g.nlContentC.cleared).length,silver:g.silver,grain:g.grain,reserve:g.reserve,orders:a.snapshot().orders,levels:g.slots.filter(Boolean).map(id=>g.hero[id].level),troops:g.slots.filter(Boolean).map(id=>g.hero[id].troops),version:g.version};
            }""",day)
            rows.append(row)
            if day%10==0 or day==1: print(json.dumps(row),flush=True)
        assert all(r['version']==5 and r['valid'] and min(r['silver'],r['grain'],r['reserve'],*r['troops'])>=0 for r in rows)
        assert rows[-1]['cleared']==28 and rows[-1]['mobile']>0,rows[-1]
        assert not errors,errors
        browser.close()
finally:
    (ROOT/'qa'/'NL_PROGRESSION_90D.json').write_text(json.dumps({'method':'earned-only native Chromium, 1 battle/day','rows':rows,'pageErrors':errors},ensure_ascii=False,indent=2))
    server.shutdown()
    server.server_close()
