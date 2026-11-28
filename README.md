# Mưu Định Tam Quốc — Ngọa Long Mobile-inspired

An independent, offline-first strategy game with Ngọa Long Mobile VNG as its primary product benchmark. Classic WEB and Chinese-build material are supplemental references with separate version scope. This repository is not affiliated with VNG. Public references establish only the stated facts; project-created rules are marked `SIMULATED` or `DERIVED`, and unsupported details remain `UNKNOWN`.

[`docs/PRODUCT_AUTHORITY.md`](docs/PRODUCT_AUTHORITY.md) is the single current decision source. The active delivery is Draft PR #1 on `feature/ngoalong-v1-complete`; this is one game and one offline runtime.

The current game is playable as a single HTML file, but **V1.0 is not complete**. The canonical source is `index.html` plus structured data, generators, original assets and QA. The task branch is `feature/ngoalong-v1-complete`, based on `main` at `58a11806dd5eb0267244407b7808fe7848406808`; release evidence and remaining gaps are tracked in [V1_RELEASE_HANDOFF.md](docs/V1_RELEASE_HANDOFF.md), [V1_MASTER_CHECKLIST.md](docs/V1_MASTER_CHECKLIST.md), and [NL_MOBILE_FEATURE_INVENTORY.md](docs/NL_MOBILE_FEATURE_INVENTORY.md).

## Play locally

Open `index.html` in a current Chrome or Chromium browser. It runs without a game server or required CDN. Browser storage belongs to the page's origin, so a file opened locally and each hosted site have separate Saves.

To move progress from the retired Heoofgaia origin, open **Nhật Ký → Xuất Save** there, download the JSON, then use **Nhật Ký → Nhập Save** on this game. Import validates the file and asks before replacing the current Save. Export the current Save first if you want a rollback copy.

## Canonical build

Use Python 3.11 and Node.js. The generators update `index.html` in order; `--check` verifies the checked-in build can be reproduced:

```bash
python tools/validate_ngoalong_data.py
python tools/build_ngoa_long_mode.py
python tools/build_ngoa_long_r03.py
python tools/build_ngoa_long_r04.py
python tools/build_ngoa_long_items_v1.py
python tools/build_ngoa_long_items_v1.py --check
python tools/build_ngoa_long_mode.py --check
python tools/build_ngoa_long_r03.py --check
python tools/build_ngoa_long_r04.py --check
```

For browser QA, install Playwright 1.58 and Chromium, then set `PLAYWRIGHT_BROWSERS_PATH` to the installed browser directory. The cloud environment's pinned setup is documented in the environment configuration. The [Ngọa Long QA workflow](.github/workflows/ngoalong-qa.yml) runs focused gameplay, Save and data regression; commits marked `[full-ci]` also run the legacy regression and long simulation gates. The [web review workflow](.github/workflows/nl-web-review-pages.yml) builds the fixed-window review version and captures desktop/mobile screenshots. Its feature-branch job does not deploy Pages.

## Current playable scope

The runtime has a 3×3 formation with up to five generals per side, a single combat/reward authority, morale and tactical skills, 28 native campaign stages, project-authored troop/evolution profiles, hero and item progression, city screens, and Save schema v5. Builds retain the `muu_dinh_tam_quoc_v1` storage key and migrations for older saves.

The visible hero catalog contains 403 entries, with 368 runtime identities and 364 Wiki identities counted in current source audits. It is not a complete, individually illustrated or fully balanced roster. The current runtime uses 25 playable troop identities; 55 classic WEB troop names across tiers 1–3 and 40 tier-4 names are source records, not 95 finished gameplay units. The research pack includes 249 Wiki maps and 4,903 NPC detail rows, while only 28 native stages are currently wired into the playable campaign. These counts describe different coverage layers and must not be added together or treated as finished content.

Further content, visual polish, sustained mid/late-game balance, mobile-device acceptance, original sound, and a complete deployment are still pending. See the checklist and handoff before treating any workflow PASS as product acceptance.

## Project references

- [Product authority](docs/PRODUCT_AUTHORITY.md) — current benchmark, architecture, source rules, build and completion gates.
- [Mobile feature inventory](docs/NL_MOBILE_FEATURE_INVENTORY.md) — measured runtime/data/UI/art/Save status and acceptance work per system.
- [V1 master checklist](docs/V1_MASTER_CHECKLIST.md) — per-system status and remaining work.
- [V1 release handoff](docs/V1_RELEASE_HANDOFF.md) — exact branch, builds, QA evidence and limitations.
- [Rebuild specification](docs/NGOA_LONG_REBUILD_SPEC_V1.md) — retired WEB-first historical record.
- [Data-driven runtime](docs/NL_DATA_DRIVEN_V2.md) and [reference matrix](docs/NL_REFERENCE_MATRIX.md) — data shape and provenance.
- [Fidelity gap audit](docs/NL_FIDELITY_GAP_AUDIT_V1.md) — known gaps and evidence.
- [Current checkpoint](docs/CURRENT_CHECKPOINT.md) — historical milestone log; older headings are not current release status.
- [Asset provenance](docs/NL_ART_D2_20261124.md), [D3](docs/NL_ART_D3_20261124.md), [D4](docs/NL_ART_D4_20261125.md), and generated-asset manifests under `assets/ngoalong/nl_v1/`.

Do not merge the task branch or claim V1.0 completion until the Definition of Done in the master checklist is met. GitHub Pages still requires repository settings that are outside this code change.
