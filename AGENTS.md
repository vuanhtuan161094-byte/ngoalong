# Repository guidance — Mưu Định Tam Quốc

## Active project and scope

- This repository is `vuanhtuan161094-byte/ngoalong`. The active product direction is an original, offline-first strategy game inspired by classic Ngọa Long WEB. Do not redirect it to Chiến Loạn, a hybrid, an idle game, or modern gacha design.
- Use the task's requested branch and baseline. For the current V1 continuation, work on `feature/ngoalong-v1-complete` from `main` baseline `58a11806dd5eb0267244407b7808fe7848406808`.
- Work only in this repository. Do not modify Heoofgaia, Đắc Kỷ Mobile, Heroes of Gaia, Tông Môn Bá Đạo, or another checkout. Never merge to `main`, force-push, delete source data, or rewrite shared history. The owner explicitly authorized task-branch commits, pushes and a draft PR for this task.
- Keep old Chiến Loạn state and its tests where needed for Save compatibility and regression; they are not active product direction.

## Authority, sources and attribution

- Read [README.md](README.md), [the rebuild spec](docs/NGOA_LONG_REBUILD_SPEC_V1.md), [data-driven runtime](docs/NL_DATA_DRIVEN_V2.md), [reference matrix](docs/NL_REFERENCE_MATRIX.md), [fidelity audit](docs/NL_FIDELITY_GAP_AUDIT_V1.md), the relevant batch documents and code before changing a system.
- Classic WEB is the gameplay and UX reference. Mobile Wiki is supplementary research. Do not claim parity unless evidence identifies the same version and mechanic.
- Keep `VERIFIED`, `DERIVED`, `SIMULATED` and `UNKNOWN` distinct. Cite data provenance; preserve null/UNKNOWN when a source does not establish a value. Project-authored formulas and balance values are `SIMULATED` or `DERIVED`, never official VNG values.
- Use original code, art, sound and interface design. Do not copy proprietary game assets, text or internal formulas. Record source, license, prompt, dimensions and hash for generated or external art. Distinguish a portrait or static callout from a complete animation set.

## Build and source of truth

- The deliverable is one reproducible offline `index.html`, assembled from structured data and repository generators. Make source changes in the data/tools/assets/tests that produce it; do not hand-edit generated HTML when a generator owns that section.
- Validate and build in canonical order:

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

- Preserve repository source packs and historical QA evidence. Do not weaken assertions or remove a regression gate to make CI green.
- Read and preserve generated Save data through existing migration code. Keep storage key `muu_dinh_tam_quoc_v1`, Save schema v5, legacy migrations, receipt idempotence and replay immutability unless an explicitly designed migration is required. Cross-origin browser storage is isolated; use validated JSON export/import for Save transfer.

## Product and runtime invariants

- Combat has one authoritative resolution and reward path. It supports a 3×3 field and at most five generals per side. UI, animation, replay and preview must not invent actions, damage, receipts or rewards.
- Wiki records do not become playable merely because they exist in a catalog. Keep reference content separate from the small native runtime slice until mechanics and provenance are validated.
- A successful test run certifies only its stated scope. A simulation is not a human playtest; Chromium is not Windows/Android device acceptance; automated art checks are not owner art approval.
- Do not label V1.0 complete until every Definition of Done gate in [V1_MASTER_CHECKLIST.md](docs/V1_MASTER_CHECKLIST.md) is satisfied and evidence is linked in [V1_RELEASE_HANDOFF.md](docs/V1_RELEASE_HANDOFF.md).

## QA and release workflow

- Keep the focused job and all historic regression gates in `.github/workflows/ngoalong-qa.yml`. Code/data/art/QA changes should run the focused quick suite. Add `[full-ci]` to an authorized task-branch commit when a full integration milestone is ready; verify Actions against that exact SHA.
- The canonical item builder embeds the production fixed-window UI V2, so the primary offline `index.html` fits a single viewport and pages through semantic screens. `.github/workflows/nl-web-review-pages.yml` adds review art and captures 30 desktop/mobile UI screens (15 screens at each viewport). A feature-branch run builds evidence only. Its deployment job is restricted to the default branch; do not enable Pages or publish a site from this task branch.
- Before handoff, report exact commit SHA, focused and full workflow outcomes, playable artifact link/hash when available, screenshots, failures corrected and remaining gates. Never infer release readiness from a green subset.
- User-authorized work permits commits, push to the requested feature branch and a **draft** pull request. Do not merge it. If current exact-SHA checks are still running, say so in the handoff and update the record after completion.

## Historical asset and compatibility gates

- Keep P4.1/P5/P6 and CL/P2 regression coverage intact. Their old gameplay systems are compatibility history, not a reason to redirect the active Ngọa Long product.
- P4.1 art remains event-driven visual feedback; frames cannot create combat actions, hits or rewards. Do not describe a two-pose callout as a complete animation set.
- P5's regional WebP is one scenic background, not a layered playable map. Preserve its original source, derivative, provenance and exact-byte rebuild check.
- P6 and older CL economy/combat values remain project-simulated legacy state in Save v5. Preserve them for migrations and historical regression; don't call them real online players or classic Ngọa Long rules.

## Cloud workspace

- The managed cloud environment is authorized for this task. Use the existing `/workspace/ngoalong` checkout and preinstalled Python/Playwright/Chromium tools. The game itself needs no credentials, server, or CDN. Do not create another checkout or change environment secrets/network permissions unless the task requires it.
- Repository onboarding config is a reviewable draft; saving it does not publish the environment. Never put credentials in scripts or configuration.
