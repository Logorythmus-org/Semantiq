# ADR-0157: SemantIQ Cross-Model and Cross-Provider Fair Comparison Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

When evaluating LLMs and autonomous agents across heterogeneous execution runtimes (local Docker, Podman, Firecracker microVMs, remote cloud containers), environment variances (e.g. cold-start delays, CPU throttling, network latency, tool timeouts) act as confounding variables. Without variance decomposition and latency normalization, leaderboards risk attributing provider differences to model capability differences.

---

## Decision

1. **Provider Variance Decomposition**:
   - Computes provider mean latency, environment penalty factors ($PEP$), and tool variance scores across evaluation batches.
2. **Normalized Model Capability Scoring**:
   - Calculates isolated `normalizedScore` adjusting raw scores against provider latency baselines.
   - Computes `providerVarianceSensitivity` ($0.0 \le PVS \le 1.0$) measuring how much model performance fluctuates across providers.
   - Provides 95% confidence intervals and statistical distinction flags (`STATISTICALLY_SIGNIFICANT` vs `WITHIN_VARIANCE_MARGIN`).
3. **Cross-Comparison Engine**:
   - Implement `CrossComparisonEngine` to evaluate run matrices and issue signed `CrossModelProviderComparisonReport` records (`comparisonSignatureHex`).
4. **Observable Behavioral Grounding**: Invariant: Comparison metrics evaluate observable success rates, step counts, and duration without making claims about hidden model cognition.

---

## Consequences

- Produces fair, reproducible comparative leaderboards across heterogeneous execution providers.
- Quantifies provider sensitivity for every evaluated model family.
- Prevents provider speed/hardware advantages from distorting AI capability evaluations.
