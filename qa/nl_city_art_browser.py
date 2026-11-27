#!/usr/bin/env python3
"""Verify the original city scene is embedded offline and retains live buildings."""
from __future__ import annotations

from pathlib import Path
from playwright.sync_api import sync_playwright

from nl_native_pve_a1_browser import HTML, STUB

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "qa"
errors: list[str] = []


def open_city_page(browser, width: int):
    page = browser.new_page(viewport={"width": width, "height": 720 if width > 600 else 844})
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.add_init_script(STUB.replace("__NL_STORE__", "{}").removeprefix("<script>").removesuffix("</script>"))
    page.goto((ROOT / "index.html").as_uri(), wait_until="domcontentloaded", timeout=180000)
    return page


def read_scene(page):
    return page.evaluate("""async()=>{
      const q=window.__NL_CITY_ART_QA__,view=document.querySelector('.city-visual');
      const css=q?.background()||'',match=css.match(/url\\([\"']?(data:image\\/webp;base64,[^\"')]+)[\"']?\\)/);
      if(!match)return {ready:false,cssReady:q?.cssReady()||false};
      const image=new Image();image.src=match[1];await image.decode();
      return {ready:true,cssReady:q.cssReady(),source:q.source,width:image.naturalWidth,height:image.naturalHeight,
        label:view.querySelector('.p4-tag')?.textContent,
        buildings:[...view.querySelectorAll('[data-focus-building]')].map(button=>button.dataset.focusBuilding),
        box:view.getBoundingClientRect().toJSON(),pageWidth:document.documentElement.clientWidth,
        pageScrollWidth:document.documentElement.scrollWidth};
    }""")


def check(name: str, passed: bool) -> None:
    print(("PASS " if passed else "FAIL ") + name, flush=True)
    assert passed, name


def main() -> None:
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        desktop = open_city_page(browser, 1280)
        scene = read_scene(desktop)
        check("original 1400×788 WebP is embedded and decodes without a network request",
              scene["ready"] and scene["cssReady"] and scene["source"] == "image_gen.imagegen" and
              scene["width"] == 1400 and scene["height"] == 788)
        check("city scene retains all seven interactive buildings and updated art credit",
              {"palace","farm","market","mine","barracks","academy","tavern"}.issubset(set(scene["buildings"])) and
              scene["label"] == "THÀNH TRÌ · CẢNH THÀNH V1")
        desktop.locator(".city-visual").scroll_into_view_if_needed()
        desktop.screenshot(path=str(OUT / "nl-city-art-desktop.png"), full_page=False)
        desktop.locator('[data-focus-building="palace"]').click()
        check("capital building opens its real management detail",desktop.locator("#detail-building").is_visible() and
              "Thành Chính" in desktop.locator("#detail-building").inner_text())

        mobile = open_city_page(browser, 390)
        small = read_scene(mobile)
        check("390px mobile keeps the painted city and every building inside the viewport",
              small["ready"] and {"palace","farm","market","mine","barracks","academy","tavern"}.issubset(set(small["buildings"])) and
              small["box"]["left"] >= 0 and
              small["box"]["right"] <= small["pageWidth"] + 1 and small["pageScrollWidth"] <= small["pageWidth"] + 1)
        mobile.locator(".city-visual").scroll_into_view_if_needed()
        mobile.screenshot(path=str(OUT / "nl-city-art-mobile.png"), full_page=False)
        check("no browser runtime errors", not errors)
        browser.close()


if __name__ == "__main__":
    main()
