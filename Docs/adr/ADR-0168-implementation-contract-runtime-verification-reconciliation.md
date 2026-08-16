# ADR-0168: Implementation Contract Runtime Verification Reconciliation (Pre-Phase-12 Release Readiness)

## Status

Accepted

## Context

Prior to Phase 12 release activities, all capabilities across SemantIQ must be classified into exact empirical evidence classes (`DESIGN`, `CONTRACT/SCHEMA`, `IMPLEMENTED`, `TESTED`, `INTEGRATION TESTED`, `REAL RUNTIME VERIFIED`, `NOT VERIFIED`). Claims regarding provider neutrality, OpenSandbox optionality, local-first execution, and observable behavioral grounding must be reconciled against real code, schemas, and tests.

## Decision

1. **Empirical Capability Classification**:
   - Provider Neutrality & SPIS Standard: `INTEGRATION TESTED` (Generic SPIS adapters, router, and L1/L2/L3 conformance verified).
   - OpenSandbox Optionality: `INTEGRATION TESTED` (Replay, OCI, and Mock Reference adapters operate independently of OpenSandbox).
   - Local-First CLI Execution: `REAL RUNTIME VERIFIED` (`CliBenchmarkRunner` and `node tools/automation/cli.mjs smoke` verified locally).
   - 7-Stage Behavioral Sequence: `INTEGRATION TESTED` (Merkle trace generation and evaluation verified).
   - Independent Observer & Anti-Gaming: `TESTED` (PTY socket mirror and anomaly detection verified).
2. **Canonical Status Separation**:
   - Subsystem Status: `INTERNAL GATE PASSED`
   - Product Status: `PRE-RELEASE / PUBLIC ALPHA NOT YET AUTHORIZED`
   - Invariant: _A subsystem PASS never authorizes product release._
3. **Decoupled Execution Architecture**:
   - SemantIQ Core owns the benchmark contracts and behavioral observation protocol; runtime implementations belong to external replaceable execution providers.

## Consequences

- Every claim in public documentation maps directly to empirical code and test evidence.
- Zero mandatory vendor lock-in or proprietary runtime daemons exist in SemantIQ Core.
- System is sealed and ready for Phase 11 clean-room distribution package verification and Phase 12 release freeze authorization.
