# Mưu Định Tam Quốc — Product Authority

**Effective:** 2026-11-25
**Release state:** NOT COMPLETE. This file is the single current authority for product direction and implementation. Historical plans and research snapshots remain available, but do not override it.

## Official project and review boundary

- Repository: [`vuanhtuan161094-byte/ngoalong`](https://github.com/vuanhtuan161094-byte/ngoalong), remote `https://github.com/vuanhtuan161094-byte/ngoalong.git`.
- Base: `main` at `58a11806dd5eb0267244407b7808fe7848406808`.
- Delivery branch: `feature/ngoalong-v1-complete`; HEAD at the start of the Mobile-authority recovery batch: `4b3909ea6eb164f7ab4064844ba841f850a73186`. The current implementation checkpoint and exact-SHA Actions status are recorded in [`CURRENT_CHECKPOINT.md`](CURRENT_CHECKPOINT.md).
- Delivery: existing Draft PR #1. Continue on this branch; do not merge, force-push, or create a parallel game or delivery PR.
- Work only in this repository. Preserve existing uncommitted evidence and generated artwork unless it is explicitly part of the current change.

## Product direction

**Ngọa Long Mobile VNG is the primary product benchmark.** Use the current Mobile/H5 game for screen flow, information density, touch interactions, progression-system discovery, and battlefield composition. Use official Mobile Wiki pages as the primary research source.

Classic Ngọa Long WEB and Chinese builds are supplemental sources. Keep their versions distinct. A WEB or China rule only informs a Mobile-inspired feature when the evidence identifies the version and the adaptation is recorded. Unknown rates and closed formulas remain `UNKNOWN`; original implementation choices are `DERIVED` or `SIMULATED`.

Mưu Định Tam Quốc remains an original, offline-first, single-player strategy game. It is not affiliated with VNG and must not copy proprietary art, code, interface assets, descriptions, audio, or undisclosed formulas. Networked activities are represented with clearly labelled local AI/simulation; the game must not pretend that offline agents are live players.

## Runtime and data authority

- One canonical, reproducible, offline `index.html`; no second game runtime.
- One combat resolver, one reward/receipt authority, one Save implementation, and one replay path. Battlefield art, UI, and replay cannot create hits, damage, rewards, or receipts.
- Preserve the 3×3 formation, maximum five generals per side, storage key `muu_dinh_tam_quoc_v1`, Save schema v5, stable hero/item/formation IDs, and existing migrations. New state is additive and migration-tested.
- Runtime sources are structured data under `data/ngoalong/`, source modules under `tools/`, and original assets under `assets/ngoalong/`. Generator-owned HTML is never edited by hand.
- Distinguish playable runtime records from research catalogues. Current audits report 368 runtime hero identities, 403 visible catalogue entries, 25 troop identities, 28 native campaign stages, and broader reference packs; reference counts do not imply playable coverage.
- Every imported or authored fact uses `VERIFIED`, `DERIVED`, `SIMULATED`, or `UNKNOWN` with source/version scope. Do not promote an estimate or project formula to an official Mobile rule.

## Art direction

- Inherit Character Art V5: premium semi-realistic Asian fantasy game illustration with individualized identity, expression, hair, costume, and composition. Do not replace it with SVG portraits, emoji, chibi, or rough placeholder art.
- Current production specification: clearly adult women, preferably 25+, with varied, bold high-fashion Oriental costumes and relaxed editorial poses. Sheer silk, chiffon and gauze may be prominent overlays over opaque lining that covers intimate areas; no nudity or explicit sexual content. Preserve historical name, faction, weapon, role, skills, and Save ID while feminizing the established V5 identities.
- Keep PNG masters, runtime WebP, exact prompt/provenance, dimensions, and hashes in the existing manifests. The current 22 integrated V5 IDs are `cao`, `liu`, `guan`, `zhang`, `zhao`, `zhuge`, `lu`, `sun`, `ma`, `wiki-mobile-hero-083`, `wiki-mobile-hero-026`, `huang`, `sunquan`, `zhou`, `dian`, `xun`, `wiki-mobile-hero-025`, `wiki-mobile-hero-027`, `wiki-mobile-hero-033`, `wiki-mobile-hero-164`, `wiki-mobile-hero-168`, and `wiki-mobile-hero-292`.
- Mã Siêu (`ma`) has an integrated V5 r3 portrait/character/splash trio with clearly visible sheer chiffon over opaque satin lining, a relaxed editorial pose, and consistent face/identity cues. Prompt and checksum provenance are complete; internal visual/file QC passed; owner art acceptance remains pending.
- The original `female-huang-zhong-v5-portrait.png` preview remains preserved; ART-B1 uses separately named `female-huang-zhong-b1-v5-*` files for the integrated trio under stable ID `huang`.
- Static character art is not troop animation. Sprite frames, VFX, audio, buildings, maps, and item icons each need their own source and runtime evidence.

## Canonical build and review

Run from the repository root, in order:

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

Focused browser QA must use the actual generated HTML and visible semantic screen. Preserve existing regression assertions. Hosted Actions count only for their exact SHA. Automated checks do not substitute for device play or owner acceptance. GitHub Pages is not enabled; use the workflow artifact for a playable build until repository settings change.

## Completion criteria

V1.0 remains **NOT COMPLETE** until the user-defined Mobile feature inventory has no unimplemented release-critical path; the opening-to-endgame loop, Save/migration, combat, city, heroes, troops, formations, gear, campaign, and intended offline advanced systems work together; main screens use integrated production art; core troops have event-synchronized sprite animation/VFX; the game builds and plays offline; exact-SHA checks pass; and device/owner acceptance is recorded separately. Research records, mock screens, static posters, asset counts, and green partial test suites do not satisfy these gates.

## Approved decisions

1. Mobile VNG is the primary benchmark; classic WEB and China are supplementary, version-scoped references.
2. Keep one original offline-first game and one canonical HTML build; preserve the single combat/reward/Save authorities.
3. Keep Save key/schema and stable IDs compatible unless a reviewed additive migration is required.
4. Continue PR #1 on `feature/ngoalong-v1-complete`; never merge without the owner's separate instruction.
5. Keep generated/reference assets traceable and do not claim completion from a prompt, data row, test count, or screenshot alone.
