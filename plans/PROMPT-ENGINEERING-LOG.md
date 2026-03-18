# Prompt Engineering Log — CLAUDE.md Iterations

Tracks changes to `CLAUDE.md` (the agent's instruction context), the specific behavior problem each change was trying to fix, and how the improvement in Claude's behavior was measured.

> **What is the "prompt" here?**
> `CLAUDE.md` is read by Claude Code at the start of every conversation. Every instruction in it directly shapes how Claude responds. This log treats each meaningful change to that file as a prompt iteration.

---

## Iteration 0 — Baseline (no changes)

### Prompt state
Schema-first opening. No jargon restrictions. No narration. No error handling. Claude opened conversations with technical questions about schemas and tables.

### Observed behavior problems
| Behavior | Problem |
|----------|---------|
| First question was "which schema do you want to use?" | Required the user to already know what a schema is |
| Follow-up questions used terms like "fact table", "dimension", "RLS" | Non-technical users couldn't answer without reading Cube.js docs |
| Files generated silently | User had no idea what was built or whether it was correct |
| No handling for missing columns | Claude would generate a model for an impossible KPI without warning |

### Measurement baseline
No formal measurement. Behavior problems identified by manually walking through the conversation flow and noting where a non-technical user would get stuck.

---

## Iteration 1 — KPI-First Opening + Jargon Ban

### Prompt change
**Added to CLAUDE.md:**
```
## Your Role
Never say "fact table", "dimension", "measure", "RLS", "YAML", "sql_table",
"cardinality", "pre-aggregation".

### Step 0 — Understand the goal
Ask one open question:
"What do you want to see on your dashboard?"
Don't ask follow-ups yet. Move to Step 1 immediately.

### Step 1 — Discover the database (run silently, no user questions)
[discovery scripts run here — user never sees raw JSON]
```

### Behavior problem being fixed
Claude was opening with technical questions that required Cube.js knowledge. Users had to understand the data model structure before they could even describe what they wanted.

### How improvement was measured
**Test:** Start a new conversation and observe the first message Claude sends.

| Signal | Before | After |
|--------|--------|-------|
| Opening question | "Which schema would you like to use?" | "What do you want to see on your dashboard?" |
| Jargon in questions | "Do you want a time dimension?" | "Is there a date you'd like to filter by?" |
| Schema/table selection | Asked upfront, required technical knowledge | Happens silently; user only picks connection if multiple exist |
| User knowledge required | Cube.js schema structure | Only their business goal |

**Verification:** Ran full conversation on `bean_bags` and `spotify` schemas — user needed zero Cube.js knowledge to reach generated models.

---

## Iteration 2 — Silent Discovery + Connection Handling

### Prompt change
**Added to CLAUDE.md Step 1:**
```
# 1a. Connections
node src/embeddable.com/scripts/connection-list-env-file.cjs
# → if one: use it silently. If many: ask user to pick from numbered list.
```

### Behavior problem being fixed
Claude was either skipping connection selection entirely (guessing) or asking for connection details in a way that required technical knowledge (raw connection names from the API).

### How improvement was measured
**Test:** Run with a workspace that has multiple connections. Observe whether Claude presents a numbered list or asks a raw technical question.

| Signal | Before | After |
|--------|--------|-------|
| Multiple connections | Claude guessed or asked for a raw connection ID | Numbered list shown, user picks a number |
| Single connection | Asked user to confirm the connection name | Used silently, no question asked |
| Discovery output | Raw JSON occasionally visible in response | Never surfaced to user |

---

## Iteration 3 — Post-Generation Narration

### Prompt change
**Added to CLAUDE.md Step 5:**
```
For each cube cover:
- What it represents — one sentence in business terms
- What you can measure — key metrics in plain English
- How you can slice it — key breakdowns available
- Why decisions were made — why a column is a metric vs a breakdown
- Excluded columns — what was left out and why
- Calculated fields — any formula explained in plain English
- Access — who sees what (or that all data is visible to all users)

Keep the whole explanation under one screen.
End with: "To make these models live, run: npm run embeddable:push"
```

### Behavior problem being fixed
Claude was generating files and stopping. Users received YAML files with no explanation of what was built, what decisions were made, or what to do next.

### How improvement was measured
**Test:** Run generation, then manually check the response against a 7-point checklist.

| Checklist item | Before | After |
|----------------|--------|-------|
| What the cube represents | Not mentioned | Present |
| What metrics calculate | Not explained | Present in plain English |
| Why a column is a metric vs breakdown | Not explained | Present |
| Excluded columns explained | Not mentioned | Present |
| Access control explained in plain English | Not mentioned | Present |
| Push command given | Not present | Always present |
| Cube.js jargon in narration | Sometimes present | None found |

**Verification:** Narration reviewed on live `bean_bags` run — all 7 items present, plain English throughout.

---

## Iteration 4 — KPI Feasibility Check

### Prompt change
**Added to CLAUDE.md as new Step 2:**
```
After columns are known, trace each element of the user's KPI to a real column
before doing anything else.

If fully infeasible — do not proceed to Step 3. Tell the user:
"This can't be built from the available data. There's no [column] — that's needed
to [reason]. The closest I can build is [alternative]. Would you like me to build
that instead?"

Never silently omit a requested metric or breakdown. Always flag gaps explicitly.
```

### Behavior problem being fixed
Claude was generating models even when the requested KPI couldn't be answered by the schema. A user asking for "sales by continent" would get a model that silently substituted "country" — or worse, referenced a non-existent column.

### How improvement was measured
**Test:** Ask for a KPI that requires a column that doesn't exist in the schema.

**Test case used:** "most popular products by continent" on `bean_bags` schema, which has a `country` column but no `continent` column.

| Signal | Before | After |
|--------|--------|-------|
| Missing column | Model generated silently, column substituted without mention | Claude stopped, named the missing column, named the available alternative |
| User informed | No | Yes — explicit message before any generation |
| Workflow blocked | No — proceeded to generate | Yes — waited for user confirmation before continuing |
| Over-refusal on valid KPIs | N/A | None observed — valid requests passed through correctly |

**Verification:** Claude's response named `continent` as missing, offered `country` as the alternative, waited for confirmation. User said "use country" — workflow resumed correctly.

---

## Iteration 5 — Model Iteration and Update Mode

### Prompt change
**Added to CLAUDE.md before Step 0:**
```
### Session start — Check for existing models (run silently)
Check if .cube.yaml files already exist in src/embeddable.com/models/ (top level only).

If models exist: list their names and ask:
"I can see you already have models for X. Do you want to update those, or build
something new?"

### Update Mode
1. Read the current file first — never edit without reading what's there
2. Make only what was asked — do not rewrite the whole file
3. Breaking changes require confirmation — removing RLS, a join, or a cube requires
   an explicit "yes" before proceeding
```

### Behavior problem being fixed
Every new conversation started from scratch. If a user wanted to add a single metric, Claude would regenerate the entire model — overwriting any manual changes and losing context about decisions already made.

### How improvement was measured
**Test:** Start a conversation with existing `.cube.yaml` files in the models directory.

| Signal | Before | After |
|--------|--------|-------|
| Opening with existing models | Proceeded as if no models existed | Listed existing models by name, asked to update or start fresh |
| "Add a metric" request | Rewrote the whole file | Read existing file first, appended only the new measure |
| Metric already present | Added a duplicate or rewrote | Correctly identified no change was needed |
| Narration after update | Full cube description repeated | Only the change narrated |

---

## Iteration 6 — Error Handling (Plain-Language Failures)

### Prompt change
**Added to CLAUDE.md:**
```
## Error Handling

If any discovery script fails, report in plain language and ask only for
information the user would know:

| Error | What to say |
|---|---|
| Connection failure | "I couldn't connect. Could you check your .env file?" |
| Empty schema | "I connected but found no tables. Could you confirm the schema name?" |

Never ask the user a technical question to recover from a script error.

If two tables could both answer the KPI, ask the user to pick:
"Both `orders` and `transactions` look like purchase data. Which one should I use?"
```

### Behavior problem being fixed
When scripts failed, Claude either exposed raw error messages from the API or asked technical questions the user couldn't answer (e.g., "What is the correct connection string?"). Ambiguous schemas caused silent guessing.

### How improvement was measured
**Test:** Three deliberate failure scenarios run live.

| Scenario | Before | After |
|----------|--------|-------|
| Invalid connection name (`fake-db`) | Raw API error or silent failure | Plain-language message, no technical question |
| Two candidate tables for same KPI | Claude picked one silently | Claude presented both, asked user to pick |
| Push without login | Raw "401 Unauthorized" from CLI | "Run `npm run embeddable:login` and try again" |

**All 3 scenarios passed.**

---

## Iteration 7 — Automatic Structural Validation

### Prompt change
**Added to CLAUDE.md Step 5:**
```
After narrating, run the validation script silently:
  npm run validate:models

- If all checks pass — add: "✅ Structural checks passed."
- If any check fails — fix the file before handing over. Do not ask the user
  whether to fix — just fix it.
- Warnings do not block handover.
```

**Also removed from CLAUDE.md:**
- `embeddable:build` as a quality step (wrong tool — it builds React components, not models)
- Self-scoring by the generating agent (a model cannot objectively score its own output)

### Behavior problem being fixed
Two problems:
1. No structural safety net — a model with a missing primary key or no descriptions could be handed to the user without any check
2. Self-scoring was biased — Claude would always score its own output highly, making scores meaningless

### How improvement was measured
**Test 1 — Valid models:** Run validation against reference Spotify models.
- Result: 0 failures, 1 expected warning (`duration_ms` naming)

**Test 2 — Intentional break:** Inject 6 known violations into a test model (no measures, bad name, missing descriptions, missing join sql).

| Violation | Detected |
|-----------|----------|
| No measures defined | ✅ |
| Non-snake_case cube name | ✅ |
| Missing cube description | ✅ |
| Missing dimension descriptions | ✅ |
| Join missing sql condition | ✅ |
| Exit code 1 (usable in CI) | ✅ |

**Test 3 — Agent bias removed:** Validation now runs as a separate script, independent of the generating agent. The agent cannot influence the result.

---

## Cumulative behavior change summary

| Iteration | Instruction added to CLAUDE.md | Behavior before | Behavior after |
|-----------|-------------------------------|-----------------|----------------|
| 1 | KPI-first opening + jargon ban | Opens with "which schema?" | Opens with "what do you want to see?" |
| 2 | Silent discovery + connection list | Exposed raw JSON or guessed connection | Discovery silent; numbered list for multi-connection |
| 3 | Post-generation narration | Generated files, said nothing | Structured plain-English explanation after every generation |
| 4 | Feasibility check (Step 2) | Silently generated wrong model if column missing | Named missing column, offered alternative, waited for confirmation |
| 5 | Session start + Update Mode | Regenerated whole file for any change | Detected existing models, asked to update or start fresh, surgical edits only |
| 6 | Error handling section | Raw API errors or unanswerable technical questions | Plain-language messages, no technical questions to user |
| 7 | Auto-validate + removed self-scoring | No structural check; biased self-scores | Independent validation script; fixes before handover; no self-scoring |

---

## What still needs measurement

| Item | What would measure it |
|------|----------------------|
| Partial feasibility (metric present, breakdown missing) | Test case: ask for a breakdown on a column that doesn't exist while metric does |
| Semantic similarity to hand-written models | Requires reference models in `src/embeddable.com/models/reference/` — deferred |
| Breaking change confirmation gate | Test: ask to remove RLS and verify Claude asks for explicit "yes" |
