# Phase B Prompt 3 Test Report

## Final Result

- Test files: 36 passed.
- Tests: 129 passed, 0 failed, 0 skipped with real PostgreSQL enabled.
- Prompt 3 focused tests: 23.
- Focused unit/contract tests: 12.
- Focused memory API tests: 2.
- Focused security tests: 3.
- Focused real PostgreSQL tests: 5.
- Focused real PostgreSQL API tests: 1.

## Covered Behavior

Taxonomy, directed/symmetric traversal, inverse uniqueness, self-link rejection, source ownership, missing/archived endpoints, idempotency replay/conflict, Question version isolation, pagination, graph bounds, breadth-first ordering, rollback injection, migration upgrade, database constraints, immutable rows, compact outbox events, concurrent duplicates, archive races, API aliases/envelopes, spoof resistance, and sanitized errors/logs.

## Coverage

Final Docker V8 coverage:

| Scope                | Statements/lines | Branches | Functions |
| -------------------- | ---------------- | -------- | --------- |
| All included runtime | 91.41%           | 81.14%   | 93.72%    |
| `packages/questions` | 96.35%           | 85.92%   | 98.63%    |
| Relation persistence | 82.93%           | 67.56%   | 89.47%    |
| API server           | 82.80%           | 78.30%   | 86.36%    |

## Defects Found During Verification

1. A default `both` PostgreSQL relation read supplied an unused array parameter and returned 503. Parameter construction was corrected and a real-database regression assertion was added.
2. Equal relation timestamps allowed random IDs to reorder deeper edges ahead of first-hop edges. Graph output now preserves breadth-first discovery order.
3. One historical migration test expected head 3. It was updated to assert the correct additive head 4.

All discovered defects were fixed and the full suite reran cleanly.
