# Phase A Local Runbook

Run `pnpm verify` for host validation. Start Docker Desktop before infrastructure validation. Use `docker compose -p techclub-validation up -d postgres api` for an isolated named validation project and `docker compose -p techclub-validation down -v` only for that project. Never remove development volumes or use broad prune commands.
