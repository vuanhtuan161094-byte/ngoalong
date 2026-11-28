"""Real Chromium: 55 troop catalog has original source atlas thumbnails."""
from pathlib import Path
from playwright.sync_api import sync_playwright
from nl_native_pve_a1_browser import open_page,errors
ROOT=Path(__file__).resolve().parents[1]
def run():
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for width in (1280,390):
   page=open_page(browser,width=width)
   page.locator('.nav[data-tab="barracks"]').click()
   page.wait_for_function("window.__NL_ART_D2_QA__?.sourceReady()",timeout=120000)
   page.wait_for_function("document.querySelectorAll('#view .nlw-source-preview').length>=6",timeout=45000)
   count=page.locator('#view .nlw-source-preview').count()
   ids=page.locator('#view .nlw-source-preview').evaluate_all('(els)=>els.map(x=>x.dataset.sourceAtlas)')
   assert count>=6 and all(s.startswith('BZ') for s in ids),(width,count,ids)
   page.screenshot(path=str(ROOT/'qa'/f'wly2-barracks-{width}.png'),full_page=False)
   print('PASS source Barracks preview',width,count,ids,flush=True)
   page.close()
  assert not errors,errors
  browser.close()
if __name__=='__main__':run()
