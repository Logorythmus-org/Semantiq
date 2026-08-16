# Policy Provenance Requirements

**Project**: SemantIQ Benchmarks  
**Date**: 2026-08-01

---

## Provenance Requirements

Every policy object MUST maintain immutable `PolicyIssuer` and `PolicySource` references including SHA-256 evidence digests. Unattributed policies trigger `missing_provenance` failure reports.
