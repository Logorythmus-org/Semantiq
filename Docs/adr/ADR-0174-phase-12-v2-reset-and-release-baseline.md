# ADR-0174: Phase 12 v2 Reset and Release Baseline (Prompt 01)

## Status
Accepted

## Context
At the inception of Phase 12 v2, an authoritative baseline reset must inventory all implemented vs designed capabilities, establish canonical status separation, verify the behavioral observation boundaries, and confirm that all release decisions are grounded strictly in empirical repository evidence.

## Decision
1. **Canonical Baseline Established**:
   - Universal execution contracts, SPIS interoperability, 7-stage behavioral evaluation, Merkle trace immutability, independent observer, anti-gaming verifier, and offline CLI runner are certified as `IMPLEMENTED & TESTED`.
   - Advanced planetary roadmap items (Civilization OS, Planetary Mesh) are explicitly classified as `DESIGN / OUT OF SCOPE FOR ALPHA`.
2. **Canonical Status Separation Enforced**:
   - Sandbox Subsystem Status: `INTERNAL GATE PASSED`
   - SemantIQ Product Release Status: `PRE-RELEASE / PUBLIC ALPHA NOT YET AUTHORIZED`
   - Invariant: *A subsystem internal PASS never authorizes product release.*
3. **Behavioral Grounding Reaffirmed**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - SemantIQ evaluates observable behavior and physical traces only; zero claims are made regarding unobservable internal cognition.
4. **Provider Neutrality & Local-First Invariants**:
   - OpenSandbox, OCI, MicroVMs, and cloud providers remain optional and replaceable.
   - Offline local CLI execution is verified and supported.

## Consequences
- The release baseline is grounded in verified code and tests.
- Phase 12 v2 release gates proceed on an empirical foundation.
- Verdict: `PASS`.
