# Local Commands

Run from repository root: `C:\Users\Kaveh\Desktop\Tech-Club`.

| Purpose                           | Command                                                                                         | Status in Prompt 2                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Install                           | `pnpm install --frozen-lockfile`                                                                | Passed                                           |
| Configure                         | Copy `.env.example` to `.env` only for local use; never commit `.env`                           | Documented                                       |
| Health check                      | `pnpm health`                                                                                   | Passed                                           |
| Lint                              | `pnpm lint`                                                                                     | Passed with 2 warnings                           |
| Format check                      | `pnpm format:check`                                                                             | Passed                                           |
| Type check                        | `pnpm typecheck`                                                                                | Passed                                           |
| Unit tests                        | `pnpm test:unit`                                                                                | Equivalent to full Vitest suite in this baseline |
| Integration tests                 | `pnpm test:integration`                                                                         | Passed                                           |
| Smoke tests                       | `pnpm test:smoke`                                                                               | Passed                                           |
| Full tests                        | `pnpm test`                                                                                     | Passed                                           |
| Build                             | `pnpm build`                                                                                    | Passed; scripts are still scaffolds              |
| Docker config                     | `docker compose config --quiet`                                                                 | Passed                                           |
| Docker build                      | `docker build --pull=false -t tech-club-prompt2:local .`                                        | Failed because Docker daemon is not running      |
| Docker start                      | `docker compose up -d`                                                                          | Not executed; daemon unavailable                 |
| Docker status                     | `docker compose ps`                                                                             | Not executed; daemon unavailable                 |
| Docker logs                       | `docker compose logs`                                                                           | Not executed; daemon unavailable                 |
| Docker stop                       | `docker compose down`                                                                           | Not executed; daemon unavailable                 |
| Cleanup generated local artifacts | Remove `.turbo`, `**/.turbo`, logs, coverage, build outputs after confirming they are generated | Documented only                                  |

Known command notes:

- `pnpm build` currently proves package script execution, not deployable backend services.
- Docker runtime commands require Docker Desktop/Linux engine to be running.
- `pnpm format:check` is intentionally scoped to the normalized cleanup surface to avoid broad formatting churn across historical docs and scaffolds.
