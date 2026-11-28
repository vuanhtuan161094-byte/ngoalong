#!/usr/bin/env python3
"""Register V6 2:3 hero masters and derive square portraits without more generations."""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "assets/ngoalong/nl_v1/portraits"
MANIFEST = ART_DIR / "hero_art_v6.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def image_size(path: Path) -> list[int]:
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        return [image.width, image.height]


def webp(png: Path, output: Path) -> None:
    with Image.open(png) as image:
        image.save(output, "WEBP", quality=90, method=6)


def asset_record(png: Path, webp_path: Path, kind: str, classification: str,
                 provenance: dict, qc_passed: bool) -> dict:
    return {
        "sourcePng": png.name,
        "runtimeWebp": webp_path.name,
        "status": "GENERATED_V6_REVIEWABLE" if kind == "character" else "DERIVED_V6_REVIEWABLE",
        "sourceSha256": sha256(png),
        "runtimeSha256": sha256(webp_path),
        "runtimeSize": image_size(png),
        "classification": classification,
        "provenance": {
            **provenance,
            "actualResolution": image_size(png),
            "sourcePath": png.relative_to(ROOT).as_posix(),
            "sourceSizeBytes": png.stat().st_size,
            "sourceSha256": sha256(png),
            "runtimePath": webp_path.relative_to(ROOT).as_posix(),
            "runtimeSizeBytes": webp_path.stat().st_size,
            "runtimeSha256": sha256(webp_path),
            "runtimeDerivative": "Pillow WebP quality=90 method=6",
            "image_created": kind == "character",
            "file_exported": True,
            "asset_qc_pass": qc_passed,
            "integrated_in_game": False,
            "owner_review": "PENDING",
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("batch_json", type=Path)
    parser.add_argument("--visual-qc-passed", action="store_true")
    args = parser.parse_args()
    batch = json.loads(args.batch_json.read_text(encoding="utf-8"))
    if not batch.get("heroes") or not isinstance(batch["heroes"], list):
        raise ValueError("V6 batch must contain hero records")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8")) if MANIFEST.exists() else {
        "schemaVersion": 1,
        "edition": "NL_CHARACTER_ART_V6_ONE_MASTER_WITH_LOCAL_PORTRAIT_CROP",
        "offlineEmbedded": True,
        "masterPolicy": "One generated 2:3 master per hero. A suitable 1:1 portrait is a local crop; splash is optional.",
        "heroes": {},
        "lastAssetAudit": "No V6 hero assets registered yet.",
    }
    if manifest.get("schemaVersion") != 1 or not manifest.get("offlineEmbedded"):
        raise ValueError("Invalid V6 hero-art manifest")

    seen: set[str] = set()
    records = []
    for hero in batch["heroes"]:
        hero_id, slug = str(hero["heroId"]), str(hero["slug"])
        if hero_id in seen or hero_id in manifest["heroes"]:
            raise ValueError(f"Duplicate or previously registered V6 hero: {hero_id}")
        seen.add(hero_id)
        prompt = hero.get("prompt")
        if not isinstance(prompt, str) or not prompt.strip():
            raise ValueError(f"Missing verbatim prompt for {hero_id}")
        source = Path(hero["sourceImage"]).resolve()
        if not source.is_file():
            raise FileNotFoundError(source)

        stem = f"female-{slug}-v6"
        character_png = ART_DIR / f"{stem}-character.png"
        character_webp = ART_DIR / f"{stem}-character.webp"
        portrait_png = ART_DIR / f"{stem}-portrait.png"
        portrait_webp = ART_DIR / f"{stem}-portrait.webp"
        prompt_path = ART_DIR / f"{stem}-character.prompt.txt"
        for path in (character_png, character_webp, portrait_png, portrait_webp, prompt_path):
            if path.exists():
                raise FileExistsError(f"Refusing to overwrite existing art asset: {path}")

        if image_size(source) != [1024, 1536]:
            raise ValueError(f"V6 character master must be 1024x1536: {source}")
        shutil.copy2(source, character_png)
        with Image.open(character_png) as image:
            image = image.convert("RGB")
            crop_y = int(hero.get("portraitCropY", 0))
            if crop_y < 0 or crop_y > image.height - image.width:
                raise ValueError(f"Portrait crop is outside master bounds: {hero_id}")
            side = image.width
            left = 0
            portrait = image.crop((left, crop_y, left + side, crop_y + side))
            portrait.save(portrait_png, "PNG", optimize=True)
        webp(character_png, character_webp)
        webp(portrait_png, portrait_webp)
        prompt_path.write_text(prompt.strip() + "\n", encoding="utf-8")

        output_id = str(hero["generationOutputId"])
        prompt_version = str(batch.get("promptVersion", "NL_CHARACTER_ART_V6_ONE_MASTER"))
        base_provenance = {
            "provider": "OpenAI ImageGen",
            "generationOutputId": output_id,
            "promptVersion": prompt_version,
            "promptRecordStatus": "VERBATIM",
            "promptFile": prompt_path.relative_to(ROOT).as_posix(),
            "createdOn": batch.get("createdOn", date.today().isoformat()),
            "providerTimestamp": "unknown",
            "targetResolution": "1024x1536 vertical 2:3 full-body master",
            "generationSourcePath": str(source),
            "cost": "unknown; provider did not return an estimate",
        }
        char_provenance = {**base_provenance}
        portrait_provenance = {
            **base_provenance,
            "provider": "Local Pillow crop from the V6 character master",
            "generationOutputId": None,
            "targetResolution": "1:1 square crop derived from the 2:3 master",
            "sourceCharacterMaster": character_png.relative_to(ROOT).as_posix(),
            "cropWindow": [left, crop_y, left + side, crop_y + side],
            "cost": "no additional image-generation call",
        }
        character = asset_record(character_png, character_webp, "character", "V6_GENERATED_FULL_BODY_MASTER", char_provenance, args.visual_qc_passed)
        portrait = asset_record(portrait_png, portrait_webp, "portrait", "V6_DERIVED_PORTRAIT_CROP", portrait_provenance, args.visual_qc_passed)
        entry = {
            "name": hero["name"],
            "faction": hero["faction"],
            "reviewStatus": "INTERNAL_VISUAL_QC_PASS_OWNER_REVIEW_PENDING" if args.visual_qc_passed else "INTERNAL_VISUAL_QC_PENDING_OWNER_REVIEW_PENDING",
            "character": character,
            "portrait": portrait,
        }
        manifest["heroes"][hero_id] = entry
        records.append({"heroId": hero_id, "name": hero["name"], "assets": entry})

    manifest["lastAssetAudit"] = f"{date.today().isoformat()}; registered {len(records)} V6 one-master hero records with local portrait crops."
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"registered": [x["heroId"] for x in records], "visualQcPassed": args.visual_qc_passed,
                      "masterGenerations": len(records), "derivedPortraits": len(records)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
