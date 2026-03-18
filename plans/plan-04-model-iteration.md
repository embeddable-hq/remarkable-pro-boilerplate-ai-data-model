# Plan 04 — Model Iteration and Editing

## Goal
Support users who want to modify existing models after initial generation — adding new metrics, changing access rules, adding breakdowns, or linking new tables. The workflow currently only covers generation from scratch.

---

## Tasks

### Task 6.1 — Detect existing models before generating
- [ ] Add instruction to CLAUDE.md: at the start of a session, check if `.cube.yaml` files already exist in the models directory
- [ ] If models exist: ask the user whether they want to add to existing models or start fresh
  - "I can see you already have models for `transactions`, `products`, and `customers`. Do you want to update those, or build something new?"
- [ ] If no models exist: proceed with the standard Step 0–5 workflow

### Task 6.2 — Define the update workflow
- [ ] Add instruction: when updating an existing model, read the current file first before making changes
- [ ] Add instruction: only modify what the user asked to change — do not rewrite the whole file
- [ ] Add instruction: if the requested change conflicts with an existing rule (e.g. user wants to remove RLS that was previously confirmed), ask explicitly before proceeding
- [ ] Add instruction: after editing, re-run Step 5 quality check to confirm the updated model still builds and scores correctly

### Task 6.3 — Common iteration scenarios
Document instructions for the most common update requests:
- [ ] **Add a new metric** — e.g. "also show average order value" → add a new measure to the relevant cube
- [ ] **Add a new breakdown** — e.g. "also break down by product category" → add a new dimension, check if a new join is needed
- [ ] **Change access control** — e.g. "actually show all data to all users" → remove or update the RLS filter, confirm with user before changing
- [ ] **Link a new table** — e.g. "also bring in the `returns` table" → run column discovery on the new table, check for a join key, add the join
- [ ] **Remove a metric or breakdown** — e.g. "remove the revenue metric" → delete the measure, re-run build to confirm no other member depends on it

### Task 6.4 — Narration for updates
- [ ] Add instruction: after editing an existing model, narrate only what changed — not the full cube description again
  - e.g. "I added an `average_order_value` metric to `transactions` — it's calculated by dividing total revenue by the number of orders."
- [ ] End with the push command as usual

### Task 6.5 — Test iteration scenarios
- [ ] Test: add a new metric to an existing model — verify only the measure is added, rest of file unchanged
- [ ] Test: change RLS from per-user to all-data — verify Claude asks for confirmation before removing the filter
- [ ] Test: link a new table — verify column discovery runs for the new table and join is correctly modelled
- [ ] Confirm build passes after each update

---

## Acceptance Criteria
- Claude detects existing models and asks before overwriting
- Updates are surgical — only the requested change is made
- Breaking changes (removing RLS, removing joins) require explicit user confirmation
- Quality check runs after every update
- Narration covers only what changed, not the full cube
