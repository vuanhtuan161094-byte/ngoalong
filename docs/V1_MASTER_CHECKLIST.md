# V1.0 master checklist

**Status: NOT COMPLETE.** This checklist describes the source/runtime coverage currently present in the repository. “Implemented” means only the stated scope exists; it does not mean the game-wide V1 acceptance gate has passed.

## Status key

- **Verified slice** — exact behavior has focused automated or browser evidence.
- **Partial runtime** — some working paths exist; significant systems, content or device checks remain.
- **Reference/data** — source records exist, but are not necessarily wired to playable behavior.
- **Needs balance** — rules run, but sustained human-tested progression and economy are not established.
- **Needs art** — functionality or placeholders exist, but final art/animation/audio quality is not established.
- **Missing / unverified** — no adequate implementation or evidence is known.

## System-by-system status

| System | Current status and measured scope | Work still required for V1.0 |
|---|---|---|
| Build and offline runtime | **Verified slice.** Canonical builders produce a single offline `index.html`; build `--check` gates exist. No mandatory CDN or game backend. | Test packaged artifact on supported browsers/devices; optimize load time and asset size; release exact-SHA artifact after full gates. |
| Save and migration | **Verified slice.** Storage key `muu_dinh_tam_quoc_v1`, schema v5, legacy migrations, replay/receipt protections. This task adds validated cross-origin JSON import, overwrite confirmation, rollback on invalid import, and resets imported offline-production clocks. Focused transfer QA passes 7 checks locally. | Broader corruption/recovery, reset confirmation, multi-version fixtures and sustained device tests; verify no exploit across all reward paths. |
| UI shell and responsive layout | **Partial runtime.** Fixed-window review build covers 14 screens at 1280×720 and 390×844 (28 screenshots). This task paginates the hero recruit list to 8 desktop / 3 mobile rows and checks overflow. | Finalize each screen to a coherent commercial art direction; audit portrait orientation, 1920×1080, touch size, long text, navigation, dialogs and every locked/empty state. |
| City and economy | **Partial runtime.** City/building screens and production paths are present; repository baseline describes about 38 building entries. Production ledger is idempotent and offline time is capped. | Audit each building's actual effect, construction/upgrade queue, tax/population/sentiment and resource sinks; long-run affordability and recovery from loss are not accepted. |
| Heroes and recruiting | **Partial runtime.** Current audit counts 364 Wiki identities, 368 runtime identities and 403 visible CI catalog entries. Recruitment is functional for the wired subset; hero progression modules exist. A unique Lục Tốn portrait was added in this task. | Resolve identity/catalogue discrepancies and duplicates; skills, faction/role, unlock routes, training/rebirth/awakening, growth and balance remain incomplete across the full roster. Most entries do not have individually verified portraits. |
| Troops and evolution | **Partial runtime.** Runtime uses 7 base troop profiles + 18 evolutions = 25 playable identities. There are 55 classic WEB troop names across tiers 1–3 and 40 tier-4 source names; these are different coverage layers. | Validate every identity's mechanics, unlock/evolution route, counters and unit-scale representation; wire missing tiers and support troops; balance alternatives. |
| Formation and combat | **Verified slice.** One native combat authority, 3×3 board, maximum five generals per side, morale, skills, status/replay and 28-stage PvE path; native PvE browser/Node contracts exist. | Complete skill/mechanic coverage (multi-hit, counterattack, protect, redirect, support, tier-4 behaviors); improve boss strategy and result feedback; verify animation timing and broader tactical diversity. |
| Battle AI and replay | **Partial runtime.** Deterministic seeded choices, boss phases, replay snapshots and immutable reward settlement are covered by focused tests. | Test tactical variety against many formations/seeds; avoid difficulty-by-stat inflation; full battle log explanations, speed/skip rules and late-game AI acceptance remain open. |
| Campaign, maps, NPCs and bosses | **Partial runtime.** 8 chapters / 28 native stages are wired. Research stores 249 Wiki maps and 4,903 NPC detail rows in 21 shards; 97 NPC formations are missing and 344 source rows have soldier conflicts per the current gap report. | Build a coherent early/mid/late/endgame route, validate each NPC formation/stat/skill/boss/reward/unlock and recruit path. Reference rows are not 249 playable stages or 4,903 ready NPCs. |
| Tower and seals | **Partial / needs balance.** Repository references a 100-floor tower and 18 seal designs. | Verify each floor, unlock, opponent, reward, seal effect and Save/replay behavior; run a floor-by-floor progression/balance sweep. |
| Items and equipment | **Partial runtime.** Audits list 674 reference item rows, 669 playable item models, 392 source gear rows and 411 runtime gear models. Inventory/equipment and rewards have tests. | Reconcile IDs/categories; ensure all items have meaningful effects, sources, tooltips and icons; complete compare/enhance/refine/crafting/shop flows and balance item economy. |
| Research and progression | **Partial runtime.** Current runtime audit lists 8 research entries; hero training/equipment/research paths have browser tests. | Finish all intended tech branches, costs, unlock dependencies and long-run value; audit reset/rebirth/awakening paths and resource dead ends. |
| Nations, guilds, officials, PvP/world events | **Partial / simulated / missing.** Offline UI or project simulations may exist; no authoritative multiplayer service is present. | Complete single-player AI variants with clear labels; no fake human multiplayer. Verify nation, guild, officials, reputation, mines/fields, events and reward limits, or explicitly defer unbuilt features. |
| Endgame and long progression | **Needs balance.** Accelerated 30/60-minute simulations cover three profiles through the first ten reachable stages, not hours of play or late-game. Native campaign ends at stage 28. | Define post-campaign goals and repeatable endgame; simulate resource/roster/equipment growth across early/mid/late game and validate with human play. |
| Art and identity | **Needs art.** Original D2–D4 UI layers, scene art and legacy sprite pilots exist. This task adds original static Triệu Vân and Lục Tốn portraits with separate prompts, manifests and hashes; browser QA confirms both load offline on desktop/mobile, including the visible Triệu Vân recruit row. | Commission/produce and review a consistent original portrait set; distinguish factions, heroes, troops, buildings, items and maps. Two static portraits are not bulk art or an animation set. |
| Animation and VFX | **Partial / needs art.** Legacy P4.1/P5/R06 frame assets and event-gated pilot work exist; D4 scenery is checked in browser. | Complete original idle/move/attack/cast/hit/death/victory for core units, event timing, VFX variety and device performance. Do not claim the legacy asset counts are finished runtime coverage. |
| Audio and settings | **Missing / unverified.** No current release evidence establishes complete original music, SFX, volume settings or mute behavior. | Add licensed/original music and interaction/combat/result cues, with volume and mute controls, or track a documented release deferral. |
| Onboarding, help, accessibility | **Partial / unverified.** Accelerated onboarding simulations exist; Save transfer instructions are clearer. | Human first-session usability, optional short tutorial, tooltips, loss explanations, readable type, keyboard/touch behavior and localization need review. |
| Performance and browser/device support | **Partial.** Chromium desktop/mobile screenshots and checks exist; assets run offline. | Profile catalog rendering and 1280/1920/mobile landscapes/portrait on real devices, memory/load time and reduced-motion/audio preferences. Windows/Android hardware acceptance is pending. |
| Deployment and release | **Partial.** Main branch review workflow builds QA artifacts. Baseline CI run `45529293610` passed build/gameplay QA but Pages deployment failed because repository Pages is not enabled. | Run full CI on this task branch exact SHA, retain playable artifact and screenshots, owner enables Pages if a website is desired, then verify deployment. Do not merge this branch. |

## Release Definition of Done

V1.0 may be marked **COMPLETE** only after all of the following have evidence:

- End-to-end loop from new game through coherent endgame with no blocker or severe placeholder on a main screen.
- Combat, heroes, troops, formations, campaign, city/economy, items and intended advanced systems are connected to runtime and tested for rewards, Save and exploit safety.
- UI is consistent and usable at desktop and mobile sizes; original visual identity is coherent, and core art/animation/VFX appears at the right combat events.
- Progression and economy have early/mid/late-game simulations plus human play acceptance; no single mandatory formation or unrecoverable resource dead end.
- Save/reload/export/import works across supported browser origins without losing or duplicating progress.
- Offline canonical build and exact-SHA CI pass; a playable artifact and visual evidence come from that SHA.
- Desktop and mobile device play and owner visual/gameplay acceptance are recorded separately from automated QA.
- `docs/V1_RELEASE_HANDOFF.md` lists no open release-blocking gaps.

Current state fails several of these conditions. Continue implementation in reviewable batches; do not relabel the game V1.0 complete to satisfy a milestone.
