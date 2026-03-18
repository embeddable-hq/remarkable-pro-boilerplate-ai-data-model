# Plan 05 — Error Handling and Graceful Degradation

## Goal
Define what Claude should do when things go wrong during discovery, generation, or deployment — so users always get a clear, actionable response instead of a raw error or silent failure.

---

## Tasks

### Task 7.1 — Handle script failures during discovery (Step 1)
- [ ] Add instruction to CLAUDE.md: if any discovery script returns a non-200 response or throws an error, do not proceed silently — report to the user in plain language
- [ ] Define responses for each failure type:
  - **Connection failure** — "I couldn't connect to the database. Could you check that the connection details in your `.env` file are correct?"
  - **Empty schema** — "I connected successfully but didn't find any tables in this schema. Could you confirm the schema name, or pick a different one?"
  - **No schemas found** — "I connected but found no schemas. Is this the right connection?"
  - **Script not found / misconfigured** — "A setup script is missing. Run `npm install` and try again — if the problem persists, check that `src/embeddable.com/scripts/` is intact."
- [ ] Add instruction: never ask the user a Cube.js or technical question to recover from a script error — only ask for information they'd know (connection name, schema name, whether data exists)

### Task 7.2 — Handle build failures in Step 5
- [ ] Add instruction: if `embeddable:build` fails, do not hand over the models to the user
- [ ] Add instruction: parse the build error, identify the cube and member causing the failure, fix it, and re-run — silently, up to 3 attempts
- [ ] After 3 failed attempts: tell the user what went wrong in plain language and what they can do
  - e.g. "The model couldn't be built because of a join configuration issue in `transactions`. I've tried fixing it but keep hitting the same error. Here's what I know: [plain English description]. You may need to check the connection credentials or schema permissions."
- [ ] Add instruction: never deliver a model that doesn't build

### Task 7.3 — Handle push failures
- [ ] Add instruction: if `embeddable:push` fails, interpret the error and respond in plain language:
  - **Unauthorized** — "You need to log in first. Run `npm run embeddable:login` and then try pushing again."
  - **Workspace not found** — "The push couldn't find your workspace. Check that your API key or login is for the right account."
  - **Model validation error on push** (different from build) — "The models built locally but the platform rejected one. Here's what was flagged: [plain English]. I'll try to fix it."
  - **Network/timeout** — "The push timed out. Check your internet connection and try `npm run embeddable:push` again."
- [ ] Add instruction: always end with the exact command the user needs to run next

### Task 7.4 — Handle ambiguous or unresolvable schemas
- [ ] Add instruction: if column discovery returns a table with no recognisable columns for the stated KPI, say so explicitly rather than guessing
  - e.g. "I found a `metadata` column but can't read its structure directly. Could you paste an example of what's stored in it?"
- [ ] Add instruction: if two tables could both answer the KPI (ambiguous schema), present both options in plain language and ask the user to pick
- [ ] Add instruction: if a foreign key is missing but two tables look like they should be joined (matching column names), ask the user to confirm before assuming the join

### Task 7.5 — Test error scenarios
- [ ] Test: run with an invalid connection name — verify Claude reports the failure clearly and asks for the right info
- [ ] Test: intentionally introduce a YAML syntax error into a generated model and verify Step 5 catches and fixes it before handover
- [ ] Test: run `embeddable:push` without login — verify Claude gives the exact recovery command
- [ ] Document results

---

## Acceptance Criteria
- No script failure produces a silent or confusing response
- Build errors are fixed automatically (up to 3 attempts) before the user sees the models
- Push errors are explained in plain language with the exact recovery command
- Users are never asked a technical question they wouldn't know the answer to
- Ambiguous schemas prompt a user choice rather than a silent guess
