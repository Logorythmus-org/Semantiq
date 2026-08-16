# Prompt 7 Onboarding Validation

From the local repository, Node 22 and pnpm 11.7.0 install the frozen lockfile. `pnpm config:check`, formatting, lint, typecheck, default tests, real-PostgreSQL tests, benchmark guard, Compose config, image build, health, and readiness were validated.

Fast path: `docker compose up -d postgres api`, then `GET http://localhost:8080/ready`. Full host tests require `REAL_POSTGRES_TEST=postgresql://techclub:techclub@localhost:5432/techclub`. No cloud account or external AI provider is needed.
