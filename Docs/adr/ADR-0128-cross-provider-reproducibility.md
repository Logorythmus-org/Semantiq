# ADR-0128: Cross-Provider Reproducibility and Equivalence

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

Independent reproduction of AI agent benchmarks requires executing scenarios across different container runtimes, operating systems, and CPU architectures. Demanding exact bit-for-bit hash equality across heterogeneous systems leads to false-positive divergence alarms due to kernel timestamps, glibc versions, and architecture flags.

---

## Decision

1. **Semantic Equivalence Model**: Define `CrossProviderComparisonRequest` and `CrossProviderDivergenceReport` in `packages/sandbox-contracts/src/cross-provider.ts`.
2. **Deterministic Canonicalization**: Canonicalize output streams by masking timestamps and path variations before comparison.
3. **Divergence Classification**: Categorize divergences into `BENIGN_ENVIRONMENTAL_DRIFT`, `PERFORMANCE_VARIANCE`, or `BEHAVIORAL_DIVERGENCE`.
4. **Graduated Reproducibility Tiers**: Formally declare whether a scenario targets `HERMETIC_DETERMINISTIC`, `ISOLATED_REPRODUCIBLE`, or `BEST_EFFORT_TRANSIENT`.

---

## Consequences

- Third parties can verify benchmark results on their own hardware and cloud providers.
- Genuine model behavioral differences are cleanly isolated from host environmental drift.
- Trust in SemantIQ evaluation results is strengthened through transparent, verifiable equivalence criteria.
