"""Normalize and validate the public Mobile Wiki Ấn Trận payload.

Raw public response snapshots are immutable inputs. Source values stay intact;
runtime-only projections and unresolved mechanics are identified separately.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/seal_v2_raw"
OUT = ROOT / "data/ngoalong/modules/seals"
PAGE = "https://ngoalong.vnggames.com/ngoa-long-wiki/an-tran"
DATA_URL = "https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/data/quan-an-detail.json"
LEGACY_ALIASES = {
    "sword": "1001", "precision": "1002", "stratagem": "1003",
    "dragon": "1004", "iron": "1005", "holy": "1006",
    "reverse": "1007", "command": "1008", "control": "1009",
    "boulder": "1010", "strength": "1011", "hoof": "1012",
    "steel": "1013", "turtle": "1014", "diamond": "1015",
    "flame": "1003", "charge": "1002", "storm": "1006",
}


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(root: Path = ROOT) -> tuple[dict, dict]:
    raw_dir = root / RAW.relative_to(ROOT)
    manifest = read(raw_dir / "capture_manifest.json")
    source_path = raw_dir / "quan-an-detail.json"
    source = read(source_path)
    file_record = next((x for x in manifest["files"] if x["file"] == source_path.name), None)
    if not file_record or sha(source_path) != file_record["sha256"]:
        raise ValueError("Quan An raw snapshot hash does not match its capture manifest")
    if manifest.get("sourcePage") != PAGE or file_record.get("url") != DATA_URL:
        raise ValueError("Seal source URL/edition drift")

    seals = source.get("seals")
    costs = source.get("cost")
    if not isinstance(seals, list) or len(seals) != 25 or len({str(x.get("key")) for x in seals}) != 25:
        raise ValueError("Expected 25 unique Mobile seal IDs")
    if not isinstance(costs, list) or len(costs) != 249 or [x.get("lv") for x in costs] != list(range(2, 251)):
        raise ValueError("Expected exact destination-level upgrade costs Lv2-Lv250")
    if source.get("currency", {}).get("ct", {}).get("name") != "Chiến Tích" or source.get("currency", {}).get("hp", {}).get("name") != "Hổ Phù":
        raise ValueError("Mobile seal currencies changed")
    for cost in costs:
        if any(not isinstance(cost.get(k), int) or cost[k] < 0 for k in ("ct", "hp")):
            raise ValueError(f"Invalid source cost row: {cost}")

    normalized_seals = []
    crosswalk_seals = []
    level_series_count = 0
    for item in seals:
        attrs = item.get("attrs") or []
        if not attrs:
            raise ValueError(f"Seal {item.get('key')} has no attributes")
        normalized_attrs = []
        for attr in attrs:
            is_pct = attr.get("pct") is True
            fixed = attr.get("fixed")
            series = attr.get("series")
            if is_pct:
                if not isinstance(fixed, (int, float)) or series is not None:
                    raise ValueError(f"Invalid fixed percentage for {item['key']} / {attr.get('label')}")
                kind = "fixedPercent"
                classification = "SOURCE_EXACT"
            else:
                if not isinstance(series, list) or len(series) != 250 or any(not isinstance(v, int) or v < 0 for v in series):
                    raise ValueError(f"Expected exact 250-level flat stat series for {item['key']} / {attr.get('label')}")
                level_series_count += 1
                if fixed is not None:
                    raise ValueError(f"Unexpected fixed value for series field {item['key']} / {attr.get('label')}")
                kind = "levelSeries"
                classification = "SOURCE_EXACT"
            normalized_attrs.append({"label": attr["label"], "kind": kind, "fixed": fixed, "series": series})
            crosswalk_seals.append({
                "sealId": str(item["key"]), "field": f"attributes.{attr['label']}",
                "classification": classification,
                "source": DATA_URL,
                "runtimeMapping": "Fixed percentage applied once as a multiplier" if is_pct else "Exact raw level value; P2 conversion is recorded separately"
            })
        if not isinstance(item.get("actMax"), int) or item["actMax"] < 0:
            raise ValueError(f"Invalid activation maximum for {item.get('key')}")
        normalized_seals.append({
            "id": str(item["key"]), "name": item["name"], "linkedFormation": item.get("linked"),
            "new": bool(item.get("moi")), "icon": item.get("icon"), "attributes": normalized_attrs,
            "activation": {"ranks": 25, "maxTotal": item["actMax"],
                           "rankValuesClassification": "SIMULATED", "rankCostClassification": "SIMULATED"},
            "unlockCondition": ({"classification": "SOURCE_EXACT", "kind": "BASIC_NO_FORMATION"}
                                if not item.get("linked") else
                                {"classification": "SOURCE_EXACT", "kind": "OWN_FORMATION", "formation": item["linked"]})
        })
    totals = {k: sum(row[k] for row in costs) for k in ("ct", "hp")}
    xung = next(x for x in normalized_seals if x["id"] == "1002")
    if (xung["attributes"][0] != {"label": "Pháp Công (%)", "kind": "fixedPercent", "fixed": 6, "series": None}
        or xung["attributes"][1]["label"] != "C.C"
        or xung["attributes"][1]["series"][0] != 175
        or xung["attributes"][1]["series"][-1] != 56487
        or xung["activation"]["maxTotal"] != 2071
        or totals != {"ct": 66897820, "hp": 9}
        or [(x["lv"], x["hp"]) for x in costs if x["hp"]] != [(210, 1), (220, 1), (230, 2), (240, 2), (250, 3)]):
        raise ValueError("Owner Xung Trận regression values do not match official source data")

    source_info = {
        "classification": "SOURCE_EXACT", "sourceEdition": manifest["sourceEdition"],
        "retrievedDate": manifest["retrievedDate"], "page": PAGE, "dataUrl": DATA_URL,
        "rawSha256": file_record["sha256"], "bundleSha256": next(x["sha256"] for x in manifest["files"] if x["file"] == "ngoa-long-wiki.js"),
    }
    normalized = {
        "schemaVersion": 2, "source": source_info,
        "currencies": {"chienTich": {"name": "Chiến Tích", "classification": "SOURCE_EXACT"},
                       "hoPhu": {"name": "Hổ Phù", "classification": "SOURCE_EXACT"}},
        "levelCap": 250, "upgradeCosts": costs, "upgradeCostTotal": {"chienTich": totals["ct"], "hoPhu": totals["hp"]},
        "activationRanks": 25, "seals": normalized_seals,
        "runtimeAdapter": {
            "classification": "DERIVED_FROM_SOURCE",
            "flatPointScale": 0.001,
            "flatPointScaleReason": "Source Mobile flat stats and native P2 stats use incompatible numeric scales; raw Wiki values remain visible and are not overwritten.",
            "statTargets": {"V.C": "atk", "C.C": "catk", "M.C": "matk", "V.P": "def", "C.P": "tdef", "M.P": "mdef",
                            "Vật Công (%)": "atk", "Pháp Công (%)": "catk", "Mưu Công (%)": "matk",
                            "Vật Phòng (%)": "def", "Pháp Phòng (%)": "tdef", "Mưu Phòng (%)": "mdef",
                            "Tất cả công (%)": ["atk", "catk", "matk"], "Tất cả phòng (%)": ["def", "tdef", "mdef"],
                            "Tất cả công": ["atk", "catk", "matk"], "Tất cả phòng": ["def", "tdef", "mdef"],
                            "Dẫn binh": "troopCapacity", "Hồi phục (%)": "healingMultiplier"},
            "linkedSealActivation": "active only while its exact source formation is selected; source unlock condition is ownership",
            "activationDistribution": "SIMULATED: distribute the published maxTotal evenly across 25 ranks; split total evenly across flat attributes, with remainder assigned in source order.",
            "activationCost": "SIMULATED: Chiến Tích only; formula is implemented in runtime and shown in UI.",
            "discount": "UNRESOLVED: the official page labels seal quotes as base prices but publishes no seal-specific discount formula; equipment discounts are explicitly not reused.",
            "currencyAcquisition": "SIMULATED: earned only through successful native first clears/repeats and map completions; no free/debug grants.",
            "attributeSemantics": "DERIVED_FROM_SOURCE: flat stat abbreviations map to their corresponding native P2 combat axes; Dẫn binh maps to troop capacity, Hồi phục to healing output.",
            "legacyMigration": "SIMULATED: stable v1 project seal aliases map to Mobile IDs; collisions merge by max and are recorded in a migration ledger."
        },
        "legacyAliases": LEGACY_ALIASES,
    }
    crosswalk = {
        "schemaVersion": 1, "system": "Mobile Seal V2 / Ấn Trận",
        "source": source_info,
        "fields": [
            {"field": "seal.id/name/new/linkedFormation/unlockCondition", "classification": "SOURCE_EXACT", "coverage": 25},
            {"field": "seal.attributes.fixed/series", "classification": "SOURCE_EXACT", "coverage": f"all fixed attributes and {level_series_count} × 250 level points"},
            {"field": "upgradeCosts Lv2-Lv250 including Chiến Tích/Hổ Phù", "classification": "SOURCE_EXACT", "coverage": 249},
            {"field": "activation rank count and maxTotal", "classification": "SOURCE_EXACT", "coverage": 25},
            {"field": "activation per-rank distribution and rank costs", "classification": "SIMULATED", "coverage": 25, "reason": "Not present in the public detail payload or its page renderer."},
            {"field": "seal discount formula and eligibility", "classification": "UNRESOLVED", "reason": "The public page states prices are before discount but exposes no seal-specific rule; equipment discount text is separate."},
            {"field": "currency acquisition rates", "classification": "SIMULATED", "reason": "Not published by this calculator; earned-only runtime routes are used."},
            {"field": "native P2 stat projection", "classification": "DERIVED_FROM_SOURCE", "reason": "Explicit 1/1000 flat-scale adapter; raw Wiki stats remain unchanged in the source dataset."},
            *crosswalk_seals,
        ],
    }
    return normalized, crosswalk


def write_outputs(root: Path = ROOT, check: bool = False) -> None:
    normalized, crosswalk = normalize(root)
    out = root / OUT.relative_to(ROOT)
    out.mkdir(parents=True, exist_ok=True)
    for filename, data in (("mobile_seal_v2.json", normalized), ("mobile_seal_v2_crosswalk.json", crosswalk)):
        path = out / filename
        rendered = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != rendered:
                raise SystemExit(f"{path.relative_to(root)} is stale; run python tools/nl_mobile_seal_v2.py")
        else:
            path.write_text(rendered, encoding="utf-8")
    print("Seal V2 source PASS: 25 seals, 31 exact series / 7,750 level values, 249 exact upgrade rows; Xung Trận totals 66,897,820 Chiến Tích + 9 Hổ Phù.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_outputs(check=args.check)
