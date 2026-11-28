#!/usr/bin/env python3
"""Chromium smoke for original audio settings, local persistence and mobile layout."""
from __future__ import annotations

import json
from playwright.sync_api import sync_playwright

from nl_native_pve_a1_browser import HTML, STUB, errors, open_page

AUDIO_KEY = "muu_dinh_tam_quoc_audio_v1"


def open_audio_page(browser, local_store: dict[str, str], width: int):
    page = browser.new_page(viewport={"width": width, "height": 720 if width > 600 else 844})
    page.on("pageerror", lambda error: errors.append(str(error)))
    stub = STUB.replace("__NL_STORE__", json.dumps(local_store, ensure_ascii=False))
    from pathlib import Path
    page.add_init_script(stub.removeprefix('<script>').removesuffix('</script>'))
    page.goto((Path(__file__).resolve().parents[1]/'index.html').as_uri(),wait_until='domcontentloaded',timeout=180000)
    return page


def check(name: str, value: bool) -> None:
    print(("PASS " if value else "FAIL ") + name, flush=True)
    assert value, name


def main() -> None:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox", "--disable-dev-shm-usage"])
        page = open_page(browser, width=1280)
        check("settings has a dedicated navigation entry", page.locator('.nav[data-tab="settings"]').count() == 1)
        page.locator('.nav[data-tab="settings"]').click()
        check("audio controls render inside the settings screen", page.locator("[data-nl-audio-settings]").is_visible())

        before = page.evaluate("""() => ({
          save:JSON.stringify(window.__P2_QA__.getGame()),
          saveVersion:window.__P2_QA__.getGame().version,
          audioAvailable:window.__NL_AUDIO_QA__?.available()===true
        })""")
        check("Web Audio is available without external media", before["audioAvailable"])
        page.locator("[data-nlaudio-effects]").evaluate("el=>{el.value='43';el.dispatchEvent(new Event('input',{bubbles:true}))}")
        page.locator("[data-nlaudio-music]").check()
        page.locator("[data-nlaudio-mute]").check()
        muted_play = page.evaluate("window.__NL_AUDIO_QA__.play('preview')")
        page.locator("[data-nlaudio-mute]").uncheck()
        page.locator('[data-nlaudio-action="preview"]').click()
        page.wait_for_timeout(100)
        state = page.evaluate("""() => ({
          settings:window.__NL_AUDIO_QA__.settings(),
          stored:JSON.parse(localStorage.getItem('muu_dinh_tam_quoc_audio_v1')),
          state:window.__NL_AUDIO_QA__.contextState(),
          save:JSON.stringify(window.__P2_QA__.getGame()),
          output:document.querySelector('[data-nlaudio-effects-value]')?.textContent
        })""")
        check("effects and music levels persist independently", state["stored"] == state["settings"] and
              state["settings"]["effects"] == 0.43 and state["settings"]["music"] is True)
        check("mute blocks playback and preview resumes audio on user action", muted_play is False and
              state["state"] in ("running", "suspended") and state["output"] == "43%")
        check("audio settings do not alter the game Save v5", before["saveVersion"] == 5 and state["save"] == before["save"])

        battle_cues = page.evaluate("""() => {
          const q=window.__P2_QA__,Ctor=window.AudioContext||window.webkitAudioContext;
          const original=Ctor.prototype.createOscillator;let voices=0;
          Ctor.prototype.createOscillator=function(){voices++;return original.call(this)};
          q.beginBattle(1,'campaign');const b=q.debugBattle();
          if(!b){Ctor.prototype.createOscillator=original;return {started:false};}
          const source=()=>window.__NL_AUDIO_QA__.sourcePlays?.()||0;
          const beforeAction=voices+source();q.perform(b.e[0]);const actionVoices=voices+source()-beforeAction;
          for(const enemy of b.e)enemy.hp=0;
          if(!b.finished)q.finishBattle();
          const finishVoices=voices+source()-beforeAction-actionVoices;
          Ctor.prototype.createOscillator=original;
          return {started:true,actionVoices,finishVoices,won:b.won,finished:b.finished};
        }""")
        check("native P2 action and battle settlement trigger audio cues",
              battle_cues.get("started") is True and battle_cues.get("actionVoices", 0) > 0 and
              battle_cues.get("finishVoices", 0) > 0 and battle_cues.get("won") is True and
              battle_cues.get("finished") is True)

        second = open_audio_page(browser, {AUDIO_KEY: json.dumps(state["stored"])}, width=390)
        second.locator('.nav[data-tab="settings"]').click()
        restored = second.evaluate("""() => ({
          effects:document.querySelector('[data-nlaudio-effects]').value,
          music:document.querySelector('[data-nlaudio-music]').checked,
          muted:document.querySelector('[data-nlaudio-mute]').checked,
          box:document.querySelector('[data-nl-audio-settings]').getBoundingClientRect().toJSON(),
          width:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth
        })""")
        print("Mobile audio settings:", json.dumps(restored, ensure_ascii=False), flush=True)
        check("mobile restores audio choices and keeps the settings panel on screen",
              restored["effects"] == "43" and restored["music"] is True and restored["muted"] is False and
              restored["box"]["left"] >= 0 and restored["box"]["right"] <= restored["width"] + 1 and
              restored["scrollWidth"] <= restored["width"] + 1)
        check("no browser runtime errors", not errors)
        browser.close()


if __name__ == "__main__":
    main()
