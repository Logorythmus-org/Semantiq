# Phase B Prompt 5 Index Review

Status: Passed on PostgreSQL 16.14 with a 10,000-Question fixture (5,000 Frames, 4,999 relations).

## Existing Indexes Reused

- primary/unique keys for Questions, semantic structures/revisions, relations, revisions, outbox, and idempotency
- `questions_created_at_idx`
- `question_relations_source_idx`, `question_relations_target_idx`, `question_relations_type_idx`

## Added in Migration 6

| Index                                       | Purpose                                   | Size at fixture |
| ------------------------------------------- | ----------------------------------------- | --------------: |
| `questions_discovery_newest_idx`            | status plus default keyset order          |        1,192 kB |
| `questions_discovery_updated_idx`           | status plus recently-updated keyset order |        1,192 kB |
| `questions_discovery_creator_idx`           | creator/status/keyset filter              |          960 kB |
| `questions_search_trigram_idx`              | normalized substring search               |        6,232 kB |
| `question_semantic_uncertainty_level_idx`   | exact declared level                      |           48 kB |
| `question_relations_source_type_target_idx` | outgoing type/neighbor lookup             |          352 kB |
| `question_relations_target_type_source_idx` | incoming type/neighbor lookup             |          352 kB |

Table totals at the same fixture were Questions 13 MB, semantic structures 3,632 kB, and relations 3,576 kB.

## Plan Findings

Default listing, creator, Frame existence, relation type, rare/missing trigram search, combined relation search, and detail relation counts used indexes. Common text search intentionally favored the chronological index because nearly every row matched. `related_to` used both relation covering indexes but PostgreSQL scanned 10,000 Question rows, completing in 5.713 ms; this is the principal plan to revisit at larger cardinality.

## Cost Decision

The trigram index is the largest new structure and adds create/update write amplification, but it removes rare/no-result substring scans and requires no synchronization worker. JSONB assumptions/unknowns received no speculative GIN indexes because measured p95 remained below 3.5 ms at 10,000 rows. New indexes require a larger-data plan regression before addition.
