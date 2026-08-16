# Prohibited Release Paths Specification

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Date**: 2026-08-01

---

## Prohibited Release Operations

```text
[PROHIBITED]: git push origin main (from parent workspace root)
[PROHIBITED]: git push origin --tags (from parent workspace root)
[PROHIBITED]: pnpm publish (from parent workspace root)
[PROHIBITED]: gh release create (from parent workspace root)
```

---

## Quarantined Legacy Guidance

> [!WARNING]
> **Historical Evidence Only**: Legacy guides instructing direct git push from workspace root (`Docs/PUBLIC_ALPHA_PUBLICATION.md`, `Docs/LIVE_PUSH_REPORT.md`) are quarantined as incident evidence and must NOT be followed.
