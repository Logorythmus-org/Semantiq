# ADR-0166: Canonical Repository and Claim-Evidence Audit (Pre-Phase-12 Release Readiness)

## Status

Accepted

## Context

As SemantIQ prepares for Phase 12 release activities, it is critical to eliminate any ambiguity between internal subsystem test verification (e.g. the Sandbox subsystem internal gate) and whole-product release authorization. Additionally, all public claims must be audited against empirical evidence classes to prevent overclaiming or ungrounded absolutist statements.

## Decision

1. **Explicit Status Separation**:
   - Subsystem Statuses: `DESIGNED`, `IMPLEMENTED`, `INTERNAL GATE PASSED`, `EXPERIMENTAL`, `NOT VERIFIED`.
   - Product Release Statuses: `PRE-RELEASE`, `PUBLIC ALPHA NOT YET AUTHORIZED`, `AUTHORIZED`, `CONDITIONALLY AUTHORIZED`, `NOT AUTHORIZED`.
   - Invariant: _A subsystem PASS never authorizes product release._
2. **Evidence Classes**:
   All benchmark and repository claims must specify their strongest empirical evidence class:
   `DESIGN` $\rightarrow$ `IMPLEMENTED` $\rightarrow$ `TESTED` $\rightarrow$ `INTEGRATION TESTED` $\rightarrow$ `RUNTIME VERIFIED` $\rightarrow$ `REPRODUCIBLE`.
   No claim may be promoted beyond its empirical evidence class.
3. **Bounded Wording**:
   Absolutist language is strictly bounded across all documents, specs, and report generators:
   - Security: "No known critical vulnerability was identified within the executed test scope."
   - Provider Lock-In: "No mandatory provider dependency was identified."
   - Infrastructure: "SemantIQ Core requires no mandatory SemantIQ-operated hosting infrastructure."
   - Hardware Variance: "Provider/environment variance is recorded and may not be fully removable."

## Consequences

- The Sandbox subsystem is authoritatively recorded as `INTERNAL GATE PASSED`.
- The SemantIQ product is authoritatively recorded as `PRE-RELEASE / PUBLIC ALPHA NOT YET AUTHORIZED`.
- All TypeScript contracts and unit test suites compile with zero errors and pass 100%.
