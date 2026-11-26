#!/usr/bin/env python3
"""Normalize the complete public VNG Mobile campaign snapshot (Vietnam edition)."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
OUT = ROOT / "data/ngoalong/modules/campaign/mobile_campaign_v1.json"
CROSSWALK = ROOT / "data/ngoalong/modules/campaign/mobile_campaign_crosswalk_v1.json"
PAGE = "https://ngoalong.vnggames.com/ngoa-long-wiki/pho-ban-chi-tiet"
ROLE_BY_TYPE = {"Bộ Binh": "infantry", "Thương Binh": "spear", "Kỵ Binh": "cavalry",
                "Cung Binh": "archer", "Quan Văn": "strategist"}


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def compact_source_rows(rows):
    """Retain every gameplay/economy source field; strip image URLs only."""
    result = []
    for row in rows or []:
        if not isinstance(row, dict):
            result.append(row)
            continue
        result.append({k: v for k, v in row.items() if k != "icon"})
    return result


def normalize(root: Path = ROOT) -> tuple[dict, dict]:
    raw_root = root / RAW.relative_to(ROOT)
    manifest = read(raw_root / "capture_manifest.json")
    by_file = {row["file"]: row for row in manifest["files"]}
    troop_doc = read(raw_root / "data/unit-detail.json")
    troop_types = {str(key): row.get("typeName") for key, row in troop_doc["units"].items()}
    source_paths = sorted((raw_root / "data/campaign").glob("[0-9]*.json"))
    source_paths = [path for path in source_paths if not path.stem.endswith("-cb")]
    if len(source_paths) != 249:
        raise ValueError("MOBILE_CAMPAIGN_MAP_COUNT_DRIFT")

    maps = []
    all_ids = set()
    unknown_troops = {}
    formation_count = 0
    formation_effect_units = 0
    formation_effect_rows = 0
    formation_effect_ids = set()
    formation_effect_names = set()
    empty_formations = 0
    source_npc_count = 0
    for source_path in source_paths:
        rel = source_path.relative_to(raw_root).as_posix()
        capture = by_file.get(rel)
        digest = hashlib.sha256(source_path.read_bytes()).hexdigest()
        if not capture or capture["sha256"] != digest:
            raise ValueError("MOBILE_CAMPAIGN_SOURCE_HASH_MISMATCH:" + rel)
        doc = read(source_path)
        map_id = str(doc.get("key"))
        vn = doc.get("vn") or {}
        raw_npcs = vn.get("npcs") or []
        if not map_id.isdigit() or not isinstance(raw_npcs, list):
            raise ValueError("MOBILE_CAMPAIGN_MAP_SCHEMA:" + rel)
        npcs = []
        for order, raw_npc in enumerate(raw_npcs, start=1):
            ident = str(raw_npc.get("ident"))
            npc_id = f"wiki-m{map_id}-ai{ident}"
            if npc_id in all_ids:
                raise ValueError("MOBILE_CAMPAIGN_DUPLICATE_NPC:" + npc_id)
            all_ids.add(npc_id)
            source_npc_count += 1
            formation = raw_npc.get("formation") or []
            if not formation:
                empty_formations += 1
            seen_slots = set()
            units = []
            for raw_unit in formation:
                pos = raw_unit.get("pos")
                if not isinstance(pos, int) or isinstance(pos, bool) or not 1 <= pos <= 9 or pos in seen_slots:
                    raise ValueError("MOBILE_CAMPAIGN_FORMATION_POSITION:" + npc_id)
                seen_slots.add(pos)
                soldier_id = str(raw_unit.get("soldierId") or "")
                type_name = troop_types.get(soldier_id)
                role = ROLE_BY_TYPE.get(type_name)
                if role is None:
                    unknown_troops[soldier_id] = unknown_troops.get(soldier_id, 0) + 1
                skill = raw_unit.get("activeSkill") or {}
                effects = compact_source_rows(raw_unit.get("effects"))
                if effects:
                    formation_effect_units += 1
                for effect in effects:
                    if isinstance(effect, dict):
                        if effect.get("id") is not None:
                            formation_effect_ids.add(str(effect["id"]))
                        if effect.get("name"):
                            formation_effect_names.add(effect["name"])
                    formation_effect_rows += 1
                units.append({
                    "slot": pos - 1,
                    "sourcePosition": pos,
                    "name": raw_unit.get("general") or raw_npc.get("name") or "Quân địch",
                    "sourceTroopId": soldier_id,
                    "sourceTroopType": type_name,
                    "role": role or "support",
                    "sourceHp": raw_unit.get("hp"),
                    "level": raw_unit.get("level"),
                    "skill": {k: v for k, v in skill.items() if k != "icon"},
                    "effects": effects,
                })
                formation_count += 1
            npc_source = {
                "ident": raw_npc.get("ident"), "type": raw_npc.get("type"),
                "level": raw_npc.get("level"), "troops": raw_npc.get("troops"),
                "merit": raw_npc.get("merit"), "power": raw_npc.get("power"),
                "fastAttack": raw_npc.get("fastAttack"), "qtyLimit": raw_npc.get("qtyLimit"),
                "drops": compact_source_rows(raw_npc.get("drops")),
                "souls": raw_npc.get("souls") or [], "effects": compact_source_rows(raw_npc.get("effects")),
                "formationCount": len(units),
            }
            npcs.append({
                "id": npc_id, "order": order, "name": raw_npc.get("name") or npc_id,
                "boss": raw_npc.get("type") == "boss", "units": units, "source": npc_source,
                "sourceUrl": f"{PAGE}?map={map_id}&ai={ident}&side=vn",
            })
        maps.append({
            "sourceId": map_id, "name": doc.get("name") or map_id,
            "sub": doc.get("sub"), "mapLevel": doc.get("mapLevel"),
            "unlockLevel": doc.get("unlockLevel"), "hard": doc.get("hard"),
            "isSub": doc.get("isSub"), "isMain": doc.get("isMain"),
            "isHidden": doc.get("isHidden"), "tcUnlock": doc.get("tcUnlock"),
            "tcGroup": doc.get("tcGroup"),
            "battleRewards": compact_source_rows(vn.get("rewards")),
            "achievementRewards": compact_source_rows(vn.get("thanhTuu")),
            "buffs": vn.get("buffs") or [], "npcs": npcs,
            "sourceUrl": f"{PAGE}?map={map_id}&side=vn",
        })
    maps.sort(key=lambda m: int(m["sourceId"]))
    if source_npc_count != 5063 or len(all_ids) != 5063:
        raise ValueError("MOBILE_CAMPAIGN_NPC_COUNT_DRIFT")
    data = {
        "schemaVersion": 1,
        "sourceEdition": "CURRENT_VNG_MOBILE_WIKI_VIETNAMESE",
        "sourceManifest": "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw/capture_manifest.json",
        "sourceCampaignFolderSha256": "field hashes are pinned per source JSON in the capture manifest",
        "counts": {"maps": len(maps), "npcs": source_npc_count, "formations": formation_count,
                   "formationEffectUnits": formation_effect_units,
                   "formationEffectRows": formation_effect_rows,
                   "formationEffectIds": len(formation_effect_ids),
                   "formationEffectNames": len(formation_effect_names),
                   "emptyFormations": empty_formations,
                   "unknownTroopIds": unknown_troops},
        "maps": maps,
    }
    fields = []
    for pointer, runtime, status in [
        ("/key", "map sourceId", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/name", "map name", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/mapLevel", "map sourceLevel", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/unlockLevel", "exact Wiki unlock threshold; commander-level earning pace is a documented simulation", "APPLIED_EXACT_THRESHOLD_WITH_SIMULATED_LEVEL_PROGRESS"),
        ("/vn/npcs/ident", "stable Save-compatible NPC ID", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/vn/npcs/name", "campaign NPC label", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/vn/npcs/type", "boss identity and source type", "APPLIED_TO_NATIVE_CAMPAIGN"),
        ("/vn/npcs/level", "source NPC level", "PRESERVED_AND_DISPLAYED"),
        ("/vn/npcs/troops", "source total troops and P2 enemy scaling input", "APPLIED_WITH_PROJECT_P2_SCALING"),
        ("/vn/npcs/merit", "battle merit reward", "APPLIED_TO_NATIVE_SETTLEMENT"),
        ("/vn/npcs/power", "source combat power", "PRESERVED_AND_DISPLAYED"),
        ("/vn/npcs/drops", "exact named drop list and chance in normalized source DB; item grant adapter", "SOURCE_DB_EXACT_RUNTIME_GRANT_UNRESOLVED"),
        ("/vn/npcs/souls", "exact source soul effects in normalized source DB", "SOURCE_DB_EXACT_RUNTIME_ADAPTER_UNRESOLVED"),
        ("/vn/npcs/effects", "exact NPC effects in normalized source DB", "SOURCE_DB_EXACT_RUNTIME_ADAPTER_UNRESOLVED"),
        ("/vn/npcs/formation", "all source 1-9 positions; zero-row records use an explicitly marked donor adapter", "APPLIED_OR_SIMULATED_DONOR_TO_NATIVE_P2_3X3"),
        ("/vn/npcs/formation/soldierId", "source troop ID and role", "APPLIED_TO_NATIVE_P2"),
        ("/vn/npcs/formation/hp", "source unit HP retained; P2 battle scale adapter", "PRESERVED_AND_USED_AS_SCALE_INPUT"),
        ("/vn/npcs/formation/effects", "exact unit effect IDs, names, descriptions and detail strings carried onto native units; effect ID 3 is adapted as source damage-to-1 while remaining effect IDs stay unresolved", "SOURCE_EXACT_PRESERVED_PARTIAL_EFFECT_ADAPTER"),
        ("/vn/npcs/formation/activeSkill/name", "exact source skill name used by the native combat event", "SOURCE_EXACT_APPLIED_TO_NATIVE_P2"),
        ("/vn/npcs/formation/activeSkill/desc", "exact source skill description preserved on the combat unit and descriptor", "SOURCE_EXACT_PRESERVED_IN_RUNTIME"),
        ("/vn/npcs/formation/activeSkill/desc/coefficient", "simple single-hit coefficient parsed from the source description into the P2 scale; unparsed or multi-stage formulas retain an explicit fallback", "PARTIALLY_DERIVED_FROM_SOURCE_WITH_SIMULATED_FALLBACK"),
        ("/vn/npcs/formation/activeSkill/desc/target", "single, row, column, back-row, all-enemy, and all-ally targets parsed when stated; other target language remains unresolved", "PARTIALLY_DERIVED_FROM_SOURCE_WITH_UNRESOLVED_FALLBACK"),
        ("/vn/npcs/formation/activeSkill/desc/secondaryEffects", "Thiết Bích source text/detail maps to native damage-to-1 for its stated duration; other statuses, multi-hit rules, chances and conditions remain unresolved", "PARTIAL_SOURCE_STATUS_ADAPTER_WITH_UNRESOLVED_REMAINDER"),
        ("/vn/npcs/formation/activeSkill/moraleOnly", "fixed morale-only allied skills map to native morale events; mixed/global/status skills remain unresolved or simulated", "PARTIAL_SOURCE_MORALE_ACTION_ADAPTER"),
        ("/vn/thanhTuu", "exact supported Silver/Gold achievements granted; other reward types and Tướng Hồn pace remain separate adapters", "SOURCE_EXACT_SUPPORTED_CURRENCIES_GRANTED"),
        ("/vn/rewards", "map reward list; grant semantics not documented in snapshot", "PRESERVED_REWARD_ADAPTER_UNRESOLVED"),
        ("/vn/buffs", "map buffs", "PRESERVED_EFFECT_ADAPTER_UNRESOLVED"),
    ]:
        fields.append({"sourcePointer": pointer, "sourceClassification": "SOURCE_EXACT",
                       "runtimeField": runtime, "runtimeStatus": status,
                       "sourcePage": PAGE, "sourceEdition": data["sourceEdition"]})
    crosswalk = {
        "schemaVersion": 1, "sourceEdition": data["sourceEdition"],
        "sourceManifest": data["sourceManifest"],
        "coverage": {"maps": len(maps), "npcs": source_npc_count, "formations": formation_count,
                     "formationEffectUnits": formation_effect_units,
                     "formationEffectRows": formation_effect_rows,
                     "formationEffectIds": len(formation_effect_ids),
                     "formationEffectNames": len(formation_effect_names),
                     "emptyFormationRecords": empty_formations,
                     "legacyNativeNpcCount": 4903, "sourceNpcCountDelta": source_npc_count - 4903,
                     "legacyIdPreservation": "verified in the canonical projection against all 4,903 previously shipped NPC IDs",
                     "sourceMapNpcCount": [len(m["npcs"]) for m in maps],
                     "unknownSoldierIds": unknown_troops},
        "classificationPolicy": "Source records are exact from the captured Vietnamese Wiki edition; campaign skill names/descriptions are preserved, simple coefficient/target text is parsed into a P2 adapter, unsupported secondary mechanics are unresolved or explicitly simulated, and P2 stat scaling remains project-adapted.",
        "fields": fields,
    }
    return data, crosswalk


def write(check=False):
    data, crosswalk = normalize()
    for path, payload in ((OUT, data), (CROSSWALK, crosswalk)):
        expected = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                raise ValueError("STALE_GENERATED_DATA:" + path.relative_to(ROOT).as_posix())
        else:
            path.write_text(expected, encoding="utf-8")
    print(f"Mobile campaign source PASS: 249 maps, 5,063 NPCs, {data['counts']['formations']} formations; exact Vietnamese records normalized.")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        write(args.check)
    except Exception as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
