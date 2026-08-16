# ADR-0145: Long-Horizon Agent Testing and Multi-Step Autonomous Evaluation Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Most AI agent benchmarks evaluate micro-tasks lasting only 1 to 5 steps. Real-world autonomous operations (building end-to-end applications, complex multi-repo refactoring, autonomous security auditing) require executing reliably across extended horizons of 50 to 500+ sequential steps with multi-phase milestones, compounded error recoveries, state coherence, and budget constraints.

To evaluate agent performance at realistic autonomous scale, SemantIQ requires a standardized Long-Horizon Agent Testing Architecture.

---

## Decision

1. **6-Phase Milestone Progression**: Standardize long-horizon scenario phases: `DISCOVERY_AND_RECON`, `ARCHITECTURAL_PLANNING`, `SCAFFOLD_AND_BOOTSTRAP`, `INCREMENTAL_IMPLEMENTATION`, `INTEGRATION_AND_TESTING`, and `VERIFICATION_AND_FINALIZE`.
2. **Long-Horizon Testing Engine**: Implement `LongHorizonTestingEngine` to validate multi-phase milestone budgets (`planScenario`) and evaluate extended execution trajectories (`evaluateLongHorizonTrajectory`).
3. **Multi-Dimensional Metrics**: Calculate formal quantitative metrics:
   - Milestone Completion Rate ($MCR$)
   - Goal Convergence Score ($GCS$)
   - Memory Coherence Score ($MCS$)
   - Budget Efficiency Score ($BES$)
   - Long-Horizon Resilience Index ($LHRI = 0.45 MCR + 0.25 GCS + 0.15 MCS + 0.15 BES$)
4. **Certification Grading**: Classify agent capabilities across 4 standardized tiers (`GRADE_LH1_AUTONOMOUS_SCALE` to `GRADE_LH4_HORIZON_COLLAPSED`).
5. **Observable Behavioral Grounding**: Invariant: All evaluations reflect observable emitted trace events across the canonical chain without speculative claims on internal cognition.
6. **Cryptographic Sealing**: Sign long-horizon evaluation reports with `reportSignatureHex`.

---

## Consequences

- Evaluators can certify agents for long-running, mission-critical autonomous workloads.
- Benchmarks expose mid-horizon drift, memory amnesia, and frustration loops that are invisible in short benchmarks.
- Replaces subjective qualitative claims with reproducible milestone completion metrics.
