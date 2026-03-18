# Plan 01 — Rewrite CLAUDE.md Workflow to be KPI-First

## Goal
Replace the current schema-discovery-first workflow with a KPI/goal-first conversation flow so developers don't need to understand Cube.js or database concepts upfront.

## Status: ✅ Complete

---

## Tasks

### Task 1.1 — Audit the current CLAUDE.md workflow
- [x] Read and mapped the original schema-first workflow
- [x] Identified and eliminated all Cube.js jargon from user-facing flow

### Task 1.2 — Add connection selection
- [x] `connection-list-env-file.cjs` runs in Step 1a
- [x] Connection list presented as a numbered list (not raw JSON)
- [x] User asked to pick when multiple connections exist
- [x] **Actual flow:** Claude opens with the KPI question → runs connection listing silently → asks user to pick if multiple exist → continues discovery. This order is correct — KPI first is better UX than opening with a technical connection picker.

### Task 1.3 — KPI-first conversation flow
- [x] Claude opens with Step 0: "What do you want to see on your dashboard?"
- [x] User answers with their goal
- [x] Claude runs connection listing silently, asks user to pick if multiple exist
- [x] Schema discovery runs silently (Step 1) — user never sees raw JSON
- [x] Step 2 asks only what can't be inferred, using real column names
- [x] **Design decision:** no hardcoded KPI→table mapping needed — Claude infers from schema
- [x] **Design decision:** fallback when tables can't be inferred is covered by plan-05

### Task 1.4 — KPI feasibility check
- [x] Elevated to its own plan — see **plan-03**

### Task 1.5 — Rewrite the workflow section of CLAUDE.md
- [x] Full 5-step KPI-first workflow live in CLAUDE.md
- [x] No Cube.js jargon in any user-facing step
- [x] Feasibility check to be added via plan-03

### Task 1.6 — Test the rewritten workflow
- [x] Happy path tested on `bean_bags` and `spotify` schemas — valid models generated, build passed
- [x] Connection listing tested — user picks from numbered list
- [ ] Infeasible KPI test — tracked in **plan-03, Task 3.5**
- [ ] Partial feasibility test — tracked in **plan-03, Task 3.5**

---

## Acceptance Criteria

| Criteria | Status |
|---|---|
| Claude opens with KPI question, user answers, then connection listing runs | ✅ Done |
| Non-Cube developer can complete the full workflow by describing goals only | ✅ Done |
| No question requires Cube.js knowledge | ✅ Done |
| Claude lists connections and asks user to choose when multiple exist | ✅ Done |
| When KPI is infeasible, Claude explains why and names the missing column | → plan-03 |
| When KPI is partially feasible, Claude generates partial model and flags what's missing | → plan-03 |
