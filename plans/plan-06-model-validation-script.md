# Plan 06 — Model Validation and Quality Scoring

## Goal
Build a lightweight script that parses generated `.cube.yaml` files and checks them against objective structural rules. Runs independently of the generating agent — no bias, no heavy build step. Also covers ground truth comparison, live query validation, RLS verification, and messy schema testing (absorbed from old plan-03 (Quality Measurement Baseline)).

---

## Tasks

### Task 8.1 — Define the validation rules
Rules the script must check for every cube file:

**Structural completeness:**
- [ ] Every cube has at least one measure
- [ ] Every cube has at least one dimension
- [ ] Every cube that has a date/timestamp column has a `time` dimension defined
- [ ] Every cube has a `description` field
- [ ] Every measure has a `description` field
- [ ] Every dimension has a `description` field

**Join correctness:**
- [ ] Every cube that has a `joins` block declares a primary key (`primary_key: true`) on at least one dimension
- [ ] Every join has a `relationship` field (`many_to_one`, `one_to_many`, or `one_to_one`)
- [ ] Every join has a `sql` condition

**RLS:**
- [ ] If the cube uses `sql:` (not `sql_table:`), check whether it contains a `WHERE` clause — flag if absent so a human can verify intent

**Naming:**
- [ ] All cube, measure, and dimension names are `snake_case`
- [ ] Flag any names containing technical suffixes: `_id`, `_ms`, `_bak`, `_aud`, `_raw`

**Data source:**
- [ ] If `data_source` is present, check it is a non-empty string

### Task 8.2 — Build the script
- [ ] Script location: `src/embeddable.com/scripts/validate-models.cjs`
- [ ] Input: path to a directory of `.cube.yaml` files (e.g. `src/embeddable.com/models/`)
- [ ] Output: pass/fail per rule per file, with a summary score at the end
- [ ] Exit code: `0` if all rules pass, `1` if any rule fails — so it can be used in CI
- [ ] Output format: plain text, human-readable. Example:
  ```
  Validating: transactions.cube.yaml
    ✅ has measure
    ✅ has dimension
    ✅ has time dimension
    ✅ all descriptions present
    ✅ primary key declared (joins present)
    ⚠️  sql: used without WHERE clause — verify RLS intent
    ✅ snake_case names

  Validating: products.cube.yaml
    ✅ has measure
    ❌ missing description on dimension: price_usd

  Summary: 2 files, 1 failure, 1 warning
  ```

### Task 8.3 — Integrate into CLAUDE.md workflow
- [ ] Add instruction to CLAUDE.md Step 4: after generating files, tell the user:
  > "Run `node src/embeddable.com/scripts/validate-models.cjs src/embeddable.com/models/` to check the generated models."
- [ ] Do NOT run the script automatically as part of generation — it runs separately, on demand, by the user or CI
- [ ] Add the script to `package.json` as `"validate:models": "node src/embeddable.com/scripts/validate-models.cjs src/embeddable.com/models/"`

### Task 8.4 — Test the script
- [ ] Run against `generated-run-01/` (Spotify) — record pass/fail per rule
- [ ] Run against current `models/` (bean_bags) — record pass/fail per rule
- [ ] Intentionally break a model (remove a description, remove a primary key) — verify the script catches it
- [ ] Record results in `quality-scores.md`

### Task 8.5 — Ground truth comparison against reference models
- [ ] After script passes, compare generated models semantically against reference models in `src/embeddable.com/models/reference/<schema>/`
- [ ] Comparison is semantic, not line-by-line — same logical cubes, correct join direction and relationship type, correct aggregation types, correct dimensions. Naming differences are not divergences.
- [ ] If reference files contain `# REFERENCE MODEL — replace`: note comparison is not definitive, skip divergence scoring
- [ ] If no reference folder exists for the schema: score as ⏭️ not tested
- [ ] Document any divergences: bug in generated model, or valid alternative approach?

### Task 8.6 — Live query execution validation (requires login)
- [ ] After `embeddable:push` succeeds, run each KPI as an actual query in the embeddable.com UI
- [ ] Confirm results are non-empty and numbers are plausible
- [ ] Record any query errors or zero-result responses in `quality-scores.md`

### Task 8.7 — RLS correctness verification (requires login)
- [ ] Configure two test security contexts with different `user_id` values
- [ ] Run the same query under both contexts — confirm they return different, non-overlapping rows
- [ ] Confirm neither context can see the other's data
- [ ] Apply to schemas where RLS is used (e.g. `bean_bags` transactions)

### Task 8.8 — Messy schema testing
- [ ] Identify or create a schema with real-world complexity:
  - Missing foreign keys (joins must be inferred from column names)
  - Ambiguous column names (e.g. multiple `id` columns, `status` with no obvious meaning)
  - No date/timestamp columns on some tables
  - Columns with misleading names (e.g. `amount` that is actually a count)
- [ ] Run the agent against this schema and validate output using `validate-models.cjs`
- [ ] Document any cases where the agent silently guessed wrong vs. asked the user

---

## Acceptance Criteria
- Script catches missing measures, dimensions, time dimensions, descriptions, primary keys, and non-snake_case names
- Script flags `sql:` cubes without a WHERE clause for human RLS review
- Exit code `1` on any failure — usable in CI
- Does not require login, network access, or `embeddable:build`
- Runs in under 2 seconds on a typical model directory
- Ground truth comparison runs after script passes
- Live query and RLS tests run once login is available
