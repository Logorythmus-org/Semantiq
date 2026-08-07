# Independent Replication Guide

**Version**: 1.0.0  
**Date**: 2026-08-07  

---

## How to Reproduce SemantIQ Results Externally

1. Clone candidate repository.
2. Install dependencies via `pnpm install --frozen-lockfile`.
3. Execute local runner: `semantiq benchmark`.
4. Compare `CHECKSUMS.sha256` and raw evidence outputs.
5. Log replication results in `ReplicationRecord`.
