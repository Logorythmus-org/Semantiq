# Prompt 6 Test Inventory

| Category                           | Observed scope                                         | Status                           |
| ---------------------------------- | ------------------------------------------------------ | -------------------------------- |
| Unit                               | config, shared, core primitives, persistence, settings | Passed                           |
| Package regression                 | existing runtime package suites                        | Passed                           |
| Integration                        | configuration startup                                  | Passed                           |
| Contract                           | shared UoW, pagination, capability, health             | Passed                           |
| Security                           | secret diagnostics, path safety, offline AI            | Passed                           |
| Smoke                              | repository health                                      | Passed                           |
| Architecture/automation/repository | existing guard suites                                  | Passed                           |
| Database/migration integration     | real PostgreSQL                                        | Not executed; Docker unavailable |
| API/e2e                            | no real API entrypoint/e2e files                       | Not applicable/deferred          |

Baseline: 24 files, 77 tests, 0 failures, 0 skips observed in the full run.
