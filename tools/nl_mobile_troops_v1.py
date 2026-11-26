#!/usr/bin/env python3
"""Normalize the public Mobile troop table without changing source values."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
RAW_ROOT = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
SOURCE_FILE = RAW_ROOT / "data/unit-detail.json"
DATA_OUT = ROOT / "data/ngoalong/modules/troops/mobile_units_v1.json"
CROSSWALK_OUT = ROOT / "data/ngoalong/modules/troops/mobile_units_crosswalk_v1.json"
SOURCE_URL = "https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/data/unit-detail.json"
PAGE_URL = "https://ngoalong.vnggames.com/ngoa-long-wiki/binh-chung"

BASE_RUNTIME_ROLES = {
    "infantry": "1",
    "spear": "10",
    "cavalry": "11",
    "archer": "12",
    "strategist": "13",
}
STAT_ADAPTER = {
    "strengthAtk": "atk",
    "leaderAtk": "catk",
    "intellectAtk": "matk",
    "strengthDef": "def",
    "leaderDef": "tdef",
    "intellectDef": "mdef",
}
REQUIRED_STATS = (*STAT_ADAPTER, "critical", "strikeBack")


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def normalize() -> tuple[dict, dict]:
    manifest = read(RAW_ROOT / "capture_manifest.json")
    source_hash = hashlib.sha256(SOURCE_FILE.read_bytes()).hexdigest()
    source_record = next((row for row in manifest["files"] if row["file"] == "data/unit-detail.json"), None)
    if not source_record or source_record["sha256"] != source_hash:
        raise ValueError("MOBILE_TROOP_SOURCE_HASH_MISMATCH")
    raw = read(SOURCE_FILE)
    units = raw.get("units")
    if not isinstance(units, dict) or len(units) != 408:
        raise ValueError("MOBILE_TROOP_RECORD_COUNT_DRIFT")
    for unit_id, row in units.items():
        if str(row.get("id", unit_id)) != str(unit_id):
            raise ValueError("MOBILE_TROOP_ID_MISMATCH:" + str(unit_id))
        stats = row.get("stats")
        if not isinstance(stats, dict) or any(not isinstance(stats.get(key), (int, float)) for key in REQUIRED_STATS):
            raise ValueError("MOBILE_TROOP_STATS_INCOMPLETE:" + str(unit_id))

    base_profiles = {}
    expected_names = {"1": "Bộ Binh", "10": "Thương Binh", "11": "Kỵ Binh", "12": "Cung Binh", "13": "Quan Văn"}
    for role, source_id in BASE_RUNTIME_ROLES.items():
        row = units.get(source_id)
        if not row or row.get("typeName") != expected_names[source_id]:
            raise ValueError("MOBILE_BASE_TROOP_IDENTITY_DRIFT:" + source_id)
        base_profiles[role] = {"sourceId": source_id, "name": row["name"], "typeName": row["typeName"],
                               "stats": row["stats"], "sourceClassification": "SOURCE_EXACT"}

    data = {
        "schemaVersion": 1,
        "sourceEdition": "CURRENT_VNG_MOBILE_PUBLIC_WIKI",
        "sourcePage": PAGE_URL,
        "sourceDataUrl": SOURCE_URL,
        "sourceSha256": source_hash,
        "sourceCaptureManifest": "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/capture_manifest.json",
        "fieldPolicy": "Every raw unit and special-rule field below is copied from the captured public JSON. Runtime coverage is separate.",
        "baseRuntimeRoleMap": BASE_RUNTIME_ROLES,
        "baseRuntimeProfiles": base_profiles,
        "units": units,
        "specials": raw.get("specials", []),
        "counts": {"units": len(units), "specials": len(raw.get("specials", [])), "baseRuntimeRoles": len(base_profiles)},
    }
    fields = []
    for unit_id, row in sorted(units.items(), key=lambda item: int(item[0])):
        role = next((role for role, source_id in BASE_RUNTIME_ROLES.items() if source_id == unit_id), None)
        for key in sorted(row):
            runtime_field = None
            runtime_classification = "SOURCE_EXACT"
            runtime_status = "UNMAPPED"
            if role and key == "stats":
                runtime_field = "P2 troop coefficients"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_NATIVE_P2"
            elif role and key == "typeName":
                runtime_field = "P2 troop role identity"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_NATIVE_P2"
            elif role and key == "desc":
                runtime_field = "Barracks troop description"
                runtime_status = "DISPLAYED"
            elif role and key == "name":
                runtime_field = "Barracks troop name"
                runtime_status = "DISPLAYED"
            fields.append({"sourcePointer": f"/units/{unit_id}/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL, "runtimeField": runtime_field,
                           "runtimeClassification": runtime_classification if runtime_status in ("APPLIED_TO_NATIVE_P2", "DISPLAYED") else None,
                           "runtimeStatus": runtime_status, "runtimeRole": role})
        for key in sorted(row.get("stats", {})):
            target = STAT_ADAPTER.get(key) or ("crit" if key == "critical" else None)
            formula = ("retain formation crit and add source critical coefficient" if role and key == "critical"
                       else "round(currentP2Stat × source coefficient)" if role and key in STAT_ADAPTER else None)
            fields.append({"sourcePointer": f"/units/{unit_id}/stats/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL, "runtimeField": target if role and target else None,
                           "runtimeClassification": "DERIVED_FROM_SOURCE" if role and target else None,
                           "runtimeStatus": "APPLIED_TO_NATIVE_P2" if role and target else "UNRESOLVED" if role and key == "strikeBack" else "UNMAPPED",
                           "runtimeRole": role, "adapterFormula": formula})
    for index, row in enumerate(raw.get("specials", [])):
        for key in sorted(row):
            fields.append({"sourcePointer": f"/specials/{index}/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL, "runtimeField": None, "runtimeClassification": None,
                           "runtimeStatus": "UNMAPPED"})
    crosswalk = {
        "schemaVersion": 1,
        "sourceEdition": data["sourceEdition"],
        "sourcePage": PAGE_URL,
        "sourceDataUrl": SOURCE_URL,
        "sourceSha256": source_hash,
        "classificationPolicy": "The public table is source-exact; stat-to-P2 coefficient semantics are DERIVED_FROM_SOURCE, not a recovered P2 formula. Unsupported troop-specific operations remain UNMAPPED.",
        "runtimeAdapter": {
            "roles": BASE_RUNTIME_ROLES,
            "attackMappings": {"strengthAtk": "atk", "leaderAtk": "catk", "intellectAtk": "matk"},
            "defenseMappings": {"strengthDef": "def", "leaderDef": "tdef", "intellectDef": "mdef"},
            "critical": "replaces the old generic troop critical add-on while retaining formation crit",
            "strikeBack": "UNRESOLVED: native P2 has no source-backed counterattack chance event",
            "otherTroopIds": "UNRESOLVED for gameplay behavior; full source fields remain available for follow-on batches",
        },
        "fields": fields,
    }
    return data, crosswalk


def write(check: bool = False) -> None:
    data, crosswalk = normalize()
    for path, payload in ((DATA_OUT, data), (CROSSWALK_OUT, crosswalk)):
        expected = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                raise ValueError("STALE_GENERATED_DATA:" + path.relative_to(ROOT).as_posix())
        else:
            path.write_text(expected, encoding="utf-8")
    print(f"Mobile troop source PASS: 408 units, 21 special rules; five base role coefficient sets mapped to P2.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        write(check=args.check)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
