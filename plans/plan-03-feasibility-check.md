# Plan 03 — KPI Feasibility Check

## Goal
Before generating any model, Claude must assess whether the requested KPI is actually achievable from the available schema. If not, explain why clearly and suggest the closest alternative — never silently generate a wrong or incomplete model.

---

## Tasks

### Task 5.1 — Define what makes a KPI infeasible
- [ ] Document the four failure modes in CLAUDE.md:
  - **Missing metric column** — user asks for "revenue" but no price/amount column exists
  - **Missing breakdown column** — user asks to break down by country but no country/region column exists
  - **Impossible join** — no shared key between the tables needed to answer the KPI
  - **Missing time dimension** — user asks for a trend over time but no date/timestamp column exists
- [ ] Add instruction: assess feasibility after `connection-columns.cjs` runs and before Step 3 (confirm plan)

### Task 5.2 — Define the response format for infeasible KPIs
- [ ] Add instruction to CLAUDE.md: when a KPI cannot be built, Claude must:
  - State clearly in plain language: "This can't be built from the available data"
  - Name specifically which column or link is missing and why it's needed
  - Suggest the closest alternative that *is* possible (e.g. "There's no revenue column, but there is a `quantity` column — I could show total units sold instead")
  - Ask: "Would you like me to build that instead, or would you prefer to stop here?"
- [ ] Add instruction: never proceed to Step 3 or generate files if the KPI is fully infeasible

### Task 5.3 — Define partial feasibility
- [ ] Add instruction: if only part of the KPI is achievable (e.g. the metric exists but the breakdown doesn't), Claude must:
  - Say explicitly what can and cannot be built
  - Offer to generate the partial model with a clear note on what's missing
  - Example: "I can show total purchases over time, but there's no region column — I can't break it down by region"
- [ ] Add instruction: never silently omit a requested breakdown — always flag it

### Task 5.4 — Add feasibility check to CLAUDE.md workflow
- [ ] Insert feasibility check between Step 1 (discover) and Step 2 (clarify)
- [ ] Instruction: after columns are known, trace each KPI element (metric, breakdown, time, join) to a real column — if any element has no match, trigger the infeasible/partial response
- [ ] Add to Step 5 quality check rubric: "Did the generated model answer every KPI the user stated? If not, was the gap explained?"

### Task 5.5 — Test feasibility check
- [ ] **Infeasible KPI test:** run "I want to show revenue per track" on the Spotify schema — verify Claude refuses, names the missing column, and suggests an alternative
- [ ] **Partial feasibility test:** run a KPI where the metric exists but the breakdown doesn't — verify Claude generates the partial model and explicitly flags what's missing
- [ ] **Valid KPI test:** re-run a known working KPI — verify Claude does not over-refuse
- [ ] Document results in `quality-scores.md`

---

## Acceptance Criteria
- Claude never silently generates a model that doesn't answer what was asked
- When a KPI is infeasible, Claude names the missing column/relationship and suggests an alternative
- When a KPI is partially feasible, Claude generates the partial model and flags what's missing
- Feasibility check is part of the Step 5 quality score
- All three test cases pass
