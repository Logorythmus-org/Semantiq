# Storage and Path Policy (Prompt 11.6)

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-03

---

## Path Policy Rules

- All data paths MUST be candidate-relative (e.g. `./fixtures/`, `./reports/`, `./tmp/`)
- No absolute parent workspace paths (`/home/`, `/var/lib/`, `C:\Users\...`)
- No parent cache directories (`.tech-club-cache`, `.npm-monorepo-cache`)
- Temp resources are isolated per candidate session and cleaned up on exit
