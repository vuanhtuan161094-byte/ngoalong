#!/usr/bin/env python3
"""Field-level guards for the pinned public Mobile Ấn Trận source snapshot."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from nl_mobile_seal_v2 import normalize, write_outputs  # noqa: E402


def main():
    data, crosswalk = normalize(ROOT)
    source = json.loads((ROOT / "data/ngoalong/research/mobile_wiki_2026-11-26/seal_v2_raw/quan-an-detail.json").read_text())
    assert len(data["seals"]) == len(source["seals"]) == 25
    assert len(data["upgradeCosts"]) == len(source["cost"]) == 249
    source_series = [attr["series"] for seal in source["seals"] for attr in seal["attrs"] if attr["series"] is not None]
    assert len(source_series) == 31 and sum(map(len, source_series)) == 7750
    assert data["levelCap"] == 250 and data["activationRanks"] == 25
    assert data["upgradeCostTotal"] == {"chienTich": 66897820, "hoPhu": 9}
    for actual, raw in zip(data["seals"], source["seals"]):
        assert actual["id"] == raw["key"] and actual["name"] == raw["name"]
        assert actual["linkedFormation"] == raw["linked"] and actual["new"] == raw["moi"]
        assert actual["activation"]["maxTotal"] == raw["actMax"]
        for normalized, original in zip(actual["attributes"], raw["attrs"]):
            assert normalized["label"] == original["label"]
            assert normalized["fixed"] == original["fixed"]
            assert normalized["series"] == original["series"]
    xung = next(seal for seal in data["seals"] if seal["id"] == "1002")
    assert xung["attributes"][0]["fixed"] == 6
    assert xung["attributes"][1]["series"][0] == 175
    assert xung["attributes"][1]["series"][-1] == 56487
    assert xung["activation"]["maxTotal"] == 2071
    assert [(row["lv"], row["hp"]) for row in data["upgradeCosts"] if row["hp"]] == [
        (210, 1), (220, 1), (230, 2), (240, 2), (250, 3)
    ]
    by_field = {row["field"]: row["classification"] for row in crosswalk["fields"]}
    assert by_field["seal.attributes.fixed/series"] == "SOURCE_EXACT"
    assert by_field["activation per-rank distribution and rank costs"] == "SIMULATED"
    assert by_field["seal discount formula and eligibility"] == "UNRESOLVED"
    write_outputs(ROOT, check=True)
    print("NL Mobile Seal V2 source crosswalk PASS: 25 seals, 31 series / 7,750 exact level values and 249 exact costs.")


if __name__ == "__main__":
    main()
