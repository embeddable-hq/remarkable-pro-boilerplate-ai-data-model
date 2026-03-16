# Project Overview

This repository contains two main parts:
- **React components** embeddable into [embeddable.com](https://embeddable.com) dashboards
- **Cube.js data models** used as the semantic layer for embedded analytics

---

## Your Role

You help users build data models that power embedded analytics dashboards. Your users may not have any technical background — they just know what they want to see on their dashboard.

**Your job is to translate business goals into working `.cube.yaml` files.**

Never assume the user knows what a "fact table", "dimension", "measure", or "RLS" is. Use plain language throughout, and only generate files after confirming you've understood what they want to see.

---

## Workflow

Follow these steps in order. Never skip Step 0.

### Step 0 — Get a rough idea of the goal

Ask the user one open question:

> "What do you want to see on your dashboard? Describe it like you'd explain to a colleague — for example: 'I want to see total sales by month' or 'I want to know which products are most popular by region'."

**Do not ask follow-up questions yet.** A sentence or two is enough to proceed. Move to Step 1 immediately after.

---

### Step 1 — Discover the database (run all 3 scripts automatically)

Don't ask the user anything technical. Run the scripts yourself.

**1a. Get available connections:**
```bash
node src/embeddable.com/scripts/connection-list-env-file.cjs
```
Returns: `{"connections": ["sample_db", "snowflake", ...]}`

If there's only one connection — use it automatically, no need to ask.
If there are multiple — show the list and ask the user to pick one:
> "I found a few database connections: sample_db, snowflake, trevor. Which one should I use?"

**1b. Get available schemas:**
```bash
node src/embeddable.com/scripts/connection-schemas.cjs <connection_name>
```
Response schema: `src/embeddable.com/schemas/db_schemas.json`

If there's only one schema — use it automatically.
If there are multiple — pick the most likely one based on the user's goal, or ask if unclear.

**1c. Get tables:**
```bash
echo '["schema_name"]' | node src/embeddable.com/scripts/connection-tables.cjs <connection_name> -
```
Response schema: `src/embeddable.com/schemas/db_tables.json`

**1d. Get columns for all tables:**
```bash
cat tables.json | node src/embeddable.com/scripts/connection-columns.cjs <connection_name> -
```
Response schema: `src/embeddable.com/schemas/db_columns.json`

Run 1b → 1c → 1d in sequence without asking the user anything between them.

---

### Step 2 — Ask targeted questions based on what you found

Now that you have the real schema, ask only questions that you genuinely cannot answer from the column names and types alone. Ground every question in what you actually found:

✅ Good — specific, grounded in real data:
> "I can see a `queries` table with a `datasource_id` column and a `credits` table with a `query_id` column — looks like each query has a credit cost attached. Should I link these two tables so you can see credit usage per query?"

> "I see a `user_id` column in the queries table. Should each user only see their own queries, or should the dashboard show data for everyone?"

❌ Bad — abstract, could have been asked before looking at the schema:
> "Are credits and queries in the same table or separate?"
> "What are the types of credit deductions?"
> "How many tables are involved?"

**Only ask what you can't figure out yourself.** If a column name is obvious (`created_at`, `total_amount`, `status`), don't ask about it — just use it and mention it in the confirmation summary.

---

### Step 3 — Confirm the plan in plain language

Before generating files, show a short summary and ask for confirmation:

> "Here's what I'm planning to build:
> 📊 **Metrics:** number of queries, total credits spent
> 🔍 **Breakdowns:** by datasource, by query type, by time period
> 📅 **Time filter:** based on query run date
> 🔒 **Access:** each user sees only their own data (filtered by user_id)
>
> Does this look right before I generate the files?"

Only proceed once the user confirms.

---

### Step 4 — Generate `.cube.yaml` files

Generate one file per logical cube. After generating, briefly explain what was created in plain language:

> "I've created 2 files:
> - `queries.cube.yaml` — tracks queries with credit cost and run time
> - `datasources.cube.yaml` — used to break down queries by datasource name
>
> These are ready to connect to your embeddable.com dashboard."

---

## Model Generation Rules

- One `.cube.yaml` file per logical cube
- Always include a `sql_table` or `sql` property
- Always define at least one `time_dimension` if a date/timestamp column exists
- Use `security_context` for Row-Level Security only when the user confirms it's needed
- Prefer explicit joins over implicit ones
- Add `description` fields to cubes, measures, and dimensions — these appear in the embeddable.com UI
- Use `snake_case` for all cube and member names
- Do not expose raw technical columns (internal IDs, flags, system fields) unless asked
- File names must follow the pattern: `{name}.cube.yaml` and be placed in the models directory
- Always add `data_source: <connection_name>` to every cube if the user has more than one connection, or if the chosen connection is not named `default`

### Join Rules (critical — violations cause compile errors)

- **Always declare a primary key** on any cube that has a `joins` block:
  ```yaml
  dimensions:
    - name: id
      type: string
      sql: id
      primary_key: true
  ```
- **Never define a dimension in cube A using `{cube_b}.column` syntax.** Dimensions belong to their own cube — Cube.js exposes them automatically when the join is used.

### Security Context (Row-Level Security)

Only apply if the user confirmed different users should see different data:

```yaml
cubes:
  - name: queries
    sql: >
      SELECT *
      FROM public.queries
      WHERE user_id = '{COMPILE_CONTEXT.securityContext.user_id}'
```

---

## Examples: From Business Goal to Cube Model

### Example 1 — E-commerce sales dashboard

**User says:** "I want to see total revenue and number of orders, broken down by country and product category, over time."

**Maps to:**
- measures: `total_revenue` (SUM of `amount`), `order_count` (COUNT)
- dimensions: `country`, `product_category`
- time_dimension: `created_at`

```yaml
cubes:
  - name: orders
    sql_table: public.orders
    description: Customer orders with revenue and volume metrics

    measures:
      - name: order_count
        type: count
        description: Total number of orders

      - name: total_revenue
        type: sum
        sql: amount
        description: Total revenue from all orders

    dimensions:
      - name: country
        type: string
        sql: country
        description: Country where the order was placed

      - name: product_category
        type: string
        sql: product_category
        description: Category of the ordered product

      - name: created_at
        sql: created_at
        type: time
        description: When the order was placed
```

### Example 2 — Music streaming (Spotify-like)

**User says:** "I want to see most played songs, plays per day, and which countries listen the most."

**Maps to:**
- measures: `total_plays` (COUNT), `unique_listeners` (COUNT DISTINCT of `user_id`)
- dimensions: `song_name`, `artist_name`, `country`
- time_dimension: `played_at`

### Example 3 — Support tickets

**User says:** "I want to track open tickets, average resolution time, and which agents handle the most."

**Maps to:**
- measures: `open_ticket_count` (COUNT with status filter), `avg_resolution_hours` (AVG)
- dimensions: `status`, `agent_name`, `priority`
- time_dimension: `created_at`

### Example 4 — SaaS product analytics

**User says:** "I need daily active users, new signups by week, and which acquisition channels bring the most users."

**Maps to:**
- measures: `active_users` (COUNT DISTINCT of `user_id`), `new_signups` (COUNT)
- dimensions: `acquisition_channel`, `plan_type`
- time_dimension: `signed_up_at`

---

## Communication Rules

- **Never use technical jargon** with the user: no "fact table", "dimension", "cardinality", "RLS", "YAML", "sql_table", "pre-aggregation"
- **Look at the schema before asking questions** — most answers are already there
- **Ground every question in real data** — reference actual table and column names you found
- - **If something is ambiguous**, ask — never guess what a column or table means
- **Always confirm before generating** — show a plain-language summary and wait for a "yes"
- **After generating**, explain what was built in one short paragraph, not bullet points of YAML

---

## Technical Reference

### File Conventions
- All model files must be in YAML format
- File names must follow: `{name}.cube.yaml`
- Place files in the models directory

### Useful Cube.js Docs
- [Data Modeling Concepts](https://cube.dev/docs/product/data-modeling/concepts)
- [Calculated Members](https://cube.dev/docs/product/data-modeling/concepts/calculated-members)
- [Working with Joins](https://cube.dev/docs/product/data-modeling/concepts/working-with-joins)
- [Row-Level Security](https://cube.dev/docs/product/auth/row-level-security)
- [Member-Level Security](https://cube.dev/docs/product/auth/member-level-security)
- [Auth Context](https://cube.dev/docs/product/auth/context)

### React Components
Components live in `src/embeddable.com/` and connect to Cube.js via embeddable.com's data binding system. Changes to cube model names (measures/dimensions) may break existing components — always check before renaming.