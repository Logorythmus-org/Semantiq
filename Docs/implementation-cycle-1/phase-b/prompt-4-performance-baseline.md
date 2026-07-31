# Prompt 4 Performance Baseline

## Guard

The shared benchmark still refuses destructive reset unless `QUESTION_BENCHMARK_ALLOW_RESET=1` is set. Measurements below are one local Windows/Docker PostgreSQL run and are regression signals, not service-level objectives.

## Semantic Measurements

| Operation                                    | Milliseconds |
| -------------------------------------------- | ------------ |
| Semantic create transaction                  | 12.5732      |
| Semantic update + revision + outbox + commit | 11.1550      |
| Semantic current read                        | 4.0727       |
| Semantic one-revision history                | 5.1973       |
| Semantic create API                          | 13.6302      |
| Semantic update API                          | 13.7469      |
| Semantic current-read API                    | 5.8905       |
| Semantic history API                         | 9.3106       |

Expected API statuses were `201`, `200`, `200`, and `200` respectively.

## Existing Runtime Signals

The same run kept Question update/archive/restore transactions below 8.4 ms, 100-revision history near 6.7 ms, relation creation near 10.4 ms, 100-edge relation listing near 4.8 ms, and a 100-node depth-1 graph near 7.4 ms. No regression threshold failed.

## Follow-up

Prompt 5 must measure actual discovery/query patterns before adding JSONB indexes. This baseline does not justify a GIN index, cache, search engine, vector store, or denormalized projection.
