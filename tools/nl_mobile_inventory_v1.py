#!/usr/bin/env python3
"""Normalize the current public Mobile Wiki equipment/item detail tables.

Raw Wiki captures are immutable. The source model retains exact values and
versioned gameplay adapters are recorded separately in the field crosswalk.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/full_public_raw"
OUT = ROOT / "data/ngoalong/modules/inventory/mobile_wiki_v1.json"
CROSSWALK = ROOT / "data/ngoalong/modules/inventory/mobile_wiki_crosswalk_v1.json"
CDN = "https://cdn-mainsite-aka.vnggames.com/products/mwly/landing/2026-ngoa-long-wiki-clone/data/"
PAGE = "https://ngoalong.vnggames.com/ngoa-long-wiki/vat-pham/trang-bi"
ITEM_PAGE = "https://ngoalong.vnggames.com/ngoa-long-wiki/vat-pham"
SLOTS = {1: "weapon", 2: "armor", 3: "horse", 4: "book", 5: "cloak", 6: "shield", 7: "artifact"}
LABELS = {
    "Vật Công": "atk", "Pháp Công": "catk", "Mưu Công": "matk",
    "Vật Phòng": "def", "Pháp Phòng": "tdef", "Mưu Phòng": "mdef",
    "Lính": "hp", "Bạo Kích": "crit", "Phản Kích": "counter", "Né Tránh": "dodge",
}
SOURCE_RESOURCES = {
    "chiến công": ("res_3", "Chiến Công"),
    "tranh ngọc": ("res_16", "Tranh Ngọc"),
    "đá tôi luyện": ("res_62", "Đá Tôi Luyện"),
}


def read(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def norm_name(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip()).casefold()


def normalize(root: Path = ROOT) -> tuple[dict, dict]:
    raw = root / RAW.relative_to(ROOT)
    manifest = read(raw / "capture_manifest.json")
    file_rows = {x["file"]: x for x in manifest["files"]}
    file_rows.update({x["file"]: {**file_rows.get(x["file"], {}), **x}
                      for x in manifest.get("dataRecords", [])})

    def pinned(rel: str, url: str):
        path = raw / rel
        row = file_rows.get(rel)
        if not path.is_file() or not row or row.get("url") != url or sha(path) != row.get("sha256"):
            raise ValueError("MOBILE_INVENTORY_SOURCE_HASH_OR_URL_DRIFT:" + rel)
        return read(path), row

    equipment_doc, eq_pin = pinned("data/equip-detail.json", CDN + "equip-detail.json")
    items_doc, item_pin = pinned("data/item-detail.json", CDN + "item-detail.json")
    item_index, index_pin = pinned("data/item-catalog.json", CDN + "item-catalog.json")
    campaign_dir = raw / "data/campaign"

    source_equipment = equipment_doc.get("items")
    source_items = items_doc.get("items")
    if not isinstance(source_equipment, list) or len(source_equipment) != 399:
        raise ValueError("MOBILE_EQUIPMENT_DETAIL_COUNT_DRIFT")
    if not isinstance(source_items, list) or len(source_items) != 746:
        raise ValueError("MOBILE_ITEM_DETAIL_COUNT_DRIFT")
    tiers = equipment_doc.get("equipTiers") or {}
    refinements = equipment_doc.get("equipRefine") or {}
    if set(tiers) != {str(i) for i in range(1, 20)} or set(refinements) != {str(i) for i in range(1, 8)}:
        raise ValueError("MOBILE_EQUIPMENT_TIER_OR_SLOT_DRIFT")

    equipment_by_id = {str(x["id"]): x for x in source_equipment}
    items_by_id = {str(x["id"]): x for x in source_items}
    if len(equipment_by_id) != len(source_equipment) or len(items_by_id) != len(source_items):
        raise ValueError("MOBILE_ITEM_DETAIL_DUPLICATE_ID")

    drop_rows = []
    matched_gear: set[str] = set()
    matched_items: set[str] = set()
    matched_resources: set[str] = set()
    unresolved = []
    campaign_hashes = []
    campaign_npcs_by_ident: dict[str, list[dict]] = {}
    campaign_paths = sorted((campaign_dir).glob("[0-9]*.json"))
    campaign_paths = [p for p in campaign_paths if not p.stem.endswith("-cb")]
    if len(campaign_paths) != 249:
        raise ValueError("MOBILE_CAMPAIGN_DROP_SOURCE_MAP_COUNT_DRIFT")
    for path in campaign_paths:
        rel = path.relative_to(raw).as_posix()
        capture = file_rows.get(rel)
        if not capture or sha(path) != capture.get("sha256"):
            raise ValueError("MOBILE_CAMPAIGN_DROP_SOURCE_HASH_DRIFT:" + rel)
        campaign_hashes.append(capture["sha256"])
        doc = read(path)
        for npc in (doc.get("vn") or {}).get("npcs") or []:
            campaign_npcs_by_ident.setdefault(str(npc.get("ident")), []).append({
                "mapId": str(doc.get("key")), "npcId": str(npc.get("ident")),
                "npcName": npc.get("name"), "drops": npc.get("drops") or [],
            })
            for drop in npc.get("drops") or []:
                ident = str(drop.get("id", "0"))
                name = str(drop.get("name") or "")
                category = str(drop.get("category") or "")
                bound = None
                if ident != "0":
                    eq = equipment_by_id.get(ident)
                    item = items_by_id.get(ident)
                    candidates = []
                    if eq and eq.get("name") == name and eq.get("typeName") == category:
                        candidates.append(("equipment", eq))
                    if item and item.get("name") == name and item.get("typeName") == category:
                        candidates.append(("item", item))
                    if len(candidates) == 1:
                        kind, _record = candidates[0]
                        target = f"mobile-vng-{kind}-{ident}"
                        bound = {"kind": kind, "runtimeId": target, "classification": "SOURCE_EXACT"}
                        (matched_gear if kind == "equipment" else matched_items).add(ident)
                    else:
                        unresolved.append({"mapId": str(doc.get("key")), "npcId": npc.get("ident"),
                                           "sourceId": ident, "name": name, "category": category,
                                           "reason": "NO_UNIQUE_ID_NAME_AND_CATEGORY_MATCH"})
                else:
                    resource = SOURCE_RESOURCES.get(norm_name(name))
                    if resource:
                        resource_id, canonical = resource
                        # Verify the resource identity/name from the exact Wiki item index.
                        row = item_index.get(resource_id)
                        if row and norm_name(row.get("name")) == norm_name(canonical):
                            runtime_id = f"mobile-vng-resource-{resource_id}"
                            bound = {"kind": "resource", "runtimeId": runtime_id,
                                     "sourceResourceId": resource_id, "classification": "SOURCE_EXACT"}
                            matched_resources.add(resource_id)
                    if not bound:
                        unresolved.append({"mapId": str(doc.get("key")), "npcId": npc.get("ident"),
                                           "sourceId": ident, "name": name, "category": category,
                                           "reason": "NO_PUBLIC_ITEM_ID_OR_UNIQUE_RESOURCE_INDEX_MATCH"})
                drop_rows.append({
                    "mapId": str(doc.get("key")), "npcId": str(npc.get("ident")),
                    "npcName": npc.get("name"), "sourceId": ident, "name": name,
                    "rate": drop.get("rate"), "category": category, "stats": drop.get("stats") or [],
                    "binding": bound,
                })

    # The equipment detail shard has a reverse list of map/NPC drop references.
    # Compare it with NPC-owned drop rows, but keep the NPC row authoritative
    # at runtime when these two public source views disagree.
    equipment_usage_drop_crosswalk = []
    usage_drop_counts = {"total": 0, "matchedNpcAndDrop": 0, "matchedNpcDropAndRate": 0,
                         "rateDrift": 0, "npcNotCaptured": 0, "npcFoundDropNotMatched": 0}
    for equipment in source_equipment:
        for reference in (equipment.get("usage") or {}).get("drops") or []:
            usage_drop_counts["total"] += 1
            ident = str(equipment["id"])
            candidates = campaign_npcs_by_ident.get(str(reference.get("objId")), [])
            matches = []
            for candidate in candidates:
                for drop in candidate["drops"]:
                    if (str(drop.get("id")) == ident and drop.get("name") == equipment.get("name") and
                            drop.get("category") == equipment.get("typeName")):
                        matches.append((candidate, drop))
            expected_rate = float(reference.get("rate") or 0)
            if not candidates:
                status = "REVERSE_DROP_NPC_NOT_IN_CAPTURE"
                runtime_status = "UNRESOLVED_NO_RUNTIME_DROP_BINDING"
                usage_drop_counts["npcNotCaptured"] += 1
            elif not matches:
                status = "NPC_FOUND_BUT_NO_MATCHING_CAMPAIGN_DROP"
                runtime_status = "UNRESOLVED_NO_RUNTIME_DROP_BINDING"
                usage_drop_counts["npcFoundDropNotMatched"] += 1
            else:
                usage_drop_counts["matchedNpcAndDrop"] += 1
                exact_rates = [candidate for candidate, drop in matches
                               if abs(float(drop.get("rate") or 0) / 100 - expected_rate) < 1e-9]
                if exact_rates:
                    status = "MATCHED_SOURCE_NPC_DROP_AND_RATE"
                    runtime_status = "APPLIED_FROM_NPC_OWNED_SOURCE_DROP_ROW"
                    usage_drop_counts["matchedNpcDropAndRate"] += 1
                else:
                    status = "REVERSE_DROP_RATE_CONFLICT"
                    runtime_status = "CONFLICT_PRESERVED_NPC_OWNED_RATE"
                    usage_drop_counts["rateDrift"] += 1
            equipment_usage_drop_crosswalk.append({
                "equipmentId": ident, "equipmentName": equipment.get("name"),
                "declaredMapId": str(reference.get("mapId")),
                "npcId": str(reference.get("objId")), "reverseDropRate": expected_rate,
                "matchedCampaignNpcs": [{"mapId": candidate["mapId"], "npcId": candidate["npcId"],
                                         "npcName": candidate["npcName"]} for candidate, _drop in matches],
                "campaignDropRates": [drop.get("rate") for _candidate, drop in matches],
                "status": status, "runtimeStatus": runtime_status,
            })
    if usage_drop_counts != {"total": 680, "matchedNpcAndDrop": 618, "matchedNpcDropAndRate": 613,
                             "rateDrift": 5, "npcNotCaptured": 29, "npcFoundDropNotMatched": 33}:
        raise ValueError("MOBILE_EQUIPMENT_REVERSE_DROP_AUDIT_DRIFT:" + json.dumps(usage_drop_counts, sort_keys=True))

    runtime_equipment = []
    for ident in sorted(matched_gear, key=lambda x: int(x)):
        row = equipment_by_id[ident]
        slot = SLOTS.get(row.get("type"))
        if not slot:
            raise ValueError("MOBILE_DROPPED_EQUIPMENT_UNKNOWN_SLOT:" + ident)
        raw_stats = row.get("stats") or []
        # A stable field order keeps the generated module byte-for-byte
        # reproducible across Python processes with randomized hash seeds.
        stats = {target: 0 for target in sorted(set(LABELS.values()) | {"int"})}
        for attr in raw_stats:
            target = LABELS.get(attr.get("label"))
            if target:
                stats[target] = int(attr.get("base") or 0)
        runtime_equipment.append({
            "id": f"mobile-vng-equipment-{ident}", "sourceId": ident,
            "name": row["name"], "category": "equipment", "integration": "PLAYABLE",
            "sourceEdition": "CURRENT_VNG_MOBILE_WIKI", "sourceGroup": row.get("qualityName") or "",
            "displayedLevel": row.get("level"), "requiredLevel": 1, "slot": slot,
            "rarity": row.get("qualityName") or "Thường", "stats": stats,
            "sourceStats": raw_stats, "sourceQuality": row.get("quality"),
            "sourceType": row.get("type"), "sourceTypeName": row.get("typeName"),
            "sourceDesc": row.get("desc") or "", "sourceIcon": row.get("icon"),
            "mobileEnhancement": {
                "classification": "SOURCE_EXACT", "maxLevel": 425,
                "inc": (row.get("cuongHoa") or {}).get("inc"),
                "coef": (row.get("cuongHoa") or {}).get("coef"),
                "qualityCoef": (tiers.get(str(row.get("quality"))) or {}).get("coef", 1),
                "tierName": (tiers.get(str(row.get("quality"))) or {}).get("name", row.get("qualityName")),
                "statScale": 0.001,
                "formulaId": "VNG_WIKI_BAC_CUONG_HOA_V1",
                "sourcePage": PAGE, "sourceDataUrl": CDN + "equip-detail.json",
            },
            "mobileRefinement": {
                "classification": "SOURCE_EXACT_DATA_WITH_RUNTIME_EFFECTS_UNRESOLVED",
                "slot": str(row.get("type")), "sourcePools": refinements.get(str(row.get("type"))),
            },
            "acquisitionRule": {"kind": "MOBILE_DROP", "classification": "SOURCE_EXACT"},
            "enhancementRule": {"kind": "MOBILE_WIKI_EXACT", "maxLevel": 425},
            "fieldProvenance": {
                "name": "SOURCE_EXACT", "sourceStats": "SOURCE_EXACT",
                "stats": "DERIVED_FROM_SOURCE", "requiredHeroLevel": "SIMULATED",
                "enhancementRule": "SOURCE_EXACT",
                "acquisitionRule": "SOURCE_EXACT", "refinementEffects": "UNRESOLVED",
            },
            "provenance": {"classification": "SOURCE_EXACT", "sourceId": "mobile-wiki-equip-detail",
                            "checkedAt": manifest.get("retrievedAtUtc")},
        })

    runtime_materials = []
    for ident in sorted(matched_items, key=lambda x: int(x)):
        row = items_by_id[ident]
        runtime_materials.append({
            "id": f"mobile-vng-item-{ident}", "sourceId": ident,
            "name": row["name"], "category": "material", "integration": "PLAYABLE",
            "sourceEdition": "CURRENT_VNG_MOBILE_WIKI", "sourceCategory": row.get("typeName"),
            "sourceIcon": row.get("icon"), "sourceDesc": row.get("desc") or "",
            "sourceQuality": row.get("quality"), "sourceLevel": row.get("level"),
            "effectRule": None,
            "acquisitionRule": {"kind": "MOBILE_DROP", "classification": "SOURCE_EXACT"},
            "fieldProvenance": {"name": "SOURCE_EXACT", "acquisitionRule": "SOURCE_EXACT",
                                "activeUseEffect": "UNRESOLVED"},
            "provenance": {"classification": "SOURCE_EXACT", "sourceId": "mobile-wiki-item-detail",
                            "checkedAt": manifest.get("retrievedAtUtc")},
        })

    for resource_id in sorted(matched_resources):
        row = item_index[resource_id]
        runtime_materials.append({
            "id": f"mobile-vng-resource-{resource_id}", "sourceId": resource_id,
            "name": row["name"], "category": "material", "integration": "PLAYABLE",
            "sourceEdition": "CURRENT_VNG_MOBILE_WIKI", "sourceCategory": "Tài Nguyên",
            "sourceIcon": row.get("icon"), "sourceDesc": "",
            "acquisitionRule": {"kind": "MOBILE_DROP", "classification": "SOURCE_EXACT"},
            "effectRule": None,
            "fieldProvenance": {"name": "SOURCE_EXACT", "dropRate": "SOURCE_EXACT",
                                "quantityPerDrop": "SIMULATED_DEFAULT_ONE", "activeUseEffect": "UNRESOLVED"},
            "provenance": {"classification": "SOURCE_EXACT", "sourceId": "mobile-wiki-item-catalog",
                            "checkedAt": manifest.get("retrievedAtUtc")},
        })

    if len(matched_gear) != 36 or len(matched_items) != 30 or matched_resources != {"res_3", "res_16", "res_62"}:
        raise ValueError(f"MOBILE_CAMPAIGN_DROP_BINDING_DRIFT: gear={len(matched_gear)} items={len(matched_items)} resources={matched_resources}")
    if len(drop_rows) != 893 or len(unresolved) != 12:
        raise ValueError(f"MOBILE_CAMPAIGN_DROP_ROW_DRIFT: rows={len(drop_rows)} unresolved={len(unresolved)}")
    # Source rates are preserved verbatim. Two refinement tables exceed 100%;
    # the static page does not establish whether they are weights or independent chances.
    refine_sums = {}
    for slot, definition in refinements.items():
        refine_sums[slot] = {pool: round(sum(float(x.get("rate") or 0) for x in rows), 8)
                             for pool, rows in definition.items() if isinstance(rows, list)}

    source_info = {
        "sourceEdition": "CURRENT_VNG_MOBILE_WIKI_VIETNAMESE",
        "retrievedAtUtc": manifest.get("retrievedAtUtc"),
        "equipmentPage": PAGE, "itemsPage": ITEM_PAGE,
        "equipmentDataUrl": CDN + "equip-detail.json", "itemDataUrl": CDN + "item-detail.json",
        "itemIndexDataUrl": CDN + "item-catalog.json",
        "rawSha256": {"equipDetail": eq_pin["sha256"], "itemDetail": item_pin["sha256"],
                      "itemCatalog": index_pin["sha256"], "campaignSourceFileDigests": len(campaign_hashes)},
    }
    module = {
        "schemaVersion": 1, "source": source_info,
        "sourceCounts": {"equipment": len(source_equipment), "items": len(source_items),
                         "qualityTiers": len(tiers), "refinementSlots": len(refinements),
                         "campaignDropRows": len(drop_rows),
                         "equipmentReverseDropRows": usage_drop_counts["total"]},
        "equipTiers": tiers, "equipRefine": refinements,
        "equipment": source_equipment, "items": source_items,
        "sourceItemIndex": item_index,
        "campaignDropBindings": drop_rows,
        "equipmentUsageDropCrosswalk": equipment_usage_drop_crosswalk,
        "equipmentUsageDropCounts": usage_drop_counts,
        "runtimeEquipment": runtime_equipment, "runtimeMaterials": runtime_materials,
        "refinementRateSums": refine_sums,
        "unresolvedCampaignDrops": unresolved,
        "runtimeAdapters": {
            "equipmentSlotMap": {str(k): v for k, v in SLOTS.items()},
            "equipmentStatMap": LABELS,
            "equipmentStatScale": 0.001,
            "equipmentStatScaleReason": "Adapter for the native P2 scale: round each positive converted equipment stat to a whole point, with a minimum of one point; source raw values remain separately available.",
            "reinforcementFormula": "For each destination level e: G=1/600; floor(inc*coef*e*(0.22+e*e*G)*qualityCoef*G + 5*e + 3*inc); double Bạc when e>=200. Sum e=current+1..target. Tranh Ngọc: 0 through e=200; 40*ceil((e-200)/10) through 260; e above 260.",
            "reinforcementDiscount": "Wiki client text: account level >=200 reduces Bạc by 5%; >=300 reduces Bạc by 10%. Save v5 uses simulated mobileCommanderLevel as the account-level adapter; per-destination-level floor and that adapter are not source verified. Building/technology discounts have no published coefficients and are not applied.",
            "runtimeDropRoll": "SOURCE_EXACT per-NPC item and rate; DERIVED_FROM_SOURCE independent P2 seeded roll using rate/100. Quantity is omitted by the source and defaults to one (SIMULATED).",
            "refinementActivation": "UNRESOLVED: raw exact property pools are retained. Mobile Wiki client says rates are chances per roll, but slot 6 'so' sums to 1.10 and slot 7 'cao' sums to 1.08; runtime activation/cost and combat semantics require a source-consistent rule.",
        "unresolvedCampaignDrops": "12 rows have no unique item detail/resource binding (including id 0 'Sách Vạn Năng' and generic 'Nguyên liệu'); preserved but not granted.",
        },
    }
    fields = []
    for pointer, runtime, classification in [
        ("/equip-detail/items/id", "stable Mobile equipment ID", "SOURCE_EXACT"),
        ("/equip-detail/items/name,type,quality,level", "item identity/tier/display level", "SOURCE_EXACT"),
        ("/equip-detail/items/stats/base,growth,pct", "equipment stat at strengthening level; native P2 scale adapter", "DERIVED_FROM_SOURCE"),
        ("/equip-detail/items/cuongHoa", "source reinforcement coefficient input", "SOURCE_EXACT"),
        ("/equip-detail/equipTiers/*/coef", "quality reinforcement coefficient", "SOURCE_EXACT"),
        ("/client/ngoa-long-wiki-0.js::bacCuongHoa", "Bạc cost for each destination strengthening level", "SOURCE_EXACT"),
        ("/client/ngoa-long-wiki-0.js::ngocCuongHoa", "Tranh Ngọc cost for each destination level", "SOURCE_EXACT"),
        ("/client/ngoa-long-wiki-0.js::discount text", "account level discount; commander-level adapter in Save v5", "DERIVED_FROM_SOURCE"),
        ("/equip-detail/items/level", "displayed source equipment level; no hero equip requirement published", "SOURCE_EXACT"),
        ("/runtime/requiredHeroLevel", "not published in inspected Mobile data; permit from level 1", "SIMULATED"),
        ("/equip-detail/items/*/usage/drops", "reverse NPC/map drop reference; compared with NPC-owned source drop", "SOURCE_EXACT"),
        ("/equip-detail/equipRefine", "all exact slot/pool property values and rates", "SOURCE_EXACT"),
        ("/campaign/{map}/vn/npcs/*/drops", "NPC drop ID/name/category/rate", "SOURCE_EXACT"),
        ("/campaign/{map}/vn/npcs/*/drops/quantity", "quantity per drop", "SIMULATED_DEFAULT_ONE"),
    ]:
        if pointer == "/equip-detail/equipRefine":
            runtime_status = "RAW_SOURCE_RETAINED_RUNTIME_UNRESOLVED"
        elif pointer == "/equip-detail/items/*/usage/drops":
            runtime_status = "REVERSE_SOURCE_CROSSWALK_ONLY_NPC_OWNED_DROP_IS_RUNTIME_AUTHORITY"
        else:
            runtime_status = "APPLIED"
        fields.append({"sourcePointer": pointer, "sourcePage": PAGE, "sourceClassification": classification,
                       "runtimeField": runtime, "runtimeClassification": classification,
                       "runtimeStatus": runtime_status})
    crosswalk = {
        "schemaVersion": 1, "source": source_info,
        "coverage": module["sourceCounts"],
        "runtimeBinding": {"campaignDropsBoundToEquipment": len(matched_gear),
                           "campaignDropsBoundToItemMaterials": len(matched_items),
                           "campaignDropsBoundToResourceMaterials": len(matched_resources),
                           "campaignDropRowsUnresolved": len(unresolved),
                           "equipmentReverseDropRows": usage_drop_counts},
        "refinementRateSums": refine_sums, "fields": fields,
        "runtimeAdapters": module["runtimeAdapters"],
        "unresolvedCampaignDrops": unresolved,
    }
    return module, crosswalk


def write(check: bool = False) -> None:
    module, crosswalk = normalize()
    for path, data in ((OUT, module), (CROSSWALK, crosswalk)):
        expected = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if check:
            if not path.is_file() or path.read_text(encoding="utf-8") != expected:
                raise ValueError("STALE_GENERATED_MOBILE_INVENTORY:" + path.name)
        else:
            path.write_text(expected, encoding="utf-8")
    counts = module["equipmentUsageDropCounts"]
    print("Mobile inventory source PASS: 399 equipment, 746 items, 680 reverse drop refs " +
          f"({counts['matchedNpcDropAndRate']} exact, {counts['rateDrift']} rate conflicts, " +
          f"{counts['npcNotCaptured'] + counts['npcFoundDropNotMatched']} unresolved), " +
          "36 source-drop gear, 30 source-drop materials, 3 bound Wiki resources, 12 unresolved drops.")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    try:
        write(args.check)
    except Exception as exc:
        print(str(exc))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
