# Phase B Prompt 3 Performance Baseline

## Environment

Local Windows host, Node.js runtime, PostgreSQL 16 Docker container, guarded isolated benchmark reset. Values are single-run development baselines, not service-level objectives.

## Relation Metrics

| Operation                    | Milliseconds |
| ---------------------------- | ------------ |
| Relation create transaction  | 7.751        |
| List limit 1                 | 3.384        |
| List limit 10                | 2.500        |
| List limit 100               | 3.002        |
| Depth-1 graph with 100 nodes | 6.906        |
| Relation create API          | 8.719        |
| Relation list API            | 5.787        |
| Graph API                    | 6.988        |

API statuses were create 201, list 200, and graph 200.

## Prompt 2 Regression Metrics

Update/revision/outbox commit was 7.424 ms; archive 5.985 ms; restore 6.227 ms; 100-revision history 7.104 ms. PATCH, archive, restore, history, and expected conflict APIs returned 200/200/200/200/409.

## Interpretation

No local performance blocker was found. The current bounds keep application-layer breadth-first traversal suitable for the Prompt 3 foundation. Production workload tests, query plans at large edge counts, and projection to specialized graph storage remain future work.
