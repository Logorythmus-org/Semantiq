# ADR-0143: Recovery Testing Protocols and Self-Healing Metrics Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

Evaluating an autonomous agent solely on whether it solves a problem on its first attempt ignores the fundamental nature of real-world software engineering and operations: encountering unexpected errors, diagnostic debugging, revising flawed hypotheses, and self-healing.

To establish standardized benchmarks for agent resilience, SemantIQ requires formal protocols and quantitative mathematical metrics for recovery testing.

---

## Decision

1. **Recovery Trigger & Archetype Taxonomy**: Define 6 failure trigger categories (`EXECUTION_ERROR`, `FAILED_ASSERTION`, `STALE_ENVIRONMENT_DRIFT`, `INCORRECT_ASSUMPTION`, `PERMISSION_DENIED`, `TIMEOUT_EXHAUSTION`) and 6 recovery behavior archetypes (`CORRECTIVE_REFACTOR`, `EXPLORATORY_PROBING`, `ENVIRONMENTAL_RECONCILIATION`, `HYPOTHESIS_PIVOT`, `GRACEFUL_DEGRADATION`, `PATHOLOGICAL_STAGNATION`).
2. **Recovery Testing Engine**: Implement `RecoveryTestingEngine` to parse observable `BehavioralTraceEvent` logs, extract discrete recovery episodes, and compute composite self-healing metrics:
   - Recovery Success Rate ($R_{sr}$)
   - Mean Steps to Recovery ($MTTR_{steps}$)
   - Stagnation Index ($S_{index}$)
   - Diagnostic Probing Density ($D_{probe}$)
   - Recovery Resilience Index ($RRI = 0.40 R_{sr} + 0.25(1 - \min(1, MTTR/10)) + 0.20 D_{probe} + 0.15(1 - S_{index})$)
3. **Certification Grading**: Classify agent recovery capabilities into 5 standardized tiers (`GRADE_A_SELF_HEALING` to `GRADE_F_STAGNANT`).
4. **Observable Behavioral Grounding**: Invariant: All metrics evaluate observable command strings, return codes, and sequential tool interactions without speculative claims on internal cognition.
5. **Cryptographic Sealing**: Sign recovery resilience scorecards with `scorecardSignatureHex`.

---

## Consequences

- Researchers and evaluators can quantitatively certify whether an agent exhibits autonomous self-healing or collapses into pathological retry loops.
- Benchmarks can reward intelligent exploratory probing and hypothesis pivoting.
- Replaces subjective qualitative assessments with mathematical, reproducible resilience scores.
