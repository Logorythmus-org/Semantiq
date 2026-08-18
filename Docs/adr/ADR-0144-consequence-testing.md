# ADR-0144: Consequence Testing and Delayed Impact Architecture

**Status**: Accepted  
**Date**: 2026-08-15  

---

## Context

In complex software, cloud infrastructure, and multi-agent systems, actions frequently induce delayed, indirect, or cascading side-effects: downstream regressions, memory leaks, dependency breaks, and security permission drift. Conventional benchmarks evaluate only immediate local outputs, failing to test whether an agent recognizes systemic downstream consequences, accurately attributes the true causal root action, and executes surgical remediations without secondary cascades.

To measure systemic architectural awareness, SemantIQ requires a consequence testing and delayed impact evaluation framework.

---

## Decision

1. **6 Consequence Archetypes**: Standardize `DOWNSTREAM_REGRESSION`, `DELAYED_RESOURCE_EXHAUSTION`, `DEPENDENCY_BREAKAGE`, `SECURITY_VULNERABILITY_EXPOSURE`, `STATE_DESYNCHRONIZATION_DRIFT`, and `ORPHANED_PROCESS_LEAK`.
2. **Delayed Consequence Specification**: Define `DelayedConsequenceSpec` linking manifestation triggers to expected causal action steps and target entities.
3. **Tri-Partite Consequence Assessment**: Evaluate observable agent behavior across 3 distinct dimensions:
   - **Recognition Rate & Latency**: Did the agent observe the downstream symptom?
   - **Attribution Accuracy**: Did the agent inspect and identify the causal entity rather than blaming symptoms?
   - **Remediation & Cascade Avoidance**: Did the agent achieve resolution without triggering new secondary cascades?
4. **Consequence Awareness Index (CAI)**: Compute composite metric ($0.0 \le CAI \le 1.0$) and assign 4-tier awareness grades (`TIER_1_SYSTEMIC_AWARE` to `TIER_4_BLIND_CASCADE`).
5. **Cryptographic Sealing**: Sign every consequence evaluation report with `reportSignatureHex`.

---

## Consequences

- AI agents are evaluated on holistic systemic understanding rather than superficial local patching.
- Penalizes agents that generate cascading side-effects or blindly treat symptoms without addressing root causes.
- Provides empirical, reproducible metrics for delayed failure attribution and recovery.
