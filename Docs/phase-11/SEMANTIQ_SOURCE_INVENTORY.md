# SemantIQ Source Inventory Specification (Prompt 11.1)

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Phase**: Phase 11.1 — SemantIQ Source Inventory Freeze  
**Date**: 2026-08-03  
**Inventory Verdict**: `SEMANTIQ SOURCE INVENTORY FROZEN`  

---

## 1. Inventory Path Classification Scheme

- `PUBLIC_CORE`: Core TypeScript domain models and engines (`packages/semantiq/src/`).
- `PUBLIC_OPTIONAL_ADAPTER`: Optional external platform adapters.
- `PUBLIC_TEST`: Product unit & contract test suites (`tests/unit/`, `tests/contracts/`).
- `PUBLIC_DOCUMENTATION`: Active product specifications & phase docs (`Docs/`).
- `PUBLIC_EXAMPLE`: Example applications (`examples/`).
- `PUBLIC_DATASET`: Machine-readable specifications (`products/semantiq/specs/`).
- `PUBLIC_TOOLING`: Boundary validators and clean-room scripts (`scripts/`).
- `SHARED_BUT_EXTRACTABLE`: Reusable monorepo primitives.
- `PARENT_ONLY`: Non-product parent workspace packages (`packages/sprint1-runtime`, etc.).
- `FORBIDDEN_IN_RELEASE`: Credentials, secrets, and private environment files.
- `UNRESOLVED`: Unclassified paths requiring manual audit.
