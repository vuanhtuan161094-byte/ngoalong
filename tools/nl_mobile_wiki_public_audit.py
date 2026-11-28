#!/usr/bin/env python3
"""Verify the immutable public Mobile Wiki snapshot and emit field coverage."""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
AUDIT = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/mobile_wiki_public_audit.json"
CROSSWALK = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/mobile_wiki_public_crosswalk.json"


def json_read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def source_group(rel: str) -> str:
    if rel.startswith("data/hero/"):
        return "hero_detail"
    if rel.startswith("data/campaign/") and rel.endswith("-cb.json"):
        return "campaign_battle_report"
    if rel.startswith("data/campaign/"):
        return "campaign_map"
    return "static:" + Path(rel).name


def json_type(value) -> str:
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "boolean"
    if isinstance(value, int):
        return "integer"
    if isinstance(value, float):
        return "number"
    if isinstance(value, str):
        return "string"
    if isinstance(value, dict):
        return "object"
    if isinstance(value, list):
        return "array"
    return type(value).__name__


def schema_walk(value, pointer: str, acc: dict[str, dict]) -> None:
    item = acc.setdefault(pointer, {"observedValues": 0, "types": Counter(), "arrayLengthMin": None, "arrayLengthMax": None})
    item["observedValues"] += 1
    item["types"][json_type(value)] += 1
    if isinstance(value, dict):
        keys = [str(key) for key in value]
        item["objectKeyCountMin"] = len(keys) if item.get("objectKeyCountMin") is None else min(item["objectKeyCountMin"], len(keys))
        item["objectKeyCountMax"] = len(keys) if item.get("objectKeyCountMax") is None else max(item["objectKeyCountMax"], len(keys))
        id_keyed = len(keys) >= 8 and all(re.fullmatch(r"[0-9]+", key) for key in keys)
        uuid_keyed = len(keys) >= 8 and all(re.fullmatch(r"[0-9a-fA-F-]{32,36}", key) for key in keys)
        large_keyed = len(keys) >= 64
        if id_keyed or uuid_keyed or large_keyed:
            for child in value.values():
                schema_walk(child, pointer + "/*", acc)
        else:
            for key, child in value.items():
                escaped = str(key).replace("~", "~0").replace("/", "~1")
                schema_walk(child, pointer + "/" + escaped, acc)
    elif isinstance(value, list):
        size = len(value)
        item["arrayLengthMin"] = size if item["arrayLengthMin"] is None else min(item["arrayLengthMin"], size)
        item["arrayLengthMax"] = size if item["arrayLengthMax"] is None else max(item["arrayLengthMax"], size)
        for child in value:
            schema_walk(child, pointer + "[]", acc)


def map_npcs(doc: dict, side: str) -> list:
    data = doc.get(side) or {}
    rows = data.get("npcs") or [] if isinstance(data, dict) else []
    return rows if isinstance(rows, list) else []


def build() -> tuple[dict, dict]:
    manifest_path = SNAPSHOT / "capture_manifest.json"
    manifest = json_read(manifest_path)
    errors = list(manifest.get("errors") or [])
    checked_files = 0
    groups: dict[str, dict] = {}
    file_records = []
    json_file_count = 0
    hash_errors = []
    for record in manifest["files"]:
        path = SNAPSHOT / record["file"]
        if not path.is_file():
            hash_errors.append({"file": record["file"], "error": "MISSING"})
            continue
        raw = path.read_bytes()
        checked_files += 1
        if len(raw) != record["bytes"] or hashlib.sha256(raw).hexdigest() != record["sha256"]:
            hash_errors.append({"file": record["file"], "error": "SHA256_OR_SIZE_MISMATCH"})
        if path.suffix == ".json" and path.name != "capture_manifest.json":
            try:
                value = json.loads(raw)
            except Exception as exc:
                errors.append({"file": record["file"], "error": "JSON_PARSE: " + str(exc)})
                continue
            json_file_count += 1
            group = source_group(record["file"])
            entry = groups.setdefault(group, {"files": 0, "bytes": 0, "schema": {}, "recordCounts": Counter()})
            entry["files"] += 1
            entry["bytes"] += len(raw)
            schema_walk(value, "", entry["schema"])
            if group.startswith("static:"):
                if isinstance(value, dict):
                    for key, child in value.items():
                        if isinstance(child, (dict, list)):
                            entry["recordCounts"][str(key)] = len(child)
                entry["topLevelKeys"] = sorted(value) if isinstance(value, dict) else []
            file_records.append({"file": record["file"], "sha256": record["sha256"], "bytes": len(raw), "sourceFieldClassification": "SOURCE_EXACT"})
            del value
        del raw

    hero_index = json_read(SNAPSHOT / "data/hero-mini.json")
    hero_errors = []
    hero_fields = Counter()
    hero_factions = Counter()
    for hero_id, mini in hero_index.items():
        path = SNAPSHOT / "data/hero" / (str(hero_id) + ".json")
        if not path.is_file():
            hero_errors.append({"id": str(hero_id), "error": "DETAIL_MISSING"})
            continue
        detail = json_read(path)
        if str(detail.get("id")) != str(hero_id):
            hero_errors.append({"id": str(hero_id), "error": "DETAIL_ID_MISMATCH", "found": detail.get("id")})
        hero_fields.update(detail.keys())
        hero_factions[str(detail.get("nation") or detail.get("faction") or "UNKNOWN")] += 1

    units_path = SNAPSHOT / "data/unit-detail.json"
    units_data = json_read(units_path)
    units = units_data["units"]
    troop_groups = Counter(row.get("typeName", "UNKNOWN") for row in units.values())
    map_paths = sorted((SNAPSHOT / "data/campaign").glob("[0-9]*.json"))
    map_paths = [path for path in map_paths if not path.stem.endswith("-cb")]
    map_npc_counts = Counter()
    map_formations = Counter()
    map_ids = []
    map_field_values = Counter()
    map_field_nulls = Counter()
    battle_report_paths = sorted((SNAPSHOT / "data/campaign").glob("*-cb.json"))
    map_records = []
    for path in map_paths:
        doc = json_read(path)
        map_ids.append(str(doc.get("key")))
        row = {"key": str(doc.get("key")), "name": doc.get("name"), "mapLevel": doc.get("mapLevel"), "unlockLevel": doc.get("unlockLevel"), "hasCB": bool(doc.get("hasCB")), "sides": {}}
        for side in ("vn", "cn"):
            npcs = map_npcs(doc, side)
            formations = sum(len(n.get("formation") or []) for n in npcs)
            map_npc_counts[side] += len(npcs)
            map_formations[side] += formations
            missing = Counter()
            nulls = Counter()
            for npc in npcs:
                for key in ("ident", "name", "type", "level", "troops", "merit", "power", "drops", "souls", "effects", "formation"):
                    if key not in npc:
                        missing[key] += 1
                    elif npc[key] is None:
                        nulls[key] += 1
                        map_field_nulls[key] += 1
                    else:
                        map_field_values[key] += 1
            row["sides"][side] = {"npcRecords": len(npcs), "formationUnitRecords": formations,
                                  "fieldsAbsentInNpcRows": dict(sorted(missing.items())), "nullValues": dict(sorted(nulls.items()))}
        map_records.append(row)

    page_paths = Counter()
    map_detail_pages = 0
    page_index = []
    for page in manifest["pageRecords"]:
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(page["url"])
        path = parsed.path.removeprefix("/ngoa-long-wiki").strip("/") or "index"
        page_paths[path.split("/")[0]] += 1
        if path == "pho-ban-chi-tiet" and parse_qs(parsed.query).get("map"):
            map_detail_pages += 1
        page_index.append({"url": page["url"], "file": page["file"], "sha256": page["sha256"], "bytes": page["bytes"]})

    schema_report = []
    crosswalk_fields = []
    for group, entry in sorted(groups.items()):
        fields = []
        for pointer, details in sorted(entry["schema"].items()):
            types = dict(sorted(details["types"].items()))
            field = {"jsonPointer": pointer, "classification": "SOURCE_EXACT", "valueTypes": types,
                     "observedValues": details["observedValues"], "arrayLengthMin": details["arrayLengthMin"],
                     "arrayLengthMax": details["arrayLengthMax"],
                     "objectKeyCountMin": details.get("objectKeyCountMin"),
                     "objectKeyCountMax": details.get("objectKeyCountMax"),
                     "runtimeField": None, "runtimeCoverage": "NOT_AUDITED"}
            fields.append(field)
            crosswalk_fields.append({"sourceGroup": group, **field})
        schema_report.append({"group": group, "files": entry["files"], "bytes": entry["bytes"],
                              "topLevelKeys": entry.get("topLevelKeys"),
                              "recordCounts": dict(sorted(entry["recordCounts"].items())), "fields": fields})

    audit = {
        "schemaVersion": 1,
        "sourceEdition": "CURRENT_VNG_MOBILE_PUBLIC_WIKI",
        "snapshotManifest": "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/capture_manifest.json",
        "retrievedAtUtc": manifest["retrievedAtUtc"],
        "integrity": {"manifestFiles": len(manifest["files"]), "filesChecked": checked_files,
            "jsonFilesParsed": json_file_count, "httpOrCaptureErrors": len(manifest.get("errors", [])),
                      "hashErrors": hash_errors, "parseErrors": errors},
        "coverage": {
            "linkedWikiPages": len(page_index), "pageRouteCounts": dict(sorted(page_paths.items())),
            "campaignDetailPages": map_detail_pages, "staticPublicJsonResources": len(manifest["inventory"]["staticDataResourceUrls"]),
            "heroListRecords": len(hero_index), "heroDetailRecords": len(hero_index) - len(hero_errors), "heroDetailErrors": hero_errors,
            "visibleHeroCardsOnListPage": 364, "heroIndexVsVisiblePageDiscrepancy": len(hero_index) - 364,
            "troopRecords": len(units), "troopsByType": dict(sorted(troop_groups.items())),
            "troopSpecialRules": len(units_data.get("specials", [])),
            "campaignMaps": len(map_paths), "campaignMapIdMismatches": [x for i, x in enumerate(map_ids) if x != map_paths[i].stem],
            "campaignNpcRecordsBySide": dict(sorted(map_npc_counts.items())),
            "campaignFormationUnitRecordsBySide": dict(sorted(map_formations.items())),
            "campaignMapsWithPublicBattleReports": len(battle_report_paths), "campaignPublicBattleReportFiles": len(battle_report_paths),
            "npcFieldValueCounts": dict(sorted(map_field_values.items())), "npcFieldNullCounts": dict(sorted(map_field_nulls.items())),
        },
        "sourceRecordSummaries": {
            "heroNations": dict(sorted(hero_factions.items())), "heroDetailFieldKeyOccurrences": dict(sorted(hero_fields.items())),
            "campaignMaps": map_records,
        },
        "jsonDatasets": schema_report,
    }
    crosswalk = {
        "schemaVersion": 1,
        "sourceEdition": "CURRENT_VNG_MOBILE_PUBLIC_WIKI",
        "retrievedAtUtc": manifest["retrievedAtUtc"],
        "classificationPolicy": "SOURCE_EXACT means the captured public source contains this value. Runtime coverage is tracked independently; NOT_AUDITED does not assert implementation.",
        "fields": crosswalk_fields,
    }
    return audit, crosswalk


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    audit, crosswalk = build()
    for path, value in ((AUDIT, audit), (CROSSWALK, crosswalk)):
        expected = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                print(f"STALE: {path.relative_to(ROOT)}", file=sys.stderr)
                return 1
        else:
            path.write_text(expected, encoding="utf-8")
    print(json.dumps({"pages": audit["coverage"]["linkedWikiPages"], "jsonFiles": audit["integrity"]["jsonFilesParsed"],
                      "heroes": audit["coverage"]["heroDetailRecords"], "troops": audit["coverage"]["troopRecords"],
                      "maps": audit["coverage"]["campaignMaps"], "npcRecordsBySide": audit["coverage"]["campaignNpcRecordsBySide"],
                      "hashErrors": len(audit["integrity"]["hashErrors"]), "captureErrors": audit["integrity"]["httpOrCaptureErrors"]}, ensure_ascii=False))
    if audit["integrity"]["hashErrors"] or audit["integrity"]["httpOrCaptureErrors"] or audit["integrity"]["parseErrors"]:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
