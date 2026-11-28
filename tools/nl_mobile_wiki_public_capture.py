#!/usr/bin/env python3
"""Capture the public VNG Ngọa Long Mobile Wiki and its public data tables.

This collector follows only same-site Wiki links and the public client bundle's
JSON URLs. It does not authenticate, call private APIs, or download artwork.
Each run is write-once so the captured evidence remains immutable.
"""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qsl, urlencode, urljoin, urlparse, urlunparse
from urllib.request import Request, urlopen

ROOT = "https://ngoalong.vnggames.com/ngoa-long-wiki"
WIKI_HOST = "ngoalong.vnggames.com"
CDN_PREFIX = "https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/"
OUT_BASE = Path("data/ngoalong/research")
USER_AGENT = "Mozilla/5.0 (compatible; NgoaLongWikiResearch/1.0; public source audit)"
STATIC_DATA_RE = re.compile(r"(?:BASE\s*\+\s*['\"]data/|['\"]data/)([^'\"]+?\.json)")


class PageLinks(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.links: list[str] = []
        self.scripts: list[str] = []
        self.styles: list[str] = []
        self.data_attrs: list[dict[str, str | None]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "a" and values.get("href"):
            self.links.append(str(values["href"]))
        if tag == "script" and values.get("src"):
            self.scripts.append(str(values["src"]))
        if tag == "link" and values.get("href") and "stylesheet" in str(values.get("rel", "")):
            self.styles.append(str(values["href"]))
        if any(k.startswith("data-nlw") for k in values):
            self.data_attrs.append({k: v for k, v in values.items() if k.startswith("data-nlw")})


def get(url: str, attempts: int = 3) -> tuple[bytes, str, str]:
    last: Exception | None = None
    for retry in range(attempts):
        try:
            req = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/json,*/*"})
            with urlopen(req, timeout=30) as response:
                return response.read(), response.headers.get("content-type", ""), response.geturl()
        except (HTTPError, URLError, TimeoutError) as exc:
            last = exc
            if isinstance(exc, HTTPError) and exc.code < 500 and exc.code != 429:
                break
            time.sleep(0.4 * (retry + 1))
    assert last is not None
    raise last


def canonical_wiki_url(url: str) -> str | None:
    parsed = urlparse(url)
    if parsed.hostname != WIKI_HOST or not parsed.path.startswith("/ngoa-long-wiki"):
        return None
    query = urlencode(sorted(parse_qsl(parsed.query, keep_blank_values=True)))
    return urlunparse(("https", WIKI_HOST, parsed.path.rstrip("/") or "/ngoa-long-wiki", "", query, ""))


def safe_page_path(url: str) -> Path:
    p = urlparse(url)
    slug = p.path.removeprefix("/ngoa-long-wiki").strip("/") or "index"
    slug = re.sub(r"[^A-Za-z0-9._/-]+", "_", slug).strip("/").replace("/", "__")
    suffix = ""
    if p.query:
        suffix = "--q-" + sha256(p.query.encode()).hexdigest()[:12]
    return Path("pages") / f"{slug}{suffix}.html"


def parse_links(raw: bytes) -> PageLinks:
    parser = PageLinks()
    parser.feed(raw.decode("utf-8", "replace"))
    return parser


def write_capture(root: Path, url: str, rel: Path, raw: bytes, content_type: str, final_url: str) -> dict:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(raw)
    return {
        "url": url,
        "finalUrl": final_url,
        "file": rel.as_posix(),
        "bytes": len(raw),
        "sha256": sha256(raw).hexdigest(),
        "contentType": content_type,
    }


def fetch_batch(urls: list[tuple[str, Path]], root: Path, workers: int) -> tuple[list[dict], list[dict]]:
    good: list[dict] = []
    errors: list[dict] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(get, url): (url, rel) for url, rel in urls}
        for future in as_completed(futures):
            url, rel = futures[future]
            try:
                raw, content_type, final_url = future.result()
                good.append(write_capture(root, url, rel, raw, content_type, final_url))
            except Exception as exc:  # the manifest must expose every unavailable public resource
                errors.append({"url": url, "file": rel.as_posix(), "error": f"{type(exc).__name__}: {exc}"})
    good.sort(key=lambda x: x["url"])
    errors.sort(key=lambda x: x["url"])
    return good, errors


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--snapshot", help="write-once snapshot directory name; default is current UTC date")
    ap.add_argument("--workers", type=int, default=12)
    args = ap.parse_args()
    snapshot = args.snapshot or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = OUT_BASE / f"mobile_wiki_{snapshot}" / "full_public_raw"
    if out.exists():
        print(f"Refusing to overwrite immutable source snapshot: {out}", file=sys.stderr)
        return 2
    out.mkdir(parents=True)

    print("Fetching public Wiki entry page…", flush=True)
    entry, entry_type, entry_final = get(ROOT)
    first = write_capture(out, ROOT, Path("pages/index.html"), entry, entry_type, entry_final)
    pages: dict[str, bytes] = {ROOT: entry}
    failures: list[dict] = []
    queue = [ROOT]
    while queue:
        batch = queue[:24]
        queue = queue[24:]
        discovered: list[str] = []
        for url in batch:
            for href in parse_links(pages[url]).links:
                target = canonical_wiki_url(urljoin(url, href))
                if target and target not in pages and target not in queue and target not in discovered:
                    discovered.append(target)
        if not discovered:
            continue
        tasks = [(url, safe_page_path(url)) for url in discovered]
        good, errors = fetch_batch(tasks, out, args.workers)
        failures.extend(errors)
        for record in good:
            raw = (out / record["file"]).read_bytes()
            pages[record["url"]] = raw
        queue.extend(url for url in discovered if url in pages)
        print(f"Captured {len(pages)} Wiki pages; {len(discovered)} newly discovered", flush=True)

    # Save complete HTML for all linked public routes, including every paged
    # pho-ban-chi-tiet?map=... record discovered on the campaign index.
    page_records = [first]
    for url, raw in sorted(pages.items()):
        if url == ROOT:
            continue
        rel = safe_page_path(url)
        if not (out / rel).exists():
            # It can be a page body already downloaded while following the graph.
            (out / rel).parent.mkdir(parents=True, exist_ok=True)
            (out / rel).write_bytes(raw)
        page_records.append({"url": url, "file": rel.as_posix(), "bytes": len(raw), "sha256": sha256(raw).hexdigest(), "contentType": "text/html; charset=utf-8"})

    scripts = sorted({urljoin(url, src) for url, raw in pages.items() for src in parse_links(raw).scripts
                      if "ngoa-long-wiki.js" in src})
    if not scripts:
        scripts = [CDN_PREFIX + "ngoa-long-wiki.js"]
    script_tasks = [(url, Path("client") / f"ngoa-long-wiki-{i}.js") for i, url in enumerate(scripts)]
    script_records, errors = fetch_batch(script_tasks, out, args.workers)
    failures.extend(errors)

    data_urls: set[str] = set()
    bundle_sources: dict[str, bytes] = {}
    for record in script_records:
        raw = (out / record["file"]).read_bytes()
        bundle_sources[record["url"]] = raw
        base = record["url"].rsplit("/", 1)[0] + "/"
        bundle = raw.decode("utf-8", "replace")
        data_urls.update(urljoin(base, "data/" + name) for name in STATIC_DATA_RE.findall(bundle))
        # The visible item detail function requests these four named groups.
        data_urls.update(urljoin(base, f"data/{name}-detail.json") for name in ("item", "equip", "tuongkhi", "chienky"))

    data_tasks = [(url, Path("data") / urlparse(url).path.split("/data/", 1)[-1]) for url in sorted(data_urls)]
    data_records, errors = fetch_batch(data_tasks, out, args.workers)
    failures.extend(errors)
    by_filename = {Path(r["file"]).name: r for r in data_records}

    # The same public bundle loads one detail JSON for each public hero and each
    # map ID. IDs are taken only from captured public list pages/data.
    hero_ids: set[str] = set()
    mini = by_filename.get("hero-mini.json")
    if mini:
        try:
            hero_ids.update(str(x) for x in json.loads((out / mini["file"]).read_text(encoding="utf-8")))
        except Exception as exc:
            failures.append({"url": mini["url"], "error": f"hero-mini parse: {type(exc).__name__}: {exc}"})
    campaign_ids: set[str] = set()
    for url in pages:
        query = dict(parse_qsl(urlparse(url).query))
        if urlparse(url).path.endswith("/pho-ban-chi-tiet") and query.get("map"):
            campaign_ids.add(query["map"])
    for raw in pages.values():
        text = raw.decode("utf-8", "replace")
        campaign_ids.update(re.findall(r"/pho-ban-chi-tiet\?map=([0-9]+)", text))
    print(f"Discovered {len(hero_ids)} public hero details and {len(campaign_ids)} campaign maps", flush=True)

    for bundle_url in scripts:
        base = bundle_url.rsplit("/", 1)[0] + "/data/"
        if hero_ids:
            tasks = [(urljoin(base, f"hero/{ident}.json"), Path("data/hero") / f"{ident}.json") for ident in sorted(hero_ids)]
            good, errors = fetch_batch(tasks, out, args.workers)
            data_records.extend(good)
            failures.extend(errors)
        if campaign_ids:
            tasks = [(urljoin(base, f"campaign/{ident}.json"), Path("data/campaign") / f"{ident}.json") for ident in sorted(campaign_ids)]
            good, errors = fetch_batch(tasks, out, args.workers)
            data_records.extend(good)
            failures.extend(errors)
            cb_tasks = []
            for record in good:
                try:
                    if json.loads((out / record["file"]).read_text(encoding="utf-8")).get("hasCB"):
                        ident = Path(record["file"]).stem
                        cb_tasks.append((urljoin(base, f"campaign/{ident}-cb.json"), Path("data/campaign") / f"{ident}-cb.json"))
                except Exception as exc:
                    failures.append({"url": record["url"], "error": f"campaign parse: {type(exc).__name__}: {exc}"})
            if cb_tasks:
                good_cb, errors = fetch_batch(cb_tasks, out, args.workers)
                data_records.extend(good_cb)
                failures.extend(errors)

    # Re-hash the complete output tree before writing the immutable manifest.
    all_files = []
    for path in sorted(p for p in out.rglob("*") if p.is_file()):
        rel = path.relative_to(out).as_posix()
        raw = path.read_bytes()
        all_files.append({"file": rel, "bytes": len(raw), "sha256": sha256(raw).hexdigest()})
    manifest = {
        "schemaVersion": 1,
        "retrievedAtUtc": datetime.now(timezone.utc).isoformat(),
        "sourceEdition": "CURRENT_VNG_MOBILE_PUBLIC_WIKI",
        "entryUrl": ROOT,
        "retrievalPolicy": "Unauthenticated public HTTPS GET only; same-site Wiki pages and URLs explicitly requested by the public client bundle. No private endpoints, login, or artwork downloads.",
        "inventory": {
            "linkedWikiPages": len(page_records),
            "listedHeroIds": len(hero_ids),
            "listedCampaignMapIds": len(campaign_ids),
            "bundleScripts": scripts,
            "staticDataResourceUrls": sorted(data_urls),
            "heroDetailsRequested": len(hero_ids),
            "campaignMapsRequested": len(campaign_ids),
        },
        "pageRecords": page_records,
        "dataRecords": sorted(data_records, key=lambda x: x["url"]),
        "errors": sorted(failures, key=lambda x: (x.get("url", ""), x.get("error", ""))),
        "files": all_files,
    }
    (out / "capture_manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"snapshot": out.as_posix(), **manifest["inventory"], "capturedFiles": len(all_files), "failures": len(failures), "bytes": sum(x["bytes"] for x in all_files)}, ensure_ascii=False, indent=2), flush=True)
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
