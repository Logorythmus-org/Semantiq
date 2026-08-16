# Independent Configuration System (Prompt 11.5)

**Project**: SemantIQ Benchmarks  
**Phase**: Phase 11.5 — Independent Configuration and CLI  
**Date**: 2026-08-03

---

## Configuration Precedence (Deterministic)

1. **CLI argument overrides** (highest priority)
2. **Environment variables** (`SEMANTIQ_*` prefix)
3. **Local config file** (`semantiq.config.json`)
4. **Safe defaults** (lowest priority, offline mode, local environment, info log level)

All secrets are redacted from logs. Offline mode is the default.
