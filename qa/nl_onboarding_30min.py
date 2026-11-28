"""Deterministic campaign onboarding through real NL economy and combat APIs.

This is an accelerated browser simulation, not a human play session. It deliberately
uses the saved game's real resource ticks, troop assignment, battle, and settlement.
"""
from __future__ import annotations

import json
import sys
import argparse
import shutil
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"
SAVE_KEY = "muu_dinh_tam_quoc_v1"
PROFILES = {
    "steady": ("spear", 8675309),
    "defensive": ("turtle", 120261117),
    "fast": ("goose", 220261117),
}
checks: list[dict[str, object]] = []
page_errors: list[str] = []

class QuietStaticHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return


def visible_window(page, selector: str):
    """Navigate the real one-window UI until the requested control is visible."""
    elements = page.locator(selector)
    if elements.count() == 0:
        raise AssertionError(f"Control does not exist in the rendered game: {selector}")
    chooser = page.locator("#nl-screen-select")
    if chooser.count():
        for index in range(chooser.locator("option").count()):
            chooser.select_option(str(index))
            page.wait_for_timeout(50)
            for item_index in range(elements.count()):
                element = elements.nth(item_index)
                if element.is_visible():
                    return element
    for item_index in range(elements.count()):
        element = elements.nth(item_index)
        if element.is_visible():
            return element
    raise AssertionError(f"Control exists but no screen exposes it: {selector}")


def open_hero_system(page, system: str) -> None:
    page.locator('.nav[data-tab="heroes"]').click()
    visible_window(page, f'[data-nlh-action="system"][data-nlh-target="{system}"]').click()


def check(name: str, condition: object) -> None:
    passed = bool(condition)
    checks.append({"name": name, "pass": passed})
    print(("PASS " if passed else "FAIL ") + name, flush=True)


def run(duration_minutes: int = 30) -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    summaries: dict[str, dict[str, object]] = {}
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietStaticHandler, directory=str(ROOT)))
    Thread(target=server.serve_forever, daemon=True).start()
    with sync_playwright() as playwright:
        launch_options = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
        system_chromium = shutil.which("chromium")
        if system_chromium:
            launch_options["executable_path"] = system_chromium
        browser = playwright.chromium.launch(**launch_options)
        for profile, (formation, seed_base) in PROFILES.items():
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            context.add_init_script("window.__P2_ENABLE_QA__=true;let __nlRandom=8675309;Math.random=()=>{__nlRandom=(Math.imul(__nlRandom,1664525)+1013904223)>>>0;return __nlRandom/4294967296}")
            page = context.new_page()
            page.on("pageerror", lambda error: page_errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_port}/{HTML.name}", wait_until="domcontentloaded")
            page.wait_for_timeout(50)
            state = page.evaluate("window.__P2_QA__.getGame()")
            page.locator('.nav[data-tab="heroes"]').click()
            visible_window(page, '[data-nlh-action="system"][data-nlh-target="recruit"]').click()
            recruit_button = visible_window(page, '[data-nla-recruit="zhao"]')
            if not recruit_button.is_enabled():
                raise AssertionError("The named free Zhao Yun recruit is not enabled in the live hero screen")
            recruit_button.click()
            recruited_state = page.evaluate("window.__P2_QA__.getGame()")
            recruited = next(hero for hero in recruited_state["roster"] if hero not in state["roster"])
            page.locator('.nav[data-tab="formation"]').click()
            visible_window(page, f'[data-choose-hero="{recruited}"]').click()
            empty_slot = next(index for index, hero in enumerate(recruited_state["slots"]) if hero is None)
            visible_window(page, f'[data-slot="{empty_slot}"]').click()
            state = page.evaluate("window.__P2_QA__.getGame()")
            check(f"{profile}: named free Triệu Vân recruit is placed into a real empty formation slot", len(state["roster"]) == 4 and not state["freeRecruit"] and state["slots"][empty_slot] == recruited and state["silver"] == 14000)
            heroes = state["roster"]
            page.evaluate("({formation})=>{const q=window.__P2_QA__;let g=q.getGame();g.formation=formation;g.lastTick=Date.now();q.setGame(g)}", {"formation": formation})
            minutes = 0
            wins = losses = retries = recoveries = blocked_actions = 0
            unlocked: set[int] = set()
            recruited_fifth = False
            training_actions = 0
            stage5_balance_sweep: list[dict[str, object]] = [] # archived separate fixture; continuous play never retunes encounters
            stage9_balance_sweep: list[dict[str, object]] = []
            stage10_balance_sweep: list[dict[str, object]] = []
            history: list[dict[str, object]] = []

            def advance_five_minutes() -> None:
                nonlocal minutes
                page.evaluate("()=>{let g=window.__P2_QA__.getGame();g.lastTick=Date.now()-5*60000;window.__P2_QA__.setGame(g);window.__NL_R03_QA__.tick()}")
                minutes += 5

            def recover_frontline() -> bool:
                nonlocal recoveries
                g = page.evaluate("window.__P2_QA__.getGame()")
                available = 0
                for hero_id in heroes:
                    unit = g["hero"][hero_id]
                    if unit["troops"] < 220 and g["reserve"] < 80 and g["silver"] >= 600 and g["grain"] >= 450:
                        before = g["reserve"]
                        page.evaluate("window.__P2_QA__.enlist()")
                        g = page.evaluate("window.__P2_QA__.getGame()")
                        if g["reserve"] > before:
                            recoveries += 1
                    while g["hero"][hero_id]["troops"] < 220 and g["reserve"] >= 80:
                        before = g["reserve"]
                        page.evaluate("id=>window.__P2_QA__.giveTroops(id)", hero_id)
                        g = page.evaluate("window.__P2_QA__.getGame()")
                        if g["reserve"] == before:
                            break
                    available += g["hero"][hero_id]["troops"]
                return available >= 360 and len([h for h in heroes if page.evaluate("id=>window.__P2_QA__.getGame().hero[id].troops", h) >= 30]) >= 3

            receipts_valid = True
            configured_power = page.evaluate("window.__P2_QA__.data.campaign.encounters.map(e=>[e.stage,e.enemyPower])")
            configured_power = dict(configured_power)
            for _ in range(duration_minutes // 5):
                advance_five_minutes()
                g = page.evaluate("window.__P2_QA__.getGame()")
                stage = len(g["cleared"]) + 1
                grain_cost = 100 + stage * 25
                if g["grain"] < grain_cost:
                    blocked_actions += 1
                    history.append({"minute": minutes, "stage": stage, "event": "wait-grain", "grain": g["grain"], "needed": grain_cost})
                    continue
                if not recover_frontline():
                    blocked_actions += 1
                    history.append({"minute": minutes, "stage": stage, "event": "wait-recruit", "grain": g["grain"], "silver": g["silver"], "reserve": g["reserve"]})
                    continue
                g = page.evaluate("window.__P2_QA__.getGame()")
                if g["formation"] != formation:
                    page.evaluate("f=>{let g=window.__P2_QA__.getGame();g.formation=f;window.__P2_QA__.setGame(g)}", formation)
                deterministic_seed = (seed_base + stage * 1009 + minutes * 7919) & 0xFFFFFFFF
                # Production encounter values are not overwritten by the continuous run.
                # Before a difficult encounter, invest earned resources in a fifth general,
                # native training and the real recommended formation.
                if stage >= 5 and not recruited_fifth:
                    before_silver = g["silver"]
                    open_hero_system(page, "recruit")
                    recruit_button = visible_window(page, '[data-nla-recruit="huang"]')
                    if recruit_button.is_enabled():
                        recruit_button.click()
                        recruited_state = page.evaluate("window.__P2_QA__.getGame()")
                        fifth = next((hero for hero in recruited_state["roster"] if hero not in heroes), None)
                        if fifth:
                            page.locator('.nav[data-tab="formation"]').click()
                            visible_window(page, f'[data-choose-hero="{fifth}"]').click()
                            slot = next(i for i,hero in enumerate(recruited_state["slots"]) if hero is None)
                            visible_window(page, f'[data-slot="{slot}"]').click()
                            visible_window(page, '[data-p3-preset="spear-van"]').click()
                            recruited_fifth = True
                            heroes = recruited_state["roster"]
                            formation = "spear"
                            history.append({"minute":minutes,"stage":stage,"event":"named-recruit","hero":fifth,"silverSpentRecruit":before_silver-recruited_state["silver"]})
                # Spend earned Bạc before attempts at the difficult band, not only after a prescribed loss.
                if stage >= 5:
                    actions = page.evaluate("""ids=>{
                      const h=window.__NL_HERO_SYSTEMS_QA__,q=window.__P2_QA__;let n=0;
                      for(const id of ids){if(q.getGame().silver>=4200&&h.trainBatch(id,5))n++;}
                      return n;
                    }""", heroes)
                    training_actions += actions
                    if actions: history.append({"minute":minutes,"stage":stage,"event":"earned-training","batches":actions})
                    if not recover_frontline():
                        blocked_actions += 1
                        history.append({"minute":minutes,"stage":stage,"event":"wait-recruit"})
                        continue
                page.evaluate("s=>window.__P2_QA__.beginBattle(s,'campaign')", stage)
                battle = page.evaluate("window.__P2_QA__.getBattle()")
                if not battle:
                    blocked_actions += 1
                    history.append({"minute": minutes, "stage": stage, "event": "battle-start-blocked"})
                    continue
                page.evaluate("seed=>{window.__P2_QA__.debugBattle().seed=seed}", deterministic_seed)
                page.evaluate("window.__P2_QA__.skipBattle()")
                settled = page.evaluate("window.__P2_QA__.getGame()")
                report = settled["battleReports"][0]
                rows = report.get("troopLosses") or []
                receipts_valid = receipts_valid and report.get("seed") is not None and len(rows) == len(battle["p"]) and all(row.get("initial", -1) - row.get("casualties", -1) == row.get("remaining", -2) and row.get("provenance") == "SIMULATED" for row in rows)
                event = {"minute": minutes, "stage": stage, "seed": deterministic_seed, "formation": formation, "event": "win" if report["won"] else "loss", "troops": sum(settled["hero"][hero]["troops"] for hero in heroes), "grain": settled["grain"], "silver": settled["silver"]}
                history.append(event)
                if report["won"]:
                    wins += 1
                    unlocked.add(stage)
                else:
                    losses += 1
                    retries += 1
                page.evaluate("window.__P2_QA__.closeBattle('city')")
                if not report["won"]:
                    # Any failed stage can recover; preserve earned balance and retry with preparation.
                    formation = "spear"
                    page.evaluate("window.__P3_QA__.assign('spear-van')")

            final = page.evaluate("window.__P2_QA__.getGame()")
            all_reports_valid = receipts_valid
            summaries[profile] = {
                "minutesSimulated": minutes,
                "freeRecruit": recruited,
                "paidFifthRecruit": recruited_fifth,
                "trainingActions": training_actions,
                "wins": wins,
                "losses": losses,
                "retries": retries,
                "blockedActions": blocked_actions,
                "recruitBatches": recoveries,
                "stagesCleared": sorted(unlocked),
                "resources": {key: final[key] for key in ("silver", "grain", "iron", "reserve")},
                "troopsByHero": {hero: final["hero"][hero]["troops"] for hero in heroes},
                "levelsByHero": {hero: final["hero"][hero]["level"] for hero in heroes},
                "stage5BalanceSweep": stage5_balance_sweep,
                "stage9BalanceSweep": stage9_balance_sweep,
                "stage10BalanceSweep": stage10_balance_sweep,
                "reportsValid": all_reports_valid,
                "history": history,
            }
            check(f"{profile}: {duration_minutes} accelerated game-minutes use real production and persist v5 state", minutes == duration_minutes and final["version"] == 5)
            check(f"{profile}: player can progress and recover after losses without a softlock", wins > 0 and len(unlocked) > 0 and blocked_actions <= 2)
            if duration_minutes >= 60:
                check(f"{profile}: continuous campaign run clears the first ten stages", set(range(1, 11)).issubset(unlocked))
            stage5_attempts = [row for row in history if row.get("stage") == 5 and row.get("event") in ("win", "loss")]
            check(f"{profile}: recruits and trains using earned resources, reaches and clears the actual Stage 5",
                  recruited_fifth and training_actions > 0 and bool(stage5_attempts) and 5 in unlocked)
            check(f"{profile}: actual campaign power configuration was preserved throughout progression",
                  page.evaluate("window.__P2_QA__.data.campaign.encounters.map(e=>[e.stage,e.enemyPower])") == [list(x) for x in configured_power.items()])
            # The deterministic loss/win A/B fixture is separately required by qa/nl_r02.py.
            reported_battles = sum(row["event"] in ("win", "loss") for row in history)
            check(f"{profile}: every simulated battle has valid deterministic settlement receipts", all_reports_valid and wins + losses == reported_battles)
            check(f"{profile}: no resource underflow or negative troop counts", min(final["silver"], final["grain"], final["iron"], final["reserve"], *(final["hero"][hero]["troops"] for hero in heroes)) >= 0)
            save_succeeded = page.evaluate("window.__P2_QA__.persist()")
            serialized = page.evaluate(f"localStorage.getItem('{SAVE_KEY}')")
            serialized_state = json.loads(serialized) if serialized else {}
            saved_match = page.evaluate("""key=>{
              const saved=window.__P2_QA__.decodeSavedReports(JSON.parse(localStorage.getItem(key)));
              const runtime=window.__P2_QA__.getGame();
              const equal=(a,b)=>{
                if(a===b)return true;
                if(!a||!b||typeof a!=='object'||typeof b!=='object')return false;
                if(Array.isArray(a)!==Array.isArray(b))return false;
                const ak=Object.keys(a).sort(),bk=Object.keys(b).sort();
                return ak.length===bk.length&&ak.every((k,i)=>k===bk[i]&&equal(a[k],b[k]));
              };
              return {cleared:equal(saved.cleared,runtime.cleared),reports:equal(saved.battleReports,runtime.battleReports),heroes:equal(saved.hero,runtime.hero)};
            }""", SAVE_KEY) if serialized else {}
            page.reload(wait_until="domcontentloaded")
            restored = page.evaluate("window.__P2_QA__.getGame()")
            reload_diagnostics = {
                "saveChars": len(serialized or ""),
                "saveVersion": serialized_state.get("version"),
                "savedReportCount": len(serialized_state.get("battleReports", [])),
                "runtimeReportCount": len(final.get("battleReports", [])),
                "restoredReportCount": len(restored.get("battleReports", [])),
                "savePresent": serialized is not None,
                "saveSucceeded": bool(save_succeeded),
                "savedSameCleared": saved_match.get("cleared") is True,
                "savedSameReports": saved_match.get("reports") is True,
                "savedSameHeroes": saved_match.get("heroes") is True,
                "sameVersion": restored.get("version") == 5,
                "sameCleared": restored.get("cleared") == final.get("cleared"),
                "sameReports": restored.get("battleReports") == final.get("battleReports"),
                "sameHeroes": restored.get("hero") == final.get("hero"),
            }
            summaries[profile]["reloadDiagnostics"] = reload_diagnostics
            check(f"{profile}: reload preserves unlocks, troop casualties, reports and v5 Save", all(
                reload_diagnostics[key] for key in ("savePresent", "saveSucceeded", "savedSameCleared", "savedSameReports", "savedSameHeroes", "sameVersion", "sameCleared", "sameReports", "sameHeroes")
            ))
            page.locator('.nav[data-tab="campaign"]').click()
            stage_five = visible_window(page, '[data-stage="5"]')
            if not stage_five.is_disabled():
                stage_five.click()
            preparation = visible_window(page, '[data-nl-preparation="5"]')
            recommendation = visible_window(page, '[data-nl-recommended-preset="spear-van"]')
            recommendation_visible = "cấp trung bình khoảng 5" in preparation.inner_text() and "Tiên Phong" in recommendation.inner_text()
            check(f"{profile}: stage 5 shows its simulated preparation hint in the live campaign UI", recommendation_visible)
            page.evaluate("()=>{const g=window.__P2_QA__.getGame();g.p3PresetId='shield-van';window.__P2_QA__.setGame(g)}")
            apply_recommendation = visible_window(page, '[data-nl-apply-recommended="spear-van"]')
            apply_recommendation.click()
            applied_game = page.evaluate("window.__P2_QA__.getGame()")
            check(f"{profile}: campaign preparation action applies the verified spear-van preset through the real UI", applied_game["p3PresetId"] == "spear-van" and page.locator('[data-nl-apply-recommended="spear-van"]').is_disabled())
            page.screenshot(path=str(ROOT / "qa" / f"nl-onboarding-{duration_minutes}-{profile}.png"))
            context.close()
        browser.close()
    server.shutdown()
    server.server_close()

    check("Chromium produced no page exceptions", not page_errors)
    report = {"milestone": f"NL-ONBOARDING-{duration_minutes}MIN-SIMULATED", "method": "accelerated deterministic Chromium simulation; not a human session", "profiles": summaries, "total": len(checks), "passed": sum(bool(row["pass"]) for row in checks), "failed": [row["name"] for row in checks if not row["pass"]], "pageErrors": page_errors, "checks": checks}
    (ROOT / "qa" / f"NL_ONBOARDING_{duration_minutes}MIN.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"total": report["total"], "passed": report["passed"], "failed": report["failed"]}, ensure_ascii=False))
    return 0 if report["passed"] == report["total"] else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--minutes", type=int, choices=(30, 60), default=30)
    sys.exit(run(parser.parse_args().minutes))
