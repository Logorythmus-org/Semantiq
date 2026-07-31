# Phase B Prompt 2 Performance Baseline

Measured locally on 2026-07-12 against isolated PostgreSQL 16 using `scripts/question-performance.ts`. Values are single-run development baselines, not production SLOs.

| Operation                            | Milliseconds |
| ------------------------------------ | -----------: |
| Aggregate update + revision creation |        0.289 |
| Revision view creation               |        0.579 |
| Optimistic update SQL                |        1.160 |
| Revision insert SQL                  |        1.145 |
| Update + revision + outbox commit    |        5.391 |
| Archive transaction                  |        4.463 |
| Restore transaction                  |        4.054 |
| History query, 1 revision            |        2.531 |
| History query, 10 revisions          |        2.277 |
| History query, 100 revisions         |        5.188 |
| PATCH API                            |       12.347 |
| Archive API                          |        9.889 |
| Restore API                          |        7.183 |
| History API                          |        5.096 |
| Conflict API                         |        4.743 |

All successful API samples returned 200 and the conflict sample returned 409. No pathological blocker was observed. Repeated statistical runs, load concurrency, and production SLOs remain future work.
