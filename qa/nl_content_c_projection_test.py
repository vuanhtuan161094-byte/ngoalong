#!/usr/bin/env python3
"""C build-time source/runtime projection contract for Mobile plus legacy IDs."""
from pathlib import Path
import sys, json
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"tools"))
from nl_content_c_projection import build, project_stage_skill
from nl_content_c_native import apply_c_native

def main():
    data=build(ROOT)
    maps=data["maps"]; ids=set()
    assert len(maps)==249 and len({m["id"] for m in maps})==249
    assert sum(len(m["npcs"]) for m in maps)==5063
    assert data["counts"]["legacyNpcCount"]==4903
    exact_units=[];exact_effect_rows=[];effect_units=0
    for m in maps:
        peers={n["id"] for n in m["npcs"]}
        assert 1<=m["gate"]<=28 and peers
        for n in m["npcs"]:
            assert n["id"] not in ids and 1<=len(n["units"])<=5
            ids.add(n["id"]); slots=[u["slot"] for u in n["units"]]
            assert len(set(slots))==len(slots) and all(isinstance(i,int) and 0<=i<9 for i in slots)
            assert n["donor"] is None or n["sourceFormationIncomplete"] is True
            assert n["provenance"] in {"CURRENT_VNG_MOBILE_SOURCE_P2_ADAPTER","SOURCE_RECORD_WITH_SIMULATED_FORMATION"}
            for u in n["units"]:
                assert u["name"] and u["role"] and u["troops"]>0 and u["level"]>0
                assert u["provenance"] in {"SOURCE_EXACT_WITH_P2_ADAPTER","SIMULATED_DONOR_FORMATION","SIMULATED_LEGACY_FORMATION","SIMULATED_NEAREST_WIKI_FORMATION"}
                if u["provenance"]=="SOURCE_EXACT_WITH_P2_ADAPTER":
                    assert u["sourceTroopId"] and u["skill"]["name"] and u["skill"]["desc"]
                    exact_units.append(u)
                    if u["effects"]: effect_units+=1
                    for effect in u["effects"]:
                        assert set(effect)=={"id","name","desc","detail"}
                        exact_effect_rows.append(effect)
    assert len(ids)==5063
    assert len(exact_units)==23944
    assert len({u["skill"]["name"] for u in exact_units})==694
    assert effect_units==18250 and len(exact_effect_rows)==36480
    assert len({str(e["id"]) for e in exact_effect_rows})==134
    assert len({e["name"] for e in exact_effect_rows})==134
    assert len(data["heroAliases"])==len(set(data["heroAliases"].values()))==364
    assert data["counts"]["newHeroes"]==147 and data["counts"]["runtimeHeroes"]==368
    assert all(h["descriptor"]["tag"] and h["descriptor"]["pattern"] and h["descriptor"]["mult"]>0 for h in data["heroes"])
    assert len(data["awakeningSkills"])==44
    patterns={"single","double","row","column","all","back","heal"}
    assert all(h["descriptor"]["pattern"] in patterns for h in data["heroes"])
    variants={(h["descriptor"]["pattern"],h["descriptor"]["kind"],h["descriptor"].get("apply"),
               h["descriptor"].get("applyAlly"),h["descriptor"].get("pierce"),h["descriptor"].get("crit"),
               h["descriptor"].get("cleanseNegative"),h["descriptor"].get("bonusMorale")) for h in data["heroes"]}
    assert len(variants)>=18, len(variants)
    for record in data["awakeningSkills"].values():
        assert record["stages"] and set(record["stages"])<={"PURPLE","ORANGE","GOLD"}
        for fact in record["stages"].values():
            desc=fact["descriptor"]
            assert desc["pattern"] in patterns and 0<desc["mult"]<=2
            assert desc["kind"] in {"physical","tactic","magic"}
    aoe=project_stage_skill({"skillName":"QA AoE","lane":"STRATEGY","events":[{"op":"DAMAGE","target":"ALL_ENEMIES","coefficientPct":16500}]})
    assert aoe["pattern"]=="all" and aoe["mult"]==.78
    heal=project_stage_skill({"skillName":"QA Heal","lane":"SUPPORT","events":[{"op":"HEAL_UNQUANTIFIED","target":"ALL_ALLIES"}]})
    assert heal["pattern"]=="heal" and heal["healCount"]==3
    debuff=project_stage_skill({"skillName":"QA Debuff","lane":"TACTIC","events":[{"op":"DAMAGE","target":"ENEMY_ROW"},{"op":"DEFENSE_REDUCTION","target":"ENEMY_ROW"}]})
    assert debuff["pattern"]=="row" and debuff["apply"]=="break"
    tier4=json.loads((ROOT/"data/ngoalong/modules/troops/classic_web_tier4_v1.json").read_text(encoding="utf-8"))["troops"]
    assert len(tier4)==len({t["id"] for t in tier4})==40
    for family in ("infantry","spear","cavalry","archer","strategist"):
        assert len([t for t in tier4 if t["family"]==family])==8
    src=(ROOT/"index.html").read_text(encoding="utf-8")
    patched=apply_c_native(src)
    assert apply_c_native(patched)==patched
    assert patched.count("rewards=nlContentCSettle(battle.nlContentC)")==1
    print("C_SOURCE_CONTRACT PASS",data["counts"],"tier4",len(tier4))
if __name__=="__main__":
    main()
