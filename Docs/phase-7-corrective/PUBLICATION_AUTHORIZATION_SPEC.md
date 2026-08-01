# Publication Authorization Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Machine-Readable Authorization Contract

Authorization requires an explicit JSON manifest at `Docs/phase-12/PHASE_12_PUBLICATION_AUTHORIZATION.json` with the following structure:

```json
{
  "status": "APPROVED",
  "phase": "Phase 12",
  "candidateChecksum": "sha256:...",
  "approvedDestination": "https://github.com/Semant-iq/Semantiq.git",
  "authorizationDate": "2026-08-01"
}
```
