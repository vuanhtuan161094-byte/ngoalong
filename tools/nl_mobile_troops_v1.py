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
TYPE_ROLES = {1: "infantry", 2: "spear", 3: "cavalry", 4: "archer", 5: "strategist"}
STAT_ADAPTER = {
    "strengthAtk": "atk",
    "leaderAtk": "catk",
    "intellectAtk": "matk",
    "strengthDef": "def",
    "leaderDef": "tdef",
    "intellectDef": "mdef",
}
REQUIRED_STATS = (*STAT_ADAPTER, "critical", "strikeBack")

# The descriptions and level values are copied from the source payload. These
# bindings name the existing native P2 adapters; they do not assert that the
# original server's hidden damage/order formula has been recovered.
SPECIAL_RUNTIME_BINDINGS = {
    "Can Đảm": ("controlResistanceCharges", "applyMobileTroopProfile → p2Status; exact 2/3/5 charge counts; covered control tags only."),
    "Khích Lệ": ("moraleOnOwnerAction", "p2Perform; exact actions 2–6 and exact morale per rank."),
    "Lợi Nhẫn": ("outgoingDamageMultiplier", "mobileTraitFactors; exact 3/5/8% source values."),
    "Toàn Năng": ("heroAttributesFlat", "p2Unit; exact +9/+15/+24 source attribute values."),
    "Trọng Giáp": ("incomingDamageMultiplier", "mobileTraitFactors; exact 3/5/8% source values."),
    "Vững Chắc": ("openingResistancePool", "P2 one-time damage absorb uses the exact 9/15/24% source amount; interpreting Đề Kháng 2 as an absorb pool is DERIVED_FROM_SOURCE."),
    "Bạch Nhẫn": ("physicalAndTacticDamageMultiplier", "mobileTraitFactors; exact 4/7/12% source values."),
    "Bất Khuất": ("lowTroopIncomingDamageMultiplier", "mobileTraitFactors; exact below-50% gate and 6/10/16% source values."),
    "Chước Giới": ("normalActionBlock", "p2Perform; exact 15/24/40% and one-action duration; random target selection is SIMULATED."),
    "Công Tâm": ("enemyMoraleReduction", "p2Perform; exact 30/50/80% and -15 morale; target selection is SIMULATED."),
    "Giẫm Đạp": ("lineStacksThenControl", "p2Perform; exact 9/15/24% and four-stack threshold; line targeting interpretation is SIMULATED."),
    "Hoành Tảo": ("rowAndColumnDamageMultiplier", "mobileTraitFactors; exact 4/7/12% source values."),
    "Hãm Trận": ("lowTroopOutgoingDamageMultiplier", "mobileTraitFactors; exact below-50% gate and 6/10/16% source values."),
    "Kình Nỏ": ("defenseIgnore", "p2Perform/mobileSingleHit; exact proc 15/24/40% and 10% defense reduction for one action."),
    "Nhiễu Hậu": ("damageVsStrategistMultiplier", "mobileTraitFactors; exact 9/15/24% source values."),
    "Phương Viên": ("damageVsCavalryAndArcherMultiplier", "mobileTraitFactors; exact 9/15/24% source values."),
    "Sách Phản": ("singleAndAllTargetDamageMultiplier", "mobileTraitFactors; exact 4/7/12% source values."),
    "Trù Sách": ("tacticDamageMultiplier", "mobileTraitFactors; exact 4/7/12% source values."),
    "Tật Hành": ("firstThreeRoundsDamageMultiplier", "mobileTraitFactors; exact three-round gate and 9/15/24% source values."),
    "Xạ Thủ": ("singleAndAllTargetDamageMultiplier", "mobileTraitFactors; exact 4/7/12% source values."),
    "Ẩn Nấp": ("firstThreeRoundsIncomingDamageMultiplier", "mobileTraitFactors; exact three-round gate and 9/15/24% source values."),
}


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

    campaign_path = ROOT / "data/ngoalong/modules/campaign/mobile_campaign_v1.json"
    campaign = read(campaign_path)
    if campaign.get("counts", {}).get("maps") != 249 or campaign.get("counts", {}).get("npcs") != 5063:
        raise ValueError("MOBILE_TROOP_CAMPAIGN_LINK_SOURCE_COUNTS_DRIFT")
    campaign_troop_rows = [unit for map_row in campaign.get("maps", [])
                           for npc in map_row.get("npcs", []) for unit in npc.get("units", [])]
    campaign_troop_ids = {str(unit.get("sourceTroopId")) for unit in campaign_troop_rows
                          if unit.get("sourceTroopId") is not None}
    unknown_campaign_ids = sorted(campaign_troop_ids - set(units), key=lambda x: int(x))
    if len(campaign_troop_rows) != 23944 or len(campaign_troop_ids) != 346 or unknown_campaign_ids:
        raise ValueError("MOBILE_TROOP_CAMPAIGN_LINK_COVERAGE_DRIFT")
    if any(not unit.get("sourceTroopId") for unit in campaign_troop_rows):
        raise ValueError("MOBILE_TROOP_CAMPAIGN_UNIT_WITHOUT_SOURCE_ID")

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
    source_usage = {}
    base_ids = set(BASE_RUNTIME_ROLES.values())
    selectable_ids = set()
    for unit_id, row in units.items():
        role = TYPE_ROLES.get(row.get("type"))
        selectable = bool(role and not row.get("npc") and not row.get("pbOnly") and
                          (unit_id in base_ids or (isinstance(row.get("tier"), int) and row["tier"] > 0)))
        if selectable:
            selectable_ids.add(unit_id)
        usages = []
        if unit_id in campaign_troop_ids:
            usages.append("MOBILE_CAMPAIGN_ENEMY")
        if selectable:
            usages.append("PLAYER_SELECTABLE")
        if row.get("type") in (6, 7, 8):
            usages.append("OFFLINE_NAVAL_OBJECTIVE")
        source_usage[unit_id] = usages or ["SOURCE_CATALOGUE_ONLY"]
    if len(selectable_ids) != 225:
        raise ValueError("MOBILE_TROOP_SELECTABLE_COVERAGE_DRIFT")

    fields = []
    for unit_id, row in sorted(units.items(), key=lambda item: int(item[0])):
        role = TYPE_ROLES.get(row.get("type"))
        active = source_usage[unit_id] != ["SOURCE_CATALOGUE_ONLY"]
        for key in sorted(row):
            runtime_field = None
            runtime_classification = "SOURCE_EXACT"
            runtime_status = "UNMAPPED"
            if key == "id":
                runtime_field = "P2 source troop identity"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_NATIVE_P2" if active else "SOURCE_CATALOGUE_ONLY"
            elif key in ("name", "typeName", "tier", "desc"):
                runtime_field = "Troop catalogue and battle profile"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "DISPLAYED" if active else "SOURCE_CATALOGUE_ONLY"
            elif key == "type":
                runtime_field = "P2 troop family and role eligibility"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_NATIVE_P2" if active else "SOURCE_CATALOGUE_ONLY"
            elif key == "icon":
                runtime_field = "Wiki CDN icon reference"
                runtime_status = "SOURCE_REFERENCE_NOT_EMBEDDED"
            elif key in ("npc", "pbOnly"):
                runtime_field = "Player selection guard"
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_SELECTION" if key in row else "SOURCE_CATALOGUE_ONLY"
            elif key in ("stats", "descPb"):
                runtime_field = "P2 troop coefficients" if key == "stats" else None
                runtime_classification = "DERIVED_FROM_SOURCE"
                runtime_status = "APPLIED_TO_NATIVE_P2" if active and key == "stats" else "SOURCE_CATALOGUE_ONLY"
            fields.append({"sourcePointer": f"/units/{unit_id}/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL, "runtimeField": runtime_field,
                           "runtimeClassification": runtime_classification if runtime_field else None,
                           "runtimeStatus": runtime_status, "runtimeRole": role,
                           "runtimeUses": source_usage[unit_id]})
        for key in sorted(row.get("stats", {})):
            target = STAT_ADAPTER.get(key) or {"critical": "crit", "strikeBack": "counterChance"}.get(key)
            formula = None
            if active and key in STAT_ADAPTER:
                formula = "round(currentP2Stat × exact Mobile coefficient); P2 axis mapping is DERIVED_FROM_SOURCE"
            elif active and key == "critical":
                formula = "replace generic role critical add-on with exact Mobile chance; preserve formation critical"
            elif active and key == "strikeBack":
                formula = "exact Mobile probability; one native counter per hit defender/action; counter damage 0.60 physical P2 is SIMULATED"
            fields.append({"sourcePointer": f"/units/{unit_id}/stats/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL, "runtimeField": target if active else None,
                           "runtimeClassification": "DERIVED_FROM_SOURCE" if active and target else None,
                           "runtimeStatus": "APPLIED_TO_NATIVE_P2" if active and target else "SOURCE_CATALOGUE_ONLY",
                           "runtimeRole": role, "runtimeUses": source_usage[unit_id], "adapterFormula": formula})
    for index, row in enumerate(raw.get("specials", [])):
        binding = SPECIAL_RUNTIME_BINDINGS.get(row.get("name"))
        if not binding:
            raise ValueError("MOBILE_TROOP_SPECIAL_WITHOUT_RUNTIME_BINDING:" + str(row.get("name")))
        for key in sorted(row):
            fields.append({"sourcePointer": f"/specials/{index}/{key}", "sourceClassification": "SOURCE_EXACT",
                           "sourceUrl": SOURCE_URL,
                           "runtimeField": (binding[0] if key in ("name", "levels") else
                                            "compatibleTroopTypes" if key == "types" else None),
                           "runtimeClassification": "DERIVED_FROM_SOURCE" if key in ("name", "levels", "types") else None,
                           "runtimeStatus": "APPLIED_TO_NATIVE_P2" if key in ("name", "levels", "types") else "SOURCE_EXACT_RETAINED",
                           "adapterFormula": binding[1] if key == "levels" else None})
    if len(raw.get("specials", [])) != len(SPECIAL_RUNTIME_BINDINGS):
        raise ValueError("MOBILE_TROOP_SPECIAL_RUNTIME_COUNT_DRIFT")
    crosswalk = {
        "schemaVersion": 1,
        "sourceEdition": data["sourceEdition"],
        "sourcePage": PAGE_URL,
        "sourceDataUrl": SOURCE_URL,
        "sourceSha256": source_hash,
        "classificationPolicy": "The public table is source-exact; stat-to-P2 coefficient semantics are DERIVED_FROM_SOURCE, not a recovered P2 formula. Unsupported troop-specific operations remain UNMAPPED.",
        "runtimeAdapter": {
            "roles": BASE_RUNTIME_ROLES,
            "runtimeCoverage": {"sourceProfiles": len(units), "playerSelectableProfiles": len(selectable_ids),
                                "campaignFormationUnits": len(campaign_troop_rows), "campaignResolvedSourceIds": len(campaign_troop_ids),
                                "campaignUnknownSourceIds": len(unknown_campaign_ids), "campaignMaps": 249, "campaignNpcs": 5063,
                                "sourceTraitsBound": len(raw.get("specials", [])),
                                "sourceCatalogueOnlyProfiles": sum(1 for uses in source_usage.values() if uses == ["SOURCE_CATALOGUE_ONLY"])},
            "attackMappings": {"strengthAtk": "atk", "leaderAtk": "catk", "intellectAtk": "matk"},
            "defenseMappings": {"strengthDef": "def", "leaderDef": "tdef", "intellectDef": "mdef"},
            "critical": "replaces the old generic troop critical add-on while retaining formation crit",
            "strikeBack": "SOURCE_EXACT probability applied by the native normal-hit counter event; at most one counter per defender/action and no recursive turns. Counter damage at 0.60 physical P2 is SIMULATED.",
            "campaignTroops": "All 23,944 source formation unit references resolve to 346 unique source troop profiles; unmatched references fail normalization and native startup.",
            "selectableTroops": "225 profiles are selectable using the current explicit roster rule. Source records without a verified recruitment route remain catalogue-only rather than being labelled recruitable.",
            "specials": "21 source traits are wired to native P2 adapters listed in the field crosswalk; any adapter-specific target interpretation is marked DERIVED or SIMULATED there.",
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
    print("Mobile troop source PASS: 408 profiles, 23,944/23,944 campaign unit links resolved, 346 source IDs active in campaign, 225 selectable, 21 trait bindings.")


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
