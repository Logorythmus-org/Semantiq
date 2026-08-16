# ADR-0167: Project-Wide Alignment and Documentation Rewrite (Pre-Phase-12 Release Readiness)

## Status

Accepted

## Context

Following the R01 claim-evidence audit, all project documentation, READMEs, architecture specifications, limitation registers, and roadmaps must be brought into strict alignment with empirical evidence and canonical status definitions. All absolutist or ungrounded security, cost, lock-in, and production-readiness claims must be replaced with bounded, verifiable wording.

## Decision

1. **Repository-Wide Documentation Alignment**:
   - `README.md`: Updated with canonical status separation badges (`v0.1.0-alpha.1` `PRE-RELEASE`, Sandbox `INTERNAL GATE PASSED`), 7-stage behavioral sequence, SPIS pipeline flow, and bounded key principles.
   - `Docs/ARCHITECTURE.md`: Explicitly added the `Semantiq Sandbox & Execution Provider Layer` documenting provider neutrality and SPIS contracts.
   - `Docs/ACCEPTED_LIMITATIONS_REGISTER.md` & `Docs/KNOWN_LIMITATIONS.md`: Added explicit sandbox limitations (`LIM-06` Hardware Variance, `LIM-07` Local Isolation Constraints, `LIM-08` Subsystem vs Product Gate Separation).
   - `Docs/ROADMAP.md`: Updated to register Sandbox Phase (Prompts 01–65) as `INTERNAL GATE PASSED`, with Phase 11 (Clean-Room Extraction) and Phase 12 (Public Alpha Release Authorization) explicitly labeled as planned pre-release milestones.
2. **Evidence-Bounded Language Replacement**:
   - Replaced all occurrences of "0 zero-day vulnerabilities", "100% secure", "Vendor Lock-In Risk: 0.0%", "universal $0.00 cost", and "production-ready" across specs, reports, and code with empirical bounded phrases.
3. **Canonical Invariant Enforced**:
   - _A subsystem PASS never authorizes product release._ Subsystem status is `INTERNAL GATE PASSED`; product status is `PRE-RELEASE / PUBLIC ALPHA NOT YET AUTHORIZED`.

## Consequences

- Full consistency between code, schemas, automated tests, specifications, and public documentation.
- Zero ungrounded claims remain in the repository.
- Baseline is sealed for Phase 11 clean-room distribution package verification and Phase 12 release freeze authorization.
