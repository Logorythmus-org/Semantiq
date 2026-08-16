# Phase B Prompt 5 Discovery Audit

Status: Passed. Repository-wide source and documentation searches used the requested search/query/filter/feed/pagination/ranking/full-text/vector vocabulary. Generated dependencies and coverage output were excluded.

| Artifact                                  | Purpose and behavior                                                                                        | Consumers/tests                                          | Classification                |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ----------------------------- |
| `packages/questions`                      | Authoritative Prompt 1-4 Question runtime; no prior collection read side                                    | API and Question tests                                   | ADAPT                         |
| `packages/persistence`                    | PostgreSQL transactional storage, migrations, adjacency indexes                                             | local/Docker API, real DB tests                          | ADAPT                         |
| `services/api`                            | Existing snake/camel compatibility, envelopes, stable errors                                                | API tests                                                | ADAPT                         |
| `packages/shared` Page/PageRequest        | Page-number model, default 25, max 100, optional total                                                      | generic foundation repository                            | KEEP, not reuse for discovery |
| `packages/question-network`               | In-memory historical Question model; substring title/summary/tag search and insertion-order recommendations | no authoritative runtime consumer; separate legacy model | DEPRECATE                     |
| `packages/search`                         | Re-export facade for core SearchIndex and graph SearchResult                                                | no Question Runtime consumer                             | KEEP as generic scaffold      |
| `services/search`                         | Metadata-only `GET /search` service scaffold; claims future full-text/vector/federated adapters             | no implementation or database                            | DEFER_TO_FUTURE_SEARCH        |
| `packages/core` SearchIndex               | Generic port only                                                                                           | package facade                                           | KEEP                          |
| `packages/graph-runtime` SearchResult     | Knowledge-graph runtime search result, not Question transaction state                                       | graph package tests                                      | DEFER_TO_FUTURE_SEARCH        |
| `packages/sprint1-runtime` route metadata | historical service inventory                                                                                | scaffold tests                                           | KEEP                          |
| config embedding settings                 | optional local AI configuration, disabled in active profile                                                 | config tests                                             | DEFER_TO_SEMANTIQ             |
| compute/data vector vocabulary            | capability enums only                                                                                       | unrelated packages                                       | DEFER_TO_FUTURE_SEARCH        |

## Findings

No existing operational Question discovery repository, FTS table, tsvector, trigram index, search worker, external engine, topic/tag/category model compatible with the active aggregate, or performance baseline existed. The legacy question-network model conflicts in identity, lifecycle, text shape, relations, quality fields, and persistence; wrapping it would duplicate truth and import recommendation scope.

The shared page-number primitive remains useful for stable bounded administrative lists but would require offset scans and totals for this mutable feed. It was not modified. Prompt 5 centralizes its new query validation, sort list, cursor, normalization, and read models within the authoritative Question package.

## Migration Risk

The only schema risks were extension availability, generated-column backfill cost, GIN build/write cost, and Frame-version backfill. PostgreSQL 16-alpine supplied `pg_trgm`; an isolated head-5 upgrade preserved Questions, revisions, relations, semantic current rows/revisions, outbox, and idempotency data.
