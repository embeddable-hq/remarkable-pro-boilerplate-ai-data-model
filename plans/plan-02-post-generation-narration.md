# Plan 02 — Add Post-Generation Explanation to CLAUDE.md

## Goal
After generating `.cube.yaml` files, Claude should explain what it built and why — not just silently drop files. The explanation should be clear to a developer who has never used Cube.js.

---

## Status: ✅ Complete

CLAUDE.md Step 4 updated with structured narration instructions. See adjustments below.

---

## Tasks

### Task 2.1 — Define what a good post-generation explanation looks like
- [x] Key elements defined:
  - What each cube represents in business terms
  - What the key measures calculate (plain English)
  - What the key dimensions are for slicing data
  - Why decisions were made (measure vs breakdown, exclusions, join direction)
  - RLS — who sees what in plain English
  - Push command at the end
- [x] **Production adjustment:** file paths omitted from narration — they are visible in the IDE. Avoids noise for repeat users.
- [x] **Production adjustment:** "keep under one screen" constraint added — avoids over-explaining every field.

### Task 2.2 — Write the post-generation instruction block for CLAUDE.md
- [x] Added to Step 4 in CLAUDE.md — grouped by cube, plain business language
- [x] Ends with `npm run embeddable:push` reminder

### Task 2.3 — Add instruction to explain model decisions
- [x] Instruction added: explain why a column is a metric vs breakdown (aggregate = metric, group-by = breakdown)
- [x] Instruction added: explain join direction and how tables are linked
- [x] Instruction added: note any intentionally excluded columns and why
- [x] Instruction added: explain calculated field formulas in plain English

### Task 2.4 — Test the narration quality
- [x] Validated during live test on `bean_bags` schema — all Task 2.1 checklist items present
- [x] No Cube.js jargon found — plain English throughout
- [x] Decisions, exclusions, access rules, and push command all present

---

## Acceptance Criteria
- [x] Every model generation session ends with a structured explanation
- [x] The explanation is readable by someone with no Cube.js background
- [x] Decisions (measure vs dimension, join direction, exclusions) are narrated with reasoning
- [x] Developer knows exactly what command to run next
- [x] Narration quality validated via live test (Task 2.4)
