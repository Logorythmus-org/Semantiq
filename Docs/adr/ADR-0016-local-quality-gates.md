# ADR-0016: Local Quality Gates

`pnpm verify` is the single local entry point. It runs config, format, lint, typecheck, tests, integration, smoke, and Compose syntax in order, writes a JSON summary, and returns non-zero on blocking stage failure. Docker runtime is opt-in via `VERIFY_DOCKER=1`.
