# Dangerous Publication Artifacts Classification

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Date**: 2026-08-01  

---

## Artifact Risk Audit

1. **Root Remote `origin -> https://github.com/Semant-iq/Semantiq.git`**:
   - **Classification**: `DANGEROUS_WORKSPACE_PUBLICATION`
   - **Risk**: Pushing from parent workspace root exposes non-SemantIQ monorepo code.
   - **Resolution**: Quarantined and blocked by `config/release-freeze.json` and release guard script.

2. **Root `package.json` Release Flags**:
   - **Classification**: `AMBIGUOUS`
   - **Risk**: Package version matches `0.1.0-alpha.1` but root contains Tech Club dependencies.
   - **Resolution**: Kept for workspace build, but prohibited from direct publication.
