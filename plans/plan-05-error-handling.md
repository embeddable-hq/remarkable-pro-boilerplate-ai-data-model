# Plan 05 — Error Handling and Graceful Degradation

## Status: ✅ Complete

## Goal
Define what Claude should do when things go wrong during discovery, generation, or deployment — so users always get a clear, actionable response instead of a raw error or silent failure.

---

## Tasks

### Task 5.1 — Handle script failures during discovery (Step 1)
- [x] Added to CLAUDE.md Error Handling section: four failure types with plain-language responses
  - Connection failure
  - Empty schema
  - No schemas found
  - Script not found
- [x] Instruction added: never ask a technical question to recover — only ask for info the user would know

### Task 5.2 — Handle generation errors
- [x] Note: `embeddable:build` removed from workflow (not a model validator — Mikhail, 2026-03-18)
- [x] Structural validation moved to plan-06 (validate-models script)
- [x] YAML generation errors handled by model generation rules in CLAUDE.md (strict join rules, primary key requirements, etc.)

### Task 5.3 — Handle push failures
- [x] Added to CLAUDE.md Error Handling section: four push failure types with plain-language responses and exact recovery commands
  - Unauthorized → `npm run embeddable:login`
  - Workspace not found
  - Model validation error on push
  - Network / timeout

### Task 5.4 — Handle ambiguous or unresolvable schemas
- [x] Added to CLAUDE.md Error Handling section:
  - Unreadable columns (e.g. `metadata`) → ask user to paste an example
  - Two candidate tables for the same KPI → ask user to pick
  - Missing foreign key with matching column names → ask before assuming the join

### Task 5.5 — Test error scenarios
- [x] Push without login — tested earlier in session, output was "Unauthorized. Please login using `npm run embeddable:login`" — correct
- [x] Invalid connection name — ✅ passed. `fake-db` connection triggered a clear plain-language error response.
- [x] Ambiguous schema (two candidate tables) — ✅ passed. "show me total sales over time" on `public` schema returned two candidates (`transaction_raw`, `transaction_daily`) — Claude asked the user to pick rather than guessing.

---

## Acceptance Criteria
- [x] No script failure produces a silent or confusing response
- [x] Push errors explained in plain language with exact recovery command
- [x] Users never asked a technical question they wouldn't know the answer to
- [x] Ambiguous schemas prompt a user choice rather than a silent guess
- [x] All test scenarios pass (Task 5.5)
