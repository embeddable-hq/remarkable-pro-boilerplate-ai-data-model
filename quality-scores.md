# Quality Scores — Run 04

**Date:** 2026-03-18
**Connection:** `default` (Heroku Postgres)
**Schema:** `bean_bags`
**Models generated:** `src/embeddable.com/models/` (transactions, products, customers)

---

## Scores

| Check | Score | Notes |
|---|---|---|
| Syntax (build) | ✅ PASS | Zero errors, zero warnings, 0 fix iterations |
| Syntax (push) | ⚠️ NOT TESTED | Requires `npm run embeddable:login` |
| Completeness | ✅ PASS | All 3 cubes have measures or dimensions, time dimension where applicable, descriptions on all members |
| KPI coverage | ✅ 1/1 | "Most popular products by region" — `transactions.transaction_count` by `products.name` + `customers.country` |
| Join correctness | ✅ PASS | `transactions → products` (many_to_one), `transactions → customers` (many_to_one). Primary keys on both joined cubes. |
| RLS | ✅ PASS | `WHERE customer_id = '{COMPILE_CONTEXT.securityContext.user_id}'` on `transactions` |
| Naming clarity | 5/5 | All plain English. Internal IDs and email excluded and narrated. |
| Reference similarity | ⏭️ NOT TESTED | No reference models at `src/embeddable.com/models/reference/bean_bags/` |

---

## What was built well
- Correct join chain: `transactions → products` and `transactions → customers`
- Primary keys declared on all joined cubes — zero compile errors
- RLS applied to the right cube
- Excluded columns narrated with reasons (email = PII, IDs = no business meaning)
- `price_usd` kept available but not promoted as a metric — correct for the stated KPI
- Zero syntax errors, 0 fix iterations

## What needs improvement
- Reference models for `bean_bags` not yet added — add to `src/embeddable.com/models/reference/bean_bags/`
- Live query execution not tested (requires login)

---

## Run history
| Run | Date | Schema | Syntax | KPI | Notes |
|---|---|---|---|---|---|
| 01 | 2026-03-18 | spotify | ✅ | 3/3 | Reference models are placeholders |
| 02 | 2026-03-18 | bean_bags | ✅ | 1/1 | No reference models |
| 03 | 2026-03-18 | bean_bags | ✅ | 1/1 | No reference models |
| 04 | 2026-03-18 | bean_bags | ✅ | 1/1 | No reference models |
