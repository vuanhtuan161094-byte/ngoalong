# TOTAL HERO ASSET INTEGRATION — E / FA4

Scope: reuse existing V5 and V6 assets, exact runtime IDs only, no image generation. Preserve gameplay, 3×3 formation, 5 heroes per side, Save v5 and single offline HTML.

- One shared portrait lookup for recruitment, selected equipment owner, formation picker and occupied slots, and battle identity strip (including replay when native shell renders).
- Existing hero detail uses full-body masters, square portrait and optional splash.
- Unknown NPC identities display an initial rather than an unrelated hero portrait. No name-based guessing.
- Canonical build emits exact missing portrait/full-body IDs and unused art IDs; browser QA records actual runtime coverage and checks shared portrait usage.
- Do not claim complete coverage until exact-SHA build and browser screenshots are verified. Missing IDs require source reconciliation, not new art unless specifically authorized.
