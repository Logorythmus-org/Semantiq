# Question Runtime Local Runbook

Requirements: Node 22, pnpm 11.7.0, Docker. Run `pnpm config:check`, `pnpm typecheck`, and `pnpm test`. Start the authoritative stack with `docker compose up -d postgres api`; readiness is `http://localhost:8080/ready`. Full database tests use `REAL_POSTGRES_TEST=postgresql://techclub:techclub@localhost:5432/techclub pnpm test`. The destructive benchmark additionally requires its explicit reset guard.
