# Message Evidence Specification

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01  

---

## Message Evidence Requirements

All inter-agent messages must attach:
- `contentRef`: Content payload URI or pointer.
- `evidenceRefs`: SHA-256 evidence digests.
- `deliveryState`: (`sent`, `delivered`, `acknowledged`, `failed`, `timed_out`).
