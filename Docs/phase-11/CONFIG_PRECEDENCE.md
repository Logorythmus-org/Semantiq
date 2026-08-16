# Config Precedence (Prompt 11.5)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Deterministic Config Resolution Order

1. CLI argument `--override` flags (highest precedence)
2. `SEMANTIQ_*` environment variables
3. Local `semantiq.config.json` file
4. Built-in safe defaults (offline mode, local env, info log)
