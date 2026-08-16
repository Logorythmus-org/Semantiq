# Phase B Prompt 5 Query Plan Report

Status: Passed with one observed scale watch item.

Environment: PostgreSQL 16.14, `pg_trgm` 1.6, 10,000 Questions, 5,000 Frames, 4,999 relations. Plans used `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` after warm-up.

| Query                         | Actual time | Important plan/index result                               |
| ----------------------------- | ----------: | --------------------------------------------------------- |
| active first page             |    0.083 ms | index-only `questions_discovery_newest_idx`               |
| creator page                  |    0.040 ms | index-only `questions_discovery_creator_idx`              |
| has Frame                     |    0.074 ms | discovery plus semantic PK indexes                        |
| stale Frame                   |    0.274 ms | Question created index plus semantic PK; incremental sort |
| uncertainty                   |    0.146 ms | discovery order plus semantic PK                          |
| relation type                 |    0.247 ms | source/target bitmap indexes; no seq scan                 |
| related-to                    |    5.713 ms | both relation covering indexes plus Question seq scan     |
| rare text                     |    1.224 ms | trigram bitmap index                                      |
| common text                   |    0.060 ms | chronological index; selective GIN correctly avoided      |
| missing text                  |    0.456 ms | trigram bitmap index                                      |
| text plus relation plus count |    0.412 ms | discovery and four relation indexes; no seq scan          |
| structured Frame combination  |    0.748 ms | indexed Question/Frame nested loop                        |
| detail relation summary       |    0.057 ms | Question PK plus both relation covering indexes           |

The production query bounds candidates to `limit + 1` before its lateral relation count, so count aggregation runs only for a page. It does not issue per-item SQL.

The one-hop `related_to` plan is acceptable at the measured tier but should be rewritten or re-indexed only after a larger benchmark demonstrates need. Common-term search using the ordering index is expected because all benchmark Questions contain the common term. No planner hints or speculative JSONB GIN indexes were added.
