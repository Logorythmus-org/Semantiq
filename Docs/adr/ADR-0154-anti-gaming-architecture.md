# ADR-0154: SemantIQ Anti-Gaming, Anti-Memorization, and Authenticity Architecture

**Status**: Accepted  
**Date**: 2026-08-15

---

## Context

As frontier AI models are continuously trained on open-source code and public benchmarks, evaluations face risks of scenario memorization (emitting final code in step 1 without reading repository context), suspicious behavioral shortcuts (submitting code without executing local test suites), pattern-match evaluator exploitation, provider-specific overfitting, and assertion tampering.

To preserve the scientific integrity of benchmark leaderboards, SemantIQ requires an automated Anti-Gaming and Authenticity Architecture.

---

## Decision

1. **Six-Vector Gaming Anomaly Detection**:
   - `MEMORIZATION_INSTANT_SOLVE`: Multi-step scenario solved instantly with 0 exploratory reads.
   - `SHORTCUT_UNVERIFIED_MUTATION`: Code modified with 0 verification/test executions.
   - `PATTERN_MATCH_EXPLOITATION`: Output matches regex targets without generating solution logic.
   - `ENVIRONMENT_OVERFITTING`: Overfitting to provider-specific leaked hostnames/env vars.
   - `ASSERTION_TAMPERING_ATTEMPT`: Probing or attempting to overwrite `/eval` test runners.
   - `SYNTACTIC_COPY_PASTE`: Submitting static benchmark solutions without intermediate reasoning.
2. **Authenticity Metrics**:
   - Compute Gaming Risk Score ($GRS \in [0, 1]$) and Gaming Authenticity Index ($GAI = 1 - GRS$).
3. **Four Authenticity Badges**:
   - `AUTHENTIC_REASONED` ($GRS < 0.15$)
   - `SUSPICIOUS_SHORTCUTS` ($0.15 \le GRS < 0.40$)
   - `PROBABLE_MEMORIZATION` ($0.40 \le GRS < 0.70$)
   - `CONFIRMED_GAMING` ($GRS \ge 0.70$ or critical tampering)
4. **Anti-Gaming Engine**: Implement `AntiGamingEngine` to analyze behavioral trace event sequences and issue signed `AntiGamingScorecard` records (`auditorSignatureHex`).
5. **Observable Behavioral Grounding**: Invariant: Anti-gaming heuristics evaluate observable external actions and command parameters without speculating on internal chain-of-thought tokens.

---

## Consequences

- Protects benchmark leaderboards from contaminated or memorized models masquerading as superior problem-solvers.
- Rewards genuine multi-step exploratory reasoning and verification practices.
- Cryptographically verifiable authenticity badges accompany all published benchmark reports.
