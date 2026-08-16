# Phase B Prompt 2 Docker Report

## Environment

- Docker Engine 29.3.1, Linux containers.
- Isolated Compose project: `techclub-prompt2-validation`.
- Isolated volume: `techclub-prompt2-validation_postgres-data`.
- Unrelated `startup-os-*` containers were not modified.

## Results

| Stage                                               | Result                                                                         |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| Compose config                                      | Passed                                                                         |
| API image build                                     | Passed; first dependency-populating build 139.7s, optimized fetch build 134.3s |
| PostgreSQL health and migration 3                   | Passed                                                                         |
| API readiness/query health                          | Passed                                                                         |
| Create/update/archive/blocked-update/restore/update | Passed, final version 5                                                        |
| Revision order/types                                | Passed: versions 2,3,4,5; updated,archived,restored,updated                    |
| Outbox inspection                                   | Passed: created 1, updated 2, archived 1, restored 1                           |
| Backend restart persistence                         | Passed: version 5 and four revisions                                           |
| Database stop behavior                              | Passed after fix: API stayed alive, readiness 503                              |
| Database restart recovery                           | Passed without API restart: readiness 200, version 5/four revisions            |
| Sensitive text log scan                             | Passed: no lifecycle text match                                                |
| Unit/contract in image                              | Passed: 73                                                                     |
| Database integration in image                       | Passed: 8                                                                      |
| API in image                                        | Passed: 5                                                                      |
| Security in image                                   | Passed: 6                                                                      |

The final cached image rebuild completed in 10.3 seconds. The complete real coverage suite passed inside that image: 106 tests across 30 files with 90.92% statements/lines.

The first database-restart attempt exposed an unhandled idle `pg.Pool` error that terminated the API. `createPostgresPool` now installs a code-only error listener and server bootstraps apply configured connection/statement timeouts. The mandatory restart flow passed after this fix. Full in-image verification also exposed missing root/tooling build context and a null-unsafe optional Docker CLI check; both were fixed before the final 106-test pass.

Validation resources were removed with `docker compose -p techclub-prompt2-validation down -v`. Final checks found no matching container or volume; unrelated `startup-os-*` containers remained running.
