# V1.0 work handoff — 2026-11-25

**Release status: NOT COMPLETE.** This handoff records a reviewable implementation batch and the evidence gathered so far. It is not V1 acceptance.

## Repository and review state

- Repository: `vuanhtuan161094-byte/ngoalong`
- Base branch: `main`
- Task branch: `feature/ngoalong-v1-complete`
- Baseline: `58a11806dd5eb0267244407b7808fe7848406808`
- Final task commit: **pending**
- Draft PR: **pending push**
- Current task-branch Actions: **pending push**
- Website URL: unavailable. The baseline review workflow's build job passed, but its Pages deployment failed because Pages is not enabled for this repository.
- Cloud setup: the connected environment already has this checkout registered and a saved setup draft with Python 3.11, Playwright/Chromium and Node instructions. Runtime is connected with unrestricted network; this offline game requires no credentials or backend, so no environment settings change was needed.

The baseline run is [Actions run 45529293610](https://github.com/vuanhtuan161094-byte/ngoalong/actions/runs/45529293610). Its `Build canonical game and capture 28 screenshots` job succeeded and uploaded review/playable artifacts; its separate `Deploy permanent GitHub Pages URL after QA` job failed. This is a web-review workflow result, not evidence that the full `ngoalong-qa.yml` release suite passed.

## Work in this batch

- Made Save import transactional: validate schema-v1–v5 core fields, require overwrite confirmation, migrate through the existing extension hydrator, reset imported offline-production timestamps, and restore the prior in-memory and localStorage Save if import/write fails. The Journal explains how to export from the retired Heoofgaia origin and import here. Save key/schema remain `muu_dinh_tam_quoc_v1` / v5.
- Improved small-screen hero recruitment: three entries per 390px mobile page and eight per desktop review page. The real-browser screenshot gate checks readability, internal paging and no page scaling.
- Added one original, static Lục Tốn portrait to the review art runtime. Source PNG is 1254×1254 RGBA; asset SHA-256 is `4d0bcd236f78832744d78549c17498838cad963f23063e1b9577ab19346ff845`. Prompt and manifest are next to the asset in `assets/ngoalong/nl_v1/portraits/`. It is not an animation set or bulk hero-art completion.
- Added the task feature branch to focused and web-review workflow triggers; web review builds screenshots/artifacts on this branch, while Pages deployment remains default-branch-only.
- Normalized `AGENTS.md` and `README.md`, and created this handoff plus the per-system [V1 master checklist](V1_MASTER_CHECKLIST.md). Updated stale city/combat/progression QA expectations where A2/A3/B2's documented classic WEB resource and morale policies superseded the earlier CL-era checks; assertions still check exact live costs, state, skill timing and Save invariants.

## Runtime and reference-data counts

The following counts come from current repository validators and runtime audits; they describe different layers, not a sum of completed game content:

- Hero identities: 364 Wiki identities, 368 runtime identities, 403 entries in the current CI-visible catalog. Catalog identity reconciliation and broad hero completeness are still open.
- Troops: 7 base profiles and 18 evolutions produce 25 current playable identities. Separately, source files contain 55 classic WEB troop names for tiers 1–3 and 40 tier-4 names.
- Campaign: 8 chapters and 28 native stages are wired to the game. Research contains 249 Wiki maps and 4,903 NPC detail rows in 21 shards; that reference data is not a 249-map playable route. The gap audit records 97 missing NPC formations and 344 soldier-count conflicts.
- City: 31 project facilities and 7 legacy facilities; 8 research entries are in the current runtime audit. Legacy Save resources are preserved, while current WEB-facing building and item pricing converts old iron costs into simulated silver/grain costs.
- Items: 674 source reference rows, 669 project playable item models, 392 source gear rows and 411 runtime gear models. These records still need reconciliation, individual effects and long-run balance.
- The tower reference has 100 floors and the seal catalog has 18 entries; floor-by-floor opponent/reward/balance acceptance is outstanding.

Classic WEB informs gameplay/UI priorities. Mobile Wiki is supplemental research. Project-authored costs, combat and progression remain `SIMULATED` or `DERIVED`; no classic-to-Mobile parity is claimed. The game is offline single-player and does not have a multiplayer server.

## QA evidence

Evidence verified locally on the task worktree/build:

- Canonical data validation and all four builder reproducibility checks passed; generated HTML SHA-256 is `d23cb914364049a4cc8f1ca30a3e364dc69679f922e8efc36ef80333512002ee`.
- The web-review screenshot suite passed all 28 desktop/mobile screens. Screens were saved locally under `/tmp/ngoalong-v1-test-screens/` during review; CI review artifacts are the durable screenshot link once the feature-branch run completes.
- Save transfer browser QA passed **7/7**, including overwrite cancellation, malformed-file rollback, Save-v5 retention and offline-clock reset.
- Art runtime browser QA passed at 1280×720 and 390×844: 403 visible hero entries, 249 map records, offline image load for the 1254px Lục Tốn portrait, no overflow and no uncaught page errors.
- City integration passed **16/16** after aligning two stale assertions with the documented WEB conversion policy; native PVE passed **9/9**. R02 passed **32/32**, R03 passed **41/41**, and progression passed **24/24** after aligning older checks with the current A2/A3/B2 runtime rules and removing a wall-clock-sensitive double-settlement assertion.
- Legacy CL-P1/P2 passed **44/44**, CL-P6 passed **30/30**, item integration passed **20/20**, P2 passed **31/31** and advanced P2 passed **12/12** in the local regression batch. These are compatibility gates, not the active product direction.
- The focused browser/Node gates were run locally in batches. Hosted task-branch exact-SHA `quick`, `game` and web-review outcomes remain pending push; local results are not hosted CI evidence.

## Remaining release gaps

See [V1_MASTER_CHECKLIST.md](V1_MASTER_CHECKLIST.md) for the full matrix. Major pending areas include the complete and balanced mid/late/endgame loop; connecting the thousands of reference rows without fabricating source facts; a reconciled, mechanically distinct hero/troop roster; city/economy and tower floor-by-floor balance; full item/equipment value and source coverage; original coherent hero/building/unit art at roster scale; core unit animation/VFX and original audio; first-session help and accessibility; performance and real Windows/Android browser acceptance; owner visual/gameplay acceptance; hosted full exact-SHA CI; and Pages settings if a hosted website is required.

The existing 30/60-minute simulations cover three seeded profiles through the first ten reachable stages. They do not certify hours-long human balance or endgame. One Lục Tốn portrait and a successful screenshot run do not satisfy the art gate.

## Play, build and Save transfer

Open the generated `index.html` in Chrome/Chromium for offline play. To build, run the ordered commands in [README.md](../README.md) from the repository root; then run each generator with `--check` and capture exact SHA evidence.

Browser localStorage is origin-specific. On Heoofgaia, choose **Nhật Ký → Xuất Save** and save the JSON file. On this site, choose **Nhật Ký → Nhập Save**, choose the file and confirm replacement. Export the current Save first to keep a rollback copy.

## Follow-up after push

Replace the pending fields above with final commit SHA, draft PR URL, exact-SHA focused/full workflow links and conclusions, playable artifact ID/hash, and 28-screen screenshot artifact. Record the Pages result separately. Do not merge the draft PR or mark V1.0 complete while any release gate remains open.
