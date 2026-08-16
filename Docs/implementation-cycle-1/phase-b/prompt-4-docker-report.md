# Prompt 4 Docker Validation Report

## Environment

- Compose project: `techclub-prompt4-validation`.
- PostgreSQL: `postgres:16-alpine` with a dedicated volume.
- API: freshly built repository Dockerfile image.
- Migration head: `5/question_semantic_structures`.

## Lifecycle Validation

Through `http://127.0.0.1:8080/api/v1` the run verified semantic create `201`, idempotent replay `201`, update `200`, current read `200`, creator history `200`, Question archive/restore, archived semantic read `200`, archived semantic write `409`, and a post-restore semantic update to version 3. Semantic writes left the Question at version 1 until its independent archive/restore lifecycle changed it to version 3.

## Restart and Outage

After API restart, semantic version 3 and two revisions were read from PostgreSQL. With PostgreSQL stopped, liveness remained `200/degraded`, readiness returned `503`, semantic reads returned `503`, and the API process stayed running. PostgreSQL restart restored readiness `200` and semantic version 3 without an API restart.

## Container Test Parity

The built image passed all 42 files and 152 tests against the Compose PostgreSQL service. Container coverage was 92.05% statements/lines, 81.64% branches, and 94.78% functions.

## Log Review

Five lifecycle semantic log entries contained no tested semantic content, mutation reason, idempotency key, or stack trace. The dedicated containers, network, and database volume are removed at sprint close; unrelated local containers are not modified.
