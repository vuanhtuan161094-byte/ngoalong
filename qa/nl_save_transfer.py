#!/usr/bin/env python3
"""Exercise cross-origin Save import, confirmation, and rollback in Chromium."""
from __future__ import annotations

import copy
import json
import os
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
SAVE_KEY = "muu_dinh_tam_quoc_v1"


def main() -> int:
    class Handler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=str(ROOT), **kwargs)

        def log_message(self, fmt, *args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_port}/index.html"
    work = ROOT / "qa" / ".nl-save-transfer-tmp"
    work.mkdir(exist_ok=True)
    errors: list[str] = []
    checks: list[tuple[str, bool]] = []

    def check(name: str, condition: bool) -> None:
        checks.append((name, bool(condition)))
        print(("PASS" if condition else "FAIL") + " " + name)

    try:
        with sync_playwright() as playwright:
            executable = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH") or shutil.which("chromium")
            browser = playwright.chromium.launch(
                headless=True,
                executable_path=executable,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            try:
                page = browser.new_page(viewport={"width": 1280, "height": 720})
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(url, wait_until="domcontentloaded")
                page.locator('.nav[data-tab="journal"]').click()
                page.locator("#import-save").wait_for(state="attached")

                live = page.evaluate(
                    """key=>JSON.parse(localStorage.getItem(key))""", SAVE_KEY
                )
                check(
                    "Journal explains how to transfer a Save from the old website",
                    "Heoofgaia" in page.locator("#view").inner_text()
                    and "tệp JSON" in page.locator("#view").inner_text(),
                )

                legacy = copy.deepcopy(live)
                legacy["version"] = 5
                legacy["silver"] = 24680
                legacy["cleared"] = [1, 2]
                legacy["lastTick"] = 1000
                if isinstance(legacy.get("cltq"), dict):
                    economy = legacy["cltq"].get("economy")
                    if isinstance(economy, dict):
                        economy["lastAt"] = 1000
                source_file = work / "ngoalong-save-from-previous-origin.json"
                source_file.write_text(json.dumps(legacy), encoding="utf-8")

                previous_raw = page.evaluate(
                    "key=>localStorage.getItem(key)", SAVE_KEY
                )
                page.once("dialog", lambda dialog: dialog.accept())
                page.locator("#import-save").set_input_files(str(source_file))
                page.wait_for_function(
                    """([key,value])=>{
                        const raw=localStorage.getItem(key);
                        if(!raw)return false;
                        const game=JSON.parse(raw);
                        return game.silver===value&&game.cleared.length===2;
                    }""",
                    arg=[SAVE_KEY, legacy["silver"]],
                )
                imported = page.evaluate(
                    """key=>JSON.parse(localStorage.getItem(key))""", SAVE_KEY
                )
                check(
                    "Confirmed import restores progress and keeps Save v5",
                    imported["version"] == 5
                    and imported["silver"] == legacy["silver"]
                    and imported["cleared"] == legacy["cleared"]
                    and imported["roster"] == legacy["roster"],
                )
                check(
                    "Import resets offline production clocks",
                    imported["lastTick"] >= legacy["lastTick"]
                    and imported.get("cltq", {}).get("economy", {}).get("lastAt", 0)
                    >= legacy["lastTick"],
                )
                check(
                    "Import opens the city screen after restoring",
                    page.locator('.nav.active[data-tab="city"]').count() == 1
                    and page.locator("#view .city-visual").count() == 1,
                )

                page.locator('.nav[data-tab="journal"]').click()
                before_bad_import = page.evaluate(
                    "key=>localStorage.getItem(key)", SAVE_KEY
                )
                bad_file = work / "invalid-save.json"
                bad_file.write_text(
                    json.dumps(
                        {
                            "version": 5,
                            "buildings": {},
                            "hero": {},
                            "slots": [],
                            "roster": [],
                        }
                    ),
                    encoding="utf-8",
                )
                page.locator("#import-save").set_input_files(str(bad_file))
                page.get_by_text("Tệp không đúng cấu trúc Save", exact=False).wait_for()
                after_bad_import = page.evaluate(
                    "key=>localStorage.getItem(key)", SAVE_KEY
                )
                check(
                    "Malformed import leaves the existing Save byte-for-byte intact",
                    before_bad_import == after_bad_import,
                )

                cancelled = copy.deepcopy(legacy)
                cancelled["silver"] = 99999
                cancelled_file = work / "cancelled-save.json"
                cancelled_file.write_text(
                    json.dumps(cancelled), encoding="utf-8"
                )
                page.once("dialog", lambda dialog: dialog.dismiss())
                page.locator("#import-save").set_input_files(str(cancelled_file))
                page.wait_for_timeout(100)
                after_cancel = page.evaluate(
                    "key=>localStorage.getItem(key)", SAVE_KEY
                )
                check(
                    "Cancelling overwrite keeps the current Save byte-for-byte intact",
                    before_bad_import == after_cancel,
                )

                preserved = json.loads(after_cancel)
                damaged_replay = copy.deepcopy(preserved)
                damaged_replay["battleReportsEncoding"] = "keys-v1"
                damaged_replay["battleReportKeyTable"] = []
                damaged_replay["battleReports"] = [{"~0": "invalid key reference"}]
                page.evaluate(
                    "(key,record)=>localStorage.setItem(key,JSON.stringify(record))",
                    [SAVE_KEY, damaged_replay],
                )
                page.reload(wait_until="domcontentloaded")
                page.wait_for_function(
                    """([key,silver])=>{
                        const raw=localStorage.getItem(key);
                        if(!raw)return false;
                        const game=JSON.parse(raw);
                        return game.version===5&&game.silver===silver&&
                          JSON.stringify(game.cleared)==='[1,2]'&&
                          game.battleReportsEncoding==='keys-v1'&&
                          Array.isArray(game.battleReports)&&game.battleReports.length===0;
                    }""",
                    arg=[SAVE_KEY, legacy["silver"]],
                )
                recovered = page.evaluate(
                    "key=>JSON.parse(localStorage.getItem(key))", SAVE_KEY
                )
                check(
                    "Damaged replay archive preserves Save v5 campaign state",
                    recovered["version"] == 5
                    and recovered["silver"] == legacy["silver"]
                    and recovered["cleared"] == legacy["cleared"]
                    and recovered["battleReports"] == [],
                )
                check("No uncaught browser errors", not errors)
            finally:
                browser.close()
    finally:
        server.shutdown()
        server.server_close()
        for file in work.glob("*"):
            file.unlink()
        work.rmdir()

    failed = [name for name, passed in checks if not passed]
    return 1 if failed or errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
