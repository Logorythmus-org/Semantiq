# ADR-0182: Reproducibility Replay and Determinism Gate (Prompt 09)

## Status
Accepted

## Context
Scientific benchmark evaluations must be independently reproducible and deterministic. However, physical hardware scheduling, cloud network latency, and model sampling introduce unavoidable empirical variance. SemantIQ must establish a clear reproducibility tier classification, deterministic offline trace replay, and rigorous variance decomposition.

## Decision
1. **Certified Deterministic Replay**:
   - `ReplaySandboxAdapter` re-evaluates immutable evidence packages from disk, producing identical Merkle root digests and evaluation scores.
2. **Reproducibility Tiers Established**:
   - `HERMETIC_DETERMINISTIC`: Pinned filesystem digests, zero network access, deterministic random seeds.
   - `ISOLATED_REPRODUCIBLE`: Pinned container images and resource constraints with bounded variance.
   - `BEST_EFFORT_TRANSIENT`: Cloud microVMs with host scheduling jitter.
3. **Variance Decomposition Engine**:
   - `CrossComparisonEngine` separates Provider Effect on Performance ($PEP$) and Provider Variance Sensitivity ($PVS$) to calculate $95\%$ confidence intervals and mark rankings within variance margins.
4. **Behavioral Grounding Boundary**:
   - `Context → Interpretation → Decision → Action → Result → Consequence → Recovery`.
   - Replay is evaluated on observable external traces and physical diffs only.

## Consequences
- Guarantees that published benchmark evaluations can be independently audited and replayed.
- Prevents false claims of model superiority when score differences fall within hardware variance margins.
- Verdict: `PASS`.
