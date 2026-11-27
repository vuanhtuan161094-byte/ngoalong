#!/usr/bin/env python3
"""Split a generated 2x2 V6 hero sheet into four honest-resolution assets."""
from __future__ import annotations

import argparse
import hashlib
import json
from datetime import date
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ART_DIR = ROOT / "assets/ngoalong/nl_v1/portraits"
MANIFEST = ART_DIR / "hero_art_v6.json"
V5_MANIFEST = ART_DIR / "hero_art_v5.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def dimensions(path: Path) -> list[int]:
    with Image.open(path) as image:
        image.verify()
    with Image.open(path) as image:
        return [image.width, image.height]


def webp(source: Path, output: Path) -> None:
    with Image.open(source) as image:
        image.save(output, "WEBP", quality=90, method=6)


def asset_record(png: Path, webp_path: Path, kind: str, classification: str,
                 provenance: dict, qc_passed: bool) -> dict:
    return {
        "sourcePng": png.name,
        "runtimeWebp": webp_path.name,
        "status": ("GENERATED_V6_GRID_REVIEWABLE" if kind == "character"
                   else "DERIVED_V6_REVIEWABLE"),
        "sourceSha256": sha256(png),
        "runtimeSha256": sha256(webp_path),
        "runtimeSize": dimensions(png),
        "classification": classification,
        "provenance": {
            **provenance,
            "actualResolution": dimensions(png),
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
    heroes = batch.get("heroes")
    if not isinstance(heroes, list) or len(heroes) != 4:
        raise ValueError("A V6 grid batch must contain exactly four heroes")
    sheet = Path(batch["sourceSheet"]).resolve()
    sheet_size = dimensions(sheet)
    if sheet_size[0] % 2 or sheet_size[1] % 2:
        raise ValueError(f"Grid sheet dimensions must divide evenly into four cells: {sheet_size}")
    cell_w, cell_h = sheet_size[0] // 2, sheet_size[1] // 2
    if cell_w * 3 != cell_h * 2:
        raise ValueError(f"Each grid cell must be vertical 2:3, got {cell_w}x{cell_h}")
    prompt_path = ROOT / batch["promptFile"]
    if not prompt_path.is_file():
        raise FileNotFoundError(prompt_path)
    prompt_text = prompt_path.read_text(encoding="utf-8").strip()
    if not prompt_text:
        raise ValueError("The verbatim prompt record is empty")

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    v5 = json.loads(V5_MANIFEST.read_text(encoding="utf-8"))
    if manifest.get("schemaVersion") != 1 or not manifest.get("offlineEmbedded"):
        raise ValueError("Invalid V6 hero-art manifest")
    if not batch.get("generationOutputId") or not batch.get("batchId"):
        raise ValueError("Missing generation output ID or batch ID")
    ids: set[str] = set()
    cells: set[int] = set()
    exported: list[str] = []

    for hero in heroes:
        hero_id = str(hero["heroId"])
        slug = str(hero["slug"])
        cell = int(hero["cellIndex"])
        if hero_id in ids or hero_id in manifest["heroes"] or hero_id in v5.get("heroes", {}):
            raise ValueError(f"Duplicate or already illustrated hero: {hero_id}")
        if cell not in range(4) or cell in cells:
            raise ValueError(f"Duplicate or invalid 2x2 cell index: {cell}")
        ids.add(hero_id)
        cells.add(cell)
        stem = f"female-{slug}-v6-{batch['batchId']}"
        char_png = ART_DIR / f"{stem}-character.png"
        char_webp = ART_DIR / f"{stem}-character.webp"
        portrait_png = ART_DIR / f"{stem}-portrait.png"
        portrait_webp = ART_DIR / f"{stem}-portrait.webp"
        if any(path.exists() for path in (char_png, char_webp, portrait_png, portrait_webp)):
            raise FileExistsError(f"Refusing to overwrite an existing sheet-derived asset for {hero_id}")

        col, row = cell % 2, cell // 2
        left, top = col * cell_w, row * cell_h
        cell_box = [left, top, left + cell_w, top + cell_h]
        portrait_y = int(hero.get("portraitCropY", 0))
        if portrait_y < 0 or portrait_y > cell_h - cell_w:
            raise ValueError(f"Portrait crop outside cell for {hero_id}")
        portrait_box = [0, portrait_y, cell_w, portrait_y + cell_w]
        with Image.open(sheet) as image:
            rgb = image.convert("RGB")
            tile = rgb.crop(tuple(cell_box))
            tile.save(char_png, "PNG", optimize=True)
            tile.crop(tuple(portrait_box)).save(portrait_png, "PNG", optimize=True)
        webp(char_png, char_webp)
        webp(portrait_png, portrait_webp)

        row_col = [row, col]
        base = {
            "provider": "OpenAI ImageGen",
            "generationOutputId": batch["generationOutputId"],
            "generationBatchId": batch["batchId"],
            "generationLayout": "2x2 contact sheet; one full-body hero per cell",
            "sheetCellIndex": cell,
            "sheetRowColumn": row_col,
            "sheetCropWindow": cell_box,
            "sheetResolution": sheet_size,
            "nativeCellResolution": [cell_w, cell_h],
            "upscaled": False,
            "promptVersion": batch.get("promptVersion", "NL_CHARACTER_ART_V6_FOUR_UP_GRID"),
            "promptRecordStatus": batch.get("promptRecordStatus", "VERBATIM"),
            "promptFile": prompt_path.relative_to(ROOT).as_posix(),
            "createdOn": batch.get("createdOn", date.today().isoformat()),
            "providerTimestamp": "unknown",
            "targetResolution": f"2:3 full-body cell from a 2x2 sheet; native {cell_w}x{cell_h}",
            "generationSourcePath": batch.get("generationSourcePath", str(sheet)),
            "sourceSheetArchivePath": sheet.relative_to(ROOT).as_posix(),
            "sourceSheetSha256": sha256(sheet),
            "sourceSheetSizeBytes": sheet.stat().st_size,
            "cost": "unknown; provider did not return an estimate",
        }
        char = asset_record(
            char_png, char_webp, "character", "V6_GENERATED_FULL_BODY_GRID_CELL",
            base, args.visual_qc_passed,
        )
        portrait_provenance = {
            **base,
            "provider": "Local Pillow crop from the V6 grid-cell character master",
            "generationOutputId": None,
            "targetResolution": "1:1 square crop derived from one 2:3 grid cell",
            "sourceCharacterMaster": char_png.relative_to(ROOT).as_posix(),
            "cropWindow": portrait_box,
            "cost": "no additional image-generation call",
        }
        portrait = asset_record(
            portrait_png, portrait_webp, "portrait", "V6_DERIVED_PORTRAIT_CROP",
            portrait_provenance, args.visual_qc_passed,
        )
        manifest["heroes"][hero_id] = {
            "name": hero["name"],
            "faction": hero["faction"],
            "currentRevision": f"v6-{batch['batchId']}",
            "generationBatchId": batch["batchId"],
            "sheetCellIndex": cell,
            "reviewStatus": ("INTERNAL_VISUAL_QC_PASS_OWNER_REVIEW_PENDING" if args.visual_qc_passed
                             else "INTERNAL_VISUAL_QC_PENDING_OWNER_REVIEW_PENDING"),
            "character": char,
            "portrait": portrait,
        }
        exported.extend([char_png.name, char_webp.name, portrait_png.name, portrait_webp.name])

    manifest["lastAssetAudit"] = (
        f"{date.today().isoformat()}; registered {len(heroes)} V6 full-body cells and local portrait crops "
        f"from contact sheet {batch['batchId']}; offline HTML embedding pending."
    )
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"registered": sorted(ids), "batchId": batch["batchId"],
                      "nativeCellResolution": [cell_w, cell_h], "exported": exported,
                      "visualQcPassed": args.visual_qc_passed}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
