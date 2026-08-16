# Independent CLI Specification (Prompt 11.5)

**Project**: SemantIQ Benchmarks  
**Phase**: Phase 11.5  
**Date**: 2026-08-03

---

## CLI Specification

Entry point: `packages/semantiq/src/cli.ts` → `SemantIQCliEngine`

Supported commands: `doctor`, `smoke`, `benchmark`, `inspect`, `replay`, `validate`, `version`, `help`

No Tech Club parent bootstrap logic, service registry, or identity provider required.
