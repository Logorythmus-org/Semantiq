# Evidence Reference Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Evidence Checksum Requirements

All evidence references must include:

- `uri`: Target resource URI (e.g. `file:///tmp/out.log`).
- `algorithm`: `sha256`.
- `hash`: Hexadecimal SHA-256 digest of original evidence buffer.
