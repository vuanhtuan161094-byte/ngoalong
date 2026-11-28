# Functional screen audit — 28 Nov 2026 (ART HOLD)
Baseline cab43fa6. Mobile-first product authority, one offline game, Save v5, native P2, no new art, no merge. Production screenshot smoke is not functional acceptance. Prior source inventory explicitly marks systems partial. Reuse known Wiki sources, do not treat WEB, China and Mobile as identical. Fix user-visible interactions before adding assets.

## Confirmed code findings
- Hero troops: previous hero tab only read a troop and linked to Barracks; Barracks used a separate heroId. Content C Mobile selection, B3 project catalogue and legacy R03/WEB branches coexist. Mobile choose clears previous lineage; old selectors clear Mobile assignment. This patch directly binds hero selection to the Mobile source catalogue and shared payment/Save/P2 path; no new resolver. Test actual selection and visible lock conditions; broader removal of conflicting legacy player-facing routes remains open.
- Commander: hero tab concatenates actual Mobile elite view and simulated personal commander; separate these workflows, preserve progression and receipts.
- Special weapon, inheritance, destiny: real source rows are used only when available and fallback simulated formulas are still displayed. Verify all name, rank, source costs, upgrade/equip controls, actual effects and Save. Destiny category artwork does not identify a unique source destiny.
- Training: separate training and city growth routes with simulated costs/caps. Audit cap, XP, consumption, awakening dependencies.
- Rewards: project reward track uses 28-stage milestones while Content C campaign has 249 maps/5063 NPCs; audit actual reward progression and no duplicate claim.
- Recruit: multiple recruitment panels appended in one hero tab; audit eligibility, roster limit, acquisition and duplication across routes.
- Battle: latest full regression failed Zhou Yu magic row, burn and DOT checks. Trace source hero descriptor vs native P2 fixture; do not relax assertions or modify engine without proven cause. Node-only Web Review error renderBattleShell undefined is fixed by guarding presentation wrapper.
- Fixed window: semantic pagination hides roots and can fragment interactions. Audit visible entry, selection, detail, confirmation, return, reload and P2 effect. No blanket claim that all controls work.

## Functional audit queue (not completed)
| Screen | Must prove | Status |
|---|---|---|
| City | Every building opens the correct function, cost/upgrade/production | City click smoke passed; detailed audit open |
| Heroes / profile | select each owned hero, correct data/attributes | open |
| Training | XP/cap/pay once, progression and reload | open |
| Troops | selected hero -> compatible choices -> real payment -> Save -> P2 | patch, CI pending |
| Commander | actual elite force, level, assign, skill; remove duplicate simulated presentation | open |
| Special weapon | source name, tier, upgrade, stat/passive | open |
| Inheritance | correct seal, upgrade/equip, combat | open |
| Destiny | unlock, option, equip, actual positive/negative modifier | open |
| Hero equipment | seven actual slots, equip/unequip and stats | open |
| Formation | 3x3 max five, correct hero and position, formation/seal | open |
| Hero rewards | actual progress/claim once, no conflicting campaign | open |
| Recruitment | owned/not owned, source unlock, payment once | open |
| Awakening | rank prerequisite, cost, effect, reset/refund | open |
| Barracks | real training/reinforcement; no duplicate competing troop selectors | open |
| Campaign | source maps/NPC, prerequisite, battle, receipt, return | open |
| Tech | research level, prerequisites, cost and P2 consumer | open |
| Equipment/inventory | acquisition, enhance, equip, use, refund | open |
| Tower | valid stage, win/loss, reward once | open |
| Arena | offline opponent, settlement, ranking | open |
| World | move, capture, resources, save | open |
| Quests | progress & claim once | open |
| Nation | faction restriction, changes and cost | open |
| Replays | selected real report, seek, no repeated reward | open |
| Journal | correct current event, no hidden debug data | open |
| Settings | audio/save/export/import, no lost state | open |
| Combat | native unit/skill/effect/morale/AI/settlement/replay | regression red |
No new systems, art or unnecessary balance passes until UI -> state -> combat path audited. Prioritize P0 correctness, then remove duplicated routes while preserving underlying data. No test bypass.

## UI hierarchy correction
Owner rejected current presentation: oversized persistent navigation, repeated headings, stat text on full-body art, inventory cards stretched to full screen. Rechecked actual cab43fa6 screenshots and owner 1/6 and 4/6 reference (user benchmark, not independently verified official client). Changes: compact desktop dock; 12 contextual tabs narrowed; hero art separated from readable stat panel; native equipment slots and owned-inventory controls displayed together, paginated using existing controls; hide no gameplay condition, keep existing Group04 and Save routes. ART HOLD. This is a code change, not visual acceptance. New screenshots/QA pending.
