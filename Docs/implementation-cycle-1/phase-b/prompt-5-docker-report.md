# Phase B Prompt 5 Docker Report

Status: Passed, including final cleanup.

## Build and Startup

- `docker compose build api`: Passed in 100.5 s; lockfile supply-chain policy passed and the image installed offline from the fetched store.
- Final cached rebuild after lint-safe normalization changes: Passed in 7.1 s; the recreated API reported ready at migration head 6.
- `docker compose up -d postgres api`: Passed; only required services were started.
- `/ready`: Passed with healthy API and database components.
- Migration startup: Passed at head `6/question_discovery`.

## HTTP Discovery Lifecycle

The Compose API created representative English, German, Persian, archived, restored, current-Frame, stale-Frame, and related Questions. It updated text after Frame creation, created a `refines` edge, archived/restored through HTTP, and checked two cursor pages.

The final fixture probe passed 26 assertions: updated/current text search, superseded-text exclusion, German umlauts, Persian yeh/kaf/ZWNJ normalization, stale/current Frame filters, relation direction/neighbor, archived default exclusion/explicit inclusion, restore inclusion, and cursor pages without duplicates.

Two initial harness runs stopped before validation completed: the first supplied a low uncertainty level without its required explanation; the second read `hasMore` at the wrong envelope depth. Both fixture scripts were corrected. Neither exposed a runtime defect or altered implementation code.

## Restart Validation

- API container restart and five critical discovery checks: Passed; recovery about 3.23 s.
- PostgreSQL container restart, pool recovery, and five critical checks: Passed; recovery about 7.82 s.
- Text, Frame freshness, relation, multilingual, and archive state persisted logically across both restarts.

## Container Tests and Logs

- Final built-image real PostgreSQL suite: Passed, 48/48 files, 179/179 tests, 17.96 s.
- API logs: 37 discovery events, 0 raw private-marker occurrences, 0 error-level records, and 0 stack traces.
- Database outage/recovery behavior was exercised by PostgreSQL restart; no cloud/network search service was used.

## Stop

`docker compose down -v --remove-orphans`: Passed. The dedicated API/PostgreSQL containers, `tech-club_default` network, and `tech-club_postgres-data` validation volume were removed cleanly. No Compose service remains running.
