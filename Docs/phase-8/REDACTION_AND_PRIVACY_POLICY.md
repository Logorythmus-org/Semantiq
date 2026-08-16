# Redaction and Privacy Policy

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Privacy Boundary

- **No Private CoT**: Model internal chain-of-thought is not recorded or stored.
- **Redaction Traceability**: `redactionMeta` records whether fields were redacted and the governing policy rule.
- **Secret Redaction**: GitHub PATs, JWT tokens, and sensitive strings are automatically replaced with `[REDACTED_*]` tags.
