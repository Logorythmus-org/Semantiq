# Phase B Prompt 5 Performance Baseline

Status: Passed. This is a local engineering baseline, not a production SLA.

Environment: PostgreSQL 16.14 in Docker on the local workstation, Node 22, one process, warm-up calls, page size 20, deterministic fixtures. Dataset tiers were 100 (10 iterations), 1,000 (10), and 10,000 (20). Every measurement recorded zero errors.

## 10,000-Question Tier

| Operation              |   Median |      p95 |
| ---------------------- | -------: | -------: |
| exact by ID            | 1.323 ms | 1.691 ms |
| first page             | 2.174 ms | 2.646 ms |
| middle bounded page    | 2.186 ms | 2.655 ms |
| archived filter        | 2.336 ms | 3.150 ms |
| creator filter         | 2.293 ms | 2.861 ms |
| has Frame              | 2.242 ms | 2.818 ms |
| stale Frame            | 2.394 ms | 2.870 ms |
| uncertainty            | 2.416 ms | 2.830 ms |
| relation type          | 2.916 ms | 3.893 ms |
| common search          | 2.092 ms | 2.736 ms |
| rare search            | 4.521 ms | 5.936 ms |
| no-result search       | 4.559 ms | 6.436 ms |
| Persian search         | 2.231 ms | 3.305 ms |
| German search          | 2.257 ms | 3.088 ms |
| text plus Frame        | 2.195 ms | 2.885 ms |
| text plus relation     | 2.776 ms | 3.441 ms |
| structured combination | 2.486 ms | 2.773 ms |

At 100 rows the slowest p95 was 4.033 ms (structured combination); at 1,000 it was 4.683 ms (text plus relation). At 10,000 the slowest p95 was 6.436 ms (no-result trigram search). Exact/list medians did not degrade materially across tiers.

The benchmark destructively reseeds its target and is guarded by `QUESTION_DISCOVERY_BENCHMARK_ALLOW_RESET=1`. Results include application/repository round-trip overhead on localhost but exclude external network, concurrent load, authorization, and cold-start effects.
