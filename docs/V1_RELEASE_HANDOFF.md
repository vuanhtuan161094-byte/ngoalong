# V1.0 work handoff — 2026-11-25

**Release status: NOT COMPLETE.** This handoff records a reviewable implementation batch and the evidence gathered so far. It is not V1 acceptance.

## Repository and review state

- Repository: `vuanhtuan161094-byte/ngoalong`
- Base branch: `main`
- Task branch: `feature/ngoalong-v1-complete`
- Baseline: `58a11806dd5eb0267244407b7808fe7848406808`
- Last hosted implementation commit before the local V5 art follow-up: `7510726fa857766e78b81bf41fb70d67d6c5e70e`.
- Exact-SHA full regression: [run 45579439636](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45579439636) — in progress.
- Exact-SHA web review: [run 45579440289](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45579440289) — in progress.
- Draft PR: [#1](https://github.com/vuanhtuan161094-byte/ngoalong/pull/1) (open, draft, not merged)
- First task-branch commit: `2d3bb331fcd205de76cf9e129e8f154ad25482ab`
- First task-branch Actions: [run 45538189218](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45538189218) quick **PASS**, full **FAIL** at CL-P3; [run 45538189204](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45538189204) web-review build/screenshots **PASS**. Later follow-ups are recorded below.
- Website URL: unavailable. The baseline review workflow's build job passed, but its Pages deployment failed because Pages is not enabled for this repository.
- Cloud setup: the running environment and existing draft are current. Python 3.11.18, Playwright 1.58.0, Chromium 145 and Node 24.22.3 were verified; Chromium opened a local page and the HTTPS Git remote read succeeded. The game needs no server, secret or CDN. No environment settings changed.
- Prior exact-SHA web review [run 45542827251](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45542827251) passed its desktop/mobile screen suite; artifact inspection confirmed 30 captures (15 views per viewport). Prior full run [45542827263](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45542827263) passed through CL-P4 and stopped at CL-P5 mobile map width. Its 390px map measured 504.6px. Commit `577c2cc` changes the narrow grid track to `minmax(0,1fr)`; local Chromium now reports CL-P5 **9/9** and the playable map is 364px wide.

The baseline run is [Actions run 45529293610](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45529293610). Its web-review build succeeded and uploaded review/playable artifacts; its separate `Deploy permanent GitHub Pages URL after QA` job failed. This is a web-review workflow result, not evidence that the full `ngoalong-qa.yml` release suite passed.

Run 45538189218 completed its quick job successfully and its full game job passed through CL-P1/P2 before three CL-P3 checks failed: cost assertions still expected retired iron pricing, and the Save import fixture did not accept the overwrite dialog. The follow-up fixes the live lumberyard so it charges its A2 Bạc/Lương projection plus actual Gỗ, updates the CL-P3 assertions to that documented policy, and accepts the import confirmation. The full job stopped at CL-P3, so all later game steps remain unverified by that run.

## Work in this batch

- Made Save import transactional: validate schema-v1–v5 core fields, require overwrite confirmation, migrate through the existing extension hydrator, reset imported offline-production timestamps, and restore the prior in-memory and localStorage Save if import/write fails. The Journal explains how to export from the retired Heoofgaia origin and import here. Save key/schema remain `muu_dinh_tam_quoc_v1` / v5.
- Improved small-screen hero recruitment: three entries per 390px mobile page and eight per desktop review page. The real-browser screenshot gate checks readability, internal paging and no page scaling.
- The first review-art pass added static portraits for Triệu Vân (`zhao`) and Lục Tốn (`wiki-mobile-hero-083`). These have since been superseded in the Hero screen by their separately catalogued V5 sets; Lục Tốn remains attached only to its own Wiki ID.
- Added the task feature branch to focused and web-review workflow triggers; web review builds screenshots/artifacts on this branch, while Pages deployment remains default-branch-only.
- Normalized `AGENTS.md` and `README.md`, and created this handoff plus the per-system [V1 master checklist](V1_MASTER_CHECKLIST.md). Updated stale city/combat/progression QA expectations where A2/A3/B2's documented classic WEB resource and morale policies superseded the earlier CL-era checks; assertions still check exact live costs, state, skill timing and Save invariants.
- Kept CL-P3 lumberyard construction wood as a real debit while composing it with A2's converted Bạc/Lương price. Corrected CL-P3's wall and lumberyard expectations and its missing Save overwrite-dialog acceptance.
- Added `data/ngoalong/modules/campaign/trial_tower_v1.json`: eight project-simulated arcs for floors 21–100, five enemy roles per arc, ten formation layouts, four AI doctrines, 3/4/5-enemy progression, elite and chapter-boss milestones, and an explicit reward formula. Floors 1–20 remain the native entry route. These 80 encounters use the existing P2 battle, report, Save and once-only settlement owners.
- The tower screen previews the next arc, enemy roles/skills, counterplay and simulated rewards, and clearly shows the floor-20 gate. Chromium QA enumerates all 80 plans and checks floor-21 settlement, the four AI doctrines, Save-v5 retention and duplicate reward protection.
- Added original capital-courtyard scene art as a 1400×788 WebP with its generated PNG source, prompt/hash manifest and offline integration into the canonical game. The city browser gate checks image decoding without a network request, all seven building interactions, an actual management detail, mobile overflow and JavaScript errors; it passes 5/5 locally.
- Added a browser-synthesized audio settings prototype with independent effect/music controls, mute, a small ambient motif and UI/combat/result cues. The browser gate passes 9/9, including persistence, mute/preview, P2 cues and unchanged Save v5. This remains prototype audio, not a polished soundtrack or final SFX set.
- Tuned only the `SIMULATED` `enemyPower` values for the chapter bosses at stages 16 and 24. The existing P3 assertions were not changed. On `c5467ed`, exact full CI failed because the normal fixed profile won 24/24 at both boss stages; the unchanged local 360-case contract now passes with 10/24 and 9/24 normal wins, while weak/normal/strong win ordering remains monotone.

## Runtime and reference-data counts

The following counts come from current repository validators and runtime audits; they describe different layers, not a sum of completed game content:

- Hero identities: 364 Wiki identities, 368 runtime identities, 403 entries in the current CI-visible catalog. Catalog identity reconciliation and broad hero completeness are still open.
- Troops: 7 base profiles and 18 evolutions produce 25 current playable identities. Separately, source files contain 55 classic WEB troop names for tiers 1–3 and 40 tier-4 names.
- Campaign: 8 chapters and 28 native stages are wired to the game. Research contains 249 Wiki maps and 4,903 NPC detail rows in 21 shards; that reference data is not a 249-map playable route. The gap audit records 97 missing NPC formations and 344 soldier-count conflicts.
- City: 31 project facilities and 7 legacy facilities; 8 research entries are in the current runtime audit. Legacy Save resources are preserved, while current WEB-facing building and item pricing converts old iron costs into simulated silver/grain costs.
- Items: 674 source reference rows, 669 project playable item models, 392 source gear rows and 411 runtime gear models. These records still need reconciliation, individual effects and long-run balance.
- The tower reference has 100 total floors and the seal catalog has 18 entries. Native floors 1–20 remain in the original route; this batch adds playable project-simulated floors 21–100 in eight arcs. The 80 plans and reward progression have focused browser coverage, but full-floor balance, human acceptance and floor-specific original art remain open.

Classic WEB informs gameplay/UI priorities. Mobile Wiki is supplemental research. Project-authored costs, combat and progression remain `SIMULATED` or `DERIVED`; no classic-to-Mobile parity is claimed. The game is offline single-player and does not have a multiplayer server.

## QA evidence

Evidence verified locally on the task worktree/build:

- Canonical data validation and all four builder reproducibility checks passed; corrected canonical HTML SHA-256 is `751453b7ba941415740e3fca457efddab63c10199063b0626384681118ca3c26`.
- The web-review screen suite produced 30 captures (15 views at 1280×720 and 15 at 390×844) on the corrected two-portrait build; local screens are under `/tmp/ngoalong-v1-review-screens-v2/`. The first task-branch run also uploaded screenshot artifact [14987579783](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45538189204), but that artifact predates the Triệu Vân portrait and corrected CL-P3 code.
- Save transfer browser QA passed **7/7**, including overwrite cancellation, malformed-file rollback, Save-v5 retention and offline-clock reset.
- Art runtime browser QA passed at 1280×720 and 390×844: 403 visible hero entries, 249 map records, offline image loads for both Triệu Vân and Lục Tốn, no overflow and no uncaught page errors. Triệu Vân appears in the live recruit list.
- CL-P3 passed **31/31** on the corrected canonical build, including exact Bạc/Lương/Gỗ debits, 30-minute receipts, migration, offline cap and Save import. Classic A browser QA passed on the review build; the canonical data validator and builder `--check` gates passed.
- City integration passed **16/16** after aligning two stale assertions with the documented WEB conversion policy; native PVE passed **9/9**. R02 passed **32/32**, R03 passed **41/41**, and progression passed **24/24** after aligning older checks with the current A2/A3/B2 runtime rules and removing a wall-clock-sensitive double-settlement assertion.
- Legacy CL-P1/P2 passed **44/44**, CL-P6 passed **30/30**, item integration passed **20/20**, P2 passed **31/31** and advanced P2 passed **12/12** in the local regression batch. These are compatibility gates, not the active product direction.
- Current implementation candidate `7510726`: data validation and all four builder `--check` gates pass; canonical HTML SHA-256 is `dc4bd2102e5718e66a42edd45e12080bb41e83b681126f5f7ca474a0e7bf488f`. City art QA passes **5/5**, audio QA passes **9/9**, and P3 fixed-seed balance passes its unchanged **360-case** contract. The Content C tower gate still verifies all 80 simulated plans and floor-21 native settlement; CL-P5 map QA passed **9/9** at desktop and 390px mobile (364px map width). Exact-SHA web review [45579440289](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45579440289) passed and uploaded the playable HTML plus 30 screenshots; full regression [45579439636](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45579439636) remains in progress.
- Prior local regression batches on commit `2d3bb33` also passed city integration 16/16, native PVE 9/9, R02 32/32, R03 41/41, progression 24/24, CL-P1/P2 44/44, CL-P6 30/30, item integration 20/20, P2 31/31 and P2 advanced 12/12. These are local results. Hosted full CI for the corrected follow-up SHA is pending and will be recorded separately.

### Character art V5 follow-up — local evidence (2026-11-25)

- Nine stable hero IDs have an individually prompted V5 portrait, character illustration and splash: `cao`, `liu`, `guan`, `zhang`, `zhao`, `zhuge`, `lu`, `sun`, and `wiki-mobile-hero-083`. Lu Bu (`lu`) and Lu Xun (`wiki-mobile-hero-083`) are separate identities. The Gia Cát Lượng, Lữ Bố and Tôn Thượng Hương sets were visually reviewed across all three outputs and wired into the actual Hero profile by ID. The selected art mode and development state persist in Save v5.
- Latest local HTML SHA-256 is `bce9b589b2f88d38323bb1d4d4e7238e64cdf1f809681a96e0dd5aa20e51dcd4`; `build_ngoa_long_items_v1.py --check` passes. V5 browser QA is **16/16**, including all nine IDs, three art modes, the three newly produced profile trios, Save/reload, commander debit and combat-stat application. Hero207 recruitment QA and recruited-hero/equipment shared-Save QA each pass **16/16**. Runtime captures and report: `qa/nl-hero-v5-desktop.png`, `qa/nl-hero-v5-mobile.png`, `qa/NL_HERO_V5.json`.
- The six remaining native hero identities and broader Wiki roster still need V5 trios. This batch does not complete roster art, battlefield sprites, animation/VFX or owner visual acceptance; the updated source also awaits hosted exact-SHA workflow results.

## Remaining release gaps

See [V1_MASTER_CHECKLIST.md](V1_MASTER_CHECKLIST.md) for the full matrix. Major pending areas include complete and human-accepted mid/late/endgame balance, including the new simulated tower floors; connecting the thousands of reference rows without fabricating source facts; a reconciled, mechanically distinct hero/troop roster; city/economy and seal effects; full item/equipment value and source coverage; original coherent hero/building/unit art at roster scale; core unit animation/VFX and original audio; first-session help and accessibility; performance and real Windows/Android browser acceptance; owner visual/gameplay acceptance; hosted full exact-SHA CI; and Pages settings if a hosted website is required.

The existing 30/60-minute simulations cover three seeded profiles through the first ten reachable stages. They do not certify hours-long human balance or endgame. Nine static V5 character trios and a successful screenshot run do not satisfy the full-roster art, battlefield animation or owner-acceptance gates.

## Play, build and Save transfer

Open the generated `index.html` in Chrome/Chromium for offline play. To build, run the ordered commands in [README.md](../README.md) from the repository root; then run each generator with `--check` and capture exact SHA evidence.

Browser localStorage is origin-specific. On Heoofgaia, choose **Nhật Ký → Xuất Save** and save the JSON file. On this site, choose **Nhật Ký → Nhập Save**, choose the file and confirm replacement. Export the current Save first to keep a rollback copy.

## Follow-up after the current runs

Replace the in-progress full-regression state with its exact conclusion and record the playable artifact ID/hash and desktop/mobile screenshot artifact from run `45579440289`. Record the Pages result separately. Do not merge the draft PR or mark V1.0 complete while any release gate remains open.
