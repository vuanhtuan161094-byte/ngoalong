#!/usr/bin/env python3
"""Register a reviewed V5 hero-art batch and produce runtime WebP derivatives.

The input JSON records each generated image's source path, output ID, exact
prompt, reference asset, target size, stable hero ID, name, and faction.
"""
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
MANIFEST = ART_DIR / "hero_art_v5.json"
PROMPTS = ART_DIR / "art_prompts_v5.json"


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


def asset_record(hero: dict, kind: str, source: Path, output_id: str, prompt: str,
                 target: str, reference_asset: str | None, reference_sha: str | None,
                 quality_pass: bool, prompt_version: str) -> dict:
    stem = f"female-{hero['slug']}-v5-{kind}"
    png_path = ART_DIR / f"{stem}.png"
    webp_path = ART_DIR / f"{stem}.webp"
    if png_path.exists() or webp_path.exists():
        raise FileExistsError(f"Refusing to overwrite existing art asset: {stem}")
    shutil.copy2(source, png_path)
    with Image.open(png_path) as image:
        image.save(webp_path, "WEBP", quality=90, method=6)
    dimensions = image_size(png_path)
    source_hash = sha256(png_path)
    runtime_hash = sha256(webp_path)
    source_rel = png_path.relative_to(ROOT).as_posix()
    runtime_rel = webp_path.relative_to(ROOT).as_posix()
    reference_assets = []
    if reference_asset:
        reference_assets.append({
            "assetPath": reference_asset,
            "sha256": reference_sha,
        })
    provenance = {
        "provider": "OpenAI ImageGen",
        "generationOutputId": output_id,
        "promptVersion": prompt_version,
        "promptRecordStatus": "VERBATIM",
        "promptLibrary": "art_prompts_v5.json",
        "promptKey": output_id,
        "referenceAssetPath": reference_asset,
        "referenceSha256": reference_sha,
        "referenceAssets": reference_assets,
        "createdOn": date.today().isoformat(),
        "providerTimestamp": "unknown",
        "targetResolution": target,
        "actualResolution": dimensions,
        "generationSourcePath": str(source),
        "sourcePath": source_rel,
        "sourceSizeBytes": png_path.stat().st_size,
        "sourceSha256": source_hash,
        "runtimePath": runtime_rel,
        "runtimeSizeBytes": webp_path.stat().st_size,
        "runtimeSha256": runtime_hash,
        "runtimeDerivative": "Pillow WebP quality=90 method=6; same pixel dimensions",
        "cost": "unknown; provider did not return an estimate",
        "image_created": True,
        "file_exported": True,
        "asset_qc_pass": quality_pass,
        "integrated_in_game": False,
        "owner_review": "PENDING",
    }
    return {
        "sourcePng": png_path.name,
        "runtimeWebp": webp_path.name,
        "promptFile": f"art_prompts_v5.json#{output_id}",
        "status": "GENERATED_V5_REVIEWABLE",
        "sourceSha256": source_hash,
        "runtimeSha256": runtime_hash,
        "runtimeSize": dimensions,
        "classification": f"RECREATED_V5_{kind.upper()}_CANDIDATE",
        "provenance": provenance,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("batch_json", type=Path)
    parser.add_argument("--visual-qc-passed", action="store_true")
    args = parser.parse_args()
    batch = json.loads(args.batch_json.read_text(encoding="utf-8"))
    milestone = batch.get("milestone", "ART-B1")
    prompt_version = batch.get("promptVersion", "NL_CHARACTER_ART_V5_BOLD_SHEER_BATCH_1")
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    prompts = json.loads(PROMPTS.read_text(encoding="utf-8"))
    seen = set()
    for hero in batch["heroes"]:
        hero_id = hero["heroId"]
        if hero_id in seen:
            raise ValueError(f"Duplicate hero in batch: {hero_id}")
        seen.add(hero_id)
        if hero_id in manifest["heroes"]:
            raise ValueError(f"Hero art already registered: {hero_id}")
        records = {}
        for kind in ("character", "portrait", "splash"):
            item = hero["assets"][kind]
            source = Path(item["source"]).resolve()
            if not source.is_file():
                raise FileNotFoundError(source)
            reference_sha = item.get("referenceSha256")
            if item.get("referenceSource") and not reference_sha:
                reference_sha = sha256(Path(item["referenceSource"]).resolve())
            record = asset_record(
                hero, kind, source, item["outputId"], item["prompt"],
                item["targetResolution"], item.get("referenceAsset"),
                reference_sha, args.visual_qc_passed, prompt_version,
            )
            records[kind] = record
            prompts[item["outputId"]] = {
                "heroId": hero_id,
                "heroName": hero["name"],
                "kind": kind,
                "provider": "OpenAI ImageGen",
                "generationOutputId": item["outputId"],
                "referenceAsset": item.get("referenceAsset"),
                "referenceSha256": reference_sha,
                "promptVersion": prompt_version,
                "promptRecordStatus": "VERBATIM",
                "targetResolution": item["targetResolution"],
                "prompt": item["prompt"],
                "cost": "unknown; provider did not return an estimate",
            }
        manifest["heroes"][hero_id] = {
            "name": hero["name"],
            "faction": hero["faction"],
            "reviewStatus": "INTERNAL_VISUAL_QC_PASS_OWNER_REVIEW_PENDING" if args.visual_qc_passed else "INTERNAL_VISUAL_QC_PENDING_OWNER_REVIEW_PENDING",
            **records,
        }
    manifest["lastAssetAudit"] = (
        f"{date.today().isoformat()}; {milestone} registered {len(seen)} additional V5 trios "
        "with PNG masters, WebP runtime derivatives and ImageGen provenance; "
        "broader roster batches remain in production."
    )
    manifest["uncoveredHeroIds"] = (
        f"{milestone} adds {len(seen)} individually designed V5 trios; continue remaining "
        "native, Shu, Wei, Wu, Qun and neutral identities in subsequent batches."
    )
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    PROMPTS.write_text(json.dumps(prompts, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"registered": sorted(seen), "totalV5HeroIds": len(manifest["heroes"]), "visualQcPassed": args.visual_qc_passed}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
