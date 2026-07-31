# Prompt 2 Performance Baseline

Measured on 2026-07-10 from `C:\Users\Kaveh\Desktop\Tech-Club` using Windows PowerShell.

| Measurement                          | Command                                                  | Result                               | Duration |
| ------------------------------------ | -------------------------------------------------------- | ------------------------------------ | -------: |
| Warm dependency verification         | `pnpm install --frozen-lockfile`                         | Passed                               |  1087 ms |
| Repository health startup            | `pnpm health`                                            | Passed                               |  1423 ms |
| Lint                                 | `pnpm lint`                                              | Passed with 2 warnings               |  7737 ms |
| Format check                         | `pnpm format:check`                                      | Passed after script scope correction | ~1800 ms |
| Type check                           | `pnpm typecheck`                                         | Passed                               |  3130 ms |
| Full Vitest suite                    | `pnpm test`                                              | Passed: 19 files, 53 tests           |  3339 ms |
| Integration test discovery/execution | `pnpm test:integration`                                  | Passed: 1 file, 1 test               |  2048 ms |
| Smoke test discovery/execution       | `pnpm test:smoke`                                        | Passed: 1 file, 1 test               |  2503 ms |
| Build script execution               | `pnpm build`                                             | Passed; scaffold build scripts only  |  1818 ms |
| Docker Compose syntax                | `docker compose config --quiet`                          | Passed                               |   468 ms |
| Docker image build                   | `docker build --pull=false -t tech-club-prompt2:local .` | Failed; Docker daemon unavailable    |   437 ms |

Not measured:

- Clean dependency installation time. Removing `node_modules` would be destructive local state churn and was not needed for this sprint.
- Docker warm-start time, service memory usage, container restart behavior, and database migration duration. Docker runtime was unavailable.
- Idle backend memory usage. No real backend service process exists yet.
