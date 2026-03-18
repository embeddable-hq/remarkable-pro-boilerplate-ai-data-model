# Plan 03 — KPI Feasibility Check

## Status: ✅ Complete

## Goal
Before generating any model, Claude must assess whether the requested KPI is actually achievable from the available schema. If not, explain why clearly and suggest the closest alternative — never silently generate a wrong or incomplete model.

---

## Tasks

### Task 3.1 — Define what makes a KPI infeasible
- [x] Four failure modes documented in CLAUDE.md Step 2:
  - **Missing metric column** — e.g. user asks for "revenue" but no price/amount column exists
  - **Missing breakdown column** — e.g. user asks to break down by country but no country/region column exists
  - **Impossible join** — no shared key between the tables needed to answer the KPI
  - **Missing time dimension** — user asks for a trend over time but no date/timestamp column exists
- [x] Feasibility check runs after `connection-columns.cjs` (Step 1) and before clarifying questions (Step 3)

### Task 3.2 — Define the response format for infeasible KPIs
- [x] Added to CLAUDE.md Step 2: when fully infeasible, Claude states what can't be built, names the missing column, suggests an alternative, asks the user to confirm
- [x] Never proceeds to Step 4 or generates files if the KPI is fully infeasible

### Task 3.3 — Define partial feasibility
- [x] Added to CLAUDE.md Step 2: if only part of the KPI is achievable, Claude says what can and can't be built and offers to generate the partial model
- [x] Never silently omits a requested breakdown — always flags it

### Task 3.4 — Add feasibility check to CLAUDE.md workflow
- [x] Inserted as Step 2 between Step 1 (discover) and Step 3 (clarify)
- [x] Existing steps renumbered: Step 2 → 3, Step 3 → 4, Step 4 → 5

### Task 3.5 — Test feasibility check
- [x] **Infeasible KPI test:** "most popular products by continent" on `bean_bags` — no continent column. Claude caught it, named `country` as the closest alternative, user confirmed, workflow continued correctly.
- [ ] **Partial feasibility test:** KPI where the metric exists but a breakdown doesn't — not yet tested
- [x] **Valid KPI test:** multiple successful happy-path runs on `bean_bags` and `spotify` — no over-refusals

---

## Acceptance Criteria
- [x] Claude never silently generates a model that doesn't answer what was asked
- [x] When a KPI is infeasible, Claude names the missing column and suggests an alternative
- [x] When a KPI is partially feasible, Claude flags what's missing and offers a partial model
- [x] All critical test cases pass (partial feasibility test is a nice-to-have)
