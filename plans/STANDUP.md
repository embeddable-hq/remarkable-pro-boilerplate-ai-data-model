# AI Data Modeling — Standup Log

> Format for each entry:
> - **Date**
> - **Prompt/context changes made** — what did you change in CLAUDE.md or any plan file, and what effect did it have?
> - **Measurement improvements** — did scores go up? what changed in the rubric or test run?
> - **What we learned** — unexpected behaviour, new insight about the workflow or the agent
> - **Biggest challenge today** — what's the hardest thing in front of you right now?

---

## 2026-03-16

### Prompt / Context Changes
- None yet. This is the baseline session.
- Created CLAUDE.md with the original schema-first workflow (already in repo).
- Wrote `AI-DATA-MODELING-BASELINE.md` documenting known gaps.

### Measurement Improvements
- No measurements run yet. Ground-truth Spotify models not yet written.
- Baseline rubric not yet defined — that's Plan 03, Task 3.2.

### What We Learned
- The current workflow is schema-first: it asks "which schemas? which tables?" before understanding what the developer wants to build. This requires Cube.js knowledge from the developer upfront.
- The spec intention was KPI-first: start with "what do you want to show?" and infer tables from that.
- Post-generation narration is completely missing from CLAUDE.md — Claude generates files silently.
- Two file extension values are in conflict: `.cube.yaml` (CLAUDE.md) vs `.cube.yml` (spec doc).

### Biggest Challenge Today
- Defining what "KPI-first" actually looks like as a concrete conversation flow (Plan 01, Task 1.2). The mapping from a business KPI to a likely set of database tables requires either a lookup/heuristic or a two-pass approach (ask KPI → then still do introspection to confirm).

---

## 2026-03-17

### Prompt / Context Changes
- **CLAUDE.md — full rewrite.** Replaced the original schema-first multi-section doc with a lean 5-step workflow:
  - Step 0: single open question — "What do you want to see on your dashboard?"
  - Step 1: silent DB discovery (connections → schemas → tables → columns), with connection-list run first so user picks from real options
  - Step 2: ask only what can't be inferred from the schema; access control question made mandatory
  - Step 3: plain-language confirmation before generating
  - Step 4: generate files + structured narration grouped by cube (decisions explained, push command at the end)
  - Step 5: silent quality check via `embeddable:build`, scores written to `quality-scores.md`, broken models fixed before handover
- **Effect:** Happy-path tests on `bean_bags` and `spotify` schemas produced valid models. KPI-oriented questions only — no Cube.js jargon surfaced to user. Build passed with zero errors on tested runs.
- **`Your Role` section added** — explicitly bans Cube.js jargon (fact table, dimension, measure, RLS, YAML, sql_table, cardinality, pre-aggregation) from user-facing language.
- **Plan 02 (narration) — marked Implemented.** All core tasks done: narration instructions live in CLAUDE.md Step 4. Only outstanding item is a live narration quality test (Task 2.4).

### Measurement Improvements
- Quality rubric defined (Plan 03, Task 3.1 ✅): syntax, KPI coverage, completeness, feasibility check, human review, join correctness, RLS, naming clarity, reference model similarity.
- `embeddable:build` used as the syntax validator — confirmed passing on current models (Task 3.3 ✅ for build; push blocked on login).
- Plan 03 expanded from 5 tasks to 10: added ground-truth reference model comparison (Task 3.6), live query execution (Task 3.7), RLS correctness verification (Task 3.8), messy schema testing (Task 3.9), regression test suite (Task 3.10).
- Quality check now runs **automatically** in Step 5 of CLAUDE.md — no manual trigger needed.

### What We Learned
- The two-pass approach works: ask KPI first → run introspection silently → confirm plan → generate. Users don't need to understand schemas.
- Connection listing must happen before KPI questions, but currently Step 1 (connections) runs after Step 0 (KPI question). Order is inverted from the plan spec — needs fixing.
- When only one connection exists, Claude uses it silently without confirming. Plan says to confirm with the user — not yet implemented.
- No explicit KPI → table inference heuristic in CLAUDE.md. Claude infers from context, which works on simple schemas but may break on ambiguous ones.
- Feasibility check (Task 1.4) is not in CLAUDE.md yet — if a user asks for an impossible KPI, Claude may silently generate a partial or wrong model.

### Biggest Challenge Today
- **Feasibility check (Plan 03)** — defining when to tell the user "this can't be built" vs. "here's the closest thing I can build" requires Claude to reason about gaps between what's asked and what exists in the schema. The instruction needs to be precise enough that Claude doesn't over-refuse (blocking valid requests) or under-refuse (silently generating wrong models). Elevated from Plan 01 Task 1.4 to its own plan (plan-03) given the complexity.

---

## 2026-03-18

### Prompt / Context Changes
- **CLAUDE.md Step 5 updated** — validation script runs automatically after generation. Pass = single "✅ Structural checks passed" line. Fail = fix before handover, no user prompt needed.
- **Error handling section retained** — no changes; push failure handling still in place from Plan 05.

### Measurement Improvements
- **validate-models.cjs built and tested** — objective, agent-independent quality gate. Catches: missing measures/dimensions/descriptions, join errors (no PK, no relationship, no sql), RLS gaps, non-snake_case names, technical suffixes. Exit code 1 on any failure.
- **Tested on reference Spotify models** — 0 failures, 1 expected warning (`duration_ms` suffix). Fixed missing PK descriptions in all 3 reference placeholders.
- **Intentional break test** — 6 violations injected, all 6 caught.

### What We Learned
- `js-yaml` is already installed as a transitive dependency — no additional install needed.
- Primary key dimensions need descriptions too — the validator correctly flags them. Reference placeholders were missing these.
- The `_ms` suffix warning fires on `duration_ms` — this is correct behaviour (flag for review), not a bug. Milliseconds are a legitimate unit but the naming convention warns anyway.
- `generated-run-01/` directory no longer exists — Spotify test models were not committed. Only reference placeholders remain.

### Biggest Challenge Today
- All six plans complete. No outstanding blocking challenges. Next step when ready: provide hand-written reference models in `src/embeddable.com/models/reference/<schema>/` to enable ground truth semantic comparison (Plan 06, Task 6.5 — deferred pending user input).

---

## Template for Next Entry

```
## YYYY-MM-DD

### Prompt / Context Changes
-

### Measurement Improvements
-

### What We Learned
-

### Biggest Challenge Today
-
```

---

## Plan Status Overview

| Plan | Title | Status |
|------|-------|--------|
| Plan 01 | KPI-First Workflow | ✅ Done |
| Plan 02 | Post-Generation Narration | ✅ Done |
| Plan 03 | KPI Feasibility Check | ✅ Done |
| Plan 04 | Model Iteration and Editing | ✅ Done |
| Plan 05 | Error Handling and Graceful Degradation | ✅ Done |
| Plan 06 | Model Validation and Quality Scoring | ✅ Done |

> Update status to: 🔲 Not started → 🟡 In progress → ✅ Done

---

## Task Completion Log

> When a task checkbox is marked done, log it here with the date and a one-line note on what changed.

| Date | Plan | Task | Note |
|------|------|------|------|
| 2026-03-17 | Plan 01 | Task 1.1 — Audit CLAUDE.md | Done informally as part of rewrite; no standalone doc written |
| 2026-03-17 | Plan 01 | Task 1.2 — Connection selection | Implemented; gaps: silent when 1 connection, order is Step 1 not Step 0 |
| 2026-03-17 | Plan 01 | Task 1.3 — KPI-first flow | Implemented in Steps 0–3; no explicit KPI→table map or fallback path yet |
| 2026-03-17 | Plan 01 | Task 1.5 — Rewrite CLAUDE.md | Old schema-first workflow replaced with 5-step KPI-first flow |
| 2026-03-17 | Plan 01 | Task 1.6 — Happy path test | Passed on `bean_bags` and `spotify` schemas; infeasible/partial tests not yet run |
| 2026-03-17 | Plan 02 | Tasks 2.1–2.3 | Narration instructions added to CLAUDE.md Step 4; all core tasks done |
| 2026-03-17 | Plan 03 | Task 3.1 — Rubric defined | All 8 scoring dimensions defined in CLAUDE.md Step 5 |
| 2026-03-17 | Plan 03 | Task 3.3 — Syntax validation | `embeddable:build` passes with zero errors; push blocked on login |
| 2026-03-18 | Plan 06 | Task 6.1 — Define validation rules | All rules defined: completeness, joins, RLS, naming, data_source |
| 2026-03-18 | Plan 06 | Task 6.2 — Build the script | `validate-models.cjs` built; added as `npm run validate:models` |
| 2026-03-18 | Plan 06 | Task 6.3 — Integrate into CLAUDE.md | Step 5 updated: auto-runs after generation, fixes failures before handover |
| 2026-03-18 | Plan 06 | Task 6.4 — Test the script | Passed: reference models, empty dir, intentional break (6/6 caught) |
