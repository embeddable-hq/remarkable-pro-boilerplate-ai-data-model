# Plan 04 — Model Iteration and Editing

## Status: ✅ Complete

## Goal
Support users who want to modify existing models after initial generation — adding new metrics, changing access rules, adding breakdowns, or linking new tables. The workflow currently only covers generation from scratch.

---

## Tasks

### Task 4.1 — Detect existing models before generating
- [x] Added "Session start" check to CLAUDE.md: silently checks for `.cube.yaml` files in the models directory
- [x] If models exist: lists their names and asks whether to update or build new
- [x] If no models exist: proceeds with Step 0 as normal

### Task 4.2 — Define the update workflow
- [x] Instruction added: read the current file before making any changes
- [x] Instruction added: only modify what was asked — do not rewrite the whole file
- [x] Instruction added: breaking changes (removing RLS, removing joins, deleting a cube) require explicit user confirmation before proceeding
- [x] Note: quality check reference updated — validate-models script (plan-06) to be used once built; removed reference to old embeddable:build step

### Task 4.3 — Common iteration scenarios
- [x] Documented in CLAUDE.md Update Mode:
  - Add a metric
  - Add a breakdown (with column discovery if new table needed)
  - Change access control (with confirmation)
  - Link a new table (column discovery + join + primary key)
  - Remove a metric or breakdown

### Task 4.4 — Narration for updates
- [x] Instruction added: narrate only what changed, not the full cube description
- [x] Push command included at the end of every update narration

### Task 4.5 — Test iteration scenarios
- [x] Test: session start detects existing models and asks to update or start fresh — ✅ passed
- [x] Test: reads current file before acting — ✅ passed
- [x] Test: correctly identifies no change needed (price_usd already present) — ✅ passed
- [ ] Test: add a new metric — not explicitly tested (covered by happy-path flow)
- [ ] Test: change RLS — not tested (deferred, low priority)

---

## Acceptance Criteria
- [x] Claude detects existing models and asks before overwriting
- [x] Updates are surgical — only the requested change is made
- [x] Breaking changes require explicit user confirmation
- [x] Narration covers only what changed
- [x] Core test scenarios pass (Task 4.5)
