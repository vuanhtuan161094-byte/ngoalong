"""Validate and normalize the public Mobile Thống Soái/Tinh Nhuệ payload."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
DATA_OUT = ROOT / "data/ngoalong/modules/troops/mobile_elite_v1.json"
CROSSWALK_OUT = ROOT / "data/ngoalong/modules/troops/mobile_elite_v1_crosswalk.json"
PAGE = "https://ngoalong.vnggames.com/ngoa-long-wiki/thong-soai"
DATA_URL = "https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/data/elite-detail.json"
STAT_KEYS = ("leaderAtk", "leaderDef", "strengthAtk", "strengthDef", "intellectAtk", "intellectDef")
MATERIAL_IDS = ("mat_63", "mat_73", "mat_74", "mat_75", "mat_76", "mat_77")


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def normalize(root: Path = ROOT) -> tuple[dict, dict]:
    raw_dir = root / RAW.relative_to(ROOT)
    manifest = read(raw_dir / "capture_manifest.json")
    source_path = raw_dir / "data/elite-detail.json"
    source = read(source_path)
    record = next((x for x in manifest["files"] if x["file"] == "data/elite-detail.json"), None)
    if not record or record.get("sha256") != sha(source_path):
        raise ValueError("MOBILE_ELITE_SOURCE_HASH_MISMATCH")
    if manifest.get("sourceEdition") != "CURRENT_VNG_MOBILE_PUBLIC_WIKI":
        raise ValueError("MOBILE_ELITE_SOURCE_EDITION_DRIFT")

    forces = source.get("forces")
    appearances = [a for f in forces or [] for a in f.get("appearances", [])]
    stats = source.get("levelStats")
    meta = source.get("meta") or {}
    if not isinstance(forces, list) or len(forces) != 16 or len({str(f.get("id")) for f in forces}) != 16:
        raise ValueError("MOBILE_ELITE_FORCE_COVERAGE_DRIFT")
    if len(appearances) != 20 or len({str(a.get("id")) for a in appearances}) != 20:
        raise ValueError("MOBILE_ELITE_APPEARANCE_COVERAGE_DRIFT")
    if not isinstance(stats, dict) or set(stats) != {str(a["id"]) for a in appearances}:
        raise ValueError("MOBILE_ELITE_LEVEL_STAT_ID_DRIFT")
    if meta.get("nationMult") != {"same": 1, "quan": 1.5, "diff": 2}:
        raise ValueError("MOBILE_ELITE_NATION_MULTIPLIER_DRIFT")
    skill_upgrades = meta.get("skillUpgrades") or []
    if len(skill_upgrades) != 3 or {x.get("pos") for x in skill_upgrades} != {0, 1, 2}:
        raise ValueError("MOBILE_ELITE_SKILL_UPGRADE_TABLE_DRIFT")

    source_materials = set(MATERIAL_IDS)
    items = read(raw_dir / "data/item-detail.json").get("items", [])
    if not source_materials.issubset({str(x.get("id")) for x in items}):
        raise ValueError("MOBILE_ELITE_SOURCE_MATERIAL_IDS_MISSING")

    role_map: dict[str, str] = {}
    for force in forces:
        bases = [a for a in force["appearances"] if "ngoại hình" not in str(a.get("troopType", "")).casefold()]
        primary = bases[0] if bases else force["appearances"][0]
        troop_type = str(primary.get("troopType", ""))
        role = ("cavalry" if "kỵ" in troop_type.casefold() else
                "archer" if "cung" in troop_type.casefold() else
                "spear" if "thương" in troop_type.casefold() or "kích" in troop_type.casefold() else
                "infantry" if "bộ" in troop_type.casefold() else None)
        if not role:
            raise ValueError(f"MOBILE_ELITE_UNRESOLVED_TROOP_ROLE:{force.get('id')}:{troop_type}")
        for appearance in force["appearances"]:
            ident = str(appearance["id"])
            role_map[ident] = role
            rows = stats.get(ident)
            if not isinstance(rows, list) or len(rows) != 20 or [x.get("level") for x in rows] != list(range(1, 21)):
                raise ValueError(f"MOBILE_ELITE_LEVEL_TABLE_DRIFT:{ident}")
            if any(not isinstance(row.get(k), (int, float)) for row in rows for k in STAT_KEYS):
                raise ValueError(f"MOBILE_ELITE_LEVEL_STAT_MISSING:{ident}")
            if len(appearance.get("levels") or []) != 20 or [x.get("level") for x in appearance["levels"]] != list(range(1, 21)):
                raise ValueError(f"MOBILE_ELITE_COST_TABLE_DRIFT:{ident}")
            cost_rows = appearance["levels"]
            if any(not isinstance(x.get("cost"), (int, float)) or x["cost"] < 0 or
                   not isinstance(x.get("time"), (int, float)) or x["time"] < 0 for x in cost_rows) or \
                    any(b["time"] < a["time"] for a, b in zip(cost_rows, cost_rows[1:])):
                raise ValueError(f"MOBILE_ELITE_COST_TIME_VALUE_DRIFT:{ident}")
            if len(appearance.get("skills") or []) != 3:
                raise ValueError(f"MOBILE_ELITE_SKILL_COUNT_DRIFT:{ident}")
            if any(not isinstance(skill.get("levels"), list) or not skill["levels"] or
                   not all(isinstance(text, str) and text for text in skill["levels"]) for skill in appearance["skills"]):
                raise ValueError(f"MOBILE_ELITE_SKILL_TEXT_DRIFT:{ident}")
            if not set(appearance.get("exclusiveMaterialIds") or []).issubset({int(x) for x in meta.get("materials", {})}):
                raise ValueError(f"MOBILE_ELITE_EXCLUSIVE_MATERIAL_DRIFT:{ident}")
    if not isinstance(meta.get("materials"), dict) or set(meta["materials"]) != {"73", "74", "75", "76", "77"}:
        raise ValueError("MOBILE_ELITE_SKILL_MATERIALS_DRIFT")

    source_info = {
        "classification": "SOURCE_EXACT", "sourceEdition": manifest["sourceEdition"],
        "retrievedAtUtc": manifest["retrievedAtUtc"], "page": PAGE, "dataUrl": DATA_URL,
        "rawSha256": record["sha256"],
    }
    data = {
        "schemaVersion": 1, "source": source_info,
        "forceCount": len(forces), "appearanceCount": len(appearances),
        "levelCap": 20, "meta": meta, "forces": forces, "levelStats": stats,
        "sourceMaterials": list(MATERIAL_IDS),
        "runtimeAdapter": {
            "classification": "DERIVED_FROM_SOURCE",
            "roleByAppearanceId": role_map,
            "combatStatRule": "For an assigned elite appearance, replace the standard Mobile troop's six attack/defense coefficients with the exact selected elite appearance level row; preserve standard troop critical and strikeBack because the elite payload has no numeric replacements.",
            "upgradeDurationUnit": "SOURCE_EXACT_MINUTES",
            "sourceSkillAdapter": "Exact skill descriptions/rank text are preserved. Effects without an explicit numeric/order mapping remain unresolved until their P2 adapter batch; no generic simulated skill ranks are granted.",
            "assignmentScope": "SIMULATED: one elite appearance per hero, an appearance cannot be assigned to more than one hero at once, and its role must match the hero's Mobile troop role.",
            "materialAcquisition": "SIMULATED: source item IDs/names are exact; Wiki item rows provide no purchase/drop price for these materials, so the offline silver shop is explicitly simulated.",
            "timerConcurrency": "SIMULATED: each elite appearance has an independent saved upgrade timer.",
        },
    }
    crosswalk = {
        "schemaVersion": 1, "system": "VNG Mobile Thống Soái / Tinh Nhuệ",
        "source": source_info,
        "fields": [
            {"field": "force.id/name/camp/openLevel", "classification": "SOURCE_EXACT", "coverage": len(forces)},
            {"field": "appearance.id/name/troopType/desc/openLevel/skins", "classification": "SOURCE_EXACT", "coverage": len(appearances)},
            {"field": "appearance.stats and levelStats", "classification": "SOURCE_EXACT", "coverage": "20 appearances × 20 levels × six coefficients"},
            {"field": "appearance.levels cost/time", "classification": "SOURCE_EXACT", "coverage": "20 appearances × 20 levels; costs apply by destination level"},
            {"field": "nation multiplier same/quan/diff", "classification": "SOURCE_EXACT", "coverage": meta["nationMult"]},
            {"field": "skill descriptions/rank text", "classification": "SOURCE_EXACT", "coverage": "20 appearances × three skill tracks"},
            {"field": "skill upgrade rank requirements/item quantities", "classification": "SOURCE_EXACT", "coverage": "all three skill-position tables"},
            {"field": "material ids/names/descriptions", "classification": "SOURCE_EXACT", "coverage": list(MATERIAL_IDS)},
            {"field": "offline role/assignment restriction", "classification": "SIMULATED", "coverage": "one appearance per hero; no appearance duplicated across heroes; matching troop role"},
            {"field": "offline material acquisition price", "classification": "SIMULATED", "coverage": "silver shop; no source acquisition cost exists in item detail"},
            {"field": "P2 elite stat coefficient replacement", "classification": "DERIVED_FROM_SOURCE", "coverage": "six source coefficient axes; retain base crit/counter"},
            {"field": "unmapped elite skill behavior", "classification": "UNRESOLVED", "coverage": "preserved in UI/source data; no generic rank effect"},
        ],
    }
    return data, crosswalk


def write_outputs(root: Path = ROOT, check: bool = False) -> None:
    data, crosswalk = normalize(root)
    out = root / DATA_OUT.relative_to(ROOT)
    out.parent.mkdir(parents=True, exist_ok=True)
    for path, value in ((out, data), (root / CROSSWALK_OUT.relative_to(ROOT), crosswalk)):
        rendered = json.dumps(value, ensure_ascii=False, indent=2) + "\n"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != rendered:
                raise SystemExit(f"{path.relative_to(root)} is stale; run python tools/nl_mobile_elite_v1.py")
        else:
            path.write_text(rendered, encoding="utf-8")
    print("Mobile elite source PASS: 16 forces, 20 appearances, 400 source stat levels, 60 source skill tracks, exact cost/time tables.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    write_outputs(check=args.check)
