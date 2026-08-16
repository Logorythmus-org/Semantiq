# Phase B Prompt 3 Docker Report

## Environment

- Project: `techclub-prompt3-validation`
- PostgreSQL: `postgres:16-alpine`
- API image: `techclub-prompt3-validation-api:latest`
- Migration head: `4/question_relations`
- External graph database used: no

## Image and Suite

- Image built from the repository Dockerfile with offline frozen lockfile install.
- API and PostgreSQL health checks reached healthy.
- Full container suite: 36 files, 129 tests passed.
- Container coverage: 91.41% statements/lines, 81.14% branches, 93.72% functions.

## Lifecycle Validation

- Created three Questions and three relations.
- Exact idempotent relation replay returned the original relation.
- Reversed symmetric duplicate returned 409.
- Incoming relation filtering and two-hop traversal returned expected edges.
- Archiving an endpoint preserved existing graph visibility with archived status.
- New relation creation against the archived endpoint returned 409.
- Restoring the endpoint preserved relation rows.
- Database counts were 3 Questions, 3 relations, 3 relation-created events, 1 relation idempotency record, and 2 Question revisions.

## Restart and Recovery

- API restart preserved 3 nodes, 3 relations, and restored Question version 3.
- With PostgreSQL stopped, `/health` remained 200, `/ready` returned 503, graph reads returned 503, and the API process stayed alive.
- PostgreSQL restart restored `/ready` to 200 and graph reads to 3 nodes/3 relations without API restart.
- API logs contained six structured relation entries, zero tested Question-text/idempotency-key matches, and no stack trace.

## Cleanup

The dedicated validation project is removed with volumes after final reporting. Unrelated local Docker projects are not modified.
