# Plan 06 — Model Validation Script

## Goal
Build a lightweight script that parses generated `.cube.yaml` files and checks them against objective structural rules. Runs independently of the generating agent — no bias, no heavy build step. End users use the generated models directly; this script is for developers and CI only.

Note: Ground truth semantic comparison (reference models) deferred — reference models to be provided later. Manual/live query checks removed — end users won't be running quality tests.

---

## Tasks

### Task 6.1 — Define the validation rules
Rules the script checks for every cube file:

**Structural completeness:**
- [x] Every cube has at least one measure
- [x] Every cube has at least one dimension
- [x] Every cube that has a date/timestamp column has a `time` dimension defined
- [x] Every cube has a `description` field
- [x] Every measure has a `description` field
- [x] Every dimension has a `description` field

**Join correctness:**
- [x] Every cube with a `joins` block declares a primary key on at least one dimension
- [x] Every join has a `relationship` field
- [x] Every join has a `sql` condition

**RLS:**
- [x] If the cube uses `sql:` (not `sql_table:`), flag if no `WHERE` clause — human should verify intent

**Naming:**
- [x] All cube, measure, and dimension names are `snake_case`
- [x] Flag names with technical suffixes: `_id`, `_ms`, `_bak`, `_aud`, `_raw`

**Data source:**
- [x] If `data_source` is present, it must be a non-empty string

### Task 6.2 — Build the script
- [x] Script built at `src/embeddable.com/scripts/validate-models.cjs`
- [x] Input: path to a directory of `.cube.yaml` files
- [x] Output: pass/fail per rule per file, summary at the end
- [x] Exit code: `0` all pass, `1` any failure
- [x] Added to `package.json` as `validate:models`

### Task 6.3 — Integrate into CLAUDE.md workflow
- [x] Step 5 updated: run `npm run validate:models` after generating files; pass = add one line; fail = fix before handover

### Task 6.4 — Test the script
- [x] Run against `reference/spotify/` — 0 failures after fixing missing PK descriptions (3 files, 1 warning on `_ms` suffix — expected)
- [x] Run against main `models/` — no files present (all models removed in earlier session), script correctly reports no files
- [x] Intentionally break a model — script caught all 6 violations: missing measure, no non-PK dimensions, missing description, missing join sql, non-snake_case name, exit code 1

### Task 6.5 — Ground truth comparison (deferred)
- [ ] Blocked on reference models being provided — add to `src/embeddable.com/models/reference/<schema>/` when ready

---

## Acceptance Criteria
- [x] Script catches structural issues: missing measures, dimensions, time dimensions, descriptions, primary keys
- [x] Script flags RLS gaps for human review
- [x] Exit code `1` on failure — usable in CI
- [x] No login, network, or `embeddable:build` required
- [x] Runs in under 2 seconds
- [x] Test runs completed (Task 6.4)
