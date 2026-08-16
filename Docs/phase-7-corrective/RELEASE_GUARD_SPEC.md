# Release Guard Specification

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Date**: 2026-08-01

---

## Release Guard System Architecture

The Release Guard system (`scripts/release-guard.mjs`) evaluates candidate publish requests against `config/release-freeze.json`.

```text
Publish Request -> Check config/release-freeze.json
                   ├─ releaseFreezeActive == true? -> REJECT
                   ├─ CWD contains Tech Club internal packages? -> REJECT
                   └─ Missing Phase 11 & Phase 12 Seals? -> REJECT
```

---

## Test Verification

Verified by `tests/unit/release-guard.test.ts` (100% pass).
